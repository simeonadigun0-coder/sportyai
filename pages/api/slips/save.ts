import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail } from '@/lib/users'
import { saveSlip } from '@/lib/slips'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const {
    bookingCode, originalCode, originalOdds, newOdds,
    targetOdds, games, removedCount, replacedCount,
  } = req.body

  if (!bookingCode || !games?.length) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const saved = await saveSlip(user.id, {
      bookingCode,
      originalCode,
      originalOdds,
      newOdds,
      targetOdds,
      games,
      removedCount,
      replacedCount,
    })
    return res.status(200).json(saved)
  } catch {
    return res.status(500).json({ error: 'Failed to save slip' })
  }
}