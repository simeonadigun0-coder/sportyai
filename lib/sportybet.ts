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
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en',
  'Origin': 'https://www.sportybet.com',
  'Referer': 'https://www.sportybet.com/ng/',
  'Clientid': 'web',
}

export async function decodeBookingCode(shareCode: string): Promise<SportyBetSlip> {
  const cleanCode = shareCode.toUpperCase().trim()
  const url = `https://www.sportybet.com/api/ng/orders/share/${cleanCode}?_t=${Date.now()}`

  const res = await fetch(url, { headers: HEADERS })

  if (!res.ok) {
    throw new Error(`SportyBet API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (!data || data.bizCode !== 10000) {
    throw new Error(data?.message || 'Invalid booking code or code not found')
  }

  // Games are in data.outcomes
  const outcomes: unknown[] = data.data?.outcomes || []

  if (!outcomes.length) {
    throw new Error('No games found in this booking code')
  }

  // Selections have the odds and picks
  const selections: unknown[] = data.data?.ticket?.selections || []

  const games: SportyBetGame[] = outcomes.map((item: unknown, index: number) => {
    const g = item as Record<string, unknown>
    const sel = (selections[index] || {}) as Record<string, unknown>

    const sport = g.sport as Record<string, unknown>
    const sportName = (sport?.name as string) || 'Football'
    const category = sport?.category as Record<string, unknown>
    const tournament = category?.tournament as Record<string, unknown>
    const league = (tournament?.name as string) || ''

    // Get odds from outcomes markets
    const markets = (g.markets as unknown[]) || []
    let odds = 1
    let pick = ''
    let market = '1X2'

    if (markets.length > 0) {
      const firstMarket = markets[0] as Record<string, unknown>
      market = (firstMarket.name as string) || '1X2'
      const outcomes2 = (firstMarket.outcomes as unknown[]) || []
      if (outcomes2.length > 0) {
        const outcomeId = sel.outcomeId as string
        const matchedOutcome = outcomes2.find((o: unknown) => {
          const oc = o as Record<string, unknown>
          return String(oc.id) === String(outcomeId)
        }) as Record<string, unknown> | undefined

        if (matchedOutcome) {
          odds = parseFloat(String(matchedOutcome.odds || 1))
          pick = (matchedOutcome.name as string) || ''
        } else {
          const firstOutcome = outcomes2[0] as Record<string, unknown>
          odds = parseFloat(String(firstOutcome.odds || 1))
          pick = (firstOutcome.name as string) || ''
        }
      }
    }

    const kickoffTime = String(g.estimateStartTime || '')

    return {
      eventId: String(g.eventId || g.gameId || index),
      homeTeam: (g.homeTeamName as string) || 'Home',
      awayTeam: (g.awayTeamName as string) || 'Away',
      market,
      pick,
      odds,
      kickoffTime,
      league,
      sport: sportName,
    }
  })

  // Use displayTotalOdds from the response directly
  const totalOdds = parseFloat(String(data.data?.ticket?.displayTotalOdds || 
    games.reduce((acc, g) => acc * g.odds, 1)))

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
    ticket: {
      selections: games.map(g => ({
        eventId: g.eventId,
        marketId: '1',
        outcomeId: '1',
        productId: 3,
        sportId: 'sr:sport:1',
      })),
      orderType: 2,
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Failed to create booking code: ${res.status}`)

  const data = await res.json()

  if (!data || data.bizCode !== 10000) {
    throw new Error(data?.message || 'Failed to generate new booking code')
  }

  return data.data?.shareCode || data.data?.code || ''
}