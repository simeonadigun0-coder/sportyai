// pages/api/admin/engine-status.ts
// Module 9 — Engine status endpoint
// Admin only — shows health of all engine modules

import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail } from '@/lib/users'
import { getEngineStatus, getMarketRulesSummary } from '@/lib/engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user?.isAdmin) return res.status(403).json({ error: 'Admin only' })

  try {
    const [status, marketRules] = await Promise.all([
      getEngineStatus(),
      getMarketRulesSummary(),
    ])

    return res.status(200).json({
      status,
      marketRules,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Engine status check failed',
    })
  }
}