// pages/api/cron/ingest-fixtures.ts
// Module 2 — Daily fixture ingestion cron
// Runs at 4am WAT daily via Vercel cron
// Ingests 30 days ahead by default so DB is always pre-stocked
// Can override with ?days=N query param for manual runs

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
    // Default 30 days ahead — keeps DB stocked for a full month
    // Override with ?days=N for manual runs e.g. ?days=7
    const daysAhead = req.query.days ? parseInt(req.query.days as string) : 30

    const result = await ingestFixturesWithFallback(daysAhead)

    return res.status(200).json({
      success: true,
      ...result,
      daysAhead,
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