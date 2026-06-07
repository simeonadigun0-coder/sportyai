import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { updateSlipStatus } from '@/lib/slips'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const { slipId, status } = req.body
  if (!slipId || !['won', 'lost'].includes(status)) {
    return res.status(400).json({ error: 'slipId and status (won/lost) required' })
  }

  try {
    await updateSlipStatus(slipId, status)
    return res.status(200).json({ success: true })
  } catch {
    return res.status(500).json({ error: 'Failed to update slip' })
  }
}