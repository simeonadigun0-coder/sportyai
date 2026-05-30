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
  confidenceScore: number // 0-100, higher = more confident to keep
  reason: string
  formSummary: string
  keep: boolean
  dataSource: 'BSD' | 'SOFASCORE' | 'BSD+SOFASCORE' | 'AI_WEB_SEARCH' | 'FALLBACK'
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

// ============ BSD HELPERS ============

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

function teamsMatch(bsdHome: string, bsdAway: string, searchHome: string, searchAway: string): boolean {
  const nBH = normalize(bsdHome)
  const nBA = normalize(bsdAway)
  const nSH = normalize(searchHome)
  const nSA = normalize(searchAway)

  const firstWord = (s: string) => s.split(' ')[0]
  const overlap = (a: string, b: string) =>
    a.includes(firstWord(b)) || b.includes(firstWord(a)) || firstWord(a) === firstWord(b)

  return overlap(nBH, nSH) && overlap(nBA, nSA)
}

async function getBSDEvent(homeTeam: string, awayTeam: string, kickoffTime: string): Promise<Record<string, unknown> | null> {
  const yesterday = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
  const nextTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  const searches = [
    homeTeam, homeTeam.split(' ')[0], awayTeam, awayTeam.split(' ')[0]
  ]

  for (const term of searches) {
    try {
      const url = `${BSD_BASE}/events/?team=${encodeURIComponent(term)}&date_from=${yesterday}&date_to=${nextTwoWeeks}&limit=50`
      const res = await fetch(url, { headers: bsdHeaders })
      if (!res.ok) continue
      const data = await res.json()
      const events: unknown[] = data.results || []

      const match = events.find((e: unknown) => {
        const ev = e as Record<string, unknown>
        return teamsMatch(ev.home_team as string || '', ev.away_team as string || '', homeTeam, awayTeam)
      })

      if (match) {
        const ev = match as Record<string, unknown>
        const detailRes = await fetch(`${BSD_BASE}/events/${ev.id}/`, { headers: bsdHeaders })
        if (!detailRes.ok) return ev
        return await detailRes.json()
      }
    } catch { continue }
  }
  return null
}

function parseBSDData(event: Record<string, unknown>, homeTeam: string, awayTeam: string): string {
  const hf = event.home_form as Record<string, unknown> | null
  const af = event.away_form as Record<string, unknown> | null
  const h2h = event.head_to_head as Record<string, unknown> | null
  const unavail = event.unavailable_players as Record<string, unknown> | null

  const fmtForm = (f: Record<string, unknown> | null, name: string) => {
    if (!f) return `${name}: No form data`
    return `${name}: Form[${f.form_string || '?'}] W${f.wins || 0} D${f.draws || 0} L${f.losses || 0} | Scored:${f.goals_scored_last_n || 0} Conceded:${f.goals_conceded_last_n || 0} | HomePPG:${f.home_ppg || 0} AwayPPG:${f.away_ppg || 0} | CleanSheets:${f.clean_sheets || 0}`
  }

  const fmtH2H = (h: Record<string, unknown> | null) => {
    if (!h) return 'H2H: No data'
    return `H2H(${h.total_matches || 0} matches): ${homeTeam} wins:${h.home_wins || 0} Draws:${h.draws || 0} ${awayTeam} wins:${h.away_wins || 0} AvgGoals:${h.avg_total_goals || 0}`
  }

  const fmtUnavail = (u: Record<string, unknown> | null) => {
    if (!u) return 'Injuries: No data'
    const home = (u.home as unknown[] || []).map((p: unknown) => {
      const pl = p as Record<string, unknown>
      return `${pl.name}(${pl.status})`
    }).join(', ')
    const away = (u.away as unknown[] || []).map((p: unknown) => {
      const pl = p as Record<string, unknown>
      return `${pl.name}(${pl.status})`
    }).join(', ')
    return `Injuries - Home missing: [${home || 'none'}] Away missing: [${away || 'none'}]`
  }

  const pred = event.prediction as Record<string, unknown> | null
  const predStr = pred
    ? `BSD Prediction: ${pred.predicted_result} | Home:${pred.prob_home_win}% Draw:${pred.prob_draw}% Away:${pred.prob_away_win}%`
    : ''

  return [fmtForm(hf, homeTeam), fmtForm(af, awayTeam), fmtH2H(h2h), fmtUnavail(unavail), predStr].filter(Boolean).join('\n')
}

// ============ SOFASCORE HELPERS ============

async function getSofascoreTeamId(teamName: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${SOFA_BASE}/search/teams/${encodeURIComponent(teamName)}`,
      { headers: sofaHeaders }
    )
    if (!res.ok) return null
    const data = await res.json()
    const teams: unknown[] = data.teams || []
    if (!teams.length) return null
    // Find best match
    const match = teams.find((t: unknown) => {
      const team = t as Record<string, unknown>
      return normalize(team.name as string || '').includes(normalize(teamName).split(' ')[0])
    }) as Record<string, unknown> | undefined
    const first = match || teams[0] as Record<string, unknown>
    return (first?.id as number) || null
  } catch { return null }
}

async function getSofascoreLastMatches(teamId: number): Promise<unknown[]> {
  try {
    const res = await fetch(
      `${SOFA_BASE}/team/${teamId}/events/last/0`,
      { headers: sofaHeaders }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.events || []).slice(-7) // last 7 matches
  } catch { return [] }
}

async function getSofascoreH2H(homeId: number, awayId: number): Promise<unknown[]> {
  try {
    // Find a recent event between these teams to get h2h
    const res = await fetch(
      `${SOFA_BASE}/team/${homeId}/events/last/0`,
      { headers: sofaHeaders }
    )
    if (!res.ok) return []
    const data = await res.json()
    const events: unknown[] = data.events || []

    // Find event involving both teams
    const sharedEvent = events.find((e: unknown) => {
      const ev = e as Record<string, unknown>
      const home = ev.homeTeam as Record<string, unknown>
      const away = ev.awayTeam as Record<string, unknown>
      return home?.id === awayId || away?.id === awayId
    }) as Record<string, unknown> | undefined

    if (!sharedEvent) return []

    const h2hRes = await fetch(
      `${SOFA_BASE}/event/${sharedEvent.id}/h2h`,
      { headers: sofaHeaders }
    )
    if (!h2hRes.ok) return []
    const h2hData = await h2hRes.json()
    return h2hData.events || []
  } catch { return [] }
}

function parseSofascoreForm(matches: unknown[], teamName: string): string {
  if (!matches.length) return `${teamName}: No recent matches found`

  const results = matches.map((e: unknown) => {
    const ev = e as Record<string, unknown>
    const homeTeam = ev.homeTeam as Record<string, unknown>
    const awayTeam = ev.awayTeam as Record<string, unknown>
    const homeScore = ev.homeScore as Record<string, unknown>
    const awayScore = ev.awayScore as Record<string, unknown>
    const isHome = normalize(homeTeam?.name as string || '').includes(normalize(teamName).split(' ')[0])

    const scored = isHome ? (homeScore?.current || 0) : (awayScore?.current || 0)
    const conceded = isHome ? (awayScore?.current || 0) : (homeScore?.current || 0)
    const opponent = isHome ? (awayTeam?.name || 'Unknown') : (homeTeam?.name || 'Unknown')

    let result = 'D'
    if (Number(scored) > Number(conceded)) result = 'W'
    else if (Number(scored) < Number(conceded)) result = 'L'

    return `${result}(${scored}-${conceded} vs ${opponent})`
  })

  const wins = results.filter(r => r.startsWith('W')).length
  const draws = results.filter(r => r.startsWith('D')).length
  const losses = results.filter(r => r.startsWith('L')).length

  return `${teamName} last ${matches.length}: W${wins} D${draws} L${losses} | ${results.slice(-5).join(', ')}`
}

function parseSofascoreH2H(h2hMatches: unknown[], homeTeam: string, awayTeam: string): string {
  if (!h2hMatches.length) return 'H2H: No previous meetings found'

  let homeWins = 0, awayWins = 0, draws = 0
  const recent = h2hMatches.slice(-5)

  for (const e of recent) {
    const ev = e as Record<string, unknown>
    const homeScore = ev.homeScore as Record<string, unknown>
    const awayScore = ev.awayScore as Record<string, unknown>
    const hS = Number(homeScore?.current || 0)
    const aS = Number(awayScore?.current || 0)

    const evHome = ev.homeTeam as Record<string, unknown>
    const isHomeTeamFirst = normalize(evHome?.name as string || '').includes(normalize(homeTeam).split(' ')[0])

    if (hS > aS) isHomeTeamFirst ? homeWins++ : awayWins++
    else if (aS > hS) isHomeTeamFirst ? awayWins++ : homeWins++
    else draws++
  }

  return `H2H last ${recent.length} meetings: ${homeTeam} wins:${homeWins} Draws:${draws} ${awayTeam} wins:${awayWins}`
}

async function getSofascoreData(homeTeam: string, awayTeam: string): Promise<string | null> {
  try {
    const [homeId, awayId] = await Promise.all([
      getSofascoreTeamId(homeTeam),
      getSofascoreTeamId(awayTeam),
    ])

    if (!homeId && !awayId) return null

    const [homeMatches, awayMatches, h2hMatches] = await Promise.all([
      homeId ? getSofascoreLastMatches(homeId) : Promise.resolve([]),
      awayId ? getSofascoreLastMatches(awayId) : Promise.resolve([]),
      homeId && awayId ? getSofascoreH2H(homeId, awayId) : Promise.resolve([]),
    ])

    if (!homeMatches.length && !awayMatches.length) return null

    const homeForm = parseSofascoreForm(homeMatches, homeTeam)
    const awayForm = parseSofascoreForm(awayMatches, awayTeam)
    const h2h = parseSofascoreH2H(h2hMatches, homeTeam, awayTeam)

    return [homeForm, awayForm, h2h].join('\n')
  } catch { return null }
}

// ============ CORE AI ANALYSIS ============

const PUNTER_SYSTEM_PROMPT = `You are a professional football betting analyst with 20+ years of experience. 
Your ONLY goal is to help bettors win money by identifying safe, high-confidence picks.

Your philosophy:
- When in doubt, REMOVE. Safety always comes first.
- A bet slip with fewer confident picks is ALWAYS better than one with many risky picks.
- High odds mean the bookmaker thinks it's unlikely — you need STRONG data evidence to keep high-odds picks.
- Low odds don't automatically mean safe — bad form can make even favourites dangerous.
- You think like a professional punter, not an optimist.`

async function runAIAnalysis(
  game: SportyBetGame,
  dataContext: string,
  dataSource: string
): Promise<{
  riskScore: number
  confidenceScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  formSummary: string
  keep: boolean
}> {
  const oddsWarning = game.odds >= 3.0
    ? `⚠️ HIGH ODDS WARNING: ${game.odds} — This means the bookmaker gives this pick less than ${Math.round(100 / game.odds)}% probability. You MUST have strong data evidence to keep this.`
    : game.odds >= 2.0
    ? `⚠️ MEDIUM ODDS: ${game.odds} — Moderate risk. Require solid form and H2H support to keep.`
    : `✅ LOW ODDS: ${game.odds} — Bookmaker favours this. Still verify with form data.`

  const prompt = `${PUNTER_SYSTEM_PROMPT}

MATCH TO ANALYSE:
${game.homeTeam} vs ${game.awayTeam}
League: ${game.league}
Pick on slip: "${game.pick}" (${game.market})
Odds: ${game.odds}
${oddsWarning}

DATA AVAILABLE (Source: ${dataSource}):
${dataContext}

ANALYSIS INSTRUCTIONS:
1. Examine the form of both teams carefully
2. Check H2H — who normally wins this fixture?
3. Consider injuries/suspensions if available
4. Evaluate if the pick matches what the data shows
5. For high odds (3.0+): Only keep if data STRONGLY supports it
6. For medium odds (2.0-2.99): Keep if data moderately supports it  
7. For low odds (under 2.0): Keep unless data shows a clear red flag

CONFIDENCE SCORING:
- 80-100: Very confident, KEEP — data strongly supports pick
- 60-79: Fairly confident, KEEP — data mostly supports pick
- 40-59: Uncertain, REMOVE — not enough confidence for a safe bet
- 0-39: Low confidence, REMOVE — data raises serious doubts

Remember: It is better to remove a pick and be safe than to keep it and lose the slip.

Respond ONLY in valid JSON (no markdown):
{
  "confidenceScore": <0-100>,
  "riskScore": <1-10, where 10=highest risk>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "keep": <true if confidenceScore >= 60, false otherwise>,
  "reason": "<2-3 sentences explaining your decision like a real punter, referencing actual data points>",
  "formSummary": "<1 sentence: the single most decisive data point that made your decision>"
}`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.15,
    max_tokens: 500,
  })

  try {
    const raw = completion.choices[0]?.message?.content || '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    // Safety override: if confidence < 60, force remove
    const keep = (result.confidenceScore >= 60) && (result.keep !== false)

    return {
      riskScore: result.riskScore || 5,
      confidenceScore: result.confidenceScore || 50,
      riskLevel: result.riskLevel || 'MEDIUM',
      reason: result.reason || 'Unable to assess',
      formSummary: result.formSummary || 'No summary',
      keep,
    }
  } catch {
    return {
      riskScore: 6,
      confidenceScore: 45,
      riskLevel: 'MEDIUM',
      reason: 'Analysis failed — removed as precaution',
      formSummary: 'Parse error',
      keep: false,
    }
  }
}

// ============ FOOTBALL ANALYSIS ============

async function analyseFootballGame(game: SportyBetGame): Promise<{
  riskScore: number
  confidenceScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  formSummary: string
  keep: boolean
  dataSource: 'BSD' | 'SOFASCORE' | 'BSD+SOFASCORE' | 'AI_WEB_SEARCH' | 'FALLBACK'
}> {
  let dataContext = ''
  let dataSource: 'BSD' | 'SOFASCORE' | 'BSD+SOFASCORE' | 'AI_WEB_SEARCH' | 'FALLBACK' = 'FALLBACK'

  // Layer 1: BSD
  const bsdEvent = await getBSDEvent(game.homeTeam, game.awayTeam, game.kickoffTime)
  if (bsdEvent) {
    dataContext = parseBSDData(bsdEvent, game.homeTeam, game.awayTeam)
    dataSource = 'BSD'
  }

  // Layer 2: Sofascore (always try, combine if BSD found too)
  const sofaData = await getSofascoreData(game.homeTeam, game.awayTeam)
  if (sofaData) {
    if (dataContext) {
      dataContext = `=== BSD DATA ===\n${dataContext}\n\n=== SOFASCORE DATA ===\n${sofaData}`
      dataSource = 'BSD+SOFASCORE'
    } else {
      dataContext = sofaData
      dataSource = 'SOFASCORE'
    }
  }

  // Layer 3: Web search if still no data
  if (!dataContext) {
    try {
      const webPrompt = `Search for current football data for this match:

Match: ${game.homeTeam} vs ${game.awayTeam}
League: ${game.league}
Pick: "${game.pick}" (${game.market})
Odds: ${game.odds}

Search specifically for:
1. "${game.homeTeam} last 5 matches results 2025 2026"
2. "${game.awayTeam} last 5 matches results 2025 2026"
3. "${game.homeTeam} vs ${game.awayTeam} head to head"
4. Any injuries or suspensions for either team
5. ${game.league} current standings

Then as a professional punter, decide: KEEP or REMOVE this pick?
High odds (${game.odds >= 3 ? 'YES - be extra cautious' : 'no'})

Respond ONLY in valid JSON:
{
  "confidenceScore": <0-100>,
  "riskScore": <1-10>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "keep": <true if confidence >= 60>,
  "reason": "<2-3 sentences based on what you found>",
  "formSummary": "<key finding>"
}`

      const completion = await groq.chat.completions.create({
        model: 'compound-beta',
        messages: [{ role: 'user', content: webPrompt }],
        temperature: 0.15,
        max_tokens: 600,
      })

      const raw = completion.choices[0]?.message?.content || '{}'
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const result = JSON.parse(cleaned)
      const keep = (result.confidenceScore >= 60) && (result.keep !== false)

      return {
        riskScore: result.riskScore || 6,
        confidenceScore: result.confidenceScore || 45,
        riskLevel: result.riskLevel || 'MEDIUM',
        reason: result.reason || 'Limited data found',
        formSummary: result.formSummary || 'Web search used',
        keep,
        dataSource: 'AI_WEB_SEARCH',
      }
    } catch {
      // No data at all — remove by default (safety first)
      return {
        riskScore: 7,
        confidenceScore: 30,
        riskLevel: 'HIGH',
        reason: 'No data found for this match. Removed for safety — better to skip uncertain picks.',
        formSummary: 'No data available anywhere',
        keep: false,
        dataSource: 'FALLBACK',
      }
    }
  }

  // Run AI analysis with combined data
  const analysis = await runAIAnalysis(game, dataContext, dataSource)
  return { ...analysis, dataSource }
}

// ============ NON-FOOTBALL ANALYSIS ============

async function analyseNonFootballGame(game: SportyBetGame): Promise<{
  riskScore: number
  confidenceScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  formSummary: string
  keep: boolean
  dataSource: 'AI_WEB_SEARCH' | 'FALLBACK'
}> {
  try {
    const oddsWarning = game.odds >= 3.0
      ? `HIGH ODDS WARNING: ${game.odds} — Need strong evidence to keep`
      : `Odds: ${game.odds}`

    const prompt = `You are a professional ${game.sport} betting analyst. Research this match thoroughly.

Match: ${game.homeTeam} vs ${game.awayTeam}
Sport: ${game.sport}
League: ${game.league}
Pick: "${game.pick}" (${game.market})
${oddsWarning}

Search for:
1. Current form and recent results for both teams
2. ${game.league} standings/rankings
3. Any injury news or suspensions
4. Head to head record

Professional punter rule: Only keep picks you are genuinely confident about.
If confidence < 60%, REMOVE for safety.

Respond ONLY in valid JSON:
{
  "confidenceScore": <0-100>,
  "riskScore": <1-10>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "keep": <true if confidence >= 60>,
  "reason": "<2-3 sentences>",
  "formSummary": "<key finding>"
}`

    const completion = await groq.chat.completions.create({
      model: 'compound-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens: 600,
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)
    const keep = (result.confidenceScore >= 60) && (result.keep !== false)

    return {
      riskScore: result.riskScore || 5,
      confidenceScore: result.confidenceScore || 50,
      riskLevel: result.riskLevel || 'MEDIUM',
      reason: result.reason || 'Unable to assess',
      formSummary: result.formSummary || 'Web search used',
      keep,
      dataSource: 'AI_WEB_SEARCH',
    }
  } catch {
    return {
      riskScore: 7,
      confidenceScore: 30,
      riskLevel: 'HIGH',
      reason: 'Could not find data — removed for safety.',
      formSummary: 'No data available',
      keep: false,
      dataSource: 'FALLBACK',
    }
  }
}

// ============ GAME SELECTION LOGIC ============

function selectGamesToKeep(
  games: GameAnalysis[],
  targetOdds: number,
  currentOdds: number
): GameAnalysis[] {

  // Step 1: Respect AI confidence decisions first
  // Remove anything AI said remove (confidence < 60)
  let kept = games.filter(g => g.keep)
  const aiRemoved = games.filter(g => !g.keep)

  // Step 2: If we still need to reduce odds further
  let currentTotal = kept.reduce((acc, g) => acc * g.odds, 1)

  if (currentTotal > targetOdds * 1.25 && kept.length > 2) {
    // Sort kept games by confidence ascending (least confident first for removal)
    kept = [...kept].sort((a, b) => a.confidenceScore - b.confidenceScore)

    // Remove least confident until we hit target
    while (kept.length > 2 && currentTotal > targetOdds * 1.25) {
      kept = kept.slice(1) // remove least confident
      currentTotal = kept.reduce((acc, g) => acc * g.odds, 1)
    }
  }

  // Step 3: Minimum 2 games rule
  if (kept.length < 2) {
    // Add back safest of the AI-removed games
    const safestRemoved = [...aiRemoved].sort((a, b) => b.confidenceScore - a.confidenceScore)
    for (const g of safestRemoved) {
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

  // Analyse ALL games in parallel
  const analysisResults: GameAnalysis[] = await Promise.all(
    games.map(async (game) => {
      const isFootball =
        !game.sport ||
        game.sport.toLowerCase().includes('football') ||
        game.sport.toLowerCase().includes('soccer')

      const analysis = isFootball
        ? await analyseFootballGame(game)
        : await analyseNonFootballGame(game)

      return {
        ...game,
        ...analysis,
      } as GameAnalysis
    })
  )

  const currentOdds = analysisResults.reduce((acc, g) => acc * g.odds, 1)
  const keptGames = selectGamesToKeep(analysisResults, targetOdds, currentOdds)
  const keptIds = new Set(keptGames.map(g => g.eventId))

  const finalGames = analysisResults.map(g => ({
    ...g,
    keep: keptIds.has(g.eventId),
  }))

  const removedGames = finalGames.filter(g => !g.keep)
  const newOdds = keptGames.reduce((acc, g) => acc * g.odds, 1)

  // Data quality summary
  const bsdCount = analysisResults.filter(g => g.dataSource === 'BSD' || g.dataSource === 'BSD+SOFASCORE').length
  const sofaCount = analysisResults.filter(g => g.dataSource === 'SOFASCORE' || g.dataSource === 'BSD+SOFASCORE').length
  const webCount = analysisResults.filter(g => g.dataSource === 'AI_WEB_SEARCH').length
  const fallbackCount = analysisResults.filter(g => g.dataSource === 'FALLBACK').length

  // Generate summary
  let summary = 'Analysis complete.'
  try {
    const summaryPrompt = `You are a professional betting analyst. Summarise this bet slip edit in 2-3 sentences for a Nigerian punter. Be direct, honest, and professional.

Original: ${games.length} games at ${originalTotalOdds} total odds.
After analysis: Kept ${keptGames.length} games at ${newOdds.toFixed(2)} odds. Target was ${targetOdds} odds.
Removed ${removedGames.length} picks: ${removedGames.map(g => `${g.homeTeam} vs ${g.awayTeam} (confidence: ${g.confidenceScore}%, reason: ${g.reason})`).join(' | ') || 'none'}
Data quality: ${bsdCount} games with BSD real data, ${sofaCount} with Sofascore, ${webCount} with web search, ${fallbackCount} with no data.

Mention: how many games were removed and the main reasons why.`

    const summaryCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: summaryPrompt }],
      temperature: 0.4,
      max_tokens: 200,
    })
    summary = summaryCompletion.choices[0]?.message?.content || summary
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