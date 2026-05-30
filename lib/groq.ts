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
  const overlap = (x: string, y: string) => normalize(x).includes(fw(y)) || normalize(y).includes(fw(x))
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
        return teamsMatch(
          ev.home_team as string || '',
          ev.away_team as string || '',
          homeTeam,
          awayTeam
        )
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
    f
      ? `${name}:[${f.form_string || '?'}] W${f.wins || 0}D${f.draws || 0}L${f.losses || 0} scored:${f.goals_scored_last_n || 0} conceded:${f.goals_conceded_last_n || 0} homePPG:${f.home_ppg || 0} awayPPG:${f.away_ppg || 0}`
      : `${name}:no form data`

  const fmtH2H = (h: Record<string, unknown> | null) =>
    h
      ? `H2H(${h.total_matches || 0}): ${homeTeam} wins:${h.home_wins || 0} draws:${h.draws || 0} ${awayTeam} wins:${h.away_wins || 0}`
      : 'H2H:no data'

  const fmtInjuries = (u: Record<string, unknown> | null) => {
    if (!u) return 'Injuries:no data'
    const fmtP = (arr: unknown[]) =>
      arr.map((p: unknown) => {
        const pl = p as Record<string, unknown>
        return `${pl.name}(${pl.status})`
      }).join(',')
    const h = (u.home as unknown[] || [])
    const a = (u.away as unknown[] || [])
    return `Injuries-Home:[${h.length ? fmtP(h) : 'none'}] Away:[${a.length ? fmtP(a) : 'none'}]`
  }

  const parts = [fmt(hf, homeTeam), fmt(af, awayTeam), fmtH2H(h2h), fmtInjuries(unavail)]
  if (pred) {
    parts.push(`BSD ML:${pred.predicted_result} Home:${pred.prob_home_win}% Draw:${pred.prob_draw}% Away:${pred.prob_away_win}%`)
  }
  return parts.join(' | ')
}

async function getSofaTeamId(name: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${SOFA_BASE}/search/teams/${encodeURIComponent(name)}`,
      { headers: sofaHeaders }
    )
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
    const res = await fetch(
      `${SOFA_BASE}/team/${teamId}/events/last/0`,
      { headers: sofaHeaders }
    )
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
      const opp = isHome
        ? ((ev.awayTeam as Record<string, unknown>)?.name || '?')
        : ((ev.homeTeam as Record<string, unknown>)?.name || '?')
      let r = 'D'
      if (scored > conceded) { r = 'W'; w++ }
      else if (scored < conceded) { r = 'L'; l++ }
      else d++
      return `${r}${scored}-${conceded}vs${opp}`
    })
    return `${teamName} last5:W${w}D${d}L${l} [${results.join(',')}]`
  } catch { return `${teamName}:no data` }
}

async function getSofaData(homeTeam: string, awayTeam: string): Promise<string | null> {
  try {
    const [homeId, awayId] = await Promise.all([
      getSofaTeamId(homeTeam),
      getSofaTeamId(awayTeam),
    ])
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
  const isFootball =
    !game.sport ||
    game.sport.toLowerCase().includes('football') ||
    game.sport.toLowerCase().includes('soccer')

  if (!isFootball) {
    return { game, context: '', dataSource: 'AI_WEB_SEARCH' }
  }

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

async function batchAnalyseGames(
  gameData: Array<{ game: SportyBetGame; context: string; dataSource: string }>,
  targetOdds: number
): Promise<Map<string, AnalysisResult>> {

  const gamesList = gameData.map((gd, i) => {
    const oddsTag = gd.game.odds >= 3.0 ? 'HIGH_ODDS' : gd.game.odds >= 2.0 ? 'MED_ODDS' : 'LOW_ODDS'
    const dataTag = gd.context ? gd.context : 'NO_DATA_AVAILABLE'
    return `GAME_${i + 1}|id:${gd.game.eventId}|${gd.game.homeTeam} vs ${gd.game.awayTeam}|${gd.game.league}|pick:"${gd.game.pick}"(${gd.game.market})|odds:${gd.game.odds}|${oddsTag}|${dataTag}`
  }).join('\n')

  const prompt = `You are a professional football betting analyst. Goal: profitable betting only.

CONFIDENCE THRESHOLDS:
- Odds 3.0+: Need 75%+ confidence to KEEP
- Odds 2.0-2.99: Need 60%+ confidence to KEEP
- Odds under 2.0: Need 55%+ confidence to KEEP
- NO_DATA_AVAILABLE: Max 35% confidence → always REMOVE
- When in doubt: REMOVE. Safety always first.

TARGET ODDS: ${targetOdds}

GAMES:
${gamesList}

Analyse each game. Think like a punter who wants to WIN.

Respond ONLY with a valid JSON array, one object per game in the SAME ORDER:
[{"eventId":"exact id","confidenceScore":<0-100>,"riskScore":<1-10>,"riskLevel":"<LOW|MEDIUM|HIGH>","keep":<true or false>,"reason":"<1-2 sentences>","formSummary":"<key data point>"}]`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.15,
    max_tokens: 4000,
  })

  const raw = completion.choices[0]?.message?.content || '[]'
  const cleaned = raw.replace(/```json|```/g, '').trim()

  const map = new Map<string, AnalysisResult>()

  try {
    const results = JSON.parse(cleaned) as AnalysisResult[]

    for (const r of results) {
      const gd = gameData.find(g => g.game.eventId === r.eventId)
      let keep = r.keep === true

      if (gd) {
        const minConf = gd.game.odds >= 3.0 ? 75 : gd.game.odds >= 2.0 ? 60 : 55
        if (r.confidenceScore < minConf) keep = false
        if (!gd.context) keep = false
      }

      map.set(r.eventId, { ...r, keep })
    }
  } catch {
    for (const gd of gameData) {
      const hasData = Boolean(gd.context)
      const lowOdds = gd.game.odds < 2.0
      map.set(gd.game.eventId, {
        eventId: gd.game.eventId,
        confidenceScore: hasData ? 55 : 30,
        riskScore: hasData ? 5 : 8,
        riskLevel: hasData ? 'MEDIUM' : 'HIGH',
        reason: hasData
          ? 'Analysis parse failed — kept cautiously due to low odds'
          : 'No data found — removed for safety',
        formSummary: gd.dataSource,
        keep: hasData && lowOdds,
      })
    }
  }

  return map
}

async function analyseNonFootballBatch(
  games: SportyBetGame[],
  targetOdds: number
): Promise<Map<string, AnalysisResult>> {

  const gamesList = games.map((g, i) =>
    `GAME_${i + 1}|id:${g.eventId}|${g.homeTeam} vs ${g.awayTeam}|${g.sport}|${g.league}|pick:"${g.pick}"(${g.market})|odds:${g.odds}`
  ).join('\n')

  const map = new Map<string, AnalysisResult>()

  try {
    const prompt = `You are a professional sports betting analyst. Research these matches and assess each pick.

Safety rule: confidence < 60% = REMOVE. Odds 3.0+ need 75%+ confidence.
TARGET ODDS: ${targetOdds}

GAMES:
${gamesList}

Respond ONLY with valid JSON array:
[{"eventId":"exact id","confidenceScore":<0-100>,"riskScore":<1-10>,"riskLevel":"<LOW|MEDIUM|HIGH>","keep":<true or false>,"reason":"<1-2 sentences>","formSummary":"<key finding>"}]`

    const completion = await groq.chat.completions.create({
      model: 'compound-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens: 2000,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const results = JSON.parse(cleaned) as AnalysisResult[]

    for (const r of results) {
      const game = games.find(g => g.eventId === r.eventId)
      const minConf = game && game.odds >= 3.0 ? 75 : 60
      map.set(r.eventId, { ...r, keep: r.confidenceScore >= minConf && r.keep === true })
    }
  } catch {
    for (const g of games) {
      map.set(g.eventId, {
        eventId: g.eventId,
        confidenceScore: 35,
        riskScore: 7,
        riskLevel: 'HIGH',
        reason: 'Could not research this match — removed for safety',
        formSummary: 'No data available',
        keep: false,
      })
    }
  }

  return map
}

function selectGamesToKeep(games: GameAnalysis[], targetOdds: number): GameAnalysis[] {
  let kept = games.filter(g => g.keep)
  const removed = games.filter(g => !g.keep)

  let total = kept.reduce((acc, g) => acc * g.odds, 1)

  if (total > targetOdds * 1.25 && kept.length > 2) {
    kept = [...kept].sort((a, b) => a.confidenceScore - b.confidenceScore)
    while (kept.length > 2 && total > targetOdds * 1.25) {
      kept = kept.slice(1)
      total = kept.reduce((acc, g) => acc * g.odds, 1)
    }
  }

  if (kept.length < 2) {
    const safest = [...removed].sort((a, b) => b.confidenceScore - a.confidenceScore)
    for (const g of safest) {
      if (kept.length >= 2) break
      kept.push(g)
    }
  }

  return kept
}

export async function analyseSlip(
  games: SportyBetGame[],
  targetOdds: number,
  originalTotalOdds: number
): Promise<SlipAnalysis> {

  const footballGames = games.filter(g =>
    !g.sport ||
    g.sport.toLowerCase().includes('football') ||
    g.sport.toLowerCase().includes('soccer')
  )
  const otherGames = games.filter(g =>
    g.sport &&
    !g.sport.toLowerCase().includes('football') &&
    !g.sport.toLowerCase().includes('soccer')
  )

  const footballData = await Promise.all(footballGames.map(g => gatherGameData(g)))
  const footballResults = await batchAnalyseGames(footballData, targetOdds)

  const otherResults = otherGames.length > 0
    ? await analyseNonFootballBatch(otherGames, targetOdds)
    : new Map<string, AnalysisResult>()

  const allResults = new Map<string, AnalysisResult>()
footballResults.forEach((v, k) => allResults.set(k, v))
otherResults.forEach((v, k) => allResults.set(k, v))
  const dataSourceMap = new Map(footballData.map(fd => [fd.game.eventId, fd.dataSource]))

  const analysisResults: GameAnalysis[] = games.map(game => {
    const result = allResults.get(game.eventId)
    const dataSource = dataSourceMap.get(game.eventId) || 'AI_WEB_SEARCH'

    if (!result) {
      return {
        ...game,
        confidenceScore: 30,
        riskScore: 8,
        riskLevel: 'HIGH' as const,
        reason: 'No analysis result — removed for safety',
        formSummary: 'Analysis error',
        keep: false,
        dataSource: 'FALLBACK',
      }
    }

    return {
      ...game,
      confidenceScore: result.confidenceScore,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      reason: result.reason,
      formSummary: result.formSummary,
      keep: result.keep,
      dataSource,
    }
  })

  const keptGames = selectGamesToKeep(analysisResults, targetOdds)
  const keptIds = new Set(keptGames.map(g => g.eventId))

  const finalGames = analysisResults.map(g => ({ ...g, keep: keptIds.has(g.eventId) }))
  const removedGames = finalGames.filter(g => !g.keep)
  const newOdds = keptGames.reduce((acc, g) => acc * g.odds, 1)

  let summary = `Analysed ${games.length} games. Kept ${keptGames.length} confident picks at ${newOdds.toFixed(2)} odds. Removed ${removedGames.length} low-confidence picks for safety.`

  try {
    const sc = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `2 sentences for a Nigerian punter. Analysed ${games.length} games, kept ${keptGames.length} at ${newOdds.toFixed(2)} odds (target:${targetOdds}). Removed:${removedGames.map(g => `${g.homeTeam} vs ${g.awayTeam}(${g.confidenceScore}%)`).join(',') || 'none'}. Be direct and professional.`,
      }],
      temperature: 0.4,
      max_tokens: 120,
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