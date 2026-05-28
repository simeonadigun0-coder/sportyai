export interface SportyBetGame {
  eventId: string
  homeTeam: string
  awayTeam: string
  market: string
  marketId: string
  outcomeId: string
  specifier: string | null
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
  if (!res.ok) throw new Error(`SportyBet API error: ${res.status}`)

  const data = await res.json()
  if (!data || data.bizCode !== 10000) throw new Error(data?.message || 'Invalid booking code')

  const outcomes: unknown[] = data.data?.outcomes || []
  const selections: unknown[] = data.data?.ticket?.selections || []
  const displayTotalOdds = parseFloat(data.data?.ticket?.displayTotalOdds || '1')

  if (!outcomes.length) throw new Error('No games found in this booking code')

  const games: SportyBetGame[] = outcomes.map((item: unknown, index: number) => {
    const g = item as Record<string, unknown>
    const sel = (selections[index] || {}) as Record<string, unknown>
    const sport = g.sport as Record<string, unknown>
    const sportName = (sport?.name as string) || 'Football'
    const category = sport?.category as Record<string, unknown>
    const tournament = category?.tournament as Record<string, unknown>
    const league = (tournament?.name as string) || ''
    const markets = (g.markets as unknown[]) || []

    let odds = 1
    let pick = ''
    let market = '1X2'
    let marketId = String(sel.marketId || '1')
    let outcomeId = String(sel.outcomeId || '1')
    const specifier = (sel.specifier as string | null) || null

    if (markets.length > 0) {
      const firstMarket = markets[0] as Record<string, unknown>
      market = (firstMarket.desc as string) || '1X2'
      marketId = String(firstMarket.id || '1')
      const outs = (firstMarket.outcomes as unknown[]) || []
      const matched = outs.find((o: unknown) => {
        const oc = o as Record<string, unknown>
        return String(oc.id) === String(sel.outcomeId)
      }) as Record<string, unknown> | undefined

      if (matched) {
        odds = parseFloat(String(matched.odds || 1))
        pick = (matched.desc as string) || ''
        outcomeId = String(matched.id || outcomeId)
      } else if (outs.length > 0) {
        const first = outs[0] as Record<string, unknown>
        odds = parseFloat(String(first.odds || 1))
        pick = (first.desc as string) || ''
        outcomeId = String(first.id || outcomeId)
      }
    }

    return {
      eventId: String(g.eventId || index),
      homeTeam: (g.homeTeamName as string) || 'Home',
      awayTeam: (g.awayTeamName as string) || 'Away',
      market,
      marketId,
      outcomeId,
      specifier,
      pick,
      odds,
      kickoffTime: String(g.estimateStartTime || ''),
      league,
      sport: sportName,
    }
  })

  return {
    shareCode: cleanCode,
    totalOdds: parseFloat(displayTotalOdds.toFixed(2)),
    games,
    raw: data,
  }
}

export async function createBookingCode(games: SportyBetGame[]): Promise<string> {
  const url = `https://www.sportybet.com/api/ng/orders/share`

  const payload = {
    selections: games.map(g => ({
      eventId: g.eventId,
      marketId: g.marketId || '1',
      specifier: g.specifier || null,
      outcomeId: g.outcomeId || '1',
    }))
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...HEADERS,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Failed to create booking code: ${res.status}`)

  const data = await res.json()

  if (!data || data.bizCode !== 10000) {
    throw new Error(data?.message || 'Failed to generate booking code')
  }

  return data.data?.shareCode || ''
}