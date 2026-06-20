import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const PROXY_URL = 'https://sportybet-proxy.grooveslip.workers.dev'
const PROXY_KEY = 'grooveslip_proxy_2026'

interface ValueBetLeg {
  homeTeam: string
  awayTeam: string
  league: string
  startTime: string
  sofaSearchName: string
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

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Search Sofascore for match result using the Cloudflare Worker (avoids IP block)
async function searchSofascoreResult(homeTeam: string, awayTeam: string, dateStr: string): Promise<{ homeScore: number; awayScore: number; finished: boolean } | null> {
  try {
    const res = await fetch(`${PROXY_URL}/fixtures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify({ dateFrom: dateStr, dateTo: dateStr, useSofaDirectly: true }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const fixtures = data.fixtures || []

    const match = fixtures.find((f: Record<string, unknown>) => {
      const fh = normalize(f.homeTeam as string || '')
      const fa = normalize(f.awayTeam as string || '')
      const th = normalize(homeTeam)
      const ta = normalize(awayTeam)
      return (fh.includes(th.split(' ')[0]) || th.includes(fh.split(' ')[0])) &&
             (fa.includes(ta.split(' ')[0]) || ta.includes(fa.split(' ')[0]))
    })

    if (!match || !match.homeScore && match.homeScore !== 0) return null
    return {
      homeScore: Number(match.homeScore),
      awayScore: Number(match.awayScore),
      finished: match.status === 'finished' || match.finished === true,
    }
  } catch { return null }
}

// Evaluate if a pick won based on final score
function evaluatePick(pick: string, market: string, homeScore: number, awayScore: number): boolean {
  const p = pick.toLowerCase()
  const totalGoals = homeScore + awayScore

  if (p === 'home win') return homeScore > awayScore
  if (p === 'away win') return awayScore > homeScore
  if (p === 'draw') return homeScore === awayScore
  if (p.includes('double chance (1x)')) return homeScore >= awayScore
  if (p.includes('double chance (x2)')) return awayScore >= homeScore
  if (p.includes('over 0.5')) return totalGoals >= 1
  if (p.includes('over 1.5')) return totalGoals >= 2
  if (p.includes('over 2.5')) return totalGoals >= 3
  if (p.includes('over 3.5')) return totalGoals >= 4
  if (p.includes('under 2.5')) return totalGoals <= 2
  if (p.includes('under 3.5')) return totalGoals <= 3
  if (p.includes('under 4.5')) return totalGoals <= 4
  if (p.includes('both teams to score') && p.includes('yes')) return homeScore > 0 && awayScore > 0
  if (p.includes('both teams to score') && p.includes('no')) return homeScore === 0 || awayScore === 0

  return false // unknown market — needs manual review
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const record = await redis.get<ValueBetRecord>(`value_bet:${today}`)

    if (!record || record.status !== 'active' || record.legs.length === 0) {
      return res.status(200).json({ success: true, message: 'No active value bet to settle today' })
    }

    let allResolved = true
    let allWon = true

    for (const leg of record.legs) {
      if (leg.result !== 'pending') continue

      const result = await searchSofascoreResult(leg.homeTeam, leg.awayTeam, today)
      if (!result || !result.finished) {
        allResolved = false
        continue
      }

      const won = evaluatePick(leg.pick, leg.market, result.homeScore, result.awayScore)
      leg.result = won ? 'won' : 'lost'
      leg.finalScore = `${result.homeScore}-${result.awayScore}`
      if (!won) allWon = false
    }

    if (allResolved) {
      record.status = 'settled'
      record.settledAt = new Date().toISOString()
      record.overallResult = allWon ? 'won' : 'lost'

      // Update running streak stats
      const statsKey = 'value_bet:stats'
      const stats = (await redis.get<{ wins: number; total: number }>(statsKey)) || { wins: 0, total: 0 }
      stats.total += 1
      if (allWon) stats.wins += 1
      await redis.set(statsKey, stats)
    }

    await redis.set(`value_bet:${today}`, record)

    return res.status(200).json({
      success: true,
      allResolved,
      overallResult: record.overallResult,
      legs: record.legs,
    })
  } catch (err) {
    console.error('[settle-value-bet] error:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to settle value bet' })
  }
}