export interface AvailableMarket {
  id: string
  desc: string
  outcomes: Array<{ id: string; desc: string; odds: number }>
}

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
  availableMarkets?: AvailableMarket[]
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
    const commonMarketIds = ['1','2','3','4','5','6','7','8','18','19','20','21','29','45','60200','60100']
    const payload = commonMarketIds.map(marketId => ({
      eventId: game.eventId,
      marketId,
      outcomeId: '1',
      specifier: null,
    }))

    const res = await fetch('https://www.sportybet.com/api/ng/factsCenter/Outcomes', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(payload),
    })

    if (!res.ok) return null
    const data = await res.json()
    if (!data || data.bizCode !== 10000) return null

    const allMarketsMap = new Map<string, Market>()
    for (const eventData of (data.data || []) as unknown[]) {
      const ev = eventData as Record<string, unknown>
      const rawMarkets = (ev.markets as unknown[]) || []
      for (const m of rawMarkets) {
        const market = m as Record<string, unknown>
        const marketId = String(market.id || '')
        if (allMarketsMap.has(marketId)) continue
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
        if (outcomes.length > 0) {
          allMarketsMap.set(marketId, {
            id: marketId,
            desc: String(market.desc || market.name || ''),
            name: String(market.name || market.desc || ''),
            group: String(market.group || 'Main'),
            outcomes,
          })
        }
      }
    }

    return {
      eventId: game.eventId,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      markets: Array.from(allMarketsMap.values()),
    }
  } catch { return null }
}

// Match a market name flexibly
function matchMarket(markets: Market[], targetDesc: string): Market | null {
  const t = targetDesc.toLowerCase().trim()
  return markets.find(m => {
    const d = m.desc.toLowerCase().trim()
    return d === t || d.includes(t) || t.includes(d) ||
      (t.includes('double chance') && d.includes('double chance')) ||
      (t.includes('draw no bet') && (d.includes('draw no bet') || d.includes('dnb'))) ||
      (t === 'gg/ng' && (d.includes('gg') || d.includes('both teams to score'))) ||
      (t.includes('over/under') && d.includes('over/under') && !d.includes('corner') && !d.includes('half'))
  }) || null
}

// Match an outcome name flexibly
function matchOutcome(market: Market, targetPick: string): MarketOutcome | null {
  const t = targetPick.toLowerCase().trim()
  return market.outcomes.find(o => {
    const d = o.desc.toLowerCase().trim()

    // Over/Under numeric match
    if ((t.startsWith('over') || t.startsWith('under'))) {
      const tNum = parseFloat(t.replace(/[^0-9.]/g, ''))
      const dNum = parseFloat(d.replace(/[^0-9.]/g, ''))
      const dir = t.startsWith('over') ? 'over' : 'under'
      if (!isNaN(tNum) && !isNaN(dNum)) {
        return d.startsWith(dir) && Math.abs(dNum - tNum) < 0.1
      }
    }

    // Double Chance
    if (t === 'home/draw' || t === '1x') return d === 'home/draw' || d === '1x' || d === 'home or draw'
    if (t === 'draw/away' || t === 'x2') return d === 'draw/away' || d === 'x2' || d === 'draw or away'
    if (t === 'home/away' || t === '12') return d === 'home/away' || d === '12' || d === 'home or away'

    // General
    return d === t || d.includes(t) || t.includes(d)
  }) || null
}

// Resolve a replacement pick to real SportyBet marketId + outcomeId + real odds
// Called from browser (client-side) to bypass Vercel IP block
export function resolveReplacementFromMarkets(
  markets: Market[],
  replacedPick: string,
  replacedMarket: string,
  originalOdds: number
): { marketId: string; outcomeId: string; realOdds: number } | null {
  const market = matchMarket(markets, replacedMarket)
  if (!market) return null

  const outcome = matchOutcome(market, replacedPick)
  if (!outcome) return null

  // Only accept if it's active and safer (lower odds) than original
  if (!outcome.isActive) return null
  if (outcome.odds >= originalOdds) return null
  if (outcome.odds <= 1.02) return null

  return {
    marketId: market.id,
    outcomeId: outcome.id,
    realOdds: outcome.odds,
  }
}
// Resolve replacement pick using markets already decoded from booking code
export function resolveFromAvailableMarkets(
  availableMarkets: AvailableMarket[],
  replacedPick: string,
  replacedMarket: string,
  originalOdds: number
): { marketId: string; outcomeId: string; realOdds: number } | null {
  if (!availableMarkets?.length) return null

  const targetMarketDesc = replacedMarket.toLowerCase().trim()
  const targetPickDesc = replacedPick.toLowerCase().trim()

  // Find matching market
  const market = availableMarkets.find(m => {
    const d = m.desc.toLowerCase().trim()
    return d === targetMarketDesc ||
      d.includes(targetMarketDesc) ||
      targetMarketDesc.includes(d) ||
      (targetMarketDesc.includes('double chance') && d.includes('double chance')) ||
      (targetMarketDesc.includes('draw no bet') && d.includes('draw no bet')) ||
      (targetMarketDesc === 'gg/ng' && (d.includes('gg') || d.includes('both teams'))) ||
      (targetMarketDesc.includes('over/under') && d.includes('over/under') && !d.includes('corner') && !d.includes('half'))
  })

  if (!market) return null

  // Find matching outcome
  const outcome = market.outcomes.find(o => {
    const d = o.desc.toLowerCase().trim()

    // Over/Under numeric match
    if (targetPickDesc.startsWith('over') || targetPickDesc.startsWith('under')) {
      const tNum = parseFloat(targetPickDesc.replace(/[^0-9.]/g, ''))
      const dNum = parseFloat(d.replace(/[^0-9.]/g, ''))
      const dir = targetPickDesc.startsWith('over') ? 'over' : 'under'
      if (!isNaN(tNum) && !isNaN(dNum)) {
        return d.startsWith(dir) && Math.abs(dNum - tNum) < 0.1
      }
    }

    // Double Chance outcomes
    if (targetPickDesc === 'home/draw') return d === 'home/draw' || d === '1x' || (d.includes('home') && d.includes('draw'))
    if (targetPickDesc === 'draw/away') return d === 'draw/away' || d === 'x2' || (d.includes('draw') && d.includes('away'))
    if (targetPickDesc === 'home/away') return d === 'home/away' || d === '12'

    // GG/NG
    if (targetPickDesc === 'yes' || targetPickDesc === 'gg') return d === 'yes' || d === 'gg'
    if (targetPickDesc === 'no' || targetPickDesc === 'ng') return d === 'no' || d === 'ng'

    return d === targetPickDesc || d.includes(targetPickDesc) || targetPickDesc.includes(d)
  })

  if (!outcome) return null
  if (outcome.odds >= originalOdds) return null
  if (outcome.odds <= 1.02) return null

  return {
    marketId: market.id,
    outcomeId: outcome.id,
    realOdds: outcome.odds,
  }
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

    let odds = 1, pick = '', market = '1X2'
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
      market, marketId, outcomeId, specifier, pick, odds,
      kickoffTime: String(g.estimateStartTime || ''),
      league, sport: sportName,
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
  const payload = {
    selections: games.map(g => ({
      eventId: g.eventId,
      marketId: g.marketId || '1',
      specifier: g.specifier || null,
      outcomeId: g.outcomeId || '1',
    }))
  }

  const res = await fetch('https://www.sportybet.com/api/ng/orders/share', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Failed to create booking code: ${res.status}`)
  const data = await res.json()
  if (!data || data.bizCode !== 10000) throw new Error(data?.message || 'Failed to generate booking code')
  return data.data?.shareCode || ''
}