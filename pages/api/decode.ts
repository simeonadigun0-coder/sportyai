import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Code required' })

  const cleanCode = code.trim().toUpperCase()
  const url = `https://www.sportybet.com/api/ng/orders/share/${cleanCode}?_t=${Date.now()}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en',
        'Origin': 'https://www.sportybet.com',
        'Referer': 'https://www.sportybet.com/ng/',
        'Clientid': 'web',
      }
    })

    const text = await response.text()
    const data = JSON.parse(text)

    if (!data || data.bizCode !== 10000) {
      return res.status(400).json({ error: data?.message || 'Invalid booking code' })
    }

    const outcomes: unknown[] = data.data?.outcomes || []
    const selections: unknown[] = data.data?.ticket?.selections || []
    const displayTotalOdds = parseFloat(data.data?.ticket?.displayTotalOdds || '1')
    const shareCode = data.data?.shareCode || cleanCode

    if (!outcomes.length) {
      return res.status(400).json({ error: 'No games found in this booking code' })
    }

    const games = outcomes.map((item: unknown, index: number) => {
      const g = item as Record<string, unknown>
      const sel = (selections[index] || {}) as Record<string, unknown>

      const exactEventId = String(sel.eventId || g.eventId || index)
      const exactMarketId = String(sel.marketId || '1')
      const exactOutcomeId = String(sel.outcomeId || '1')
      const exactSpecifier = (sel.specifier as string | null) || null

      const sport = g.sport as Record<string, unknown>
      const sportName = (sport?.name as string) || 'Football'
      const category = sport?.category as Record<string, unknown>
      const tournament = category?.tournament as Record<string, unknown>
      const league = (tournament?.name as string) || ''

      // Extract ALL available markets and outcomes from the decode response
      const rawMarkets = (g.markets as unknown[]) || []
      let odds = 1, pick = '', market = '1X2'

      // Build full available markets map for this game
      const availableMarkets: Array<{
        id: string
        desc: string
        outcomes: Array<{ id: string; desc: string; odds: number }>
      }> = []

      rawMarkets.forEach((rm: unknown) => {
        const m = rm as Record<string, unknown>
        const mDesc = (m.desc as string) || (m.name as string) || ''
        const mId = String(m.id || '')
        const mOuts = (m.outcomes as unknown[]) || []

        const mappedOutcomes = mOuts
          .map((o: unknown) => {
            const oc = o as Record<string, unknown>
            return {
              id: String(oc.id || ''),
              desc: (oc.desc as string) || '',
              odds: parseFloat(String(oc.odds || 1)),
              isActive: oc.isActive === 1 || oc.isActive === true,
            }
          })
          .filter(o => o.isActive && o.odds > 1.0)

        if (mOuts.length > 0) {
          availableMarkets.push({
            id: mId,
            desc: mDesc,
            outcomes: mappedOutcomes,
          })
        }

        // The first market is the selected one
        if (availableMarkets.length === 1) {
          market = mDesc || '1X2'
          const matched = mOuts.find((o: unknown) => {
            const oc = o as Record<string, unknown>
            return String(oc.id) === exactOutcomeId
          }) as Record<string, unknown> | undefined

          if (matched) {
            odds = parseFloat(String(matched.odds || 1))
            pick = (matched.desc as string) || ''
          } else if (mOuts.length > 0) {
            const first = mOuts[0] as Record<string, unknown>
            odds = parseFloat(String(first.odds || 1))
            pick = (first.desc as string) || ''
          }
        }
      })

      return {
        eventId: exactEventId,
        homeTeam: (g.homeTeamName as string) || 'Home',
        awayTeam: (g.awayTeamName as string) || 'Away',
        market,
        marketId: exactMarketId,
        outcomeId: exactOutcomeId,
        specifier: exactSpecifier,
        pick,
        odds,
        kickoffTime: String(g.estimateStartTime || ''),
        league,
        sport: sportName,
        // KEY: Pass all available markets so replacement can use real IDs
        availableMarkets,
      }
    })

    return res.status(200).json({
      shareCode,
      totalOdds: parseFloat(displayTotalOdds.toFixed(2)),
      games,
    })

  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : 'Failed to decode booking code',
    })
  }
}