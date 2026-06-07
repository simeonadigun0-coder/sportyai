import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export interface SavedGame {
  eventId: string
  homeTeam: string
  awayTeam: string
  pick: string
  market: string
  odds: number
  league: string
  kickoffTime: string
  replaced?: boolean
  originalPick?: string
  originalOdds?: number
}

export interface SavedSlip {
  id: string
  userId: string
  bookingCode: string
  originalCode: string
  originalOdds: number
  newOdds: number
  targetOdds: number
  games: SavedGame[]
  removedCount: number
  replacedCount: number
  savedAt: string
  status: 'pending' | 'won' | 'lost'
  settledAt?: string
}

export async function saveSlip(userId: string, slip: Omit<SavedSlip, 'id' | 'userId' | 'savedAt' | 'status'>): Promise<SavedSlip> {
  const id = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  const saved: SavedSlip = {
    ...slip,
    id,
    userId,
    savedAt: new Date().toISOString(),
    status: 'pending',
  }

  // Store slip by ID
  await redis.set(`slip:${id}`, saved)

  // Add to user's slip list (newest first)
  await redis.lpush(`user:slips:${userId}`, id)

  // Keep only last 50 slips per user
  await redis.ltrim(`user:slips:${userId}`, 0, 49)

  return saved
}

export async function getUserSlips(userId: string): Promise<SavedSlip[]> {
  try {
    const ids = await redis.lrange(`user:slips:${userId}`, 0, 49) as string[]
    if (!ids.length) return []

    const slips = await Promise.all(
      ids.map(id => redis.get<SavedSlip>(`slip:${id}`))
    )

    return slips.filter(Boolean) as SavedSlip[]
  } catch { return [] }
}

export async function updateSlipStatus(
  slipId: string,
  status: 'won' | 'lost'
): Promise<void> {
  const slip = await redis.get<SavedSlip>(`slip:${slipId}`)
  if (!slip) return
  await redis.set(`slip:${slipId}`, {
    ...slip,
    status,
    settledAt: new Date().toISOString(),
  })
}

export async function getUserStats(userId: string): Promise<{
  total: number
  won: number
  lost: number
  pending: number
  winRate: number
  avgOriginalOdds: number
  avgNewOdds: number
  avgOddsImprovement: number
}> {
  const slips = await getUserSlips(userId)

  const total = slips.length
  const won = slips.filter(s => s.status === 'won').length
  const lost = slips.filter(s => s.status === 'lost').length
  const pending = slips.filter(s => s.status === 'pending').length
  const settled = won + lost
  const winRate = settled > 0 ? Math.round((won / settled) * 100) : 0

  const avgOriginalOdds = total > 0
    ? parseFloat((slips.reduce((a, s) => a + s.originalOdds, 0) / total).toFixed(2))
    : 0

  const avgNewOdds = total > 0
    ? parseFloat((slips.reduce((a, s) => a + s.newOdds, 0) / total).toFixed(2))
    : 0

  const avgOddsImprovement = total > 0
    ? parseFloat(((avgOriginalOdds - avgNewOdds) / avgOriginalOdds * 100).toFixed(1))
    : 0

  return { total, won, lost, pending, winRate, avgOriginalOdds, avgNewOdds, avgOddsImprovement }
}