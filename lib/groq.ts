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

// ============ HELPERS ============

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

function teamsMatch(a: string, b: string, c: string, d: string): boolean {
  const fw = (s: string) => normalize(s).split(' ')[0]
  const overlap = (x: string, y: string) => normalize(x).includes(fw(y)) || normalize(y).includes(fw(x))
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
    f ? `${name}: [${f.form_string || '?'}] W${f.wins || 0}D${f.draws || 0}L${f.losses || 0} scored:${f.goals_scored_last_n || 0} conceded:${f.goals_conceded_last_n || 0} homePPG:${f.home_ppg || 0} awayPPG:${f.away_ppg || 0}`
      : `${name}: no form data`

  const fmtH2H = (h: Record<string, unknown> | null) =>
    h ? `H2H(${h.total_matches || 0}): ${homeTeam} wins:${h.home_wins || 0} draws:${h.draws || 0} ${awayTeam} wins:${h.away_wins || 0}`
      : 'H2H: no data'

  const fmtInjuries = (u: Record<string, unknown> | null) => {
    if (!u) return 'Injuries: no data'
    const fmtP = (arr: unknown[]) => arr.map((p: unknown) => {
      const pl = p as Record<string, unknown>
      return `${pl.name}(${pl.status})`
    }).join(',')
    const h = (u.home as unknown[] || [])
    const a = (u.away as unknown[] || [])
    return `Injuries - Home:[${h.length ? fmtP(h) : 'none'}] Away:[${a.length ? fmtP(a) : 'none'}]`
  }

  const parts = [fmt(hf, homeTeam), fmt(af, awayTeam), fmtH2H(h2h), fmtInjuries(unavail)]
  if (pred) parts.push(`BSD ML: ${pred.predicted_result} Home:${pred.prob_home_win}% Draw:${pred.prob_draw}% Away:${pred.prob_away_win}%`)
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
    return ((match || teams[0]) as Record<string, unknown>)?.id as number || null
  } catch { return null }
}

async function getSofaForm(teamId: number, teamName: string): Promise<string> {
  try {
    const res = await fetch(`${SOFA_BASE}/team/${teamId}/events/last/0`, { headers: sofaHeaders })
    if (!res.ok) return `${teamName}: no data`
    const data = await res.json()
    const events = ((data.events || []) as unknown[]).slice(-5)
    if (!events.length) return `${teamName}: no recent matches`

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
    return `${teamName} last5: W${w}D${d}L${l} [${results.join(',')}]`
  } catch { return `${teamName}: no data` }
}

async function getSofaData(homeTeam: string, awayTeam: string): Promise<string | null> {
  try {
    const [homeId, awayId] = await Promise.all([getSofaTeamId(homeTeam), getSofaTeamId(awayTeam)])
    if (!homeId && !awayId) return null

    const [homeForm, awayForm] = await Promise.all([
      homeId ? getSofaForm(homeId, homeTeam) : Promise.resolve(`${homeTeam}: no data`),
      awayId ? getSofaForm(awayId, awayTeam) : Promise.resolve(`${awayTeam}: no data`),
    ])

    return `${homeForm} | ${awayForm}`
  } catch { return null }
}

// ============ GATHER DATA FOR ALL GAMES IN PARALLEL ============

async function gatherGameData(game: SportyBetGame): Promise<{
  game: SportyBetGame
  context: string
  dataSource: string
}> {
  const isFootball = !game.sport ||
    game.sport.toLowerCase().includes('football') ||
    game.sport.toLowerCase().includes('soccer')

  if (!isFootball) {
    return { game, context: 'Non-football sport - no database coverage', dataSource: 'AI_WEB_SEARCH' }
  }

  let context = ''
  let dataSource = 'FALLBACK'

  const [bsdEvent, sofaData] = await Promise.all([
    getBSDEvent(game.homeTeam, game.awayTeam),
    getSofaData(game.homeTeam, game.awayTeam),
  ])

  if (bsdEvent) {
    context += `BSD: ${parseBSD(bsdEvent, game.homeTeam, game.awayTeam)}`
    dataSource = 'BSD'
  }

  if (sofaData) {
    context += context ? ` | SOFA: ${sofaData}` : `SOFA: ${sofaData}`
    dataSource = bsdEvent ? 'BSD+SOFASCORE' : 'SOFASCORE'
  }

  if (!context) dataSource = 'AI_WEB_SEARCH'

  return { game, context, dataSource }
}

// ============ SINGLE BATCH AI CALL FOR ALL GAMES ============

async function batchAnalyseGames(
  gameData: Array<{ game: SportyBetGame; context: string; dataSource: string }>,
  targetOdds: number
): Promise<Map<string, { confidenceScore: number; riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string; formSummary: string; keep: boolean }>> {

  const gamesList = gameData.map((gd, i) => {
    const oddsWarning = gd.game.odds >= 3.0 ? '⚠️HIGH_ODDS' : gd.game.odds >= 2.0 ? 'MED_ODDS' : 'LOW_ODDS'
    return `GAME_${i + 1}|eventId:${gd.game.eventId}|${gd.game.homeTeam} vs ${gd.game.awayTeam}|${gd.game.league}|pick:"${gd.game.pick}"(${gd.game.market})|odds:${gd.game.odds}|${oddsWarning}|data:${gd.context || 'NO_DATA_AVAILABLE'}`
  }).join('\n')

  const prompt = `You are a professional football betting analyst. Your ONLY goal is profitable betting — remove ALL low-confidence picks.

RULES:
- Confidence 75-100%: KEEP — strong data support
- Confidence 60-74%: KEEP — reasonable support  
- Confidence 40-59%: REMOVE — not confident enough
- Confidence 0-39%: REMOVE — definitely not
- Odds 3.0+: Need 75%+ confidence to keep (high risk)
- Odds 2.0-2.99: Need 60%+ confidence to keep
- Odds under 2.0: Need 55%+ confidence to keep
- NO DATA available: Max 40% confidence → REMOVE
- When in doubt: REMOVE. Safety first always.

TARGET ODDS: ${targetOdds} (analyse all games, keep only those you are genuinely confident about)

GAMES TO ANALYSE:
${gamesList}

Analyse each game based on the data provided. Think like a punter who wants to WIN, not just to have many games.

Respond ONLY with a valid JSON array — one object per game in the SAME ORDER:
[
  {
    "eventId": "exact eventId from input",
    "confidenceScore": <0-100>,
    "riskScore": <1-10>,
    "riskLevel": "<LOW|MEDIUM|HIGH>",
    "keep": <true if confidenceScore meets odds threshold>,
    "reason": "<1-2 sentences referencing actual data>",
    "formSummary": "<single most decisive data point>"
  }
]`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.15,
    max_tokens: 4000,
  })

  const raw = completion.choices[0]?.message?.content || '[]'
  const cleaned = raw.replace(/```json|```/g, '').trim()

  try {
    const results = JSON.parse(cleaned) as Array<{
      eventId: string
      confidenceScore: number
      riskScore: number
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
      keep: boolean
      reason: string
      formSummary: string
    }>

    const map = new Map<string, typeof results[0]>()
    for (const r of results) {
      // Safety override: enforce odds-based confidence thresholds
      const game = gameData.find(gd => gd.game.eventId === r.eventId)
      let keep = r.keep

      if (game) {
        const minConfidence = game.game.odds >= 3.0 ? 75 : game.game.odds >= 2.0 ? 60 : 55
        if (r.confidenceScore < minConfidence) keep = false
        if (!game.context || game.context === 'NO_DATA_AVAILABLE') keep = false
      }

      map.set(r.eventId, { ...r, keep })
    }
    return map
  } catch {
    // Fallback: conservative — remove anything without data
    const map = new Map<string, { confidenceScore: number; riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string; formSummary: string; keep: boolean }>()
    for (const gd of gameData) {
      const hasData = gd.context && gd.context !== 'NO_DATA_AVAILABLE'
      map.set(gd.game.eventId, {
        confidenceScore: hasData ? 55 : 30,
        riskScore: hasData ? 5 : 8,
        riskLevel: hasData ? 'MEDIUM' : 'HIGH',
        reason: hasData ? 'Analysis parse failed — kept cautiously' : 'No data found — removed for safety',
        formSummary: gd.dataSource,
        keep: hasData && gd.game.odds < 2.0,
      })
    }
    return map
  }
}

// ============ NON-FOOTBALL WEB SEARCH ============

async function analyseNonFootballBatch(
  games: SportyBetGame[],
  targetOdds: number
): Promise<Map<string, { confidenceScore: number; riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string; formSummary: string; keep: boolean }>> {

  const gamesList = games.map((g, i) =>
    `GAME_${i + 1}|eventId:${g.eventId}|${g.homeTeam} vs ${g.awayTeam}|${g.sport}|${g.league}|pick:"${g.pick}"(${g.market})|odds:${g.odds}`
  ).join('\n')

  const prompt = `You are a professional sports betting analyst. Research these ${games[0]?.sport || 'sports'} matches and assess each pick.

Search for recent form, standings, and any relevant news for each match.
Safety rule: confidence < 60% = REMOVE. High odds (3.0+) need 75%+ confidence.

GAMES:
${gamesList}

Respond ONLY with valid JSON array:
[{"eventId":"...","confidenceScore":<0-100>,"riskScore":<1-10>,"riskLevel":"<LOW|MEDIUM|HIGH>","keep":<bool>,"reason":"<1-2 sentences>","formSummary":"<key finding>"}]`

  try {
    const completion = await groq.chat.completions.create({
      model: 'compound-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens: 2000,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const results = JSON.parse(cleaned) as Array<{
      eventId: string; confidenceScore: number; riskScore: number
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; keep: boolean; reason: string; formSummary: string
    }>

    const map = new Map<string, typeof results[0]>()
    for (const r of results) {
      const game = games.find(g => g.eventId === r.eventId)
      const minConf = game && game.odds >= 3.0 ? 75 : 60
      map.set(r.eventId, { ...r, keep: r.confidenceScore >= minConf && r.keep })
    }
    return map
  } catch {
    const map = new Map<string, { confidenceScore: number; riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string; formSummary: string; keep: boolean }>()
    for (const g of games) {
      map.set(g.eventId, {
        confidenceScore: 40,
        riskScore: 7,
        riskLevel: 'HIGH',
        reason: 'Could not research this match — removed for safety',
        formSummary: 'No data',
        keep: false,
      })
    }
    return map
  }
}

// ============ GAME SELECTION ============

function selectGamesToKeep(games: GameAnalysis[], targetOdds: number): GameAnalysis[] {
  let kept = games.filter(g => g.keep)
  const removed = games.filter(g => !g.keep)

  let total = kept.reduce((acc, g) => acc * g.odds, 1)

  // Still above target — remove lowest confidence first
  if (total > targetOdds * 1.25 && kept.length > 2) {
    kept = [...kept].sort((a, b) => a.confidenceScore - b.confidenceScore)
    while (kept.length > 2 && total > targetOdds * 1.25) {
      kept = kept.slice(1)
      total = kept.reduce((acc, g) => acc * g.odds, 1)
    }
  }

  // Minimum 2 games
  if (kept.length < 2) {
    const safest = [...removed].sort((a, b) => b.confidenceScore - a.confidenceScore)
    for (const g of safest) {
      if (kept.length >= 2) break
      kept.push(g)
    }
  }

  return kept
}

// ============ MAIN EXPORT ============

export async function analyseSlip(
  games: SportyBetGame[],
  targetOdds: number,
  originalTotalOdds: number
): Promise<SlipAnalysis> {

  const footballGames = games.filter(g =>
    !g.sport || g.sport.toLowerCase().includes('football') || g.sport.toLowerCase().includes('soccer')
  )
  const otherGames = games.filter(g =>
    g.sport && !g.sport.toLowerCase().includes('football') && !g.sport.toLowerCase().includes('soccer')
  )

  // Step 1: Gather data for all football games in parallel (no AI yet)
  const footballData = await Promise.all(footballGames.map(g => gatherGameData(g)))

  // Step 2: Single AI call for ALL football games at once
  const footballResults = await batchAnalyseGames(footballData, targetOdds)

  // Step 3: Single AI call for non-football games
  const otherResults = otherGames.length > 0
    ? await analyseNonFootballBatch(otherGames, targetOdds)
    : new Map()

  // Step 4: Merge results
  const allResults = new Map([...footballResults, ...otherResults])
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
        formSummary: 'Error in analysis',
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

  // Summary — one small call
  let summary = `Analysed ${games.length} games. Kept ${keptGames.length} confident picks at ${newOdds.toFixed(2)} odds. Removed ${removedGames.length} low-confidence picks for safety.`
  try {
    const sc = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `2 sentences for a Nigerian punter: Analysed ${games.length} games, kept ${keptGames.length} at ${newOdds.toFixed(2)} odds (target: ${targetOdds}). Removed: ${removedGames.map(g => `${g.homeTeam} vs ${g.awayTeam}(${g.confidenceScore}% confidence)`).join(', ') || 'none'}. Be direct and professional.`
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