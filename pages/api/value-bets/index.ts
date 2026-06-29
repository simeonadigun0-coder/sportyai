// pages/api/value-bets/index.ts
// Module 7 — Value Bet API
// Replaces old value-bets.ts with new engine

import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, canAccessProFeatures, incrementFreeValueBetsUsed } from '@/lib/users'
import { scanForValueBets, getCachedValueBets, buildCombinations } from '@/lib/value-bet-engine'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const freeValueBetsUsed = user.freeValueBetsUsed || 0
  const hasFreeTrials = freeValueBetsUsed < 2 && !user.isAdmin
  const hasSubscription = user.subscriptionTier && user.subscriptionTier !== 'free'
  const canUse = user.isAdmin || hasSubscription || hasFreeTrials

  if (!canUse) {
    return res.status(403).json({
      error: 'Subscription required',
      requiresSubscription: true,
      currentTier: user.subscriptionTier || 'free',
    })
  }

  const { targetMaxOdds = 3.5, forceRefresh = false, daysAhead = 1 } = req.body

  try {
    let result

    if (forceRefresh || user.isAdmin) {
      // Fresh scan
      result = await scanForValueBets(targetMaxOdds, daysAhead)
    } else {
      // Try cached first
      const cached = await getCachedValueBets()
      if (cached.length > 0) {
        const valueBets = buildCombinations(cached, targetMaxOdds)
        result = {
          valueBets: valueBets.slice(0, 20),
          fixturesScanned: cached.length,
          total: valueBets.length,
          summary: `Showing ${cached.length} value picks from today's scan. Use force refresh for updated results.`,
        }
      } else {
        result = await scanForValueBets(targetMaxOdds, daysAhead)
      }
    }

    if (hasFreeTrials && !user.isAdmin) {
      await incrementFreeValueBetsUsed(user.id)
    }

    return res.status(200).json({
      ...result,
      wasFreeTrial: hasFreeTrials,
    })
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to find value bets',
    })
  }
}