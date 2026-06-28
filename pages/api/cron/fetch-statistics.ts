// pages/api/cron/fetch-statistics.ts
// Module 3 — Statistics cron
// Runs daily at 7am — after fixture ingestion at 6am
// Fetches BSD stats for all upcoming fixtures

import { NextApiRequest, NextApiResponse } from 'next'
import { fetchStatisticsForUpcomingFixtures } from '@/lib/statistics'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isDev = process.env.NODE_ENV !== 'production'

  if (!isVercelCron && !isDev) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = await fetchStatisticsForUpcomingFixtures()
   return res.status(200).json({
  ...result,
  timestamp: new Date().toISOString(),
})
  } catch (err) {
    console.error('[cron/fetch-statistics]', err)
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Statistics fetch failed',
    })
  }
}