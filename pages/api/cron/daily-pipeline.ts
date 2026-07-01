// pages/api/cron/daily-pipeline.ts
// Runs at 4am UTC (5am WAT) daily
// Fixture ingestion is handled separately by ingest-fixtures cron at 3am UTC
// This pipeline only runs: stats fetch + value bet scan

import { NextApiRequest, NextApiResponse } from 'next'
import { fetchStatisticsForUpcomingFixtures } from '@/lib/statistics'
import { scanForValueBets } from '@/lib/value-bet-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isDev = process.env.NODE_ENV !== 'production'

  if (!isVercelCron && !isDev) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const start = Date.now()

  try {
    console.log('[daily-pipeline] Starting stats + value bet scan...')

    // Step 1: Fetch BSD stats for all upcoming fixtures
    const statsResult = await fetchStatisticsForUpcomingFixtures()
    console.log(`[daily-pipeline] Stats: ${statsResult.success} success, ${statsResult.failed} failed`)

    // Step 2: Scan for value bets using fresh stats
    const valueBetResult = await scanForValueBets(3.5, 1)
    console.log(`[daily-pipeline] Value bets: ${valueBetResult.total} found`)

    const duration = Date.now() - start

    return res.status(200).json({
      success: true,
      statistics: {
        total: statsResult.total,
        success: statsResult.success,
        failed: statsResult.failed,
      },
      valueBets: {
        total: valueBetResult.total,
        fixturesScanned: valueBetResult.fixturesScanned,
      },
      duration,
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