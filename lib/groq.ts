import Groq from 'groq-sdk'
import { SportyBetGame } from './sportybet'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface GameAnalysis {
  eventId: string
  homeTeam: string
  awayTeam: string
  odds: number
  pick: string
  league: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore: number
  reason: string
  formSummary: string
  keep: boolean
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

async function analyseOneGame(game: SportyBetGame): Promise<{
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  formSummary: string
}> {
  const prompt = `You are an expert football betting analyst with access to web search.

Search for current information about this match and analyse it deeply:

Match: ${game.homeTeam} vs ${game.awayTeam}
League: ${game.league}
Pick: ${game.pick} (${game.market})
Odds: ${game.odds}

Please search the web for:
1. Recent form of both teams (last 5 matches)
2. Any injury or suspension news
3. Head-to-head record between these teams
4. Home/away performance this season
5. Any other relevant news (manager changes, motivation, etc)

Based on your research, provide:
- A risk score from 1-10 (1=very safe, 10=very risky)
- Risk level: LOW (1-3), MEDIUM (4-6), or HIGH (7-10)
- A short reason (1-2 sentences) explaining why this pick is risky or safe
- A brief form summary of what you found

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "riskScore": <number 1-10>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "reason": "<1-2 sentences>",
  "formSummary": "<brief summary of team form and news>"
}`

  try {
    const completion = await groq.chat.completions.create({
      model: 'compound-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return {
      riskScore: result.riskScore || 5,
      riskLevel: result.riskLevel || 'MEDIUM',
      reason: result.reason || 'Unable to assess risk',
      formSummary: result.formSummary || 'No form data available',
    }
  } catch {
    // Fallback if compound-beta fails
    const riskScore = Math.min(10, Math.round(game.odds * 1.2))
    return {
      riskScore,
      riskLevel: riskScore <= 3 ? 'LOW' : riskScore <= 6 ? 'MEDIUM' : 'HIGH',
      reason: `Odds of ${game.odds} suggest ${riskScore > 6 ? 'high' : riskScore > 3 ? 'moderate' : 'low'} risk`,
      formSummary: 'Web search unavailable — assessed from odds only',
    }
  }
}

function selectBestCombination(
  games: GameAnalysis[],
  targetOdds: number
): GameAnalysis[] {
  // Sort by risk score ascending (safest first)
  const sorted = [...games].sort((a, b) => a.riskScore - b.riskScore)

  // Try to find the best combo that gets close to target
  let kept = [...sorted]

  // Remove riskiest games until we're at or below target
  while (kept.length > 2) {
    const currentOdds = kept.reduce((acc, g) => acc * g.odds, 1)
    if (currentOdds <= targetOdds * 1.3) break // within 30% of target
    // Remove the highest risk game
    kept = kept.slice(0, kept.length - 1)
  }

  return kept
}

export async function analyseSlip(
  games: SportyBetGame[],
  targetOdds: number,
  originalTotalOdds: number
): Promise<SlipAnalysis> {

  // Analyse each game individually with web search
  const analysisResults = await Promise.all(
    games.map(async (game) => {
      const analysis = await analyseOneGame(game)
      return {
        eventId: game.eventId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        odds: game.odds,
        pick: game.pick,
        league: game.league,
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        reason: analysis.reason,
        formSummary: analysis.formSummary,
        keep: true, // will be set below
      } as GameAnalysis
    })
  )

  // Decide which games to keep based on target odds
  const currentOdds = analysisResults.reduce((acc, g) => acc * g.odds, 1)

  let keptGames: GameAnalysis[]

  if (currentOdds <= targetOdds * 1.5) {
    // Already close to or below target - keep all
    keptGames = analysisResults
  } else {
    // Need to reduce - select best combination
    keptGames = selectBestCombination(analysisResults, targetOdds)
  }

  const keptIds = new Set(keptGames.map(g => g.eventId))

  const finalGames = analysisResults.map(g => ({
    ...g,
    keep: keptIds.has(g.eventId),
  }))

  const removedGames = finalGames.filter(g => !g.keep)
  const newOdds = keptGames.reduce((acc, g) => acc * g.odds, 1)

  // Generate overall summary
  const summaryPrompt = `Summarise this bet slip analysis in 2 sentences for a Nigerian punter:
- Original: ${games.length} games, ${originalTotalOdds} total odds
- Removed: ${removedGames.map(g => `${g.homeTeam} vs ${g.awayTeam} (${g.reason})`).join(', ') || 'none'}
- Kept: ${keptGames.length} games, ${newOdds.toFixed(2)} odds
- Target was: ${targetOdds} odds
Be direct and friendly.`

  let summary = 'Analysis complete.'
  try {
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