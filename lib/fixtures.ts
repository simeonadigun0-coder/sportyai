// lib/fixtures.ts
// Module 2 — Fixture Ingestion Service
// FIXED: WAT timezone (UTC+1, Nigeria/West Africa Time) aware date queries
// All date boundaries now calculated in WAT so "today" and "tomorrow"
// reflect the correct calendar day from Lagos, not UTC server time

import { prisma } from './db/prisma'

const BSD_V2_BASE = 'https://sports.bzzoiro.com/api/v2'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = {
  'Authorization': `Token ${BSD_TOKEN}`,
  'Content-Type': 'application/json',
}

// ─── WAT TIMEZONE HELPERS ────────────────────────────────────────────────────
// WAT = UTC+1 (Nigeria / West Africa Time)
// Vercel servers run on UTC — without this, "tomorrow" at 11pm Lagos
// would resolve to the day after tomorrow in UTC

const WAT_OFFSET_MS = 60 * 60 * 1000 // UTC+1 in milliseconds

function nowInWAT(): Date {
  return new Date(Date.now() + WAT_OFFSET_MS)
}

// Returns the UTC equivalent of the start of a WAT calendar day
// offsetDays=0 → today WAT, offsetDays=1 → tomorrow WAT, etc.
function startOfWATDay(offsetDays: number = 0): Date {
  const wat = nowInWAT()
  wat.setUTCDate(wat.getUTCDate() + offsetDays)
  wat.setUTCHours(0, 0, 0, 0)
  // Convert back to UTC for Prisma/PostgreSQL comparison
  return new Date(wat.getTime() - WAT_OFFSET_MS)
}

// Returns the UTC equivalent of the end of a WAT calendar day
function endOfWATDay(offsetDays: number = 0): Date {
  const wat = nowInWAT()
  wat.setUTCDate(wat.getUTCDate() + offsetDays)
  wat.setUTCHours(23, 59, 59, 999)
  return new Date(wat.getTime() - WAT_OFFSET_MS)
}

// ─── BSD EVENT TYPES ───────────────────────────────────────────────────────

interface BSDLeague {
  id: number
  name: string
  country: string
}

interface BSDEvent {
  id: number
  league_id: number
  season_id: number
  home_team_id: number
  home_team: string
  away_team_id: number
  away_team: string
  event_date: string
  status: string
  home_score: number | null
  away_score: number | null
  round_name: string | null
  group_name: string | null
}

interface BSDEventsResponse {
  count: number
  results: BSDEvent[]
  next: string | null
}

// ─── STATUS MAPPING ─────────────────────────────────────────────────────────

function mapStatus(status: string): 'UPCOMING' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED' {
  const s = (status || '').toLowerCase()
  if (s === 'finished' || s === 'ft' || s === 'aet' || s === 'pen' || s === 'ended') return 'FINISHED'
  if (s === 'live' || s === 'inprogress' || s === '1h' || s === '2h' || s === 'ht' || s === 'in_progress') return 'LIVE'
  if (s === 'postponed') return 'POSTPONED'
  if (s === 'cancelled' || s === 'canceled' || s === 'abandoned') return 'CANCELLED'
  return 'UPCOMING'
}

// ─── FETCH LEAGUES ─────────────────────────────────────────────────────────

let leagueCache: Map<number, BSDLeague> | null = null

async function getLeagueMap(): Promise<Map<number, BSDLeague>> {
  if (leagueCache) return leagueCache
  const map = new Map<number, BSDLeague>()
  try {
    const res = await fetch(`${BSD_V2_BASE}/leagues/?limit=200`, {
      headers: bsdHeaders, signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const data = await res.json()
      const leagues = (data.results || data) as BSDLeague[]
      for (const l of leagues) map.set(l.id, l)
    }
  } catch (err) {
    console.error('[fixtures] Failed to fetch leagues:', err)
  }
  leagueCache = map
  return map
}

// ─── FETCH BSD EVENTS (paginated) ─────────────────────────────────────────

async function fetchBSDEvents(dateFrom: string, dateTo: string): Promise<BSDEvent[]> {
  const allEvents: BSDEvent[] = []
  let offset = 0
  const limit = 200
  let hasMore = true
  let pageGuard = 0

  while (hasMore && pageGuard < 20) {
    try {
      const url = `${BSD_V2_BASE}/events/?date_from=${dateFrom}&date_to=${dateTo}&limit=${limit}&offset=${offset}`
      const res = await fetch(url, { headers: bsdHeaders, signal: AbortSignal.timeout(10000) })
      if (!res.ok) { console.error(`[fixtures] BSD events fetch failed: ${res.status}`); break }
      const data: BSDEventsResponse = await res.json()
      const results = data.results || []
      allEvents.push(...results)
      hasMore = !!data.next && results.length === limit
      offset += limit
      pageGuard++
    } catch (err) {
      console.error('[fixtures] BSD events fetch error:', err)
      break
    }
  }
  return allEvents
}

// ─── UPSERT FIXTURE ─────────────────────────────────────────────────────────

async function upsertFixture(event: BSDEvent, leagueMap: Map<number, BSDLeague>): Promise<void> {
  try {
    const league = leagueMap.get(event.league_id)
    const status = mapStatus(event.status)
    await prisma.fixture.upsert({
      where: { fixtureId: String(event.id) },
      update: { status, homeScore: event.home_score, awayScore: event.away_score, updatedAt: new Date() },
      create: {
        fixtureId: String(event.id),
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        homeTeamId: String(event.home_team_id),
        awayTeamId: String(event.away_team_id),
        league: league?.name || `League ${event.league_id}`,
        leagueId: String(event.league_id),
        country: league?.country || 'Unknown',
        matchDate: new Date(event.event_date),
        status,
        homeScore: event.home_score,
        awayScore: event.away_score,
      },
    })
  } catch (err) {
    console.error(`[fixtures] Failed to upsert ${event.home_team} vs ${event.away_team}:`, err)
  }
}

// ─── MAIN INGESTION ─────────────────────────────────────────────────────────

export async function ingestFixtures(daysAhead: number = 2): Promise<{
  total: number; ingested: number; errors: number; dates: string[]
}> {
  const today = new Date()
  const endDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  const dateFrom = today.toISOString().split('T')[0]
  const dateTo = endDate.toISOString().split('T')[0]

  console.log(`[fixtures] Fetching BSD events from ${dateFrom} to ${dateTo}`)
  const [leagueMap, events] = await Promise.all([getLeagueMap(), fetchBSDEvents(dateFrom, dateTo)])

  let ingested = 0, errors = 0
  for (const event of events) {
    try { await upsertFixture(event, leagueMap); ingested++ }
    catch { errors++ }
  }

  console.log(`[fixtures] Ingested ${ingested}/${events.length} fixtures`)
  return { total: events.length, ingested, errors, dates: [dateFrom, dateTo] }
}

// ─── ESPN FALLBACK ───────────────────────────────────────────────────────────

interface ESPNEvent {
  id: string
  date: string
  name: string
  competitions: Array<{
    competitors: Array<{ homeAway: string; team: { displayName: string } }>
    status: { type: { name: string } }
  }>
}

const ESPN_LEAGUES = [
  { slug: 'eng.1', name: 'Premier League', country: 'England' },
  { slug: 'esp.1', name: 'La Liga', country: 'Spain' },
  { slug: 'ger.1', name: 'Bundesliga', country: 'Germany' },
  { slug: 'ita.1', name: 'Serie A', country: 'Italy' },
  { slug: 'fra.1', name: 'Ligue 1', country: 'France' },
  { slug: 'uefa.champions', name: 'Champions League', country: 'Europe' },
  { slug: 'uefa.europa', name: 'Europa League', country: 'Europe' },
]

async function fetchESPNFixturesForLeague(slug: string, date: string): Promise<ESPNEvent[]> {
  try {
    const formattedDate = date.replace(/-/g, '')
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${formattedDate}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch { return [] }
}

async function upsertESPNFixture(event: ESPNEvent, leagueName: string, country: string): Promise<void> {
  try {
    const comp = event.competitions?.[0]
    if (!comp) return
    const home = comp.competitors.find(c => c.homeAway === 'home')
    const away = comp.competitors.find(c => c.homeAway === 'away')
    if (!home || !away) return
    const espnId = `espn_${event.id}`
    const existing = await prisma.fixture.findFirst({
      where: {
        homeTeam: { contains: home.team.displayName.split(' ')[0], mode: 'insensitive' },
        awayTeam: { contains: away.team.displayName.split(' ')[0], mode: 'insensitive' },
        matchDate: {
          gte: new Date(new Date(event.date).getTime() - 12 * 60 * 60 * 1000),
          lte: new Date(new Date(event.date).getTime() + 12 * 60 * 60 * 1000),
        },
      },
    })
    if (existing) return
    await prisma.fixture.upsert({
      where: { fixtureId: espnId },
      update: { updatedAt: new Date() },
      create: {
        fixtureId: espnId,
        homeTeam: home.team.displayName,
        awayTeam: away.team.displayName,
        homeTeamId: `espn_home_${event.id}`,
        awayTeamId: `espn_away_${event.id}`,
        league: leagueName,
        leagueId: `espn_${leagueName}`,
        country,
        matchDate: new Date(event.date),
        status: 'UPCOMING',
      },
    })
  } catch (err) {
    console.error('[fixtures] ESPN upsert failed:', err)
  }
}

export async function fillGapsWithESPN(daysAhead: number = 2): Promise<{ added: number }> {
  let added = 0
  const dates: string[] = []
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000)
    dates.push(d.toISOString().split('T')[0])
  }
  for (const date of dates) {
    for (const league of ESPN_LEAGUES) {
      const events = await fetchESPNFixturesForLeague(league.slug, date)
      for (const event of events) {
        const before = await prisma.fixture.count()
        await upsertESPNFixture(event, league.name, league.country)
        const after = await prisma.fixture.count()
        if (after > before) added++
      }
      await new Promise(r => setTimeout(r, 150))
    }
  }
  console.log(`[fixtures] ESPN fallback added ${added} gap-fill fixtures`)
  return { added }
}

export async function ingestFixturesWithFallback(daysAhead: number = 2): Promise<{
  bsd: { total: number; ingested: number; errors: number }
  espn: { added: number }
  totalFixtures: number
}> {
  const bsdResult = await ingestFixtures(daysAhead)
  let espnResult = { added: 0 }
  if (bsdResult.ingested < 15) {
    console.log('[fixtures] BSD coverage thin, running ESPN gap-fill...')
    espnResult = await fillGapsWithESPN(daysAhead)
  }
  const totalFixtures = await prisma.fixture.count({
    where: { matchDate: { gte: new Date(), lte: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000) } },
  })
  return { bsd: bsdResult, espn: espnResult, totalFixtures }
}

// ─── QUERY HELPERS — WAT TIMEZONE AWARE ──────────────────────────────────────

// Today's remaining fixtures (from now until end of WAT today)
export async function getTodayFixtures() {
  const now = new Date()           // current UTC moment — excludes already-started games
  const end = endOfWATDay(0)      // end of today in WAT (Lagos time)

  return prisma.fixture.findMany({
    where: { matchDate: { gte: now, lte: end }, status: 'UPCOMING' },
    orderBy: { matchDate: 'asc' },
    include: { statistics: true },
  })
}

// Tomorrow's fixtures (full WAT calendar day)
export async function getTomorrowFixtures() {
  const start = startOfWATDay(1)
  const end = endOfWATDay(1)

  return prisma.fixture.findMany({
    where: { matchDate: { gte: start, lte: end }, status: 'UPCOMING' },
    orderBy: { matchDate: 'asc' },
    include: { statistics: true },
  })
}

// This week's fixtures (today WAT through 6 days ahead)
export async function getThisWeekFixtures() {
  const now = new Date()
  const end = endOfWATDay(6)

  return prisma.fixture.findMany({
    where: { matchDate: { gte: now, lte: end }, status: 'UPCOMING' },
    orderBy: { matchDate: 'asc' },
    include: { statistics: true },
  })
}

// This month's fixtures (today WAT through 29 days ahead)
export async function getThisMonthFixtures() {
  const now = new Date()
  const end = endOfWATDay(29)

  return prisma.fixture.findMany({
    where: { matchDate: { gte: now, lte: end }, status: 'UPCOMING' },
    orderBy: { matchDate: 'asc' },
    include: { statistics: true },
  })
}

// Generic upcoming by hours — used by value bet engine (stays as is)
export async function getUpcomingFixtures(hours: number = 48) {
  const from = new Date()
  const to = new Date(Date.now() + hours * 60 * 60 * 1000)

  return prisma.fixture.findMany({
    where: { matchDate: { gte: from, lte: to }, status: 'UPCOMING' },
    orderBy: { matchDate: 'asc' },
    include: { statistics: true },
  })
}

export async function getFixtureById(fixtureId: string) {
  return prisma.fixture.findUnique({
    where: { fixtureId },
    include: { statistics: true, confidenceScores: true },
  })
}