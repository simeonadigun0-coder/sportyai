// lib/accumulator-builder.ts
// Module 8 — Accumulator Builder Engine
// REDESIGNED: Returns ALL fixtures that qualify for the selected risk tier
// No combinations, no splitting — user sees every qualifying game in one flat list

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
  probability: number
  reason: string
  dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL'
}

export interface AccumulatorBuilderResult {
  picks: AccumulatorPick[]
  fixturesScanned: number
  tier: RiskTier
  minGrooveScore: number
  summary: string
}

// ─── TIER CONFIG ──────────────────────────────────────────────────────────

const TIER_CONFIG: Record<RiskTier, {
  minGrooveScore: number
  label: string
  description: string
}> = {
  SAFE:       { minGrooveScore: 72, label: 'Low Risk',    description: 'Groove Score 72+' },
  BALANCED:   { minGrooveScore: 65, label: 'Medium Risk', description: 'Groove Score 65+' },
  AGGRESSIVE: { minGrooveScore: 55, label: 'High Risk',   description: 'Groove Score 55+' },
}

// ─── CANDIDATE PICKS ──────────────────────────────────────────────────────

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

// ─── GET BEST QUALIFYING PICK FOR A FIXTURE ───────────────────────────────
// Returns the best pick IF it meets the tier's Groove Score threshold.
// Returns null if no pick qualifies.

async function getBestQualifyingPick(
  fixture: Awaited<ReturnType<typeof getTodayFixtures>>[0],
  minGrooveScore: number
): Promise<AccumulatorPick | null> {
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

      // Only consider picks that meet the tier threshold
      if (score.grooveScore < minGrooveScore) continue
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
        dataQuality: score.dataQuality,
      }
    } catch { /* skip */ }
  }

  return bestPick
}

// ─── AI REASONS ───────────────────────────────────────────────────────────

async function addAIReasons(picks: AccumulatorPick[]): Promise<AccumulatorPick[]> {
  if (picks.length === 0) return picks

  const withData = picks.filter(p => p.dataQuality !== 'MINIMAL').slice(0, 15)
  if (withData.length === 0) {
    return picks.map(p => ({
      ...p,
      reason: `Groove Score ${p.grooveScore}/100 — ${p.probability.toFixed(0)}% estimated probability`
    }))
  }

  const lines = withData.map((p, i) =>
    `${i + 1}. ${p.homeTeam} vs ${p.awayTeam} (${p.league}) — ${p.pick} | Score: ${p.grooveScore}/100 | Prob: ${p.probability.toFixed(0)}%`
  ).join('\n')

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Football analyst. Output ONLY valid JSON array. No markdown.' },
        {
          role: 'user',
          content: `Write one short sentence per pick (max 12 words) referencing Groove Score and probability. No mention of odds.\n\n${lines}\n\nReturn ONLY: [{"index":0,"reason":"..."}]`,
        },
      ],
      temperature: 0.15,
      max_tokens: 35 * withData.length + 50,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = clean.indexOf('['), end = clean.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No JSON')

    const parsed = JSON.parse(clean.substring(start, end + 1))
    const reasonMap = new Map<string, string>()
    withData.forEach((p, i) => {
      reasonMap.set(p.fixtureId, parsed[i]?.reason || `Groove Score ${p.grooveScore}/100`)
    })

    return picks.map(p => ({
      ...p,
      reason: reasonMap.get(p.fixtureId) ||
        (p.dataQuality === 'MINIMAL'
          ? `${p.probability.toFixed(0)}% estimated probability — limited data available`
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

// ─── SAVE TO DB ───────────────────────────────────────────────────────────

async function saveToDb(userId: string, tier: RiskTier, picks: AccumulatorPick[]): Promise<void> {
  if (picks.length === 0) return
  try {
    const totalOdds = picks.reduce((acc, p) => acc * p.odds, 1)
    const avgScore = Math.round(picks.reduce((acc, p) => acc + p.grooveScore, 0) / picks.length)
    await prisma.accumulatorBuild.create({
      data: {
        userId,
        targetOdds: totalOdds,
        actualOdds: totalOdds,
        riskLevel: tier === 'SAFE' ? 'LOW' : tier === 'BALANCED' ? 'MEDIUM' : 'HIGH',
        legsCount: picks.length,
        avgGrooveScore: avgScore,
        picks: picks as unknown as object[],
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
  const config = TIER_CONFIG[tier]

  const fixtures = daysAhead <= 1
    ? await getTodayFixtures()
    : await getUpcomingFixtures(daysAhead * 24)

  if (fixtures.length === 0) {
    return {
      picks: [],
      fixturesScanned: 0,
      tier,
      minGrooveScore: config.minGrooveScore,
      summary: 'No fixtures available for the selected date range.',
    }
  }

  // Score all fixtures, keep only those that meet the tier threshold
  const qualifyingPicks: AccumulatorPick[] = []
  const BATCH = 5

  for (let i = 0; i < fixtures.length; i += BATCH) {
    const batch = fixtures.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map(f => getBestQualifyingPick(f, config.minGrooveScore))
    )
    qualifyingPicks.push(...results.filter((p): p is AccumulatorPick => p !== null))
    await new Promise(r => setTimeout(r, 200))
  }

  // Sort by Groove Score descending
  qualifyingPicks.sort((a, b) => b.grooveScore - a.grooveScore)

  // Add AI reasons
  const picksWithReasons = await addAIReasons(qualifyingPicks)

  if (userId && picksWithReasons.length > 0) {
    await saveToDb(userId, tier, picksWithReasons)
  }

  const summary = picksWithReasons.length > 0
    ? `Found ${picksWithReasons.length} ${config.label} picks from ${fixtures.length} fixtures (${config.description}). All sorted by Groove Score.`
    : `No fixtures met the ${config.label} threshold (${config.description}) for this date range. Try Medium or High Risk instead.`

  return {
    picks: picksWithReasons,
    fixturesScanned: fixtures.length,
    tier,
    minGrooveScore: config.minGrooveScore,
    summary,
  }
}