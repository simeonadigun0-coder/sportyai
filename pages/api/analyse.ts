import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import {
  findUserByEmail,
  incrementSlipsOptimised,
  updateLastActive,
  isSubscriptionActive,
  markFreeAnalysisUsed
} from '@/lib/users'
import { analyseSlip } from '@/lib/groq'
import { SportyBetGame } from '@/lib/sportybet'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Check access — admin, subscription, or free trial
  const hasSubscription = isSubscriptionActive(user)
  const hasFreeTrialLeft = !user.freeAnalysisUsed && !user.isAdmin
  const canAnalyse = user.isAdmin || hasSubscription || hasFreeTrialLeft

  if (!canAnalyse) {
    return res.status(403).json({
      error: 'Subscription required',
      requiresSubscription: true,
    })
  }

  const {
    games,
    targetOdds,
    originalTotalOdds,
    allowSwitching,
    clientMarkets
  } = req.body as {
    games: SportyBetGame[]
    targetOdds: number
    originalTotalOdds: number
    allowSwitching: boolean
    clientMarkets?: Record<string, unknown>
  }

  if (!games || !Array.isArray(games) || games.length === 0) {
    return res.status(400).json({
      error: 'Games array is required'
    })
  }

  if (!targetOdds || targetOdds < 1) {
    return res.status(400).json({
      error: 'Valid target odds are required'
    })
  }

  try {
    const analysis = await analyseSlip(
      games,
      targetOdds,
      originalTotalOdds,
      allowSwitching || false,
      clientMarkets || {},
      user.username
    )

    // Mark free trial as used if applicable
    if (hasFreeTrialLeft) {
      await markFreeAnalysisUsed(user.id)
    }

    // Track usage
    try {
      await incrementSlipsOptimised(user.id)
      await updateLastActive(user.id)
    } catch {
      /* non-critical */
    }

    return res.status(200).json({
      ...analysis,
      wasFreeTrial: hasFreeTrialLeft,
      freeTrialUsed: true,
    })

  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'AI analysis failed'

    return res.status(500).json({
      error: message
    })
  }
}