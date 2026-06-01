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

// Full market replacement hierarchy based on SportyBet Nigeria
export function getSaferAlternatives(
  currentMarketDesc: string,
  currentPick: string,
  currentOdds: number
): Array<{ marketDesc: string; outcomeDesc: string; reason: string }> {
  const market = currentMarketDesc.toLowerCase().trim()
  const pick = currentPick.toLowerCase().trim()

  const alternatives: Array<{ marketDesc: string; outcomeDesc: string; reason: string }> = []

  // ============ OVER/UNDER GOALS ============
  if (market.includes('over/under') && !market.includes('corner') && !market.includes('early')) {
    const num = parseFloat(currentPick.replace(/[^0-9.]/g, ''))

    if (pick.startsWith('over') && !isNaN(num)) {
      // Step down Over line — e.g. Over 2.5 → Over 1.5 → Over 0.5
      if (num >= 4.5) {
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Over 3.5', reason: 'Stepped down from Over 4.5 to Over 3.5 — significantly safer' })
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Over 2.5', reason: 'Stepped down from Over 4.5 to Over 2.5 — much safer' })
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Over 1.5', reason: 'Stepped down to Over 1.5 — very safe' })
      } else if (num >= 3.5) {
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Over 2.5', reason: 'Stepped down from Over 3.5 to Over 2.5 — safer option' })
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Over 1.5', reason: 'Stepped down to Over 1.5 — very safe' })
      } else if (num >= 2.5) {
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Over 1.5', reason: 'Stepped down from Over 2.5 to Over 1.5 — safer and more likely' })
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Over 0.5', reason: 'Stepped down to Over 0.5 — almost certain' })
        alternatives.push({ marketDesc: 'GG/NG', outcomeDesc: 'Yes', reason: 'Both teams to score is a safer goal market alternative' })
      } else if (num >= 1.5) {
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Over 0.5', reason: 'Stepped down from Over 1.5 to Over 0.5 — very likely' })
      }
    }

    if (pick.startsWith('under') && !isNaN(num)) {
      // Step up Under line — e.g. Under 2.5 → Under 3.5
      if (num <= 1.5) {
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Under 2.5', reason: 'Stepped up from Under 1.5 to Under 2.5 — safer' })
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Under 3.5', reason: 'Stepped up to Under 3.5 — very safe' })
      } else if (num <= 2.5) {
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Under 3.5', reason: 'Stepped up from Under 2.5 to Under 3.5 — safer' })
        alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Under 4.5', reason: 'Stepped up to Under 4.5 — very safe' })
      }
    }
  }

  // ============ 1X2 MATCH RESULT ============
  if (market === '1x2') {
    if (pick === 'home' || pick === '1') {
      // Home Win → Double Chance Home/Draw → Draw No Bet Home
      alternatives.push({ marketDesc: 'Double Chance', outcomeDesc: 'Home/Draw', reason: 'Covers Home Win AND Draw — much safer than Home Win alone' })
      alternatives.push({ marketDesc: 'Draw No Bet', outcomeDesc: 'Home', reason: 'Get refund if Draw — safer than straight Home Win' })
      alternatives.push({ marketDesc: '1X2 - 1UP', outcomeDesc: 'Home', reason: 'Home wins if they score 1 goal ahead — still backing home team' })
    }
    if (pick === 'away' || pick === '2') {
      // Away Win → Double Chance X2 → Draw No Bet Away
      alternatives.push({ marketDesc: 'Double Chance', outcomeDesc: 'Draw/Away', reason: 'Covers Away Win AND Draw — much safer than Away Win alone' })
      alternatives.push({ marketDesc: 'Draw No Bet', outcomeDesc: 'Away', reason: 'Get refund if Draw — safer than straight Away Win' })
    }
    if (pick === 'draw' || pick === 'x') {
      // Draw → Double Chance (either side)
      alternatives.push({ marketDesc: 'Double Chance', outcomeDesc: 'Home/Draw', reason: 'Covers Draw and Home Win — safer than betting on draw alone' })
      alternatives.push({ marketDesc: 'Double Chance', outcomeDesc: 'Draw/Away', reason: 'Covers Draw and Away Win — safer than betting on draw alone' })
    }
  }

  // ============ GG/NG ============
  if (market === 'gg/ng' || market.includes('both teams to score')) {
    if (pick === 'yes' || pick === 'gg') {
      // GG Yes is risky — switch to GG No if defensive teams
      alternatives.push({ marketDesc: 'GG/NG', outcomeDesc: 'No', reason: 'Both Teams NOT to score is safer if either team has poor scoring form' })
      alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Over 0.5', reason: 'At least 1 goal scored is almost certain — safer alternative' })
    }
    if (pick === 'no' || pick === 'ng') {
      alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Under 2.5', reason: 'Under 2.5 covers low-scoring games including 0-0, 1-0 outcomes' })
    }
  }

  // ============ 1X2 - 1UP / 2UP ============
  if (market.includes('1up')) {
    if (pick === 'home') {
      alternatives.push({ marketDesc: '1X2', outcomeDesc: 'Home', reason: 'Straight home win without needing 1-goal lead — simpler and safer' })
      alternatives.push({ marketDesc: 'Double Chance', outcomeDesc: 'Home/Draw', reason: 'Covers home and draw outcomes' })
    }
    if (pick === 'away') {
      alternatives.push({ marketDesc: '1X2', outcomeDesc: 'Away', reason: 'Straight away win without needing lead' })
      alternatives.push({ marketDesc: 'Double Chance', outcomeDesc: 'Draw/Away', reason: 'Covers away and draw outcomes' })
    }
  }
  if (market.includes('2up')) {
    if (pick === 'home') {
      alternatives.push({ marketDesc: '1X2 - 1UP', outcomeDesc: 'Home', reason: 'Step down from 2UP to 1UP — only need 1 goal lead' })
      alternatives.push({ marketDesc: '1X2', outcomeDesc: 'Home', reason: 'Straight home win — no goal lead requirement' })
    }
    if (pick === 'away') {
      alternatives.push({ marketDesc: '1X2 - 1UP', outcomeDesc: 'Away', reason: 'Step down from 2UP to 1UP' })
      alternatives.push({ marketDesc: '1X2', outcomeDesc: 'Away', reason: 'Straight away win' })
    }
  }

  // ============ DOUBLE CHANCE ============
  if (market === 'double chance') {
    if (pick.includes('home/draw') || pick.includes('1x')) {
      // Already safe — step up to Home Win for more odds if needed
      alternatives.push({ marketDesc: 'Draw No Bet', outcomeDesc: 'Home', reason: 'Draw No Bet is still safe but gives slightly better odds' })
    }
    if (pick.includes('draw/away') || pick.includes('x2')) {
      alternatives.push({ marketDesc: 'Draw No Bet', outcomeDesc: 'Away', reason: 'Draw No Bet Away — still safe with refund on draw' })
    }
    if (pick.includes('home/away') || pick.includes('12')) {
      alternatives.push({ marketDesc: 'Double Chance', outcomeDesc: 'Home/Draw', reason: 'Home or Draw covers more outcomes than Home or Away' })
    }
  }

  // ============ CORNERS ============
  if (market.includes('corner') && market.includes('over/under')) {
    const num = parseFloat(currentPick.replace(/[^0-9.]/g, ''))
    if (pick.startsWith('over') && !isNaN(num)) {
      if (num >= 10.5) alternatives.push({ marketDesc: market, outcomeDesc: 'Over 9.5', reason: 'Stepped down corner line from 10.5 to 9.5 — safer' })
      if (num >= 9.5) alternatives.push({ marketDesc: market, outcomeDesc: 'Over 8.5', reason: 'Stepped down corner line — more achievable' })
    }
    if (pick.startsWith('under') && !isNaN(num)) {
      if (num <= 9.5) alternatives.push({ marketDesc: market, outcomeDesc: 'Under 10.5', reason: 'Stepped up corner under line — safer' })
    }
  }

  // ============ ANY TEAM GOALS IN A ROW ============
  if (market.includes('goals in a row')) {
    if (market.includes('3 or more')) {
      alternatives.push({
        marketDesc: market.replace('3 or more', '2 or more'),
        outcomeDesc: currentPick,
        reason: 'Step down from 3+ to 2+ goals in a row — more achievable'
      })
    }
    if (market.includes('2 or more')) {
      alternatives.push({ marketDesc: 'GG/NG', outcomeDesc: 'Yes', reason: 'Both teams to score is a simpler and safer alternative' })
    }
  }

  // ============ EARLY GOALS ============
  if (market.includes('early goals')) {
    const num = parseFloat(currentPick.replace(/[^0-9.]/g, ''))
    if (pick.startsWith('over') && !isNaN(num)) {
      if (num >= 2.5) alternatives.push({ marketDesc: market, outcomeDesc: 'Over 1.5', reason: 'Step down early goals line — safer' })
      if (num >= 1.5) alternatives.push({ marketDesc: 'Over/Under', outcomeDesc: 'Over 0.5', reason: 'At least 1 goal overall — much safer' })
    }
  }

  // Filter: only return alternatives with strictly lower odds than current
  // (we'll verify against actual market odds later)
  return alternatives
}

export function findSaferReplacement(
  eventMarkets: EventMarkets,
  currentMarketDesc: string,
  currentPick: string,
  currentOdds: number
): { marketId: string; outcomeId: string; marketDesc: string; pickDesc: string; odds: number; reason: string } | null {

  const alternatives = getSaferAlternatives(currentMarketDesc, currentPick, currentOdds)

  for (const alt of alternatives) {
    // Find the market — flexible matching
    const market = eventMarkets.markets.find(m => {
      const mDesc = m.desc.toLowerCase().trim()
      const targetDesc = alt.marketDesc.toLowerCase().trim()
      return (
        mDesc === targetDesc ||
        mDesc.includes(targetDesc) ||
        targetDesc.includes(mDesc) ||
        // Handle 'Draw No Bet' vs 'DNB' etc
        (targetDesc.includes('draw no bet') && mDesc.includes('dnb')) ||
        (mDesc.includes('draw no bet') && targetDesc.includes('dnb'))
      )
    })

    if (!market) continue

    // Find the outcome — flexible matching
    const outcome = market.outcomes.find(o => {
      const oDesc = o.desc.toLowerCase().trim()
      const targetDesc = alt.outcomeDesc.toLowerCase().trim()

      // For Over/Under — match direction and number
      if (targetDesc.startsWith('over') || targetDesc.startsWith('under')) {
        const targetNum = parseFloat(targetDesc.replace(/[^0-9.]/g, ''))
        const oNum = parseFloat(oDesc.replace(/[^0-9.]/g, ''))
        const direction = targetDesc.startsWith('over') ? 'over' : 'under'
        return oDesc.startsWith(direction) && !isNaN(oNum) && Math.abs(oNum - targetNum) < 0.1
      }

      // For result markets — flexible matching
      if (targetDesc === 'home/draw' || targetDesc === '1x') {
        return oDesc === 'home/draw' || oDesc === '1x' || oDesc === 'home or draw'
      }
      if (targetDesc === 'draw/away' || targetDesc === 'x2') {
        return oDesc === 'draw/away' || oDesc === 'x2' || oDesc === 'draw or away'
      }
      if (targetDesc === 'home/away' || targetDesc === '12') {
        return oDesc === 'home/away' || oDesc === '12' || oDesc === 'home or away'
      }

      return oDesc === targetDesc ||
        oDesc.includes(targetDesc) ||
        targetDesc.includes(oDesc)
    })

    if (!outcome) continue

    // Only use if:
    // 1. Odds are lower than current (safer = lower odds)
    // 2. Odds are greater than 1.0 (valid)
    // 3. Odds are not too low (above 1.03 to be meaningful)
    if (outcome.odds < currentOdds && outcome.odds > 1.03) {
      return {
        marketId: market.id,
        outcomeId: outcome.id,
        marketDesc: market.desc,
        pickDesc: outcome.desc,
        odds: outcome.odds,
        reason: alt.reason,
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