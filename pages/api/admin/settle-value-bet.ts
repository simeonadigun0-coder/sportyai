import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail } from '@/lib/users'

const redis = Redis.fromEnv()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' })

  const { date, legResults, overallResult } = req.body
  // legResults: array of { index: number, result: 'won' | 'lost', finalScore?: string }
  // overallResult: 'won' | 'lost' (optional override)

  if (!date) return res.status(400).json({ error: 'Date required' })

  try {
    const record = await redis.get<Record<string, unknown>>(`value_bet:${date}`)
    if (!record) return res.status(404).json({ error: 'Value bet record not found for this date' })

    const legs = record.legs as Array<Record<string, unknown>>

    if (legResults && Array.isArray(legResults)) {
      for (const lr of legResults) {
        if (legs[lr.index]) {
          legs[lr.index].result = lr.result
          if (lr.finalScore) legs[lr.index].finalScore = lr.finalScore
        }
      }
    }

    const allWon = legs.every(l => l.result === 'won')
    const finalOverallResult = overallResult || (legs.every(l => l.result !== 'pending') ? (allWon ? 'won' : 'lost') : undefined)

    const updated = {
      ...record,
      legs,
      status: finalOverallResult ? 'settled' : record.status,
      overallResult: finalOverallResult,
      settledAt: finalOverallResult ? new Date().toISOString() : record.settledAt,
    }

    await redis.set(`value_bet:${date}`, updated)

    // Update stats if this is a fresh settlement
    if (finalOverallResult && record.status !== 'settled') {
      const statsKey = 'value_bet:stats'
      const stats = (await redis.get<{ wins: number; total: number }>(statsKey)) || { wins: 0, total: 0 }
      stats.total += 1
      if (finalOverallResult === 'won') stats.wins += 1
      await redis.set(statsKey, stats)
    }

    return res.status(200).json({ success: true, record: updated })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update value bet' })
  }
}