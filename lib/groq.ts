import Groq from 'groq-sdk'
import { SportyBetGame } from './sportybet'

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

// Estimate safer odds based on market type
function estimateSaferOdds(
  originalOdds: number,
  originalPick: string,
  newPick: string,
  newMarket: string
): number {
  const orig = originalPick.toLowerCase()
  const np = newPick.toLowerCase()
  const nm = newMarket.toLowerCase()

  // Over/Under step down
  if (nm.includes('over/under') || nm.includes('over') || nm.includes('under')) {
    const origNum = parseFloat(orig.replace(/[^0-9.]/g, ''))
    const newNum = parseFloat(np.replace(/[^0-9.]/g, ''))
    if (!isNaN(origNum) && !isNaN(newNum)) {
      const diff = origNum - newNum
      // Each 0.5 step down roughly halves the distance to 1.0
      const factor = Math.max(0.3, 1 - (diff * 0.25))
      return Math.max(1.05, parseFloat((1 + (originalOdds - 1) * factor).toFixed(2)))
    }
  }

  // Double Chance from 1X2
  if (nm.includes('double chance')) {
    return Math.max(1.05, parseFloat((1 + (originalOdds - 1) * 0.4).toFixed(2)))
  }

  // Draw No Bet
  if (nm.includes('draw no bet') || nm.includes('dnb')) {
    return Math.max(1.05, parseFloat((1 + (originalOdds - 1) * 0.6).toFixed(2)))
  }

  // GG No from GG Yes
  if (nm.includes('gg') || nm.includes('both teams')) {
    return Math.max(1.05, parseFloat((originalOdds * 0.65).toFixed(2)))
  }

  // Default: 50% reduction toward 1.0
  return Math.max(1.05, parseFloat((1 + (originalOdds - 1) * 0.5).toFixed(2)))
}

// Auto replacement rules based on market/pick/odds
function autoReplace(game: SportyBetGame, targetOdds: number, currentSlipOdds: number): {
  replacePick: string
  replaceMarket: string
} | null {
  const market = game.market.toLowerCase().trim()
  const pick = game.pick.toLowerCase().trim()
  const odds = game.odds

  // Only replace if it helps reach target OR if pick is genuinely risky
  const slipTooHigh = currentSlipOdds > targetOdds * 1.3
  const isRisky = odds >= 2.5

  if (!slipTooHigh && !isRisky) return null

  // Over/Under - step down the line
  if (market.includes('over/under') && !market.includes('corner')) {
    const num = parseFloat(pick.replace(/[^0-9.]/g, ''))
    if (pick.startsWith('over') && !isNaN(num)) {
      if (num >= 4.5) return { replacePick: 'Over 2.5', replaceMarket: 'Over/Under' }
      if (num >= 3.5) return { replacePick: 'Over 2.5', replaceMarket: 'Over/Under' }
      if (num >= 2.5 && odds > 1.4) return { replacePick: 'Over 1.5', replaceMarket: 'Over/Under' }
      if (num >= 1.5 && odds > 1.5) return { replacePick: 'Over 0.5', replaceMarket: 'Over/Under' }
    }
    if (pick.startsWith('under') && !isNaN(num)) {
      if (num <= 1.5) return { replacePick: 'Under 2.5', replaceMarket: 'Over/Under' }
    }
  }

  // 1X2 - replace with Double Chance
  if (market === '1x2') {
    if ((pick === 'home' || pick === '1') && odds >= 1.8) {
      return { replacePick: 'Home/Draw', replaceMarket: 'Double Chance' }
    }
    if ((pick === 'away' || pick === '2') && odds >= 1.6) {
      return { replacePick: 'Draw/Away', replaceMarket: 'Double Chance' }
    }
    if ((pick === 'draw' || pick === 'x') && odds >= 3.0) {
      return { replacePick: 'Home/Draw', replaceMarket: 'Double Chance' }
    }
  }

  // GG Yes - risky
  if ((market === 'gg/ng' || market.includes('gg')) && pick === 'yes' && odds >= 1.7) {
    return { replacePick: 'No', replaceMarket: 'GG/NG' }
  }

  // 2UP - step down
  if (market.includes('2up')) {
    if (pick === 'home') return { replacePick: 'Home/Draw', replaceMarket: 'Double Chance' }
    if (pick === 'away') return { replacePick: 'Draw/Away', replaceMarket: 'Double Chance' }
  }

  // 1UP - step down if risky odds
  if (market.includes('1up') && odds >= 1.8) {
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
    ? `REPLACE MODE: Current slip odds are ${currentSlipOdds.toFixed(2)}, target is ${targetOdds}. For risky picks suggest a safer replacement. Examples: Over2.5 becomes Over1.5, Away Win becomes Draw/Away Double Chance, Home Win becomes Home/Draw Double Chance. Set replacePick and replaceMarket fields. Use null if pick is already safe.`
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

      // If in replace mode and AI didn't suggest replacement, use auto rules
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

    // Apply replacement in switching mode
    if (allowSwitching && result?.replacePick && result?.replaceMarket) {
      const newPick = result.replacePick
      const newMarket = result.replaceMarket
      const estimatedOdds = estimateSaferOdds(game.odds, game.pick, newPick, newMarket)

      return {
        ...baseResult,
        keep: true,
        replaced: true,
        // Preserve original info for display
        originalPick: game.pick,
        originalMarket: game.market,
        originalOdds: game.odds,
        // New pick info for display
        replacedPick: newPick,
        replacedMarketDesc: newMarket,
        replacedOdds: estimatedOdds,
        replacementReason: result.reason || `Safer option: ${newPick} in ${newMarket}`,
        // IMPORTANT: Keep original marketId/outcomeId for booking
        // The booking uses original selection — replacement is advisory
        marketId: game.marketId,
        outcomeId: game.outcomeId,
      }
    }

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

  // Use estimated odds for replaced games in total calculation
  const newOdds = keptGames.reduce((acc, g) => {
    const odds = g.replaced ? (g.replacedOdds || g.odds) : g.odds
    return acc * odds
  }, 1)

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
    newOdds: parseFloat(newOdds.toFixed(2)),
    targetOdds,
    summary,
  }
}