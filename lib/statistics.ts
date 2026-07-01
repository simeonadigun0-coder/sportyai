// lib/statistics.ts
// Module 3 — Statistics Service
// FIXED: BSD sends prob_home/prob_draw/prob_away as percentages (e.g. 63.5 = 63.5%)
// Removed erroneous * 100 multiplication that was causing 6350% display bugs

import { prisma } from './db/prisma'

const BSD_V2_BASE = 'https://sports.bzzoiro.com/api/v2'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = {
  'Authorization': `Token ${BSD_TOKEN}`,
  'Content-Type': 'application/json',
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ])
}

// ─── BSD V2 RESPONSE TYPES ──────────────────────────────────────────────────

interface BSDPrediction {
  id: number
  markets: {
    match_result: {
      prob_home: number   // already a percentage e.g. 63.5 means 63.5%
      prob_draw: number
      prob_away: number
      predicted: string
    }
    expected_goals: {
      home: number
      away: number
    }
    over_under: {
      prob_over_15: number  // decimal e.g. 0.75 means 75%
      prob_over_25: number
      prob_over_35: number
    }
    btts: {
      prob_yes: number | null  // decimal e.g. 0.60 means 60%
    }
    score: {
      most_likely: string
    }
  }
}

interface BSDHeadToHead {
  total_matches: number
  home_wins: number
  draws: number
  away_wins: number
  home_goals: number
  away_goals: number
  avg_total_goals: number
  home_win_rate: number
  away_win_rate: number
  recent_matches?: Array<{ home_goals?: number; away_goals?: number }>
}

interface BSDEventDetail {
  id: number
  home_team: string
  away_team: string
  head_to_head: BSDHeadToHead | null
}

interface BSDOddsComparison {
  match_winner?: {
    home?: number
    draw?: number
    away?: number
  }
}

interface BSDTeamFixture {
  id: number
  home_team_id: number
  away_team_id: number
  home_score: number | null
  away_score: number | null
  status: string
  event_date: string
}

// ─── FETCH EVENT DETAIL ──────────────────────────────────────────────────────

async function fetchEventDetail(bsdEventId: string): Promise<BSDEventDetail | null> {
  try {
    const res = await withTimeout(
      fetch(`${BSD_V2_BASE}/events/${bsdEventId}/`, { headers: bsdHeaders, signal: AbortSignal.timeout(7000) }),
      7000, null as unknown as Response
    )
    if (!res || !res.ok) return null
    return await res.json()
  } catch { return null }
}

// ─── FETCH PREDICTION ────────────────────────────────────────────────────────

async function fetchPrediction(bsdEventId: string): Promise<BSDPrediction | null> {
  try {
    const res = await withTimeout(
      fetch(`${BSD_V2_BASE}/events/${bsdEventId}/prediction/`, { headers: bsdHeaders, signal: AbortSignal.timeout(7000) }),
      7000, null as unknown as Response
    )
    if (!res || !res.ok) return null
    return await res.json()
  } catch { return null }
}

// ─── FETCH ODDS COMPARISON ───────────────────────────────────────────────────

async function fetchOdds(bsdEventId: string): Promise<BSDOddsComparison | null> {
  try {
    const res = await withTimeout(
      fetch(`${BSD_V2_BASE}/events/${bsdEventId}/odds/comparison/`, { headers: bsdHeaders, signal: AbortSignal.timeout(7000) }),
      7000, null as unknown as Response
    )
    if (!res || !res.ok) return null
    return await res.json()
  } catch { return null }
}

// ─── FETCH TEAM FORM ─────────────────────────────────────────────────────────

async function fetchTeamForm(teamId: string): Promise<{
  formString: string
  wins: number
  draws: number
  losses: number
  goalsScored: number
  goalsConceded: number
}> {
  const empty = { formString: '', wins: 0, draws: 0, losses: 0, goalsScored: 0, goalsConceded: 0 }
  try {
    const dateTo = new Date().toISOString().split('T')[0]
    const dateFrom = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const res = await withTimeout(
      fetch(`${BSD_V2_BASE}/teams/${teamId}/fixtures/?date_from=${dateFrom}&date_to=${dateTo}&status=finished&limit=10`, {
        headers: bsdHeaders, signal: AbortSignal.timeout(7000),
      }),
      7000, null as unknown as Response
    )
    if (!res || !res.ok) return empty
    const data = await res.json()
    const fixtures: BSDTeamFixture[] = (data.results || []).slice(0, 5)

    let wins = 0, draws = 0, losses = 0, goalsScored = 0, goalsConceded = 0
    const formChars: string[] = []

    for (const f of fixtures) {
      const isHome = String(f.home_team_id) === teamId
      const myScore = isHome ? f.home_score : f.away_score
      const oppScore = isHome ? f.away_score : f.home_score
      if (myScore === null || oppScore === null) continue
      goalsScored += myScore
      goalsConceded += oppScore
      if (myScore > oppScore) { wins++; formChars.push('W') }
      else if (myScore < oppScore) { losses++; formChars.push('L') }
      else { draws++; formChars.push('D') }
    }

    return { formString: formChars.join(''), wins, draws, losses, goalsScored, goalsConceded }
  } catch { return empty }
}

// ─── MAIN STATS FETCH AND STORE ──────────────────────────────────────────────

export async function fetchAndStoreStatistics(
  fixtureDbId: string,
  bsdEventId: string,
  homeTeamId: string,
  awayTeamId: string
): Promise<boolean> {
  try {
    const [eventDetail, prediction, odds, homeForm, awayForm] = await Promise.all([
      fetchEventDetail(bsdEventId),
      fetchPrediction(bsdEventId),
      fetchOdds(bsdEventId),
      fetchTeamForm(homeTeamId),
      fetchTeamForm(awayTeamId),
    ])

    // Bail if no prediction data — don't write zero rows
    if (!prediction) {
      console.log(`[statistics] No BSD prediction data for event ${bsdEventId}`)
      return false
    }

    const h2h = eventDetail?.head_to_head
    const matchResult = prediction.markets?.match_result
    const overUnder = prediction.markets?.over_under
    const btts = prediction.markets?.btts

    const homeGames = homeForm.wins + homeForm.draws + homeForm.losses || 1
    const awayGames = awayForm.wins + awayForm.draws + awayForm.losses || 1

    const oddsHome = odds?.match_winner?.home || null
    const oddsDraw = odds?.match_winner?.draw || null
    const oddsAway = odds?.match_winner?.away || null

    // FIX: BSD sends prob_home/draw/away as percentages (e.g. 63.5 = 63.5%)
    // Do NOT multiply by 100 — store as-is
    const probHome = matchResult ? parseFloat(matchResult.prob_home.toFixed(1)) : 0
    const probDraw = matchResult ? parseFloat(matchResult.prob_draw.toFixed(1)) : 0
    const probAway = matchResult ? parseFloat(matchResult.prob_away.toFixed(1)) : 0

    // over/under and btts rates come as decimals (0.75 = 75%) — store as decimals for confidence.ts
    const over15Rate = overUnder ? overUnder.prob_over_15 : 0
    const over25Rate = overUnder ? overUnder.prob_over_25 : 0
    const bttsRate = btts?.prob_yes ?? 0

    const data = {
      homeFormString: homeForm.formString || null,
      homeWins: homeForm.wins,
      homeDraws: homeForm.draws,
      homeLosses: homeForm.losses,
      homeGoalsScored: homeForm.goalsScored,
      homeGoalsConceded: homeForm.goalsConceded,
      homeAvgScored: parseFloat((homeForm.goalsScored / homeGames).toFixed(2)),
      homeAvgConceded: parseFloat((homeForm.goalsConceded / homeGames).toFixed(2)),
      awayFormString: awayForm.formString || null,
      awayWins: awayForm.wins,
      awayDraws: awayForm.draws,
      awayLosses: awayForm.losses,
      awayGoalsScored: awayForm.goalsScored,
      awayGoalsConceded: awayForm.goalsConceded,
      awayAvgScored: parseFloat((awayForm.goalsScored / awayGames).toFixed(2)),
      awayAvgConceded: parseFloat((awayForm.goalsConceded / awayGames).toFixed(2)),
      probHome,
      probDraw,
      probAway,
      predictedResult: matchResult?.predicted || null,
      over15Rate,
      over25Rate,
      bttsRate,
      xGHome: prediction.markets?.expected_goals?.home ?? null,
      xGAway: prediction.markets?.expected_goals?.away ?? null,
      homeInjuredCount: 0,
      awayInjuredCount: 0,
      oddsHome,
      oddsDraw,
      oddsAway,
      dataSource: 'BSD_V2',
      updatedAt: new Date(),
    }

    await prisma.matchStatistics.upsert({
      where: { fixtureId: fixtureDbId },
      update: data,
      create: { fixtureId: fixtureDbId, ...data },
    })

    if (h2h && h2h.total_matches > 0) {
      const h2hData = {
        totalMeetings: h2h.total_matches,
        homeWins: h2h.home_wins,
        awayWins: h2h.away_wins,
        draws: h2h.draws,
        totalGoals: h2h.home_goals + h2h.away_goals,
        avgGoalsPerGame: h2h.avg_total_goals,
        homeWinRate: h2h.home_win_rate,
        awayWinRate: h2h.away_win_rate,
        drawRate: h2h.total_matches > 0 ? parseFloat((h2h.draws / h2h.total_matches).toFixed(2)) : 0,
        updatedAt: new Date(),
      }
      await prisma.h2HRecord.upsert({
        where: { homeTeamId_awayTeamId: { homeTeamId, awayTeamId } },
        update: h2hData,
        create: { homeTeamId, awayTeamId, ...h2hData },
      })
    }

    console.log(`[statistics] ✅ Stored BSD v2 stats for event ${bsdEventId}`)
    return true
  } catch (err) {
    console.error(`[statistics] Failed for event ${bsdEventId}:`, err)
    return false
  }
}

// ─── BATCH FETCH FOR UPCOMING FIXTURES ───────────────────────────────────────

export async function fetchStatisticsForUpcomingFixtures(): Promise<{
  total: number
  success: number
  failed: number
}> {
  const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000)

  const fixtures = await prisma.fixture.findMany({
    where: {
      matchDate: { lte: tomorrow },
      status: 'UPCOMING',
      statistics: null,
    },
    take: 50,
  })

  let success = 0
  let failed = 0

  for (const fixture of fixtures) {
    const isBSDFixture = !fixture.fixtureId.startsWith('espn_')
    if (!isBSDFixture) { failed++; continue }

    const ok = await fetchAndStoreStatistics(
      fixture.id,
      fixture.fixtureId,
      fixture.homeTeamId,
      fixture.awayTeamId
    )
    if (ok) success++
    else failed++
    await new Promise(r => setTimeout(r, 250))
  }

  console.log(`[statistics] Batch complete — ${success} success, ${failed} failed`)
  return { total: fixtures.length, success, failed }
}

// ─── GET STATS FOR A FIXTURE ──────────────────────────────────────────────────

export async function getStatisticsForFixture(fixtureId: string) {
  return prisma.matchStatistics.findUnique({ where: { fixtureId } })
}

export async function getH2HRecord(homeTeamId: string, awayTeamId: string) {
  return prisma.h2HRecord.findUnique({
    where: { homeTeamId_awayTeamId: { homeTeamId, awayTeamId } },
  })
}

// ─── TEAM-NAME SEARCH FALLBACK ───────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

function teamsMatch(a: string, b: string, c: string, d: string): boolean {
  const fw = (s: string) => normalize(s).split(' ')[0]
  return normalize(a).includes(fw(c)) && normalize(b).includes(fw(d))
}

async function findBSDEventIdByTeams(homeTeam: string, awayTeam: string): Promise<string | null> {
  try {
    const yesterday = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
    const next2w = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    const searchTerms = [homeTeam, homeTeam.split(' ')[0], awayTeam]

    for (const term of searchTerms) {
      const res = await withTimeout(
        fetch(`${BSD_V2_BASE}/events/?team_name=${encodeURIComponent(term)}&date_from=${yesterday}&date_to=${next2w}&limit=20`,
          { headers: bsdHeaders, signal: AbortSignal.timeout(6000) }),
        6000, null as unknown as Response
      )
      if (!res || !res.ok) continue
      const data = await res.json()
      const events = data.results || []
      const match = events.find((e: { home_team?: string; away_team?: string }) =>
        teamsMatch(e.home_team || '', e.away_team || '', homeTeam, awayTeam)
      )
      if (match) return String(match.id)
    }
  } catch (err) {
    console.error('[statistics] BSD team search error:', err)
  }
  return null
}

export async function fetchStatsByTeamSearch(
  fixtureDbId: string,
  homeTeam: string,
  awayTeam: string,
  homeTeamId: string,
  awayTeamId: string
): Promise<boolean> {
  const bsdEventId = await findBSDEventIdByTeams(homeTeam, awayTeam)
  if (!bsdEventId) {
    console.log(`[statistics] No BSD event found for ${homeTeam} vs ${awayTeam}`)
    return false
  }

  const [eventDetail, prediction, odds] = await Promise.all([
    fetchEventDetail(bsdEventId),
    fetchPrediction(bsdEventId),
    fetchOdds(bsdEventId),
  ])

  if (!prediction) {
    console.log(`[statistics] No prediction data for BSD event ${bsdEventId}`)
    return false
  }

  const h2h = eventDetail?.head_to_head
  const matchResult = prediction.markets?.match_result
  const overUnder = prediction.markets?.over_under
  const btts = prediction.markets?.btts

  const oddsHome = odds?.match_winner?.home || null
  const oddsDraw = odds?.match_winner?.draw || null
  const oddsAway = odds?.match_winner?.away || null

  // FIX: BSD sends prob_home/draw/away as percentages — do NOT multiply by 100
  const probHome = matchResult ? parseFloat(matchResult.prob_home.toFixed(1)) : 0
  const probDraw = matchResult ? parseFloat(matchResult.prob_draw.toFixed(1)) : 0
  const probAway = matchResult ? parseFloat(matchResult.prob_away.toFixed(1)) : 0

  try {
    const data = {
      probHome,
      probDraw,
      probAway,
      predictedResult: matchResult?.predicted || null,
      over15Rate: overUnder ? overUnder.prob_over_15 : 0,
      over25Rate: overUnder ? overUnder.prob_over_25 : 0,
      bttsRate: btts?.prob_yes ?? 0,
      xGHome: prediction.markets?.expected_goals?.home ?? null,
      xGAway: prediction.markets?.expected_goals?.away ?? null,
      oddsHome, oddsDraw, oddsAway,
      dataSource: 'BSD_V2_TEAMSEARCH',
      updatedAt: new Date(),
    }

    await prisma.matchStatistics.upsert({
      where: { fixtureId: fixtureDbId },
      update: data,
      create: { fixtureId: fixtureDbId, ...data },
    })

    if (h2h && h2h.total_matches > 0) {
      const h2hData = {
        totalMeetings: h2h.total_matches,
        homeWins: h2h.home_wins,
        awayWins: h2h.away_wins,
        draws: h2h.draws,
        totalGoals: h2h.home_goals + h2h.away_goals,
        avgGoalsPerGame: h2h.avg_total_goals,
        homeWinRate: h2h.home_win_rate,
        awayWinRate: h2h.away_win_rate,
        drawRate: h2h.total_matches > 0 ? parseFloat((h2h.draws / h2h.total_matches).toFixed(2)) : 0,
        updatedAt: new Date(),
      }
      await prisma.h2HRecord.upsert({
        where: { homeTeamId_awayTeamId: { homeTeamId, awayTeamId } },
        update: h2hData,
        create: { homeTeamId, awayTeamId, ...h2hData },
      })
    }

    console.log(`[statistics] ✅ Stored team-search stats for ${homeTeam} vs ${awayTeam}`)
    return true
  } catch (err) {
    console.error('[statistics] Failed to store team-search stats:', err)
    return false
  }
}