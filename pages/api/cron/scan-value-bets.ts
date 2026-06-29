// pages/api/cron/scan-value-bets.ts
// Module 7 — Daily value bet scan cron
// Runs at 9am — after fixtures (6am) and stats (7am) are ready

import { NextApiRequest, NextApiResponse } from 'next'
import { scanForValueBets } from '@/lib/value-bet-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isDev = process.env.NODE_ENV !== 'production'

  if (!isVercelCron && !isDev) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const maxOdds = req.query.maxOdds ? parseFloat(req.query.maxOdds as string) : 3.5
    const result = await scanForValueBets(maxOdds, 1)

    return res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/scan-value-bets]', err)
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Value bet scan failed',
    })
  }
}