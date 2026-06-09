import Groq from 'groq-sdk'
import { SportyBetGame, resolveFromAvailableMarkets, getSmartReplacement } from './sportybet'

const PROXY_URL = 'https://sportybet-proxy.onrender.com'
const PROXY_KEY = 'grooveslip_proxy_2026'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const BSD_BASE = 'https://sports.bzzoiro.com/api'
const SOFA_BASE = 'https://api.sofascore.com/api/v1'

const bsdHeaders = {
  'Authorization': `Token ${BSD_TOKEN}`,
  'Content-Type': 'application/json',
}

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

// ─── HARDCODED PICK → SPORTYBET IDS MAP ────────────────────────────────────
// Key format: "replacedPick|replacedMarket" (both lowercased)
// This is the primary resolution method — no API, no string matching, no failures
const PICK_TO_IDS: Record<string, { marketId: string; outcomeId: string }> = {
  // Double Chance (marketId 3)
  'home/draw|double chance':  { marketId: '3', outcomeId: '1' },
  'draw/away|double chance':  { marketId: '3', outcomeId: '3' },
  'home/away|double chance':  { marketId: '3', outcomeId: '2' },
  '1x|double chance':         { marketId: '3', outcomeId: '1' },
  'x2|double chance':         { marketId: '3', outcomeId: '3' },
  '12|double chance':         { marketId: '3', outcomeId: '2' },

  // GG/NG (marketId 5)
  'yes|gg/ng':  { marketId: '5', outcomeId: '1' },
  'no|gg/ng':   { marketId: '5', outcomeId: '2' },
  'gg|gg/ng':   { marketId: '5', outcomeId: '1' },
  'ng|gg/ng':   { marketId: '5', outcomeId: '2' },

  // Over/Under (marketId 18 — outcomeId 12=Over, 13=Under)
  'over 0.5|over/under':  { marketId: '18', outcomeId: '12' },
  'over 1.5|over/under':  { marketId: '18', outcomeId: '12' },
  'over 2.5|over/under':  { marketId: '18', outcomeId: '12' },
  'over 3.5|over/under':  { marketId: '18', outcomeId: '12' },
  'over 4.5|over/under':  { marketId: '18', outcomeId: '12' },
  'under 0.5|over/under': { marketId: '18', outcomeId: '13' },
  'under 1.5|over/under': { marketId: '18', outcomeId: '13' },
  'under 2.5|over/under': { marketId: '18', outcomeId: '13' },
  'under 3.5|over/under': { marketId: '18', outcomeId: '13' },
  'under 4.5|over/under': { marketId: '18', outcomeId: '13' },

  // 1X2 (marketId 1)
  'home|1x2': { marketId: '1', outcomeId: '1' },
  'draw|1x2': { marketId: '1', outcomeId: '2' },
  'away|1x2': { marketId: '1', outcomeId: '3' },
  '1|1x2':    { marketId: '1', outcomeId: '1' },
  'x|1x2':    { marketId: '1', outcomeId: '2' },
  '2|1x2':    { marketId: '1', outcomeId: '3' },

  // 1X2 1UP (marketId 60200)
  'home|1x2 - 1up': { marketId: '60200', outcomeId: '1' },
  'away|1x2 - 1up': { marketId: '60200', outcomeId: '3' },
  'home|1up':        { marketId: '60200', outcomeId: '1' },
  'away|1up':        { marketId: '60200', outcomeId: '3' },

  // 1X2 2UP (marketId 60100)
  'home|1x2 - 2up': { marketId: '60100', outcomeId: '1' },
  'away|1x2 - 2up': { marketId: '60100', outcomeId: '3' },
  'home|2up':        { marketId: '60100', outcomeId: '1' },
  'away|2up':        { marketId: '60100', outcomeId: '3' },
}

function resolvePickToIds(
  replacedPick: string,
  replacedMarket: string
): { marketId: string; outcomeId: string } | null {
  const key = `${replacedPick.toLowerCase().trim()}|${replacedMarket.toLowerCase().trim()}`
  return PICK_TO_IDS[key] || null
}
// ───────────────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

function teamsMatch(a: string, b: string, c: string, d: string): boolean {
  const fw = (s: string) => normalize(s).split(' ')[0]
  const overlap = (x: string, y: string) =>
    normalize(x).includes(fw(y)) || normalize(y).includes(fw(x))
  return overlap(a, c) && overlap(b, d)
}

async function getBSDEvent(homeTeam: string, awayTeam: string): Promise<Record<string, unknown> | null> {
  const yesterday = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
  const nextTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  for (const term of [homeTeam, homeTeam.split(' ')[0], awayTeam, awayTeam.split(' ')[0]]) {
    try {
      const res = await fetch(
        `${BSD_BASE}/events/?team=${encodeURIComponent(term)}&date_from=${yesterday}&date_to=${nextTwoWeeks}&limit=50`,
        { headers: bsdHeaders }
      )
      if (!res.ok) continue
      const data = await res.json()
      const match = (data.results || []).find((e: unknown) => {
        const ev = e as Record<string, unknown>
        return teamsMatch(ev.home_team as string || '', ev.away_team as string || '', homeTeam, awayTeam)
      })
      if (match) {
        const ev = match as Record<string, unknown>
        const detail = await fetch(`${BSD_BASE}/events/${ev.id}/`, { headers: bsdHeaders })
        return detail.ok ? await detail.json() : ev
      }
    } catch { continue }
  }
  return null
}

function parseBSD(event: Record<string, unknown>, homeTeam: string, awayTeam: string): string {
  const hf = event.home_form as Record<string, unknown> | null
  const af = event.away_form as Record<string, unknown> | null
  const h2h = event.head_to_head as Record<string, unknown> | null
  const unavail = event.unavailable_players as Record<string, unknown> | null
  const pred = event.prediction as Record<string, unknown> | null
  const fmt = (f: Record<string, unknown> | null, name: string) =>
    f ? `${name}:[${f.form_string || '?'}] W${f.wins || 0}D${f.draws || 0}L${f.losses || 0} scored:${f.goals_scored_last_n || 0} conceded:${f.goals_conceded_last_n || 0}`
      : `${name}:no form data`
  const fmtH2H = (h: Record<string, unknown> | null) =>
    h ? `H2H(${h.total_matches || 0}): ${homeTeam} wins:${h.home_wins || 0} draws:${h.draws || 0} ${awayTeam} wins:${h.away_wins || 0}`
      : 'H2H:no data'
  const fmtInj = (u: Record<string, unknown> | null) => {
    if (!u) return ''
    const fmt2 = (arr: unknown[]) => arr.slice(0, 3).map((p: unknown) => {
      const pl = p as Record<string, unknown>
      return `${pl.name}(${pl.status})`
    }).join(',')
    const h = (u.home as unknown[] || [])
    const a = (u.away as unknown[] || [])
    if (!h.length && !a.length) return ''
    return `Injuries-H:[${h.length ? fmt2(h) : 'none'}] A:[${a.length ? fmt2(a) : 'none'}]`
  }
  const parts = [fmt(hf, homeTeam), fmt(af, awayTeam), fmtH2H(h2h)]
  const inj = fmtInj(unavail)
  if (inj) parts.push(inj)
  if (pred) parts.push(`ML:${pred.predicted_result} H:${pred.prob_home_win}% D:${pred.prob_draw}% A:${pred.prob_away_win}%`)
  return parts.join(' | ')
}

async function getSofaTeamId(name: string): Promise<number | null> {
  try {
    const res = await fetch(`${SOFA_BASE}/search/teams/${encodeURIComponent(name)}`, { headers: sofaHeaders })
    if (!res.ok) return null
    const data = await res.json()
    const teams: unknown[] = data.teams || []
    if (!teams.length) return null
    const match = teams.find((t: unknown) => {
      const team = t as Record<string, unknown>
      return normalize(team.name as string || '').includes(normalize(name).split(' ')[0])
    }) as Record<string, unknown> | undefined
    const found = (match || teams[0]) as Record<string, unknown>
    return (found?.id as number) || null
  } catch { return null }
}

async function getSofaForm(teamId: number, teamName: string): Promise<string> {
  try {
    const res = await fetch(`${SOFA_BASE}/team/${teamId}/events/last/0`, { headers: sofaHeaders })
    if (!res.ok) return `${teamName}:no data`
    const data = await res.json()
    const events = ((data.events || []) as unknown[]).slice(-5)
    if (!events.length) return `${teamName}:no recent matches`
    let w = 0, d = 0, l = 0
    const results = events.map((e: unknown) => {
      const ev = e as Record<string, unknown>
      const hs = ev.homeScore as Record<string, unknown>
      const as_ = ev.awayScore as Record<string, unknown>
      const ht = ev.homeTeam as Record<string, unknown>
      const isHome = normalize(ht?.name as string || '').includes(normalize(teamName).split(' ')[0])
      const scored = Number(isHome ? hs?.current : as_?.current) || 0
      const conceded = Number(isHome ? as_?.current : hs?.current) || 0
      let r = 'D'
      if (scored > conceded) { r = 'W'; w++ }
      else if (scored < conceded) { r = 'L'; l++ }
      else d++
      return `${r}${scored}-${conceded}`
    })
    return `${teamName} last5:W${w}D${d}L${l}[${results.join(',')}]`
  } catch { return `${teamName}:no data` }
}

async function getSofaData(homeTeam: string, awayTeam: string): Promise<string | null> {
  try {
    const [homeId, awayId] = await Promise.all([getSofaTeamId(homeTeam), getSofaTeamId(awayTeam)])
    if (!homeId && !awayId) return null
    const [homeForm, awayForm] = await Promise.all([
      homeId ? getSofaForm(homeId, homeTeam) : Promise.resolve(`${homeTeam}:no data`),
      awayId ? getSofaForm(awayId, awayTeam) : Promise.resolve(`${awayTeam}:no data`),
    ])
    return `${homeForm} | ${awayForm}`
  } catch { return null }
}

async function gatherGameData(game: SportyBetGame): Promise<{
  game: SportyBetGame
  context: string
  dataSource: string
}> {
  const isFootball = !game.sport ||
    game.sport.toLowerCase().includes('football') ||
    game.sport.toLowerCase().includes('soccer')
  if (!isFootball) return { game, context: '', dataSource: 'AI_WEB_SEARCH' }
  let context = ''
  let dataSource = 'FALLBACK'
  const [bsdEvent, sofaData] = await Promise.all([
    getBSDEvent(game.homeTeam, game.awayTeam),
    getSofaData(game.homeTeam, game.awayTeam),
  ])
  if (bsdEvent) {
    context += `BSD:${parseBSD(bsdEvent, game.homeTeam, game.awayTeam)}`
    dataSource = 'BSD'
  }
  if (sofaData) {
    context += context ? ` | SOFA:${sofaData}` : `SOFA:${sofaData}`
    dataSource = bsdEvent ? 'BSD+SOFASCORE' : 'SOFASCORE'
  }
  if (!context) dataSource = 'AI_WEB_SEARCH'
  return { game, context, dataSource }
}

interface AnalysisResult {
  eventId: string
  confidenceScore: number
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  keep: boolean
  reason: string
  formSummary: string
  replacePick: string | null
  replaceMarket: string | null
}

function extractJSON(raw: string): AnalysisResult[] {
  try {
    const direct = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    return JSON.parse(direct)
  } catch { /* continue */ }
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('No JSON array found')
  let slice = raw.substring(start, end + 1)
  slice = slice
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/\n/g, ' ').replace(/\r/g, '').replace(/\t/g, ' ')
  return JSON.parse(slice)
}

function estimateSaferOdds(
  originalOdds: number,
  originalPick: string,
  newPick: string,
  newMarket: string
): number {
  const orig = originalPick.toLowerCase()
  const np = newPick.toLowerCase()
  const nm = newMarket.toLowerCase()

  if (nm.includes('over/under') || nm.includes('over') || nm.includes('under')) {
    const origNum = parseFloat(orig.replace(/[^0-9.]/g, ''))
    const newNum = parseFloat(np.replace(/[^0-9.]/g, ''))
    if (!isNaN(origNum) && !isNaN(newNum)) {
      const diff = origNum - newNum
      const factor = Math.max(0.3, 1 - (diff * 0.25))
      return Math.max(1.05, parseFloat((1 + (originalOdds - 1) * factor).toFixed(2)))
    }
  }
  if (nm.includes('double chance')) {
    return Math.max(1.05, parseFloat((1 + (originalOdds - 1) * 0.4).toFixed(2)))
  }
  if (nm.includes('draw no bet') || nm.includes('dnb')) {
    return Math.max(1.05, parseFloat((1 + (originalOdds - 1) * 0.6).toFixed(2)))
  }
  if (nm.includes('gg') || nm.includes('both teams')) {
    return Math.max(1.05, parseFloat((originalOdds * 0.65).toFixed(2)))
  }
  return Math.max(1.05, parseFloat((1 + (originalOdds - 1) * 0.5).toFixed(2)))
}

function autoReplace(game: SportyBetGame, targetOdds: number, currentSlipOdds: number): {
  replacePick: string
  replaceMarket: string
} | null {
  const market = game.market.toLowerCase().trim()
  const pick = game.pick.toLowerCase().trim()

  if (market.includes('over/under') && !market.includes('corner')) {
    const num = parseFloat(pick.replace(/[^0-9.]/g, ''))
    if (pick.startsWith('over') && !isNaN(num)) {
      if (num >= 4.5) return { replacePick: 'Over 2.5', replaceMarket: 'Over/Under' }
      if (num >= 3.5) return { replacePick: 'Over 2.5', replaceMarket: 'Over/Under' }
      if (num >= 2.5) return { replacePick: 'Over 1.5', replaceMarket: 'Over/Under' }
      if (num >= 1.5) return { replacePick: 'Over 0.5', replaceMarket: 'Over/Under' }
    }
    if (pick.startsWith('under') && !isNaN(num)) {
      if (num <= 1.5) return { replacePick: 'Under 2.5', replaceMarket: 'Over/Under' }
    }
  }
  if (market === '1x2') {
    if (pick === 'home' || pick === '1') return { replacePick: 'Home/Draw', replaceMarket: 'Double Chance' }
    if (pick === 'away' || pick === '2') return { replacePick: 'Draw/Away', replaceMarket: 'Double Chance' }
    if (pick === 'draw' || pick === 'x') return { replacePick: 'Home/Draw', replaceMarket: 'Double Chance' }
  }
  if ((market === 'gg/ng' || market.includes('gg')) && pick === 'yes') {
    return { replacePick: 'No', replaceMarket: 'GG/NG' }
  }
  if (market.includes('2up') || market.includes('1up')) {
    if (pick === 'home') return { replacePick: 'Home/Draw', replaceMarket: 'Double Chance' }
    if (pick === 'away') return { replacePick: 'Draw/Away', replaceMarket: 'Double Chance' }
  }
  return null
}

async function batchAnalyse(
  gameData: Array<{ game: SportyBetGame; context: string; dataSource: string }>,
  targetOdds: number,
  allowSwitching: boolean
): Promise<Map<string, AnalysisResult>> {

  const currentSlipOdds = gameData.reduce((acc, gd) => acc * gd.game.odds, 1)

  const gamesList = gameData.map((gd, i) => {
    const hasData = Boolean(gd.context)
    const dataNote = hasData ? gd.context : 'NO_STATS'
    const oddsNote = gd.game.odds >= 4.0 ? 'VERY_HIGH_ODDS' : gd.game.odds >= 2.5 ? 'HIGH_ODDS' : gd.game.odds >= 1.8 ? 'MEDIUM_ODDS' : 'LOW_ODDS'
    return `G${i + 1}|id:${gd.game.eventId}|${gd.game.homeTeam} vs ${gd.game.awayTeam}|${gd.game.league}|pick:${gd.game.pick}(${gd.game.market})|odds:${gd.game.odds}|${oddsNote}|${dataNote}`
  }).join('\n')

  const modeInstructions = allowSwitching
    ? `REPLACE MODE: Analyse EVERY game and suggest a safer pick replacement where appropriate.

For EACH game:
1. Look at the form data, H2H, injuries and odds
2. If the pick has any risk factor, suggest a safer market alternative
3. You MUST suggest replacements for ALL games where a safer option exists

REPLACEMENT RULES (apply to ALL games not just risky ones):
- Any Over 2.5, Over 3.5, Over 4.5: replace with next lower line (Over 1.5, Over 2.5)
- Any Away Win pick: replace with Draw/Away Double Chance
- Any Home Win where home team is NOT strong: replace with Home/Draw Double Chance
- Any Draw pick: replace with Home/Draw or Draw/Away Double Chance
- Any GG Yes: replace with No if either team has defensive form
- Any 1UP or 2UP market: replace with Double Chance equivalent
- Only set null if pick is already the safest possible (e.g. Over 0.5, Double Chance already)

Current total odds: ${currentSlipOdds.toFixed(2)}, Target: ${targetOdds}
Be generous with replacements - replace as many as possible to be safe.`
    : 'REMOVE MODE: Set replacePick and replaceMarket to null for all.'

  const prompt = `You are a professional football betting analyst.

${modeInstructions}

MISSING STATS = keep the game, do not remove.
TARGET ODDS: ${targetOdds}

GAMES:
${gamesList}

Return ONLY a JSON array, one object per game in same order:
[{"eventId":"EXACT_ID","confidenceScore":55,"riskScore":5,"riskLevel":"LOW","keep":true,"reason":"brief reason","formSummary":"key stat","replacePick":"Over 1.5","replaceMarket":"Over/Under"}]

replacePick and replaceMarket must be actual pick and market names, or null.`

  const map = new Map<string, AnalysisResult>()

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON API. Output ONLY a valid JSON array. Start with [ end with ]. No other text.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const results = extractJSON(raw)

    for (const r of results) {
      const gd = gameData.find(g => g.game.eventId === r.eventId)
      let keep = r.keep === true
      if (gd && !gd.context && !keep) keep = true

      let replacePick = r.replacePick || null
      let replaceMarket = r.replaceMarket || null

      if (allowSwitching && (!replacePick || !replaceMarket) && gd) {
        const auto = autoReplace(gd.game, targetOdds, currentSlipOdds)
        if (auto) {
          replacePick = auto.replacePick
          replaceMarket = auto.replaceMarket
        }
      }

      map.set(r.eventId, {
        ...r,
        keep,
        replacePick,
        replaceMarket,
        riskLevel: (['LOW', 'MEDIUM', 'HIGH'].includes(r.riskLevel) ? r.riskLevel : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
      })
    }
  } catch (err) {
    console.error('AI analysis failed:', err)
    for (const gd of gameData) {
      const auto = allowSwitching ? autoReplace(gd.game, targetOdds, currentSlipOdds) : null
      map.set(gd.game.eventId, {
        eventId: gd.game.eventId,
        confidenceScore: Boolean(gd.context) ? 65 : 55,
        riskScore: 5,
        riskLevel: 'MEDIUM',
        reason: Boolean(gd.context) ? 'Kept based on data' : 'No stats — kept by default',
        formSummary: gd.dataSource,
        keep: true,
        replacePick: auto?.replacePick || null,
        replaceMarket: auto?.replaceMarket || null,
      })
    }
  }

  return map
}

function findBestCombination(games: GameAnalysis[], targetOdds: number): GameAnalysis[] {
  if (games.length === 0) return games
  const currentTotal = games.reduce((acc, g) =>
    acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)
  if (currentTotal <= targetOdds * 1.2) return games
  const sorted = [...games].sort((a, b) => a.confidenceScore - b.confidenceScore)
  let bestCombo = games
  let bestDiff = Math.abs(currentTotal - targetOdds)
  for (let removeCount = 1; removeCount < sorted.length - 1; removeCount++) {
    const candidate = sorted.slice(removeCount)
    const candidateOdds = candidate.reduce((acc, g) =>
      acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)
    const diff = Math.abs(candidateOdds - targetOdds)
    if (diff < bestDiff) { bestDiff = diff; bestCombo = candidate }
    if (candidateOdds < targetOdds * 0.5) break
  }
  if (bestCombo.length < 2) bestCombo = sorted.slice(sorted.length - 2)
  return bestCombo
}

async function fetchRealOddsFromProxy(
  games: Array<{ eventId: string; marketId: string; outcomeId: string }>
): Promise<Map<string, number>> {
  const oddsMap = new Map<string, number>()
  try {
    const payload = games.map(g => ({
      eventId: g.eventId,
      marketId: g.marketId,
      outcomeId: g.outcomeId,
      specifier: null,
    }))

    const res = await fetch(`${PROXY_URL}/outcomes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Key': PROXY_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) return oddsMap
    const data = await res.json()
    if (!data || data.bizCode !== 10000) return oddsMap

    for (const ev of (data.data || [])) {
      const market = ev.markets?.[0]
      const outcome = market?.outcomes?.[0]
      if (ev.eventId && outcome?.odds) {
        oddsMap.set(ev.eventId, parseFloat(outcome.odds))
      }
    }
  } catch { /* silent */ }
  return oddsMap
}

export async function analyseSlip(
  games: SportyBetGame[],
  targetOdds: number,
  originalTotalOdds: number,
  allowSwitching: boolean = false,
  clientMarkets: Record<string, unknown> = {}
): Promise<SlipAnalysis> {

  const footballGames = games.filter(g =>
    !g.sport || g.sport.toLowerCase().includes('football') || g.sport.toLowerCase().includes('soccer')
  )
  const otherGames = games.filter(g =>
    g.sport && !g.sport.toLowerCase().includes('football') && !g.sport.toLowerCase().includes('soccer')
  )

  const currentSlipOdds = games.reduce((acc, g) => acc * g.odds, 1)
  const footballData = await Promise.all(footballGames.map(g => gatherGameData(g)))
  const footballResults = await batchAnalyse(footballData, targetOdds, allowSwitching)

  const otherResults = new Map<string, AnalysisResult>()
  for (const g of otherGames) {
    const auto = allowSwitching ? autoReplace(g, targetOdds, currentSlipOdds) : null
    otherResults.set(g.eventId, {
      eventId: g.eventId,
      confidenceScore: 58,
      riskScore: 5,
      riskLevel: 'MEDIUM',
      reason: 'Non-football sport',
      formSummary: 'Web search',
      keep: true,
      replacePick: auto?.replacePick || null,
      replaceMarket: auto?.replaceMarket || null,
    })
  }

  const allResults = new Map<string, AnalysisResult>()
  footballResults.forEach((v, k) => allResults.set(k, v))
  otherResults.forEach((v, k) => allResults.set(k, v))

  const dataSourceMap = new Map(footballData.map(fd => [fd.game.eventId, fd.dataSource]))

  const analysisResults: GameAnalysis[] = games.map(game => {
    const result = allResults.get(game.eventId)
    const dataSource = dataSourceMap.get(game.eventId) || 'AI_WEB_SEARCH'

    const baseResult: GameAnalysis = result ? {
      ...game,
      confidenceScore: result.confidenceScore,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      reason: result.reason,
      formSummary: result.formSummary,
      keep: result.keep,
      dataSource,
    } : {
      ...game,
      confidenceScore: 55,
      riskScore: 5,
      riskLevel: 'MEDIUM',
      reason: 'Kept by default',
      formSummary: 'No data',
      keep: true,
      dataSource: 'FALLBACK',
    }

    // ─── Apply replacement in switching mode ───────────────────────────────
    if (allowSwitching && result?.replacePick && result?.replaceMarket) {
      const newPick = result.replacePick
      const newMarket = result.replaceMarket

      // Step 1: Hardcoded lookup — primary method, no API calls, no failures
      const hardcoded = resolvePickToIds(newPick, newMarket)

      // Step 2: Smart replacement using known market ID map (fallback)
      const smart = !hardcoded ? getSmartReplacement(
        game.marketId,
        game.outcomeId,
        game.pick,
        game.market,
        game.odds
      ) : null

      // Step 3: availableMarkets from decode response (last resort)
      const resolved = !hardcoded && !smart && game.availableMarkets?.length
        ? resolveFromAvailableMarkets(game.availableMarkets, newPick, newMarket, game.odds)
        : null

      // Final IDs — hardcoded takes priority, guarantees correct booking code
      const finalMarketId = hardcoded?.marketId || smart?.marketId || resolved?.marketId || game.marketId
      const finalOutcomeId = hardcoded?.outcomeId || smart?.outcomeId || resolved?.outcomeId || game.outcomeId
      const finalPickDesc = smart?.pickDesc || newPick
      const finalMarketDesc = smart?.marketDesc || newMarket
      const finalOdds = resolved?.realOdds || estimateSaferOdds(game.odds, game.pick, finalPickDesc, finalMarketDesc)
      const resolvedSuccessfully = !!(hardcoded || smart || resolved)

      return {
        ...baseResult,
        keep: true,
        replaced: true,
        originalPick: game.pick,
        originalMarket: game.market,
        originalOdds: game.odds,
        replacedPick: finalPickDesc,
        replacedMarketDesc: finalMarketDesc,
        replacedOdds: finalOdds,
        replacementReason: result.reason || `Safer option: ${finalPickDesc} in ${finalMarketDesc}`,
        marketId: finalMarketId,
        outcomeId: finalOutcomeId,
        specifier: null,
        needsResolution: !resolvedSuccessfully,
      }
    }
    // ───────────────────────────────────────────────────────────────────────

    return baseResult
  })

  const aiKept = analysisResults.filter(g => g.keep)
  const aiRemoved = analysisResults.filter(g => !g.keep)
  const keptGames = findBestCombination(aiKept, targetOdds)

  if (keptGames.length < 2) {
    const safest = [...aiRemoved].sort((a, b) => b.confidenceScore - a.confidenceScore)
    for (const g of safest) {
      if (keptGames.length >= 2) break
      keptGames.push(g)
    }
  }

  const keptIds = new Set(keptGames.map(g => g.eventId))
  const finalGames = analysisResults.map(g => ({ ...g, keep: keptIds.has(g.eventId) }))
  const removedGames = finalGames.filter(g => !g.keep)

  const newOdds = keptGames.reduce((acc, g) => {
    const odds = g.replaced ? (g.replacedOdds || g.odds) : g.odds
    return acc * odds
  }, 1)

  // Fetch real odds from proxy for replaced games (best-effort — won't block)
  const replacedGames = keptGames.filter(g => g.replaced)
  if (replacedGames.length > 0) {
    const realOddsMap = await fetchRealOddsFromProxy(
      replacedGames.map(g => ({
        eventId: g.eventId,
        marketId: g.marketId,
        outcomeId: g.outcomeId,
      }))
    )
    for (const game of keptGames) {
      if (game.replaced && realOddsMap.has(game.eventId)) {
        game.replacedOdds = realOddsMap.get(game.eventId)!
        game.odds = game.replacedOdds
      }
    }
  }

  const finalNewOdds = keptGames.reduce((acc, g) => acc * g.odds, 1)

  let summary = `Analysed ${games.length} games. Kept ${keptGames.length} at ${newOdds.toFixed(2)} odds (target: ${targetOdds}). Removed ${removedGames.length} picks.`
  try {
    const replacedCount = keptGames.filter(g => g.replaced).length
    const sc = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Write short direct betting summaries for Nigerian punters.' },
        {
          role: 'user',
          content: `2 sentences. Analysed ${games.length} games, kept ${keptGames.length} at ${newOdds.toFixed(2)} odds (target:${targetOdds}). ${replacedCount > 0 ? `Replaced ${replacedCount} risky picks with safer options.` : ''} Removed:${removedGames.map(g => `${g.homeTeam}vs${g.awayTeam}`).join(',') || 'none'}.`
        }
      ],
      temperature: 0.4,
      max_tokens: 100,
    })
    summary = sc.choices[0]?.message?.content || summary
  } catch { /* use default */ }

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