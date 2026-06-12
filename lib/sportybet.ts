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

const PROXY_URL = 'https://sportybet-proxy.grooveslip.workers.dev'
const PROXY_KEY = 'grooveslip_proxy_2026'

// ─── FETCH ALL LIVE MARKETS FOR AN EVENT VIA CLOUDFLARE ───────────────────
// This is the core function — asks SportyBet for ALL available markets
// for a specific event, passing the known marketId so we get that one too
export async function fetchLiveMarketsForEvent(
  eventId: string,
  knownMarketIds: string[] = []
): Promise<AvailableMarket[]> {
  try {
    const res = await fetch(`${PROXY_URL}/markets/${eventId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify({ knownMarketIds }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!data.success) return []
    return data.markets || []
  } catch { return [] }
}

// ─── FETCH LIVE MARKETS FOR MULTIPLE EVENTS ───────────────────────────────
export async function fetchLiveMarketsForEvents(
  games: SportyBetGame[]
): Promise<Map<string, AvailableMarket[]>> {
  const result = new Map<string, AvailableMarket[]>()
  try {
    // Build knownMarkets map — pass each event's known marketId
    const knownMarkets: Record<string, string[]> = {}
    for (const g of games) {
      knownMarkets[g.eventId] = [g.marketId]
    }

    const res = await fetch(`${PROXY_URL}/markets-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify({
        eventIds: games.map(g => g.eventId),
        knownMarkets,
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) return result
    const data = await res.json()
    if (!data.success) return result

    for (const [eventId, markets] of Object.entries(data.markets)) {
      result.set(eventId, markets as AvailableMarket[])
    }
  } catch { /* silent */ }
  return result
}

// ─── FIND SAFEST PICK FROM LIVE MARKETS ───────────────────────────────────
// Scans ALL real SportyBet markets for a game
// Returns the safest available pick (lowest odds above 1.05)
// Prioritises: Double Chance > Over 0.5/1.5 > 1X2 > GG No > others
export function findSafestPickFromMarkets(
  availableMarkets: AvailableMarket[],
  currentMarketId: string,
  currentOutcomeId: string,
  currentOdds: number
): { marketId: string; outcomeId: string; pick: string; market: string; odds: number } | null {
  if (!availableMarkets?.length) return null

  const SAFE_MARKET_PRIORITY = [
    'double chance',
    'over/under',
    '1x2',
    'gg/ng',
    'both teams',
    'draw no bet',
  ]

  interface Candidate {
    marketId: string
    outcomeId: string
    pick: string
    market: string
    odds: number
    priority: number
  }

  const candidates: Candidate[] = []

  for (const m of availableMarkets) {
    const mDesc = m.desc.toLowerCase()

    // Skip risky/irrelevant markets
    if (mDesc.includes('corner') || mDesc.includes('booking') ||
        mDesc.includes('card') || mDesc.includes('offside') ||
        mDesc.includes('penalty') || mDesc.includes('minute') ||
        mDesc.includes('2nd half') || mDesc.includes('first half') ||
        mDesc.includes('1st half') || mDesc.includes('half time') ||
        mDesc.includes('player') || mDesc.includes('scorer')) continue

    const isCurrent = m.id === currentMarketId

    let priority = 99
    for (let i = 0; i < SAFE_MARKET_PRIORITY.length; i++) {
      if (mDesc.includes(SAFE_MARKET_PRIORITY[i])) { priority = i; break }
    }

    for (const o of m.outcomes) {
      // Skip current pick
      if (isCurrent && o.id === currentOutcomeId) continue
      // Must be genuinely safer
      if (o.odds >= currentOdds) continue
      // Must be above minimum viable odds
      if (o.odds <= 1.03) continue

      // Skip risky over lines as replacement
      const oDesc = o.desc.toLowerCase()
      if (oDesc.startsWith('over')) {
        const num = parseFloat(oDesc.replace(/[^0-9.]/g, ''))
        if (!isNaN(num) && num >= 2.5) continue
      }

      candidates.push({
        marketId: m.id,
        outcomeId: o.id,
        pick: o.desc,
        market: m.desc,
        odds: o.odds,
        priority,
      })
    }
  }

  if (candidates.length === 0) return null

  // Sort by priority first, then by odds ascending (safest)
  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return a.odds - b.odds
  })

  return candidates[0]
}

export function getSmartReplacement(
  marketId: string,
  outcomeId: string,
  pick: string,
  market: string,
  originalOdds: number
): { marketId: string; outcomeId: string; marketDesc: string; pickDesc: string } | null {
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
    return d === targetMarketDesc || d.includes(targetMarketDesc) || targetMarketDesc.includes(d) ||
      (targetMarketDesc.includes('double chance') && d.includes('double chance')) ||
      (targetMarketDesc === 'gg/ng' && (d.includes('gg') || d.includes('both teams'))) ||
      (targetMarketDesc.includes('over/under') && d.includes('over/under') && !d.includes('corner'))
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

// ─── RESOLVE BOOKING IDs FROM LIVE MARKETS ────────────────────────────────
// Uses live market data to find correct marketId/outcomeId for booking
export function resolveBookingIds(
  game: SportyBetGame,
  liveMarkets?: AvailableMarket[]
): { marketId: string; outcomeId: string } {
  const markets = liveMarkets || game.availableMarkets || []
  if (!markets.length) return { marketId: game.marketId, outcomeId: game.outcomeId }

  const targetMarketId = String(game.marketId)
  const targetOutcomeId = String(game.outcomeId)
  const pick = game.pick.toLowerCase().trim()
  const marketDesc = game.market.toLowerCase().trim()

  // Step 1: Exact ID match
  for (const m of markets) {
    if (m.id === targetMarketId) {
      const outcome = m.outcomes.find(o => o.id === targetOutcomeId)
      if (outcome) return { marketId: m.id, outcomeId: outcome.id }
    }
  }

  // Step 2: Match by description
  for (const m of markets) {
    const md = m.desc.toLowerCase()
    const marketMatches =
      md === marketDesc || md.includes(marketDesc) || marketDesc.includes(md) ||
      (marketDesc.includes('double chance') && md.includes('double chance')) ||
      (marketDesc === 'gg/ng' && (md.includes('gg') || md.includes('both teams'))) ||
      (marketDesc.includes('over/under') && md.includes('over/under') && !md.includes('corner')) ||
      (marketDesc === '1x2' && md === '1x2')

    if (!marketMatches) continue

    for (const o of m.outcomes) {
      const od = o.desc.toLowerCase()
      let matches = false

      if (pick.startsWith('over') || pick.startsWith('under')) {
        const pNum = parseFloat(pick.replace(/[^0-9.]/g, ''))
        const oNum = parseFloat(od.replace(/[^0-9.]/g, ''))
        const dir = pick.startsWith('over') ? 'over' : 'under'
        if (!isNaN(pNum) && !isNaN(oNum)) matches = od.startsWith(dir) && Math.abs(oNum - pNum) < 0.1
      } else if (pick === 'home/draw' || pick === '1x') {
        matches = od === 'home/draw' || od === '1x' || (od.includes('home') && od.includes('draw'))
      } else if (pick === 'draw/away' || pick === 'x2') {
        matches = od === 'draw/away' || od === 'x2' || (od.includes('draw') && od.includes('away'))
      } else if (pick === 'home/away' || pick === '12') {
        matches = od === 'home/away' || od === '12'
      } else if (pick === 'home' || pick === '1') {
        matches = od === 'home' || od === '1' || od === 'home win'
      } else if (pick === 'away' || pick === '2') {
        matches = od === 'away' || od === '2' || od === 'away win'
      } else if (pick === 'draw' || pick === 'x') {
        matches = od === 'draw' || od === 'x' || od === 'the draw'
      } else if (pick === 'yes' || pick === 'gg') {
        matches = od === 'yes' || od === 'gg'
      } else if (pick === 'no' || pick === 'ng') {
        matches = od === 'no' || od === 'ng'
      } else {
        matches = od === pick || od.includes(pick) || pick.includes(od)
      }

      if (matches) return { marketId: m.id, outcomeId: o.id }
    }
  }

  // Step 3: Fall back to original IDs
  return { marketId: game.marketId, outcomeId: game.outcomeId }
}

// ─── CREATE BOOKING CODE ───────────────────────────────────────────────────
export async function createBookingCode(games: SportyBetGame[]): Promise<string> {
  // Step 1: Fetch live markets for ALL games from Cloudflare Worker
  // This gives us real marketId/outcomeId from SportyBet
  console.log('[createBookingCode] fetching live markets for', games.length, 'games')
  const liveMarketsMap = await fetchLiveMarketsForEvents(games)
  console.log('[createBookingCode] got live markets for', liveMarketsMap.size, 'games')

  // Step 2: Build selections using live market data
  const selections = games.map(g => {
    const liveMarkets = liveMarketsMap.get(g.eventId)
    const resolved = resolveBookingIds(g, liveMarkets)
    return {
      eventId: g.eventId,
      marketId: resolved.marketId,
      specifier: g.specifier || null,
      outcomeId: resolved.outcomeId,
    }
  })

  console.log('[createBookingCode] selections:', selections.length)
  console.log('[createBookingCode] sample:', JSON.stringify(selections.slice(0, 2)))

  // Step 3: Create booking code via proxy
  try {
    const proxyRes = await fetch(`${PROXY_URL}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify({ selections }),
      signal: AbortSignal.timeout(25000),
    })

    console.log('[createBookingCode] proxy status:', proxyRes.status)

    if (proxyRes.ok) {
      const proxyData = await proxyRes.json()
      console.log('[createBookingCode] bizCode:', proxyData?.bizCode)

      if (proxyData?.bizCode === 10000 && proxyData?.data?.shareCode) {
        return proxyData.data.shareCode
      }

      // bizCode 19000 = one or more expired events
      // Remove them one by one until booking succeeds
      if (proxyData?.bizCode === 19000) {
        console.log('[createBookingCode] bizCode 19000 — finding expired event')
        for (let i = 0; i < selections.length; i++) {
          const reduced = selections.filter((_, idx) => idx !== i)
          if (reduced.length === 0) continue
          try {
            const retryRes = await fetch(`${PROXY_URL}/share`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
              body: JSON.stringify({ selections: reduced }),
              signal: AbortSignal.timeout(10000),
            })
            if (retryRes.ok) {
              const retryData = await retryRes.json()
              if (retryData?.bizCode === 10000 && retryData?.data?.shareCode) {
                console.log('[createBookingCode] success after removing:', games[i]?.homeTeam, 'vs', games[i]?.awayTeam)
                return retryData.data.shareCode
              }
            }
          } catch { continue }
        }
      }
    }
  } catch (err) {
    console.error('[createBookingCode] proxy exception:', err)
  }

  // Fallback — direct SportyBet call
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