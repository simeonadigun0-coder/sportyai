import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'
import Groq from 'groq-sdk'

const redis = Redis.fromEnv()
const BSD_BASE = 'https://sports.bzzoiro.com/api'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MIN_CONFIDENCE = 88   // minimum 88% for value bet leg
const MIN_TOTAL_ODDS = 1.5  // minimum total odds for the combo
const MAX_TOTAL_ODDS = 3.0  // maximum total odds for the combo
const MAX_LEGS = 4

// ─── FETCH ALL FIXTURES (paginated) ────────────────────────────────────────
async function fetchAllFixtures(): Promise<unknown[]> {
  const today = new Date().toISOString().split('T')[0]
  const allFixtures: unknown[] = []
  await Promise.all([0, 100, 200, 300].map(async offset => {
    try {
      const res = await fetch(`${BSD_BASE}/events/?date_from=${today}&date_to=${today}&limit=100&offset=${offset}&sport=1`, { headers: bsdHeaders, signal: AbortSignal.timeout(12000) })
      if (!res.ok) return
      const data = await res.json()
      allFixtures.push(...(data.results || []))
    } catch { }
  }))
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

// ─── CORE ANALYSIS ENGINE ──────────────────────────────────────────────────
// Evaluates the 16 preferred markets per fixture using H2H + form + prediction
// Returns the single best pick with highest confidence
async function analyseFixture(fixture: Record<string, unknown>): Promise<Candidate | null> {
  const id = fixture.id as number
  const detail = await fetchEventDetail(id)
  if (!detail) return null

  const hf = detail.home_form as Record<string, unknown> | null
  const af = detail.away_form as Record<string, unknown> | null
  const h2h = detail.head_to_head as Record<string, unknown> | null
  const pred = detail.prediction as Record<string, unknown> | null
  const unavail = detail.unavailable_players as Record<string, unknown> | null
  const srStats = detail.sr_stats as Record<string, unknown> | null

  if (!hf && !af && !pred) return null

  const homeTeam = fixture.home_team as string
  const awayTeam = fixture.away_team as string
  const league = (fixture.league as Record<string, unknown>)?.name as string || ''
  const startTime = fixture.event_date as string || ''

  // ── Extract stats ──
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
  const homeCleanSheets = homeLosses === 0 && homeConceded === 0

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
  const h2hAwayUnbeaten = ((h2hAW + h2hD) / h2hTotal) * 100
  const h2hBothScored = h2hAvgGoals >= 1.5 // proxy for both teams scoring in H2H

  const homeInjured = (unavail?.home as unknown[] || []).length
  const awayInjured = (unavail?.away as unknown[] || []).length

  const expectedGoals = ((homeAvgScored + awayAvgConceded) / 2) + ((awayAvgScored + homeAvgConceded) / 2)
  const combinedAvgGoals = (expectedGoals + h2hAvgGoals) / 2

  const homeRecentForm = homeFormStr.length > 0 ? (homeFormStr.match(/W/g) || []).length / homeFormStr.length : 0.5
  const awayRecentForm = awayFormStr.length > 0 ? (awayFormStr.match(/W/g) || []).length / awayFormStr.length : 0.5

  // Attack pressure proxy for corners
  const attackPressure = (homeAvgScored + awayAvgScored) + (homeAvgConceded + awayAvgConceded) * 0.3
  const sr = srStats?.attack as number || 0
  const srDangerous = srStats?.dangerous_attack as number || 0
  const cornersProxy = attackPressure * 2.5 + (srDangerous > 0 ? srDangerous / 20 : 0)

  const candidates: Candidate[] = []

  const add = (pick: string, market: string, odds: number, conf: number, reason: string) => {
    if (conf >= MIN_CONFIDENCE && odds >= 1.05) {
      candidates.push({ fixtureId: id, homeTeam, awayTeam, league, startTime, pick, market, estimatedOdds: odds, confidence: Math.min(99, Math.round(conf * 10) / 10), reason })
    }
  }

  // ── 1. HOME WIN OR DRAW (Double Chance 1X) ──
  {
    const bsdConf = probHome + probDraw > 0 ? Math.min(97, (probHome + probDraw) * 0.6) : 50
    const formConf = homeUnbeatenRate * 0.25
    const h2hConf = h2hHomeUnbeaten * 0.12
    const inj = homeInjured * 2
    const conf = bsdConf + formConf + h2hConf - inj
    const odds = probHome + probDraw > 0 ? Math.max(1.05, parseFloat((100 / ((probHome + probDraw) * 0.95)).toFixed(2))) : 1.3
    add('Home Win or Draw', 'Double Chance', Math.min(odds, 2.2), conf,
      `${homeTeam} unbeaten ${Math.round(homeUnbeatenRate)}% in form, BSD home+draw prob ${Math.round(probHome + probDraw)}%, H2H unbeaten ${Math.round(h2hHomeUnbeaten)}%`)
  }

  // ── 2. AWAY WIN OR DRAW (Double Chance X2) ──
  {
    const bsdConf = probAway + probDraw > 0 ? Math.min(97, (probAway + probDraw) * 0.6) : 48
    const formConf = awayUnbeatenRate * 0.25
    const h2hConf = h2hAwayUnbeaten * 0.12
    const inj = awayInjured * 2
    const conf = bsdConf + formConf + h2hConf - inj
    const odds = probAway + probDraw > 0 ? Math.max(1.05, parseFloat((100 / ((probAway + probDraw) * 0.95)).toFixed(2))) : 1.4
    add('Away Win or Draw', 'Double Chance', Math.min(odds, 2.2), conf,
      `${awayTeam} unbeaten ${Math.round(awayUnbeatenRate)}% away, BSD away+draw prob ${Math.round(probAway + probDraw)}%, H2H away unbeaten ${Math.round(h2hAwayUnbeaten)}%`)
  }

  // ── 3. HOME WIN TO NIL – NO ──
  // Home team CANNOT win without conceding — away must score if home wins
  // Safe when away team scores consistently and home defence is leaky
  {
    const awayScoresRegularly = awayAvgScored >= 0.7
    const homeLeakyDefence = homeAvgConceded >= 0.8
    const h2hBothTeamsScore = h2hAvgGoals >= 2.0 && h2hAW + h2hD > h2hHW * 0.5
    const conf = awayScoresRegularly && homeLeakyDefence ? Math.min(94,
      55 + awayAvgScored * 15 + homeAvgConceded * 12 + (h2hBothTeamsScore ? 8 : 0))
      : awayScoresRegularly ? Math.min(88, 50 + awayAvgScored * 15 + (h2hBothTeamsScore ? 8 : 0))
      : 45
    add('Home Win to Nil – No', 'Win to Nil', 1.6, conf,
      `${awayTeam} scores ${awayAvgScored.toFixed(1)}/game, ${homeTeam} concedes ${homeAvgConceded.toFixed(1)}/game — home clean sheet unlikely`)
  }

  // ── 4. AWAY WIN TO NIL – NO ──
  // Away team CANNOT win without conceding
  {
    const homeScoresRegularly = homeAvgScored >= 0.8
    const awayLeakyDefence = awayAvgConceded >= 0.7
    const h2hSupport = h2hAvgGoals >= 1.8
    const conf = homeScoresRegularly && awayLeakyDefence ? Math.min(94,
      56 + homeAvgScored * 15 + awayAvgConceded * 12 + (h2hSupport ? 8 : 0))
      : homeScoresRegularly ? Math.min(88, 50 + homeAvgScored * 15 + (h2hSupport ? 8 : 0))
      : 45
    add('Away Win to Nil – No', 'Win to Nil', 1.55, conf,
      `${homeTeam} scores ${homeAvgScored.toFixed(1)}/game, ${awayTeam} concedes ${awayAvgConceded.toFixed(1)}/game — away clean sheet unlikely`)
  }

  // ── 5. ANY TEAM SCORE 3-IN-A-ROW – NO ──
  // No team will score 3 consecutive goals
  {
    const lowScoring = combinedAvgGoals <= 3.0
    const conf = lowScoring ? Math.min(95, 82 + (3.0 - combinedAvgGoals) * 6) : Math.min(88, 78)
    add('Any Team to Score 3+ Goals in a Row – No', 'Consecutive Goals', 1.15, conf,
      `Avg ${combinedAvgGoals.toFixed(1)} goals/game — 3 consecutive by one team is very rare`)
  }

  // ── 6. OVER 1.5 GOALS ──
  {
    const goalConf = combinedAvgGoals >= 2.8 ? 93 : combinedAvgGoals >= 2.3 ? 88 : combinedAvgGoals >= 1.8 ? 82 : combinedAvgGoals >= 1.5 ? 75 : 60
    const bsdBoost = probHome > 55 || probAway > 55 ? 3 : 0 // strong favourite → attacking game
    add('Over 1.5 Goals', 'Over/Under', 1.45, goalConf + bsdBoost,
      `Expected ${expectedGoals.toFixed(1)} goals, H2H avg ${h2hAvgGoals.toFixed(1)} — Over 1.5 well supported`)
  }

  // ── 7. UNDER 3.5 GOALS ──
  {
    const conf = combinedAvgGoals <= 1.8 ? 95 : combinedAvgGoals <= 2.2 ? 91 : combinedAvgGoals <= 2.5 ? 87 : combinedAvgGoals <= 3.0 ? 82 : 68
    add('Under 3.5 Goals', 'Over/Under', 1.35, conf,
      `Avg ${combinedAvgGoals.toFixed(1)} goals/game — Under 3.5 strongly supported`)
  }

  // ── 8. UNDER 4.5 GOALS ──
  {
    const conf = combinedAvgGoals <= 3.0 ? 95 : combinedAvgGoals <= 3.5 ? 92 : combinedAvgGoals <= 4.0 ? 88 : 80
    add('Under 4.5 Goals', 'Over/Under', 1.15, conf,
      `Very safe — avg ${combinedAvgGoals.toFixed(1)} goals/game, Under 4.5 almost always holds`)
  }

  // ── 9. TOTAL CORNERS OVER 7.5 ──
  {
    const conf = cornersProxy >= 9 ? 88 : cornersProxy >= 7.5 ? 82 : cornersProxy >= 6 ? 74 : 60
    add('Total Corners Over 7.5', 'Corners', 1.55, conf,
      `Combined attacking play suggests ${Math.round(cornersProxy)} corners — Over 7.5 supported`)
  }

  // ── 10. TOTAL CORNERS OVER 8.5 ──
  {
    const conf = cornersProxy >= 10 ? 88 : cornersProxy >= 9 ? 82 : cornersProxy >= 8 ? 75 : 60
    add('Total Corners Over 8.5', 'Corners', 1.75, conf,
      `High pressure match expected — ${Math.round(cornersProxy)} corners projected`)
  }

  // ── 11. HOME WIN EITHER HALF ──
  {
    const homeStrongFirstHalf = homeRecentForm >= 0.6 && homeWinRate >= 50
    const conf = homeStrongFirstHalf ? Math.min(92,
      40 + homeWinRate * 0.4 + homeRecentForm * 20 + (probHome > 50 ? probHome * 0.2 : 0) - homeInjured * 2)
      : Math.min(85, 35 + homeWinRate * 0.4 + homeRecentForm * 15 - homeInjured * 2)
    const odds = probHome > 0 ? Math.max(1.4, parseFloat((100 / (probHome * 0.85)).toFixed(2))) : 1.7
    add('Home Team Win Either Half', 'Either Half', Math.min(odds, 2.5), conf,
      `${homeTeam} wins ${Math.round(homeWinRate)}% of games, strong form ${homeFormStr} — likely to lead in one half`)
  }

  // ── 12. AWAY WIN EITHER HALF ──
  {
    const awayStrongFirstHalf = awayRecentForm >= 0.55 && awayWinRate >= 45
    const conf = awayStrongFirstHalf ? Math.min(90,
      35 + awayWinRate * 0.4 + awayRecentForm * 20 + (probAway > 45 ? probAway * 0.2 : 0) - awayInjured * 2)
      : Math.min(82, 30 + awayWinRate * 0.4 + awayRecentForm * 15 - awayInjured * 2)
    const odds = probAway > 0 ? Math.max(1.5, parseFloat((100 / (probAway * 0.82)).toFixed(2))) : 1.9
    add('Away Team Win Either Half', 'Either Half', Math.min(odds, 2.5), conf,
      `${awayTeam} wins ${Math.round(awayWinRate)}% of games, form ${awayFormStr} — can lead in at least one half`)
  }

  // ── 13. HOME OR AWAY (12 — No Draw) ──
  {
    const noDrawProb = probHome + probAway
    const h2hNoDrawRate = ((h2hHW + h2hAW) / h2hTotal) * 100
    const conf = noDrawProb > 0 ? Math.min(93,
      noDrawProb * 0.55 + h2hNoDrawRate * 0.25 + (homeWinRate + awayWinRate) * 0.1)
      : Math.min(80, h2hNoDrawRate * 0.5 + (homeWinRate + awayWinRate) * 0.15)
    const odds = noDrawProb > 0 ? Math.max(1.3, parseFloat((100 / (noDrawProb * 0.92)).toFixed(2))) : 1.5
    add('Home or Away Win (No Draw)', 'Double Chance', Math.min(odds, 2.5), conf,
      `BSD home+away prob ${Math.round(noDrawProb)}%, H2H decisive ${Math.round(h2hNoDrawRate)}% — draw unlikely`)
  }

  // ── 14. OVER 0.5 SECOND HALF ──
  {
    const conf = combinedAvgGoals >= 2.0 ? 93 : combinedAvgGoals >= 1.5 ? 88 : combinedAvgGoals >= 1.0 ? 82 : 72
    add('Over 0.5 Goals – Second Half', 'Second Half', 1.3, conf,
      `${combinedAvgGoals.toFixed(1)} avg goals/game — second half goal almost certain`)
  }

  // ── 15. HOME TEAM OVER 0.5 (Home scores at least 1) ──
  {
    const conf = Math.min(93, 42 + homeAvgScored * 22 + homeRecentForm * 20 + (probHome > 50 ? 8 : 0) - homeInjured * 3)
    const odds = Math.max(1.25, 1.0 + (1 - homeAvgScored * 0.3))
    add('Home Team Over 0.5 Goals', 'Team Goals', Math.min(odds, 2.0), conf,
      `${homeTeam} scores ${homeAvgScored.toFixed(1)}/game, form ${homeFormStr} — will score`)
  }

  // ── 16. AWAY TEAM OVER 0.5 (Away scores at least 1) ──
  {
    const conf = Math.min(90, 38 + awayAvgScored * 20 + awayRecentForm * 18 + (probAway > 40 ? 8 : 0) - awayInjured * 3)
    const odds = Math.max(1.3, 1.0 + (1 - awayAvgScored * 0.25))
    add('Away Team Over 0.5 Goals', 'Team Goals', Math.min(odds, 2.2), conf,
      `${awayTeam} scores ${awayAvgScored.toFixed(1)}/game — will score at least once`)
  }

  if (!candidates.length) return null

  // Sort by confidence desc, prefer higher odds when confidence is close (maximise value)
  candidates.sort((a, b) => {
    const confDiff = b.confidence - a.confidence
    if (Math.abs(confDiff) <= 3) return b.estimatedOdds - a.estimatedOdds
    return confDiff
  })

  return candidates[0]
}

// ─── MAIN HANDLER ──────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const fixtures = await fetchAllFixtures()
    console.log(`[generate-value-bet] ${fixtures.length} fixtures found`)

    if (!fixtures.length) {
      const today = new Date().toISOString().split('T')[0]
      await redis.set(`value_bet:${today}`, { date: today, legs: [], totalOdds: 0, combinedProbability: 0, summary: 'No fixtures today.', status: 'no_bet', generatedAt: new Date().toISOString() })
      return res.status(200).json({ success: false, message: 'No fixtures today' })
    }

    const BATCH = 8
    const allCandidates: Candidate[] = []
    for (let i = 0; i < Math.min(fixtures.length, 80); i += BATCH) {
      const batch = (fixtures as Record<string, unknown>[]).slice(i, i + BATCH)
      const results = await Promise.all(batch.map(f => analyseFixture(f)))
      allCandidates.push(...results.filter(Boolean) as Candidate[])
    }

    console.log(`[generate-value-bet] ${allCandidates.length} qualifying candidates (>=${MIN_CONFIDENCE}% confidence)`)

    if (!allCandidates.length) {
      const today = new Date().toISOString().split('T')[0]
      await redis.set(`value_bet:${today}`, { date: today, legs: [], totalOdds: 0, combinedProbability: 0, summary: 'No picks met our confidence threshold today. Check back tomorrow.', status: 'no_bet', generatedAt: new Date().toISOString() })
      return res.status(200).json({ success: true, message: 'No qualifying candidates' })
    }

    // Sort by confidence desc — best first
    allCandidates.sort((a, b) => {
      const confDiff = b.confidence - a.confidence
      if (Math.abs(confDiff) <= 3) return b.estimatedOdds - a.estimatedOdds
      return confDiff
    })

    // Build combo: start with best pick, add legs from different fixtures
    // Only add if combined odds stay within 1.5-3.0 range
    const selectedLegs: Candidate[] = [allCandidates[0]]
    let combinedProb = allCandidates[0].confidence
    let totalOdds = allCandidates[0].estimatedOdds
    const usedFixtures = new Set([allCandidates[0].fixtureId])

    for (const c of allCandidates.slice(1)) {
      if (selectedLegs.length >= MAX_LEGS) break
      if (usedFixtures.has(c.fixtureId)) continue
      const newOdds = totalOdds * c.estimatedOdds
      const newProb = (combinedProb / 100) * (c.confidence / 100) * 100
      // Only add if: combined prob stays >= 88% AND total odds stays <= 3.0
      if (newProb >= MIN_CONFIDENCE && newOdds <= MAX_TOTAL_ODDS) {
        selectedLegs.push(c)
        usedFixtures.add(c.fixtureId)
        combinedProb = newProb
        totalOdds = newOdds
      }
    }

    // Ensure minimum 1.5 odds — if single pick is under, try to add one more leg
    if (totalOdds < MIN_TOTAL_ODDS && selectedLegs.length < MAX_LEGS) {
      for (const c of allCandidates) {
        if (usedFixtures.has(c.fixtureId)) continue
        const newOdds = totalOdds * c.estimatedOdds
        const newProb = (combinedProb / 100) * (c.confidence / 100) * 100
        if (newProb >= MIN_CONFIDENCE && newOdds <= MAX_TOTAL_ODDS) {
          selectedLegs.push(c)
          usedFixtures.add(c.fixtureId)
          combinedProb = newProb
          totalOdds = newOdds
          break
        }
      }
    }

    const finalOdds = parseFloat(totalOdds.toFixed(2))
    const finalProb = parseFloat(combinedProb.toFixed(1))

    let summary = `Today's banker: ${selectedLegs.length} pick${selectedLegs.length > 1 ? 's' : ''} at ${finalOdds} odds with ${finalProb}% combined confidence.`
    try {
      const sc = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Write a confident 2-sentence daily banker announcement for Nigerian punters. Casual tone. No markdown, no team names.' },
          { role: 'user', content: `Today's value bet: ${selectedLegs.length} pick(s) at ${finalOdds} odds with ${finalProb}% combined probability. Top pick: ${selectedLegs[0].pick} on ${selectedLegs[0].homeTeam} vs ${selectedLegs[0].awayTeam}. Announce confidently.` }
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
        realProb: l.confidence, reason: l.reason, result: 'pending' as const,
      })),
      totalOdds: finalOdds,
      combinedProbability: finalProb,
      summary, status: 'active' as const,
      generatedAt: new Date().toISOString(),
    }

    await redis.set(`value_bet:${today}`, valueBetRecord)
    await redis.set('value_bet:latest', today)
    const history = (await redis.get<string[]>('value_bet:history')) || []
    if (!history.includes(today)) {
      history.unshift(today)
      await redis.set('value_bet:history', history.slice(0, 365))
    }

    console.log(`[generate-value-bet] saved — ${selectedLegs.length} legs at ${finalOdds} odds, ${finalProb}% prob`)
    return res.status(200).json({ success: true, valueBet: valueBetRecord })
  } catch (err) {
    console.error('[generate-value-bet] error:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed' })
  }
}