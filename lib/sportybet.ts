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

// ─── MARKET ID NORMALISATION ───────────────────────────────────────────────
// SportyBet has multiple IDs for the same market type
// These variants are display-only and rejected during booking
// Map them to their bookable equivalents
const MARKET_ID_NORMALISE: Record<string, string> = {
  '10': '3',   // Double Chance variant → Double Chance (3)
  '11': '3',   // Double Chance variant → Double Chance (3)
  '12': '3',   // Double Chance variant → Double Chance (3)
  '13': '18',  // Over/Under variant → Over/Under (18)
  '14': '18',  // Over/Under variant → Over/Under (18)
  '15': '1',   // 1X2 variant → 1X2 (1)
  '16': '1',   // 1X2 variant → 1X2 (1)
  '22': '5',   // GG/NG variant → GG/NG (5)
  '23': '5',   // GG/NG variant → GG/NG (5)
  '60110': '3', // Double Chance 1UP variant → Double Chance (3)
}

// Confirmed bookable market IDs — SportyBet accepts these for /share
const BOOKABLE_MARKET_IDS = new Set([
  '1','2','3','4','5','6','7','8','9',
  '17','18','19','20','21',
  '29','30','33','34','37','45','47',
  '547',
  '60020','60021','60022','60100','60200','60302',
])

function normaliseMarketId(marketId: string): string {
  return MARKET_ID_NORMALISE[marketId] || marketId
}

// ─── FETCH LIVE MARKETS VIA CLOUDFLARE ────────────────────────────────────
export async function fetchLiveMarketsForEvents(
  games: SportyBetGame[]
): Promise<Map<string, AvailableMarket[]>> {
  const result = new Map<string, AvailableMarket[]>()
  try {
    const knownMarkets: Record<string, string[]> = {}
    for (const g of games) {
      // Include both original and normalised market IDs
      knownMarkets[g.eventId] = [g.marketId, normaliseMarketId(g.marketId)]
        .filter((v, i, a) => a.indexOf(v) === i)
    }

    const res = await fetch(`${PROXY_URL}/markets-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify({
        eventIds: games.map(g => g.eventId),
        knownMarkets,
      }),
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) return result
    const data = await res.json()
    if (!data.success) return result

    for (const [eventId, markets] of Object.entries(data.markets)) {
      // Keep only bookable markets, normalise IDs
      const bookable = (markets as AvailableMarket[])
        .filter(m => BOOKABLE_MARKET_IDS.has(normaliseMarketId(m.id)))
        .map(m => ({ ...m, id: normaliseMarketId(m.id) }))
      result.set(eventId, bookable)
    }
  } catch (err) {
    console.error('[fetchLiveMarketsForEvents]', err)
  }
  return result
}

// ─── FIND SAFEST PICK FROM LIVE MARKETS ───────────────────────────────────
// Uses real SportyBet market data — not hardcoded options
// Prioritises: Double Chance > Draw No Bet > Over/Under safe lines > 1X2 > GG No
export function findSafestPickFromMarkets(
  availableMarkets: AvailableMarket[],
  currentMarketId: string,
  currentOutcomeId: string,
  currentOdds: number
): { marketId: string; outcomeId: string; pick: string; market: string; odds: number } | null {
  if (!availableMarkets?.length) return null

  const normCurrentId = normaliseMarketId(currentMarketId)
  const bookable = availableMarkets.filter(m => BOOKABLE_MARKET_IDS.has(normaliseMarketId(m.id)))
  if (!bookable.length) return null

  const SAFE_MARKET_PRIORITY = [
    'double chance',
    'draw no bet',
    'over/under',
    '1x2',
    'gg/ng',
    'both teams',
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

  for (const m of bookable) {
    const normId = normaliseMarketId(m.id)
    const mDesc = m.desc.toLowerCase()

    // Skip half-time, corners, cards, player markets
    if (mDesc.includes('corner') || mDesc.includes('card') ||
        mDesc.includes('offside') || mDesc.includes('2nd half') ||
        mDesc.includes('first half') || mDesc.includes('1st half') ||
        mDesc.includes('half time') || mDesc.includes('player') ||
        mDesc.includes('scorer') || mDesc.includes('minute') ||
        mDesc.includes('booking')) continue

    const isCurrent = normId === normCurrentId

    let priority = 99
    for (let i = 0; i < SAFE_MARKET_PRIORITY.length; i++) {
      if (mDesc.includes(SAFE_MARKET_PRIORITY[i])) { priority = i; break }
    }

    for (const o of m.outcomes) {
      if (isCurrent && o.id === currentOutcomeId) continue
      if (o.odds >= currentOdds) continue
      if (o.odds <= 1.03) continue

      const oDesc = o.desc.toLowerCase()
      // Skip risky over lines as replacement option
      if (oDesc.startsWith('over')) {
        const num = parseFloat(oDesc.replace(/[^0-9.]/g, ''))
        if (!isNaN(num) && num >= 2.5) continue
      }

      candidates.push({
        marketId: normId,
        outcomeId: o.id,
        pick: o.desc,
        market: m.desc,
        odds: o.odds,
        priority,
      })
    }
  }

  if (candidates.length === 0) return null
  candidates.sort((a, b) => a.priority !== b.priority ? a.priority - b.priority : a.odds - b.odds)
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
    if (p === 'home') return { marketId: '3', outcomeId: '1', marketDesc: 'Double Chance', pickDesc: 'Home/Draw' }
    if (p === 'away') return { marketId: '3', outcomeId: '3', marketDesc: 'Double Chance', pickDesc: 'Draw/Away' }
  }
  if (m.includes('1up')) {
    if (p === 'home') return { marketId: '3', outcomeId: '1', marketDesc: 'Double Chance', pickDesc: 'Home/Draw' }
    if (p === 'away') return { marketId: '3', outcomeId: '3', marketDesc: 'Double Chance', pickDesc: 'Draw/Away' }
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
  const tm = replacedMarket.toLowerCase().trim()
  const tp = replacedPick.toLowerCase().trim()
  const market = availableMarkets.find(m => {
    const d = m.desc.toLowerCase().trim()
    return d === tm || d.includes(tm) || tm.includes(d) ||
      (tm.includes('double chance') && d.includes('double chance')) ||
      (tm === 'gg/ng' && (d.includes('gg') || d.includes('both teams'))) ||
      (tm.includes('over/under') && d.includes('over/under') && !d.includes('corner'))
  })
  if (!market) return null
  const outcome = market.outcomes.find(o => {
    const d = o.desc.toLowerCase().trim()
    if (tp.startsWith('over') || tp.startsWith('under')) {
      const tNum = parseFloat(tp.replace(/[^0-9.]/g, ''))
      const dNum = parseFloat(d.replace(/[^0-9.]/g, ''))
      const dir = tp.startsWith('over') ? 'over' : 'under'
      if (!isNaN(tNum) && !isNaN(dNum)) return d.startsWith(dir) && Math.abs(dNum - tNum) < 0.1
    }
    if (tp === 'home/draw') return d === 'home/draw' || d === '1x' || (d.includes('home') && d.includes('draw'))
    if (tp === 'draw/away') return d === 'draw/away' || d === 'x2' || (d.includes('draw') && d.includes('away'))
    if (tp === 'yes' || tp === 'gg') return d === 'yes' || d === 'gg'
    if (tp === 'no' || tp === 'ng') return d === 'no' || d === 'ng'
    return d === tp || d.includes(tp) || tp.includes(d)
  })
  if (!outcome) return null
  if (outcome.odds >= originalOdds) return null
  if (outcome.odds <= 1.02) return null
  return { marketId: normaliseMarketId(market.id), outcomeId: outcome.id, realOdds: outcome.odds }
}

// ─── RESOLVE BOOKING IDs ───────────────────────────────────────────────────
export function resolveBookingIds(
  game: SportyBetGame,
  liveMarkets?: AvailableMarket[]
): { marketId: string; outcomeId: string } {
  const markets = (liveMarkets || game.availableMarkets || [])
    .filter(m => BOOKABLE_MARKET_IDS.has(normaliseMarketId(m.id)))

  const normMarketId = normaliseMarketId(game.marketId)
  const pick = game.pick.toLowerCase().trim()
  const marketDesc = game.market.toLowerCase().trim()

  // Step 1: Exact normalised ID match in live markets
  for (const m of markets) {
    const normId = normaliseMarketId(m.id)
    if (normId === normMarketId) {
      const outcome = m.outcomes.find(o => o.id === game.outcomeId)
      if (outcome) return { marketId: normId, outcomeId: outcome.id }
    }
  }

  // Step 2: Description match in live markets
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
      if (matches) return { marketId: normaliseMarketId(m.id), outcomeId: o.id }
    }
  }

  // Step 3: Use normalised original ID (fixes marketId:10 → 3)
  return { marketId: normMarketId, outcomeId: game.outcomeId }
}

// ─── CREATE BOOKING CODE ───────────────────────────────────────────────────
export async function createBookingCode(games: SportyBetGame[]): Promise<string> {
  console.log('[createBookingCode] starting for', games.length, 'games')

  // Fetch live markets and attempt quick booking simultaneously
  const liveMarketsPromise = fetchLiveMarketsForEvents(games)

  // Quick attempt using normalised IDs from decode data
  const quickSelections = games.map(g => {
    const resolved = resolveBookingIds(g, g.availableMarkets)
    return {
      eventId: g.eventId,
      marketId: resolved.marketId,
      specifier: g.specifier || null,
      outcomeId: resolved.outcomeId,
    }
  })

  console.log('[createBookingCode] quick attempt, sample:', JSON.stringify(quickSelections.slice(0, 2)))

  try {
    const quickRes = await fetch(`${PROXY_URL}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify({ selections: quickSelections }),
      signal: AbortSignal.timeout(8000),
    })
    if (quickRes.ok) {
      const quickData = await quickRes.json()
      console.log('[createBookingCode] quick bizCode:', quickData?.bizCode)
      if (quickData?.bizCode === 10000 && quickData?.data?.shareCode) {
        console.log('[createBookingCode] quick booking succeeded')
        return quickData.data.shareCode
      }
    }
  } catch { /* fall through */ }

  // Wait for live markets and retry
  const liveMarketsMap = await liveMarketsPromise
  console.log('[createBookingCode] live markets for', liveMarketsMap.size, 'games')

  const liveSelections = games.map(g => {
    const liveMarkets = liveMarketsMap.get(g.eventId) || []
    const resolved = resolveBookingIds(g, liveMarkets.length ? liveMarkets : g.availableMarkets)
    return {
      eventId: g.eventId,
      marketId: resolved.marketId,
      specifier: g.specifier || null,
      outcomeId: resolved.outcomeId,
    }
  })

  console.log('[createBookingCode] live attempt, sample:', JSON.stringify(liveSelections.slice(0, 2)))

  try {
    const proxyRes = await fetch(`${PROXY_URL}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify({ selections: liveSelections }),
      signal: AbortSignal.timeout(15000),
    })
    console.log('[createBookingCode] live proxy status:', proxyRes.status)
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json()
      console.log('[createBookingCode] live bizCode:', proxyData?.bizCode)
      if (proxyData?.bizCode === 10000 && proxyData?.data?.shareCode) {
        return proxyData.data.shareCode
      }
      // bizCode 19000 — remove events with no live market data (likely expired)
      if (proxyData?.bizCode === 19000) {
        console.log('[createBookingCode] 19000 — removing events with no live markets')
        const filtered = liveSelections.filter(s => liveMarketsMap.get(s.eventId)?.length)
        if (filtered.length > 0 && filtered.length < liveSelections.length) {
          const retryRes = await fetch(`${PROXY_URL}/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
            body: JSON.stringify({ selections: filtered }),
            signal: AbortSignal.timeout(10000),
          })
          if (retryRes.ok) {
            const retryData = await retryRes.json()
            console.log('[createBookingCode] retry bizCode:', retryData?.bizCode)
            if (retryData?.bizCode === 10000 && retryData?.data?.shareCode) {
              return retryData.data.shareCode
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[createBookingCode] live attempt failed:', err)
  }

  // Direct SportyBet fallback
  console.log('[createBookingCode] direct SportyBet fallback')
  const res = await fetch('https://www.sportybet.com/api/ng/orders/share', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ selections: liveSelections }),
  })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  const data = await res.json()
  if (!data || data.bizCode !== 10000) throw new Error(data?.message || 'Failed to generate booking code')
  return data.data?.shareCode || ''
}