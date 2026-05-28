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

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://www.sportybet.com',
  'Referer': 'https://www.sportybet.com/ng/',
  'Request-Country': 'ng',
}

export async function decodeBookingCode(shareCode: string): Promise<SportyBetSlip> {
  const cleanCode = shareCode.toUpperCase().trim()
  const url = `https://www.sportybet.com/api/ng/orders/share/${cleanCode}?_t=${Date.now()}`

  const res = await fetch(url, { headers: HEADERS })

  if (!res.ok) {
    throw new Error(`SportyBet API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (!data || (data.bizCode !== 0 && data.bizCode !== 10000)) {
    throw new Error(data?.message || 'Invalid booking code or code not found')
  }

  const outcomeList: unknown[] =
    data.data?.betInfoData?.betInfoList ||
    data.data?.orderInfoData?.orderInfo ||
    data.data?.items ||
    data.data?.list ||
    []

  if (!outcomeList.length) {
    throw new Error('No games found in this booking code')
  }

  const games: SportyBetGame[] = outcomeList.map((item: unknown) => {
    const g = item as Record<string, unknown>
    return {
      eventId: String(g.eventId || g.matchId || g.id || Math.random()),
      homeTeam: (g.homeTeamName as string) || (g.homeName as string) || 'Home',
      awayTeam: (g.awayTeamName as string) || (g.awayName as string) || 'Away',
      market: (g.marketName as string) || (g.bet as string) || '1X2',
      pick: (g.outcomeName as string) || (g.pick as string) || '',
      odds: parseFloat(String(g.odds || g.outcomeOdds || 1)),
      kickoffTime: (g.matchTime as string) || (g.kickoffTime as string) || '',
      league: (g.tournamentName as string) || (g.league as string) || '',
      sport: (g.sport as string) || 'Football',
    }
  })

  const totalOdds = games.reduce((acc, g) => acc * g.odds, 1)

  return {
    shareCode: cleanCode,
    totalOdds: parseFloat(totalOdds.toFixed(2)),
    games,
    raw: data,
  }
}

export async function createBookingCode(games: SportyBetGame[]): Promise<string> {
  const url = `https://www.sportybet.com/api/ng/orders/share?_t=${Date.now()}`

  const payload = {
    betInfoList: games.map(g => ({
      eventId: g.eventId,
      marketId: g.market,
      outcomeName: g.pick,
      odds: g.odds,
    })),
    oddsType: 0,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Failed to create booking code: ${res.status}`)

  const data = await res.json()

  if (!data || (data.bizCode !== 0 && data.bizCode !== 10000)) {
    throw new Error(data?.message || 'Failed to generate new booking code')
  }

  return data.data?.shareCode || data.data?.code || data.shareCode
}