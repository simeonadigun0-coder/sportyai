// pages/api/builder.ts
// Module 8 — Accumulator Builder API
// FIXED: WAT-aware date range + auto-ingests fixtures if none found in DB

import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, isSubscriptionActive } from '@/lib/users'
import { buildAccumulators, RiskTier } from '@/lib/accumulator-builder'
import {
  getTodayFixtures,
  getTomorrowFixtures,
  getThisWeekFixtures,
  getThisMonthFixtures,
  ingestFixtures,
} from '@/lib/fixtures'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const hasSubscription = isSubscriptionActive(user)
  const canUse = user.isAdmin || hasSubscription

  if (!canUse) {
    return res.status(403).json({
      error: 'Subscription required',
      requiresSubscription: true,
      currentTier: user.subscriptionTier || 'free',
    })
  }

  const {
    tier = 'BALANCED',
    dateRange = 'today',
  } = req.body as {
    tier?: RiskTier
    dateRange?: 'today' | 'tomorrow' | 'week' | 'month'
  }

  const validTiers: RiskTier[] = ['SAFE', 'BALANCED', 'AGGRESSIVE']
  const safeTier: RiskTier = validTiers.includes(tier) ? tier : 'BALANCED'

  // How many days ahead to ingest if DB is empty for this range
  const ingestDaysMap: Record<string, number> = {
    today: 1,
    tomorrow: 2,
    week: 7,
    month: 30,
  }

  // Fetch fixtures for the selected WAT date range
  async function fetchFixtures() {
    switch (dateRange) {
      case 'tomorrow': return getTomorrowFixtures()
      case 'week':     return getThisWeekFixtures()
      case 'month':    return getThisMonthFixtures()
      default:         return getTodayFixtures()
    }
  }

  try {
    let fixtures = await fetchFixtures()

    // Auto-ingest if DB has no fixtures for this date range
    // This handles cases where the daily cron hasn't run yet
    if (fixtures.length === 0) {
      console.log(`[api/builder] No fixtures in DB for "${dateRange}" — auto-ingesting from BSD...`)
      await ingestFixtures(ingestDaysMap[dateRange] || 2)
      fixtures = await fetchFixtures()
    }

    const result = await buildAccumulators(safeTier, 0, 1, user.id, fixtures)
    return res.status(200).json(result)
  } catch (err) {
    console.error('[api/builder]', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Accumulator builder failed',
    })
  }
}