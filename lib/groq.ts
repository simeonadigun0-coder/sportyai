import Groq from 'groq-sdk'
import { SportyBetGame } from './sportybet'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface GameAnalysis {
  eventId: string
  homeTeam: string
  awayTeam: string
  odds: number
  pick: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore: number // 1-10, higher = more risky
  reason: string
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

export async function analyseSlip(
  games: SportyBetGame[],
  targetOdds: number,
  originalTotalOdds: number
): Promise<SlipAnalysis> {
  const gameList = games
    .map(
      (g, i) =>
        `${i + 1}. ${g.homeTeam} vs ${g.awayTeam} | League: ${g.league} | Pick: ${g.pick} | Market: ${g.market} | Odds: ${g.odds} | Time: ${g.kickoffTime}`
    )
    .join('\n')

  const prompt = `You are an expert football betting analyst. Your job is to analyse a betting slip and identify the risky picks ("bad eggs") that are most likely to lose.

BETTING SLIP (Total odds: ${originalTotalOdds}):
${gameList}

TARGET: The user wants to reduce this slip to approximately ${targetOdds} total odds by removing the riskiest games.

For each game, evaluate:
1. How risky the odds are (high odds = bookmaker sees it as unlikely)
2. The pick type (away wins, big upsets, high-odds markets are riskier)
3. The league (lower leagues are more unpredictable)
4. Overall risk

Respond ONLY with a valid JSON array (no markdown, no explanation, just raw JSON):
[
  {
    "eventId": "the exact eventId string",
    "riskScore": <number 1-10>,
    "riskLevel": "<LOW|MEDIUM|HIGH>",
    "reason": "<one short sentence why this is risky or safe>",
    "keep": <true or false>
  }
]

Rules for deciding keep/remove:
- Sort by riskScore descending
- Remove the highest-risk games first until remaining games multiply to approximately ${targetOdds} odds
- Never remove ALL games - keep at least 2
- If current odds are already below target, keep everything
- Prioritise keeping LOW risk picks, removing HIGH risk picks`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  })

  const raw = completion.choices[0]?.message?.content || '[]'

  let analysisResults: Array<{
    eventId: string
    riskScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    reason: string
    keep: boolean
  }>

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    analysisResults = JSON.parse(cleaned)
  } catch {
    // Fallback: keep games with lowest odds (safest), remove highest
    analysisResults = games
      .sort((a, b) => a.odds - b.odds)
      .map((g, i) => {
        const riskScore = Math.min(10, Math.round(g.odds * 1.5))
        return {
          eventId: g.eventId,
          riskScore,
          riskLevel: riskScore <= 3 ? 'LOW' : riskScore <= 6 ? 'MEDIUM' : 'HIGH',
          reason: `Odds of ${g.odds} suggest ${riskScore > 6 ? 'high' : 'moderate'} risk`,
          keep: i < Math.ceil(games.length / 2),
        } as typeof analysisResults[0]
      })
  }

  // Merge AI analysis back with game data
  const gameAnalysis: GameAnalysis[] = games.map(g => {
    const ai = analysisResults.find(a => a.eventId === g.eventId) || {
      eventId: g.eventId,
      riskScore: Math.round(g.odds),
      riskLevel: g.odds > 3 ? 'HIGH' : g.odds > 1.8 ? 'MEDIUM' : ('LOW' as 'LOW' | 'MEDIUM' | 'HIGH'),
      reason: 'Auto-assessed based on odds value',
      keep: true,
    }

    return {
      eventId: g.eventId,
      homeTeam: g.homeTeam,
      awayTeam: g.awayTeam,
      odds: g.odds,
      pick: g.pick,
      riskLevel: ai.riskLevel,
      riskScore: ai.riskScore,
      reason: ai.reason,
      keep: ai.keep,
    }
  })

  const keptGames = gameAnalysis.filter(g => g.keep)
  const removedGames = gameAnalysis.filter(g => !g.keep)
  const newOdds = keptGames.reduce((acc, g) => acc * g.odds, 1)

  // Get AI summary
  const summaryPrompt = `In 2 sentences, explain what was done to this betting slip: Originally ${games.length} games at ${originalTotalOdds} total odds. Removed ${removedGames.length} risky games (${removedGames.map(g => `${g.homeTeam} vs ${g.awayTeam}`).join(', ')}). New slip has ${keptGames.length} games at approximately ${newOdds.toFixed(2)} odds targeting ${targetOdds}. Be direct and punter-friendly.`

  const summaryCompletion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: summaryPrompt }],
    temperature: 0.5,
    max_tokens: 150,
  })

  const summary = summaryCompletion.choices[0]?.message?.content || 'Analysis complete.'

  return {
    games: gameAnalysis,
    removedGames,
    keptGames,
    originalOdds: parseFloat(originalTotalOdds.toFixed(2)),
    newOdds: parseFloat(newOdds.toFixed(2)),
    targetOdds,
    summary,
  }
}
