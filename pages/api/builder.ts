import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, isSubscriptionActive } from '@/lib/users'
import { createBookingCode } from '@/lib/sportybet'
import Groq from 'groq-sdk'

const PROXY_URL = 'https://sportybet-proxy.grooveslip.workers.dev'
const PROXY_KEY = 'grooveslip_proxy_2026'
const BSD_BASE = 'https://sports.bzzoiro.com/api'
const SOFA_BASE = 'https://api.sofascore.com/api/v1'
const BSD_TOKEN = process.env.BSD_API_KEY || ''

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }
const sofaHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Referer': 'https://www.sofascore.com/',
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}
function teamsMatch(a: string, b: string, c: string, d: string) {
  const fw = (s: string) => normalize(s).split(' ')[0]
  return normalize(a).includes(fw(c)) && normalize(b).includes(fw(d))
}

// Fetch fixtures via Cloudflare Worker
async function fetchFixtures(dateFrom: string, dateTo: string): Promise<unknown[]> {
  try {
    const res = await fetch(`${PROXY_URL}/fixtures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify({ dateFrom, dateTo }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.fixtures || []
  } catch { return [] }
}

// Get BSD analysis for a fixture
async function getBSDAnalysis(homeTeam: string, awayTeam: string): Promise<{
  probHome: number; probDraw: number; probAway: number
  predResult: string; homeForm: string; awayForm: string
  h2hSummary: string; avgGoals: number; hasData: boolean
}> {
  const empty = { probHome: 0, probDraw: 0, probAway: 0, predResult: '', homeForm: '', awayForm: '', h2hSummary: '', avgGoals: 2.5, hasData: false }
  try {
    const yesterday = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
    const next2w = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    for (const term of [homeTeam, homeTeam.split(' ')[0], awayTeam]) {
      const res = await fetch(
        `${BSD_BASE}/events/?team=${encodeURIComponent(term)}&date_from=${yesterday}&date_to=${next2w}&limit=20`,
        { headers: bsdHeaders, signal: AbortSignal.timeout(5000) }
      )
      if (!res.ok) continue
      const data = await res.json()
      const match = (data.results || []).find((e: unknown) => {
        const ev = e as Record<string, unknown>
        return teamsMatch(ev.home_team as string || '', ev.away_team as string || '', homeTeam, awayTeam)
      })
      if (!match) continue
      const ev = match as Record<string, unknown>
      const det = await fetch(`${BSD_BASE}/events/${ev.id}/`, { headers: bsdHeaders, signal: AbortSignal.timeout(5000) })
      if (!det.ok) continue
      const event = await det.json()
      const hf = event.home_form as Record<string, unknown> | null
      const af = event.away_form as Record<string, unknown> | null
      const h2h = event.head_to_head as Record<string, unknown> | null
      const pred = event.prediction as Record<string, unknown> | null
      const h2hGoals = Number(h2h?.total_goals || 0)
      const h2hTotal = Number(h2h?.total_matches || 1)
      return {
        probHome: Number(pred?.prob_home_win || 0),
        probDraw: Number(pred?.prob_draw || 0),
        probAway: Number(pred?.prob_away_win || 0),
        predResult: String(pred?.predicted_result || ''),
        homeForm: String(hf?.form_string || ''),
        awayForm: String(af?.form_string || ''),
        h2hSummary: h2h ? `HW${h2h.home_wins}D${h2h.draws}AW${h2h.away_wins}` : '',
        avgGoals: h2hTotal > 0 ? h2hGoals / h2hTotal : 2.5,
        hasData: true,
      }
    }
  } catch { }
  return empty
}

// Score a fixture for accumulator selection
// Returns a score 0-100 and the best pick
function scoreFixture(
  fixture: Record<string, unknown>,
  bsd: ReturnType<typeof getBSDAnalysis> extends Promise<infer T> ? T : never,
  riskLevel: 'low' | 'medium' | 'high'
): { score: number; pick: string; market: string; marketId: string; outcomeId: string; estimatedOdds: number; reason: string } | null {
  const { probHome, probDraw, probAway, predResult, homeForm, awayForm, avgGoals, hasData } = bsd
  const homeOdds = fixture.homeOdds as number || 0
  const drawOdds = fixture.drawOdds as number || 0
  const awayOdds = fixture.awayOdds as number || 0

  if (!hasData && !homeOdds) return null

  // Determine target probability based on risk level
  const minProb = riskLevel === 'low' ? 70 : riskLevel === 'medium' ? 55 : 45
  const maxOdds = riskLevel === 'low' ? 1.5 : riskLevel === 'medium' ? 2.5 : 4.0

  const candidates: Array<{ score: number; pick: string; market: string; marketId: string; outcomeId: string; estimatedOdds: number; reason: string }> = []

  // Evaluate home win
  if (probHome >= minProb || (!hasData && homeOdds > 0 && homeOdds <= maxOdds)) {
    const score = hasData ? probHome : (1 / homeOdds) * 100
    const winsInRow = (homeForm.match(/W/g) || []).length
    candidates.push({
      score,
      pick: 'Home',
      market: '1X2',
      marketId: '1',
      outcomeId: '1',
      estimatedOdds: homeOdds || 1.5,
      reason: hasData ? `${probHome}% home win probability${winsInRow >= 3 ? `, ${winsInRow} wins in recent form` : ''}` : `Home odds ${homeOdds} — reasonable value`,
    })
  }

  // Evaluate away win
  if (probAway >= minProb || (!hasData && awayOdds > 0 && awayOdds <= maxOdds)) {
    const score = hasData ? probAway : (1 / awayOdds) * 100
    const winsInRow = (awayForm.match(/W/g) || []).length
    candidates.push({
      score,
      pick: 'Away',
      market: '1X2',
      marketId: '1',
      outcomeId: '3',
      estimatedOdds: awayOdds || 2.0,
      reason: hasData ? `${probAway}% away win probability${winsInRow >= 3 ? `, ${winsInRow} wins in recent form` : ''}` : `Away odds ${awayOdds}`,
    })
  }

  // Evaluate Over 1.5 (for medium/high risk or when goal data supports)
  if (riskLevel !== 'low' && avgGoals >= 2.0) {
    candidates.push({
      score: Math.min(75, avgGoals * 20),
      pick: 'Over 1.5',
      market: 'Over/Under',
      marketId: '18',
      outcomeId: '12',
      estimatedOdds: 1.3,
      reason: `Average ${avgGoals.toFixed(1)} goals per H2H game supports Over 1.5`,
    })
  }

  // Evaluate Over 0.5 (very safe for low risk)
  if (riskLevel === 'low' && avgGoals >= 1.0) {
    candidates.push({
      score: 80,
      pick: 'Over 0.5',
      market: 'Over/Under',
      marketId: '18',
      outcomeId: '12',
      estimatedOdds: 1.1,
      reason: `${avgGoals.toFixed(1)} avg goals — almost certain to have at least 1 goal`,
    })
  }

  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const hasAccess = user.isAdmin || isSubscriptionActive(user) || !user.freeAnalysisUsed
  if (!hasAccess) return res.status(403).json({ error: 'Subscription required', requiresSubscription: true })

  const {
    targetOdds = 10,
    riskLevel = 'medium',
    dateRange = 'today',
  } = req.body

  try {
    // Calculate date range
    const today = new Date()
    const dateFrom = today.toISOString().split('T')[0]
    let dateTo = dateFrom
    if (dateRange === 'tomorrow') {
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
      dateTo = tomorrow.toISOString().split('T')[0]
    } else if (dateRange === 'week') {
      const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7)
      dateTo = nextWeek.toISOString().split('T')[0]
    } else if (dateRange === 'month') {
      const nextMonth = new Date(today); nextMonth.setDate(today.getDate() + 30)
      dateTo = nextMonth.toISOString().split('T')[0]
    }

    // Fetch fixtures
    const fixtures = await fetchFixtures(dateFrom, dateTo)
    if (!fixtures.length) {
      return res.status(200).json({ games: [], bookingCode: null, message: 'No fixtures found for this date range' })
    }

    // Analyse fixtures in batches — get BSD data
    const analysedFixtures: Array<{
      fixture: Record<string, unknown>
      bsd: Awaited<ReturnType<typeof getBSDAnalysis>>
      scored: ReturnType<typeof scoreFixture>
    }> = []

    const BATCH = 8
    for (let i = 0; i < Math.min(fixtures.length, 60); i += BATCH) {
      const batch = fixtures.slice(i, i + BATCH) as Record<string, unknown>[]
      const results = await Promise.all(batch.map(async f => {
        const bsd = await getBSDAnalysis(f.homeTeam as string, f.awayTeam as string)
        const scored = scoreFixture(f, bsd, riskLevel as 'low' | 'medium' | 'high')
        return { fixture: f, bsd, scored }
      }))
      for (const r of results) {
        if (r.scored) analysedFixtures.push(r)
      }
    }

    if (!analysedFixtures.length) {
      return res.status(200).json({ games: [], bookingCode: null, message: 'Could not find suitable fixtures for your criteria' })
    }

    // Sort by score descending
    analysedFixtures.sort((a, b) => (b.scored!.score) - (a.scored!.score))

    // Select games to meet target odds
    const selectedGames: typeof analysedFixtures = []
    let currentOdds = 1.0

    for (const item of analysedFixtures) {
      if (currentOdds >= targetOdds) break
      const gameOdds = item.scored!.estimatedOdds
      if (gameOdds <= 1.0) continue
      // Don't add games that would massively overshoot
      if (currentOdds * gameOdds > targetOdds * 3 && selectedGames.length > 0) continue
      selectedGames.push(item)
      currentOdds *= gameOdds
    }

    // If we haven't reached target odds, keep adding
    if (currentOdds < targetOdds && selectedGames.length < analysedFixtures.length) {
      for (const item of analysedFixtures) {
        if (selectedGames.includes(item)) continue
        if (currentOdds >= targetOdds) break
        selectedGames.push(item)
        currentOdds *= item.scored!.estimatedOdds
      }
    }

    if (!selectedGames.length) {
      return res.status(200).json({ games: [], bookingCode: null, message: 'No suitable games found' })
    }

    // Build game objects for booking
    const games = selectedGames.map(item => ({
      eventId: item.fixture.eventId as string,
      homeTeam: item.fixture.homeTeam as string,
      awayTeam: item.fixture.awayTeam as string,
      market: item.scored!.market,
      marketId: item.scored!.marketId,
      outcomeId: item.scored!.outcomeId,
      specifier: null,
      pick: item.scored!.pick,
      odds: item.scored!.estimatedOdds,
      kickoffTime: item.fixture.startTime as string || '',
      league: item.fixture.league as string || '',
      sport: 'Football',
      reason: item.scored!.reason,
      confidence: Math.round(item.scored!.score),
      homeForm: item.bsd.homeForm,
      awayForm: item.bsd.awayForm,
    }))

    const totalOdds = games.reduce((acc, g) => acc * g.odds, 1)

    // Try to create booking code
    let bookingCode: string | null = null
    // Only try booking if we have real SportyBet event IDs (not sofa: prefixed)
    const bookableGames = games.filter(g => !g.eventId.startsWith('sofa:'))
    if (bookableGames.length > 0) {
      try {
        bookingCode = await createBookingCode(bookableGames)
      } catch (err) {
        console.error('[builder] booking code failed:', err)
      }
    }

    // Generate summary
    let summary = `Built ${games.length} game accumulator at ${totalOdds.toFixed(2)} odds (target: ${targetOdds}). ${bookingCode ? 'Booking code ready.' : 'Load games manually on SportyBet.'}`
    try {
      const sc = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Write short punter-friendly summaries. Nigerian casual tone. 2 sentences max. No markdown, no team names.' },
          { role: 'user', content: `Built ${games.length} game accumulator at ${totalOdds.toFixed(2)} odds targeting ${targetOdds}. Risk level: ${riskLevel}. ${bookingCode ? 'Booking code generated.' : 'No booking code yet.'} Summarise for punter.` }
        ],
        temperature: 0.5,
        max_tokens: 80,
      })
      summary = sc.choices[0]?.message?.content || summary
    } catch { }

    return res.status(200).json({
      games,
      bookingCode,
      totalOdds: parseFloat(totalOdds.toFixed(2)),
      targetOdds,
      riskLevel,
      dateRange,
      summary,
    })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to build accumulator' })
  }
}