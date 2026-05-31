import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { analyseSlip } from '@/lib/groq'
import { SportyBetGame } from '@/lib/sportybet'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { games, targetOdds, originalTotalOdds, allowSwitching } = req.body as {
    games: SportyBetGame[]
    targetOdds: number
    originalTotalOdds: number
    allowSwitching: boolean
  }

  if (!games || !Array.isArray(games) || games.length === 0) {
    return res.status(400).json({ error: 'Games array is required' })
  }

  if (!targetOdds || targetOdds < 1) {
    return res.status(400).json({ error: 'Valid target odds are required' })
  }

  try {
    const analysis = await analyseSlip(games, targetOdds, originalTotalOdds, allowSwitching || false)
    return res.status(200).json(analysis)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI analysis failed'
    return res.status(500).json({ error: message })
  }
}