// lib/value-bet-engine.ts
// Module 7 — Value Bet Engine
// Scans all upcoming fixtures and finds picks where real probability > implied probability
// Uses Groove Score as the quality filter — only surfaces bets with score ≥ 65

import { prisma } from './db/prisma'
import { calculateGrooveScore } from './confidence'
import { fetchAndStoreStatistics, getStatisticsForFixture, getH2HRecord } from './statistics'
import { getTodayFixtures, getUpcomingFixtures } from './fixtures'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── CONFIG ───────────────────────────────────────────────────────────────

const MIN_GROOVE_SCORE = 65
const MIN_VALUE_EDGE = 5        // real prob must exceed implied by at least 5%
const MIN_ODDS = 1.30
const MAX_ODDS = 4.00
const MAX_BETS_RETURNED = 20

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface ValueBetLeg {
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
  realProbability: number
  impliedProbability: number
  valueEdge: number
  confidence: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  formSummary: string
}

export interface ValueBet {
  id: string
  legs: ValueBetLeg[]
  totalOdds: number
  combinedProbability: number
  avgGrooveScore: number
  avgEdge: number
  avgConfidence: number
  legsCount: number
}

export interface ValueBetResult {
  valueBets: ValueBet[]
  fixturesScanned: number
  total: number
  summary: string
}

// ─── SCAN FIXTURE FOR VALUE ───────────────────────────────────────────────

const VALUE_PICKS = [
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

function getOddsForPick(
  pick: string,
  market: string,
  stats: { oddsHome?: number | null; oddsDraw?: number | null; oddsAway?: number | null } | null
): number {
  if (!stats) return 0
  const p = pick.toLowerCase()
  const m = market.toLowerCase()

  if (m === '1x2') {
    if (p === 'home' || p === '1') return stats.oddsHome || 0
    if (p === 'draw' || p === 'x') return stats.oddsDraw || 0
    if (p === 'away' || p === '2') return stats.oddsAway || 0
  }

  // Estimate for markets without direct odds
  if (p === 'home/draw') return stats.oddsHome ? Math.max(1.10, stats.oddsHome * 0.55) : 0
  if (p === 'draw/away') return stats.oddsAway ? Math.max(1.10, stats.oddsAway * 0.60) : 0
  if (p === 'over 1.5') return 1.45
  if (p === 'over 2.5') return 1.85
  if (p === 'under 2.5') return 1.90
  if (p === 'yes') return 1.75
  if (p === 'no') return 1.95

  return 0
}

async function scanFixtureForValue(
  fixture: Awaited<ReturnType<typeof getTodayFixtures>>[0]
): Promise<ValueBetLeg[]> {
  const legs: ValueBetLeg[] = []

  // Get or fetch statistics
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

  if (!stats) return legs

  const h2h = await getH2HRecord(fixture.homeTeamId, fixture.awayTeamId)

  // Score each pick
  for (const p of VALUE_PICKS) {
    try {
      const odds = getOddsForPick(p.pick, p.market, stats)
      if (odds < MIN_ODDS || odds > MAX_ODDS) continue

      const score = await calculateGrooveScore({
        pick: p.pick,
        market: p.market,
        odds,
        stats,
        h2h,
      })

      // Only include if Groove Score and value edge meet thresholds
      if (score.grooveScore < MIN_GROOVE_SCORE) continue
      if (score.valueEdge < MIN_VALUE_EDGE) continue
      if (score.realProbability <= 0) continue

      // Build form summary
      const formSummary = `${fixture.homeTeam} ${stats.homeFormString || 'N/A'} (${stats.homeAvgScored.toFixed(1)} scored/game) | ${fixture.awayTeam} ${stats.awayFormString || 'N/A'} (${stats.awayAvgScored.toFixed(1)} scored/game) | BSD: ${stats.probHome}% / ${stats.probDraw}% / ${stats.probAway}%`

      legs.push({
        fixtureId: fixture.id,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        league: fixture.league,
        country: fixture.country,
        matchDate: fixture.matchDate,
        pick: p.pick,
        market: p.market,
        odds,
        grooveScore: score.grooveScore,
        realProbability: score.realProbability,
        impliedProbability: score.impliedProbability,
        valueEdge: score.valueEdge,
        confidence: score.confidence,
        riskLevel: score.riskLevel,
        reason: '',
        formSummary,
      })
    } catch { /* skip failed picks */ }
  }

  return legs
}

// ─── AI REASON GENERATOR ─────────────────────────────────────────────────

async function generateValueBetReasons(legs: ValueBetLeg[]): Promise<ValueBetLeg[]> {
  if (legs.length === 0) return legs

  const legsDesc = legs.map((l, i) => `
${i + 1}. ${l.homeTeam} vs ${l.awayTeam} (${l.league})
   Pick: ${l.pick} @ ${l.odds} odds
   Groove Score: ${l.grooveScore}/100 | Value Edge: +${l.valueEdge}%
   Real Prob: ${l.realProbability}% vs Implied: ${l.impliedProbability}%
   Form: ${l.formSummary}`).join('\n')

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a football value betting analyst. Write concise, data-backed reasons for value bets. Output ONLY valid JSON array.',
        },
        {
          role: 'user',
          content: `Write a specific 1-sentence reason for each value bet below. Reference the actual numbers — Groove Score, value edge, form, probability. Never be vague.

${legsDesc}

Return ONLY a JSON array with one object per bet in the same order:
[{"index":0,"reason":"Specific data-backed reason"}]`,
        },
      ],
      temperature: 0.15,
      max_tokens: 80 * legs.length,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = clean.indexOf('['), end = clean.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No JSON')

    const parsed = JSON.parse(clean.substring(start, end + 1))
    return legs.map((l, i) => ({
      ...l,
      reason: parsed[i]?.reason || `Groove Score ${l.grooveScore}/100 with +${l.valueEdge}% value edge over bookmaker odds`,
    }))
  } catch {
    return legs.map(l => ({
      ...l,
      reason: `Groove Score ${l.grooveScore}/100 with +${l.valueEdge}% value edge — real probability ${l.realProbability}% vs implied ${l.impliedProbability}%`,
    }))
  }
}

// ─── BUILD VALUE BET COMBINATIONS ────────────────────────────────────────

export function buildCombinations(legs: ValueBetLeg[], maxOdds: number): ValueBet[] {
  const bets: ValueBet[] = []

  // Sort by groove score descending
  const sorted = [...legs].sort((a, b) => b.grooveScore - a.grooveScore)

  // Single legs
  for (const leg of sorted) {
    if (leg.odds >= MIN_ODDS && leg.odds <= maxOdds) {
      bets.push({
        id: `single_${leg.fixtureId}_${leg.pick.replace(/\s/g, '_')}`,
        legs: [leg],
        totalOdds: parseFloat(leg.odds.toFixed(2)),
        combinedProbability: leg.realProbability,
        avgGrooveScore: leg.grooveScore,
        avgEdge: leg.valueEdge,
        avgConfidence: leg.confidence,
        legsCount: 1,
      })
    }
  }

  // 2-leg combinations
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i], b = sorted[j]
      if (a.fixtureId === b.fixtureId) continue // no same-game combos

      const totalOdds = a.odds * b.odds
      if (totalOdds < MIN_ODDS || totalOdds > maxOdds) continue

      const combinedProb = (a.realProbability / 100) * (b.realProbability / 100) * 100
      if (combinedProb < 60) continue

      bets.push({
        id: `double_${a.fixtureId}_${b.fixtureId}`,
        legs: [a, b],
        totalOdds: parseFloat(totalOdds.toFixed(2)),
        combinedProbability: parseFloat(combinedProb.toFixed(1)),
        avgGrooveScore: Math.round((a.grooveScore + b.grooveScore) / 2),
        avgEdge: parseFloat(((a.valueEdge + b.valueEdge) / 2).toFixed(1)),
        avgConfidence: Math.round((a.confidence + b.confidence) / 2),
        legsCount: 2,
      })
    }
  }

  // 3-leg combinations
  for (let i = 0; i < Math.min(sorted.length, 12); i++) {
    for (let j = i + 1; j < Math.min(sorted.length, 12); j++) {
      for (let k = j + 1; k < Math.min(sorted.length, 12); k++) {
        const a = sorted[i], b = sorted[j], c = sorted[k]
        const ids = new Set([a.fixtureId, b.fixtureId, c.fixtureId])
        if (ids.size < 3) continue

        const totalOdds = a.odds * b.odds * c.odds
        if (totalOdds < MIN_ODDS || totalOdds > maxOdds) continue

        const combinedProb = (a.realProbability / 100) * (b.realProbability / 100) * (c.realProbability / 100) * 100
        if (combinedProb < 50) continue

        bets.push({
          id: `treble_${a.fixtureId}_${b.fixtureId}_${c.fixtureId}`,
          legs: [a, b, c],
          totalOdds: parseFloat(totalOdds.toFixed(2)),
          combinedProbability: parseFloat(combinedProb.toFixed(1)),
          avgGrooveScore: Math.round((a.grooveScore + b.grooveScore + c.grooveScore) / 3),
          avgEdge: parseFloat(((a.valueEdge + b.valueEdge + c.valueEdge) / 3).toFixed(1)),
          avgConfidence: Math.round((a.confidence + b.confidence + c.confidence) / 3),
          legsCount: 3,
        })
      }
    }
  }

  // Sort by combined probability then total odds
  bets.sort((a, b) => {
    if (b.combinedProbability !== a.combinedProbability) return b.combinedProbability - a.combinedProbability
    return b.totalOdds - a.totalOdds
  })

  // Deduplicate
  const seen = new Set<string>()
  return bets.filter(bet => {
    const key = bet.legs.map(l => `${l.fixtureId}:${l.pick}`).sort().join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ─── STORE VALUE BET SCANS ────────────────────────────────────────────────

async function storeValueBetScans(legs: ValueBetLeg[]): Promise<void> {
  try {
    // Deactivate old scans
    await prisma.valueBetScan.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Store new scans
    await prisma.valueBetScan.createMany({
      data: legs.map(l => ({
        fixtureId: l.fixtureId,
        pick: l.pick,
        market: l.market,
        odds: l.odds,
        grooveScore: l.grooveScore,
        realProbability: l.realProbability,
        impliedProbability: l.impliedProbability,
        valueEdge: l.valueEdge,
        confidence: l.confidence,
        reason: l.reason,
        isActive: true,
      })),
      skipDuplicates: true,
    })
  } catch (err) {
    console.error('[value-bet-engine] Failed to store scans:', err)
  }
}

// ─── SUMMARY GENERATOR ───────────────────────────────────────────────────

async function generateValueBetSummary(
  fixturesScanned: number,
  totalBets: number,
  topBet: ValueBet | null
): Promise<string> {
  const fallback = `Scanned ${fixturesScanned} fixtures and found ${totalBets} value bet opportunities. ${topBet ? `Top pick: ${topBet.legs[0].homeTeam} vs ${topBet.legs[0].awayTeam} — ${topBet.legs[0].pick} at ${topBet.totalOdds} odds with Groove Score ${topBet.avgGrooveScore}/100.` : ''}`

  if (!topBet) return fallback

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Write 2-sentence value bet summaries for Nigerian punters. Casual, warm, direct. No markdown.',
        },
        {
          role: 'user',
          content: `Scanned ${fixturesScanned} fixtures, found ${totalBets} value bets. Best: ${topBet.legsCount}-leg at ${topBet.totalOdds} odds, Groove Score ${topBet.avgGrooveScore}/100, +${topBet.avgEdge}% edge. Top match: ${topBet.legs[0].homeTeam} vs ${topBet.legs[0].awayTeam} — ${topBet.legs[0].pick}. Summarise in 2 sentences for a punter.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 120,
    })
    return completion.choices[0]?.message?.content || fallback
  } catch {
    return fallback
  }
}

// ─── MAIN VALUE BET SCANNER ───────────────────────────────────────────────

export async function scanForValueBets(
  maxOdds: number = 3.5,
  daysAhead: number = 1
): Promise<ValueBetResult> {
  // Get upcoming fixtures
  const fixtures = daysAhead <= 1
    ? await getTodayFixtures()
    : await getUpcomingFixtures(daysAhead * 24)

  if (fixtures.length === 0) {
    return { valueBets: [], fixturesScanned: 0, total: 0, summary: 'No fixtures found for today.' }
  }

  // Scan each fixture — batch to avoid overwhelming BSD
  const allLegs: ValueBetLeg[] = []
  const BATCH = 6

  for (let i = 0; i < Math.min(fixtures.length, 40); i += BATCH) {
    const batch = fixtures.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(f => scanFixtureForValue(f)))
    allLegs.push(...results.flat())
    await new Promise(r => setTimeout(r, 300))
  }

  // Sort legs by groove score
  allLegs.sort((a, b) => b.grooveScore - a.grooveScore)

  // Generate AI reasons for top legs only
  const topLegs = allLegs.slice(0, 20)
  const legsWithReasons = await generateValueBetReasons(topLegs)

  // Store in DB
  await storeValueBetScans(legsWithReasons)

  // Build combinations
  const valueBets = buildCombinations(legsWithReasons, maxOdds)
  const topBets = valueBets.slice(0, MAX_BETS_RETURNED)

  // Generate summary
  const summary = await generateValueBetSummary(
    fixtures.length,
    valueBets.length,
    topBets[0] || null
  )

  return {
    valueBets: topBets,
    fixturesScanned: fixtures.length,
    total: valueBets.length,
    summary,
  }
}

// ─── GET CACHED VALUE BETS ────────────────────────────────────────────────
// Returns today's already-scanned value bets from DB

export async function getCachedValueBets(): Promise<ValueBetLeg[]> {
  const scans = await prisma.valueBetScan.findMany({
    where: { isActive: true },
    include: { fixture: true },
    orderBy: { grooveScore: 'desc' },
    take: 30,
  })

  return scans.map(s => ({
    fixtureId: s.fixtureId,
    homeTeam: s.fixture.homeTeam,
    awayTeam: s.fixture.awayTeam,
    league: s.fixture.league,
    country: s.fixture.country,
    matchDate: s.fixture.matchDate,
    pick: s.pick,
    market: s.market,
    odds: s.odds,
    grooveScore: s.grooveScore,
    realProbability: s.realProbability,
    impliedProbability: s.impliedProbability,
    valueEdge: s.valueEdge,
    confidence: s.confidence,
    riskLevel: s.grooveScore >= 75 ? 'LOW' : s.grooveScore >= 60 ? 'MEDIUM' : 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH',
    reason: s.reason,
    formSummary: '',
  }))
}