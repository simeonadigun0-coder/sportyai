export interface SportyBetGame {
  eventId: string
  homeTeam: string
  awayTeam: string
  market: string
  pick: string
  odds: number
  kickoffTime: string
  league: string
  sport: string
}

export interface SportyBetSlip {
  shareCode: string
  totalOdds: number
  games: SportyBetGame[]
  raw: unknown
}

const COUNTRY = process.env.SPORTYBET_COUNTRY || 'ng'
const BASE = `https://www.sportybet.com/api/${COUNTRY}`

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://www.sportybet.com',
  'Referer': `https://www.sportybet.com/${COUNTRY}/`,
}

export async function decodeBookingCode(shareCode: string): Promise<SportyBetSlip> {
  const url = `${BASE}/factsCenter/publicShareCode?shareCode=${shareCode.toUpperCase().trim()}`

  const res = await fetch(url, { headers: HEADERS })

  if (!res.ok) {
    throw new Error(`SportyBet API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (!data || data.bizCode !== 0) {
    throw new Error(data?.message || 'Invalid booking code or code not found')
  }

  const outcomeList: unknown[] = data.data?.betInfoData?.betInfoList || []

  if (!outcomeList.length) {
    throw new Error('No games found in this booking code')
  }

  const games: SportyBetGame[] = outcomeList.map((item: unknown) => {
    const g = item as Record<string, unknown>
    const sport = (g.sport as string) || 'Football'
    const homeTeam = (g.homeTeamName as string) || (g.homeName as string) || 'Home'
    const awayTeam = (g.awayTeamName as string) || (g.awayName as string) || 'Away'
    const market = (g.marketName as string) || (g.bet as string) || '1X2'
    const pick = (g.outcomeName as string) || (g.pick as string) || ''
    const odds = parseFloat(String(g.odds || g.outcomeOdds || 1))
    const kickoffTime = (g.matchTime as string) || (g.kickoffTime as string) || ''
    const league = (g.tournamentName as string) || (g.league as string) || ''
    const eventId = String(g.eventId || g.matchId || g.id || Math.random())

    return { eventId, homeTeam, awayTeam, market, pick, odds, kickoffTime, league, sport }
  })

  const totalOdds = games.reduce((acc, g) => acc * g.odds, 1)

  return { shareCode, totalOdds: parseFloat(totalOdds.toFixed(2)), games, raw: data }
}

export async function createBookingCode(games: SportyBetGame[]): Promise<string> {
  const url = `${BASE}/factsCenter/shareCode`

  const betItems = games.map(g => ({
    eventId: g.eventId,
    marketId: g.market,
    outcomeName: g.pick,
    odds: g.odds,
  }))

  const payload = {
    betInfoList: betItems,
    oddsType: 0,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...HEADERS,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Failed to create booking code: ${res.status}`)
  }

  const data = await res.json()

  if (!data || data.bizCode !== 0) {
    throw new Error(data?.message || 'Failed to generate new booking code')
  }

  return data.data?.shareCode || data.data?.code || data.shareCode
}
