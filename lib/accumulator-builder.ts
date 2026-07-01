// lib/accumulator-builder.ts
// Module 8 — Accumulator Builder Engine
// REDESIGNED: Returns ALL fixtures for the date range with predictions and probability %
// Risk level = recommendation threshold, not a filter that hides games

import { prisma } from './db/prisma'
import { calculateGrooveScore } from './confidence'
import { fetchAndStoreStatistics, getStatisticsForFixture, getH2HRecord } from './statistics'
import { getTodayFixtures, getUpcomingFixtures } from './fixtures'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── TYPES ────────────────────────────────────────────────────────────────

export type RiskTier = 'SAFE' | 'BALANCED' | 'AGGRESSIVE'

export interface AccumulatorPick {
  fixtureId: string
  homeTeam: string
  awayTeam: string
  league: string
  country: string
  matchDate: Date
  pick: string
  market: string
  odds: number
  grooveScore: number
  confidence: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  valueEdge: number
  probability: number   // real or inferred probability %
  reason: string
  isRecommended: boolean  // meets the selected risk tier threshold
  dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL'
}

export interface SuggestedAccumulator {
  legs: AccumulatorPick[]
  totalOdds: number
  avgGrooveScore: number
  legsCount: number
  potentialReturn: number
}

export interface AccumulatorBuilderResult {
  allPicks: AccumulatorPick[]
  recommendedPicks: AccumulatorPick[]
  suggestedAccumulator: SuggestedAccumulator | null
  fixturesScanned: number
  summary: string
}

// ─── TIER CONFIG ──────────────────────────────────────────────────────────

const TIER_CONFIG: Record<RiskTier, {
  minGrooveScore: number
  label: string
}> = {
  SAFE:       { minGrooveScore: 72, label: 'Safe' },
  BALANCED:   { minGrooveScore: 65, label: 'Balanced' },
  AGGRESSIVE: { minGrooveScore: 55, label: 'Aggressive' },
}

// ─── CANDIDATE PICKS — best pick per fixture ──────────────────────────────

const CANDIDATE_PICKS = [
  { pick: 'Home',      market: '1X2' },
  { pick: 'Away',      market: '1X2' },
  { pick: 'Draw',      market: '1X2' },
  { pick: 'Home/Draw', market: 'Double Chance' },
  { pick: 'Draw/Away', market: 'Double Chance' },
  { pick: 'Over 1.5',  market: 'Over/Under' },
  { pick: 'Over 2.5',  market: 'Over/Under' },
  { pick: 'Under 2.5', market: 'Over/Under' },
  { pick: 'Yes',       market: 'BTTS' },
  { pick: 'No',        market: 'BTTS' },
]

function estimateOdds(
  pick: string,
  market: string,
  stats: { oddsHome?: number | null; oddsDraw?: number | null; oddsAway?: number | null; probHome?: number; probDraw?: number; probAway?: number } | null
): number {
  if (!stats) return 0
  const p = pick.toLowerCase()
  const m = market.toLowerCase()

  if (m === '1x2') {
    if (p === 'home') return stats.oddsHome || (stats.probHome ? parseFloat((100 / Math.max(stats.probHome, 1)).toFixed(2)) : 0)
    if (p === 'draw') return stats.oddsDraw || (stats.probDraw ? parseFloat((100 / Math.max(stats.probDraw, 1)).toFixed(2)) : 0)
    if (p === 'away') return stats.oddsAway || (stats.probAway ? parseFloat((100 / Math.max(stats.probAway, 1)).toFixed(2)) : 0)
  }
  if (p === 'home/draw') return stats.oddsHome ? Math.max(1.10, stats.oddsHome * 0.55) : 1.30
  if (p === 'draw/away') return stats.oddsAway ? Math.max(1.10, stats.oddsAway * 0.60) : 1.40
  if (p === 'over 1.5') return 1.45
  if (p === 'over 2.5') return 1.85
  if (p === 'under 2.5') return 1.90
  if (p === 'yes') return 1.75
  if (p === 'no') return 2.00
  return 0
}

// ─── SCORE ALL PICKS FOR A FIXTURE, RETURN BEST ───────────────────────────

async function getBestPickForFixture(
  fixture: Awaited<ReturnType<typeof getTodayFixtures>>[0],
  tier: RiskTier
): Promise<AccumulatorPick | null> {
  const config = TIER_CONFIG[tier]

  let stats = fixture.statistics
  if (!stats) {
    await fetchAndStoreStatistics(
      fixture.id,
      fixture.fixtureId,
      fixture.homeTeamId,
      fixture.awayTeamId
    )
    stats = await getStatisticsForFixture(fixture.id)
  }

  const h2h = await getH2HRecord(fixture.homeTeamId, fixture.awayTeamId)

  let bestPick: AccumulatorPick | null = null
  let bestScore = -1

  for (const candidate of CANDIDATE_PICKS) {
    try {
      const odds = stats ? estimateOdds(candidate.pick, candidate.market, stats) : 0
      if (odds < 1.05) continue

      const score = await calculateGrooveScore({
        pick: candidate.pick,
        market: candidate.market,
        odds: odds || 2.0,
        stats,
        h2h,
      })

      if (score.grooveScore <= bestScore) continue
      bestScore = score.grooveScore

      bestPick = {
        fixtureId: fixture.id,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        league: fixture.league,
        country: fixture.country,
        matchDate: fixture.matchDate,
        pick: candidate.pick,
        market: candidate.market,
        odds: odds || 2.0,
        grooveScore: score.grooveScore,
        confidence: score.confidence,
        riskLevel: score.riskLevel,
        valueEdge: score.valueEdge,
        probability: score.realProbability > 0 ? score.realProbability : score.impliedProbability,
        reason: '',
        isRecommended: score.grooveScore >= config.minGrooveScore,
        dataQuality: score.dataQuality,
      }
    } catch { /* skip */ }
  }

  // If no picks scored at all, still return a basic entry for the fixture
  if (!bestPick) {
    bestPick = {
      fixtureId: fixture.id,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      league: fixture.league,
      country: fixture.country,
      matchDate: fixture.matchDate,
      pick: 'Home',
      market: '1X2',
      odds: 2.0,
      grooveScore: 50,
      confidence: 50,
      riskLevel: 'MEDIUM',
      valueEdge: 0,
      probability: 50,
      reason: 'Insufficient data for analysis',
      isRecommended: false,
      dataQuality: 'MINIMAL',
    }
  }

  return bestPick
}

// ─── AI REASONS ───────────────────────────────────────────────────────────

async function addAIReasons(picks: AccumulatorPick[]): Promise<AccumulatorPick[]> {
  if (picks.length === 0) return picks

  // Only generate reasons for recommended picks to save tokens
  const recommended = picks.filter(p => p.isRecommended && p.dataQuality !== 'MINIMAL')
  if (recommended.length === 0) return picks

  const lines = recommended.map((p, i) =>
    `${i + 1}. ${p.homeTeam} vs ${p.awayTeam} (${p.league}) — ${p.pick} @ ${p.odds} | Groove Score: ${p.grooveScore}/100 | Probability: ${p.probability.toFixed(0)}%`
  ).join('\n')

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Football analyst. Output ONLY valid JSON array. No markdown.' },
        {
          role: 'user',
          content: `Write one short sentence per pick (max 15 words) referencing Groove Score and probability.\n\n${lines}\n\nReturn ONLY: [{"index":0,"reason":"..."}]`,
        },
      ],
      temperature: 0.15,
      max_tokens: 40 * recommended.length + 50,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = clean.indexOf('['), end = clean.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No JSON')

    const parsed = JSON.parse(clean.substring(start, end + 1))
    const reasonMap = new Map<string, string>()
    recommended.forEach((p, i) => {
      reasonMap.set(p.fixtureId, parsed[i]?.reason || `Groove Score ${p.grooveScore}/100 — ${p.probability.toFixed(0)}% probability`)
    })

    return picks.map(p => ({
      ...p,
      reason: reasonMap.get(p.fixtureId) ||
        (p.dataQuality === 'MINIMAL'
          ? `Estimated ${p.probability.toFixed(0)}% probability based on market data`
          : `Groove Score ${p.grooveScore}/100 — ${p.probability.toFixed(0)}% probability`
        )
    }))
  } catch {
    return picks.map(p => ({
      ...p,
      reason: p.reason || `Groove Score ${p.grooveScore}/100 — ${p.probability.toFixed(0)}% probability`
    }))
  }
}

// ─── BUILD SUGGESTED ACCUMULATOR FROM RECOMMENDED PICKS ───────────────────

function buildSuggestedAccumulator(
  recommended: AccumulatorPick[]
): SuggestedAccumulator | null {
  if (recommended.length < 2) return null

  // Sort by Groove Score, take top picks
  const sorted = [...recommended].sort((a, b) => b.grooveScore - a.grooveScore)
  const legs = sorted.slice(0, Math.min(5, sorted.length))

  const totalOdds = legs.reduce((acc, l) => acc * l.odds, 1)
  const avgGrooveScore = Math.round(legs.reduce((acc, l) => acc + l.grooveScore, 0) / legs.length)

  return {
    legs,
    totalOdds: parseFloat(totalOdds.toFixed(2)),
    avgGrooveScore,
    legsCount: legs.length,
    potentialReturn: parseFloat((1000 * totalOdds).toFixed(0)),
  }
}

// ─── SAVE TO DB ───────────────────────────────────────────────────────────

async function saveToDb(userId: string, suggested: SuggestedAccumulator): Promise<void> {
  try {
    await prisma.accumulatorBuild.create({
      data: {
        userId,
        targetOdds: suggested.totalOdds,
        actualOdds: suggested.totalOdds,
        riskLevel: suggested.avgGrooveScore >= 72 ? 'LOW' : suggested.avgGrooveScore >= 65 ? 'MEDIUM' : 'HIGH',
        legsCount: suggested.legsCount,
        avgGrooveScore: suggested.avgGrooveScore,
        picks: suggested.legs as unknown as object[],
      },
    })
  } catch { /* non-critical */ }
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────

export async function buildAccumulators(
  tier: RiskTier = 'BALANCED',
  requestedLegs: number = 0,
  daysAhead: number = 1,
  userId?: string
): Promise<AccumulatorBuilderResult> {
  const fixtures = daysAhead <= 1
    ? await getTodayFixtures()
    : await getUpcomingFixtures(daysAhead * 24)

  if (fixtures.length === 0) {
    return {
      allPicks: [],
      recommendedPicks: [],
      suggestedAccumulator: null,
      fixturesScanned: 0,
      summary: 'No fixtures available for the selected date range.',
    }
  }

  // Score all fixtures in batches
  const allPicks: AccumulatorPick[] = []
  const BATCH = 5

  for (let i = 0; i < fixtures.length; i += BATCH) {
    const batch = fixtures.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(f => getBestPickForFixture(f, tier)))
    allPicks.push(...results.filter((p): p is AccumulatorPick => p !== null))
    await new Promise(r => setTimeout(r, 200))
  }

  // Sort: recommended first (by Groove Score), then others (by Groove Score)
  allPicks.sort((a, b) => {
    if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1
    return b.grooveScore - a.grooveScore
  })

  // Add AI reasons for recommended picks
  const picksWithReasons = await addAIReasons(allPicks)

  const recommendedPicks = picksWithReasons.filter(p => p.isRecommended)
  const suggestedAccumulator = buildSuggestedAccumulator(recommendedPicks)

  if (userId && suggestedAccumulator) {
    await saveToDb(userId, suggestedAccumulator)
  }

  const config = TIER_CONFIG[tier]
  const summary = `Found ${allPicks.length} fixtures for your selected range. ${recommendedPicks.length} meet the ${config.label} threshold (Groove Score ${config.minGrooveScore}+).${suggestedAccumulator ? ` Suggested ${suggestedAccumulator.legsCount}-leg accumulator at ${suggestedAccumulator.totalOdds}x odds.` : ''}`

  return {
    allPicks: picksWithReasons,
    recommendedPicks,
    suggestedAccumulator,
    fixturesScanned: fixtures.length,
    summary,
  }
}