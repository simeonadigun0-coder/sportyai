import Groq from 'groq-sdk'
import { SportyBetGame, resolveFromAvailableMarkets, getSmartReplacement } from './sportybet'

const PROXY_URL = 'https://sportybet-proxy.grooveslip.workers.dev'
const PROXY_KEY = 'grooveslip_proxy_2026'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const BSD_BASE = 'https://sports.bzzoiro.com/api'
const SOFA_BASE = 'https://api.sofascore.com/api/v1'

const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }
const sofaHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Referer': 'https://www.sofascore.com/',
}

export interface GameAnalysis extends SportyBetGame {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore: number
  confidenceScore: number
  reason: string
  formSummary: string
  keep: boolean
  dataSource: string
  replaced?: boolean
  originalPick?: string
  originalMarket?: string
  originalOdds?: number
  replacedPick?: string
  replacedMarketDesc?: string
  replacedOdds?: number
  replacementReason?: string
  needsResolution?: boolean
}

export interface SlipAnalysis {
  games: GameAnalysis[]
  removedGames: GameAnalysis[]
  keptGames: GameAnalysis[]
  originalOdds: number
  newOdds: number
  targetOdds: number
  summary: string
}

// ─── PICK → SPORTYBET IDS ──────────────────────────────────────────────────
// Key: "pick|market" both lowercased
const PICK_TO_IDS: Record<string, { marketId: string; outcomeId: string }> = {
  // 1X2
  'home|1x2':                         { marketId: '1', outcomeId: '1' },
  'draw|1x2':                         { marketId: '1', outcomeId: '2' },
  'away|1x2':                         { marketId: '1', outcomeId: '3' },
  '1|1x2':                            { marketId: '1', outcomeId: '1' },
  'x|1x2':                            { marketId: '1', outcomeId: '2' },
  '2|1x2':                            { marketId: '1', outcomeId: '3' },
  // Double Chance
  'home/draw|double chance':           { marketId: '3', outcomeId: '1' },
  'draw/away|double chance':           { marketId: '3', outcomeId: '3' },
  'home/away|double chance':           { marketId: '3', outcomeId: '2' },
  '1x|double chance':                  { marketId: '3', outcomeId: '1' },
  'x2|double chance':                  { marketId: '3', outcomeId: '3' },
  '12|double chance':                  { marketId: '3', outcomeId: '2' },
  // GG/NG
  'yes|gg/ng':                         { marketId: '5', outcomeId: '1' },
  'no|gg/ng':                          { marketId: '5', outcomeId: '2' },
  'gg|gg/ng':                          { marketId: '5', outcomeId: '1' },
  'ng|gg/ng':                          { marketId: '5', outcomeId: '2' },
  // Over/Under
  'over 0.5|over/under':               { marketId: '18', outcomeId: '12' },
  'over 1.5|over/under':               { marketId: '18', outcomeId: '12' },
  'over 2.5|over/under':               { marketId: '18', outcomeId: '12' },
  'over 3.5|over/under':               { marketId: '18', outcomeId: '12' },
  'over 4.5|over/under':               { marketId: '18', outcomeId: '12' },
  'under 0.5|over/under':              { marketId: '18', outcomeId: '13' },
  'under 1.5|over/under':              { marketId: '18', outcomeId: '13' },
  'under 2.5|over/under':              { marketId: '18', outcomeId: '13' },
  'under 3.5|over/under':              { marketId: '18', outcomeId: '13' },
  'under 4.5|over/under':              { marketId: '18', outcomeId: '13' },
  // 1X2 1UP
  'home|1x2 - 1up':                    { marketId: '60200', outcomeId: '1' },
  'away|1x2 - 1up':                    { marketId: '60200', outcomeId: '3' },
  'home|1up':                          { marketId: '60200', outcomeId: '1' },
  'away|1up':                          { marketId: '60200', outcomeId: '3' },
  // 1X2 2UP
  'home|1x2 - 2up':                    { marketId: '60100', outcomeId: '1' },
  'away|1x2 - 2up':                    { marketId: '60100', outcomeId: '3' },
  'home|2up':                          { marketId: '60100', outcomeId: '1' },
  'away|2up':                          { marketId: '60100', outcomeId: '3' },
}

// Normalize pick+market key — strips extra spaces, lowercases
function resolvePickToIds(pick: string, market: string): { marketId: string; outcomeId: string } | null {
  const key = `${pick.toLowerCase().trim()}|${market.toLowerCase().trim()}`
  if (PICK_TO_IDS[key]) return PICK_TO_IDS[key]
  // Fuzzy fallback for market name variants
  const p = pick.toLowerCase().trim()
  const m = market.toLowerCase().trim()
  if (m.includes('double chance')) {
    if (p.includes('home') && p.includes('draw')) return { marketId: '3', outcomeId: '1' }
    if (p.includes('draw') && p.includes('away')) return { marketId: '3', outcomeId: '3' }
    if (p.includes('home') && p.includes('away')) return { marketId: '3', outcomeId: '2' }
  }
  if (m.includes('over') && m.includes('under')) {
    const num = parseFloat(p.replace(/[^0-9.]/g, ''))
    if (p.startsWith('over') && !isNaN(num)) return { marketId: '18', outcomeId: '12' }
    if (p.startsWith('under') && !isNaN(num)) return { marketId: '18', outcomeId: '13' }
  }
  if (m.includes('gg') || m.includes('both teams')) {
    if (p === 'yes' || p === 'gg') return { marketId: '5', outcomeId: '1' }
    if (p === 'no' || p === 'ng') return { marketId: '5', outcomeId: '2' }
  }
  if ((m === '1x2' || m.includes('1x2')) && !m.includes('up')) {
    if (p === 'home' || p === '1') return { marketId: '1', outcomeId: '1' }
    if (p === 'draw' || p === 'x') return { marketId: '1', outcomeId: '2' }
    if (p === 'away' || p === '2') return { marketId: '1', outcomeId: '3' }
  }
  return null
}

// ─── DATA FETCHING ─────────────────────────────────────────────────────────
function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}
function teamsMatch(a: string, b: string, c: string, d: string) {
  const fw = (s: string) => normalize(s).split(' ')[0]
  return normalize(a).includes(fw(c)) && normalize(b).includes(fw(d))
}

async function getBSDData(homeTeam: string, awayTeam: string): Promise<string> {
  try {
    const yesterday = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
    const next2w = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    for (const term of [homeTeam, homeTeam.split(' ')[0], awayTeam]) {
      const res = await fetch(
        `${BSD_BASE}/events/?team=${encodeURIComponent(term)}&date_from=${yesterday}&date_to=${next2w}&limit=20`,
        { headers: bsdHeaders, signal: AbortSignal.timeout(5000) }
      )
      if (!res.ok) continue
      const data = await res.json()
      const match = (data.results || []).find((e: unknown) => {
        const ev = e as Record<string, unknown>
        return teamsMatch(ev.home_team as string || '', ev.away_team as string || '', homeTeam, awayTeam)
      })
      if (!match) continue
      const ev = match as Record<string, unknown>
      const det = await fetch(`${BSD_BASE}/events/${ev.id}/`, { headers: bsdHeaders, signal: AbortSignal.timeout(4000) })
      const event = det.ok ? await det.json() : ev
      const hf = event.home_form as Record<string, unknown> | null
      const af = event.away_form as Record<string, unknown> | null
      const h2h = event.head_to_head as Record<string, unknown> | null
      const pred = event.prediction as Record<string, unknown> | null
      const unavail = event.unavailable_players as Record<string, unknown> | null
      const parts: string[] = []
      if (hf) parts.push(`H:${hf.form_string || '?'} W${hf.wins}D${hf.draws}L${hf.losses} GF${hf.goals_scored_last_n}GA${hf.goals_conceded_last_n}`)
      if (af) parts.push(`A:${af.form_string || '?'} W${af.wins}D${af.draws}L${af.losses} GF${af.goals_scored_last_n}GA${af.goals_conceded_last_n}`)
      if (h2h) parts.push(`H2H:HW${h2h.home_wins}D${h2h.draws}AW${h2h.away_wins}`)
      if (pred) parts.push(`Pred:${pred.predicted_result} H${pred.prob_home_win}%D${pred.prob_draw}%A${pred.prob_away_win}%`)
      if (unavail) {
        const hi = (unavail.home as unknown[] || []).slice(0, 2).map((p: unknown) => (p as Record<string, unknown>).name).join(',')
        const ai = (unavail.away as unknown[] || []).slice(0, 2).map((p: unknown) => (p as Record<string, unknown>).name).join(',')
        if (hi || ai) parts.push(`Inj H:${hi || 'none'} A:${ai || 'none'}`)
      }
      return parts.join('|')
    }
  } catch { /* silent */ }
  return ''
}

async function getSofaData(homeTeam: string, awayTeam: string): Promise<string> {
  try {
    const getId = async (name: string): Promise<number | null> => {
      const res = await fetch(`${SOFA_BASE}/search/teams/${encodeURIComponent(name)}`, { headers: sofaHeaders, signal: AbortSignal.timeout(4000) })
      if (!res.ok) return null
      const teams = (await res.json()).teams || []
      const match = teams.find((t: unknown) => normalize((t as Record<string, unknown>).name as string || '').includes(normalize(name).split(' ')[0]))
      return ((match || teams[0]) as Record<string, unknown>)?.id as number || null
    }
    const getForm = async (id: number, name: string): Promise<string> => {
      const res = await fetch(`${SOFA_BASE}/team/${id}/events/last/0`, { headers: sofaHeaders, signal: AbortSignal.timeout(4000) })
      if (!res.ok) return ''
      const events = ((await res.json()).events || []).slice(-5) as unknown[]
      let w = 0, d = 0, l = 0
      events.forEach((e: unknown) => {
        const ev = e as Record<string, unknown>
        const isHome = normalize(((ev.homeTeam as Record<string, unknown>)?.name as string) || '').includes(normalize(name).split(' ')[0])
        const s = Number(isHome ? (ev.homeScore as Record<string, unknown>)?.current : (ev.awayScore as Record<string, unknown>)?.current) || 0
        const c = Number(isHome ? (ev.awayScore as Record<string, unknown>)?.current : (ev.homeScore as Record<string, unknown>)?.current) || 0
        if (s > c) w++; else if (s < c) l++; else d++
      })
      return `${name.split(' ')[0]}:W${w}D${d}L${l}`
    }
    const [hId, aId] = await Promise.all([getId(homeTeam), getId(awayTeam)])
    if (!hId && !aId) return ''
    const [hf, af] = await Promise.all([
      hId ? getForm(hId, homeTeam) : Promise.resolve(''),
      aId ? getForm(aId, awayTeam) : Promise.resolve(''),
    ])
    return [hf, af].filter(Boolean).join('|')
  } catch { return '' }
}

// ─── SAFER OPTIONS PER MARKET ──────────────────────────────────────────────
// Returns valid replacements the AI can choose from — exact strings that map to PICK_TO_IDS
function getSaferOptions(market: string, pick: string): string[] {
  const m = market.toLowerCase().trim()
  const p = pick.toLowerCase().trim()

  // Already safest — don't replace
  if (m.includes('double chance')) return []
  if (m.includes('over/under') && p === 'over 0.5') return []
  if (m.includes('over/under') && p === 'under 4.5') return []

  if (m === '1x2' || (m.includes('1x2') && !m.includes('up'))) {
    if (p === 'home' || p === '1') return ['Home/Draw|Double Chance', 'Home/Away|Double Chance']
    if (p === 'away' || p === '2') return ['Draw/Away|Double Chance', 'Home/Away|Double Chance']
    if (p === 'draw' || p === 'x') return ['Home/Draw|Double Chance', 'Draw/Away|Double Chance']
  }
  if (m.includes('over/under') && !m.includes('corner')) {
    const num = parseFloat(p.replace(/[^0-9.]/g, ''))
    if (p.startsWith('over') && !isNaN(num)) {
      const opts: string[] = []
      if (num >= 4.5) opts.push('Over 3.5|Over/Under', 'Over 2.5|Over/Under', 'Over 1.5|Over/Under')
      else if (num >= 3.5) opts.push('Over 2.5|Over/Under', 'Over 1.5|Over/Under')
      else if (num >= 2.5) opts.push('Over 1.5|Over/Under', 'Over 0.5|Over/Under')
      else if (num >= 1.5) opts.push('Over 0.5|Over/Under')
      return opts
    }
  }
  if (m.includes('gg') || m.includes('both teams')) {
    if (p === 'yes' || p === 'gg') return ['No|GG/NG', 'Home/Draw|Double Chance', 'Draw/Away|Double Chance']
  }
  if (m.includes('2up')) {
    if (p === 'home') return ['Home/Draw|Double Chance', 'Home|1X2', 'Home|1X2 - 1UP']
    if (p === 'away') return ['Draw/Away|Double Chance', 'Away|1X2', 'Away|1X2 - 1UP']
  }
  if (m.includes('1up')) {
    if (p === 'home') return ['Home/Draw|Double Chance', 'Home|1X2']
    if (p === 'away') return ['Draw/Away|Double Chance', 'Away|1X2']
  }
  return []
}

// ─── ODDS ESTIMATOR ────────────────────────────────────────────────────────
function estimateSaferOdds(originalOdds: number, newPick: string, newMarket: string): number {
  const nm = newMarket.toLowerCase()
  const np = newPick.toLowerCase()
  if (nm.includes('over/under')) {
    const num = parseFloat(np.replace(/[^0-9.]/g, ''))
    if (!isNaN(num)) {
      if (num <= 0.5) return 1.08
      if (num <= 1.5) return Math.max(1.10, parseFloat((1 + (originalOdds - 1) * 0.25).toFixed(2)))
      if (num <= 2.5) return Math.max(1.15, parseFloat((1 + (originalOdds - 1) * 0.45).toFixed(2)))
    }
  }
  if (nm.includes('double chance')) return Math.max(1.08, parseFloat((1 + (originalOdds - 1) * 0.35).toFixed(2)))
  if (nm.includes('gg')) return Math.max(1.08, parseFloat((originalOdds * 0.6).toFixed(2)))
  return Math.max(1.08, parseFloat((1 + (originalOdds - 1) * 0.45).toFixed(2)))
}

// ─── SINGLE BATCH AI CALL ──────────────────────────────────────────────────
interface AIResult {
  eventId: string
  keep: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore: number
  confidenceScore: number
  reason: string
  formSummary: string
  replacePick: string | null   // exact pick string e.g. "Home/Draw"
  replaceMarket: string | null // exact market string e.g. "Double Chance"
  replacementReason: string | null
}

async function runBatchAI(
  games: SportyBetGame[],
  dataMap: Map<string, { bsd: string; sofa: string }>,
  allowSwitching: boolean,
  targetOdds: number
): Promise<Map<string, AIResult>> {

  const resultMap = new Map<string, AIResult>()

  // Build compact game lines for prompt
  // Format: G1|eventId|Home vs Away|pick(market)@odds|STATS|SAFER_OPTIONS
  const gameLines = games.map((g, i) => {
    const d = dataMap.get(g.eventId) || { bsd: '', sofa: '' }
    const stats = [d.bsd, d.sofa].filter(Boolean).join('|') || 'NO_DATA'
    const safer = getSaferOptions(g.market, g.pick)
    const saferStr = safer.length ? safer.map(s => s.split('|')[0]).join('/') : 'NONE'
    return `G${i + 1}|${g.eventId}|${g.homeTeam} vs ${g.awayTeam}|${g.pick}(${g.market})@${g.odds}|${stats}|SAFER:${saferStr}`
  }).join('\n')

  const replaceInstruction = allowSwitching
    ? `REPLACE MODE:
- Read stats carefully for each game
- If stats STRONGLY support current pick (good form, H2H win rate, prediction matches pick) → keep it, set replacePick null
- If stats are weak, missing, or go against the pick → choose the BEST option from SAFER list based on what data suggests
- NEVER replace if pick is already safest (SAFER:NONE)
- replacePick must be EXACTLY one of the options in SAFER list (e.g. "Home/Draw", "Over 1.5", "No")
- replaceMarket must match exactly: "Double Chance", "Over/Under", "GG/NG", "1X2", "1X2 - 1UP"
- Give a specific data-driven replacementReason (mention actual stats)`
    : `REMOVE MODE: Set replacePick and replaceMarket to null for all games.`

  const prompt = `You are a sharp football betting analyst. Analyse each game using real stats.

${replaceInstruction}

RULES FOR ALL GAMES:
- confidenceScore: 40-55 if HIGH risk, 56-70 if MEDIUM, 71-85 if LOW and data supports
- reason: must reference actual stats from the data, not generic phrases
- formSummary: one key stat (e.g. "England W4D1L0 last 5, dominating")
- If NO_DATA: keep=true, riskLevel based on odds only, BUT still suggest replacement from SAFER list if one exists (SAFER is not NONE)
- Never remove a game if NO_DATA

TARGET ODDS: ${targetOdds}

GAMES:
${gameLines}

Return ONLY a valid JSON array, one object per game, same order:
[{"eventId":"ID","keep":true,"riskLevel":"LOW","riskScore":2,"confidenceScore":78,"reason":"specific stat-based reason","formSummary":"key stat","replacePick":null,"replaceMarket":null,"replacementReason":null}]`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a JSON API. Output ONLY a valid JSON array. No markdown, no explanation, no preamble.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.15,
      max_tokens: Math.min(180 * games.length, 6000),
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = clean.indexOf('[')
    const end = clean.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No JSON array in response')
    const results: AIResult[] = JSON.parse(clean.substring(start, end + 1))

    for (const r of results) {
      if (!r.eventId) continue
      resultMap.set(r.eventId, {
        ...r,
        keep: r.keep !== false,
        riskLevel: (['LOW','MEDIUM','HIGH'].includes(r.riskLevel) ? r.riskLevel : 'MEDIUM') as 'LOW'|'MEDIUM'|'HIGH',
        // Validate replacePick/replaceMarket — if not in PICK_TO_IDS, discard
        replacePick: (r.replacePick && r.replaceMarket && resolvePickToIds(r.replacePick, r.replaceMarket)) ? r.replacePick : null,
        replaceMarket: (r.replacePick && r.replaceMarket && resolvePickToIds(r.replacePick, r.replaceMarket)) ? r.replaceMarket : null,
      })
    }
  } catch (err) {
    console.error('[batchAI] failed:', err)
  }

  // Fill any missing games with code-based fallback
  for (const g of games) {
    if (!resultMap.has(g.eventId)) {
      const odds = g.odds
      const safer = getSaferOptions(g.market, g.pick)
      // Only replace via code if odds are genuinely high risk and safer options exist
      let replacePick: string | null = null
      let replaceMarket: string | null = null
      if (allowSwitching && safer.length > 0) {
        const [pick, market] = safer[0].split('|')
        if (resolvePickToIds(pick, market)) {
          replacePick = pick
          replaceMarket = market
        }
      }
      resultMap.set(g.eventId, {
        eventId: g.eventId,
        keep: true,
        riskLevel: odds >= 3.5 ? 'HIGH' : odds >= 2.0 ? 'MEDIUM' : 'LOW',
        riskScore: odds >= 3.5 ? 8 : odds >= 2.0 ? 5 : 2,
        confidenceScore: odds >= 3.5 ? 42 : odds >= 2.0 ? 58 : 74,
        reason: 'No data available — kept by default',
        formSummary: '',
        replacePick,
        replaceMarket,
        replacementReason: replacePick ? `High odds (${odds}) with no supporting data` : null,
      })
    }
  }

  return resultMap
}

// ─── FIND BEST COMBINATION ─────────────────────────────────────────────────
function findBestCombination(games: GameAnalysis[], targetOdds: number): GameAnalysis[] {
  if (games.length === 0) return games
  const total = games.reduce((acc, g) => acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)
  if (total <= targetOdds * 1.2) return games
  const sorted = [...games].sort((a, b) => a.confidenceScore - b.confidenceScore)
  let best = games
  let bestDiff = Math.abs(total - targetOdds)
  for (let i = 1; i < sorted.length - 1; i++) {
    const candidate = sorted.slice(i)
    const odds = candidate.reduce((acc, g) => acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)
    const diff = Math.abs(odds - targetOdds)
    if (diff < bestDiff) { bestDiff = diff; best = candidate }
    if (odds < targetOdds * 0.5) break
  }
  if (best.length < 2) best = sorted.slice(sorted.length - 2)
  return best
}

// ─── FETCH REAL ODDS FROM PROXY ────────────────────────────────────────────
async function fetchRealOddsFromProxy(
  games: Array<{ eventId: string; marketId: string; outcomeId: string }>
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  try {
    const res = await fetch(`${PROXY_URL}/outcomes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify(games.map(g => ({ ...g, specifier: null }))),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return map
    const data = await res.json()
    if (data?.bizCode !== 10000) return map
    for (const ev of (data.data || [])) {
      const odds = ev.markets?.[0]?.outcomes?.[0]?.odds
      if (ev.eventId && odds) map.set(ev.eventId, parseFloat(odds))
    }
  } catch { /* silent */ }
  return map
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────
export async function analyseSlip(
  games: SportyBetGame[],
  targetOdds: number,
  originalTotalOdds: number,
  allowSwitching: boolean = false,
  clientMarkets: Record<string, unknown> = {},
  username: string = 'Champ'
): Promise<SlipAnalysis> {

  const isFootball = (g: SportyBetGame) =>
    !g.sport || g.sport.toLowerCase().includes('football') || g.sport.toLowerCase().includes('soccer')

  // Fetch all BSD + Sofascore data in parallel
  const dataMap = new Map<string, { bsd: string; sofa: string; dataSource: string }>()
  await Promise.all(
    games.filter(isFootball).map(async (g) => {
      const [bsd, sofa] = await Promise.all([
        getBSDData(g.homeTeam, g.awayTeam),
        getSofaData(g.homeTeam, g.awayTeam),
      ])
      dataMap.set(g.eventId, {
        bsd, sofa,
        dataSource: bsd && sofa ? 'BSD+SOFASCORE' : bsd ? 'BSD' : sofa ? 'SOFASCORE' : 'AI_WEB_SEARCH',
      })
    })
  )

  // Single AI batch call — split into chunks of 25 to stay under token limit
  const aiResults = new Map<string, AIResult>()
  const CHUNK = 25
  for (let i = 0; i < games.length; i += CHUNK) {
    const chunk = games.slice(i, i + CHUNK)
    const chunkResults = await runBatchAI(chunk, dataMap, allowSwitching, targetOdds)
    chunkResults.forEach((v, k) => aiResults.set(k, v))
  }

  // Build analysis results
  const analysisResults: GameAnalysis[] = games.map(game => {
    const ai = aiResults.get(game.eventId)!
    const d = dataMap.get(game.eventId) || { bsd: '', sofa: '', dataSource: 'AI_WEB_SEARCH' }

    const base: GameAnalysis = {
      ...game,
      riskLevel: ai.riskLevel,
      riskScore: ai.riskScore,
      confidenceScore: ai.confidenceScore,
      reason: ai.reason,
      formSummary: ai.formSummary,
      keep: ai.keep,
      dataSource: d.dataSource,
    }

    // Apply replacement only if AI gave valid pick+market that resolves to real IDs
    if (allowSwitching && ai.replacePick && ai.replaceMarket) {
      const newPick = ai.replacePick
      const newMarket = ai.replaceMarket

      // Primary: hardcoded map
      const hardcoded = resolvePickToIds(newPick, newMarket)
      // Fallback: smart replacement
      const smart = !hardcoded ? getSmartReplacement(game.marketId, game.outcomeId, game.pick, game.market, game.odds) : null
      // Last resort: availableMarkets
      const resolved = !hardcoded && !smart && game.availableMarkets?.length
        ? resolveFromAvailableMarkets(game.availableMarkets, newPick, newMarket, game.odds) : null

      // Only apply replacement if we resolved valid IDs
      if (hardcoded || smart || resolved) {
        const finalMarketId = hardcoded?.marketId || smart?.marketId || resolved?.marketId || game.marketId
        const finalOutcomeId = hardcoded?.outcomeId || smart?.outcomeId || resolved?.outcomeId || game.outcomeId
        const finalPickDesc = smart?.pickDesc || newPick
        const finalMarketDesc = smart?.marketDesc || newMarket
        const finalOdds = resolved?.realOdds || estimateSaferOdds(game.odds, finalPickDesc, finalMarketDesc)

        return {
          ...base,
          keep: true,
          replaced: true,
          originalPick: game.pick,
          originalMarket: game.market,
          originalOdds: game.odds,
          replacedPick: finalPickDesc,
          replacedMarketDesc: finalMarketDesc,
          replacedOdds: finalOdds,
          replacementReason: ai.replacementReason || `Smarter pick based on match data`,
          marketId: finalMarketId,
          outcomeId: finalOutcomeId,
          specifier: null,
          needsResolution: false,
        }
      }
    }

    return base
  })

  const kept = analysisResults.filter(g => g.keep)
  const removed = analysisResults.filter(g => !g.keep)
  let keptGames = findBestCombination(kept, targetOdds)

  if (keptGames.length < 2) {
    const safest = [...removed].sort((a, b) => b.confidenceScore - a.confidenceScore)
    for (const g of safest) { if (keptGames.length >= 2) break; keptGames.push(g) }
  }

  const keptIds = new Set(keptGames.map(g => g.eventId))
  const finalGames = analysisResults.map(g => ({ ...g, keep: keptIds.has(g.eventId) }))
  const removedGames = finalGames.filter(g => !g.keep)

  // Try to get real odds for replaced picks from proxy
  const replacedGames = keptGames.filter(g => g.replaced)
  if (replacedGames.length > 0) {
    const realOdds = await fetchRealOddsFromProxy(
      replacedGames.map(g => ({ eventId: g.eventId, marketId: g.marketId, outcomeId: g.outcomeId }))
    )
    for (const g of keptGames) {
      if (g.replaced && realOdds.has(g.eventId)) {
        g.replacedOdds = realOdds.get(g.eventId)!
        g.odds = g.replacedOdds
      }
    }
  }

  const finalNewOdds = keptGames.reduce((acc, g) =>
    acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)
  const replacedCount = keptGames.filter(g => g.replaced).length

  let summary = `Analysed ${games.length} games. Kept ${keptGames.length} at ${finalNewOdds.toFixed(2)} odds (target: ${targetOdds}). Removed ${removedGames.length} picks${replacedCount > 0 ? `, replaced ${replacedCount} with smarter options` : ''}.`
  try {
    const sc = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You write betting summaries for Nigerian punters in a casual street tone. Be direct, confident, relatable. No markdown, no asterisks, no bullet points. Max 2 sentences.' },
        { role: 'user', content: `Write a short 2-sentence betting slip summary. Start with "Hi ${username}," then give a high-level summary of what was done. Casual and confident. No team names, no markdown, no asterisks.\n\nFacts: checked ${games.length} games, kept ${keptGames.length} at ${finalNewOdds.toFixed(2)} odds (target ${targetOdds}), cut ${removedGames.length} risky picks${replacedCount > 0 ? `, swapped ${replacedCount} for safer options` : ''}.` }
      ],
      temperature: 0.4,
      max_tokens: 80,
    })
    summary = sc.choices[0]?.message?.content || summary
  } catch { /* default */ }

  return {
    games: finalGames,
    removedGames,
    keptGames,
    originalOdds: parseFloat(originalTotalOdds.toFixed(2)),
    newOdds: parseFloat(finalNewOdds.toFixed(2)),
    targetOdds,
    summary,
  }
}
