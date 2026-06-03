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
  suggestReplacement?: boolean
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
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
    .replace(/:\s*'([^']*)'/g, ': "$1"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')

  return JSON.parse(slice)
}

async function batchAnalyse(
  gameData: Array<{ game: SportyBetGame; context: string; dataSource: string }>,
  targetOdds: number,
  allowSwitching: boolean
): Promise<Map<string, AnalysisResult>> {

  const gamesList = gameData.map((gd, i) => {
    const hasData = Boolean(gd.context)
    const dataNote = hasData ? gd.context : 'NO_STATS - keep unless pick is clearly wrong'
    const oddsNote = gd.game.odds >= 4.0 ? 'VERY_HIGH_ODDS' : gd.game.odds >= 2.5 ? 'HIGH_ODDS' : gd.game.odds >= 1.8 ? 'MEDIUM_ODDS' : 'LOW_ODDS'
    return `G${i + 1}|id:${gd.game.eventId}|${gd.game.homeTeam} vs ${gd.game.awayTeam}|${gd.game.league}|pick:"${gd.game.pick}"(${gd.game.market})|odds:${gd.game.odds}|${oddsNote}|${dataNote}`
  }).join('\n')

  const replacementNote = allowSwitching
    ? `REPLACEMENT MODE: For suggestReplacement - set true if the pick market has a safer equivalent available (e.g. Over 2.5 can become Over 1.5, Home Win can become Home/Draw Double Chance, Away Win can become Draw/Away). Set false only if the pick is already the safest in its category (e.g. Over 0.5, Double Chance already, Draw No Bet).`
    : `REMOVAL MODE: suggestReplacement=false for all.`

  const prompt = `You are a professional football punter. Analyse each match and provide honest assessments.

RULES:
- Missing stats = keep, give confidence 55-65, suggestReplacement based on market type
- Only set keep=false if data CLEARLY shows pick will lose
- Target odds: ${targetOdds}
- ${replacementNote}

MARKET REPLACEMENT GUIDE (for suggestReplacement):
- Over 2.5, Over 3.5, Over 4.5 = suggest replacement (step down line)
- Away Win (high odds) = suggest replacement (X2 double chance)  
- Home Win (uncertain form) = suggest replacement (1X double chance)
- Draw (risky) = suggest replacement (double chance)
- GG Yes (defensive teams) = suggest replacement (GG No or Under)
- 1UP, 2UP markets = suggest replacement (standard 1X2)
- Under 1.5, Under 0.5 = suggest replacement (Under 2.5)

GAMES:
${gamesList}

RESPOND WITH ONLY A JSON ARRAY. NO OTHER TEXT:
[{"eventId":"EXACT_ID","confidenceScore":NUMBER,"riskScore":NUMBER,"riskLevel":"LOW or MEDIUM or HIGH","keep":true or false,"reason":"brief reason","formSummary":"key stat","suggestReplacement":true or false}]`

  const map = new Map<string, AnalysisResult>()

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON API. Output ONLY valid JSON arrays. Never output text, markdown, or explanation. Always start with [ and end with ].'
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
      if (gd && !gd.context && !keep && r.confidenceScore > 30) keep = true

      map.set(r.eventId, {
        ...r,
        keep,
        suggestReplacement: r.suggestReplacement === true,
        riskLevel: (['LOW', 'MEDIUM', 'HIGH'].includes(r.riskLevel) ? r.riskLevel : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
      })
    }
  } catch (err) {
    console.error('AI batch analysis failed:', err)
    for (const gd of gameData) {
      const hasData = Boolean(gd.context)
      // In replacement mode, suggest replacement for common risky markets
      const market = gd.game.market.toLowerCase()
      const pick = gd.game.pick.toLowerCase()
      const suggestReplacement = allowSwitching && (
        (market.includes('over/under') && (pick.includes('over 2') || pick.includes('over 3') || pick.includes('over 4'))) ||
        (market === '1x2' && (pick === 'away' || pick === 'home')) ||
        (market.includes('gg') && pick === 'yes') ||
        market.includes('1up') || market.includes('2up')
      )
      map.set(gd.game.eventId, {
        eventId: gd.game.eventId,
        confidenceScore: hasData ? 65 : 55,
        riskScore: hasData ? 4 : 5,
        riskLevel: 'MEDIUM',
        reason: hasData ? 'Data found — keeping based on available statistics' : 'No stats — kept as missing data is not a removal reason',
        formSummary: hasData ? gd.dataSource : 'Small league',
        keep: true,
        suggestReplacement,
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

    if (diff < bestDiff) {
      bestDiff = diff
      bestCombo = candidate
    }
    if (candidateOdds < targetOdds * 0.5) break
  }

  if (bestCombo.length < 2) bestCombo = sorted.slice(sorted.length - 2)
  return bestCombo
}

export async function analyseSlip(
games: SportyBetGame[], targetOdds: number, originalTotalOdds: number, allowSwitching: boolean = false, clientMarkets: Record<string, unknown> = {}): Promise<SlipAnalysis> {

  const footballGames = games.filter(g =>
    !g.sport || g.sport.toLowerCase().includes('football') || g.sport.toLowerCase().includes('soccer')
  )
  const otherGames = games.filter(g =>
    g.sport && !g.sport.toLowerCase().includes('football') && !g.sport.toLowerCase().includes('soccer')
  )

  // Use client-side fetched markets (bypasses Vercel IP block)
  // Fall back to server-side fetch only if client didn't provide markets
  const buildEventMarketsMap = async () => {
    if (!allowSwitching) return new Map()
    
    const map = new Map()
    
    for (const game of games) {
      // Use client-provided markets first
      if (clientMarkets[game.eventId]) {
        const cm = clientMarkets[game.eventId] as Record<string, unknown>
        const rawMarkets = (cm.markets as unknown[]) || []
        
        const markets = rawMarkets.map((m: unknown) => {
          const market = m as Record<string, unknown>
          const rawOutcomes = (market.outcomes as unknown[]) || []
          const outcomes = rawOutcomes
            .map((o: unknown) => {
              const outcome = o as Record<string, unknown>
              return {
                id: String(outcome.id || ''),
                odds: parseFloat(String(outcome.odds || 1)),
                probability: parseFloat(String(outcome.probability || 0)),
                desc: String(outcome.desc || ''),
                isActive: outcome.isActive === 1 || outcome.isActive === true,
              }
            })
            .filter((o: { isActive: boolean; odds: number }) => o.isActive && o.odds > 1.0)

          return {
            id: String(market.id || ''),
            desc: String(market.desc || market.name || ''),
            name: String(market.name || market.desc || ''),
            group: String(market.group || 'Main'),
            outcomes,
          }
        }).filter((m: { outcomes: unknown[] }) => m.outcomes.length > 0)

        if (markets.length > 0) {
          map.set(game.eventId, {
            eventId: game.eventId,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            markets,
          })
        }
      } else {
        // Fallback to server-side fetch
        const serverMarkets = await fetchEventMarkets(game)
        if (serverMarkets) map.set(game.eventId, serverMarkets)
      }
    }
    
    return map
  }

  const [footballData, eventMarketsMap] = await Promise.all([
    Promise.all(footballGames.map(g => gatherGameData(g))),
    buildEventMarketsMap(),
  ])

  const footballResults = await batchAnalyse(footballData, targetOdds, allowSwitching)

  const otherResults = new Map<string, AnalysisResult>()
  if (otherGames.length > 0) {
    try {
      const gamesList = otherGames.map((g, i) =>
        `G${i + 1}|id:${g.eventId}|${g.homeTeam} vs ${g.awayTeam}|${g.sport}|${g.league}|pick:"${g.pick}"(${g.market})|odds:${g.odds}`
      ).join('\n')

      const completion = await groq.chat.completions.create({
        model: 'compound-beta',
        messages: [
          { role: 'system', content: 'You are a JSON API. Output ONLY valid JSON arrays.' },
          { role: 'user', content: `Research these matches. Missing data=keep. Target:${targetOdds}\n${gamesList}\n[{"eventId":"...","confidenceScore":0-100,"riskScore":1-10,"riskLevel":"LOW or MEDIUM or HIGH","keep":true or false,"reason":"...","formSummary":"...","suggestReplacement":true or false}]` }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      })

      const raw = completion.choices[0]?.message?.content || '[]'
      const results = extractJSON(raw)
      for (const r of results) {
        otherResults.set(r.eventId, { ...r, keep: r.keep === true })
      }
    } catch {
      for (const g of otherGames) {
        otherResults.set(g.eventId, {
          eventId: g.eventId, confidenceScore: 58, riskScore: 5,
          riskLevel: 'MEDIUM', reason: 'Unable to research — kept by default',
          formSummary: 'No data', keep: true, suggestReplacement: false,
        })
      }
    }
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
      formSummary: 'No stats',
      keep: true,
      dataSource: 'FALLBACK',
    }

    // Try replacement for ALL games in switching mode
    // when AI suggests it OR when it's a known risky market type
    const shouldTryReplacement = allowSwitching && (
      result?.suggestReplacement === true ||
      // Always try for these market types
      game.market.toLowerCase().includes('over/under') ||
      game.market.toLowerCase() === '1x2' ||
      game.market.toLowerCase().includes('gg') ||
      game.market.toLowerCase().includes('1up') ||
      game.market.toLowerCase().includes('2up')
    )

    if (shouldTryReplacement) {
      const eventMarkets = eventMarketsMap.get(game.eventId)
      if (eventMarkets) {
        const replacement = findSaferReplacement(
          eventMarkets, game.market, game.pick, game.odds
        )
        if (replacement) {
          return {
            ...baseResult,
            keep: true,
            replaced: true,
            replacedMarketId: replacement.marketId,
            replacedOutcomeId: replacement.outcomeId,
            replacedMarketDesc: replacement.marketDesc,
            replacedPick: replacement.pickDesc,
            replacedOdds: replacement.odds,
            replacementReason: replacement.reason,
          }
        }
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

  const newOdds = keptGames.reduce((acc, g) => {
    const odds = g.replaced ? (g.replacedOdds || g.odds) : g.odds
    return acc * odds
  }, 1)

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