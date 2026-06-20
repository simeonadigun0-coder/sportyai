import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'
import Groq from 'groq-sdk'

const redis = Redis.fromEnv()
const BSD_BASE = 'https://sports.bzzoiro.com/api'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MIN_PROB = 90
const MAX_LEGS = 4

function impliedProb(odds: number): number {
  if (!odds || odds <= 1) return 0
  return Math.round((1 / odds) * 100 * 10) / 10
}

function calcRealProb(
  bsdProb: number, formWins: number, formTotal: number,
  h2hWins: number, h2hTotal: number, isHome: boolean, injuryPenalty: number
): number {
  const formScore = formTotal > 0 ? (formWins / formTotal) * 100 : 50
  const h2hScore = h2hTotal > 0 ? (h2hWins / h2hTotal) * 100 : 50
  const homeBoost = isHome ? 5 : 0
  let real = (bsdProb * 0.40) + (formScore * 0.30) + (h2hScore * 0.20) + (homeBoost * 0.10)
  real = real - injuryPenalty
  return Math.max(0, Math.min(99, Math.round(real * 10) / 10))
}

function calcGoalProb(
  homeAvgScored: number, awayAvgScored: number, homeAvgConceded: number, awayAvgConceded: number,
  h2hAvgGoals: number, line: number, direction: 'over' | 'under'
): number {
  const expectedGoals = ((homeAvgScored + awayAvgConceded) / 2) + ((awayAvgScored + homeAvgConceded) / 2)
  const combinedAvg = (expectedGoals + h2hAvgGoals) / 2
  if (direction === 'over') {
    if (combinedAvg > line + 1.0) return 92
    if (combinedAvg > line + 0.5) return 85
    if (combinedAvg > line) return 70
    return 40
  } else {
    if (combinedAvg < line - 1.0) return 92
    if (combinedAvg < line - 0.5) return 85
    if (combinedAvg < line) return 70
    return 40
  }
}

async function fetchFixtures(): Promise<unknown[]> {
  const today = new Date().toISOString().split('T')[0]
  const url = `${BSD_BASE}/events/?date_from=${today}&date_to=${today}&limit=100&sport=1`
  const res = await fetch(url, { headers: bsdHeaders, signal: AbortSignal.timeout(15000) })
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

interface Candidate {
  fixtureId: number
  homeTeam: string
  awayTeam: string
  league: string
  startTime: string
  sofaSearchName: string
  pick: string
  market: string
  odds: number
  realProb: number
  impliedProbValue: number
  edge: number
  reason: string
}

async function analyseFixture(fixture: Record<string, unknown>): Promise<Candidate[]> {
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
  const probAway = Number(pred?.prob_away_win || 0)
  const homeWins = Number(hf?.wins || 0)
  const homePlayed = homeWins + Number(hf?.draws || 0) + Number(hf?.losses || 0)
  const awayWins = Number(af?.wins || 0)
  const awayPlayed = awayWins + Number(af?.draws || 0) + Number(af?.losses || 0)
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
  const homeInjured = (unavail?.home as unknown[] || []).length
  const awayInjured = (unavail?.away as unknown[] || []).length
  const injuryPenaltyHome = Math.min(10, homeInjured * 2)
  const injuryPenaltyAway = Math.min(10, awayInjured * 2)
  const homeAvgScored = homeScored / homeGames
  const awayAvgScored = awayScored / awayGames
  const homeAvgConceded = homeConceded / homeGames
  const awayAvgConceded = awayConceded / awayGames

  const candidates: Candidate[] = []
  const homeTeam = fixture.home_team as string
  const awayTeam = fixture.away_team as string
  const league = (fixture.league as Record<string, unknown>)?.name as string || ''
  const startTime = fixture.event_date as string || ''

  const oddsHome = Number(fixture.odds_home || 0)
  const oddsDraw = Number(fixture.odds_draw || 0)
  const oddsAway = Number(fixture.odds_away || 0)

  // Home win — only ultra high confidence
  if (oddsHome > 1 && probHome > 0) {
    const realHome = calcRealProb(probHome, homeWins, homePlayed, h2hHW, h2hTotal, true, injuryPenaltyHome)
    if (realHome >= MIN_PROB) {
      candidates.push({
        fixtureId: id, homeTeam, awayTeam, league, startTime, sofaSearchName: homeTeam,
        pick: 'Home Win', market: '1X2', odds: oddsHome, realProb: realHome,
        impliedProbValue: impliedProb(oddsHome), edge: realHome - impliedProb(oddsHome),
        reason: `${homeTeam} form W${homeWins}/${homePlayed}, BSD prediction ${probHome}%${homeInjured > 0 ? `, ${homeInjured} absence(s)` : ''}`,
      })
    }
  }

  // Away win — only ultra high confidence
  if (oddsAway > 1 && probAway > 0) {
    const realAway = calcRealProb(probAway, awayWins, awayPlayed, h2hAW, h2hTotal, false, injuryPenaltyAway)
    if (realAway >= MIN_PROB) {
      candidates.push({
        fixtureId: id, homeTeam, awayTeam, league, startTime, sofaSearchName: awayTeam,
        pick: 'Away Win', market: '1X2', odds: oddsAway, realProb: realAway,
        impliedProbValue: impliedProb(oddsAway), edge: realAway - impliedProb(oddsAway),
        reason: `${awayTeam} form W${awayWins}/${awayPlayed}, BSD prediction ${probAway}%${awayInjured > 0 ? `, ${awayInjured} absence(s)` : ''}`,
      })
    }
  }

  // Double Chance — very reliable for high prob
  if (oddsHome > 1 && oddsDraw > 1) {
    const realDC = Math.min(99, probHome + probDraw_safe(probHome, probAway))
    const dcOdds = 1 / (1/oddsHome + 1/oddsDraw)
    if (realDC >= MIN_PROB) {
      candidates.push({
        fixtureId: id, homeTeam, awayTeam, league, startTime, sofaSearchName: homeTeam,
        pick: 'Double Chance (1X)', market: 'Double Chance', odds: parseFloat(dcOdds.toFixed(2)),
        realProb: realDC, impliedProbValue: impliedProb(dcOdds), edge: realDC - impliedProb(dcOdds),
        reason: `${homeTeam} strong + draw cover. Combined BSD probability ${realDC.toFixed(0)}%`,
      })
    }
  }

  // Over 1.5 / Under — high confidence goal markets
  const oddsOver15 = Number(fixture.odds_over_15 || 0)
  if (oddsOver15 > 1) {
    const prob = calcGoalProb(homeAvgScored, awayAvgScored, homeAvgConceded, awayAvgConceded, h2hAvgGoals, 1.5, 'over')
    if (prob >= MIN_PROB) {
      candidates.push({
        fixtureId: id, homeTeam, awayTeam, league, startTime, sofaSearchName: homeTeam,
        pick: 'Over 1.5 Goals', market: 'Over/Under', odds: oddsOver15, realProb: prob,
        impliedProbValue: impliedProb(oddsOver15), edge: prob - impliedProb(oddsOver15),
        reason: `High combined scoring average across both teams and H2H`,
      })
    }
  }

  return candidates
}

function probDraw_safe(probHome: number, probAway: number): number {
  return Math.max(0, 100 - probHome - probAway) * 0.5
}

async function generateSummary(legs: number, totalOdds: number, combinedProb: number): Promise<string> {
  try {
    const sc = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Write a confident 2-sentence daily banker announcement for Nigerian punters. Casual tone. No markdown.' },
        { role: 'user', content: `Today's value bet: ${legs} game(s) combined at ${totalOdds.toFixed(2)} odds with ${combinedProb.toFixed(0)}% win probability. Announce this confidently.` }
      ],
      temperature: 0.5, max_tokens: 80,
    })
    return sc.choices[0]?.message?.content || `Today's banker: ${legs} games at ${totalOdds.toFixed(2)} odds, ${combinedProb.toFixed(0)}% confidence.`
  } catch {
    return `Today's banker: ${legs} games at ${totalOdds.toFixed(2)} odds, ${combinedProb.toFixed(0)}% confidence.`
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const fixtures = await fetchFixtures()
    if (!fixtures.length) {
      return res.status(200).json({ success: false, message: 'No fixtures found today' })
    }

    const BATCH = 8
    const allCandidates: Candidate[] = []
    for (let i = 0; i < Math.min(fixtures.length, 60); i += BATCH) {
      const batch = (fixtures as Record<string, unknown>[]).slice(i, i + BATCH)
      const results = await Promise.all(batch.map(f => analyseFixture(f)))
      allCandidates.push(...results.flat())
    }

    if (!allCandidates.length) {
      const today = new Date().toISOString().split('T')[0]
      await redis.set(`value_bet:${today}`, {
        date: today, legs: [], totalOdds: 0, combinedProbability: 0,
        summary: 'No high-confidence value bets found today. Check back tomorrow.',
        status: 'no_bet', generatedAt: new Date().toISOString(),
      })
      return res.status(200).json({ success: true, message: 'No qualifying candidates today' })
    }

    // Sort by probability descending — pick the absolute best single, then try combos
    allCandidates.sort((a, b) => b.realProb - a.realProb)

    // Try single leg first (safest, highest individual probability)
    const best = allCandidates[0]
    let selectedLegs: Candidate[] = [best]
    let combinedProb = best.realProb

    // Try to add more legs from DIFFERENT fixtures if it keeps combined prob >= 90%
    const usedFixtures = new Set([best.fixtureId])
    for (const c of allCandidates) {
      if (selectedLegs.length >= MAX_LEGS) break
      if (usedFixtures.has(c.fixtureId)) continue
      const newCombinedProb = (combinedProb / 100) * (c.realProb / 100) * 100
      if (newCombinedProb >= MIN_PROB) {
        selectedLegs.push(c)
        usedFixtures.add(c.fixtureId)
        combinedProb = newCombinedProb
      }
    }

    const totalOdds = selectedLegs.reduce((acc, l) => acc * l.odds, 1)
    const summary = await generateSummary(selectedLegs.length, totalOdds, combinedProb)

    const today = new Date().toISOString().split('T')[0]
    const valueBetRecord = {
      date: today,
      legs: selectedLegs.map(l => ({
        homeTeam: l.homeTeam, awayTeam: l.awayTeam, league: l.league, startTime: l.startTime,
        sofaSearchName: l.sofaSearchName, pick: l.pick, market: l.market, odds: l.odds,
        realProb: l.realProb, impliedProbValue: l.impliedProbValue, edge: l.edge, reason: l.reason,
        result: 'pending' as 'pending' | 'won' | 'lost',
      })),
      totalOdds: parseFloat(totalOdds.toFixed(2)),
      combinedProbability: parseFloat(combinedProb.toFixed(1)),
      summary,
      status: 'active' as 'active' | 'settled' | 'no_bet',
      generatedAt: new Date().toISOString(),
    }

    await redis.set(`value_bet:${today}`, valueBetRecord)
    await redis.set('value_bet:latest', today)

    // Add to history list
    const historyKey = 'value_bet:history'
    const history = (await redis.get<string[]>(historyKey)) || []
    if (!history.includes(today)) {
      history.unshift(today)
      await redis.set(historyKey, history.slice(0, 365)) // keep 1 year
    }

    return res.status(200).json({ success: true, valueBet: valueBetRecord })
  } catch (err) {
    console.error('[generate-value-bet] error:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate value bet' })
  }
}