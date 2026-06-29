// pages/api/cron/daily-pipeline.ts
// Module 9 — Master daily pipeline
// Runs at 5am — ingests fixtures, stats, value bets in sequence

import { NextApiRequest, NextApiResponse } from 'next'
import { runDailyPipeline } from '@/lib/engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isDev = process.env.NODE_ENV !== 'production'

  if (!isVercelCron && !isDev) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = await runDailyPipeline()
    return res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/daily-pipeline]', err)
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Daily pipeline failed',
    })
  }
}