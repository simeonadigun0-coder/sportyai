import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'
import Groq from 'groq-sdk'

const redis = Redis.fromEnv()
const BSD_BASE = 'https://sports.bzzoiro.com/api'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MIN_PROB = 90   // minimum 90% confidence for value bet
const MAX_LEGS = 4    // max 4 games in one value bet

// ─── FETCH ALL FIXTURES (paginated across all leagues) ─────────────────────
async function fetchAllFixtures(): Promise<unknown[]> {
  const today = new Date().toISOString().split('T')[0]
  const allFixtures: unknown[] = []
  const OFFSETS = [0, 100, 200, 300]

  await Promise.all(OFFSETS.map(async offset => {
    try {
      const url = `${BSD_BASE}/events/?date_from=${today}&date_to=${today}&limit=100&offset=${offset}&sport=1`
      const res = await fetch(url, { headers: bsdHeaders, signal: AbortSignal.timeout(12000) })
      if (!res.ok) return
      const data = await res.json()
      allFixtures.push(...(data.results || []))
    } catch { }
  }))

  // Deduplicate
  const seen = new Set<number>()
  return allFixtures.filter(f => {
    const id = (f as Record<string, unknown>).id as number
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

async function fetchEventDetail(id: number): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${BSD_BASE}/events/${id}/`, { headers: bsdHeaders, signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

// ─── CANDIDATE PICK ────────────────────────────────────────────────────────
interface Candidate {
  fixtureId: number
  homeTeam: string
  awayTeam: string
  league: string
  startTime: string
  pick: string
  market: string
  estimatedOdds: number
  confidence: number
  reason: string
}

// ─── ANALYSE FIXTURE — finds the highest-confidence pick ──────────────────
async function analyseFixtureForValueBet(fixture: Record<string, unknown>): Promise<Candidate | null> {
  const id = fixture.id as number
  const detail = await fetchEventDetail(id)
  if (!detail) return null

  const hf = detail.home_form as Record<string, unknown> | null
  const af = detail.away_form as Record<string, unknown> | null
  const h2h = detail.head_to_head as Record<string, unknown> | null
  const pred = detail.prediction as Record<string, unknown> | null
  const unavail = detail.unavailable_players as Record<string, unknown> | null

  if (!pred && !hf && !af) return null

  const homeTeam = fixture.home_team as string
  const awayTeam = fixture.away_team as string
  const league = (fixture.league as Record<string, unknown>)?.name as string || ''
  const startTime = fixture.event_date as string || ''

  const probHome = Number(pred?.prob_home_win || 0)
  const probDraw = Number(pred?.prob_draw || 0)
  const probAway = Number(pred?.prob_away_win || 0)

  const homeWins = Number(hf?.wins || 0)
  const homeDraws = Number(hf?.draws || 0)
  const homeLosses = Number(hf?.losses || 0)
  const homePlayed = homeWins + homeDraws + homeLosses || 1
  const homeScored = Number(hf?.goals_scored_last_n || 0)
  const homeConceded = Number((hf as Record<string, unknown>)?.goals_conceded_last_n || 0)
  const homeAvgScored = homeScored / homePlayed
  const homeAvgConceded = homeConceded / homePlayed
  const homeWinRate = (homeWins / homePlayed) * 100
  const homeUnbeatenRate = ((homeWins + homeDraws) / homePlayed) * 100
  const homeFormStr = String(hf?.form_string || '')

  const awayWins = Number(af?.wins || 0)
  const awayDraws = Number(af?.draws || 0)
  const awayLosses = Number(af?.losses || 0)
  const awayPlayed = awayWins + awayDraws + awayLosses || 1
  const awayScored = Number(af?.goals_scored_last_n || 0)
  const awayConceded = Number((af as Record<string, unknown>)?.goals_conceded_last_n || 0)
  const awayAvgScored = awayScored / awayPlayed
  const awayAvgConceded = awayConceded / awayPlayed
  const awayWinRate = (awayWins / awayPlayed) * 100
  const awayUnbeatenRate = ((awayWins + awayDraws) / awayPlayed) * 100
  const awayFormStr = String(af?.form_string || '')

  const h2hHW = Number(h2h?.home_wins || 0)
  const h2hD = Number(h2h?.draws || 0)
  const h2hAW = Number(h2h?.away_wins || 0)
  const h2hTotal = h2hHW + h2hD + h2hAW || 1
  const h2hGoals = Number((h2h as Record<string, unknown>)?.total_goals || 0)
  const h2hAvgGoals = h2hGoals / h2hTotal
  const h2hHomeUnbeaten = ((h2hHW + h2hD) / h2hTotal) * 100

  const homeInjured = (unavail?.home as unknown[] || []).length
  const awayInjured = (unavail?.away as unknown[] || []).length

  const expectedGoals = ((homeAvgScored + awayAvgConceded) / 2) + ((awayAvgScored + homeAvgConceded) / 2)
  const combinedAvgGoals = (expectedGoals + h2hAvgGoals) / 2

  const homeRecentWins = (homeFormStr.match(/W/g) || []).length
  const awayRecentWins = (awayFormStr.match(/W/g) || []).length
  const homeRecentForm = homeFormStr.length > 0 ? homeRecentWins / homeFormStr.length : 0.5
  const awayRecentForm = awayFormStr.length > 0 ? awayRecentWins / awayFormStr.length : 0.5

  // Evaluate all picks — find the one with highest confidence >= 90%
  const candidates: Candidate[] = []

  const tryAdd = (pick: string, market: string, odds: number, conf: number, reason: string) => {
    if (conf >= MIN_PROB) {
      candidates.push({ fixtureId: id, homeTeam, awayTeam, league, startTime, pick, market, estimatedOdds: odds, confidence: Math.min(99, conf), reason })
    }
  }

  // Home Win — only if overwhelming data support
  {
    const bsdW = probHome > 0 ? probHome * 0.4 : 50 * 0.4
    const formW = (homeWinRate * 0.3) + (homeRecentForm * 100 * 0.1)
    const h2hW = (h2hHW / h2hTotal * 100) * 0.15
    const conf = bsdW + formW + h2hW + 5 - (homeInjured * 2)
    const odds = probHome > 0 ? Math.max(1.1, parseFloat((100 / (probHome + 5)).toFixed(2))) : 2.0
    tryAdd('Home Win', '1X2', odds, conf, `${homeTeam} W${homeWins}/${homePlayed}, BSD ${probHome}% prob, H2H ${h2hHW}W/${h2hTotal}`)
  }

  // Away Win
  {
    const bsdW = probAway > 0 ? probAway * 0.4 : 40 * 0.4
    const formW = (awayWinRate * 0.3) + (awayRecentForm * 100 * 0.1)
    const h2hW = (h2hAW / h2hTotal * 100) * 0.15
    const conf = bsdW + formW + h2hW - (awayInjured * 2)
    const odds = probAway > 0 ? Math.max(1.2, parseFloat((100 / (probAway + 5)).toFixed(2))) : 2.8
    tryAdd('Away Win', '1X2', odds, conf, `${awayTeam} W${awayWins}/${awayPlayed}, BSD ${probAway}% prob, H2H ${h2hAW}W/${h2hTotal}`)
  }

  // Double Chance 1X
  {
    const bsdW = probHome > 0 && probDraw > 0 ? Math.min(98, probHome + probDraw) * 0.5 : 60 * 0.5
    const formW = (homeUnbeatenRate * 0.3) + (h2hHomeUnbeaten * 0.15)
    const conf = bsdW + formW + 3
    tryAdd('Double Chance (1X)', 'Double Chance', 1.2, conf, `${homeTeam} unbeaten ${Math.round(homeUnbeatenRate)}%, H2H unbeaten ${Math.round(h2hHomeUnbeaten)}%`)
  }

  // Double Chance X2
  {
    const bsdW = probAway > 0 && probDraw > 0 ? Math.min(98, probAway + probDraw) * 0.5 : 55 * 0.5
    const formW = (awayUnbeatenRate * 0.3) + ((h2hAW + h2hD) / h2hTotal * 100 * 0.15)
    const conf = bsdW + formW + 2
    tryAdd('Double Chance (X2)', 'Double Chance', 1.25, conf, `${awayTeam} unbeaten ${Math.round(awayUnbeatenRate)}% away, draw/away combined strong`)
  }

  // Over 0.5 Goals
  {
    const conf = combinedAvgGoals >= 1.5 ? 95 : combinedAvgGoals >= 1.0 ? 91 : combinedAvgGoals >= 0.5 ? 88 : 78
    tryAdd('Over 0.5 Goals', 'Over/Under', 1.08, conf, `Avg ${combinedAvgGoals.toFixed(1)} goals/game across H2H and form — goal almost certain`)
  }

  // Over 1.5 Goals
  {
    const conf = combinedAvgGoals >= 2.5 ? 92 : combinedAvgGoals >= 2.0 ? 86 : combinedAvgGoals >= 1.5 ? 78 : 62
    tryAdd('Over 1.5 Goals', 'Over/Under', 1.3, conf, `Expected ${expectedGoals.toFixed(1)} goals, H2H avg ${h2hAvgGoals.toFixed(1)} — Over 1.5 well supported`)
  }

  // Under 3.5 Goals
  {
    const conf = combinedAvgGoals <= 2.0 ? 94 : combinedAvgGoals <= 2.5 ? 88 : combinedAvgGoals <= 3.0 ? 80 : 65
    tryAdd('Under 3.5 Goals', 'Over/Under', 1.3, conf, `Avg ${combinedAvgGoals.toFixed(1)} goals/game — Under 3.5 very achievable`)
  }

  // Under 4.5 Goals
  {
    const conf = combinedAvgGoals <= 3.5 ? 96 : combinedAvgGoals <= 4.0 ? 90 : 82
    tryAdd('Under 4.5 Goals', 'Over/Under', 1.1, conf, `Very safe — avg ${combinedAvgGoals.toFixed(1)} goals, Under 4.5 rarely fails`)
  }

  // Under 5.5 Goals
  {
    const conf = Math.min(98, 96 - Math.max(0, combinedAvgGoals - 4) * 5)
    tryAdd('Under 5.5 Goals', 'Over/Under', 1.05, conf, `Extremely rare to exceed 5 goals — avg ${combinedAvgGoals.toFixed(1)}/game`)
  }

  // BTTS Yes
  {
    const both = homeAvgScored >= 0.8 && awayAvgScored >= 0.6
    const h2hBoth = h2hAvgGoals >= 2.0
    const conf = both && h2hBoth ? Math.min(92, 65 + homeAvgScored * 8 + awayAvgScored * 8) : both ? Math.min(85, 55 + homeAvgScored * 8 + awayAvgScored * 8) : 40
    tryAdd('Both Teams to Score – Yes', 'BTTS', 1.8, conf, `${homeTeam} ${homeAvgScored.toFixed(1)}/game, ${awayTeam} ${awayAvgScored.toFixed(1)}/game scored`)
  }

  // BTTS No
  {
    const oneDefensive = homeAvgScored < 0.6 || awayAvgScored < 0.5
    const conf = oneDefensive ? 90 : combinedAvgGoals < 1.5 ? 82 : 55
    tryAdd('Both Teams to Score – No', 'BTTS', 1.7, conf, `Defensive pattern — one/both teams score infrequently`)
  }

  // No 3-in-a-row
  {
    const conf = combinedAvgGoals <= 3.0 ? 93 : 85
    tryAdd('Any Team to Score 3+ Goals in a Row – No', 'Consecutive Goals', 1.1, conf, `3 consecutive goals by one team is very rare`)
  }

  // DC 1X + Over 0.5 combo
  {
    const bsdW = probHome > 0 && probDraw > 0 ? Math.min(97, probHome + probDraw) * 0.45 : 58 * 0.45
    const goalC = combinedAvgGoals >= 1.0 ? 15 : 8
    const conf = bsdW + homeUnbeatenRate * 0.25 + goalC
    tryAdd('Double Chance (1X) + Over 0.5 Goals', 'Combo', 1.18, conf, `Home unbeaten safety + goal almost certain`)
  }

  // First Half Under 2.5
  {
    const firstHalfAvg = combinedAvgGoals / 2
    const conf = firstHalfAvg <= 1.0 ? 94 : firstHalfAvg <= 1.5 ? 88 : firstHalfAvg <= 2.0 ? 80 : 65
    tryAdd('First Half Under 2.5 Goals', 'First Half', 1.2, conf, `First half avg est. ${firstHalfAvg.toFixed(1)} goals — safely under 2.5`)
  }

  // Goal before 85 mins
  {
    const conf = combinedAvgGoals >= 1.5 ? 92 : combinedAvgGoals >= 1.0 ? 86 : 78
    tryAdd('Goal Before Minute 85 – Yes', 'Anytime Goal', 1.12, conf, `${combinedAvgGoals.toFixed(1)} avg goals — goal before 85th minute almost certain`)
  }

  // Home Team to Score
  {
    const conf = Math.min(93, 50 + homeAvgScored * 22 + homeRecentForm * 18 - homeInjured * 3)
    tryAdd('Home Team To Score – Yes', 'Team Score', 1.25, conf, `${homeTeam} scores ${homeAvgScored.toFixed(1)}/game — very likely to score`)
  }

  if (!candidates.length) return null

  // Return highest confidence pick
  candidates.sort((a, b) => b.confidence - a.confidence)
  return candidates[0]
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const fixtures = await fetchAllFixtures()
    console.log(`[generate-value-bet] found ${fixtures.length} fixtures today`)

    if (!fixtures.length) {
      const today = new Date().toISOString().split('T')[0]
      await redis.set(`value_bet:${today}`, {
        date: today, legs: [], totalOdds: 0, combinedProbability: 0,
        summary: 'No fixtures found today.', status: 'no_bet', generatedAt: new Date().toISOString(),
      })
      return res.status(200).json({ success: false, message: 'No fixtures today' })
    }

    // Analyse all fixtures — find picks with 90%+ confidence
    const BATCH = 8
    const allCandidates: Candidate[] = []

    for (let i = 0; i < Math.min(fixtures.length, 80); i += BATCH) {
      const batch = (fixtures as Record<string, unknown>[]).slice(i, i + BATCH)
      const results = await Promise.all(batch.map(f => analyseFixtureForValueBet(f)))
      allCandidates.push(...results.filter(Boolean) as Candidate[])
    }

    console.log(`[generate-value-bet] ${allCandidates.length} qualifying candidates found`)

    if (!allCandidates.length) {
      const today = new Date().toISOString().split('T')[0]
      await redis.set(`value_bet:${today}`, {
        date: today, legs: [], totalOdds: 0, combinedProbability: 0,
        summary: 'No picks met our 90%+ confidence threshold today. Check back tomorrow.',
        status: 'no_bet', generatedAt: new Date().toISOString(),
      })
      return res.status(200).json({ success: true, message: 'No qualifying candidates' })
    }

    // Sort by confidence desc — pick absolute best single, then add legs
    allCandidates.sort((a, b) => b.confidence - a.confidence)

    const best = allCandidates[0]
    const selectedLegs: Candidate[] = [best]
    let combinedProb = best.confidence
    const usedFixtures = new Set([best.fixtureId])

    // Try adding more legs — only if combined probability stays >= 90%
    for (const c of allCandidates.slice(1)) {
      if (selectedLegs.length >= MAX_LEGS) break
      if (usedFixtures.has(c.fixtureId)) continue
      const newProb = (combinedProb / 100) * (c.confidence / 100) * 100
      if (newProb >= MIN_PROB) {
        selectedLegs.push(c)
        usedFixtures.add(c.fixtureId)
        combinedProb = newProb
      }
    }

    const totalOdds = selectedLegs.reduce((acc, l) => acc * l.estimatedOdds, 1)

    // Generate summary
    let summary = `Today's banker: ${selectedLegs.length} game${selectedLegs.length > 1 ? 's' : ''} at ${totalOdds.toFixed(2)} odds with ${combinedProb.toFixed(0)}% combined confidence.`
    try {
      const sc = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Write a confident 2-sentence daily banker announcement for Nigerian punters. Casual tone. No markdown, no team names.' },
          { role: 'user', content: `Today's value bet: ${selectedLegs.length} game(s) at ${totalOdds.toFixed(2)} odds with ${combinedProb.toFixed(0)}% combined win probability. Announce this confidently as the daily banker.` }
        ],
        temperature: 0.5, max_tokens: 80,
      })
      summary = sc.choices[0]?.message?.content || summary
    } catch { }

    const today = new Date().toISOString().split('T')[0]
    const valueBetRecord = {
      date: today,
      legs: selectedLegs.map(l => ({
        homeTeam: l.homeTeam, awayTeam: l.awayTeam, league: l.league, startTime: l.startTime,
        pick: l.pick, market: l.market, odds: l.estimatedOdds,
        realProb: l.confidence, impliedProbValue: 0, edge: 0,
        reason: l.reason, result: 'pending' as const,
      })),
      totalOdds: parseFloat(totalOdds.toFixed(2)),
      combinedProbability: parseFloat(combinedProb.toFixed(1)),
      summary,
      status: 'active' as const,
      generatedAt: new Date().toISOString(),
    }

    await redis.set(`value_bet:${today}`, valueBetRecord)
    await redis.set('value_bet:latest', today)

    const historyKey = 'value_bet:history'
    const history = (await redis.get<string[]>(historyKey)) || []
    if (!history.includes(today)) {
      history.unshift(today)
      await redis.set(historyKey, history.slice(0, 365))
    }

    console.log(`[generate-value-bet] saved ${selectedLegs.length} leg value bet at ${totalOdds.toFixed(2)} odds`)
    return res.status(200).json({ success: true, valueBet: valueBetRecord })
  } catch (err) {
    console.error('[generate-value-bet] error:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate value bet' })
  }
}