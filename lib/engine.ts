// lib/engine.ts
// Module 9 — Groove Slip Engine
// Central integration point for all modules
// This is what every API route calls

import { optimizeSlip } from './slip-optimizer'
import { scanForValueBets, getCachedValueBets, buildCombinations } from './value-bet-engine'
import { buildAccumulators } from './accumulator-builder'
import { ingestFixtures } from './fixtures'
import { fetchStatisticsForUpcomingFixtures } from './statistics'
import { getAllMarketRules } from './market-rules'
import { prisma } from './db/prisma'
import { SportyBetGame } from './sportybet'

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface EngineStatus {
  fixtures: { total: number; upcoming: number; today: number }
  statistics: { total: number; withStats: number; coverage: string }
  marketRules: { total: number; active: number }
  valueBetScans: { total: number; active: number; lastScan: string | null }
  accumulatorBuilds: { total: number; last24h: number }
  slipAnalyses: { total: number; last24h: number; avgGrooveScore: number }
}

// ─── ENGINE STATUS ────────────────────────────────────────────────────────

export async function getEngineStatus(): Promise<EngineStatus> {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const [
    totalFixtures,
    upcomingFixtures,
    todayFixtures,
    totalStats,
    marketRules,
    activeScans,
    lastScan,
    totalBuilds,
    recentBuilds,
    totalAnalyses,
    recentAnalyses,
  ] = await Promise.all([
    prisma.fixture.count(),
    prisma.fixture.count({ where: { status: 'UPCOMING' } }),
    prisma.fixture.count({ where: { matchDate: { gte: todayStart, lte: todayEnd } } }),
    prisma.matchStatistics.count(),
    prisma.marketRule.findMany({ where: { isActive: true } }),
    prisma.valueBetScan.count({ where: { isActive: true } }),
    prisma.valueBetScan.findFirst({ orderBy: { scanDate: 'desc' } }),
    prisma.accumulatorBuild.count(),
    prisma.accumulatorBuild.count({ where: { builtAt: { gte: yesterday } } }),
    prisma.slipAnalysisLog.count(),
    prisma.slipAnalysisLog.findMany({
      where: { analysedAt: { gte: yesterday } },
      select: { avgGrooveScore: true },
    }),
  ])

  const coverage = totalFixtures > 0
    ? `${Math.round((totalStats / totalFixtures) * 100)}%`
    : '0%'

  const avgGrooveScore = recentAnalyses.length > 0
    ? Math.round(recentAnalyses.reduce((acc: number, a: { avgGrooveScore: number }) => acc + a.avgGrooveScore, 0) / recentAnalyses.length)
    : 0

  return {
    fixtures: { total: totalFixtures, upcoming: upcomingFixtures, today: todayFixtures },
    statistics: { total: totalStats, withStats: totalStats, coverage },
    marketRules: { total: marketRules.length, active: marketRules.filter((r: { isActive: boolean }) => r.isActive).length },
    valueBetScans: {
      total: activeScans,
      active: activeScans,
      lastScan: lastScan?.scanDate?.toISOString() || null,
    },
    accumulatorBuilds: { total: totalBuilds, last24h: recentBuilds },
    slipAnalyses: { total: totalAnalyses, last24h: recentAnalyses.length, avgGrooveScore },
  }
}

// ─── SLIP OPTIMIZATION ────────────────────────────────────────────────────

export async function runSlipOptimization(
  games: SportyBetGame[],
  targetOdds: number,
  originalOdds: number,
  allowSwitching: boolean,
  username: string
) {
  return optimizeSlip(games, targetOdds, originalOdds, allowSwitching, username)
}

// ─── VALUE BETS ───────────────────────────────────────────────────────────

export async function runValueBetScan(
  maxOdds: number = 3.5,
  forceRefresh: boolean = false,
  daysAhead: number = 1
) {
  if (!forceRefresh) {
    const cached = await getCachedValueBets()
    if (cached.length > 0) {
      const valueBets = buildCombinations(cached, maxOdds)
      return {
        valueBets: valueBets.slice(0, 20),
        fixturesScanned: cached.length,
        total: valueBets.length,
        summary: `Showing ${cached.length} value picks from today's scan.`,
        fromCache: true,
      }
    }
  }

  const result = await scanForValueBets(maxOdds, daysAhead)
  return { ...result, fromCache: false }
}

// ─── ACCUMULATOR BUILDER ──────────────────────────────────────────────────

export async function runAccumulatorBuilder(
  tier: 'SAFE' | 'BALANCED' | 'AGGRESSIVE' = 'BALANCED',
  legs: number = 0,
  daysAhead: number = 1,
  userId?: string
) {
  return buildAccumulators(tier, legs, daysAhead, userId)
}

// ─── FULL DAILY PIPELINE ──────────────────────────────────────────────────

export async function runDailyPipeline(): Promise<{
  fixtures: { ingested: number; errors: number }
  statistics: { success: number; failed: number }
  valueBets: { total: number; fixturesScanned: number }
  duration: number
}> {
  const start = Date.now()
  console.log('[engine] Starting daily pipeline...')

  const fixtureResult = await ingestFixtures(2)
  const statsResult = await fetchStatisticsForUpcomingFixtures()
  const valueBetResult = await scanForValueBets(3.5, 1)

  const duration = Date.now() - start
  console.log(`[engine] Daily pipeline complete in ${duration}ms`)

  return {
    fixtures: { ingested: fixtureResult.ingested, errors: fixtureResult.errors },
    statistics: { success: statsResult.success, failed: statsResult.failed },
    valueBets: { total: valueBetResult.total, fixturesScanned: valueBetResult.fixturesScanned },
    duration,
  }
}

// ─── MARKET RULES SUMMARY ────────────────────────────────────────────────

export async function getMarketRulesSummary() {
  const rules = await getAllMarketRules()

 const byGroup = rules.reduce((acc: Record<string, unknown[]>, r: { marketGroup: string; marketKey: string; marketName: string; riskCategory: string; keepThreshold: number; safeAlternative: string | null }) => {
    const group = r.marketGroup
    if (!acc[group]) acc[group] = []
    acc[group].push({
      key: r.marketKey,
      name: r.marketName,
      risk: r.riskCategory,
      keepThreshold: r.keepThreshold,
      safeAlternative: r.safeAlternative,
    })
    return acc
  }, {} as Record<string, unknown[]>)

  return {
    total: rules.length,
    byGroup,
    byRisk: {
      SAFE: rules.filter((r: { riskCategory: string }) => r.riskCategory === 'SAFE').length,
      MEDIUM: rules.filter((r: { riskCategory: string }) => r.riskCategory === 'MEDIUM').length,
      HIGH_VOLATILITY: rules.filter((r: { riskCategory: string }) => r.riskCategory === 'HIGH_VOLATILITY').length,
      CUSTOM: rules.filter((r: { riskCategory: string }) => r.riskCategory === 'CUSTOM').length,
    },
  }
}