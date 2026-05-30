import Groq from 'groq-sdk'
import { SportyBetGame } from './sportybet'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const BSD_BASE = 'https://sports.bzzoiro.com/api'

const bsdHeaders = {
  'Authorization': `Token ${BSD_TOKEN}`,
  'Content-Type': 'application/json',
}

export interface GameAnalysis extends SportyBetGame {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore: number
  reason: string
  formSummary: string
  keep: boolean
  dataSource: 'BSD' | 'AI_WEB_SEARCH' | 'FALLBACK'
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

// --- BSD helpers ---

async function searchBSDEvent(homeTeam: string, awayTeam: string, kickoffTime: string): Promise<Record<string, unknown> | null> {
  try {
    // Search by team name — try home team first
    const dateStr = kickoffTime
      ? new Date(parseInt(kickoffTime)).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    const url = `${BSD_BASE}/events/?team=${encodeURIComponent(homeTeam)}&date_from=${yesterday}&date_to=${nextWeek}&limit=20`
    const res = await fetch(url, { headers: bsdHeaders })
    if (!res.ok) return null

    const data = await res.json()
    const events: unknown[] = data.results || []

    // Find matching event
    const match = events.find((e: unknown) => {
      const ev = e as Record<string, unknown>
      const home = (ev.home_team as string || '').toLowerCase()
      const away = (ev.away_team as string || '').toLowerCase()
      const searchHome = homeTeam.toLowerCase()
      const searchAway = awayTeam.toLowerCase()
      return (
        (home.includes(searchHome.split(' ')[0]) || searchHome.includes(home.split(' ')[0])) &&
        (away.includes(searchAway.split(' ')[0]) || searchAway.includes(away.split(' ')[0]))
      )
    })

    if (!match) return null

    // Get full event detail with form and H2H
    const ev = match as Record<string, unknown>
    const detailRes = await fetch(`${BSD_BASE}/events/${ev.id}/`, { headers: bsdHeaders })
    if (!detailRes.ok) return ev
    return await detailRes.json()

  } catch {
    return null
  }
}

async function getBSDStandings(leagueName: string): Promise<Record<string, unknown> | null> {
  try {
    // Find the league
    const leagueRes = await fetch(`${BSD_BASE}/leagues/`, { headers: bsdHeaders })
    if (!leagueRes.ok) return null
    const leagueData = await leagueRes.json()
    const leagues: unknown[] = leagueData.results || []

    const league = leagues.find((l: unknown) => {
      const lg = l as Record<string, unknown>
      const name = (lg.name as string || '').toLowerCase()
      const search = leagueName.toLowerCase()
      return name.includes(search.split(' ')[0]) || search.includes(name.split(' ')[0])
    })

    if (!league) return null
    const lg = league as Record<string, unknown>

    // Get standings
    const standingsRes = await fetch(`${BSD_BASE}/leagues/${lg.id}/standings/`, { headers: bsdHeaders })
    if (!standingsRes.ok) return null
    return await standingsRes.json()

  } catch {
    return null
  }
}

function formatFormData(form: Record<string, unknown> | null | undefined, teamName: string): string {
  if (!form) return `No form data available for ${teamName}`

  const formString = form.form_string as string || ''
  const w = form.wins as number || 0
  const d = form.draws as number || 0
  const l = form.losses as number || 0
  const gScored = form.goals_scored_last_n as number || 0
  const gConceded = form.goals_conceded_last_n as number || 0
  const homePPG = form.home_ppg as number || 0
  const awayPPG = form.away_ppg as number || 0
  const cleanSheets = form.clean_sheets as number || 0

  return `${teamName}: Form ${formString} (W${w} D${d} L${l}), scored ${gScored}, conceded ${gConceded}, ${cleanSheets} clean sheets, Home PPG: ${homePPG}, Away PPG: ${awayPPG}`
}

function formatH2H(h2h: Record<string, unknown> | null | undefined, homeTeam: string, awayTeam: string): string {
  if (!h2h) return 'No head-to-head data available'

  const total = h2h.total_matches as number || 0
  const homeWins = h2h.home_wins as number || 0
  const draws = h2h.draws as number || 0
  const awayWins = h2h.away_wins as number || 0
  const avgGoals = h2h.avg_total_goals as number || 0

  return `H2H (${total} meetings): ${homeTeam} wins: ${homeWins}, Draws: ${draws}, ${awayTeam} wins: ${awayWins}, Avg goals: ${avgGoals}`
}

function formatUnavailable(unavailable: Record<string, unknown> | null | undefined): string {
  if (!unavailable) return 'No injury/suspension data'

  const home = (unavailable.home as unknown[]) || []
  const away = (unavailable.away as unknown[]) || []

  const formatPlayers = (players: unknown[]) =>
    players.map((p: unknown) => {
      const player = p as Record<string, unknown>
      return `${player.name} (${player.status})`
    }).join(', ')

  const homeMissing = home.length ? `Home missing: ${formatPlayers(home)}` : ''
  const awayMissing = away.length ? `Away missing: ${formatPlayers(away)}` : ''

  return [homeMissing, awayMissing].filter(Boolean).join(' | ') || 'All players available'
}

// --- Main Analysis Functions ---

async function analyseFootballGame(game: SportyBetGame): Promise<{
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  formSummary: string
  dataSource: 'BSD' | 'AI_WEB_SEARCH' | 'FALLBACK'
}> {
  // Step 1: Try BSD first
  const bsdEvent = await searchBSDEvent(game.homeTeam, game.awayTeam, game.kickoffTime)

  if (bsdEvent) {
    // We have real BSD data — build rich context for AI
    const homeForm = bsdEvent.home_form as Record<string, unknown> | null
    const awayForm = bsdEvent.away_form as Record<string, unknown> | null
    const h2h = bsdEvent.head_to_head as Record<string, unknown> | null
    const unavailable = bsdEvent.unavailable_players as Record<string, unknown> | null

    const homeFormStr = formatFormData(homeForm, game.homeTeam)
    const awayFormStr = formatFormData(awayForm, game.awayTeam)
    const h2hStr = formatH2H(h2h, game.homeTeam, game.awayTeam)
    const unavailableStr = formatUnavailable(unavailable)

    // BSD ML prediction
    const mlPrediction = bsdEvent.prediction as Record<string, unknown> | null
    const mlStr = mlPrediction
      ? `BSD ML Prediction: ${mlPrediction.predicted_result} (Home: ${mlPrediction.prob_home_win}%, Draw: ${mlPrediction.prob_draw}%, Away: ${mlPrediction.prob_away_win}%)`
      : ''

    const prompt = `You are an expert football punter with 20 years of experience. Analyse this match and give your honest assessment.

MATCH: ${game.homeTeam} vs ${game.awayTeam}
LEAGUE: ${game.league}
PICK ON SLIP: ${game.pick} (${game.market})

REAL DATA:
${homeFormStr}
${awayFormStr}
${h2hStr}
UNAVAILABLE PLAYERS: ${unavailableStr}
${mlStr}

As an experienced punter, assess this pick honestly:
1. Does the recent form support this pick?
2. Does the H2H record support this pick?
3. Are key players missing that affect this pick?
4. Would you personally back this pick based on the data?

IMPORTANT: Your decision must be based on the DATA above, NOT the odds.
Be a real punter — if the data supports the pick even at high odds, say KEEP.
If the data shows this pick is risky even at low odds, say REMOVE.

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "riskScore": <number 1-10, where 1=very confident keep, 10=must remove>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "keep": <true or false>,
  "reason": "<1-2 sentences explaining your punter decision based on the actual data>",
  "formSummary": "<brief 1 sentence summary of key data points that influenced your decision>"
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 400,
    })

    try {
      const raw = completion.choices[0]?.message?.content || '{}'
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const result = JSON.parse(cleaned)
      return {
        riskScore: result.riskScore || 5,
        riskLevel: result.riskLevel || 'MEDIUM',
        reason: result.reason || 'Unable to assess',
        formSummary: result.formSummary || homeFormStr,
        dataSource: 'BSD',
      }
    } catch {
      return {
        riskScore: 5,
        riskLevel: 'MEDIUM',
        reason: 'BSD data found but analysis failed',
        formSummary: homeFormStr,
        dataSource: 'BSD',
      }
    }
  }

  // Step 2: BSD not found — use Groq web search as fallback
  try {
    const prompt = `You are an expert football punter with 20 years of experience. Search for current information about this match and give your honest assessment.

MATCH: ${game.homeTeam} vs ${game.awayTeam}
LEAGUE: ${game.league}
PICK ON SLIP: ${game.pick} (${game.market})

Search the web for:
1. Recent form of both teams (last 5 matches)
2. Any injury or suspension news
3. Head-to-head record
4. Any relevant match context

As an experienced punter, assess this pick honestly based on what you find.
Your decision must NOT be based on odds — only on form, H2H, and match context.

Respond ONLY in this exact JSON format:
{
  "riskScore": <number 1-10>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "keep": <true or false>,
  "reason": "<1-2 sentences based on what you found>",
  "formSummary": "<brief summary of what you found>"
}`

    const completion = await groq.chat.completions.create({
      model: 'compound-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return {
      riskScore: result.riskScore || 5,
      riskLevel: result.riskLevel || 'MEDIUM',
      reason: result.reason || 'Unable to assess',
      formSummary: result.formSummary || 'Web search used',
      dataSource: 'AI_WEB_SEARCH',
    }
  } catch {
    return {
      riskScore: 5,
      riskLevel: 'MEDIUM',
      reason: 'Could not find data for this match',
      formSummary: 'No data available',
      dataSource: 'FALLBACK',
    }
  }
}

async function analyseNonFootballGame(game: SportyBetGame): Promise<{
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  formSummary: string
  dataSource: 'AI_WEB_SEARCH' | 'FALLBACK'
}> {
  try {
    const prompt = `You are an expert ${game.sport} betting analyst. Search for current information about this match.

MATCH: ${game.homeTeam} vs ${game.awayTeam}
SPORT: ${game.sport}
LEAGUE: ${game.league}
PICK ON SLIP: ${game.pick} (${game.market})

Search for recent form, standings, injuries, and any relevant news.
Make your decision based on data and punter intuition — NOT based on odds.

Respond ONLY in this exact JSON format:
{
  "riskScore": <number 1-10>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "keep": <true or false>,
  "reason": "<1-2 sentences based on what you found>",
  "formSummary": "<brief summary of key findings>"
}`

    const completion = await groq.chat.completions.create({
      model: 'compound-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return {
      riskScore: result.riskScore || 5,
      riskLevel: result.riskLevel || 'MEDIUM',
      reason: result.reason || 'Unable to assess',
      formSummary: result.formSummary || 'Web search used',
      dataSource: 'AI_WEB_SEARCH',
    }
  } catch {
    return {
      riskScore: 5,
      riskLevel: 'MEDIUM',
      reason: 'Could not find data for this match',
      formSummary: 'No data available',
      dataSource: 'FALLBACK',
    }
  }
}

function selectGamesToRemove(
  games: GameAnalysis[],
  targetOdds: number,
  currentOdds: number
): GameAnalysis[] {
  if (currentOdds <= targetOdds * 1.3) {
    // Already close to target — keep all, just mark by confidence
    return games
  }

  // Sort by riskScore descending — highest risk first
  const sorted = [...games].sort((a, b) => b.riskScore - a.riskScore)

  let kept = [...sorted]

  // Remove games AI explicitly said to remove first
  const aiRemoved = sorted.filter(g => !g.keep)
  const aiKept = sorted.filter(g => g.keep)

  // Start with AI kept games
  kept = aiKept

  // Check if we're now at or below target
  let currentTotal = kept.reduce((acc, g) => acc * g.odds, 1)

  // If still above target, remove more from the risky end of kept games
  while (kept.length > 2 && currentTotal > targetOdds * 1.3) {
    kept = kept.slice(0, kept.length - 1)
    currentTotal = kept.reduce((acc, g) => acc * g.odds, 1)
  }

  // If we removed too many and kept too few, add back some AI-removed games (lowest risk first)
  const removedSorted = aiRemoved.sort((a, b) => a.riskScore - b.riskScore)
  for (const game of removedSorted) {
    if (kept.length >= 2) break
    kept.push(game)
  }

  return kept
}

export async function analyseSlip(
  games: SportyBetGame[],
  targetOdds: number,
  originalTotalOdds: number
): Promise<SlipAnalysis> {

  // Analyse ALL games in parallel
  const analysisResults: GameAnalysis[] = await Promise.all(
    games.map(async (game) => {
      const isFootball = game.sport?.toLowerCase().includes('football') ||
        game.sport?.toLowerCase().includes('soccer') ||
        !game.sport // default to football

      const analysis = isFootball
        ? await analyseFootballGame(game)
        : await analyseNonFootballGame(game)

      return {
        ...game,
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        reason: analysis.reason,
        formSummary: analysis.formSummary,
        dataSource: analysis.dataSource,
        keep: (analysis as { keep?: boolean }).keep !== false, // default keep unless AI says remove
      } as GameAnalysis
    })
  )

  const currentOdds = analysisResults.reduce((acc, g) => acc * g.odds, 1)
  const keptGames = selectGamesToRemove(analysisResults, targetOdds, currentOdds)
  const keptIds = new Set(keptGames.map(g => g.eventId))

  const finalGames = analysisResults.map(g => ({
    ...g,
    keep: keptIds.has(g.eventId),
  }))

  const removedGames = finalGames.filter(g => !g.keep)
  const newOdds = keptGames.reduce((acc, g) => acc * g.odds, 1)

  // Summary
  let summary = 'Analysis complete.'
  try {
    const bsdCount = analysisResults.filter(g => g.dataSource === 'BSD').length
    const webCount = analysisResults.filter(g => g.dataSource === 'AI_WEB_SEARCH').length

    const summaryPrompt = `Summarise this bet slip analysis in 2 sentences for a Nigerian punter. Be direct and friendly.

Original: ${games.length} games at ${originalTotalOdds} total odds.
Removed ${removedGames.length} games: ${removedGames.map(g => `${g.homeTeam} vs ${g.awayTeam} (${g.reason})`).join('; ') || 'none'}
Kept: ${keptGames.length} games at ${newOdds.toFixed(2)} odds.
Target was: ${targetOdds} odds.
Data sources: ${bsdCount} games analysed with real BSD data, ${webCount} with web search.`

    const summaryCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: summaryPrompt }],
      temperature: 0.5,
      max_tokens: 150,
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