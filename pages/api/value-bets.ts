import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, isSubscriptionActive } from '@/lib/users'
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

// Implied probability from odds
function impliedProb(odds: number): number {
  if (!odds || odds <= 1) return 0
  return (1 / odds) * 100
}

// Value exists when our estimated probability > implied probability
function hasValue(realProb: number, impliedProbValue: number): boolean {
  return realProb > impliedProbValue + 5 // 5% edge minimum
}

// Fetch fixtures via Cloudflare Worker
async function fetchFixtures(dateFrom: string, dateTo: string): Promise<unknown[]> {
  try {
    const res = await fetch(`${PROXY_URL}/fixtures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify({ dateFrom, dateTo }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.fixtures || []
  } catch { return [] }
}

// Fetch BSD data for a match
async function getBSDData(homeTeam: string, awayTeam: string): Promise<Record<string, unknown> | null> {
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
      return det.ok ? await det.json() : ev
    }
  } catch { }
  return null
}

// Fetch Sofascore odds for a match
async function getSofascoreOdds(sofaId: number): Promise<{ home: number; draw: number; away: number } | null> {
  try {
    const res = await fetch(`${SOFA_BASE}/event/${sofaId}/odds/1/all/1`, { headers: sofaHeaders, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    const markets = data.markets || []
    const fullTime = markets.find((m: unknown) => (m as Record<string, unknown>).marketName === 'Full time')
    if (!fullTime) return null
    const choices = (fullTime as Record<string, unknown>).choices as unknown[] || []
    const home = choices.find((c: unknown) => (c as Record<string, unknown>).name === '1')
    const draw = choices.find((c: unknown) => (c as Record<string, unknown>).name === 'X')
    const away = choices.find((c: unknown) => (c as Record<string, unknown>).name === '2')
    if (!home || !draw || !away) return null
    return {
      home: parseFloat((home as Record<string, unknown>).fractionalValue as string || '0') || parseFloat((home as Record<string, unknown>).decimalValue as string || '0'),
      draw: parseFloat((draw as Record<string, unknown>).fractionalValue as string || '0') || parseFloat((draw as Record<string, unknown>).decimalValue as string || '0'),
      away: parseFloat((away as Record<string, unknown>).fractionalValue as string || '0') || parseFloat((away as Record<string, unknown>).decimalValue as string || '0'),
    }
  } catch { return null }
}

// Analyse a fixture for value
async function analyseFixtureForValue(fixture: Record<string, unknown>): Promise<unknown | null> {
  const homeTeam = fixture.homeTeam as string
  const awayTeam = fixture.awayTeam as string
  const league = fixture.league as string
  const startTime = fixture.startTime as string

  // Get BSD data and Sofascore odds in parallel
  const [bsdData, sofaOdds] = await Promise.all([
    getBSDData(homeTeam, awayTeam),
    fixture.sofaId ? getSofascoreOdds(fixture.sofaId as number) : Promise.resolve(null),
  ])

  if (!bsdData) return null

  const pred = bsdData.prediction as Record<string, unknown> | null
  const hf = bsdData.home_form as Record<string, unknown> | null
  const af = bsdData.away_form as Record<string, unknown> | null
  const h2h = bsdData.head_to_head as Record<string, unknown> | null

  if (!pred) return null

  const probHome = Number(pred.prob_home_win || 0)
  const probDraw = Number(pred.prob_draw || 0)
  const probAway = Number(pred.prob_away_win || 0)
  const predResult = String(pred.predicted_result || '')

  if (!probHome && !probDraw && !probAway) return null

  // Use Sofascore odds if available, otherwise use fixture odds
  const homeOdds = sofaOdds?.home || fixture.homeOdds as number || 0
  const drawOdds = sofaOdds?.draw || fixture.drawOdds as number || 0
  const awayOdds = sofaOdds?.away || fixture.awayOdds as number || 0

  if (!homeOdds && !drawOdds && !awayOdds) return null

  // Check for value in each outcome
  const valueBets: unknown[] = []

  if (homeOdds > 1 && hasValue(probHome, impliedProb(homeOdds))) {
    valueBets.push({
      pick: 'Home Win',
      market: '1X2',
      odds: homeOdds,
      realProb: probHome,
      impliedProb: impliedProb(homeOdds),
      edge: probHome - impliedProb(homeOdds),
    })
  }
  if (drawOdds > 1 && hasValue(probDraw, impliedProb(drawOdds))) {
    valueBets.push({
      pick: 'Draw',
      market: '1X2',
      odds: drawOdds,
      realProb: probDraw,
      impliedProb: impliedProb(drawOdds),
      edge: probDraw - impliedProb(drawOdds),
    })
  }
  if (awayOdds > 1 && hasValue(probAway, impliedProb(awayOdds))) {
    valueBets.push({
      pick: 'Away Win',
      market: '1X2',
      odds: awayOdds,
      realProb: probAway,
      impliedProb: impliedProb(awayOdds),
      edge: probAway - impliedProb(awayOdds),
    })
  }

  if (valueBets.length === 0) return null

  // Pick best value bet (highest edge)
  const best = (valueBets as Array<Record<string, unknown>>).sort((a, b) => (b.edge as number) - (a.edge as number))[0]

  // Build stats summary
  const stats: string[] = []
  if (hf) stats.push(`${homeTeam} form: ${hf.form_string || '?'} W${hf.wins}D${hf.draws}L${hf.losses}`)
  if (af) stats.push(`${awayTeam} form: ${af.form_string || '?'} W${af.wins}D${af.draws}L${af.losses}`)
  if (h2h) stats.push(`H2H: Home wins ${h2h.home_wins}, Draws ${h2h.draws}, Away wins ${h2h.away_wins}`)
  if (pred) stats.push(`Prediction: ${predResult} (H:${probHome}% D:${probDraw}% A:${probAway}%)`)

  return {
    homeTeam,
    awayTeam,
    league,
    startTime,
    pick: best.pick,
    market: best.market,
    odds: best.odds,
    realProbability: Math.round(best.realProb as number),
    impliedProbability: Math.round(best.impliedProb as number),
    edge: Math.round((best.edge as number) * 10) / 10,
    predictionResult: predResult,
    stats: stats.join(' | '),
    confidence: Math.min(99, Math.round(best.realProb as number)),
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const hasAccess = user.isAdmin || isSubscriptionActive(user) || !user.freeAnalysisUsed
  if (!hasAccess) return res.status(403).json({ error: 'Subscription required', requiresSubscription: true })

  const { dateFrom, dateTo, maxBets = 5 } = req.body

  try {
    const today = new Date().toISOString().split('T')[0]
    const from = dateFrom || today
    const to = dateTo || today

    // Fetch fixtures
    const fixtures = await fetchFixtures(from, to)
    if (!fixtures.length) {
      return res.status(200).json({ valueBets: [], message: 'No fixtures found for this date range' })
    }

    // Analyse fixtures for value — process in batches of 10
    const valueBets: unknown[] = []
    const BATCH = 10

    for (let i = 0; i < Math.min(fixtures.length, 50); i += BATCH) {
      const batch = fixtures.slice(i, i + BATCH) as Record<string, unknown>[]
      const results = await Promise.all(batch.map(f => analyseFixtureForValue(f)))
      const found = results.filter(Boolean)
      valueBets.push(...found)
      if (valueBets.length >= maxBets * 2) break // get extra then trim
    }

    // Sort by edge (highest value first) and take top N
    const sorted = (valueBets as Array<Record<string, unknown>>)
      .sort((a, b) => (b.edge as number) - (a.edge as number))
      .slice(0, maxBets)

    // Generate AI summary
    let summary = `Found ${sorted.length} value bets from ${fixtures.length} fixtures analysed.`
    if (sorted.length > 0) {
      try {
        const sc = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Write short punter-friendly summaries. Nigerian casual tone. 2 sentences max. No markdown.' },
            { role: 'user', content: `Found ${sorted.length} value bets today from ${fixtures.length} fixtures. Top pick: ${(sorted[0] as Record<string, unknown>).homeTeam} vs ${(sorted[0] as Record<string, unknown>).awayTeam} — ${(sorted[0] as Record<string, unknown>).pick} at ${(sorted[0] as Record<string, unknown>).odds} odds with ${(sorted[0] as Record<string, unknown>).edge}% edge over bookmaker. Summarise this for a punter.` }
          ],
          temperature: 0.5,
          max_tokens: 80,
        })
        summary = sc.choices[0]?.message?.content || summary
      } catch { }
    }

    return res.status(200).json({ valueBets: sorted, total: sorted.length, fixturesAnalysed: fixtures.length, summary })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to find value bets' })
  }
}