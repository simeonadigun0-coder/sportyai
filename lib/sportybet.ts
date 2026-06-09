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

function matchOutcome(market: Market, targetPick: string): MarketOutcome | null {
  const t = targetPick.toLowerCase().trim()
  return market.outcomes.find(o => {
    const d = o.desc.toLowerCase().trim()
    if ((t.startsWith('over') || t.startsWith('under'))) {
      const tNum = parseFloat(t.replace(/[^0-9.]/g, ''))
      const dNum = parseFloat(d.replace(/[^0-9.]/g, ''))
      const dir = t.startsWith('over') ? 'over' : 'under'
      if (!isNaN(tNum) && !isNaN(dNum)) {
        return d.startsWith(dir) && Math.abs(dNum - tNum) < 0.1
      }
    }
    if (t === 'home/draw' || t === '1x') return d === 'home/draw' || d === '1x' || d === 'home or draw'
    if (t === 'draw/away' || t === 'x2') return d === 'draw/away' || d === 'x2' || d === 'draw or away'
    if (t === 'home/away' || t === '12') return d === 'home/away' || d === '12' || d === 'home or away'
    return d === t || d.includes(t) || t.includes(d)
  }) || null
}

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
  if (!outcome.isActive) return null
  if (outcome.odds >= originalOdds) return null
  if (outcome.odds <= 1.02) return null
  return { marketId: market.id, outcomeId: outcome.id, realOdds: outcome.odds }
}

export const MARKET_KNOWLEDGE: Record<string, {
  desc: string
  saferAlternatives: Array<{ marketId: string; marketDesc: string; outcomeId: string; outcomeDesc: string }>
}> = {
  '1_1': { desc: 'Home Win', saferAlternatives: [{ marketId: '3', marketDesc: 'Double Chance', outcomeId: '1', outcomeDesc: 'Home/Draw' }] },
  '1_2': { desc: 'Draw', saferAlternatives: [{ marketId: '3', marketDesc: 'Double Chance', outcomeId: '1', outcomeDesc: 'Home/Draw' }, { marketId: '3', marketDesc: 'Double Chance', outcomeId: '3', outcomeDesc: 'Draw/Away' }] },
  '1_3': { desc: 'Away Win', saferAlternatives: [{ marketId: '3', marketDesc: 'Double Chance', outcomeId: '3', outcomeDesc: 'Draw/Away' }] },
  '18_12_over3.5': { desc: 'Over 3.5', saferAlternatives: [{ marketId: '18', marketDesc: 'Over/Under', outcomeId: '12', outcomeDesc: 'Over 2.5' }] },
  '18_12_over2.5': { desc: 'Over 2.5', saferAlternatives: [{ marketId: '18', marketDesc: 'Over/Under', outcomeId: '12', outcomeDesc: 'Over 1.5' }] },
  '60100_1': { desc: '1X2 2UP Home', saferAlternatives: [{ marketId: '60200', marketDesc: '1X2 - 1UP', outcomeId: '1', outcomeDesc: 'Home' }] },
  '60100_3': { desc: '1X2 2UP Away', saferAlternatives: [{ marketId: '60200', marketDesc: '1X2 - 1UP', outcomeId: '3', outcomeDesc: 'Away' }] },
  '60200_1': { desc: '1X2 1UP Home', saferAlternatives: [{ marketId: '1', marketDesc: '1X2', outcomeId: '1', outcomeDesc: 'Home' }] },
  '60200_3': { desc: '1X2 1UP Away', saferAlternatives: [{ marketId: '1', marketDesc: '1X2', outcomeId: '3', outcomeDesc: 'Away' }] },
  '60021_76': { desc: 'Home Team Score 3+ Row', saferAlternatives: [{ marketId: '60021', marketDesc: 'Home Team To Score 2 or More Goals in a Row', outcomeId: '76', outcomeDesc: 'Yes' }] },
  '60022_76': { desc: 'Away Team Score 3+ Row', saferAlternatives: [{ marketId: '60022', marketDesc: 'Away Team To Score 2 or More Goals in a Row', outcomeId: '76', outcomeDesc: 'Yes' }] },
  '60020_76': { desc: 'Any Team Score 3+ Row', saferAlternatives: [{ marketId: '60020', marketDesc: 'Any Team To Score 2 or More Goals in a Row', outcomeId: '76', outcomeDesc: 'Yes' }] },
}

export function getSmartReplacement(
  marketId: string,
  outcomeId: string,
  pick: string,
  market: string,
  originalOdds: number
): { marketId: string; outcomeId: string; marketDesc: string; pickDesc: string } | null {
  const key = `${marketId}_${outcomeId}`
  const known = MARKET_KNOWLEDGE[key]
  if (known?.saferAlternatives?.length) {
    const alt = known.saferAlternatives[0]
    return { marketId: alt.marketId, outcomeId: alt.outcomeId, marketDesc: alt.marketDesc, pickDesc: alt.outcomeDesc }
  }

  const m = market.toLowerCase().trim()
  const p = pick.toLowerCase().trim()

  if (m === '1x2') {
    if (p === 'home') return { marketId: '3', outcomeId: '1', marketDesc: 'Double Chance', pickDesc: 'Home/Draw' }
    if (p === 'away') return { marketId: '3', outcomeId: '3', marketDesc: 'Double Chance', pickDesc: 'Draw/Away' }
    if (p === 'draw') return { marketId: '3', outcomeId: '1', marketDesc: 'Double Chance', pickDesc: 'Home/Draw' }
  }
  if (m.includes('over/under') || m.includes('over under')) {
    const num = parseFloat(p.replace(/[^0-9.]/g, ''))
    if (p.startsWith('over') && !isNaN(num)) {
      if (num >= 3.5) return { marketId: '18', outcomeId: '12', marketDesc: 'Over/Under', pickDesc: 'Over 2.5' }
      if (num >= 2.5) return { marketId: '18', outcomeId: '12', marketDesc: 'Over/Under', pickDesc: 'Over 1.5' }
      if (num >= 1.5) return { marketId: '18', outcomeId: '12', marketDesc: 'Over/Under', pickDesc: 'Over 0.5' }
    }
  }
  if ((m === 'gg/ng' || m.includes('both teams')) && p === 'yes') {
    return { marketId: '5', outcomeId: '2', marketDesc: 'GG/NG', pickDesc: 'No' }
  }
  if (m.includes('2up')) {
    if (p === 'home') return { marketId: '60200', outcomeId: '1', marketDesc: '1X2 - 1UP', pickDesc: 'Home' }
    if (p === 'away') return { marketId: '60200', outcomeId: '3', marketDesc: '1X2 - 1UP', pickDesc: 'Away' }
  }
  if (m.includes('1up')) {
    if (p === 'home') return { marketId: '1', outcomeId: '1', marketDesc: '1X2', pickDesc: 'Home' }
    if (p === 'away') return { marketId: '1', outcomeId: '3', marketDesc: '1X2', pickDesc: 'Away' }
  }
  if (m.includes('3 or more goals in a row')) {
    if (m.includes('home')) return { marketId: '60021', outcomeId: '76', marketDesc: 'Home Team To Score 2 or More Goals in a Row', pickDesc: 'Yes' }
    if (m.includes('away')) return { marketId: '60022', outcomeId: '76', marketDesc: 'Away Team To Score 2 or More Goals in a Row', pickDesc: 'Yes' }
    return { marketId: '60020', outcomeId: '76', marketDesc: 'Any Team To Score 2 or More Goals in a Row', pickDesc: 'Yes' }
  }
  return null
}

export function resolveFromAvailableMarkets(
  availableMarkets: AvailableMarket[],
  replacedPick: string,
  replacedMarket: string,
  originalOdds: number
): { marketId: string; outcomeId: string; realOdds: number } | null {
  if (!availableMarkets?.length) return null

  const targetMarketDesc = replacedMarket.toLowerCase().trim()
  const targetPickDesc = replacedPick.toLowerCase().trim()

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

  const outcome = market.outcomes.find(o => {
    const d = o.desc.toLowerCase().trim()
    if (targetPickDesc.startsWith('over') || targetPickDesc.startsWith('under')) {
      const tNum = parseFloat(targetPickDesc.replace(/[^0-9.]/g, ''))
      const dNum = parseFloat(d.replace(/[^0-9.]/g, ''))
      const dir = targetPickDesc.startsWith('over') ? 'over' : 'under'
      if (!isNaN(tNum) && !isNaN(dNum)) return d.startsWith(dir) && Math.abs(dNum - tNum) < 0.1
    }
    if (targetPickDesc === 'home/draw') return d === 'home/draw' || d === '1x' || (d.includes('home') && d.includes('draw'))
    if (targetPickDesc === 'draw/away') return d === 'draw/away' || d === 'x2' || (d.includes('draw') && d.includes('away'))
    if (targetPickDesc === 'home/away') return d === 'home/away' || d === '12'
    if (targetPickDesc === 'yes' || targetPickDesc === 'gg') return d === 'yes' || d === 'gg'
    if (targetPickDesc === 'no' || targetPickDesc === 'ng') return d === 'no' || d === 'ng'
    return d === targetPickDesc || d.includes(targetPickDesc) || targetPickDesc.includes(d)
  })

  if (!outcome) return null
  if (outcome.odds >= originalOdds) return null
  if (outcome.odds <= 1.02) return null
  return { marketId: market.id, outcomeId: outcome.id, realOdds: outcome.odds }
}

async function wakeProxy(proxyUrl: string, proxyKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${proxyUrl}/health`, {
      method: 'GET',
      headers: { 'X-Proxy-Key': proxyKey },
      signal: AbortSignal.timeout(8000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function createBookingCode(games: SportyBetGame[]): Promise<string> {
  const PROXY_URL = 'https://sportybet-proxy.onrender.com'
  const PROXY_KEY = 'grooveslip_proxy_2026'

  const selections = games.map(g => ({
    eventId: g.eventId,
    marketId: g.marketId || '1',
    specifier: g.specifier || null,
    outcomeId: g.outcomeId || '1',
  }))

  console.log('[createBookingCode] selections:', JSON.stringify(selections))

  // Wake the proxy first, then call /share
  try {
    // Ping /health to wake Render from sleep (up to 8s)
    await wakeProxy(PROXY_URL, PROXY_KEY)

    // Now call /share with a generous timeout
    const proxyRes = await fetch(`${PROXY_URL}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Key': PROXY_KEY,
      },
      body: JSON.stringify({ selections }),
      signal: AbortSignal.timeout(25000),
    })

    console.log('[createBookingCode] proxy status:', proxyRes.status)

    if (proxyRes.ok) {
      const proxyData = await proxyRes.json()
      console.log('[createBookingCode] proxy response:', JSON.stringify(proxyData))
      if (proxyData?.bizCode === 10000 && proxyData?.data?.shareCode) {
        return proxyData.data.shareCode
      }
    } else {
      const errText = await proxyRes.text()
      console.error('[createBookingCode] proxy error body:', errText)
    }
  } catch (err) {
    console.error('[createBookingCode] proxy exception:', err)
  }

  // Fallback — direct call to SportyBet
  console.log('[createBookingCode] falling back to direct SportyBet call')
  const res = await fetch('https://www.sportybet.com/api/ng/orders/share', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ selections }),
  })

  if (!res.ok) throw new Error(`Failed to create booking code: ${res.status}`)
  const data = await res.json()
  if (!data || data.bizCode !== 10000) throw new Error(data?.message || 'Failed to generate booking code')
  return data.data?.shareCode || ''
}