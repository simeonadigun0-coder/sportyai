// pages/api/builder.ts
// Module 8 — Accumulator Builder API
// Replaces old builder logic with new engine

import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, isSubscriptionActive } from '@/lib/users'
import { buildAccumulators, RiskTier } from '@/lib/accumulator-builder'

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
    legs = 0,
    daysAhead = 1,
  } = req.body as {
    tier?: RiskTier
    legs?: number
    daysAhead?: number
  }

  const validTiers: RiskTier[] = ['SAFE', 'BALANCED', 'AGGRESSIVE']
  const safeTier: RiskTier = validTiers.includes(tier) ? tier : 'BALANCED'

  try {
    const result = await buildAccumulators(
      safeTier,
      legs,
      daysAhead,
      user.id
    )

    return res.status(200).json(result)
  } catch (err) {
    console.error('[api/builder]', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Accumulator builder failed',
    })
  }
}