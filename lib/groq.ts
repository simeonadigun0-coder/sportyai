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

function getFirstWord(name: string): string {
  return name.trim().split(/\s+/)[0]
}

function teamsMatch(bsdHome: string, bsdAway: string, searchHome: string, searchAway: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  const bH = normalize(bsdHome)
  const bA = normalize(bsdAway)
  const sH = normalize(searchHome)
  const sA = normalize(searchAway)

  const firstWordMatch = (a: string, b: string) => {
    const aW = a.split(' ')[0]
    const bW = b.split(' ')[0]
    return a.includes(bW) || b.includes(aW) || aW === bW
  }

  return firstWordMatch(bH, sH) && firstWordMatch(bA, sA)
}

async function searchBSDEvent(
  homeTeam: string,
  awayTeam: string,
  kickoffTime: string
): Promise<Record<string, unknown> | null> {
  try {
    const yesterday = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
    const nextTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

    // Try multiple search strategies
    const searchAttempts = [
      `${BSD_BASE}/events/?team=${encodeURIComponent(homeTeam)}&date_from=${yesterday}&date_to=${nextTwoWeeks}&limit=50`,
      `${BSD_BASE}/events/?team=${encodeURIComponent(getFirstWord(homeTeam))}&date_from=${yesterday}&date_to=${nextTwoWeeks}&limit=50`,
      `${BSD_BASE}/events/?team=${encodeURIComponent(awayTeam)}&date_from=${yesterday}&date_to=${nextTwoWeeks}&limit=50`,
      `${BSD_BASE}/events/?team=${encodeURIComponent(getFirstWord(awayTeam))}&date_from=${yesterday}&date_to=${nextTwoWeeks}&limit=50`,
    ]

    for (const url of searchAttempts) {
      try {
        const res = await fetch(url, { headers: bsdHeaders })
        if (!res.ok) continue

        const data = await res.json()
        const events: unknown[] = data.results || []

        const match = events.find((e: unknown) => {
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
          // Get full detail with form + H2H
          const detailRes = await fetch(`${BSD_BASE}/events/${ev.id}/`, { headers: bsdHeaders })
          if (!detailRes.ok) return ev
          return await detailRes.json()
        }
      } catch { continue }
    }

    return null
  } catch {
    return null
  }
}

function formatFormData(form: Record<string, unknown> | null | undefined, teamName: string): string {
  if (!form) return `No form data for ${teamName}`
  const formString = (form.form_string as string) || ''
  const w = (form.wins as number) || 0
  const d = (form.draws as number) || 0
  const l = (form.losses as number) || 0
  const gScored = (form.goals_scored_last_n as number) || 0
  const gConceded = (form.goals_conceded_last_n as number) || 0
  const homePPG = (form.home_ppg as number) || 0
  const awayPPG = (form.away_ppg as number) || 0
  const cleanSheets = (form.clean_sheets as number) || 0
  return `${teamName}: Form [${formString}] W${w} D${d} L${l} | Scored: ${gScored} Conceded: ${gConceded} | Clean sheets: ${cleanSheets} | Home PPG: ${homePPG} Away PPG: ${awayPPG}`
}

function formatH2H(h2h: Record<string, unknown> | null | undefined, homeTeam: string, awayTeam: string): string {
  if (!h2h) return 'No H2H data'
  const total = (h2h.total_matches as number) || 0
  const homeWins = (h2h.home_wins as number) || 0
  const draws = (h2h.draws as number) || 0
  const awayWins = (h2h.away_wins as number) || 0
  const avgGoals = (h2h.avg_total_goals as number) || 0
  return `H2H (${total} meetings): ${homeTeam} wins ${homeWins} | Draws ${draws} | ${awayTeam} wins ${awayWins} | Avg goals: ${avgGoals}`
}

function formatUnavailable(unavailable: Record<string, unknown> | null | undefined): string {
  if (!unavailable) return 'No injury data'
  const home = (unavailable.home as unknown[]) || []
  const away = (unavailable.away as unknown[]) || []
  const fmt = (players: unknown[]) =>
    players.map((p: unknown) => {
      const player = p as Record<string, unknown>
      return `${player.name} (${player.status})`
    }).join(', ')
  const h = home.length ? `Home missing: ${fmt(home)}` : ''
  const a = away.length ? `Away missing: ${fmt(away)}` : ''
  return [h, a].filter(Boolean).join(' | ') || 'All players available'
}

// --- Analysis Functions ---

async function analyseFootballGame(game: SportyBetGame): Promise<{
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  formSummary: string
  keep: boolean
  dataSource: 'BSD' | 'AI_WEB_SEARCH' | 'FALLBACK'
}> {
  // Try BSD first
  const bsdEvent = await searchBSDEvent(game.homeTeam, game.awayTeam, game.kickoffTime)

  if (bsdEvent) {
    const homeForm = bsdEvent.home_form as Record<string, unknown> | null
    const awayForm = bsdEvent.away_form as Record<string, unknown> | null
    const h2h = bsdEvent.head_to_head as Record<string, unknown> | null
    const unavailable = bsdEvent.unavailable_players as Record<string, unknown> | null

    const homeFormStr = formatFormData(homeForm, game.homeTeam)
    const awayFormStr = formatFormData(awayForm, game.awayTeam)
    const h2hStr = formatH2H(h2h, game.homeTeam, game.awayTeam)
    const unavailableStr = formatUnavailable(unavailable)

    const prompt = `You are an expert football punter with 20 years of experience analysing matches.

MATCH: ${game.homeTeam} vs ${game.awayTeam}
LEAGUE: ${game.league}
PICK ON SLIP: "${game.pick}" (${game.market})

REAL MATCH DATA:
${homeFormStr}
${awayFormStr}
${h2hStr}
INJURIES/SUSPENSIONS: ${unavailableStr}

Your job: Decide if you would KEEP or REMOVE this pick from the betting slip.

Think like a punter:
- Does the form support this pick?
- Does the H2H history support this pick?
- Are key players missing that change the outcome?
- Are there any red flags in the data?

CRITICAL: Your decision must be based ONLY on the data above. 
Do NOT factor in the odds at all.
If data supports the pick → KEEP (even if odds seem high)
If data raises doubts → REMOVE (even if odds seem low)

Respond ONLY in valid JSON (no markdown):
{
  "riskScore": <1-10, where 1=very confident keep, 10=must remove>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "keep": <true or false>,
  "reason": "<1-2 sentences explaining your punter decision based on the data>",
  "formSummary": "<1 sentence: the single most important data point that influenced your decision>"
}`

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 400,
      })

      const raw = completion.choices[0]?.message?.content || '{}'
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const result = JSON.parse(cleaned)

      return {
        riskScore: result.riskScore || 5,
        riskLevel: result.riskLevel || 'MEDIUM',
        reason: result.reason || 'BSD data found but parse failed',
        formSummary: result.formSummary || homeFormStr,
        keep: result.keep !== false,
        dataSource: 'BSD',
      }
    } catch {
      return {
        riskScore: 5, riskLevel: 'MEDIUM',
        reason: 'BSD data found but analysis failed',
        formSummary: homeFormStr,
        keep: true,
        dataSource: 'BSD',
      }
    }
  }

  // BSD not found — fallback to web search with punter-style prompt
  try {
    const prompt = `You are an expert football scout and punter. You need to research this match because it's in a smaller league not covered by major databases.

MATCH: ${game.homeTeam} vs ${game.awayTeam}
LEAGUE: ${game.league}
PICK ON SLIP: "${game.pick}" (${game.market})

Search the web for:
1. "${game.homeTeam} recent results 2025 2026" — their last 5 matches
2. "${game.awayTeam} recent results 2025 2026" — their last 5 matches  
3. "${game.homeTeam} vs ${game.awayTeam} head to head history"
4. Any injuries, suspensions, or news for either team
5. ${game.league} table/standings if available

After researching, make your punter decision:
- Would you back "${game.pick}" in this match based on what you found?
- Be honest — if you can't find enough data to be confident, say REMOVE

IMPORTANT: Base your decision on form and match context, NOT on odds.

Respond ONLY in valid JSON:
{
  "riskScore": <1-10>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "keep": <true or false>,
  "reason": "<1-2 sentences based on what you found or couldn't find>",
  "formSummary": "<brief summary of key finding or why data was limited>"
}`

    const completion = await groq.chat.completions.create({
      model: 'compound-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 600,
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return {
      riskScore: result.riskScore || 6,
      riskLevel: result.riskLevel || 'MEDIUM',
      reason: result.reason || 'Limited data available',
      formSummary: result.formSummary || 'Small league — limited data',
      keep: result.keep !== false,
      dataSource: 'AI_WEB_SEARCH',
    }
  } catch {
    return {
      riskScore: 6,
      riskLevel: 'MEDIUM',
      reason: 'Could not find data for this match — treated as moderate risk',
      formSummary: 'Small league with limited online coverage',
      keep: true,
      dataSource: 'FALLBACK',
    }
  }
}

async function analyseNonFootballGame(game: SportyBetGame): Promise<{
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  formSummary: string
  keep: boolean
  dataSource: 'AI_WEB_SEARCH' | 'FALLBACK'
}> {
  try {
    const prompt = `You are an expert ${game.sport} betting analyst and scout.

MATCH: ${game.homeTeam} vs ${game.awayTeam}
SPORT: ${game.sport}
LEAGUE: ${game.league}
PICK ON SLIP: "${game.pick}" (${game.market})

Search the web for:
1. Recent form of both teams in ${game.sport}
2. Current ${game.league} standings
3. Any injuries or suspensions
4. Head-to-head between these two teams
5. Any relevant news

Make your punter decision based ONLY on form and match context, NOT odds.

Respond ONLY in valid JSON:
{
  "riskScore": <1-10>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "keep": <true or false>,
  "reason": "<1-2 sentences based on what you found>",
  "formSummary": "<brief summary of key findings>"
}`

    const completion = await groq.chat.completions.create({
      model: 'compound-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 600,
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return {
      riskScore: result.riskScore || 5,
      riskLevel: result.riskLevel || 'MEDIUM',
      reason: result.reason || 'Unable to assess',
      formSummary: result.formSummary || 'Web search used',
      keep: result.keep !== false,
      dataSource: 'AI_WEB_SEARCH',
    }
  } catch {
    return {
      riskScore: 5, riskLevel: 'MEDIUM',
      reason: 'Could not find data for this match',
      formSummary: 'No data available',
      keep: true,
      dataSource: 'FALLBACK',
    }
  }
}

function selectGamesToKeep(games: GameAnalysis[], targetOdds: number, currentOdds: number): GameAnalysis[] {
  if (currentOdds <= targetOdds * 1.3) return games

  // Respect AI decisions first — remove what AI says to remove
  const aiKept = games.filter(g => g.keep)
  const aiRemoved = games.filter(g => !g.keep)

  let kept = [...aiKept].sort((a, b) => a.riskScore - b.riskScore)
  let total = kept.reduce((acc, g) => acc * g.odds, 1)

  // Still above target — remove highest risk from kept
  while (kept.length > 2 && total > targetOdds * 1.3) {
    kept = kept.slice(0, kept.length - 1)
    total = kept.reduce((acc, g) => acc * g.odds, 1)
  }

  // Too few — add back lowest risk of removed games
  const removedByRisk = [...aiRemoved].sort((a, b) => a.riskScore - b.riskScore)
  for (const game of removedByRisk) {
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
      const isFootball =
        !game.sport ||
        game.sport.toLowerCase().includes('football') ||
        game.sport.toLowerCase().includes('soccer')

      const analysis = isFootball
        ? await analyseFootballGame(game)
        : await analyseNonFootballGame(game)

      return {
        ...game,
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        reason: analysis.reason,
        formSummary: analysis.formSummary,
        keep: analysis.keep,
        dataSource: analysis.dataSource,
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

  // Summary
  let summary = 'Analysis complete.'
  try {
    const bsdCount = analysisResults.filter(g => g.dataSource === 'BSD').length
    const webCount = analysisResults.filter(g => g.dataSource === 'AI_WEB_SEARCH').length
    const fallbackCount = analysisResults.filter(g => g.dataSource === 'FALLBACK').length

    const summaryPrompt = `Summarise this bet slip analysis in 2 sentences for a Nigerian punter. Be direct and friendly.

Original: ${games.length} games at ${originalTotalOdds} total odds.
Removed ${removedGames.length} games: ${removedGames.map(g => `${g.homeTeam} vs ${g.awayTeam}`).join(', ') || 'none'}
Kept: ${keptGames.length} games at ${newOdds.toFixed(2)} odds. Target: ${targetOdds} odds.
Data quality: ${bsdCount} games with real BSD database data, ${webCount} with web search, ${fallbackCount} with limited data.`

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