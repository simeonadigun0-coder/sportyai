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

// ─── FIND SAFEST PICK FROM AVAILABLE MARKETS ──────────────────────────────
// Scans all real SportyBet markets for a game and returns the safest pick
// "Safest" = lowest odds above 1.05 (most likely to win)
// This replaces hardcoded replacement options entirely
export function findSafestPickFromMarkets(
  availableMarkets: AvailableMarket[],
  currentMarketId: string,
  currentOutcomeId: string,
  currentOdds: number
): { marketId: string; outcomeId: string; pick: string; market: string; odds: number } | null {
  if (!availableMarkets?.length) return null

  // Priority markets — these are the safest market types
  // Order matters — we prefer Double Chance > Over 0.5 > 1X2 > GG/NG > others
  const SAFE_MARKET_KEYWORDS = [
    'double chance',
    'over/under',
    '1x2',
    'gg/ng',
    'both teams',
    'draw no bet',
  ]

  // Collect ALL valid outcomes across all markets
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

    // Skip corner, booking, half-time markets — too risky
    if (mDesc.includes('corner') || mDesc.includes('booking') ||
        mDesc.includes('card') || mDesc.includes('offside') ||
        mDesc.includes('penalty') || mDesc.includes('minute')) continue

    // Skip the current market+outcome — we want something different
    const isCurrent = m.id === currentMarketId

    // Calculate priority based on market type
    let priority = 99
    for (let i = 0; i < SAFE_MARKET_KEYWORDS.length; i++) {
      if (mDesc.includes(SAFE_MARKET_KEYWORDS[i])) {
        priority = i
        break
      }
    }

    for (const o of m.outcomes) {
      // Skip current pick
      if (isCurrent && o.id === currentOutcomeId) continue

      // Must be genuinely safer than current
      if (o.odds >= currentOdds) continue

      // Must be above minimum viable odds
      if (o.odds <= 1.03) continue

      // Skip very risky Over lines
      const oDesc = o.desc.toLowerCase()
      if (oDesc.startsWith('over')) {
        const num = parseFloat(oDesc.replace(/[^0-9.]/g, ''))
        if (!isNaN(num) && num >= 2.5) continue // Skip Over 2.5+ as replacement
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

  // Sort by: priority first (safer market type), then by odds ascending (safest pick)
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

// ─── RESOLVE CORRECT IDs FOR BOOKING ──────────────────────────────────────
// Uses availableMarkets from decode response to find real marketId/outcomeId
// This is the key function that makes booking codes work correctly
export function resolveBookingIds(
  game: SportyBetGame
): { marketId: string; outcomeId: string } {
  if (!game.availableMarkets?.length) {
    return { marketId: game.marketId, outcomeId: game.outcomeId }
  }

  const targetMarketId = String(game.marketId)
  const targetOutcomeId = String(game.outcomeId)
  const pick = game.pick.toLowerCase().trim()
  const marketDesc = game.market.toLowerCase().trim()

  // Step 1: Exact ID match
  for (const m of game.availableMarkets) {
    if (m.id === targetMarketId) {
      const outcome = m.outcomes.find(o => o.id === targetOutcomeId)
      if (outcome) return { marketId: m.id, outcomeId: outcome.id }
    }
  }

  // Step 2: Match by market description + pick description
  for (const m of game.availableMarkets) {
    const md = m.desc.toLowerCase()
    const marketMatches =
      md === marketDesc || md.includes(marketDesc) || marketDesc.includes(md) ||
      (marketDesc.includes('double chance') && md.includes('double chance')) ||
      (marketDesc === 'gg/ng' && (md.includes('gg') || md.includes('both teams'))) ||
      (marketDesc.includes('over/under') && md.includes('over/under') && !md.includes('corner'))

    if (!marketMatches) continue

    for (const o of m.outcomes) {
      const od = o.desc.toLowerCase()
      let outcomeMatches = false

      if (pick.startsWith('over') || pick.startsWith('under')) {
        const pNum = parseFloat(pick.replace(/[^0-9.]/g, ''))
        const oNum = parseFloat(od.replace(/[^0-9.]/g, ''))
        const dir = pick.startsWith('over') ? 'over' : 'under'
        if (!isNaN(pNum) && !isNaN(oNum)) outcomeMatches = od.startsWith(dir) && Math.abs(oNum - pNum) < 0.1
      } else if (pick === 'home/draw' || pick === '1x') {
        outcomeMatches = od === 'home/draw' || od === '1x' || (od.includes('home') && od.includes('draw'))
      } else if (pick === 'draw/away' || pick === 'x2') {
        outcomeMatches = od === 'draw/away' || od === 'x2' || (od.includes('draw') && od.includes('away'))
      } else if (pick === 'home/away' || pick === '12') {
        outcomeMatches = od === 'home/away' || od === '12'
      } else if (pick === 'home' || pick === '1') {
        outcomeMatches = od === 'home' || od === '1' || od === 'home win'
      } else if (pick === 'away' || pick === '2') {
        outcomeMatches = od === 'away' || od === '2' || od === 'away win'
      } else if (pick === 'draw' || pick === 'x') {
        outcomeMatches = od === 'draw' || od === 'x' || od === 'the draw'
      } else if (pick === 'yes' || pick === 'gg') {
        outcomeMatches = od === 'yes' || od === 'gg'
      } else if (pick === 'no' || pick === 'ng') {
        outcomeMatches = od === 'no' || od === 'ng'
      } else {
        outcomeMatches = od === pick || od.includes(pick) || pick.includes(od)
      }

      if (outcomeMatches) return { marketId: m.id, outcomeId: o.id }
    }
  }

  // Step 3: Fall back to original IDs
  return { marketId: game.marketId, outcomeId: game.outcomeId }
}

// ─── CREATE BOOKING CODE ───────────────────────────────────────────────────
export async function createBookingCode(games: SportyBetGame[]): Promise<string> {
  const PROXY_URL = 'https://sportybet-proxy.grooveslip.workers.dev'
  const PROXY_KEY = 'grooveslip_proxy_2026'

  // Build selections using real IDs from availableMarkets
  // This is the core fix — we use SportyBet's own data from the decode response
  const selections = games.map(g => {
    const resolved = resolveBookingIds(g)
    return {
      eventId: g.eventId,
      marketId: resolved.marketId,
      specifier: g.specifier || null,
      outcomeId: resolved.outcomeId,
    }
  })

  console.log('[createBookingCode] selections:', selections.length, 'games')
  console.log('[createBookingCode] sample:', JSON.stringify(selections.slice(0, 3)))

  // Try via proxy first
  try {
    // Wake proxy
    await fetch(`${PROXY_URL}/health`, {
      headers: { 'X-Proxy-Key': PROXY_KEY },
      signal: AbortSignal.timeout(5000),
    }).catch(() => null)

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

      // bizCode 19000 = expired event — retry removing events one by one
      if (proxyData?.bizCode === 19000) {
        console.log('[createBookingCode] bizCode 19000 — trying to find expired event')
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
                console.log('[createBookingCode] success after removing index', i)
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