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

export interface MarketOutcome {
  id: string
  odds: number
  probability: number
  desc: string
  isActive: boolean
}

export interface Market {
  id: string
  desc: string
  name: string
  group: string
  outcomes: MarketOutcome[]
}

export interface EventMarkets {
  eventId: string
  homeTeam: string
  awayTeam: string
  markets: Market[]
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en',
  'Origin': 'https://www.sportybet.com',
  'Referer': 'https://www.sportybet.com/ng/',
  'Clientid': 'web',
  'Content-Type': 'application/json',
}

export async function fetchEventMarkets(game: SportyBetGame): Promise<EventMarkets | null> {
  try {
    const payload = [{
      eventId: game.eventId,
      marketId: '1',
      outcomeId: '1',
      specifier: null,
    }]

    const res = await fetch('https://www.sportybet.com/api/ng/factsCenter/Outcomes', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(payload),
    })

    if (!res.ok) return null
    const data = await res.json()
    if (!data || data.bizCode !== 10000) return null

    const eventData = (data.data || [])[0] as Record<string, unknown>
    if (!eventData) return null

    const rawMarkets = (eventData.markets as unknown[]) || []

    const markets: Market[] = rawMarkets.map((m: unknown) => {
      const market = m as Record<string, unknown>
      const rawOutcomes = (market.outcomes as unknown[]) || []

      const outcomes: MarketOutcome[] = rawOutcomes
        .map((o: unknown) => {
          const outcome = o as Record<string, unknown>
          return {
            id: String(outcome.id || ''),
            odds: parseFloat(String(outcome.odds || 1)),
            probability: parseFloat(String(outcome.probability || 0)),
            desc: String(outcome.desc || ''),
            isActive: outcome.isActive === 1 || outcome.isActive === true,
          }
        })
        .filter(o => o.isActive && o.odds > 1.0)

      return {
        id: String(market.id || ''),
        desc: String(market.desc || market.name || ''),
        name: String(market.name || market.desc || ''),
        group: String(market.group || 'Main'),
        outcomes,
      }
    }).filter(m => m.outcomes.length > 0)

    return {
      eventId: game.eventId,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      markets,
    }
  } catch {
    return null
  }
}

export function getSaferMarketOptions(
  currentMarketDesc: string,
  currentPick: string
): Array<{ marketDesc: string; outcomeDesc: string }> {
  const market = currentMarketDesc.toLowerCase()
  const pick = currentPick.toLowerCase()

  // Over/Under goals
  if (market.includes('over/under') || market === 'over/under goals') {
    const num = parseFloat(currentPick.replace(/[^0-9.]/g, ''))
    if (pick.startsWith('over')) {
      const saferLines = [num - 0.5, num - 1, num - 1.5, num - 2].filter(n => n >= 0.5)
      return saferLines.map(n => ({ marketDesc: 'Over/Under', outcomeDesc: `Over ${n}` }))
    }
    if (pick.startsWith('under')) {
      const saferLines = [num + 0.5, num + 1, num + 1.5, num + 2]
      return saferLines.map(n => ({ marketDesc: 'Over/Under', outcomeDesc: `Under ${n}` }))
    }
  }

  // 1X2 match result
  if (market === '1x2') {
    if (pick === 'home' || pick === '1') {
      return [
        { marketDesc: 'Double Chance', outcomeDesc: 'Home/Draw' },
        { marketDesc: 'Draw No Bet', outcomeDesc: 'Home' },
        { marketDesc: '1X2 - 1UP', outcomeDesc: 'Home' },
      ]
    }
    if (pick === 'away' || pick === '2') {
      return [
        { marketDesc: 'Double Chance', outcomeDesc: 'Draw/Away' },
        { marketDesc: 'Draw No Bet', outcomeDesc: 'Away' },
        { marketDesc: '1X2 - 1UP', outcomeDesc: 'Away' },
      ]
    }
    if (pick === 'draw' || pick === 'x') {
      return [
        { marketDesc: 'Double Chance', outcomeDesc: 'Home/Draw' },
        { marketDesc: 'Double Chance', outcomeDesc: 'Draw/Away' },
      ]
    }
  }

  // GG/NG
  if (market === 'gg/ng' || market.includes('both teams to score')) {
    if (pick === 'yes' || pick === 'gg') {
      return [{ marketDesc: 'GG/NG', outcomeDesc: 'No' }]
    }
  }

  // Double Chance
  if (market === 'double chance') {
    if (pick.includes('home/draw') || pick.includes('1x')) {
      return [{ marketDesc: '1X2', outcomeDesc: 'Home' }]
    }
    if (pick.includes('draw/away') || pick.includes('x2')) {
      return [{ marketDesc: '1X2', outcomeDesc: 'Away' }]
    }
  }

  // Corners Over/Under
  if (market.includes('corner') && market.includes('over/under')) {
    const num = parseFloat(currentPick.replace(/[^0-9.]/g, ''))
    if (pick.startsWith('over')) {
      const saferLines = [num - 0.5, num - 1].filter(n => n >= 7.5)
      return saferLines.map(n => ({ marketDesc: currentMarketDesc, outcomeDesc: `Over ${n}` }))
    }
    if (pick.startsWith('under')) {
      const saferLines = [num + 0.5, num + 1]
      return saferLines.map(n => ({ marketDesc: currentMarketDesc, outcomeDesc: `Under ${n}` }))
    }
  }

  // 1X2 1UP or 2UP
  if (market.includes('1up') || market.includes('2up')) {
    return [{ marketDesc: '1X2', outcomeDesc: currentPick }]
  }

  // Any Team To Score N+ Goals in a Row
  if (market.includes('goals in a row')) {
    if (market.includes('3 or more')) {
      return [{ marketDesc: market.replace('3 or more', '2 or more'), outcomeDesc: currentPick }]
    }
  }

  return []
}

export function findSaferReplacement(
  eventMarkets: EventMarkets,
  currentMarketDesc: string,
  currentPick: string,
  currentOdds: number
): { marketId: string; outcomeId: string; marketDesc: string; pickDesc: string; odds: number } | null {
  const saferOptions = getSaferMarketOptions(currentMarketDesc, currentPick)

  for (const option of saferOptions) {
    const market = eventMarkets.markets.find(m => {
      const mDesc = m.desc.toLowerCase()
      const targetDesc = option.marketDesc.toLowerCase()
      return mDesc === targetDesc || mDesc.includes(targetDesc) || targetDesc.includes(mDesc)
    })

    if (!market) continue

    const outcome = market.outcomes.find(o => {
      const oDesc = o.desc.toLowerCase()
      const targetDesc = option.outcomeDesc.toLowerCase()

      if (targetDesc.startsWith('over') || targetDesc.startsWith('under')) {
        const targetNum = parseFloat(targetDesc.replace(/[^0-9.]/g, ''))
        const oNum = parseFloat(oDesc.replace(/[^0-9.]/g, ''))
        const direction = targetDesc.startsWith('over') ? 'over' : 'under'
        return oDesc.startsWith(direction) && Math.abs(oNum - targetNum) < 0.1
      }

      return oDesc === targetDesc || oDesc.includes(targetDesc) || targetDesc.includes(oDesc)
    })

    if (!outcome) continue

    if (outcome.odds < currentOdds && outcome.odds > 1.0) {
      return {
        marketId: market.id,
        outcomeId: outcome.id,
        marketDesc: market.desc,
        pickDesc: outcome.desc,
        odds: outcome.odds,
      }
    }
  }

  return null
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
  const shareCodeResult = data.data?.shareCode || cleanCode

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
    const marketId = String(sel.marketId || '1')
    const outcomeId = String(sel.outcomeId || '1')
    const specifier = (sel.specifier as string | null) || null

    if (markets.length > 0) {
      const firstMarket = markets[0] as Record<string, unknown>
      market = (firstMarket.desc as string) || '1X2'
      const outs = (firstMarket.outcomes as unknown[]) || []
      const matched = outs.find((o: unknown) => {
        const oc = o as Record<string, unknown>
        return String(oc.id) === String(sel.outcomeId)
      }) as Record<string, unknown> | undefined

      if (matched) {
        odds = parseFloat(String(matched.odds || 1))
        pick = (matched.desc as string) || ''
      } else if (outs.length > 0) {
        const first = outs[0] as Record<string, unknown>
        odds = parseFloat(String(first.odds || 1))
        pick = (first.desc as string) || ''
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
    shareCode: shareCodeResult,
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
    headers: HEADERS,
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Failed to create booking code: ${res.status}`)
  const data = await res.json()
  if (!data || data.bizCode !== 10000) throw new Error(data?.message || 'Failed to generate booking code')
  return data.data?.shareCode || ''
}