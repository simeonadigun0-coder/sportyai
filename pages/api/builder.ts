// pages/api/builder.ts
// Module 8 — Accumulator Builder API
// FIXED: Date range now uses WAT-aware fixture query functions

import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, isSubscriptionActive } from '@/lib/users'
import { buildAccumulators, RiskTier } from '@/lib/accumulator-builder'
import {
  getTodayFixtures,
  getTomorrowFixtures,
  getThisWeekFixtures,
  getThisMonthFixtures,
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

  // Map dateRange to the correct WAT-aware fixture fetcher
  let fixtures
  try {
    switch (dateRange) {
      case 'tomorrow':
        fixtures = await getTomorrowFixtures()
        break
      case 'week':
        fixtures = await getThisWeekFixtures()
        break
      case 'month':
        fixtures = await getThisMonthFixtures()
        break
      default:
        fixtures = await getTodayFixtures()
    }
  } catch (err) {
    console.error('[api/builder] fixture fetch failed:', err)
    return res.status(500).json({ error: 'Failed to fetch fixtures' })
  }

  try {
    const result = await buildAccumulators(safeTier, 0, 1, user.id, fixtures)
    return res.status(200).json(result)
  } catch (err) {
    console.error('[api/builder]', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Accumulator builder failed',
    })
  }
}