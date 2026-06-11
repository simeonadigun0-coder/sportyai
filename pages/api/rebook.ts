import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { createBookingCode, SportyBetGame } from '@/lib/sportybet'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { games } = req.body as { games: SportyBetGame[] }
  if (!games || !Array.isArray(games) || games.length === 0) {
    return res.status(400).json({ error: 'Games array is required' })
  }

  try {
    console.log('[rebook] selections:', JSON.stringify(games.map(g => ({
  eventId: g.eventId,
  marketId: g.marketId,
  outcomeId: g.outcomeId,
  pick: g.pick,
  market: g.market,
}))))
const newCode = await createBookingCode(games)
return res.status(200).json({ code: newCode })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate booking code'
    console.error('Rebook error:', message)
    // Return partial success so user can see results even without booking code
    return res.status(200).json({ 
      code: null, 
      error: message,
      games: games.map(g => ({
        match: `${g.homeTeam} vs ${g.awayTeam}`,
        pick: g.pick,
        market: g.market,
        odds: g.odds,
        marketId: g.marketId,
        outcomeId: g.outcomeId,
      }))
    })
  }
}