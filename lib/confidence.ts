// lib/confidence.ts
// Module 5 — Confidence Engine
// Calculates the Groove Score for every pick
// Formula: (0.30×form) + (0.20×homeAway) + (0.15×h2h) + (0.15×goalTrend) + (0.10×odds) + (0.10×teamStrength)
// UPDATED: MINIMAL data now uses market+odds inference instead of formula-on-zeros

import { prisma } from './db/prisma'
import { MatchStatistics, H2HRecord } from '@prisma/client'
import { resolveMarketKey } from './market-rules'

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface GrooveScoreInput {
  pick: string
  market: string
  odds: number
  stats: MatchStatistics | null
  h2h: H2HRecord | null
  homeTeamStrength?: number
  awayTeamStrength?: number
  // Optional: Groq-inferred team strengths for MINIMAL data fallback
  groqHomeStrength?: number
  groqAwayStrength?: number
}

export interface GrooveScoreOutput {
  grooveScore: number
  formScore: number
  homeAwayScore: number
  h2hScore: number
  goalTrendScore: number
  oddsScore: number
  teamStrengthScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
  impliedProbability: number
  realProbability: number
  valueEdge: number
  dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL'
  breakdown: string
}

// ─── MARKET-AWARE BASELINE FOR MINIMAL DATA ───────────────────────────────
// When BSD has no data, infer a meaningful score from market type + bookmaker odds.
// We trust bookmaker implied probability as a signal, but apply a confidence discount
// because we can't verify it with real stats.

export function inferScoreFromMarketAndOdds(
  pick: string,
  market: string,
  odds: number
): number {
  const p = pick.toLowerCase().trim()
  const m = market.toLowerCase().trim()

  if (odds <= 1) return 40

  // Bookmaker's implied probability
  const impliedProb = (1 / odds) * 100

  // ── Consecutive/streak markets ──
  // "No (Home/Away Team to Score X or More Goals in a Row)" is statistically
  // very likely because streak markets require unlikely chains of events.
  // A team scoring 3+ goals in consecutive games is rare (~10-15% frequency).
  if (p === 'no' && (
    m.includes('in a row') ||
    m.includes('consecutive') ||
    m.includes('back to back') ||
    m.includes('streak')
  )) {
    // Odds like 1.10-1.20 imply 83-91% — our score reflects that with small discount
    return Math.min(88, Math.max(60, Math.round(impliedProb * 0.92)))
  }

  // ── Double Chance ──
  // Covers 2 of 3 outcomes — inherently safe
  if (m.includes('double chance')) {
    return Math.min(84, Math.max(55, Math.round(impliedProb * 0.90)))
  }

  // ── Draw No Bet ──
  if (m.includes('draw no bet')) {
    return Math.min(80, Math.max(50, Math.round(impliedProb * 0.88)))
  }

  // ── Over 0.5 Goals ──
  // ~90%+ of matches have at least one goal globally
  if (p.includes('over 0.5')) {
    return Math.min(82, Math.max(55, Math.round(impliedProb * 0.88)))
  }

  // ── Under 0.5 Goals ──
  // Rare market — risky
  if (p.includes('under 0.5')) {
    return Math.min(65, Math.max(30, Math.round(impliedProb * 0.80)))
  }

  // ── Over 1.5 Goals ──
  if (p.includes('over 1.5')) {
    return Math.min(78, Math.max(42, Math.round(impliedProb * 0.86)))
  }

  // ── Under 1.5 Goals ──
  if (p.includes('under 1.5')) {
    return Math.min(72, Math.max(35, Math.round(impliedProb * 0.82)))
  }

  // ── Over/Under 2.5 ──
  if (p.includes('over 2.5') || p.includes('under 2.5')) {
    return Math.min(72, Math.max(35, Math.round(impliedProb * 0.82)))
  }

  // ── GG/NG ──
  if (p === 'no' || p === 'ng') {
    return Math.min(72, Math.max(38, Math.round(impliedProb * 0.82)))
  }
  if (p === 'yes' || p === 'gg') {
    return Math.min(68, Math.max(35, Math.round(impliedProb * 0.80)))
  }

  // ── Result markets (Home/Away/Draw) — bookmaker odds less reliable alone ──
  // Apply heavier discount — result markets are where team quality matters most
  if (p === 'home' || p === '1') {
    return Math.min(65, Math.max(30, Math.round(impliedProb * 0.78)))
  }
  if (p === 'away' || p === '2') {
    return Math.min(62, Math.max(28, Math.round(impliedProb * 0.76)))
  }
  if (p === 'draw' || p === 'x') {
    return Math.min(58, Math.max(25, Math.round(impliedProb * 0.72)))
  }

  // ── Generic fallback ──
  // Trust bookmaker implied probability with 20% discount for uncertainty
  return Math.min(68, Math.max(30, Math.round(impliedProb * 0.80)))
}

// ─── FORM SCORE (weight: 0.30) ────────────────────────────────────────────

function calcFormScore(pick: string, stats: MatchStatistics): number {
  const p = pick.toLowerCase()
  const isHome = p.includes('home') || p === '1' || p === '1x' || p === '12'
  const isAway = p.includes('away') || p === '2' || p === 'x2'
  const isDraw = p === 'draw' || p === 'x'

  if (isDraw) {
    const homeGames = stats.homeWins + stats.homeDraws + stats.homeLosses || 1
    const awayGames = stats.awayWins + stats.awayDraws + stats.awayLosses || 1
    const homeDrawRate = stats.homeDraws / homeGames
    const awayDrawRate = stats.awayDraws / awayGames
    return Math.min(100, Math.round(((homeDrawRate + awayDrawRate) / 2) * 200))
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

  return 50
}

// ─── HOME/AWAY SCORE (weight: 0.20) ──────────────────────────────────────

function calcHomeAwayScore(pick: string, stats: MatchStatistics): number {
  const p = pick.toLowerCase()

  if (p.includes('home') || p === '1' || p === '1x' || p === '12') {
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
  if (p.includes('over') || p.includes('btts') || p.includes('gg')) {
    const avgScoring = (stats.homeAvgScored + stats.awayAvgScored) / 2
    return Math.min(100, Math.round(avgScoring * 40))
  }
  return Math.min(100, Math.round(stats.probHome))
}

// ─── H2H SCORE (weight: 0.15) ────────────────────────────────────────────

function calcH2HScore(pick: string, h2h: H2HRecord): number {
  const p = pick.toLowerCase()
  if (h2h.totalMeetings === 0) return 50

  if (p.includes('home') || p === '1') return Math.min(100, Math.round(h2h.homeWinRate * 100))
  if (p.includes('away') || p === '2') return Math.min(100, Math.round(h2h.awayWinRate * 100))
  if (p === 'draw' || p === 'x') return Math.min(100, Math.round(h2h.drawRate * 100))
  if (p === '1x') return Math.min(100, Math.round((h2h.homeWinRate + h2h.drawRate) * 100))
  if (p === 'x2') return Math.min(100, Math.round((h2h.awayWinRate + h2h.drawRate) * 100))
  if (p === '12') return Math.min(100, Math.round((h2h.homeWinRate + h2h.awayWinRate) * 100))
  if (p.includes('over 0.5')) return h2h.avgGoalsPerGame >= 0.5 ? 85 : 40
  if (p.includes('over 1.5')) return h2h.avgGoalsPerGame >= 2.0 ? 80 : h2h.avgGoalsPerGame >= 1.5 ? 60 : 35
  if (p.includes('over 2.5')) return h2h.avgGoalsPerGame >= 3.0 ? 80 : h2h.avgGoalsPerGame >= 2.5 ? 65 : 35
  if (p.includes('over 3.5')) return h2h.avgGoalsPerGame >= 4.0 ? 78 : h2h.avgGoalsPerGame >= 3.5 ? 62 : 30
  if (p.includes('under 1.5')) return h2h.avgGoalsPerGame <= 1.0 ? 80 : h2h.avgGoalsPerGame <= 1.5 ? 60 : 35
  if (p.includes('under 2.5')) return h2h.avgGoalsPerGame <= 1.5 ? 85 : h2h.avgGoalsPerGame <= 2.5 ? 68 : 35
  if (p === 'yes' || p === 'gg') return h2h.avgGoalsPerGame >= 2.5 ? 75 : h2h.avgGoalsPerGame >= 2.0 ? 60 : 40
  return 50
}

// ─── GOAL TREND SCORE (weight: 0.15) ─────────────────────────────────────

function calcGoalTrendScore(pick: string, stats: MatchStatistics, h2h: H2HRecord | null): number {
  const p = pick.toLowerCase()
  const h2hAvg = h2h?.avgGoalsPerGame || 0
  const expectedGoals =
    ((stats.homeAvgScored + stats.awayAvgConceded) / 2) +
    ((stats.awayAvgScored + stats.homeAvgConceded) / 2)

  if (p.includes('over 0.5')) return (expectedGoals >= 0.5 && h2hAvg >= 0.5) ? 88 : 70
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
    return stats.over15Rate <= 0.30 ? 80 : stats.over15Rate <= 0.45 ? 60 : 35
  }
  if (p.includes('under 2.5')) {
    return stats.over25Rate <= 0.35 ? 82 : stats.over25Rate <= 0.50 ? 65 : 38
  }
  if (p.includes('under 3.5')) return stats.over25Rate <= 0.55 ? 75 : 50
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

function calcOddsScore(odds: number, realProb: number): number {
  if (odds <= 1) return 0
  const impliedProb = (1 / odds) * 100
  const edge = realProb - impliedProb
  if (edge >= 15) return 95
  if (edge >= 10) return 85
  if (edge >= 5)  return 75
  if (edge >= 0)  return 65
  if (edge >= -5) return 55
  if (edge >= -10) return 40
  return 25
}

// ─── TEAM STRENGTH SCORE (weight: 0.10) ──────────────────────────────────

function calcTeamStrengthScore(
  pick: string,
  stats: MatchStatistics,
  homeStrength?: number,
  awayStrength?: number
): number {
  const p = pick.toLowerCase()
  if (homeStrength !== undefined && awayStrength !== undefined) {
    if (p.includes('home') || p === '1') return Math.min(100, homeStrength)
    if (p.includes('away') || p === '2') return Math.min(100, awayStrength)
    return Math.round((homeStrength + awayStrength) / 2)
  }
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
  form: number; homeAway: number; h2h: number; goalTrend: number; odds: number; teamStrength: number
}> {
  try {
    const rule = await prisma.marketRule.findUnique({ where: { marketKey } })
    if (rule) {
      return {
        form: rule.formWeight, homeAway: rule.homeAwayWeight,
        h2h: rule.h2hWeight, goalTrend: rule.goalTrendWeight,
        odds: rule.oddsWeight, teamStrength: rule.teamStrengthWeight,
      }
    }
  } catch { /* use defaults */ }
  return { form: 0.30, homeAway: 0.20, h2h: 0.15, goalTrend: 0.15, odds: 0.10, teamStrength: 0.10 }
}

// ─── MAIN GROOVE SCORE CALCULATOR ────────────────────────────────────────

export async function calculateGrooveScore(input: GrooveScoreInput): Promise<GrooveScoreOutput> {
  const { pick, market, odds, stats, h2h, homeTeamStrength, awayTeamStrength, groqHomeStrength, groqAwayStrength } = input

  const marketKey = resolveMarketKey(pick, market)
  const weights = await getMarketWeights(marketKey)

  const realProb = getRealProbability(pick, stats)
  const impliedProb = odds > 1 ? parseFloat(((1 / odds) * 100).toFixed(1)) : 0
  const valueEdge = parseFloat((realProb - impliedProb).toFixed(1))

  const hasStats = !!stats && (stats.probHome > 0 || stats.homeWins > 0)
  const hasH2H = !!h2h && h2h.totalMeetings > 0
  const dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL' =
    hasStats && hasH2H ? 'FULL' : hasStats || hasH2H ? 'PARTIAL' : 'MINIMAL'

  // ── MINIMAL data: use market+odds inference instead of formula on zeros ──
  if (dataQuality === 'MINIMAL') {
    const inferredScore = inferScoreFromMarketAndOdds(pick, market, odds)
    const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
      inferredScore >= 70 ? 'LOW' : inferredScore >= 50 ? 'MEDIUM' : 'HIGH'
    return {
      grooveScore: inferredScore,
      formScore: 0, homeAwayScore: 0, h2hScore: 0,
      goalTrendScore: 0, oddsScore: 0, teamStrengthScore: 0,
      riskLevel,
      confidence: inferredScore,
      impliedProbability: impliedProb,
      realProbability: impliedProb, // use implied as proxy when no real data
      valueEdge: 0,
      dataQuality: 'MINIMAL',
      breakdown: `ESTIMATED from market+odds: ${pick} @ ${odds} → inferred ${inferredScore}/100`,
    }
  }

  // ── PARTIAL or FULL: use Groq-provided strength if available ──
  const effectiveHomeStrength = groqHomeStrength ?? homeTeamStrength
  const effectiveAwayStrength = groqAwayStrength ?? awayTeamStrength

  const formScore = stats ? calcFormScore(pick, stats) : 40
  const homeAwayScore = stats ? calcHomeAwayScore(pick, stats) : 40
  const h2hScore = h2h ? calcH2HScore(pick, h2h) : 45
  const goalTrendScore = stats ? calcGoalTrendScore(pick, stats, h2h) : 40
  const oddsScore = calcOddsScore(odds, realProb)
  const teamStrengthScore = stats
    ? calcTeamStrengthScore(pick, stats, effectiveHomeStrength, effectiveAwayStrength)
    : 45

  const qualityMultiplier = dataQuality === 'FULL' ? 1.0 : 0.90

  const rawScore =
    (formScore * weights.form) +
    (homeAwayScore * weights.homeAway) +
    (h2hScore * weights.h2h) +
    (goalTrendScore * weights.goalTrend) +
    (oddsScore * weights.odds) +
    (teamStrengthScore * weights.teamStrength)

  const grooveScore = Math.min(99, Math.max(0, Math.round(rawScore * qualityMultiplier)))
  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    grooveScore >= 70 ? 'LOW' : grooveScore >= 50 ? 'MEDIUM' : 'HIGH'

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
    grooveScore, formScore, homeAwayScore, h2hScore,
    goalTrendScore, oddsScore, teamStrengthScore,
    riskLevel, confidence: grooveScore,
    impliedProbability: impliedProb,
    realProbability: realProb,
    valueEdge, dataQuality, breakdown,
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
        fixtureId, pick, market,
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
    const score = await calculateGrooveScore({ pick: p.pick, market: p.market, odds: p.odds, stats, h2h })
    results.set(`${p.pick}|${p.market}`, score)
    await storeConfidenceScore(fixtureId, p.pick, p.market, score)
  }
  return results
}