// lib/confidence.ts
// Module 5 — Confidence Engine
// Calculates the Groove Score for every pick
// Formula: (0.30×form) + (0.20×homeAway) + (0.15×h2h) + (0.15×goalTrend) + (0.10×odds) + (0.10×teamStrength)

import { prisma } from './db/prisma'
import { MatchStatistics, H2HRecord } from '@prisma/client'
import { resolveMarketKey } from './market-rules'

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface GrooveScoreInput {
  // Pick details
  pick: string
  market: string
  odds: number

  // Match statistics from BSD
  stats: MatchStatistics | null

  // H2H record
  h2h: H2HRecord | null

  // Team strength (optional — uses stats as fallback)
  homeTeamStrength?: number
  awayTeamStrength?: number
}

export interface GrooveScoreOutput {
  grooveScore: number        // 0-100 final weighted score
  formScore: number          // component: form (0-100)
  homeAwayScore: number      // component: home/away advantage (0-100)
  h2hScore: number           // component: head to head (0-100)
  goalTrendScore: number     // component: goal trends (0-100)
  oddsScore: number          // component: odds value (0-100)
  teamStrengthScore: number  // component: team strength (0-100)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number         // 0-100
  impliedProbability: number // from bookmaker odds
  realProbability: number    // from BSD prediction
  valueEdge: number          // real - implied (positive = value exists)
  dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL'
  breakdown: string          // human readable breakdown
}

// ─── FORM SCORE (weight: 0.30) ────────────────────────────────────────────
// Measures how well the relevant team is playing recently

function calcFormScore(
  pick: string,
  stats: MatchStatistics
): number {
  const p = pick.toLowerCase()
  const isHome = p.includes('home') || p === '1' || p === '1x' || p === '12'
  const isAway = p.includes('away') || p === '2' || p === 'x2'
  const isDraw = p === 'draw' || p === 'x'

  if (isDraw) {
    // Draw — use average of both teams' draw rates
    const homeGames = stats.homeWins + stats.homeDraws + stats.homeLosses || 1
    const awayGames = stats.awayWins + stats.awayDraws + stats.awayLosses || 1
    const homeDrawRate = stats.homeDraws / homeGames
    const awayDrawRate = stats.awayDraws / awayGames
    const avgDrawRate = (homeDrawRate + awayDrawRate) / 2
    return Math.min(100, Math.round(avgDrawRate * 200)) // 50% draw rate = 100 score
  }

  if (isHome || (!isAway && !isDraw)) {
    const games = stats.homeWins + stats.homeDraws + stats.homeLosses || 1
    const winRate = stats.homeWins / games
    const formPoints = (stats.homeWins * 3 + stats.homeDraws) / (games * 3)
    return Math.min(100, Math.round((winRate * 0.6 + formPoints * 0.4) * 100))
  }

  if (isAway) {
    const games = stats.awayWins + stats.awayDraws + stats.awayLosses || 1
    const winRate = stats.awayWins / games
    const formPoints = (stats.awayWins * 3 + stats.awayDraws) / (games * 3)
    return Math.min(100, Math.round((winRate * 0.6 + formPoints * 0.4) * 100))
  }

  return 50 // default
}

// ─── HOME/AWAY SCORE (weight: 0.20) ──────────────────────────────────────
// Uses BSD prediction probabilities

function calcHomeAwayScore(
  pick: string,
  stats: MatchStatistics
): number {
  const p = pick.toLowerCase()

  if (p.includes('home') || p === '1' || p === '1x' || p === '12') {
    // Home pick — use home win probability + home/draw for double chance
    if (p === '1x') return Math.min(100, Math.round(stats.probHome + stats.probDraw))
    if (p === '12') return Math.min(100, Math.round(stats.probHome + stats.probAway))
    return Math.min(100, Math.round(stats.probHome))
  }

  if (p.includes('away') || p === '2' || p === 'x2') {
    if (p === 'x2') return Math.min(100, Math.round(stats.probDraw + stats.probAway))
    return Math.min(100, Math.round(stats.probAway))
  }

  if (p === 'draw' || p === 'x') {
    return Math.min(100, Math.round(stats.probDraw))
  }

  // Goal markets — use combined scoring probability
  if (p.includes('over') || p.includes('btts') || p.includes('gg')) {
    const avgScoring = (stats.homeAvgScored + stats.awayAvgScored) / 2
    return Math.min(100, Math.round(avgScoring * 40))
  }

  return Math.min(100, Math.round(stats.probHome)) // default to home
}

// ─── H2H SCORE (weight: 0.15) ────────────────────────────────────────────
// Head to head history

function calcH2HScore(
  pick: string,
  h2h: H2HRecord
): number {
  const p = pick.toLowerCase()

  if (h2h.totalMeetings === 0) return 50 // no data

  if (p.includes('home') || p === '1') {
    return Math.min(100, Math.round(h2h.homeWinRate * 100))
  }
  if (p.includes('away') || p === '2') {
    return Math.min(100, Math.round(h2h.awayWinRate * 100))
  }
  if (p === 'draw' || p === 'x') {
    return Math.min(100, Math.round(h2h.drawRate * 100))
  }
  if (p === '1x') {
    return Math.min(100, Math.round((h2h.homeWinRate + h2h.drawRate) * 100))
  }
  if (p === 'x2') {
    return Math.min(100, Math.round((h2h.awayWinRate + h2h.drawRate) * 100))
  }
  if (p === '12') {
    return Math.min(100, Math.round((h2h.homeWinRate + h2h.awayWinRate) * 100))
  }

  // Goal picks — use H2H average goals
  if (p.includes('over 0.5')) return h2h.avgGoalsPerGame >= 0.5 ? 85 : 40
  if (p.includes('over 1.5')) return h2h.avgGoalsPerGame >= 2.0 ? 80 : h2h.avgGoalsPerGame >= 1.5 ? 60 : 35
  if (p.includes('over 2.5')) return h2h.avgGoalsPerGame >= 3.0 ? 80 : h2h.avgGoalsPerGame >= 2.5 ? 65 : 35
  if (p.includes('over 3.5')) return h2h.avgGoalsPerGame >= 4.0 ? 78 : h2h.avgGoalsPerGame >= 3.5 ? 62 : 30
  if (p.includes('under 1.5')) return h2h.avgGoalsPerGame <= 1.0 ? 80 : h2h.avgGoalsPerGame <= 1.5 ? 60 : 35
  if (p.includes('under 2.5')) return h2h.avgGoalsPerGame <= 1.5 ? 85 : h2h.avgGoalsPerGame <= 2.5 ? 68 : 35
  if (p === 'yes' || p === 'gg') {
    // Both teams score — need both teams to have scored in H2H
    return h2h.avgGoalsPerGame >= 2.5 ? 75 : h2h.avgGoalsPerGame >= 2.0 ? 60 : 40
  }

  return 50
}

// ─── GOAL TREND SCORE (weight: 0.15) ─────────────────────────────────────
// Recent goal patterns

function calcGoalTrendScore(
  pick: string,
  stats: MatchStatistics,
  h2h: H2HRecord | null
): number {
  const p = pick.toLowerCase()
  const h2hAvg = h2h?.avgGoalsPerGame || 0
  const expectedGoals =
    ((stats.homeAvgScored + stats.awayAvgConceded) / 2) +
    ((stats.awayAvgScored + stats.homeAvgConceded) / 2)

  if (p.includes('over 0.5')) {
    const support = expectedGoals >= 0.5 && h2hAvg >= 0.5
    return support ? 88 : 70
  }
  if (p.includes('over 1.5')) {
    if (stats.over15Rate >= 0.75 && h2hAvg >= 2.0) return 88
    if (stats.over15Rate >= 0.60) return 72
    if (stats.over15Rate >= 0.45) return 55
    return 35
  }
  if (p.includes('over 2.5')) {
    if (stats.over25Rate >= 0.70 && h2hAvg >= 3.0) return 85
    if (stats.over25Rate >= 0.55) return 70
    if (stats.over25Rate >= 0.40) return 52
    return 32
  }
  if (p.includes('over 3.5')) {
    if (stats.over25Rate >= 0.80 && h2hAvg >= 4.0) return 80
    if (stats.over25Rate >= 0.65) return 65
    return 30
  }
  if (p.includes('over 4.5')) {
    if (h2hAvg >= 5.0) return 75
    if (h2hAvg >= 4.0) return 58
    return 25
  }
  if (p.includes('under 1.5')) {
    const lowScoring = stats.over15Rate <= 0.30
    return lowScoring ? 80 : stats.over15Rate <= 0.45 ? 60 : 35
  }
  if (p.includes('under 2.5')) {
    const lowScoring = stats.over25Rate <= 0.35
    return lowScoring ? 82 : stats.over25Rate <= 0.50 ? 65 : 38
  }
  if (p.includes('under 3.5')) {
    return stats.over25Rate <= 0.55 ? 75 : 50
  }
  if (p === 'yes' || p === 'gg') {
    if (stats.bttsRate >= 0.70) return 85
    if (stats.bttsRate >= 0.55) return 70
    if (stats.bttsRate >= 0.40) return 52
    return 33
  }
  if (p === 'no' || p === 'ng') {
    if (stats.bttsRate <= 0.30) return 82
    if (stats.bttsRate <= 0.45) return 65
    return 38
  }

  // Result markets — use scoring as secondary signal
  if (p.includes('home') || p === '1') {
    const homeAttack = stats.homeAvgScored >= 1.5 ? 70 : stats.homeAvgScored >= 1.0 ? 55 : 40
    const awayDefence = stats.awayAvgConceded >= 1.5 ? 70 : stats.awayAvgConceded >= 1.0 ? 55 : 40
    return Math.round((homeAttack + awayDefence) / 2)
  }
  if (p.includes('away') || p === '2') {
    const awayAttack = stats.awayAvgScored >= 1.2 ? 68 : stats.awayAvgScored >= 0.8 ? 52 : 38
    const homeDefence = stats.homeAvgConceded >= 1.2 ? 65 : stats.homeAvgConceded >= 0.8 ? 50 : 38
    return Math.round((awayAttack + homeDefence) / 2)
  }

  return 50
}

// ─── ODDS SCORE (weight: 0.10) ────────────────────────────────────────────
// Is there value between real probability and bookmaker odds?

function calcOddsScore(
  odds: number,
  realProb: number
): number {
  if (odds <= 1) return 0
  const impliedProb = (1 / odds) * 100
  const edge = realProb - impliedProb

  if (edge >= 15) return 95    // strong value
  if (edge >= 10) return 85    // good value
  if (edge >= 5)  return 75    // slight value
  if (edge >= 0)  return 65    // fair odds
  if (edge >= -5) return 55    // slight overpriced
  if (edge >= -10) return 40   // overpriced
  return 25                    // significantly overpriced
}

// ─── TEAM STRENGTH SCORE (weight: 0.10) ──────────────────────────────────

function calcTeamStrengthScore(
  pick: string,
  stats: MatchStatistics,
  homeStrength?: number,
  awayStrength?: number
): number {
  const p = pick.toLowerCase()

  // Use explicit strength if provided
  if (homeStrength !== undefined && awayStrength !== undefined) {
    if (p.includes('home') || p === '1') return Math.min(100, homeStrength)
    if (p.includes('away') || p === '2') return Math.min(100, awayStrength)
    return Math.round((homeStrength + awayStrength) / 2)
  }

  // Fall back to BSD probability as strength proxy
  if (p.includes('home') || p === '1' || p === '1x' || p === '12') {
    return Math.min(100, Math.round(stats.probHome * 1.2))
  }
  if (p.includes('away') || p === '2' || p === 'x2') {
    return Math.min(100, Math.round(stats.probAway * 1.2))
  }
  return Math.min(100, Math.round(stats.probDraw * 2))
}

// ─── REAL PROBABILITY ─────────────────────────────────────────────────────

function getRealProbability(pick: string, stats: MatchStatistics | null): number {
  if (!stats) return 0
  const p = pick.toLowerCase()

  if (p.includes('home') && !p.includes('away')) return stats.probHome
  if (p.includes('away') && !p.includes('home')) return stats.probAway
  if (p === 'draw' || p === 'x') return stats.probDraw
  if (p === '1x') return Math.min(99, stats.probHome + stats.probDraw)
  if (p === 'x2') return Math.min(99, stats.probDraw + stats.probAway)
  if (p === '12') return Math.min(99, stats.probHome + stats.probAway)

  // Goal markets — use over rates as proxy
  if (p.includes('over 0.5')) return Math.min(99, stats.over15Rate * 100 + 10)
  if (p.includes('over 1.5')) return Math.min(99, stats.over15Rate * 100)
  if (p.includes('over 2.5')) return Math.min(99, stats.over25Rate * 100)
  if (p === 'yes' || p === 'gg') return Math.min(99, stats.bttsRate * 100)
  if (p === 'no' || p === 'ng') return Math.min(99, (1 - stats.bttsRate) * 100)
  if (p.includes('under 2.5')) return Math.min(99, (1 - stats.over25Rate) * 100)
  if (p.includes('under 1.5')) return Math.min(99, (1 - stats.over15Rate) * 100)

  return 0
}

// ─── GET MARKET WEIGHTS ───────────────────────────────────────────────────

async function getMarketWeights(marketKey: string): Promise<{
  form: number
  homeAway: number
  h2h: number
  goalTrend: number
  odds: number
  teamStrength: number
}> {
  try {
    const rule = await prisma.marketRule.findUnique({ where: { marketKey } })
    if (rule) {
      return {
        form: rule.formWeight,
        homeAway: rule.homeAwayWeight,
        h2h: rule.h2hWeight,
        goalTrend: rule.goalTrendWeight,
        odds: rule.oddsWeight,
        teamStrength: rule.teamStrengthWeight,
      }
    }
  } catch { /* use defaults */ }

  // Default formula weights
  return { form: 0.30, homeAway: 0.20, h2h: 0.15, goalTrend: 0.15, odds: 0.10, teamStrength: 0.10 }
}

// ─── MAIN GROOVE SCORE CALCULATOR ────────────────────────────────────────

export async function calculateGrooveScore(input: GrooveScoreInput): Promise<GrooveScoreOutput> {
  const { pick, market, odds, stats, h2h, homeTeamStrength, awayTeamStrength } = input

  const marketKey = resolveMarketKey(pick, market)
  const weights = await getMarketWeights(marketKey)

  // Calculate real probability
  const realProb = getRealProbability(pick, stats)
  const impliedProb = odds > 1 ? parseFloat(((1 / odds) * 100).toFixed(1)) : 0
  const valueEdge = parseFloat((realProb - impliedProb).toFixed(1))

  // Determine data quality
  const hasStats = !!stats && (stats.probHome > 0 || stats.homeWins > 0)
  const hasH2H = !!h2h && h2h.totalMeetings > 0
  const dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL' =
    hasStats && hasH2H ? 'FULL' : hasStats || hasH2H ? 'PARTIAL' : 'MINIMAL'

  // Calculate component scores
  const formScore = stats ? calcFormScore(pick, stats) : 40
  const homeAwayScore = stats ? calcHomeAwayScore(pick, stats) : 40
  const h2hScore = h2h ? calcH2HScore(pick, h2h) : 45
  const goalTrendScore = stats ? calcGoalTrendScore(pick, stats, h2h) : 40
  const oddsScore = calcOddsScore(odds, realProb)
  const teamStrengthScore = stats
    ? calcTeamStrengthScore(pick, stats, homeTeamStrength, awayTeamStrength)
    : 45

  // Apply data quality penalty
  const qualityMultiplier = dataQuality === 'FULL' ? 1.0 : dataQuality === 'PARTIAL' ? 0.90 : 0.75

  // Weighted Groove Score
  const rawScore =
    (formScore * weights.form) +
    (homeAwayScore * weights.homeAway) +
    (h2hScore * weights.h2h) +
    (goalTrendScore * weights.goalTrend) +
    (oddsScore * weights.odds) +
    (teamStrengthScore * weights.teamStrength)

  const grooveScore = Math.min(99, Math.max(0, Math.round(rawScore * qualityMultiplier)))

  // Risk level
  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    grooveScore >= 70 ? 'LOW' : grooveScore >= 50 ? 'MEDIUM' : 'HIGH'

  // Breakdown string
  const breakdown = [
    `Form: ${formScore}×${weights.form}`,
    `H/A: ${homeAwayScore}×${weights.homeAway}`,
    `H2H: ${h2hScore}×${weights.h2h}`,
    `Goals: ${goalTrendScore}×${weights.goalTrend}`,
    `Odds: ${oddsScore}×${weights.odds}`,
    `Strength: ${teamStrengthScore}×${weights.teamStrength}`,
    `Quality: ${dataQuality}`,
    `Score: ${grooveScore}`,
  ].join(' | ')

  return {
    grooveScore,
    formScore,
    homeAwayScore,
    h2hScore,
    goalTrendScore,
    oddsScore,
    teamStrengthScore,
    riskLevel,
    confidence: grooveScore,
    impliedProbability: impliedProb,
    realProbability: realProb,
    valueEdge,
    dataQuality,
    breakdown,
  }
}

// ─── STORE CONFIDENCE SCORE ───────────────────────────────────────────────

export async function storeConfidenceScore(
  fixtureId: string,
  pick: string,
  market: string,
  score: GrooveScoreOutput
): Promise<void> {
  try {
    await prisma.confidenceScore.create({
      data: {
        fixtureId,
        pick,
        market,
        formScore: score.formScore,
        homeAwayScore: score.homeAwayScore,
        h2hScore: score.h2hScore,
        goalTrendScore: score.goalTrendScore,
        oddsScore: score.oddsScore,
        teamStrengthScore: score.teamStrengthScore,
        grooveScore: score.grooveScore,
        riskLevel: score.riskLevel,
        confidence: score.confidence,
        impliedProbability: score.impliedProbability,
        realProbability: score.realProbability,
        valueEdge: score.valueEdge,
      },
    })
  } catch (err) {
    console.error('[confidence] Failed to store score:', err)
  }
}

// ─── BATCH SCORE ALL PICKS FOR A FIXTURE ─────────────────────────────────

export async function scoreAllPicksForFixture(
  fixtureId: string,
  stats: MatchStatistics | null,
  h2h: H2HRecord | null
): Promise<Map<string, GrooveScoreOutput>> {
  const results = new Map<string, GrooveScoreOutput>()

  const commonPicks = [
    { pick: 'Home', market: '1X2', odds: stats?.oddsHome || 2.0 },
    { pick: 'Draw', market: '1X2', odds: stats?.oddsDraw || 3.0 },
    { pick: 'Away', market: '1X2', odds: stats?.oddsAway || 3.5 },
    { pick: 'Home/Draw', market: 'Double Chance', odds: 1.3 },
    { pick: 'Draw/Away', market: 'Double Chance', odds: 1.5 },
    { pick: 'Over 1.5', market: 'Over/Under', odds: 1.4 },
    { pick: 'Over 2.5', market: 'Over/Under', odds: 1.8 },
    { pick: 'Yes', market: 'BTTS', odds: 1.7 },
    { pick: 'No', market: 'BTTS', odds: 2.0 },
  ]

  for (const p of commonPicks) {
    const score = await calculateGrooveScore({
      pick: p.pick,
      market: p.market,
      odds: p.odds,
      stats,
      h2h,
    })
    results.set(`${p.pick}|${p.market}`, score)

    await storeConfidenceScore(fixtureId, p.pick, p.market, score)
  }

  return results
}