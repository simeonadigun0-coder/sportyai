import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail } from '@/lib/users'

const redis = Redis.fromEnv()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' })

  // GET — load a specific date's record
  if (req.method === 'GET') {
    const { date } = req.query
    if (!date) return res.status(400).json({ error: 'Date required' })
    const record = await redis.get(`value_bet:${date}`)
    if (!record) return res.status(404).json({ error: 'No record found for this date' })
    return res.status(200).json({ record })
  }

  // POST — update settlement
  if (req.method === 'POST') {
    const { date, legResults, overallResult } = req.body
    if (!date) return res.status(400).json({ error: 'Date required' })

    try {
      const record = await redis.get<Record<string, unknown>>(`value_bet:${date}`)
      if (!record) return res.status(404).json({ error: 'No record found for this date' })

      const legs = record.legs as Array<Record<string, unknown>>

      if (legResults && Array.isArray(legResults)) {
        for (const lr of legResults) {
          if (legs[lr.index] !== undefined) {
            legs[lr.index].result = lr.result
            if (lr.finalScore) legs[lr.index].finalScore = lr.finalScore
          }
        }
      }

      const allSettled = legs.every(l => l.result !== 'pending')
      const allWon = legs.every(l => l.result === 'won')
      const finalResult = overallResult || (allSettled ? (allWon ? 'won' : 'lost') : undefined)

      const updated = {
        ...record,
        legs,
        status: finalResult ? 'settled' : record.status,
        overallResult: finalResult,
        settledAt: finalResult ? new Date().toISOString() : record.settledAt,
      }

      await redis.set(`value_bet:${date}`, updated)

      // Update stats only if newly settled
      if (finalResult && record.status !== 'settled') {
        const stats = (await redis.get<{ wins: number; total: number }>('value_bet:stats')) || { wins: 0, total: 0 }
        stats.total += 1
        if (finalResult === 'won') stats.wins += 1
        await redis.set('value_bet:stats', stats)
      }

      return res.status(200).json({ success: true, record: updated })
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}