// lib/statistics.ts
// Module 3 — Statistics Service
// Fetches deep match stats from BSD and stores in Supabase
// Called by fixture ingestion and on-demand before analysis

import { prisma } from './db/prisma'

const BSD_BASE = 'https://sports.bzzoiro.com/api'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = {
  'Authorization': `Token ${BSD_TOKEN}`,
  'Content-Type': 'application/json',
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

function teamsMatch(a: string, b: string, c: string, d: string): boolean {
  const fw = (s: string) => normalize(s).split(' ')[0]
  return normalize(a).includes(fw(c)) && normalize(b).includes(fw(d))
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ])
}

// ─── BSD RAW FETCH ────────────────────────────────────────────────────────

interface BSDEventDetail {
  id: string | number
  home_team: string
  away_team: string
  home_form?: {
    form_string?: string
    wins?: number
    draws?: number
    losses?: number
    goals_scored_last_n?: number
    goals_conceded_last_n?: number
  }
  away_form?: {
    form_string?: string
    wins?: number
    draws?: number
    losses?: number
    goals_scored_last_n?: number
    goals_conceded_last_n?: number
  }
  head_to_head?: {
    home_wins?: number
    draws?: number
    away_wins?: number
    total_goals?: number
    results?: Array<{
      home_goals?: number
      away_goals?: number
    }>
  }
  prediction?: {
    prob_home_win?: number
    prob_draw?: number
    prob_away_win?: number
    predicted_result?: string
  }
  unavailable_players?: {
    home?: unknown[]
    away?: unknown[]
  }
  odds?: {
    home?: number
    draw?: number
    away?: number
  }
}

async function fetchBSDEventDetail(
  homeTeam: string,
  awayTeam: string
): Promise<BSDEventDetail | null> {
  try {
    const yesterday = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
    const next2w = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

    const searchTerms = [homeTeam, homeTeam.split(' ')[0], awayTeam]

    for (const term of searchTerms) {
      const res = await withTimeout(
        fetch(
          `${BSD_BASE}/events/?team=${encodeURIComponent(term)}&date_from=${yesterday}&date_to=${next2w}&limit=20`,
          { headers: bsdHeaders }
        ),
        6000,
        null as unknown as Response
      )
      if (!res || !res.ok) continue

      const data = await res.json()
      const events = data.results || []

      const match = events.find((e: BSDEventDetail) =>
        teamsMatch(
          e.home_team || '',
          e.away_team || '',
          homeTeam,
          awayTeam
        )
      )

      if (!match) continue

      // Fetch full detail
      const det = await withTimeout(
        fetch(`${BSD_BASE}/events/${match.id}/`, { headers: bsdHeaders }),
        6000,
        null as unknown as Response
      )

      if (det && det.ok) return await det.json()
      return match
    }
  } catch (err) {
    console.error('[statistics] BSD fetch error:', err)
  }
  return null
}

// ─── CALCULATE RATES ──────────────────────────────────────────────────────

function calcOver15Rate(h2h: BSDEventDetail['head_to_head']): number {
  if (!h2h?.results?.length) return 0
  const over15 = h2h.results.filter(r => (r.home_goals || 0) + (r.away_goals || 0) > 1.5).length
  return parseFloat((over15 / h2h.results.length).toFixed(2))
}

function calcOver25Rate(h2h: BSDEventDetail['head_to_head']): number {
  if (!h2h?.results?.length) return 0
  const over25 = h2h.results.filter(r => (r.home_goals || 0) + (r.away_goals || 0) > 2.5).length
  return parseFloat((over25 / h2h.results.length).toFixed(2))
}

function calcBTTSRate(h2h: BSDEventDetail['head_to_head']): number {
  if (!h2h?.results?.length) return 0
  const btts = h2h.results.filter(r => (r.home_goals || 0) > 0 && (r.away_goals || 0) > 0).length
  return parseFloat((btts / h2h.results.length).toFixed(2))
}

// ─── MAIN STATS FETCH ─────────────────────────────────────────────────────

export async function fetchAndStoreStatistics(
  fixtureDbId: string,
  homeTeam: string,
  awayTeam: string,
  homeTeamId: string,
  awayTeamId: string
): Promise<boolean> {
  try {
    const event = await fetchBSDEventDetail(homeTeam, awayTeam)

    if (!event) {
      console.log(`[statistics] No BSD data for ${homeTeam} vs ${awayTeam}`)
      return false
    }

    const hf = event.home_form
    const af = event.away_form
    const h2h = event.head_to_head
    const pred = event.prediction
    const unavail = event.unavailable_players

    // Form calculations
    const homeWins = Number(hf?.wins || 0)
    const homeDraws = Number(hf?.draws || 0)
    const homeLosses = Number(hf?.losses || 0)
    const homeGames = homeWins + homeDraws + homeLosses || 1
    const homeScored = Number(hf?.goals_scored_last_n || 0)
    const homeConceded = Number(hf?.goals_conceded_last_n || 0)

    const awayWins = Number(af?.wins || 0)
    const awayDraws = Number(af?.draws || 0)
    const awayLosses = Number(af?.losses || 0)
    const awayGames = awayWins + awayDraws + awayLosses || 1
    const awayScored = Number(af?.goals_scored_last_n || 0)
    const awayConceded = Number(af?.goals_conceded_last_n || 0)

    // H2H calculations
    const h2hHW = Number(h2h?.home_wins || 0)
    const h2hD = Number(h2h?.draws || 0)
    const h2hAW = Number(h2h?.away_wins || 0)
    const h2hTotal = h2hHW + h2hD + h2hAW || 1
    const h2hGoals = Number(h2h?.total_goals || 0)

    // Goal trend rates
    const over15Rate = calcOver15Rate(h2h)
    const over25Rate = calcOver25Rate(h2h)
    const bttsRate = calcBTTSRate(h2h)

    // Upsert MatchStatistics
    await prisma.matchStatistics.upsert({
      where: { fixtureId: fixtureDbId },
      update: {
        homeFormString: hf?.form_string || null,
        homeWins,
        homeDraws,
        homeLosses,
        homeGoalsScored: homeScored,
        homeGoalsConceded: homeConceded,
        homeAvgScored: parseFloat((homeScored / homeGames).toFixed(2)),
        homeAvgConceded: parseFloat((homeConceded / homeGames).toFixed(2)),
        awayFormString: af?.form_string || null,
        awayWins,
        awayDraws,
        awayLosses,
        awayGoalsScored: awayScored,
        awayGoalsConceded: awayConceded,
        awayAvgScored: parseFloat((awayScored / awayGames).toFixed(2)),
        awayAvgConceded: parseFloat((awayConceded / awayGames).toFixed(2)),
        probHome: Number(pred?.prob_home_win || 0),
        probDraw: Number(pred?.prob_draw || 0),
        probAway: Number(pred?.prob_away_win || 0),
        predictedResult: pred?.predicted_result || null,
        over15Rate,
        over25Rate,
        bttsRate,
        homeInjuredCount: (unavail?.home || []).length,
        awayInjuredCount: (unavail?.away || []).length,
        oddsHome: event.odds?.home || null,
        oddsDraw: event.odds?.draw || null,
        oddsAway: event.odds?.away || null,
        updatedAt: new Date(),
      },
      create: {
        fixtureId: fixtureDbId,
        homeFormString: hf?.form_string || null,
        homeWins,
        homeDraws,
        homeLosses,
        homeGoalsScored: homeScored,
        homeGoalsConceded: homeConceded,
        homeAvgScored: parseFloat((homeScored / homeGames).toFixed(2)),
        homeAvgConceded: parseFloat((homeConceded / homeGames).toFixed(2)),
        awayFormString: af?.form_string || null,
        awayWins,
        awayDraws,
        awayLosses,
        awayGoalsScored: awayScored,
        awayGoalsConceded: awayConceded,
        awayAvgScored: parseFloat((awayScored / awayGames).toFixed(2)),
        awayAvgConceded: parseFloat((awayConceded / awayGames).toFixed(2)),
        probHome: Number(pred?.prob_home_win || 0),
        probDraw: Number(pred?.prob_draw || 0),
        probAway: Number(pred?.prob_away_win || 0),
        predictedResult: pred?.predicted_result || null,
        over15Rate,
        over25Rate,
        bttsRate,
        homeInjuredCount: (unavail?.home || []).length,
        awayInjuredCount: (unavail?.away || []).length,
        oddsHome: event.odds?.home || null,
        oddsDraw: event.odds?.draw || null,
        oddsAway: event.odds?.away || null,
      },
    })

    // Upsert H2H record
    await prisma.h2HRecord.upsert({
      where: {
        homeTeamId_awayTeamId: { homeTeamId, awayTeamId },
      },
      update: {
        totalMeetings: h2hTotal,
        homeWins: h2hHW,
        awayWins: h2hAW,
        draws: h2hD,
        totalGoals: h2hGoals,
        avgGoalsPerGame: parseFloat((h2hGoals / h2hTotal).toFixed(2)),
        homeWinRate: parseFloat((h2hHW / h2hTotal).toFixed(2)),
        awayWinRate: parseFloat((h2hAW / h2hTotal).toFixed(2)),
        drawRate: parseFloat((h2hD / h2hTotal).toFixed(2)),
        updatedAt: new Date(),
      },
      create: {
        homeTeamId,
        awayTeamId,
        totalMeetings: h2hTotal,
        homeWins: h2hHW,
        awayWins: h2hAW,
        draws: h2hD,
        totalGoals: h2hGoals,
        avgGoalsPerGame: parseFloat((h2hGoals / h2hTotal).toFixed(2)),
        homeWinRate: parseFloat((h2hHW / h2hTotal).toFixed(2)),
        awayWinRate: parseFloat((h2hAW / h2hTotal).toFixed(2)),
        drawRate: parseFloat((h2hD / h2hTotal).toFixed(2)),
      },
    })

    console.log(`[statistics] ✅ Stored stats for ${homeTeam} vs ${awayTeam}`)
    return true
  } catch (err) {
    console.error(`[statistics] Failed for ${homeTeam} vs ${awayTeam}:`, err)
    return false
  }
}

// ─── BATCH FETCH FOR UPCOMING FIXTURES ───────────────────────────────────
// Fetches stats for all upcoming fixtures that don't have stats yet

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
      statistics: null, // only fixtures without stats
    },
    take: 50, // batch limit
  })

  let success = 0
  let failed = 0

  for (const fixture of fixtures) {
    const ok = await fetchAndStoreStatistics(
      fixture.id,
      fixture.homeTeam,
      fixture.awayTeam,
      fixture.homeTeamId,
      fixture.awayTeamId
    )
    if (ok) success++
    else failed++

    // Rate limit — BSD free tier
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`[statistics] Batch complete — ${success} success, ${failed} failed`)
  return { total: fixtures.length, success, failed }
}

// ─── GET STATS FOR A FIXTURE ──────────────────────────────────────────────

export async function getStatisticsForFixture(fixtureId: string) {
  return prisma.matchStatistics.findUnique({
    where: { fixtureId },
  })
}

export async function getH2HRecord(homeTeamId: string, awayTeamId: string) {
  return prisma.h2HRecord.findUnique({
    where: {
      homeTeamId_awayTeamId: { homeTeamId, awayTeamId },
    },
  })
}