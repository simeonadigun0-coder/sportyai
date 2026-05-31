import Groq from 'groq-sdk'
import { SportyBetGame, fetchEventMarkets, findSaferReplacement } from './sportybet'

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
  // For replacement mode
  replaced?: boolean
  replacedMarketId?: string
  replacedOutcomeId?: string
  replacedMarketDesc?: string
  replacedPick?: string
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

// ============ BSD ============
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
    f ? `${name}:[${f.form_string || '?'}] W${f.wins || 0}D${f.draws || 0}L${f.losses || 0} scored:${f.goals_scored_last_n || 0} conceded:${f.goals_conceded_last_n || 0} homePPG:${f.home_ppg || 0} awayPPG:${f.away_ppg || 0}`
      : `${name}:no form data`

  const fmtH2H = (h: Record<string, unknown> | null) =>
    h ? `H2H(${h.total_matches || 0}): ${homeTeam} wins:${h.home_wins || 0} draws:${h.draws || 0} ${awayTeam} wins:${h.away_wins || 0}`
      : 'H2H:no data'

  const fmtInj = (u: Record<string, unknown> | null) => {
    if (!u) return 'Injuries:no data'
    const fmt2 = (arr: unknown[]) => arr.map((p: unknown) => {
      const pl = p as Record<string, unknown>
      return `${pl.name}(${pl.status})`
    }).join(',')
    const h = (u.home as unknown[] || [])
    const a = (u.away as unknown[] || [])
    return `Injuries-Home:[${h.length ? fmt2(h) : 'none'}] Away:[${a.length ? fmt2(a) : 'none'}]`
  }

  const parts = [fmt(hf, homeTeam), fmt(af, awayTeam), fmtH2H(h2h), fmtInj(unavail)]
  if (pred) parts.push(`ML:${pred.predicted_result} H:${pred.prob_home_win}% D:${pred.prob_draw}% A:${pred.prob_away_win}%`)
  return parts.join(' | ')
}

// ============ SOFASCORE ============
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

// ============ GATHER DATA ============
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
}

// ============ BATCH AI ANALYSIS ============
async function batchAnalyse(
  gameData: Array<{ game: SportyBetGame; context: string; dataSource: string }>,
  targetOdds: number,
  allowSwitching: boolean
): Promise<Map<string, AnalysisResult>> {

  const gamesList = gameData.map((gd, i) => {
    const hasData = Boolean(gd.context)
    const dataNote = hasData ? gd.context : 'NO_STATS_AVAILABLE - do not remove based on this alone'
    const oddsNote = gd.game.odds >= 4.0 ? 'VERY_HIGH_ODDS' : gd.game.odds >= 2.5 ? 'HIGH_ODDS' : gd.game.odds >= 1.8 ? 'MEDIUM_ODDS' : 'LOW_ODDS_FAVOURITE'
    return `G${i + 1}|id:${gd.game.eventId}|${gd.game.homeTeam} vs ${gd.game.awayTeam}|${gd.game.league}|pick:"${gd.game.pick}"(${gd.game.market})|odds:${gd.game.odds}|${oddsNote}|${dataNote}`
  }).join('\n')

  const removalRule = allowSwitching
    ? `REPLACEMENT MODE: Flag risky picks for replacement but do not remove them. Keep=true for all unless pick is genuinely terrible with clear data evidence.`
    : `REMOVAL MODE: Only remove if form+H2H+injuries clearly show the pick is WRONG. Missing data (NO_STATS_AVAILABLE) is NOT a reason to remove — mark as keep=true with medium confidence. Remove only genuinely bad picks based on actual data.`

  const prompt = `You are a professional football punter with 20 years experience. Your goal is accurate, profitable betting.

CRITICAL RULES:
1. Missing stats (NO_STATS_AVAILABLE) = NEVER a removal reason. Keep the game, flag as unverified.
2. Only remove when data CLEARLY shows the pick is wrong (poor form, bad H2H, key injuries against the pick)
3. Favourites (LOW_ODDS) need a clear red flag to remove
4. High odds picks need strong data support to keep
5. Target odds: ${targetOdds} — keep enough games to land near this total
6. ${removalRule}

CONFIDENCE:
80-100: Strong data support → keep
60-79: Reasonable data → keep  
40-59: Uncertain but not clearly wrong → keep (flag)
20-39: Data clearly contradicts pick → remove
0-19: Definitive data against pick → definitely remove

GAMES:
${gamesList}

Respond ONLY valid JSON array, same order as input:
[{"eventId":"exact id","confidenceScore":<0-100>,"riskScore":<1-10>,"riskLevel":"<LOW|MEDIUM|HIGH>","keep":<true/false>,"reason":"<1-2 sentences referencing actual data, not missing data>","formSummary":"<decisive data point>"}]`

  const map = new Map<string, AnalysisResult>()

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens: 4000,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const results = JSON.parse(cleaned) as AnalysisResult[]

    for (const r of results) {
      // Safety: never remove based on missing data
      const gd = gameData.find(g => g.game.eventId === r.eventId)
      let keep = r.keep === true

      // If no data and was going to remove, override to keep
      if (gd && !gd.context && !keep && r.confidenceScore > 30) {
        keep = true
      }

      map.set(r.eventId, { ...r, keep })
    }
  } catch {
    // Fallback: keep everything, mark as medium confidence
    for (const gd of gameData) {
      map.set(gd.game.eventId, {
        eventId: gd.game.eventId,
        confidenceScore: gd.context ? 60 : 50,
        riskScore: gd.context ? 5 : 6,
        riskLevel: 'MEDIUM',
        reason: gd.context
          ? 'Analysis parse failed — kept based on available data'
          : 'No stats found — kept as missing data is not a removal reason',
        formSummary: gd.dataSource,
        keep: true,
      })
    }
  }

  return map
}

// ============ SMART ODDS TARGETING ============
function findBestCombination(games: GameAnalysis[], targetOdds: number): GameAnalysis[] {
  if (games.length === 0) return games

  const currentTotal = games.reduce((acc, g) => acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)

  // Already at or below target
  if (currentTotal <= targetOdds * 1.2) return games

  // Try removing lowest confidence games first to get close to target
  const sorted = [...games].sort((a, b) => a.confidenceScore - b.confidenceScore)

  let bestCombo = games
  let bestDiff = Math.abs(currentTotal - targetOdds)

  for (let removeCount = 1; removeCount < sorted.length - 1; removeCount++) {
    const candidate = sorted.slice(removeCount)
    const candidateOdds = candidate.reduce((acc, g) => acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)
    const diff = Math.abs(candidateOdds - targetOdds)

    if (diff < bestDiff) {
      bestDiff = diff
      bestCombo = candidate
    }

    // If we've gone too far below target, stop
    if (candidateOdds < targetOdds * 0.5) break
  }

  if (bestCombo.length < 2) {
    bestCombo = sorted.slice(sorted.length - 2)
  }

  return bestCombo
}

// ============ MAIN EXPORT ============
export async function analyseSlip(
  games: SportyBetGame[],
  targetOdds: number,
  originalTotalOdds: number,
  allowSwitching: boolean = false
): Promise<SlipAnalysis> {

  const footballGames = games.filter(g =>
    !g.sport || g.sport.toLowerCase().includes('football') || g.sport.toLowerCase().includes('soccer')
  )
  const otherGames = games.filter(g =>
    g.sport && !g.sport.toLowerCase().includes('football') && !g.sport.toLowerCase().includes('soccer')
  )

  // Step 1: Gather real data + fetch event markets (in parallel)
  const [footballData, eventMarketsMap] = await Promise.all([
    Promise.all(footballGames.map(g => gatherGameData(g))),
    allowSwitching
      ? Promise.all(games.map(async g => {
          const markets = await fetchEventMarkets(g)
          return [g.eventId, markets] as [string, typeof markets]
        })).then(pairs => new Map(pairs))
      : Promise.resolve(new Map()),
  ])

  // Step 2: Single batch AI call for all football games
  const footballResults = await batchAnalyse(footballData, targetOdds, allowSwitching)

  // Step 3: Non-football with web search
  const otherResults = new Map<string, AnalysisResult>()
  if (otherGames.length > 0) {
    try {
      const gamesList = otherGames.map((g, i) =>
        `G${i + 1}|id:${g.eventId}|${g.homeTeam} vs ${g.awayTeam}|${g.sport}|${g.league}|pick:"${g.pick}"(${g.market})|odds:${g.odds}`
      ).join('\n')

      const completion = await groq.chat.completions.create({
        model: 'compound-beta',
        messages: [{
          role: 'user',
          content: `Professional sports analyst. Research these matches. Missing data = keep game. Target odds: ${targetOdds}.\n${gamesList}\nJSON array: [{"eventId":"...","confidenceScore":<0-100>,"riskScore":<1-10>,"riskLevel":"<LOW|MEDIUM|HIGH>","keep":<bool>,"reason":"...","formSummary":"..."}]`
        }],
        temperature: 0.15,
        max_tokens: 2000,
      })

      const raw = completion.choices[0]?.message?.content || '[]'
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const results = JSON.parse(cleaned) as AnalysisResult[]
      for (const r of results) {
        otherResults.set(r.eventId, { ...r, keep: r.keep === true })
      }
    } catch {
      for (const g of otherGames) {
        otherResults.set(g.eventId, {
          eventId: g.eventId, confidenceScore: 55, riskScore: 5,
          riskLevel: 'MEDIUM', reason: 'Unable to research — kept by default',
          formSummary: 'No data', keep: true,
        })
      }
    }
  }

  // Step 4: Merge all results
  const allResults = new Map<string, AnalysisResult>()
  footballResults.forEach((v, k) => allResults.set(k, v))
  otherResults.forEach((v, k) => allResults.set(k, v))

  const dataSourceMap = new Map(footballData.map(fd => [fd.game.eventId, fd.dataSource]))

  // Step 5: Build analysis results + apply replacements if switching enabled
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
      confidenceScore: 50,
      riskScore: 5,
      riskLevel: 'MEDIUM',
      reason: 'Analysis unavailable — kept by default',
      formSummary: 'No result',
      keep: true,
      dataSource: 'FALLBACK',
    }

    // Apply replacement if switching mode and game has low confidence
    if (allowSwitching && result && result.confidenceScore < 75) {
      const eventMarkets = eventMarketsMap.get(game.eventId)
      if (eventMarkets) {
        const replacement = findSaferReplacement(
          eventMarkets,
          game.market,
          game.pick,
          game.odds
        )
        if (replacement) {
          return {
            ...baseResult,
            keep: true, // keep since we found a safer replacement
            replaced: true,
            replacedMarketId: replacement.marketId,
            replacedOutcomeId: replacement.outcomeId,
            replacedMarketDesc: replacement.marketDesc,
            replacedPick: replacement.pickDesc,
            replacedOdds: replacement.odds,
            replacementReason: `Original pick "${game.pick}" (${game.market}) at ${game.odds} odds had ${result.confidenceScore}% confidence. Replaced with safer "${replacement.pickDesc}" (${replacement.marketDesc}) at ${replacement.odds} odds.`,
          }
        }
      }
    }

    return baseResult
  })

  // Step 6: For remove mode — find combination closest to target odds
  const aiKept = analysisResults.filter(g => g.keep)
  const aiRemoved = analysisResults.filter(g => !g.keep)

  const keptGames = findBestCombination(aiKept, targetOdds)

  // Ensure minimum 2 games
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

  // For replaced games, use replaced odds for total calculation
  const newOdds = keptGames.reduce((acc, g) => {
    const odds = g.replaced ? (g.replacedOdds || g.odds) : g.odds
    return acc * odds
  }, 1)

  // Build kept games with replaced picks applied
  const finalKeptGames = keptGames.map(g => {
    if (g.replaced && g.replacedMarketId && g.replacedOutcomeId) {
      return {
        ...g,
        marketId: g.replacedMarketId,
        outcomeId: g.replacedOutcomeId,
        market: g.replacedMarketDesc || g.market,
        pick: g.replacedPick || g.pick,
        odds: g.replacedOdds || g.odds,
      }
    }
    return g
  })

  // Summary
  let summary = `Analysed ${games.length} games. Kept ${keptGames.length} at ${newOdds.toFixed(2)} odds (target: ${targetOdds}). Removed ${removedGames.length} picks based on data evidence.`
  try {
    const replacedCount = keptGames.filter(g => g.replaced).length
    const sc = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [{
        role: 'user',
        content: `2 sentences for a Nigerian punter. Analysed ${games.length} games, kept ${keptGames.length} at ${newOdds.toFixed(2)} odds (target:${targetOdds}). ${replacedCount > 0 ? `Replaced ${replacedCount} risky picks with safer options.` : ''} Removed:${removedGames.map(g => `${g.homeTeam}vs${g.awayTeam}(${g.confidenceScore}%)`).join(',') || 'none'}. Direct and professional.`
      }],
      temperature: 0.4,
      max_tokens: 120,
    })
    summary = sc.choices[0]?.message?.content || summary
  } catch { /* use default */ }

  return {
    games: finalGames,
    removedGames,
    keptGames: finalKeptGames,
    originalOdds: parseFloat(originalTotalOdds.toFixed(2)),
    newOdds: parseFloat(newOdds.toFixed(2)),
    targetOdds,
    summary,
  }
}