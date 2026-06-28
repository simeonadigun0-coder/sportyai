// lib/fixtures.ts
// Module 2 — Fixture Ingestion Service
// Source: TheSportsDB (free, no API key required)

import { prisma } from './db/prisma'

const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3'

const TRACKED_LEAGUES = [
  // ── ENGLAND ──────────────────────────────────────────────────────────
  { id: '4328', name: 'Premier League', country: 'England' },
  { id: '4329', name: 'Championship', country: 'England' },
  { id: '4330', name: 'League One', country: 'England' },
  { id: '4331', name: 'League Two', country: 'England' },
  { id: '4667', name: 'FA Cup', country: 'England' },
  { id: '4668', name: 'EFL Cup', country: 'England' },

  // ── SPAIN ─────────────────────────────────────────────────────────────
  { id: '4335', name: 'La Liga', country: 'Spain' },
  { id: '4336', name: 'La Liga 2', country: 'Spain' },

  // ── GERMANY ───────────────────────────────────────────────────────────
  { id: '4331', name: 'Bundesliga', country: 'Germany' },
  { id: '4332', name: 'Bundesliga 2', country: 'Germany' },

  // ── ITALY ─────────────────────────────────────────────────────────────
  { id: '4332', name: 'Serie A', country: 'Italy' },
  { id: '4333', name: 'Serie B', country: 'Italy' },

  // ── FRANCE ────────────────────────────────────────────────────────────
  { id: '4334', name: 'Ligue 1', country: 'France' },
  { id: '4338', name: 'Ligue 2', country: 'France' },

  // ── EUROPE ────────────────────────────────────────────────────────────
  { id: '4346', name: 'Champions League', country: 'Europe' },
  { id: '4375', name: 'Europa League', country: 'Europe' },
  { id: '4417', name: 'Europa Conference League', country: 'Europe' },

  // ── NETHERLANDS ───────────────────────────────────────────────────────
  { id: '4337', name: 'Eredivisie', country: 'Netherlands' },

  // ── PORTUGAL ──────────────────────────────────────────────────────────
  { id: '4344', name: 'Primeira Liga', country: 'Portugal' },

  // ── BELGIUM ───────────────────────────────────────────────────────────
  { id: '4397', name: 'Pro League', country: 'Belgium' },

  // ── TURKEY ────────────────────────────────────────────────────────────
  { id: '4340', name: 'Super Lig', country: 'Turkey' },

  // ── GREECE ────────────────────────────────────────────────────────────
  { id: '4339', name: 'Super League', country: 'Greece' },

  // ── SCOTLAND ──────────────────────────────────────────────────────────
  { id: '4330', name: 'Scottish Premiership', country: 'Scotland' },

  // ── RUSSIA ────────────────────────────────────────────────────────────
  { id: '4356', name: 'Russian Premier League', country: 'Russia' },

  // ── UKRAINE ───────────────────────────────────────────────────────────
  { id: '4357', name: 'Ukrainian Premier League', country: 'Ukraine' },

  // ── AUSTRIA ───────────────────────────────────────────────────────────
  { id: '4396', name: 'Austrian Bundesliga', country: 'Austria' },

  // ── SWITZERLAND ───────────────────────────────────────────────────────
  { id: '4398', name: 'Swiss Super League', country: 'Switzerland' },

  // ── DENMARK ───────────────────────────────────────────────────────────
  { id: '4341', name: 'Superliga', country: 'Denmark' },

  // ── SWEDEN ────────────────────────────────────────────────────────────
  { id: '4342', name: 'Allsvenskan', country: 'Sweden' },

  // ── NORWAY ────────────────────────────────────────────────────────────
  { id: '4343', name: 'Eliteserien', country: 'Norway' },

  // ── POLAND ────────────────────────────────────────────────────────────
  { id: '4406', name: 'Ekstraklasa', country: 'Poland' },

  // ── CZECH REPUBLIC ────────────────────────────────────────────────────
  { id: '4407', name: 'Czech First League', country: 'Czech Republic' },

  // ── CROATIA ───────────────────────────────────────────────────────────
  { id: '4408', name: 'Croatian Football League', country: 'Croatia' },

  // ── SERBIA ────────────────────────────────────────────────────────────
  { id: '4409', name: 'Serbian SuperLiga', country: 'Serbia' },

  // ── ROMANIA ───────────────────────────────────────────────────────────
  { id: '4410', name: 'Liga I', country: 'Romania' },

  // ── AFRICA ────────────────────────────────────────────────────────────
  { id: '4480', name: 'NPFL', country: 'Nigeria' },
  { id: '4482', name: 'Ghana Premier League', country: 'Ghana' },
  { id: '4484', name: 'South African PSL', country: 'South Africa' },
  { id: '4485', name: 'Egyptian Premier League', country: 'Egypt' },
  { id: '4486', name: 'Moroccan Botola Pro', country: 'Morocco' },
  { id: '4487', name: 'Tunisian Ligue 1', country: 'Tunisia' },
  { id: '4488', name: 'Algerian Ligue Professionnelle 1', country: 'Algeria' },
  { id: '4489', name: 'Kenyan Premier League', country: 'Kenya' },
  { id: '4490', name: 'CAF Champions League', country: 'Africa' },
  { id: '4491', name: 'CAF Confederation Cup', country: 'Africa' },
  { id: '4573', name: 'Tanzanian Premier League', country: 'Tanzania' },
  { id: '4574', name: 'Ugandan Premier League', country: 'Uganda' },
  { id: '4575', name: 'Zambian Super League', country: 'Zambia' },
  { id: '4576', name: 'Zimbabwean Premier Soccer League', country: 'Zimbabwe' },
  { id: '4577', name: 'Ethiopian Premier League', country: 'Ethiopia' },
  { id: '4578', name: 'Senegalese Ligue 1', country: 'Senegal' },
  { id: '4579', name: 'Cameroonian MTN Elite One', country: 'Cameroon' },
  { id: '4580', name: 'Ivorian Ligue 1', country: 'Ivory Coast' },

  // ── SOUTH AMERICA ─────────────────────────────────────────────────────
  { id: '4351', name: 'Brazilian Serie A', country: 'Brazil' },
  { id: '4352', name: 'Brazilian Serie B', country: 'Brazil' },
  { id: '4353', name: 'Argentine Primera Division', country: 'Argentina' },
  { id: '4354', name: 'Colombian Primera A', country: 'Colombia' },
  { id: '4355', name: 'Chilean Primera Division', country: 'Chile' },
  { id: '4381', name: 'Copa Libertadores', country: 'South America' },
  { id: '4382', name: 'Copa Sudamericana', country: 'South America' },
  { id: '4422', name: 'Peruvian Primera Division', country: 'Peru' },
  { id: '4423', name: 'Ecuadorian Serie A', country: 'Ecuador' },
  { id: '4424', name: 'Uruguayan Primera Division', country: 'Uruguay' },
  { id: '4425', name: 'Venezuelan Primera Division', country: 'Venezuela' },

  // ── NORTH AMERICA ─────────────────────────────────────────────────────
  { id: '4346', name: 'MLS', country: 'USA' },
  { id: '4347', name: 'Liga MX', country: 'Mexico' },
  { id: '4430', name: 'Canadian Premier League', country: 'Canada' },

  // ── ASIA ──────────────────────────────────────────────────────────────
  { id: '4358', name: 'Saudi Pro League', country: 'Saudi Arabia' },
  { id: '4359', name: 'UAE Pro League', country: 'UAE' },
  { id: '4360', name: 'Qatar Stars League', country: 'Qatar' },
  { id: '4361', name: 'J1 League', country: 'Japan' },
  { id: '4362', name: 'K League 1', country: 'South Korea' },
  { id: '4363', name: 'Chinese Super League', country: 'China' },
  { id: '4364', name: 'Indian Super League', country: 'India' },
  { id: '4365', name: 'AFC Champions League', country: 'Asia' },
  { id: '4431', name: 'Indonesian Liga 1', country: 'Indonesia' },
  { id: '4432', name: 'Thai League 1', country: 'Thailand' },
  { id: '4433', name: 'Malaysian Super League', country: 'Malaysia' },

  // ── INTERNATIONAL ─────────────────────────────────────────────────────
  { id: '4370', name: 'FIFA World Cup', country: 'International' },
  { id: '4371', name: 'UEFA European Championship', country: 'International' },
  { id: '4372', name: 'Africa Cup of Nations', country: 'International' },
  { id: '4373', name: 'Copa America', country: 'International' },
  { id: '4374', name: 'Nations League', country: 'International' },
]

interface SportsDBEvent {
  idEvent: string
  strHomeTeam: string
  strAwayTeam: string
  idHomeTeam: string
  idAwayTeam: string
  strLeague: string
  idLeague: string
  strCountry: string
  dateEvent: string
  strTime: string
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string
}

function mapStatus(status: string): 'UPCOMING' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED' {
  const s = status?.toLowerCase() || ''
  if (s === 'match finished' || s === 'ft' || s === 'aet' || s === 'pen') return 'FINISHED'
  if (s === 'live' || s === 'in progress' || s === '1h' || s === '2h' || s === 'ht') return 'LIVE'
  if (s === 'postponed') return 'POSTPONED'
  if (s === 'cancelled' || s === 'canceled') return 'CANCELLED'
  return 'UPCOMING'
}

async function fetchFixturesForLeague(leagueId: string, date: string): Promise<SportsDBEvent[]> {
  try {
    const url = `${SPORTSDB_BASE}/eventsday.php?d=${date}&l=${leagueId}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch {
    return []
  }
}

async function upsertFixture(event: SportsDBEvent, leagueName: string, country: string): Promise<void> {
  try {
    const matchDate = new Date(`${event.dateEvent}T${event.strTime || '00:00:00'}`)
    const status = mapStatus(event.strStatus)

    await prisma.fixture.upsert({
      where: { fixtureId: event.idEvent },
      update: {
        status,
        homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : null,
        awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : null,
        updatedAt: new Date(),
      },
      create: {
        fixtureId: event.idEvent,
        homeTeam: event.strHomeTeam,
        awayTeam: event.strAwayTeam,
        homeTeamId: event.idHomeTeam || `home_${event.idEvent}`,
        awayTeamId: event.idAwayTeam || `away_${event.idEvent}`,
        league: leagueName,
        leagueId: event.idLeague,
        country,
        matchDate,
        status,
        homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : null,
        awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : null,
      },
    })
  } catch (err) {
    console.error(`[fixtures] Failed to upsert ${event.strHomeTeam} vs ${event.strAwayTeam}:`, err)
  }
}

export async function ingestFixtures(daysAhead: number = 2): Promise<{
  total: number
  ingested: number
  errors: number
  dates: string[]
}> {
  const dates: string[] = []
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }

  let total = 0
  let ingested = 0
  let errors = 0

  // Deduplicate leagues by ID to avoid duplicate API calls
  const seen = new Set<string>()
  const uniqueLeagues = TRACKED_LEAGUES.filter(l => {
    if (seen.has(l.id)) return false
    seen.add(l.id)
    return true
  })

  for (const date of dates) {
    for (const league of uniqueLeagues) {
      const events = await fetchFixturesForLeague(league.id, date)
      total += events.length

      for (const event of events) {
        try {
          await upsertFixture(event, league.name, league.country)
          ingested++
        } catch {
          errors++
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200))
    }
  }

  console.log(`[fixtures] Ingested ${ingested}/${total} fixtures for dates: ${dates.join(', ')}`)
  return { total, ingested, errors, dates }
}

export async function getUpcomingFixtures(hours: number = 48) {
  const from = new Date()
  const to = new Date(Date.now() + hours * 60 * 60 * 1000)

  return prisma.fixture.findMany({
    where: {
      matchDate: { gte: from, lte: to },
      status: 'UPCOMING',
    },
    orderBy: { matchDate: 'asc' },
    include: { statistics: true },
  })
}

export async function getTodayFixtures() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  return prisma.fixture.findMany({
    where: {
      matchDate: { gte: start, lte: end },
    },
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