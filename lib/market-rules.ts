// lib/market-rules.ts
// Module 4 — Market Rules Engine
// Reads market rules from DB and applies them to picks
// Used by slip optimiser, value bet engine, and accumulator builder

import { prisma } from './db/prisma'
import { MatchStatistics, H2HRecord } from '@prisma/client'

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface MarketRuleResult {
  marketKey: string
  marketName: string
  marketGroup: string
  decision: 'KEEP' | 'REPLACE' | 'REMOVE'
  riskCategory: string
  minConfidence: number
  keepThreshold: number
  replaceThreshold: number
  removeThreshold: number
  safeAlternative: string | null
  correlationGroup: string | null
  weights: {
    form: number
    homeAway: number
    h2h: number
    goalTrend: number
    odds: number
    teamStrength: number
  }
  requiredMetrics: string[]
  hasRequiredData: boolean
  missingMetrics: string[]
}

export interface PickEvaluation {
  pick: string
  market: string
  marketKey: string
  odds: number
  decision: 'KEEP' | 'REPLACE' | 'REMOVE'
  grooveScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
  safeAlternative: string | null
  reason: string
  valueEdge: number
}

// ─── MARKET KEY RESOLVER ──────────────────────────────────────────────────
// Maps pick + market strings to marketKey in DB

export function resolveMarketKey(pick: string, market: string): string {
  const p = pick.toLowerCase().trim()
  const m = market.toLowerCase().trim()

  // 1X2
  if (m === '1x2' || m.includes('match result') || m.includes('full time result')) {
    if (p === 'home' || p === '1') return '1x2_home'
    if (p === 'away' || p === '2') return '1x2_away'
    if (p === 'draw' || p === 'x') return '1x2_draw'
  }

  // Double Chance
  if (m.includes('double chance')) {
    if (p === 'home/draw' || p === '1x') return 'double_chance_1x'
    if (p === 'draw/away' || p === 'x2') return 'double_chance_x2'
    if (p === 'home/away' || p === '12') return 'double_chance_12'
  }

  // Draw No Bet
  if (m.includes('draw no bet')) {
    if (p.includes('home') || p === '1') return 'draw_no_bet_home'
    if (p.includes('away') || p === '2') return 'draw_no_bet_away'
  }

  // Over/Under
  if (m.includes('over') || m.includes('under') || m.includes('goals')) {
    if (!m.includes('corner') && !m.includes('card')) {
      if (p === 'over 0.5') return 'over_05'
      if (p === 'over 1.5') return 'over_15'
      if (p === 'over 2.5') return 'over_25'
      if (p === 'over 3.5') return 'over_35'
      if (p === 'over 4.5') return 'over_45'
      if (p === 'under 1.5') return 'under_15'
      if (p === 'under 2.5') return 'under_25'
      if (p === 'under 3.5') return 'under_35'
    }
  }

  // BTTS
  if (m.includes('btts') || m.includes('both teams') || m.includes('gg')) {
    if (p === 'yes' || p === 'gg') return 'btts_yes'
    if (p === 'no' || p === 'ng') return 'btts_no'
  }

  // Asian Handicap / 1UP / 2UP
  if (m.includes('1up') || m.includes('1 up') || m.includes('+1')) {
    if (p.includes('home') || p === '1') return '1up_home'
    if (p.includes('away') || p === '2') return '1up_away'
  }
  if (m.includes('2up') || m.includes('2 up') || m.includes('+2')) {
    if (p.includes('home') || p === '1') return '2up_home'
    if (p.includes('away') || p === '2') return '2up_away'
  }

  // Half Time
  if (m.includes('half time') || m.includes('ht result')) {
    if (p.includes('home') || p === '1') return 'ht_home_win'
    if (p.includes('away') || p === '2') return 'ht_away_win'
  }

  // HT/FT
  if (m.includes('ht/ft') || m.includes('half time/full time')) {
    if (p.includes('home/home') || p.includes('1/1')) return 'ht_ft_home_home'
  }

  // Clean Sheet
  if (m.includes('clean sheet')) {
    if (p.includes('home') || p === 'yes') return 'home_clean_sheet'
    if (p.includes('away')) return 'away_clean_sheet'
  }

  // Win to Nil
  if (m.includes('win to nil') || m.includes('to nil')) {
    if (p.includes('home')) return 'home_win_to_nil'
    if (p.includes('away')) return 'away_win_to_nil'
  }

  // Team to Score
  if (m.includes('team to score') || m.includes('to score')) {
    if (p.includes('home')) return 'home_over_05_scored'
    if (p.includes('away')) return 'away_over_05_scored'
  }

  // Combo markets
  if (m.includes('&') || m.includes('and')) {
    if (p.includes('home') && p.includes('over 1.5')) return 'home_and_over_15'
    if (p.includes('home') && p.includes('btts')) return 'home_and_btts'
    if (p.includes('away') && p.includes('over 1.5')) return 'away_and_over_15'
    if (p.includes('away') && p.includes('btts')) return 'away_and_btts'
    if (p.includes('draw') && p.includes('btts')) return 'draw_and_btts'
  }

  // Correct Score
  if (m.includes('correct score') || m.includes('exact score')) {
    if (p === '1-0' || p === '1:0') return 'exact_score_10'
    if (p === '2-0' || p === '2:0') return 'exact_score_20'
    if (p === '2-1' || p === '2:1') return 'exact_score_21'
  }

  // Default — return generic key
  return `${m.replace(/[^a-z0-9]/g, '_')}_${p.replace(/[^a-z0-9]/g, '_')}`
}

// ─── CHECK AVAILABLE DATA ─────────────────────────────────────────────────

function checkRequiredData(
  requiredMetrics: string[],
  stats: MatchStatistics | null,
  h2h: H2HRecord | null
): { hasRequired: boolean; missing: string[] } {
  const missing: string[] = []

  for (const metric of requiredMetrics) {
    switch (metric) {
      case 'form':
        if (!stats || (stats.homeWins === 0 && stats.homeDraws === 0 && stats.homeLosses === 0)) {
          missing.push('form')
        }
        break
      case 'homeAway':
        if (!stats || stats.probHome === 0) missing.push('homeAway')
        break
      case 'h2h':
        if (!h2h || h2h.totalMeetings === 0) missing.push('h2h')
        break
      case 'goalTrend':
        if (!stats || (stats.over15Rate === 0 && stats.over25Rate === 0)) missing.push('goalTrend')
        break
      case 'odds':
        if (!stats || !stats.oddsHome) missing.push('odds')
        break
      case 'teamStrength':
        if (!stats || stats.probHome === 0) missing.push('teamStrength')
        break
    }
  }

  return { hasRequired: missing.length === 0, missing }
}

// ─── GET MARKET RULE FROM DB ──────────────────────────────────────────────

let marketRulesCache: Map<string, Awaited<ReturnType<typeof prisma.marketRule.findUnique>>> | null = null
let cacheExpiry = 0

async function getMarketRule(marketKey: string) {
  const now = Date.now()

  // Cache for 1 hour — rules don't change often
  if (!marketRulesCache || now > cacheExpiry) {
    const rules = await prisma.marketRule.findMany({ where: { isActive: true } })
    marketRulesCache = new Map(rules.map(r => [r.marketKey, r]))
    cacheExpiry = now + 60 * 60 * 1000
  }

  return marketRulesCache.get(marketKey) || null
}

// ─── APPLY MARKET RULE ────────────────────────────────────────────────────

export async function applyMarketRule(
  pick: string,
  market: string,
  odds: number,
  grooveScore: number,
  stats: MatchStatistics | null,
  h2h: H2HRecord | null
): Promise<PickEvaluation> {
  const marketKey = resolveMarketKey(pick, market)
  const rule = await getMarketRule(marketKey)

  // No rule found — use conservative defaults
  if (!rule) {
    const decision = grooveScore >= 65 ? 'KEEP' : grooveScore >= 45 ? 'REPLACE' : 'REMOVE'
    return {
      pick,
      market,
      marketKey,
      odds,
      decision,
      grooveScore,
      riskLevel: grooveScore >= 65 ? 'LOW' : grooveScore >= 45 ? 'MEDIUM' : 'HIGH',
      confidence: grooveScore,
      safeAlternative: null,
      reason: `No specific rule for this market — using Groove Score of ${grooveScore}`,
      valueEdge: 0,
    }
  }

  const requiredMetrics = rule.requiredMetrics as string[]
  const { hasRequired, missing } = checkRequiredData(requiredMetrics, stats, h2h)

  // Calculate value edge
  const impliedProb = odds > 1 ? (1 / odds) * 100 : 0
  const realProb = stats ?
    (pick.toLowerCase().includes('home') ? stats.probHome :
     pick.toLowerCase().includes('away') ? stats.probAway :
     stats.probDraw) : 0
  const valueEdge = realProb > 0 ? parseFloat((realProb - impliedProb).toFixed(1)) : 0

  // Apply thresholds
  let decision: 'KEEP' | 'REPLACE' | 'REMOVE'
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  let reason: string

  if (!hasRequired) {
    // Missing critical data — be conservative
    if (odds >= 3.0) {
      decision = 'REMOVE'
      reason = `Missing data (${missing.join(', ')}) and odds ${odds} are too high to keep blindly`
    } else if (odds >= 2.0) {
      decision = 'REPLACE'
      reason = `Missing ${missing.join(', ')} data — replacing with safer option`
    } else {
      decision = grooveScore >= rule.keepThreshold ? 'KEEP' : 'REPLACE'
      reason = `Low odds (${odds}) kept despite missing ${missing.join(', ')} data`
    }
    riskLevel = 'HIGH'
  } else if (grooveScore >= rule.keepThreshold) {
    decision = 'KEEP'
    riskLevel = grooveScore >= 80 ? 'LOW' : 'MEDIUM'
    reason = `Groove Score ${grooveScore} meets keep threshold of ${rule.keepThreshold} for ${rule.marketName}`
  } else if (grooveScore >= rule.replaceThreshold) {
    decision = 'REPLACE'
    riskLevel = 'MEDIUM'
    reason = `Groove Score ${grooveScore} is below keep threshold (${rule.keepThreshold}) — safer alternative recommended`
  } else if (grooveScore >= rule.removeThreshold) {
    decision = 'REPLACE'
    riskLevel = 'HIGH'
    reason = `Groove Score ${grooveScore} is low — this pick needs a safer replacement`
  } else {
    decision = 'REMOVE'
    riskLevel = 'HIGH'
    reason = `Groove Score ${grooveScore} is below remove threshold (${rule.removeThreshold}) — pick removed`
  }

  return {
    pick,
    market,
    marketKey,
    odds,
    decision,
    grooveScore,
    riskLevel,
    confidence: Math.min(99, grooveScore),
    safeAlternative: rule.safeAlternative,
    reason,
    valueEdge,
  }
}

// ─── GET SAFE ALTERNATIVE ─────────────────────────────────────────────────

export async function getSafeAlternative(marketKey: string): Promise<{
  marketKey: string
  marketName: string
  marketGroup: string
} | null> {
  const rule = await getMarketRule(marketKey)
  if (!rule?.safeAlternative) return null

  const altRule = await getMarketRule(rule.safeAlternative)
  if (!altRule) return null

  return {
    marketKey: altRule.marketKey,
    marketName: altRule.marketName,
    marketGroup: altRule.marketGroup,
  }
}

// ─── CHECK ACCUMULATOR CORRELATION ───────────────────────────────────────
// Penalises accumulators with correlated picks (e.g. Home Win + Over 2.5 same game)

export async function checkCorrelation(
  picks: Array<{ pick: string; market: string; fixtureId: string }>
): Promise<{
  hasCorrelation: boolean
  correlatedPairs: Array<{ a: string; b: string; reason: string }>
  penalty: number
}> {
  const correlatedPairs: Array<{ a: string; b: string; reason: string }> = []

  // Group by fixture
  const byFixture = new Map<string, typeof picks>()
  for (const p of picks) {
    const existing = byFixture.get(p.fixtureId) || []
    existing.push(p)
    byFixture.set(p.fixtureId, existing)
  }

  // Same fixture picks are always correlated
  for (const [fixtureId, fixturePicks] of byFixture.entries()) {
    if (fixturePicks.length > 1) {
      for (let i = 0; i < fixturePicks.length; i++) {
        for (let j = i + 1; j < fixturePicks.length; j++) {
          correlatedPairs.push({
            a: `${fixturePicks[i].pick} (${fixturePicks[i].market})`,
            b: `${fixturePicks[j].pick} (${fixturePicks[j].market})`,
            reason: 'Same fixture — picks are correlated',
          })
        }
      }
    }
  }

  // Cross-fixture correlation check via correlation groups
  const marketKeys = await Promise.all(
    picks.map(async p => {
      const key = resolveMarketKey(p.pick, p.market)
      const rule = await getMarketRule(key)
      return { ...p, correlationGroup: rule?.correlationGroup || null }
    })
  )

  // Picks in same correlation group across different fixtures add mild correlation
  const groupsByFixture = new Map<string, Set<string>>()
  for (const p of marketKeys) {
    if (!p.correlationGroup) continue
    const existing = groupsByFixture.get(p.fixtureId) || new Set()
    existing.add(p.correlationGroup)
    groupsByFixture.set(p.fixtureId, existing)
  }

  const hasCorrelation = correlatedPairs.length > 0
  const penalty = correlatedPairs.length * 5 // 5% confidence penalty per correlated pair

  return { hasCorrelation, correlatedPairs, penalty }
}

// ─── GET ALL ACTIVE RULES ─────────────────────────────────────────────────

export async function getAllMarketRules() {
  return prisma.marketRule.findMany({
    where: { isActive: true },
    orderBy: [{ marketGroup: 'asc' }, { minConfidence: 'asc' }],
  })
}

export async function getMarketRulesByGroup(group: string) {
  return prisma.marketRule.findMany({
    where: { isActive: true, marketGroup: group },
  })
}

export async function getSafeMarkets() {
  return prisma.marketRule.findMany({
    where: { isActive: true, riskCategory: 'SAFE' },
  })
}