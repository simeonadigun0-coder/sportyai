import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, canAccessProFeatures, incrementFreeValueBetsUsed } from '@/lib/users'
import Groq from 'groq-sdk'

const BSD_BASE = 'https://sports.bzzoiro.com/api'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── VALUE BET CONFIG ──────────────────────────────────────────────────────
// Value bet = 1-4 matches combined, total odds 1.50-3.00, probability 90-99%
const VALUE_BET_MIN_ODDS = 1.50
const VALUE_BET_MAX_ODDS = 3.00
const VALUE_BET_MIN_PROB = 90   // minimum probability %
const VALUE_BET_MIN_EDGE = 8    // minimum edge over bookmaker %
const MIN_CONFIDENCE = 65       // never show below this

// ─── PROBABILITY CALCULATION ───────────────────────────────────────────────
function impliedProb(odds: number): number {
  if (!odds || odds <= 1) return 0
  return Math.round((1 / odds) * 100 * 10) / 10
}

// Calculate real probability from BSD data
function calcRealProb(
  bsdProb: number,
  formWins: number,
  formTotal: number,
  h2hWins: number,
  h2hTotal: number,
  isHome: boolean,
  injuryPenalty: number
): number {
  const formScore = formTotal > 0 ? (formWins / formTotal) * 100 : 50
  const h2hScore = h2hTotal > 0 ? (h2hWins / h2hTotal) * 100 : 50
  const homeBoost = isHome ? 5 : 0

  // Weighted average
  let real = (bsdProb * 0.40) + (formScore * 0.30) + (h2hScore * 0.20) + (homeBoost * 0.10)
  real = real - injuryPenalty
  return Math.max(0, Math.min(99, Math.round(real * 10) / 10))
}

// Calculate goal probability from form data
function calcGoalProb(
  homeAvgScored: number,
  awayAvgScored: number,
  homeAvgConceded: number,
  awayAvgConceded: number,
  h2hAvgGoals: number,
  line: number,
  direction: 'over' | 'under'
): number {
  const expectedGoals = ((homeAvgScored + awayAvgConceded) / 2) + ((awayAvgScored + homeAvgConceded) / 2)
  const combinedAvg = (expectedGoals + h2hAvgGoals) / 2

  if (direction === 'over') {
    if (combinedAvg > line + 1.0) return 88
    if (combinedAvg > line + 0.5) return 78
    if (combinedAvg > line) return 65
    if (combinedAvg > line - 0.5) return 50
    return 35
  } else {
    if (combinedAvg < line - 1.0) return 88
    if (combinedAvg < line - 0.5) return 78
    if (combinedAvg < line) return 65
    return 40
  }
}

// ─── FETCH FIXTURES ────────────────────────────────────────────────────────
async function fetchFixtures(dateFrom: string, dateTo: string): Promise<unknown[]> {
  const url = `${BSD_BASE}/events/?date_from=${dateFrom}&date_to=${dateTo}&limit=100&sport=1`
  const res = await fetch(url, { headers: bsdHeaders, signal: AbortSignal.timeout(10000) })
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

async function fetchEventDetail(id: number): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${BSD_BASE}/events/${id}/`, { headers: bsdHeaders, signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

// ─── ANALYSE FIXTURE FOR VALUE BETS ───────────────────────────────────────
interface ValueBetCandidate {
  pick: string
  market: string
  odds: number
  realProb: number
  impliedProbValue: number
  edge: number
  confidence: number
  reason: string
}

async function analyseFixture(fixture: Record<string, unknown>): Promise<ValueBetCandidate[]> {
  const id = fixture.id as number
  const detail = await fetchEventDetail(id)
  if (!detail) return []

  const hf = detail.home_form as Record<string, unknown> | null
  const af = detail.away_form as Record<string, unknown> | null
  const h2h = detail.head_to_head as Record<string, unknown> | null
  const pred = detail.prediction as Record<string, unknown> | null
  const unavail = detail.unavailable_players as Record<string, unknown> | null

  if (!pred && !hf && !af) return []

  const probHome = Number(pred?.prob_home_win || 0)
  const probDraw = Number(pred?.prob_draw || 0)
  const probAway = Number(pred?.prob_away_win || 0)

  const homeWins = Number(hf?.wins || 0)
  const homePlayed = Number(hf?.wins || 0) + Number(hf?.draws || 0) + Number(hf?.losses || 0)
  const awayWins = Number(af?.wins || 0)
  const awayPlayed = Number(af?.wins || 0) + Number(af?.draws || 0) + Number(af?.losses || 0)
  const homeScored = Number(hf?.goals_scored_last_n || 0)
  const homeConceded = Number((hf as Record<string, unknown>)?.goals_conceded_last_n || 0)
  const awayScored = Number(af?.goals_scored_last_n || 0)
  const awayConceded = Number((af as Record<string, unknown>)?.goals_conceded_last_n || 0)
  const homeGames = homePlayed || 1
  const awayGames = awayPlayed || 1

  const h2hHW = Number(h2h?.home_wins || 0)
  const h2hAW = Number(h2h?.away_wins || 0)
  const h2hD = Number(h2h?.draws || 0)
  const h2hTotal = h2hHW + h2hAW + h2hD || 1
  const h2hGoals = Number((h2h as Record<string, unknown>)?.total_goals || 0)
  const h2hAvgGoals = h2hGoals / h2hTotal

  // Injury penalty
  const homeInjured = (unavail?.home as unknown[] || []).length
  const awayInjured = (unavail?.away as unknown[] || []).length
  const injuryPenaltyHome = Math.min(10, homeInjured * 2)
  const injuryPenaltyAway = Math.min(10, awayInjured * 2)

  const homeAvgScored = homeScored / homeGames
  const awayAvgScored = awayScored / awayGames
  const homeAvgConceded = homeConceded / homeGames
  const awayAvgConceded = awayConceded / awayGames

  const candidates: ValueBetCandidate[] = []
  const homeTeam = fixture.home_team as string
  const awayTeam = fixture.away_team as string

  // ── 1X2 Markets ──
  const oddsHome = Number(fixture.odds_home || 0)
  const oddsDraw = Number(fixture.odds_draw || 0)
  const oddsAway = Number(fixture.odds_away || 0)

  if (oddsHome > 1 && probHome > 0) {
    const realHome = calcRealProb(probHome, homeWins, homePlayed, h2hHW, h2hTotal, true, injuryPenaltyHome)
    const implied = impliedProb(oddsHome)
    const edge = realHome - implied
    if (realHome >= VALUE_BET_MIN_PROB && edge >= VALUE_BET_MIN_EDGE && realHome >= MIN_CONFIDENCE) {
      const formStr = hf?.form_string as string || '?'
      candidates.push({
        pick: 'Home Win',
        market: '1X2',
        odds: oddsHome,
        realProb: realHome,
        impliedProbValue: implied,
        edge,
        confidence: Math.min(99, realHome),
        reason: `${homeTeam} form ${formStr} (W${homeWins}), BSD prediction ${probHome}%${homeInjured > 0 ? `, ${homeInjured} injury concern` : ''}`,
      })
    }
  }

  if (oddsAway > 1 && probAway > 0) {
    const realAway = calcRealProb(probAway, awayWins, awayPlayed, h2hAW, h2hTotal, false, injuryPenaltyAway)
    const implied = impliedProb(oddsAway)
    const edge = realAway - implied
    if (realAway >= VALUE_BET_MIN_PROB && edge >= VALUE_BET_MIN_EDGE && realAway >= MIN_CONFIDENCE) {
      const formStr = af?.form_string as string || '?'
      candidates.push({
        pick: 'Away Win',
        market: '1X2',
        odds: oddsAway,
        realProb: realAway,
        impliedProbValue: implied,
        edge,
        confidence: Math.min(99, realAway),
        reason: `${awayTeam} form ${formStr} (W${awayWins}), BSD prediction ${probAway}%${awayInjured > 0 ? `, ${awayInjured} injury concern` : ''}`,
      })
    }
  }

  // ── Double Chance ──
  // 1X = Home or Draw
  if (oddsHome > 1 && oddsDraw > 1) {
    const dcOdds = 1 / (1/oddsHome + 1/oddsDraw) // combined DC odds estimate
    const realDC = Math.min(99, probHome + probDraw - 5) // slight margin
    const implied = impliedProb(dcOdds)
    const edge = realDC - implied
    if (realDC >= VALUE_BET_MIN_PROB && edge >= VALUE_BET_MIN_EDGE) {
      candidates.push({
        pick: 'Double Chance (1X)',
        market: 'Double Chance',
        odds: parseFloat(dcOdds.toFixed(2)),
        realProb: realDC,
        impliedProbValue: implied,
        edge,
        confidence: Math.min(99, realDC),
        reason: `${homeTeam} home advantage + draw safety. BSD: H${probHome}% D${probDraw}%`,
      })
    }
  }

  // X2 = Draw or Away
  if (oddsDraw > 1 && oddsAway > 1) {
    const dcOdds = 1 / (1/oddsDraw + 1/oddsAway)
    const realDC = Math.min(99, probDraw + probAway - 5)
    const implied = impliedProb(dcOdds)
    const edge = realDC - implied
    if (realDC >= VALUE_BET_MIN_PROB && edge >= VALUE_BET_MIN_EDGE) {
      candidates.push({
        pick: 'Double Chance (X2)',
        market: 'Double Chance',
        odds: parseFloat(dcOdds.toFixed(2)),
        realProb: realDC,
        impliedProbValue: implied,
        edge,
        confidence: Math.min(99, realDC),
        reason: `${awayTeam} away strength + draw safety. BSD: D${probDraw}% A${probAway}%`,
      })
    }
  }

  // ── Over/Under Goals ──
  const oddsOver15 = Number(fixture.odds_over_15 || 0)
  const oddsOver25 = Number(fixture.odds_over_25 || 0)
  const oddsUnder25 = Number(fixture.odds_under_25 || 0)

  if (oddsOver15 > 1) {
    const prob = calcGoalProb(homeAvgScored, awayAvgScored, homeAvgConceded, awayAvgConceded, h2hAvgGoals, 1.5, 'over')
    const implied = impliedProb(oddsOver15)
    const edge = prob - implied
    if (prob >= VALUE_BET_MIN_PROB && edge >= VALUE_BET_MIN_EDGE) {
      candidates.push({
        pick: 'Over 1.5 Goals',
        market: 'Over/Under',
        odds: oddsOver15,
        realProb: prob,
        impliedProbValue: implied,
        edge,
        confidence: Math.min(99, prob),
        reason: `Avg expected goals: ${((homeAvgScored + awayAvgConceded)/2 + (awayAvgScored + homeAvgConceded)/2).toFixed(1)}, H2H avg: ${h2hAvgGoals.toFixed(1)}`,
      })
    }
  }

  if (oddsOver25 > 1) {
    const prob = calcGoalProb(homeAvgScored, awayAvgScored, homeAvgConceded, awayAvgConceded, h2hAvgGoals, 2.5, 'over')
    const implied = impliedProb(oddsOver25)
    const edge = prob - implied
    if (prob >= VALUE_BET_MIN_PROB && edge >= VALUE_BET_MIN_EDGE) {
      candidates.push({
        pick: 'Over 2.5 Goals',
        market: 'Over/Under',
        odds: oddsOver25,
        realProb: prob,
        impliedProbValue: implied,
        edge,
        confidence: Math.min(99, prob),
        reason: `High scoring form: ${homeTeam} scores ${homeAvgScored.toFixed(1)}/game, ${awayTeam} scores ${awayAvgScored.toFixed(1)}/game`,
      })
    }
  }

  if (oddsUnder25 > 1) {
    const prob = calcGoalProb(homeAvgScored, awayAvgScored, homeAvgConceded, awayAvgConceded, h2hAvgGoals, 2.5, 'under')
    const implied = impliedProb(oddsUnder25)
    const edge = prob - implied
    if (prob >= VALUE_BET_MIN_PROB && edge >= VALUE_BET_MIN_EDGE) {
      candidates.push({
        pick: 'Under 2.5 Goals',
        market: 'Over/Under',
        odds: oddsUnder25,
        realProb: prob,
        impliedProbValue: implied,
        edge,
        confidence: Math.min(99, prob),
        reason: `Low scoring form: avg ${((homeAvgScored + awayAvgScored)/2).toFixed(1)} goals/game, H2H avg ${h2hAvgGoals.toFixed(1)}`,
      })
    }
  }

  // ── BTTS ──
  const oddsBTTS = Number(fixture.odds_btts_yes || 0)
  const oddsBTTSNo = Number(fixture.odds_btts_no || 0)

  if (oddsBTTS > 1) {
    const bothScore = homeAvgScored >= 1.0 && awayAvgScored >= 0.8
    const prob = bothScore ? Math.min(92, 60 + (homeAvgScored * 10) + (awayAvgScored * 10)) : 40
    const implied = impliedProb(oddsBTTS)
    const edge = prob - implied
    if (prob >= VALUE_BET_MIN_PROB && edge >= VALUE_BET_MIN_EDGE) {
      candidates.push({
        pick: 'Both Teams to Score – Yes',
        market: 'BTTS',
        odds: oddsBTTS,
        realProb: prob,
        impliedProbValue: implied,
        edge,
        confidence: Math.min(99, prob),
        reason: `${homeTeam} scores ${homeAvgScored.toFixed(1)}/game, ${awayTeam} scores ${awayAvgScored.toFixed(1)}/game`,
      })
    }
  }

  if (oddsBTTSNo > 1) {
    const oneTeamDefensive = homeAvgScored < 0.6 || awayAvgScored < 0.6
    const prob = oneTeamDefensive ? Math.min(92, 75) : 55
    const implied = impliedProb(oddsBTTSNo)
    const edge = prob - implied
    if (prob >= VALUE_BET_MIN_PROB && edge >= VALUE_BET_MIN_EDGE) {
      candidates.push({
        pick: 'Both Teams to Score – No',
        market: 'BTTS',
        odds: oddsBTTSNo,
        realProb: prob,
        impliedProbValue: implied,
        edge,
        confidence: Math.min(99, prob),
        reason: `Defensive form: one team averages under 0.6 goals/game`,
      })
    }
  }

  return candidates
}

// ─── COMBINE INTO VALUE BETS (1-4 legs, total odds 1.50-3.00) ────────────
interface ValueBet {
  legs: Array<{
    homeTeam: string
    awayTeam: string
    league: string
    startTime: string
    pick: string
    market: string
    odds: number
    realProb: number
    impliedProbValue: number
    edge: number
    confidence: number
    reason: string
  }>
  totalOdds: number
  combinedProbability: number
  avgEdge: number
  avgConfidence: number
}

function buildValueBets(
  fixtureResults: Array<{ fixture: Record<string, unknown>; candidates: ValueBetCandidate[] }>,
  targetMaxOdds: number
): ValueBet[] {
  // Flatten all candidates with fixture info
  const allCandidates = fixtureResults.flatMap(({ fixture, candidates }) =>
    candidates.map(c => ({
      ...c,
      homeTeam: fixture.home_team as string,
      awayTeam: fixture.away_team as string,
      league: (fixture.league as Record<string, unknown>)?.name as string || '',
      startTime: fixture.event_date as string || '',
      fixtureId: fixture.id as number,
    }))
  )

  // Sort by confidence descending
  allCandidates.sort((a, b) => b.confidence - a.confidence)

  const valueBets: ValueBet[] = []

  // Try single leg value bets first (highest confidence)
  for (const c of allCandidates) {
    if (c.odds >= VALUE_BET_MIN_ODDS && c.odds <= targetMaxOdds) {
      const combinedProb = c.realProb
      if (combinedProb >= VALUE_BET_MIN_PROB) {
        valueBets.push({
          legs: [c],
          totalOdds: parseFloat(c.odds.toFixed(2)),
          combinedProbability: combinedProb,
          avgEdge: c.edge,
          avgConfidence: c.confidence,
        })
      }
    }
  }

  // Try 2-leg combinations
  for (let i = 0; i < allCandidates.length; i++) {
    for (let j = i + 1; j < allCandidates.length; j++) {
      const a = allCandidates[i]
      const b = allCandidates[j]
      if (a.fixtureId === b.fixtureId) continue // same match
      const totalOdds = a.odds * b.odds
      if (totalOdds < VALUE_BET_MIN_ODDS || totalOdds > targetMaxOdds) continue
      const combinedProb = (a.realProb / 100) * (b.realProb / 100) * 100
      if (combinedProb < VALUE_BET_MIN_PROB) continue
      valueBets.push({
        legs: [a, b],
        totalOdds: parseFloat(totalOdds.toFixed(2)),
        combinedProbability: parseFloat(combinedProb.toFixed(1)),
        avgEdge: (a.edge + b.edge) / 2,
        avgConfidence: (a.confidence + b.confidence) / 2,
      })
    }
  }

  // Try 3-leg combinations
  for (let i = 0; i < Math.min(allCandidates.length, 15); i++) {
    for (let j = i + 1; j < Math.min(allCandidates.length, 15); j++) {
      for (let k = j + 1; k < Math.min(allCandidates.length, 15); k++) {
        const a = allCandidates[i], b = allCandidates[j], c = allCandidates[k]
        const ids = new Set([a.fixtureId, b.fixtureId, c.fixtureId])
        if (ids.size < 3) continue
        const totalOdds = a.odds * b.odds * c.odds
        if (totalOdds < VALUE_BET_MIN_ODDS || totalOdds > targetMaxOdds) continue
        const combinedProb = (a.realProb / 100) * (b.realProb / 100) * (c.realProb / 100) * 100
        if (combinedProb < VALUE_BET_MIN_PROB) continue
        valueBets.push({
          legs: [a, b, c],
          totalOdds: parseFloat(totalOdds.toFixed(2)),
          combinedProbability: parseFloat(combinedProb.toFixed(1)),
          avgEdge: (a.edge + b.edge + c.edge) / 3,
          avgConfidence: (a.confidence + b.confidence + c.confidence) / 3,
        })
      }
    }
  }

  // Sort by combined probability desc, then by odds desc (maximize return)
  valueBets.sort((a, b) => {
    if (b.combinedProbability !== a.combinedProbability) return b.combinedProbability - a.combinedProbability
    return b.totalOdds - a.totalOdds
  })

  // Deduplicate — remove bets that use the same fixture+pick combination
  const seen = new Set<string>()
  return valueBets.filter(vb => {
    const key = vb.legs.map(l => `${l.homeTeam}-${l.pick}`).sort().join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
if (!user) return res.status(404).json({ error: 'User not found' })

const freeValueBetsUsed = user.freeValueBetsUsed || 0
const hasFreeTrials = freeValueBetsUsed < 2 && !user.isAdmin

const hasSubscription = user.subscriptionTier && user.subscriptionTier !== 'free'

const canUse = user.isAdmin || hasSubscription || hasFreeTrials

if (!canUse) {
  return res.status(403).json({
    error: 'Subscription required',
    requiresSubscription: true,
    currentTier: user.subscriptionTier || 'free'
  })
}

  const { dateFrom, dateTo, targetMaxOdds = 3.0 } = req.body

  try {
    const today = new Date().toISOString().split('T')[0]
    const from = dateFrom || today
    const to = dateTo || today

    const fixtures = await fetchFixtures(from, to)
    if (!fixtures.length) {
      return res.status(200).json({ valueBets: [], fixturesScanned: 0, message: 'No fixtures found for this date range' })
    }

    // Analyse fixtures in parallel batches
    const BATCH = 8
    const fixtureResults: Array<{ fixture: Record<string, unknown>; candidates: ValueBetCandidate[] }> = []

    for (let i = 0; i < Math.min(fixtures.length, 40); i += BATCH) {
      const batch = (fixtures as Record<string, unknown>[]).slice(i, i + BATCH)
      const results = await Promise.all(batch.map(async f => ({
        fixture: f,
        candidates: await analyseFixture(f),
      })))
      fixtureResults.push(...results)
    }

    const valueBets = buildValueBets(fixtureResults, targetMaxOdds)

    // Generate summary
    let summary = `Scanned ${fixtures.length} fixtures. Found ${valueBets.length} value bet combinations within ${VALUE_BET_MIN_ODDS}–${targetMaxOdds} odds range.`
    if (valueBets.length > 0) {
      try {
        const top = valueBets[0]
        const sc = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Write short punter-friendly summaries. Nigerian casual tone. 2 sentences max. No markdown.' },
            { role: 'user', content: `Found ${valueBets.length} value bet combos today. Best: ${top.legs.length} leg at ${top.totalOdds} odds with ${top.combinedProbability}% combined probability and ${top.avgEdge.toFixed(1)}% edge over bookmaker. Summarise for punter.` }
          ],
          temperature: 0.5, max_tokens: 80,
        })
        summary = sc.choices[0]?.message?.content || summary
      } catch { }
    }

    // Track free trial usage
    if (hasFreeTrials && !user.isAdmin) {
      await incrementFreeValueBetsUsed(user.id)
    }

    return res.status(200).json({
      valueBets: valueBets.slice(0, 20),
      fixturesScanned: fixtures.length,
      total: valueBets.length,
      summary,
      wasFreeTrial: hasFreeTrials,
    })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to find value bets' })
  }
}