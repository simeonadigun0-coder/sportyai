// lib/accumulator-builder.ts
// Module 8 — Accumulator Builder Engine

import { prisma } from './db/prisma'
import { calculateGrooveScore } from './confidence'
import { fetchAndStoreStatistics, getStatisticsForFixture, getH2HRecord } from './statistics'
import { getTodayFixtures, getUpcomingFixtures } from './fixtures'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── TYPES ────────────────────────────────────────────────────────────────

export type RiskTier = 'SAFE' | 'BALANCED' | 'AGGRESSIVE'

export interface AccumulatorLeg {
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
  reason: string
}

export interface Accumulator {
  id: string
  legs: AccumulatorLeg[]
  totalOdds: number
  avgGrooveScore: number
  avgConfidence: number
  riskTier: RiskTier
  legsCount: number
  potentialReturn: number
  summary: string
}

export interface AccumulatorBuilderResult {
  accumulators: Accumulator[]
  fixturesScanned: number
  summary: string
}

// ─── TIER CONFIG ──────────────────────────────────────────────────────────

const TIER_CONFIG: Record<RiskTier, {
  minGrooveScore: number
  maxOddsPerLeg: number
  minOddsPerLeg: number
  targetMinOdds: number
  targetMaxOdds: number
  preferredMarkets: string[]
}> = {
  SAFE: {
    minGrooveScore: 72,
    maxOddsPerLeg: 1.80,
    minOddsPerLeg: 1.15,
    targetMinOdds: 2.0,
    targetMaxOdds: 8.0,
    preferredMarkets: ['double chance', 'draw no bet', 'over/under', 'btts'],
  },
  BALANCED: {
    minGrooveScore: 65,
    maxOddsPerLeg: 2.50,
    minOddsPerLeg: 1.20,
    targetMinOdds: 5.0,
    targetMaxOdds: 20.0,
    preferredMarkets: ['1x2', 'double chance', 'over/under', 'btts'],
  },
  AGGRESSIVE: {
    minGrooveScore: 58,
    maxOddsPerLeg: 4.00,
    minOddsPerLeg: 1.30,
    targetMinOdds: 15.0,
    targetMaxOdds: 100.0,
    preferredMarkets: ['1x2', 'correct score', 'asian handicap', 'combo'],
  },
}

// ─── CANDIDATE PICKS ──────────────────────────────────────────────────────

const CANDIDATE_PICKS = [
  { pick: 'Home', market: '1X2' },
  { pick: 'Away', market: '1X2' },
  { pick: 'Draw', market: '1X2' },
  { pick: 'Home/Draw', market: 'Double Chance' },
  { pick: 'Draw/Away', market: 'Double Chance' },
  { pick: 'Over 1.5', market: 'Over/Under' },
  { pick: 'Over 2.5', market: 'Over/Under' },
  { pick: 'Under 2.5', market: 'Over/Under' },
  { pick: 'Yes', market: 'BTTS' },
  { pick: 'No', market: 'BTTS' },
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
    if (p === 'home') return stats.oddsHome || (stats.probHome ? parseFloat((100 / stats.probHome).toFixed(2)) : 0)
    if (p === 'draw') return stats.oddsDraw || (stats.probDraw ? parseFloat((100 / stats.probDraw).toFixed(2)) : 0)
    if (p === 'away') return stats.oddsAway || (stats.probAway ? parseFloat((100 / stats.probAway).toFixed(2)) : 0)
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

// ─── GET BEST PICK FOR FIXTURE ────────────────────────────────────────────

async function getBestPickForFixture(
  fixture: Awaited<ReturnType<typeof getTodayFixtures>>[0],
  tier: RiskTier
): Promise<AccumulatorLeg | null> {
  const config = TIER_CONFIG[tier]

  let stats = fixture.statistics
  if (!stats) {
    await fetchAndStoreStatistics(
      fixture.id,
      fixture.homeTeam,
      fixture.awayTeam,
      fixture.homeTeamId,
      fixture.awayTeamId
    )
    stats = await getStatisticsForFixture(fixture.id)
  }

  if (!stats) return null

  const h2h = await getH2HRecord(fixture.homeTeamId, fixture.awayTeamId)

  let bestLeg: AccumulatorLeg | null = null
  let bestScore = 0

  for (const candidate of CANDIDATE_PICKS) {
    try {
      const marketFits = config.preferredMarkets.some(m =>
        candidate.market.toLowerCase().includes(m)
      )
      if (!marketFits && tier === 'SAFE') continue

      const odds = estimateOdds(candidate.pick, candidate.market, stats)
      if (odds < config.minOddsPerLeg || odds > config.maxOddsPerLeg) continue

      const score = await calculateGrooveScore({
        pick: candidate.pick,
        market: candidate.market,
        odds,
        stats,
        h2h,
      })

      if (score.grooveScore < config.minGrooveScore) continue
      if (score.grooveScore <= bestScore) continue

      bestScore = score.grooveScore
      bestLeg = {
        fixtureId: fixture.id,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        league: fixture.league,
        country: fixture.country,
        matchDate: fixture.matchDate,
        pick: candidate.pick,
        market: candidate.market,
        odds,
        grooveScore: score.grooveScore,
        confidence: score.confidence,
        riskLevel: score.riskLevel,
        valueEdge: score.valueEdge,
        reason: '',
      }
    } catch { /* skip */ }
  }

  return bestLeg
}

// ─── BUILD ACCA COMBINATIONS ──────────────────────────────────────────────

function selectBestAccumulators(
  legs: AccumulatorLeg[],
  tier: RiskTier,
  requestedLegs: number
): Accumulator[] {
  const config = TIER_CONFIG[tier]
  const result: Accumulator[] = []
  const sorted = [...legs].sort((a, b) => b.grooveScore - a.grooveScore)
  const sizes = requestedLegs > 0 ? [requestedLegs] : [3, 4, 5, 6, 7, 8]

  for (const size of sizes) {
    if (sorted.length < size) continue

    for (let offset = 0; offset + size <= Math.min(sorted.length, 15); offset++) {
      const candidate = sorted.slice(offset, offset + size)
      const totalOdds = candidate.reduce((acc, l) => acc * l.odds, 1)

      if (totalOdds < config.targetMinOdds || totalOdds > config.targetMaxOdds) continue

      const avgScore = Math.round(candidate.reduce((acc, l) => acc + l.grooveScore, 0) / candidate.length)
      const avgConf = Math.round(candidate.reduce((acc, l) => acc + l.confidence, 0) / candidate.length)

      result.push({
        id: `${tier.toLowerCase()}_${size}leg_${offset}`,
        legs: candidate,
        totalOdds: parseFloat(totalOdds.toFixed(2)),
        avgGrooveScore: avgScore,
        avgConfidence: avgConf,
        riskTier: tier,
        legsCount: size,
        potentialReturn: parseFloat((1000 * totalOdds).toFixed(0)),
        summary: '',
      })

      if (result.length >= 5) break
    }
    if (result.length >= 5) break
  }

  return result
}

// ─── AI REASONS ───────────────────────────────────────────────────────────

async function addAIReasons(accs: Accumulator[]): Promise<Accumulator[]> {
  if (accs.length === 0) return accs

  const allLegs = accs.flatMap(a => a.legs)
  const uniqueLegs = allLegs.filter(
    (l, i, arr) => arr.findIndex(x => x.fixtureId === l.fixtureId && x.pick === l.pick) === i
  )

  if (uniqueLegs.length === 0) return accs

  const legsDesc = uniqueLegs.map((l, i) =>
    `${i + 1}. ${l.homeTeam} vs ${l.awayTeam} — ${l.pick} (${l.market}) @ ${l.odds} | Groove Score: ${l.grooveScore}/100 | Edge: ${l.valueEdge > 0 ? '+' : ''}${l.valueEdge}%`
  ).join('\n')

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Football betting analyst. Output ONLY valid JSON array.' },
        {
          role: 'user',
          content: `Write one specific sentence per pick referencing Groove Score and actual numbers.\n\n${legsDesc}\n\nReturn ONLY: [{"index":0,"reason":"..."}]`,
        },
      ],
      temperature: 0.15,
      max_tokens: 60 * uniqueLegs.length,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = clean.indexOf('['), end = clean.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No JSON')

    const parsed = JSON.parse(clean.substring(start, end + 1))
    const reasonMap = new Map<string, string>()
    uniqueLegs.forEach((l, i) => {
      reasonMap.set(`${l.fixtureId}:${l.pick}`, parsed[i]?.reason || `Groove Score ${l.grooveScore}/100`)
    })

    return accs.map(acc => ({
      ...acc,
      legs: acc.legs.map(l => ({
        ...l,
        reason: reasonMap.get(`${l.fixtureId}:${l.pick}`) || `Groove Score ${l.grooveScore}/100`,
      })),
    }))
  } catch {
    return accs.map(acc => ({
      ...acc,
      legs: acc.legs.map(l => ({
        ...l,
        reason: l.reason || `Groove Score ${l.grooveScore}/100`,
      })),
    }))
  }
}

async function addSummaries(accs: Accumulator[]): Promise<Accumulator[]> {
  return accs.map(a => ({
    ...a,
    summary: a.summary || `${a.legsCount}-leg ${a.riskTier.toLowerCase()} accumulator at ${a.totalOdds} odds. Avg Groove Score ${a.avgGrooveScore}/100. ₦1000 stake returns ₦${a.potentialReturn.toLocaleString()}.`,
  }))
}

// ─── SAVE TO DB ───────────────────────────────────────────────────────────

async function saveToDb(userId: string, acc: Accumulator): Promise<void> {
  try {
    await prisma.accumulatorBuild.create({
      data: {
        userId,
        targetOdds: acc.totalOdds,
        actualOdds: acc.totalOdds,
        riskLevel: acc.riskTier === 'SAFE' ? 'LOW' : acc.riskTier === 'BALANCED' ? 'MEDIUM' : 'HIGH',
        legsCount: acc.legsCount,
        avgGrooveScore: acc.avgGrooveScore,
        picks: acc.legs as unknown as object[],
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
    return { accumulators: [], fixturesScanned: 0, summary: 'No fixtures available for accumulator building.' }
  }

  const legs: AccumulatorLeg[] = []
  const BATCH = 5

  for (let i = 0; i < Math.min(fixtures.length, 30); i += BATCH) {
    const batch = fixtures.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(f => getBestPickForFixture(f, tier)))
    legs.push(...results.filter((l): l is AccumulatorLeg => l !== null))
    await new Promise(r => setTimeout(r, 200))
  }

  if (legs.length < 2) {
    return {
      accumulators: [],
      fixturesScanned: fixtures.length,
      summary: `Only ${legs.length} qualifying picks found. Try a lower risk tier or check back when more fixtures are available.`,
    }
  }

  let accs = selectBestAccumulators(legs, tier, requestedLegs)

  if (accs.length === 0) {
    return {
      accumulators: [],
      fixturesScanned: fixtures.length,
      summary: 'Could not build accumulators within target odds range. Try a different risk tier.',
    }
  }

  accs = await addAIReasons(accs)
  accs = await addSummaries(accs)

  if (userId && accs.length > 0) {
    await saveToDb(userId, accs[0])
  }

  const summary = `Built ${accs.length} ${tier.toLowerCase()} accumulator${accs.length > 1 ? 's' : ''} from ${fixtures.length} fixtures. Best: ${accs[0]?.legsCount}-leg at ${accs[0]?.totalOdds} odds with avg Groove Score ${accs[0]?.avgGrooveScore}/100.`

  return {
    accumulators: accs.slice(0, 5),
    fixturesScanned: fixtures.length,
    summary,
  }
}