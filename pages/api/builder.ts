import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, isSubscriptionActive, incrementFreeBuilderUsed } from '@/lib/users'
import Groq from 'groq-sdk'

const BSD_BASE = 'https://sports.bzzoiro.com/api'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── THE 100 SUPPORTED MARKETS (for Tier 2 AI suggestions) ───────────────
const MARKET_CATALOGUE = [
  'Over 0.5 Goals', 'Over 1.5 Goals', 'Under 4.5 Goals', 'Under 5.5 Goals', 'Under 6.5 Goals',
  'Double Chance (1X)', 'Double Chance (X2)', 'Draw No Bet – Home',
  'Home Team Over 0.5 Goals', 'Away Team Over 0.5 Goals', 'Home Team Under 3.5 Goals', 'Away Team Under 2.5 Goals',
  'Match to Have 1+ Goal', 'Home Team to Score in Either Half', 'Away Team to Score in Either Half',
  'Home Team Win Either Half', 'Away Team Win Either Half', 'Total Goals 1-5', 'Total Goals 2-5',
  'Total Goals Odd', 'Total Goals Even', 'Home Team Clean Sheet – No', 'Away Team Clean Sheet – No',
  'Home Team To Score – Yes', 'Away Team To Score – Yes',
  'First Half Over 0.5 Goals', 'First Half Under 2.5 Goals', 'Second Half Over 0.5 Goals', 'Second Half Under 2.5 Goals',
  'First Half Double Chance (1X)', 'First Half Double Chance (X2)', 'Second Half Double Chance (1X)', 'Second Half Double Chance (X2)',
  'Home Team to Score First Half', 'Away Team to Score First Half', 'Home Team to Score Second Half', 'Match to Have Goal in Both Halves',
  'Any Team to Score 2+ Goals in a Row – No', 'Any Team to Score 3+ Goals in a Row – No',
  'Home Team 3+ Goals in a Row – No', 'Away Team 3+ Goals in a Row – No',
  'Any Team to Win Both Halves – No', 'Home Team to Score Consecutively – No', 'Away Team to Score Consecutively – No',
  'Goal Before Minute 85 – Yes', 'Goal Before Minute 75 – Yes', 'No Goal in First 10 Minutes',
  'Goal in Second Half – Yes', 'Any Team To Score in Both Halves – Yes', 'Home Team To Score in Both Halves – Yes',
  'Total Corners Over 6.5', 'Total Corners Over 7.5', 'Total Corners Over 8.5', 'Total Corners Under 14.5', 'Total Corners Under 15.5',
  'First Half Corners Over 3.5', 'Second Half Corners Over 2.5',
  'Home Team Over 2.5 Corners', 'Home Team Over 3.5 Corners', 'Away Team Over 1.5 Corners', 'Away Team Over 2.5 Corners',
  'Home Team Most Corners', 'Away Team Most Corners', 'Race to 3 Corners – Home', 'Race to 5 Corners – Home',
  'Home Team First Corner', 'Away Team First Corner', 'Home Team Last Corner', 'Match to Have 8+ Corners', 'Match to Have 10+ Corners',
  'Over 1.5 Cards', 'Over 2.5 Cards', 'Home Team Over 0.5 Cards', 'Away Team Over 0.5 Cards',
  'Home Team Under 4.5 Cards', 'Away Team Under 4.5 Cards', 'Both Teams 1+ Card', 'Card in First Half – Yes',
  'Double Chance (1X) + Over 0.5 Goals', 'Double Chance (1X) + Over 1.5 Goals', 'Double Chance (1X) + Under 5.5 Goals',
  'Home Team Over 0.5 Goals + Under 5.5 Goals', 'Home Team Win Either Half + Over 0.5 Goals',
  'Over 1.5 Goals + Under 5.5 Goals', 'Home Team To Score + Over 1.5 Goals',
  'Match Goal + Home Team Over 2 Corners', 'Double Chance + Over 6.5 Corners', 'Home Team Most Corners + Over 0.5 Goals',
  'Team to Score First – Home', 'Team to Score First – Away', 'Team to Score Last – Home', 'Team to Score Last – Away',
  'Home Team Over 1 Shot on Target', 'Away Team Over 1 Shot on Target', 'Home Team Over 3 Shots', 'Away Team Over 3 Shots',
  'Match to Have Shot on Target Each Half', 'Home Team 1+ Corner Each Half', 'Away Team 1+ Corner Each Half', 'Either Team 1+ Corner Each Half',
]

async function fetchFixtures(dateFrom: string, dateTo: string): Promise<unknown[]> {
  const url = `${BSD_BASE}/events/?date_from=${dateFrom}&date_to=${dateTo}&limit=100&sport=1`
  const res = await fetch(url, { headers: bsdHeaders, signal: AbortSignal.timeout(12000) })
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

interface Tier1Pick {
  tier: 1
  homeTeam: string
  awayTeam: string
  league: string
  startTime: string
  pick: string
  market: string
  odds: number
  confidence: number
  reason: string
}

interface Tier2Pick {
  tier: 2
  homeTeam: string
  awayTeam: string
  league: string
  startTime: string
  pick: string
  market: string
  estimatedProbability: number
  confidence: number
  reason: string
}

const RISK_THRESHOLDS = {
  low: { minConf: 75, minOdds: 1.2, maxOdds: 1.8 },
  medium: { minConf: 65, minOdds: 1.5, maxOdds: 2.5 },
  high: { minConf: 55, minOdds: 2.0, maxOdds: 4.0 },
}

async function scoreFixtureTier1(fixture: Record<string, unknown>, riskLevel: 'low' | 'medium' | 'high'): Promise<Tier1Pick | null> {
  const detail = await fetchEventDetail(fixture.id as number)
  if (!detail) return null

  const hf = detail.home_form as Record<string, unknown> | null
  const af = detail.away_form as Record<string, unknown> | null
  const h2h = detail.head_to_head as Record<string, unknown> | null
  const pred = detail.prediction as Record<string, unknown> | null
  const unavail = detail.unavailable_players as Record<string, unknown> | null

  const probHome = Number(pred?.prob_home_win || 0)
  const probAway = Number(pred?.prob_away_win || 0)
  const homeWins = Number(hf?.wins || 0)
  const homePlayed = homeWins + Number(hf?.draws || 0) + Number(hf?.losses || 0)
  const awayWins = Number(af?.wins || 0)
  const awayPlayed = awayWins + Number(af?.draws || 0) + Number(af?.losses || 0)
  const h2hHW = Number(h2h?.home_wins || 0)
  const h2hAW = Number(h2h?.away_wins || 0)
  const h2hTotal = h2hHW + Number(h2h?.draws || 0) + h2hAW || 1
  const homeInjured = (unavail?.home as unknown[] || []).length
  const awayInjured = (unavail?.away as unknown[] || []).length

  const threshold = RISK_THRESHOLDS[riskLevel]
  const homeTeam = fixture.home_team as string
  const awayTeam = fixture.away_team as string

  const formScoreHome = homePlayed > 0 ? (homeWins / homePlayed) * 100 : 50
  const formScoreAway = awayPlayed > 0 ? (awayWins / awayPlayed) * 100 : 50
  const h2hScoreHome = (h2hHW / h2hTotal) * 100
  const h2hScoreAway = (h2hAW / h2hTotal) * 100

  const confHome = Math.round((probHome * 0.4 + formScoreHome * 0.3 + h2hScoreHome * 0.2 + 5 * 0.1) - homeInjured * 2)
  const confAway = Math.round((probAway * 0.4 + formScoreAway * 0.3 + h2hScoreAway * 0.2) - awayInjured * 2)

  const oddsHome = Number(fixture.odds_home || 0)
  const oddsAway = Number(fixture.odds_away || 0)

  const candidates: Tier1Pick[] = []

  if (confHome >= threshold.minConf && oddsHome >= threshold.minOdds && oddsHome <= threshold.maxOdds) {
    candidates.push({
      tier: 1, homeTeam, awayTeam,
      league: (fixture.league as Record<string, unknown>)?.name as string || '',
      startTime: fixture.event_date as string || '',
      pick: 'Home Win', market: '1X2', odds: oddsHome, confidence: Math.min(95, confHome),
      reason: `${homeTeam} form W${homeWins}/${homePlayed}, BSD prediction ${probHome}%${homeInjured > 0 ? `, ${homeInjured} key absence` : ''}`,
    })
  }
  if (confAway >= threshold.minConf && oddsAway >= threshold.minOdds && oddsAway <= threshold.maxOdds) {
    candidates.push({
      tier: 1, homeTeam, awayTeam,
      league: (fixture.league as Record<string, unknown>)?.name as string || '',
      startTime: fixture.event_date as string || '',
      pick: 'Away Win', market: '1X2', odds: oddsAway, confidence: Math.min(95, confAway),
      reason: `${awayTeam} form W${awayWins}/${awayPlayed}, BSD prediction ${probAway}%${awayInjured > 0 ? `, ${awayInjured} key absence` : ''}`,
    })
  }

  // Over/Under goals
  const homeScored = Number(hf?.goals_scored_last_n || 0) / (homePlayed || 1)
  const awayScored = Number(af?.goals_scored_last_n || 0) / (awayPlayed || 1)
  const oddsOver15 = Number(fixture.odds_over_15 || 0)
  const oddsOver25 = Number(fixture.odds_over_25 || 0)

  if (riskLevel !== 'low' && oddsOver25 >= threshold.minOdds && oddsOver25 <= threshold.maxOdds) {
    const expectedGoals = (homeScored + awayScored)
    if (expectedGoals >= 2.3) {
      candidates.push({
        tier: 1, homeTeam, awayTeam,
        league: (fixture.league as Record<string, unknown>)?.name as string || '',
        startTime: fixture.event_date as string || '',
        pick: 'Over 2.5 Goals', market: 'Over/Under', odds: oddsOver25, confidence: Math.min(90, Math.round(expectedGoals * 25)),
        reason: `Combined scoring average ${expectedGoals.toFixed(1)} goals/game`,
      })
    }
  }

  if (oddsOver15 >= threshold.minOdds && oddsOver15 <= threshold.maxOdds) {
    const expectedGoals = (homeScored + awayScored)
    if (expectedGoals >= 1.8) {
      candidates.push({
        tier: 1, homeTeam, awayTeam,
        league: (fixture.league as Record<string, unknown>)?.name as string || '',
        startTime: fixture.event_date as string || '',
        pick: 'Over 1.5 Goals', market: 'Over/Under', odds: oddsOver15, confidence: Math.min(92, Math.round(expectedGoals * 30)),
        reason: `Combined scoring average ${expectedGoals.toFixed(1)} goals/game`,
      })
    }
  }

  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.confidence - a.confidence)
  return candidates[0]
}

// Tier 2 — AI suggests from wider 100-market catalogue using form/H2H logic only (no BSD odds)
function suggestTier2Pick(fixture: Record<string, unknown>, detail: Record<string, unknown> | null, riskLevel: 'low' | 'medium' | 'high'): Tier2Pick | null {
  if (!detail) return null
  const hf = detail.home_form as Record<string, unknown> | null
  const af = detail.away_form as Record<string, unknown> | null
  const homeTeam = fixture.home_team as string
  const awayTeam = fixture.away_team as string
  const homeWins = Number(hf?.wins || 0)
  const homePlayed = homeWins + Number(hf?.draws || 0) + Number(hf?.losses || 0)

  // Simple heuristic suggestions from the 100-market catalogue based on form
  const homeScored = Number(hf?.goals_scored_last_n || 0) / (homePlayed || 1)
  const formStr = hf?.form_string as string || ''
  const winStreak = formStr.startsWith('WW')

  if (winStreak && riskLevel === 'low') {
    return {
      tier: 2, homeTeam, awayTeam,
      league: (fixture.league as Record<string, unknown>)?.name as string || '',
      startTime: fixture.event_date as string || '',
      pick: 'Double Chance (1X)', market: MARKET_CATALOGUE[5],
      estimatedProbability: 78,
      confidence: 72,
      reason: `${homeTeam} on a winning streak (${formStr}) — verify odds on SportyBet`,
    }
  }
  if (homeScored >= 1.5) {
    return {
      tier: 2, homeTeam, awayTeam,
      league: (fixture.league as Record<string, unknown>)?.name as string || '',
      startTime: fixture.event_date as string || '',
      pick: 'Home Team To Score – Yes', market: MARKET_CATALOGUE[23],
      estimatedProbability: 80,
      confidence: 70,
      reason: `${homeTeam} averages ${homeScored.toFixed(1)} goals/game — verify odds on SportyBet`,
    }
  }
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const hasSubscription = isSubscriptionActive(user)
  const freeBuilderUsed = user.freeBuilderUsed || 0
  const hasFreeTrials = freeBuilderUsed < 2 && !user.isAdmin
  const canUse = user.isAdmin || hasSubscription || hasFreeTrials
  if (!canUse) return res.status(403).json({ error: 'Subscription required', requiresSubscription: true })

  const { targetOdds = 10, riskLevel = 'medium', dateRange = 'today' } = req.body

  try {
    const today = new Date()
    const dateFrom = today.toISOString().split('T')[0]
    let dateTo = dateFrom
    if (dateRange === 'tomorrow') { const t = new Date(today); t.setDate(today.getDate() + 1); dateTo = t.toISOString().split('T')[0] }
    else if (dateRange === 'week') { const t = new Date(today); t.setDate(today.getDate() + 7); dateTo = t.toISOString().split('T')[0] }
    else if (dateRange === 'month') { const t = new Date(today); t.setDate(today.getDate() + 30); dateTo = t.toISOString().split('T')[0] }

    const fixtures = await fetchFixtures(dateFrom, dateTo)
    if (!fixtures.length) {
      return res.status(200).json({ tier1: [], tier2: [], message: 'No fixtures found for this date range' })
    }

    const BATCH = 8
    const tier1Picks: Tier1Pick[] = []
    const tier2Picks: Tier2Pick[] = []

    for (let i = 0; i < Math.min(fixtures.length, 50); i += BATCH) {
      const batch = (fixtures as Record<string, unknown>[]).slice(i, i + BATCH)
      const results = await Promise.all(batch.map(async f => {
        const tier1 = await scoreFixtureTier1(f, riskLevel as 'low' | 'medium' | 'high')
        return { fixture: f, tier1 }
      }))
      for (const r of results) {
        if (r.tier1) tier1Picks.push(r.tier1)
      }
    }

    // Select Tier 1 picks to reach target odds
    tier1Picks.sort((a, b) => b.confidence - a.confidence)
    const selectedTier1: Tier1Pick[] = []
    let currentOdds = 1.0
    for (const pick of tier1Picks) {
      if (currentOdds >= targetOdds) break
      selectedTier1.push(pick)
      currentOdds *= pick.odds
    }

    const totalOdds = selectedTier1.reduce((acc, p) => acc * p.odds, 1)

    // If we couldn't reach target with Tier 1, suggest Tier 2 picks
    if (currentOdds < targetOdds && selectedTier1.length < fixtures.length) {
      const usedFixtures = new Set(selectedTier1.map(p => `${p.homeTeam}-${p.awayTeam}`))
      const remaining = (fixtures as Record<string, unknown>[]).filter(f =>
        !usedFixtures.has(`${f.home_team}-${f.away_team}`)
      ).slice(0, 10)

      for (const f of remaining) {
        if (tier2Picks.length >= 5) break
        const detail = await fetchEventDetail(f.id as number)
        const t2 = suggestTier2Pick(f, detail, riskLevel as 'low' | 'medium' | 'high')
        if (t2) tier2Picks.push(t2)
      }
    }

    let summary = `Built accumulator with ${selectedTier1.length} verified picks at ${totalOdds.toFixed(2)} odds (target: ${targetOdds}).`
    if (tier2Picks.length > 0) summary += ` Added ${tier2Picks.length} bonus AI suggestions — verify odds on SportyBet.`

    try {
      const sc = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Write short punter-friendly summaries. Nigerian casual tone. 2 sentences max. No markdown, no team names.' },
          { role: 'user', content: `Built accumulator: ${selectedTier1.length} verified picks at ${totalOdds.toFixed(2)} odds, target was ${targetOdds}, risk level ${riskLevel}. ${tier2Picks.length} bonus suggestions added. Summarise for punter.` }
        ],
        temperature: 0.5, max_tokens: 80,
      })
      summary = sc.choices[0]?.message?.content || summary
    } catch { }

    if (hasFreeTrials && !user.isAdmin) {
      await incrementFreeBuilderUsed(user.id)
    }

    return res.status(200).json({
      tier1: selectedTier1,
      tier2: tier2Picks,
      totalOdds: parseFloat(totalOdds.toFixed(2)),
      targetOdds, riskLevel, dateRange, summary,
    })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to build accumulator' })
  }
}