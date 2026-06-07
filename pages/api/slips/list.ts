import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail } from '@/lib/users'
import { getUserSlips, getUserStats } from '@/lib/slips'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user) return res.status(404).json({ error: 'User not found' })

  try {
    const [slips, stats] = await Promise.all([
      getUserSlips(user.id),
      getUserStats(user.id),
    ])
    return res.status(200).json({ slips, stats })
  } catch {
    return res.status(500).json({ error: 'Failed to fetch slips' })
  }
}