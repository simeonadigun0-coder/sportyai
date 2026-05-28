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
    const newCode = await createBookingCode(games)
    return res.status(200).json({ code: newCode })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate booking code'
    // Provide a fallback message if SportyBet rebooking fails
    return res.status(500).json({
      error: message,
      fallback: true,
      message: 'Could not auto-generate code. You can manually load the selected games on SportyBet.',
    })
  }
}
