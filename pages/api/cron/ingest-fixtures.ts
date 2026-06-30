// pages/api/cron/ingest-fixtures.ts
// Module 2 — Daily fixture ingestion cron
// Runs automatically at 6am via Vercel cron
// Can also be triggered manually for testing

import { NextApiRequest, NextApiResponse } from 'next'
import { ingestFixturesWithFallback } from '@/lib/fixtures'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isDev = process.env.NODE_ENV !== 'production'

  if (!isVercelCron && !isDev) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const daysAhead = req.query.days ? parseInt(req.query.days as string) : 2
    const result = await ingestFixturesWithFallback(daysAhead)

    return res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/ingest-fixtures]', err)
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Fixture ingestion failed',
    })
  }
}