import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, isSubscriptionActive, incrementFreeBuilderUsed } from '@/lib/users'
import Groq from 'groq-sdk'

const BSD_BASE = 'https://sports.bzzoiro.com/api'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── 100 MARKET CATALOGUE ─────────────────────────────────────────────────
// Every pick must map to one of these
const MARKETS = {
  // 1X2
  HOME_WIN: { pick: 'Home Win', market: '1X2', tier: 1 },
  DRAW: { pick: 'Draw', market: '1X2', tier: 1 },
  AWAY_WIN: { pick: 'Away Win', market: '1X2', tier: 1 },

  // Double Chance
  DC_1X: { pick: 'Double Chance (1X)', market: 'Double Chance', tier: 1 },
  DC_X2: { pick: 'Double Chance (X2)', market: 'Double Chance', tier: 1 },
  DC_12: { pick: 'Home or Away (12)', market: 'Double Chance', tier: 1 },

  // Goals Over/Under
  OVER_05: { pick: 'Over 0.5 Goals', market: 'Over/Under', tier: 1 },
  OVER_15: { pick: 'Over 1.5 Goals', market: 'Over/Under', tier: 1 },
  OVER_25: { pick: 'Over 2.5 Goals', market: 'Over/Under', tier: 1 },
  UNDER_25: { pick: 'Under 2.5 Goals', market: 'Over/Under', tier: 1 },
  UNDER_35: { pick: 'Under 3.5 Goals', market: 'Over/Under', tier: 1 },
  UNDER_45: { pick: 'Under 4.5 Goals', market: 'Over/Under', tier: 1 },
  UNDER_55: { pick: 'Under 5.5 Goals', market: 'Over/Under', tier: 1 },

  // BTTS
  BTTS_YES: { pick: 'Both Teams to Score – Yes', market: 'BTTS', tier: 1 },
  BTTS_NO: { pick: 'Both Teams to Score – No', market: 'BTTS', tier: 1 },

  // Team goals
  HOME_OVER_05: { pick: 'Home Team Over 0.5 Goals', market: 'Team Goals', tier: 2 },
  AWAY_OVER_05: { pick: 'Away Team Over 0.5 Goals', market: 'Team Goals', tier: 2 },
  HOME_UNDER_35: { pick: 'Home Team Under 3.5 Goals', market: 'Team Goals', tier: 2 },
  AWAY_UNDER_25: { pick: 'Away Team Under 2.5 Goals', market: 'Team Goals', tier: 2 },
  HOME_TO_SCORE: { pick: 'Home Team To Score – Yes', market: 'Team Score', tier: 2 },
  AWAY_TO_SCORE: { pick: 'Away Team To Score – Yes', market: 'Team Score', tier: 2 },
  HOME_CLEAN_SHEET_NO: { pick: 'Home Team Clean Sheet – No', market: 'Clean Sheet', tier: 2 },
  AWAY_CLEAN_SHEET_NO: { pick: 'Away Team Clean Sheet – No', market: 'Clean Sheet', tier: 2 },

  // Half-time
  FIRST_HALF_OVER_05: { pick: 'First Half Over 0.5 Goals', market: 'First Half', tier: 2 },
  FIRST_HALF_UNDER_25: { pick: 'First Half Under 2.5 Goals', market: 'First Half', tier: 2 },
  SECOND_HALF_OVER_05: { pick: 'Second Half Over 0.5 Goals', market: 'Second Half', tier: 2 },
  SECOND_HALF_UNDER_25: { pick: 'Second Half Under 2.5 Goals', market: 'Second Half', tier: 2 },
  GOAL_BOTH_HALVES: { pick: 'Match to Have Goal in Both Halves', market: 'Both Halves', tier: 2 },
  GOAL_SECOND_HALF: { pick: 'Goal in Second Half – Yes', market: 'Second Half', tier: 2 },
  GOAL_BEFORE_85: { pick: 'Goal Before Minute 85 – Yes', market: 'Anytime Goal', tier: 2 },

  // Match result combos
  DC_1X_OVER_05: { pick: 'Double Chance (1X) + Over 0.5 Goals', market: 'Combo', tier: 2 },
  DC_1X_OVER_15: { pick: 'Double Chance (1X) + Over 1.5 Goals', market: 'Combo', tier: 2 },
  DC_1X_UNDER_55: { pick: 'Double Chance (1X) + Under 5.5 Goals', market: 'Combo', tier: 2 },
  OVER_15_UNDER_55: { pick: 'Over 1.5 Goals + Under 5.5 Goals', market: 'Combo', tier: 2 },
  HOME_SCORE_OVER_15: { pick: 'Home Team To Score + Over 1.5 Goals', market: 'Combo', tier: 2 },
  TOTAL_GOALS_15: { pick: 'Total Goals 1-5', market: 'Total Goals', tier: 2 },
  TOTAL_GOALS_25: { pick: 'Total Goals 2-5', market: 'Total Goals', tier: 2 },

  // Consecutive goals (NO markets are safe)
  NO_3_ROW_ANY: { pick: 'Any Team to Score 3+ Goals in a Row – No', market: 'Consecutive Goals', tier: 2 },
  NO_3_ROW_HOME: { pick: 'Home Team 3+ Goals in a Row – No', market: 'Consecutive Goals', tier: 2 },
  NO_3_ROW_AWAY: { pick: 'Away Team 3+ Goals in a Row – No', market: 'Consecutive Goals', tier: 2 },

  // Corners
  CORNERS_OVER_65: { pick: 'Total Corners Over 6.5', market: 'Corners', tier: 2 },
  CORNERS_OVER_75: { pick: 'Total Corners Over 7.5', market: 'Corners', tier: 2 },
  CORNERS_OVER_85: { pick: 'Total Corners Over 8.5', market: 'Corners', tier: 2 },
  CORNERS_UNDER_145: { pick: 'Total Corners Under 14.5', market: 'Corners', tier: 2 },
  CORNERS_UNDER_155: { pick: 'Total Corners Under 15.5', market: 'Corners', tier: 2 },

  // Cards
  CARDS_OVER_15: { pick: 'Over 1.5 Cards', market: 'Cards', tier: 2 },
  CARDS_OVER_25: { pick: 'Over 2.5 Cards', market: 'Cards', tier: 2 },
  HOME_CARD_05: { pick: 'Home Team Over 0.5 Cards', market: 'Cards', tier: 2 },
  AWAY_CARD_05: { pick: 'Away Team Over 0.5 Cards', market: 'Cards', tier: 2 },
  BOTH_CARDS: { pick: 'Both Teams 1+ Card', market: 'Cards', tier: 2 },
}

// ─── FETCH ALL FIXTURES (paginated) ───────────────────────────────────────
async function fetchAllFixtures(dateFrom: string, dateTo: string): Promise<unknown[]> {
  const allFixtures: unknown[] = []
  const OFFSETS = [0, 100, 200, 300] // fetch up to 400 fixtures across all leagues

  await Promise.all(OFFSETS.map(async offset => {
    try {
      const url = `${BSD_BASE}/events/?date_from=${dateFrom}&date_to=${dateTo}&limit=100&offset=${offset}&sport=1`
      const res = await fetch(url, { headers: bsdHeaders, signal: AbortSignal.timeout(12000) })
      if (!res.ok) return
      const data = await res.json()
      allFixtures.push(...(data.results || []))
    } catch { /* silent */ }
  }))

  // Deduplicate by fixture ID
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

// ─── CORE PICK SCORING ENGINE ─────────────────────────────────────────────
// Analyses a fixture and returns scored picks using H2H, form, and estimation
// Thinks like an expert punter — evaluates ALL relevant markets, picks the best

interface ScoredPick {
  pick: string
  market: string
  tier: number
  confidence: number // 0-100
  estimatedOdds: number
  reason: string
}

function scorePicks(
  fixture: Record<string, unknown>,
  detail: Record<string, unknown>,
  riskLevel: 'low' | 'medium' | 'high'
): ScoredPick[] {
  const hf = detail.home_form as Record<string, unknown> | null
  const af = detail.away_form as Record<string, unknown> | null
  const h2h = detail.head_to_head as Record<string, unknown> | null
  const pred = detail.prediction as Record<string, unknown> | null
  const unavail = detail.unavailable_players as Record<string, unknown> | null

  const homeTeam = fixture.home_team as string
  const awayTeam = fixture.away_team as string

  // ── Extract key stats ──
  const probHome = Number(pred?.prob_home_win || 0)
  const probDraw = Number(pred?.prob_draw || 0)
  const probAway = Number(pred?.prob_away_win || 0)

  const homeWins = Number(hf?.wins || 0)
  const homeDraws = Number(hf?.draws || 0)
  const homeLosses = Number(hf?.losses || 0)
  const homePlayed = homeWins + homeDraws + homeLosses || 1
  const homeFormStr = String(hf?.form_string || '')
  const homeScored = Number(hf?.goals_scored_last_n || 0)
  const homeConceded = Number((hf as Record<string, unknown>)?.goals_conceded_last_n || 0)
  const homeAvgScored = homeScored / homePlayed
  const homeAvgConceded = homeConceded / homePlayed
  const homeWinRate = (homeWins / homePlayed) * 100
  const homeUnbeatenRate = ((homeWins + homeDraws) / homePlayed) * 100

  const awayWins = Number(af?.wins || 0)
  const awayDraws = Number(af?.draws || 0)
  const awayLosses = Number(af?.losses || 0)
  const awayPlayed = awayWins + awayDraws + awayLosses || 1
  const awayFormStr = String(af?.form_string || '')
  const awayScored = Number(af?.goals_scored_last_n || 0)
  const awayConceded = Number((af as Record<string, unknown>)?.goals_conceded_last_n || 0)
  const awayAvgScored = awayScored / awayPlayed
  const awayAvgConceded = awayConceded / awayPlayed
  const awayWinRate = (awayWins / awayPlayed) * 100
  const awayUnbeatenRate = ((awayWins + awayDraws) / awayPlayed) * 100

  const h2hHW = Number(h2h?.home_wins || 0)
  const h2hD = Number(h2h?.draws || 0)
  const h2hAW = Number(h2h?.away_wins || 0)
  const h2hTotal = h2hHW + h2hD + h2hAW || 1
  const h2hGoals = Number((h2h as Record<string, unknown>)?.total_goals || 0)
  const h2hAvgGoals = h2hGoals / h2hTotal
  const h2hHomeUnbeaten = ((h2hHW + h2hD) / h2hTotal) * 100

  const homeInjured = (unavail?.home as unknown[] || []).length
  const awayInjured = (unavail?.away as unknown[] || []).length

  // Expected goals model
  const expectedGoals = ((homeAvgScored + awayAvgConceded) / 2) + ((awayAvgScored + homeAvgConceded) / 2)
  const combinedAvgGoals = (expectedGoals + h2hAvgGoals) / 2

  // Recent form quality — count last 5 results
  const homeRecentWins = (homeFormStr.match(/W/g) || []).length
  const awayRecentWins = (awayFormStr.match(/W/g) || []).length
  const homeRecentForm = homeFormStr.length > 0 ? homeRecentWins / homeFormStr.length : 0.5
  const awayRecentForm = awayFormStr.length > 0 ? awayRecentWins / awayFormStr.length : 0.5

  const candidates: ScoredPick[] = []

  // ── RISK THRESHOLDS ──
  const minConf = riskLevel === 'low' ? 72 : riskLevel === 'medium' ? 62 : 52
  const maxOdds = riskLevel === 'low' ? 1.8 : riskLevel === 'medium' ? 2.5 : 4.0

  // Helper to add a candidate if confidence meets threshold
  const add = (pick: ScoredPick) => {
    if (pick.confidence >= minConf && pick.estimatedOdds <= maxOdds) {
      candidates.push(pick)
    }
  }

  // ── 1. HOME WIN ──
  {
    const bsdWeight = probHome > 0 ? probHome * 0.4 : 50 * 0.4
    const formWeight = (homeWinRate * 0.3) + (homeRecentForm * 100 * 0.1)
    const h2hWeight = (h2hHW / h2hTotal * 100) * 0.15
    const injPenalty = homeInjured * 2
    const conf = Math.min(95, bsdWeight + formWeight + h2hWeight + 5 - injPenalty)
    const odds = probHome > 0 ? parseFloat((100 / (probHome + 5)).toFixed(2)) : 2.0
    add({ ...MARKETS.HOME_WIN, confidence: conf, estimatedOdds: Math.max(1.1, odds), reason: `${homeTeam} W${homeWins}/${homePlayed} form, BSD ${probHome}% home win prob${homeInjured > 0 ? `, ${homeInjured} out` : ''}` })
  }

  // ── 2. AWAY WIN ──
  {
    const bsdWeight = probAway > 0 ? probAway * 0.4 : 40 * 0.4
    const formWeight = (awayWinRate * 0.3) + (awayRecentForm * 100 * 0.1)
    const h2hWeight = (h2hAW / h2hTotal * 100) * 0.15
    const injPenalty = awayInjured * 2
    const conf = Math.min(95, bsdWeight + formWeight + h2hWeight - injPenalty)
    const odds = probAway > 0 ? parseFloat((100 / (probAway + 5)).toFixed(2)) : 2.8
    add({ ...MARKETS.AWAY_WIN, confidence: conf, estimatedOdds: Math.max(1.2, odds), reason: `${awayTeam} W${awayWins}/${awayPlayed} away form, BSD ${probAway}% away prob${awayInjured > 0 ? `, ${awayInjured} out` : ''}` })
  }

  // ── 3. DOUBLE CHANCE 1X (Home or Draw) ──
  {
    const bsdWeight = probHome > 0 && probDraw > 0 ? Math.min(98, probHome + probDraw) * 0.5 : 60 * 0.5
    const formWeight = (homeUnbeatenRate * 0.3) + (h2hHomeUnbeaten * 0.15)
    const conf = Math.min(95, bsdWeight + formWeight + 3)
    add({ ...MARKETS.DC_1X, confidence: conf, estimatedOdds: 1.2, reason: `${homeTeam} unbeaten ${Math.round(homeUnbeatenRate)}% at home, H2H unbeaten ${Math.round(h2hHomeUnbeaten)}%` })
  }

  // ── 4. DOUBLE CHANCE X2 (Draw or Away) ──
  {
    const bsdWeight = probAway > 0 && probDraw > 0 ? Math.min(98, probAway + probDraw) * 0.5 : 55 * 0.5
    const formWeight = (awayUnbeatenRate * 0.3) + ((h2hAW + h2hD) / h2hTotal * 100 * 0.15)
    const conf = Math.min(95, bsdWeight + formWeight + 2)
    add({ ...MARKETS.DC_X2, confidence: conf, estimatedOdds: 1.25, reason: `${awayTeam} unbeaten ${Math.round(awayUnbeatenRate)}% of away games, draw/away prob combined` })
  }

  // ── 5. OVER 0.5 GOALS ──
  {
    const goalChance = combinedAvgGoals >= 1.5 ? 94 : combinedAvgGoals >= 1.0 ? 88 : combinedAvgGoals >= 0.5 ? 80 : 70
    const conf = Math.min(97, goalChance)
    add({ ...MARKETS.OVER_05, confidence: conf, estimatedOdds: 1.08, reason: `Avg ${combinedAvgGoals.toFixed(1)} goals/game in H2H and form data — at least one goal very likely` })
  }

  // ── 6. OVER 1.5 GOALS ──
  {
    const goalChance = combinedAvgGoals >= 2.5 ? 88 : combinedAvgGoals >= 2.0 ? 80 : combinedAvgGoals >= 1.5 ? 70 : 55
    const conf = Math.min(92, goalChance)
    add({ ...MARKETS.OVER_15, confidence: conf, estimatedOdds: 1.3, reason: `Expected goals ${expectedGoals.toFixed(1)}, H2H avg ${h2hAvgGoals.toFixed(1)} — Over 1.5 well supported` })
  }

  // ── 7. OVER 2.5 GOALS ──
  {
    const goalChance = combinedAvgGoals >= 3.5 ? 82 : combinedAvgGoals >= 2.8 ? 72 : combinedAvgGoals >= 2.5 ? 64 : 48
    const conf = Math.min(88, goalChance)
    add({ ...MARKETS.OVER_25, confidence: conf, estimatedOdds: 1.75, reason: `High scoring games — avg ${combinedAvgGoals.toFixed(1)} total goals per game` })
  }

  // ── 8. UNDER 2.5 GOALS ──
  {
    const goalChance = combinedAvgGoals <= 1.5 ? 88 : combinedAvgGoals <= 2.0 ? 80 : combinedAvgGoals <= 2.5 ? 68 : 45
    const conf = Math.min(90, goalChance)
    add({ ...MARKETS.UNDER_25, confidence: conf, estimatedOdds: 1.6, reason: `Low scoring pattern — avg ${combinedAvgGoals.toFixed(1)} goals/game suggests Under 2.5` })
  }

  // ── 9. UNDER 3.5 GOALS ──
  {
    const goalChance = combinedAvgGoals <= 2.0 ? 92 : combinedAvgGoals <= 2.5 ? 85 : combinedAvgGoals <= 3.0 ? 76 : 60
    const conf = Math.min(93, goalChance)
    add({ ...MARKETS.UNDER_35, confidence: conf, estimatedOdds: 1.3, reason: `Avg ${combinedAvgGoals.toFixed(1)} goals — Under 3.5 very achievable` })
  }

  // ── 10. UNDER 4.5 GOALS ──
  {
    const conf = Math.min(95, combinedAvgGoals <= 3.5 ? 93 : combinedAvgGoals <= 4.0 ? 87 : 78)
    add({ ...MARKETS.UNDER_45, confidence: conf, estimatedOdds: 1.1, reason: `Very safe — ${combinedAvgGoals.toFixed(1)} avg goals, Under 4.5 rarely fails` })
  }

  // ── 11. UNDER 5.5 GOALS ──
  {
    const conf = Math.min(97, 95 - Math.max(0, combinedAvgGoals - 4) * 5)
    add({ ...MARKETS.UNDER_55, confidence: conf, estimatedOdds: 1.05, reason: `Extremely safe market — matches rarely exceed 5 goals` })
  }

  // ── 12. BTTS YES ──
  {
    const bothScoreRegularly = homeAvgScored >= 0.8 && awayAvgScored >= 0.6
    const h2hBothScore = h2hAvgGoals >= 2.0
    const conf = bothScoreRegularly && h2hBothScore ? Math.min(88, 65 + (homeAvgScored * 8) + (awayAvgScored * 8))
      : bothScoreRegularly ? Math.min(80, 55 + (homeAvgScored * 8) + (awayAvgScored * 8))
      : 40
    add({ ...MARKETS.BTTS_YES, confidence: conf, estimatedOdds: 1.8, reason: `${homeTeam} scores ${homeAvgScored.toFixed(1)}/game, ${awayTeam} scores ${awayAvgScored.toFixed(1)}/game` })
  }

  // ── 13. BTTS NO ──
  {
    const oneDefensive = homeAvgScored < 0.6 || awayAvgScored < 0.5
    const conf = oneDefensive ? Math.min(82, 70) : combinedAvgGoals < 1.5 ? 65 : 45
    add({ ...MARKETS.BTTS_NO, confidence: conf, estimatedOdds: 1.7, reason: `Defensive pattern detected — one or both teams score infrequently` })
  }

  // ── 14. HOME TEAM TO SCORE ──
  {
    const conf = Math.min(92, 50 + (homeAvgScored * 20) + (homeRecentForm * 20) - (homeInjured * 3))
    add({ ...MARKETS.HOME_TO_SCORE, confidence: conf, estimatedOdds: 1.25, reason: `${homeTeam} scores in ${Math.round(homeAvgScored * 10) * 10}% of games based on form` })
  }

  // ── 15. AWAY TEAM TO SCORE ──
  {
    const conf = Math.min(90, 45 + (awayAvgScored * 20) + (awayRecentForm * 20) - (awayInjured * 3))
    add({ ...MARKETS.AWAY_TO_SCORE, confidence: conf, estimatedOdds: 1.3, reason: `${awayTeam} scores ${awayAvgScored.toFixed(1)}/game on form data` })
  }

  // ── 16. FIRST HALF OVER 0.5 ──
  {
    const conf = Math.min(88, combinedAvgGoals >= 2.0 ? 82 : combinedAvgGoals >= 1.5 ? 74 : 62)
    add({ ...MARKETS.FIRST_HALF_OVER_05, confidence: conf, estimatedOdds: 1.4, reason: `${combinedAvgGoals.toFixed(1)} avg goals/game makes first half goal very likely` })
  }

  // ── 17. FIRST HALF UNDER 2.5 ──
  {
    const firstHalfAvg = combinedAvgGoals / 2
    const conf = Math.min(92, firstHalfAvg <= 1.0 ? 90 : firstHalfAvg <= 1.5 ? 84 : firstHalfAvg <= 2.0 ? 76 : 62)
    add({ ...MARKETS.FIRST_HALF_UNDER_25, confidence: conf, estimatedOdds: 1.2, reason: `First half avg est. ${firstHalfAvg.toFixed(1)} goals — Under 2.5 first half very likely` })
  }

  // ── 18. SECOND HALF OVER 0.5 ──
  {
    const conf = Math.min(88, combinedAvgGoals >= 1.8 ? 83 : combinedAvgGoals >= 1.2 ? 75 : 64)
    add({ ...MARKETS.SECOND_HALF_OVER_05, confidence: conf, estimatedOdds: 1.35, reason: `Most goals occur second half — ${combinedAvgGoals.toFixed(1)} total avg/game` })
  }

  // ── 19. GOAL BOTH HALVES ──
  {
    const conf = Math.min(82, combinedAvgGoals >= 2.5 ? 78 : combinedAvgGoals >= 2.0 ? 68 : 52)
    add({ ...MARKETS.GOAL_BOTH_HALVES, confidence: conf, estimatedOdds: 1.9, reason: `High scoring games (avg ${combinedAvgGoals.toFixed(1)}) often produce goals in both halves` })
  }

  // ── 20. HOME CLEAN SHEET NO ──
  {
    const conf = Math.min(88, 50 + (awayAvgScored * 18) + (awayRecentForm * 15))
    add({ ...MARKETS.HOME_CLEAN_SHEET_NO, confidence: conf, estimatedOdds: 1.4, reason: `${awayTeam} scores ${awayAvgScored.toFixed(1)}/game — likely to score at least once` })
  }

  // ── 21. AWAY CLEAN SHEET NO ──
  {
    const conf = Math.min(88, 50 + (homeAvgScored * 18) + (homeRecentForm * 15))
    add({ ...MARKETS.AWAY_CLEAN_SHEET_NO, confidence: conf, estimatedOdds: 1.35, reason: `${homeTeam} scores ${homeAvgScored.toFixed(1)}/game at home` })
  }

  // ── 22. TOTAL GOALS 1-5 ──
  {
    const inRange = combinedAvgGoals >= 0.8 && combinedAvgGoals <= 4.5
    const conf = inRange ? Math.min(90, 75 + (combinedAvgGoals >= 1.5 ? 10 : 0)) : 55
    add({ ...MARKETS.TOTAL_GOALS_15, confidence: conf, estimatedOdds: 1.15, reason: `Avg ${combinedAvgGoals.toFixed(1)} goals/game — well within 1-5 goals range` })
  }

  // ── 23. NO 3-IN-A-ROW (Any Team) ──
  {
    // Most matches don't have a team scoring 3 consecutive goals
    const conf = Math.min(92, combinedAvgGoals <= 3.0 ? 88 : 80)
    add({ ...MARKETS.NO_3_ROW_ANY, confidence: conf, estimatedOdds: 1.1, reason: `3 consecutive goals by one team is rare — avg ${combinedAvgGoals.toFixed(1)} goals/game` })
  }

  // ── 24. CORNERS OVER 6.5 ──
  // Estimate corners from attacking pressure (avg scored goals proxy)
  {
    const pressureScore = homeAvgScored + awayAvgScored
    const conf = Math.min(84, pressureScore >= 2.5 ? 80 : pressureScore >= 1.8 ? 72 : 60)
    add({ ...MARKETS.CORNERS_OVER_65, confidence: conf, estimatedOdds: 1.5, reason: `Combined attacking pressure suggests 6+ corners (${pressureScore.toFixed(1)} avg scored/game combined)` })
  }

  // ── 25. CORNERS UNDER 14.5 ──
  {
    const conf = Math.min(90, 85)
    add({ ...MARKETS.CORNERS_UNDER_145, confidence: conf, estimatedOdds: 1.15, reason: `14+ corners per match is very rare — safe Under 14.5 pick` })
  }

  // ── 26. OVER 1.5 CARDS ──
  {
    const isHighPressure = combinedAvgGoals >= 2.0 || homeWinRate >= 60 || awayWinRate >= 60
    const conf = Math.min(82, isHighPressure ? 76 : 64)
    add({ ...MARKETS.CARDS_OVER_15, confidence: conf, estimatedOdds: 1.55, reason: `Competitive match expected — Over 1.5 cards is common in most football games` })
  }

  // ── 27. BOTH TEAMS 1+ CARD ──
  {
    const conf = Math.min(80, 68)
    add({ ...MARKETS.BOTH_CARDS, confidence: conf, estimatedOdds: 1.7, reason: `Both teams receiving at least one card is common in competitive matches` })
  }

  // ── 28. DC_1X + OVER 0.5 COMBO ──
  {
    const bsdWeight = probHome > 0 && probDraw > 0 ? Math.min(97, probHome + probDraw) * 0.45 : 58 * 0.45
    const goalConf = combinedAvgGoals >= 1.0 ? 15 : 8
    const conf = Math.min(92, bsdWeight + (homeUnbeatenRate * 0.25) + goalConf)
    add({ ...MARKETS.DC_1X_OVER_05, confidence: conf, estimatedOdds: 1.18, reason: `${homeTeam} unbeaten ${Math.round(homeUnbeatenRate)}% + at least one goal very likely` })
  }

  // ── 29. DC_1X + OVER 1.5 COMBO ──
  {
    const bsdWeight = probHome > 0 && probDraw > 0 ? Math.min(97, probHome + probDraw) * 0.4 : 55 * 0.4
    const goalConf = combinedAvgGoals >= 2.0 ? 20 : combinedAvgGoals >= 1.5 ? 14 : 8
    const conf = Math.min(88, bsdWeight + (homeUnbeatenRate * 0.2) + goalConf)
    add({ ...MARKETS.DC_1X_OVER_15, confidence: conf, estimatedOdds: 1.35, reason: `Home team safety + scoring form for Over 1.5` })
  }

  // ── 30. GOAL BEFORE MINUTE 85 ──
  {
    const conf = Math.min(92, combinedAvgGoals >= 1.5 ? 88 : combinedAvgGoals >= 1.0 ? 82 : 72)
    add({ ...MARKETS.GOAL_BEFORE_85, confidence: conf, estimatedOdds: 1.12, reason: `${combinedAvgGoals.toFixed(1)} avg goals/game — goal before 85th minute almost certain` })
  }

  return candidates
}

// ─── BEST PICK SELECTOR ────────────────────────────────────────────────────
// For each fixture, pick the single best market based on confidence and context
function selectBestPick(candidates: ScoredPick[], riskLevel: 'low' | 'medium' | 'high'): ScoredPick | null {
  if (!candidates.length) return null

  // Sort: highest confidence first, then lowest odds (safest)
  // For high risk: prefer higher odds picks
  candidates.sort((a, b) => {
    const confDiff = b.confidence - a.confidence
    if (Math.abs(confDiff) > 5) return confDiff
    if (riskLevel === 'high') return b.estimatedOdds - a.estimatedOdds
    return a.estimatedOdds - b.estimatedOdds
  })

  return candidates[0]
}

// ─── ACCUMULATOR BUILDER LOGIC ────────────────────────────────────────────
function buildAccumulator(
  scoredFixtures: Array<{ fixture: Record<string, unknown>; pick: ScoredPick }>,
  targetOdds: number,
  riskLevel: 'low' | 'medium' | 'high'
): Array<{ fixture: Record<string, unknown>; pick: ScoredPick }> {
  // Sort by confidence descending — most reliable first
  scoredFixtures.sort((a, b) => b.pick.confidence - a.pick.confidence)

  const selected: typeof scoredFixtures = []
  let currentOdds = 1.0

  // Strategy: quantity of safe picks over risky ones
  // Keep adding picks until we reach target odds
  for (const item of scoredFixtures) {
    if (currentOdds >= targetOdds) break
    // Don't overshoot by more than 50% if we already have picks
    if (selected.length > 0 && currentOdds * item.pick.estimatedOdds > targetOdds * 2) continue
    selected.push(item)
    currentOdds *= item.pick.estimatedOdds
  }

  // If still below target, add more even if it slightly lowers confidence
  if (currentOdds < targetOdds) {
    const remaining = scoredFixtures.filter(s => !selected.includes(s))
    for (const item of remaining) {
      if (currentOdds >= targetOdds) break
      selected.push(item)
      currentOdds *= item.pick.estimatedOdds
    }
  }

  return selected
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────
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

    // Fetch ALL fixtures (paginated across all leagues)
    const fixtures = await fetchAllFixtures(dateFrom, dateTo)
    if (!fixtures.length) {
      return res.status(200).json({ tier1: [], tier2: [], message: 'No fixtures found' })
    }

    console.log(`[builder] found ${fixtures.length} fixtures for ${dateFrom} to ${dateTo}`)

    // Analyse fixtures in parallel batches — get BSD detail for each
    const BATCH = 6
    const tier1Picks: Array<{ fixture: Record<string, unknown>; pick: ScoredPick }> = []
    const tier2Picks: Array<{ fixture: Record<string, unknown>; pick: ScoredPick }> = []

    for (let i = 0; i < Math.min(fixtures.length, 80); i += BATCH) {
      const batch = (fixtures as Record<string, unknown>[]).slice(i, i + BATCH)
      const results = await Promise.all(batch.map(async f => {
        const detail = await fetchEventDetail(f.id as number)
        if (!detail) return null
        const candidates = scorePicks(f, detail, riskLevel as 'low' | 'medium' | 'high')
        const best = selectBestPick(candidates, riskLevel as 'low' | 'medium' | 'high')
        if (!best) return null
        return { fixture: f, pick: best }
      }))
      for (const r of results) {
        if (!r) continue
        if (r.pick.tier === 1) tier1Picks.push(r)
        else tier2Picks.push(r)
      }
    }

    // Build accumulator prioritising quantity of safe Tier 1 picks
    const allPicks = [...tier1Picks, ...tier2Picks]
    const selected = buildAccumulator(allPicks, targetOdds, riskLevel as 'low' | 'medium' | 'high')

    const tier1Selected = selected.filter(s => s.pick.tier === 1)
    const tier2Selected = selected.filter(s => s.pick.tier === 2)
    const totalOdds = selected.reduce((acc, s) => acc * s.pick.estimatedOdds, 1)

    // Format output
    const formatPick = (s: { fixture: Record<string, unknown>; pick: ScoredPick }, tier: number) => ({
      tier,
      homeTeam: s.fixture.home_team as string,
      awayTeam: s.fixture.away_team as string,
      league: (s.fixture.league as Record<string, unknown>)?.name as string || '',
      startTime: s.fixture.event_date as string || '',
      pick: s.pick.pick,
      market: s.pick.market,
      odds: s.pick.estimatedOdds,
      confidence: Math.round(s.pick.confidence),
      reason: s.pick.reason,
    })

    let summary = `Built ${selected.length}-leg accumulator at ${totalOdds.toFixed(2)} odds (target: ${targetOdds}). ${tier1Selected.length} BSD-verified picks, ${tier2Selected.length} AI-estimated picks.`
    try {
      const sc = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Write short punter-friendly 2-sentence summaries. Nigerian casual tone. No markdown, no team names.' },
          { role: 'user', content: `Built ${selected.length} game accumulator at ${totalOdds.toFixed(2)} odds targeting ${targetOdds}x. Risk level: ${riskLevel}. ${tier1Selected.length} data-verified picks. Summarise for punter.` }
        ],
        temperature: 0.5, max_tokens: 80,
      })
      summary = sc.choices[0]?.message?.content || summary
    } catch { }

    if (hasFreeTrials && !user.isAdmin) {
      await incrementFreeBuilderUsed(user.id)
    }

    return res.status(200).json({
      tier1: tier1Selected.map(s => formatPick(s, 1)),
      tier2: tier2Selected.map(s => formatPick(s, 2)),
      totalOdds: parseFloat(totalOdds.toFixed(2)),
      targetOdds, riskLevel, dateRange,
      fixturesAnalysed: Math.min(fixtures.length, 80),
      summary,
    })
  } catch (err) {
    console.error('[builder] error:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to build accumulator' })
  }
}