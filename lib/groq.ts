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

// ─── HARDCODED PICK → SPORTYBET IDS ────────────────────────────────────────
const PICK_TO_IDS: Record<string, { marketId: string; outcomeId: string }> = {
  'home/draw|double chance':  { marketId: '3', outcomeId: '1' },
  'draw/away|double chance':  { marketId: '3', outcomeId: '3' },
  'home/away|double chance':  { marketId: '3', outcomeId: '2' },
  '1x|double chance':         { marketId: '3', outcomeId: '1' },
  'x2|double chance':         { marketId: '3', outcomeId: '3' },
  '12|double chance':         { marketId: '3', outcomeId: '2' },
  'yes|gg/ng':                { marketId: '5', outcomeId: '1' },
  'no|gg/ng':                 { marketId: '5', outcomeId: '2' },
  'gg|gg/ng':                 { marketId: '5', outcomeId: '1' },
  'ng|gg/ng':                 { marketId: '5', outcomeId: '2' },
  'over 0.5|over/under':      { marketId: '18', outcomeId: '12' },
  'over 1.5|over/under':      { marketId: '18', outcomeId: '12' },
  'over 2.5|over/under':      { marketId: '18', outcomeId: '12' },
  'over 3.5|over/under':      { marketId: '18', outcomeId: '12' },
  'over 4.5|over/under':      { marketId: '18', outcomeId: '12' },
  'under 0.5|over/under':     { marketId: '18', outcomeId: '13' },
  'under 1.5|over/under':     { marketId: '18', outcomeId: '13' },
  'under 2.5|over/under':     { marketId: '18', outcomeId: '13' },
  'under 3.5|over/under':     { marketId: '18', outcomeId: '13' },
  'under 4.5|over/under':     { marketId: '18', outcomeId: '13' },
  'home|1x2':                 { marketId: '1', outcomeId: '1' },
  'draw|1x2':                 { marketId: '1', outcomeId: '2' },
  'away|1x2':                 { marketId: '1', outcomeId: '3' },
  '1|1x2':                    { marketId: '1', outcomeId: '1' },
  'x|1x2':                    { marketId: '1', outcomeId: '2' },
  '2|1x2':                    { marketId: '1', outcomeId: '3' },
  'home|1x2 - 1up':           { marketId: '60200', outcomeId: '1' },
  'away|1x2 - 1up':           { marketId: '60200', outcomeId: '3' },
  'home|1up':                 { marketId: '60200', outcomeId: '1' },
  'away|1up':                 { marketId: '60200', outcomeId: '3' },
  'home|1x2 - 2up':           { marketId: '60100', outcomeId: '1' },
  'away|1x2 - 2up':           { marketId: '60100', outcomeId: '3' },
  'home|2up':                 { marketId: '60100', outcomeId: '1' },
  'away|2up':                 { marketId: '60100', outcomeId: '3' },
}

function resolvePickToIds(pick: string, market: string): { marketId: string; outcomeId: string } | null {
  const key = `${pick.toLowerCase().trim()}|${market.toLowerCase().trim()}`
  return PICK_TO_IDS[key] || null
}

// ─── BSD DATA ──────────────────────────────────────────────────────────────
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}
function teamsMatch(a: string, b: string, c: string, d: string): boolean {
  const fw = (s: string) => normalize(s).split(' ')[0]
  const overlap = (x: string, y: string) => normalize(x).includes(fw(y)) || normalize(y).includes(fw(x))
  return overlap(a, c) && overlap(b, d)
}

async function getBSDData(homeTeam: string, awayTeam: string): Promise<string> {
  try {
    const yesterday = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
    const nextTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    for (const term of [homeTeam, homeTeam.split(' ')[0], awayTeam]) {
      const res = await fetch(
        `${BSD_BASE}/events/?team=${encodeURIComponent(term)}&date_from=${yesterday}&date_to=${nextTwoWeeks}&limit=30`,
        { headers: bsdHeaders, signal: AbortSignal.timeout(6000) }
      )
      if (!res.ok) continue
      const data = await res.json()
      const match = (data.results || []).find((e: unknown) => {
        const ev = e as Record<string, unknown>
        return teamsMatch(ev.home_team as string || '', ev.away_team as string || '', homeTeam, awayTeam)
      })
      if (!match) continue
      const ev = match as Record<string, unknown>
      const detail = await fetch(`${BSD_BASE}/events/${ev.id}/`, { headers: bsdHeaders, signal: AbortSignal.timeout(5000) })
      const event = detail.ok ? await detail.json() : ev
      const hf = event.home_form as Record<string, unknown> | null
      const af = event.away_form as Record<string, unknown> | null
      const h2h = event.head_to_head as Record<string, unknown> | null
      const pred = event.prediction as Record<string, unknown> | null
      const unavail = event.unavailable_players as Record<string, unknown> | null
      const parts: string[] = []
      if (hf) parts.push(`${homeTeam} form:${hf.form_string || '?'} W${hf.wins || 0}D${hf.draws || 0}L${hf.losses || 0} scored:${hf.goals_scored_last_n || 0} conceded:${hf.goals_conceded_last_n || 0}`)
      if (af) parts.push(`${awayTeam} form:${af.form_string || '?'} W${af.wins || 0}D${af.draws || 0}L${af.losses || 0} scored:${af.goals_scored_last_n || 0} conceded:${af.goals_conceded_last_n || 0}`)
      if (h2h) parts.push(`H2H(${h2h.total_matches || 0}): ${homeTeam} wins:${h2h.home_wins || 0} draws:${h2h.draws || 0} ${awayTeam} wins:${h2h.away_wins || 0}`)
      if (pred) parts.push(`Prediction:${pred.predicted_result} H:${pred.prob_home_win}% D:${pred.prob_draw}% A:${pred.prob_away_win}%`)
      if (unavail) {
        const hi = (unavail.home as unknown[] || []).slice(0, 2).map((p: unknown) => (p as Record<string, unknown>).name).join(',')
        const ai = (unavail.away as unknown[] || []).slice(0, 2).map((p: unknown) => (p as Record<string, unknown>).name).join(',')
        if (hi || ai) parts.push(`Injuries H:[${hi || 'none'}] A:[${ai || 'none'}]`)
      }
      return parts.join(' | ')
    }
  } catch { /* silent */ }
  return ''
}

async function getSofaData(homeTeam: string, awayTeam: string): Promise<string> {
  try {
    const getTeamId = async (name: string): Promise<number | null> => {
      const res = await fetch(`${SOFA_BASE}/search/teams/${encodeURIComponent(name)}`, { headers: sofaHeaders, signal: AbortSignal.timeout(5000) })
      if (!res.ok) return null
      const data = await res.json()
      const teams = data.teams || []
      if (!teams.length) return null
      const match = teams.find((t: unknown) => normalize((t as Record<string, unknown>).name as string || '').includes(normalize(name).split(' ')[0]))
      return ((match || teams[0]) as Record<string, unknown>)?.id as number || null
    }
    const getForm = async (id: number, name: string): Promise<string> => {
      const res = await fetch(`${SOFA_BASE}/team/${id}/events/last/0`, { headers: sofaHeaders, signal: AbortSignal.timeout(5000) })
      if (!res.ok) return ''
      const data = await res.json()
      const events = ((data.events || []) as unknown[]).slice(-5)
      let w = 0, d = 0, l = 0
      const results = events.map((e: unknown) => {
        const ev = e as Record<string, unknown>
        const hs = ev.homeScore as Record<string, unknown>
        const as_ = ev.awayScore as Record<string, unknown>
        const ht = ev.homeTeam as Record<string, unknown>
        const isHome = normalize(ht?.name as string || '').includes(normalize(name).split(' ')[0])
        const scored = Number(isHome ? hs?.current : as_?.current) || 0
        const conceded = Number(isHome ? as_?.current : hs?.current) || 0
        let r = 'D'
        if (scored > conceded) { r = 'W'; w++ }
        else if (scored < conceded) { r = 'L'; l++ }
        else d++
        return `${r}${scored}-${conceded}`
      })
      return `${name} last5:W${w}D${d}L${l}[${results.join(',')}]`
    }
    const [homeId, awayId] = await Promise.all([getTeamId(homeTeam), getTeamId(awayTeam)])
    if (!homeId && !awayId) return ''
    const [hForm, aForm] = await Promise.all([
      homeId ? getForm(homeId, homeTeam) : Promise.resolve(''),
      awayId ? getForm(awayId, awayTeam) : Promise.resolve(''),
    ])
    return [hForm, aForm].filter(Boolean).join(' | ')
  } catch { return '' }
}

// ─── ODDS ESTIMATOR ────────────────────────────────────────────────────────
function estimateSaferOdds(originalOdds: number, newPick: string, newMarket: string): number {
  const np = newPick.toLowerCase()
  const nm = newMarket.toLowerCase()
  if (nm.includes('over/under')) {
    const num = parseFloat(np.replace(/[^0-9.]/g, ''))
    if (!isNaN(num)) {
      if (num <= 0.5) return 1.08
      if (num <= 1.5) return Math.max(1.10, parseFloat((1 + (originalOdds - 1) * 0.25).toFixed(2)))
      if (num <= 2.5) return Math.max(1.15, parseFloat((1 + (originalOdds - 1) * 0.45).toFixed(2)))
    }
  }
  if (nm.includes('double chance')) return Math.max(1.08, parseFloat((1 + (originalOdds - 1) * 0.35).toFixed(2)))
  if (nm.includes('gg') || nm.includes('both teams')) return Math.max(1.08, parseFloat((originalOdds * 0.6).toFixed(2)))
  return Math.max(1.08, parseFloat((1 + (originalOdds - 1) * 0.45).toFixed(2)))
}

// ─── FALLBACK CODE-BASED REPLACEMENT ──────────────────────────────────────
function codeBasedReplace(game: SportyBetGame): { replacePick: string; replaceMarket: string } | null {
  const market = game.market.toLowerCase().trim()
  const pick = game.pick.toLowerCase().trim()
  if (market.includes('over/under') && !market.includes('corner')) {
    const num = parseFloat(pick.replace(/[^0-9.]/g, ''))
    if (pick.startsWith('over') && !isNaN(num)) {
      if (num >= 3.5) return { replacePick: 'Over 2.5', replaceMarket: 'Over/Under' }
      if (num >= 2.5) return { replacePick: 'Over 1.5', replaceMarket: 'Over/Under' }
      if (num >= 1.5) return { replacePick: 'Over 0.5', replaceMarket: 'Over/Under' }
    }
  }
  if (market === '1x2' || market.includes('1x2')) {
    if (pick === 'home' || pick === '1') return { replacePick: 'Home/Draw', replaceMarket: 'Double Chance' }
    if (pick === 'away' || pick === '2') return { replacePick: 'Draw/Away', replaceMarket: 'Double Chance' }
    if (pick === 'draw' || pick === 'x') return { replacePick: 'Home/Draw', replaceMarket: 'Double Chance' }
  }
  if ((market === 'gg/ng' || market.includes('gg')) && pick === 'yes') return { replacePick: 'No', replaceMarket: 'GG/NG' }
  if (market.includes('2up')) {
    if (pick === 'home') return { replacePick: 'Home/Draw', replaceMarket: 'Double Chance' }
    if (pick === 'away') return { replacePick: 'Draw/Away', replaceMarket: 'Double Chance' }
  }
  if (market.includes('1up')) {
    if (pick === 'home') return { replacePick: 'Home', replaceMarket: '1X2' }
    if (pick === 'away') return { replacePick: 'Away', replaceMarket: '1X2' }
  }
  return null
}

// ─── AI ANALYSIS (per game, data-driven) ──────────────────────────────────
interface AIDecision {
  eventId: string
  keep: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore: number
  confidenceScore: number
  reason: string
  formSummary: string
  replacePick: string | null
  replaceMarket: string | null
  replacementReason: string | null
}

async function analyseGameWithAI(
  game: SportyBetGame,
  bsdData: string,
  sofaData: string,
  allowSwitching: boolean
): Promise<AIDecision> {
  const hasData = !!(bsdData || sofaData)
  const context = [bsdData, sofaData].filter(Boolean).join(' | ')

  // Available safer markets for this game based on current market
  const market = game.market.toLowerCase()
  const pick = game.pick.toLowerCase()
  let saferOptions = ''
  if (market === '1x2' || market.includes('1x2')) {
    saferOptions = 'Safer options: Home/Draw (Double Chance), Draw/Away (Double Chance), Home/Away (Double Chance)'
  } else if (market.includes('over/under')) {
    const num = parseFloat(pick.replace(/[^0-9.]/g, ''))
    if (!isNaN(num) && num >= 1.5) {
      saferOptions = `Safer options: Over ${num - 1} (Over/Under), Over ${num - 0.5} (Over/Under), Under ${num + 0.5} (Over/Under)`
    }
  } else if (market.includes('gg')) {
    saferOptions = 'Safer options: No (GG/NG), Home/Draw (Double Chance)'
  } else if (market.includes('2up')) {
    saferOptions = 'Safer options: Home/Draw (Double Chance), Draw/Away (Double Chance), Home (1X2 - 1UP)'
  } else if (market.includes('1up')) {
    saferOptions = 'Safer options: Home (1X2), Away (1X2), Home/Draw (Double Chance)'
  }

  const prompt = `You are an expert football betting analyst for Nigerian punters. Analyse this bet and decide: keep it or replace it with a smarter, safer pick.

MATCH: ${game.homeTeam} vs ${game.awayTeam}
LEAGUE: ${game.league}
CURRENT PICK: ${game.pick} (${game.market}) @ odds ${game.odds}
${hasData ? `STATS: ${context}` : 'STATS: No data available'}
${saferOptions ? saferOptions : ''}

RULES:
- If stats strongly support the current pick (strong form, H2H, prediction), KEEP it even if odds are high
- If stats are weak/against the pick OR no data, suggest the safest replacement
- replacePick and replaceMarket must be EXACT strings from the safer options listed above, or null
- Only replace with something genuinely safer (lower odds, higher probability)
- If already the safest possible pick (e.g. Over 0.5, Double Chance), set replacePick to null
- ${allowSwitching ? 'Replacement mode is ON — suggest a replacement if any doubt exists' : 'Replacement mode is OFF — set replacePick and replaceMarket to null'}

Return ONLY this JSON (no other text):
{"eventId":"${game.eventId}","keep":true,"riskLevel":"LOW","riskScore":3,"confidenceScore":72,"reason":"brief reason based on stats","formSummary":"key stat in 10 words","replacePick":null,"replaceMarket":null,"replacementReason":null}`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a JSON API. Output ONLY valid JSON. No markdown, no explanation.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.15,
      max_tokens: 200,
    })
    const raw = completion.choices[0]?.message?.content || ''
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean) as AIDecision
    return {
      ...parsed,
      riskLevel: (['LOW', 'MEDIUM', 'HIGH'].includes(parsed.riskLevel) ? parsed.riskLevel : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
      keep: hasData ? parsed.keep : true, // never remove if no data
    }
  } catch {
    // Fallback: code-based scoring
    const odds = game.odds
    const riskLevel = odds >= 3.5 ? 'HIGH' : odds >= 2.0 ? 'MEDIUM' : 'LOW'
    const confidenceScore = odds >= 3.5 ? 40 : odds >= 2.0 ? 58 : 72
    const replacement = allowSwitching ? codeBasedReplace(game) : null
    return {
      eventId: game.eventId,
      keep: true,
      riskLevel,
      riskScore: odds >= 3.5 ? 8 : odds >= 2.0 ? 5 : 2,
      confidenceScore,
      reason: hasData ? 'Kept based on available data' : 'No stats — kept by default',
      formSummary: 'Limited data',
      replacePick: replacement?.replacePick || null,
      replaceMarket: replacement?.replaceMarket || null,
      replacementReason: replacement ? 'Safer alternative available' : null,
    }
  }
}

// ─── FIND BEST COMBINATION ─────────────────────────────────────────────────
function findBestCombination(games: GameAnalysis[], targetOdds: number): GameAnalysis[] {
  if (games.length === 0) return games
  const currentTotal = games.reduce((acc, g) => acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)
  if (currentTotal <= targetOdds * 1.2) return games
  const sorted = [...games].sort((a, b) => a.confidenceScore - b.confidenceScore)
  let bestCombo = games
  let bestDiff = Math.abs(currentTotal - targetOdds)
  for (let removeCount = 1; removeCount < sorted.length - 1; removeCount++) {
    const candidate = sorted.slice(removeCount)
    const candidateOdds = candidate.reduce((acc, g) => acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)
    const diff = Math.abs(candidateOdds - targetOdds)
    if (diff < bestDiff) { bestDiff = diff; bestCombo = candidate }
    if (candidateOdds < targetOdds * 0.5) break
  }
  if (bestCombo.length < 2) bestCombo = sorted.slice(sorted.length - 2)
  return bestCombo
}

// ─── FETCH REAL ODDS FROM PROXY ────────────────────────────────────────────
async function fetchRealOddsFromProxy(
  games: Array<{ eventId: string; marketId: string; outcomeId: string }>
): Promise<Map<string, number>> {
  const oddsMap = new Map<string, number>()
  try {
    const res = await fetch(`${PROXY_URL}/outcomes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify(games.map(g => ({ ...g, specifier: null }))),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return oddsMap
    const data = await res.json()
    if (!data || data.bizCode !== 10000) return oddsMap
    for (const ev of (data.data || [])) {
      const outcome = ev.markets?.[0]?.outcomes?.[0]
      if (ev.eventId && outcome?.odds) oddsMap.set(ev.eventId, parseFloat(outcome.odds))
    }
  } catch { /* silent */ }
  return oddsMap
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────
export async function analyseSlip(
  games: SportyBetGame[],
  targetOdds: number,
  originalTotalOdds: number,
  allowSwitching: boolean = false,
  clientMarkets: Record<string, unknown> = {}
): Promise<SlipAnalysis> {

  // Gather BSD + Sofascore data for all games in parallel (capped at 20 concurrent)
  const isFootball = (g: SportyBetGame) =>
    !g.sport || g.sport.toLowerCase().includes('football') || g.sport.toLowerCase().includes('soccer')

  const dataMap = new Map<string, { bsd: string; sofa: string; dataSource: string }>()

  // Process in chunks of 10 to avoid hammering APIs
  const footballGames = games.filter(isFootball)
  for (let i = 0; i < footballGames.length; i += 10) {
    const chunk = footballGames.slice(i, i + 10)
    await Promise.all(chunk.map(async (g) => {
      const [bsd, sofa] = await Promise.all([
        getBSDData(g.homeTeam, g.awayTeam),
        getSofaData(g.homeTeam, g.awayTeam),
      ])
      const dataSource = bsd && sofa ? 'BSD+SOFASCORE' : bsd ? 'BSD' : sofa ? 'SOFASCORE' : 'AI_WEB_SEARCH'
      dataMap.set(g.eventId, { bsd, sofa, dataSource })
    }))
  }

  // Analyse each game with AI (in parallel, capped at 10 concurrent)
  const aiDecisions = new Map<string, AIDecision>()
  for (let i = 0; i < games.length; i += 10) {
    const chunk = games.slice(i, i + 10)
    await Promise.all(chunk.map(async (g) => {
      const d = dataMap.get(g.eventId) || { bsd: '', sofa: '', dataSource: 'AI_WEB_SEARCH' }
      const decision = await analyseGameWithAI(g, d.bsd, d.sofa, allowSwitching)
      aiDecisions.set(g.eventId, decision)
    }))
  }

  // Build final analysis results
  const analysisResults: GameAnalysis[] = games.map(game => {
    const decision = aiDecisions.get(game.eventId)
    const d = dataMap.get(game.eventId) || { bsd: '', sofa: '', dataSource: 'AI_WEB_SEARCH' }

    const baseResult: GameAnalysis = {
      ...game,
      riskLevel: decision?.riskLevel || 'MEDIUM',
      riskScore: decision?.riskScore || 5,
      confidenceScore: decision?.confidenceScore || 55,
      reason: decision?.reason || 'Kept by default',
      formSummary: decision?.formSummary || '',
      keep: decision?.keep !== false,
      dataSource: d.dataSource,
    }

    // Apply replacement
    if (allowSwitching && decision?.replacePick && decision?.replaceMarket) {
      const newPick = decision.replacePick
      const newMarket = decision.replaceMarket

      // Step 1: hardcoded map (guaranteed correct IDs)
      const hardcoded = resolvePickToIds(newPick, newMarket)

      // Step 2: smart replacement fallback
      const smart = !hardcoded ? getSmartReplacement(
        game.marketId, game.outcomeId, game.pick, game.market, game.odds
      ) : null

      // Step 3: availableMarkets fallback
      const resolved = !hardcoded && !smart && game.availableMarkets?.length
        ? resolveFromAvailableMarkets(game.availableMarkets, newPick, newMarket, game.odds)
        : null

      const finalMarketId = hardcoded?.marketId || smart?.marketId || resolved?.marketId || game.marketId
      const finalOutcomeId = hardcoded?.outcomeId || smart?.outcomeId || resolved?.outcomeId || game.outcomeId
      const finalPickDesc = smart?.pickDesc || newPick
      const finalMarketDesc = smart?.marketDesc || newMarket
      const finalOdds = resolved?.realOdds || estimateSaferOdds(game.odds, finalPickDesc, finalMarketDesc)

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
        replacementReason: decision.replacementReason || `Safer option based on match data`,
        marketId: finalMarketId,
        outcomeId: finalOutcomeId,
        specifier: null,
        needsResolution: !(hardcoded || smart || resolved),
      }
    }

    return baseResult
  })

  const aiKept = analysisResults.filter(g => g.keep)
  const aiRemoved = analysisResults.filter(g => !g.keep)
  let keptGames = findBestCombination(aiKept, targetOdds)

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

  // Fetch real odds for replaced picks
  const replacedGames = keptGames.filter(g => g.replaced)
  if (replacedGames.length > 0) {
    const realOddsMap = await fetchRealOddsFromProxy(
      replacedGames.map(g => ({ eventId: g.eventId, marketId: g.marketId, outcomeId: g.outcomeId }))
    )
    for (const game of keptGames) {
      if (game.replaced && realOddsMap.has(game.eventId)) {
        game.replacedOdds = realOddsMap.get(game.eventId)!
        game.odds = game.replacedOdds
      }
    }
  }

  const finalNewOdds = keptGames.reduce((acc, g) =>
    acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)

  const replacedCount = keptGames.filter(g => g.replaced).length

  let summary = `Analysed ${games.length} games. Kept ${keptGames.length} at ${finalNewOdds.toFixed(2)} odds (target: ${targetOdds}). Removed ${removedGames.length} risky picks${replacedCount > 0 ? `, replaced ${replacedCount} with smarter options` : ''}.`
  try {
    const sc = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Write short direct betting summaries for Nigerian punters. 2 sentences max.' },
        { role: 'user', content: `Analysed ${games.length} games, kept ${keptGames.length} at ${finalNewOdds.toFixed(2)} odds (target:${targetOdds}). Removed ${removedGames.length}. ${replacedCount > 0 ? `Replaced ${replacedCount} risky picks with smarter safer options based on form and H2H data.` : ''}` }
      ],
      temperature: 0.4,
      max_tokens: 80,
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