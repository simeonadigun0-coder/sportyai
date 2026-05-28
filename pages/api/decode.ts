import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { decodeBookingCode } from '@/lib/sportybet'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { code } = req.body
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Booking code is required' })
  }

  try {
    const slip = await decodeBookingCode(code.trim().toUpperCase())
    return res.status(200).json(slip)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to decode booking code'
    return res.status(400).json({ error: message })
  }
}
