import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'
import { requireAuth } from '@/lib/auth'

const redis = Redis.fromEnv()

interface ValueBetLeg {
  homeTeam: string
  awayTeam: string
  league: string
  startTime: string
  pick: string
  market: string
  odds: number
  realProb: number
  impliedProbValue: number
  edge: number
  reason: string
  result: 'pending' | 'won' | 'lost'
  finalScore?: string
}

interface ValueBetRecord {
  date: string
  legs: ValueBetLeg[]
  totalOdds: number
  combinedProbability: number
  summary: string
  status: 'active' | 'settled' | 'no_bet'
  generatedAt: string
  settledAt?: string
  overallResult?: 'won' | 'lost'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  try {
    const today = new Date().toISOString().split('T')[0]
    const todayBet = await redis.get<ValueBetRecord>(`value_bet:${today}`)

    const stats = (await redis.get<{ wins: number; total: number }>('value_bet:stats')) || { wins: 0, total: 0 }

    const historyDates = (await redis.get<string[]>('value_bet:history')) || []
    const recentDates = historyDates.slice(0, 14)
    const recentRecords = await Promise.all(
      recentDates.map(d => redis.get<ValueBetRecord>(`value_bet:${d}`))
    )

    const history = recentRecords
      .filter(Boolean)
      .map(r => ({
        date: r!.date,
        status: r!.status,
        overallResult: r!.overallResult,
        totalOdds: r!.totalOdds,
        legsCount: r!.legs.length,
      }))

    return res.status(200).json({
      today: todayBet || null,
      stats: { wins: stats.wins, total: stats.total, winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0 },
      history,
    })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load value bet' })
  }
}
