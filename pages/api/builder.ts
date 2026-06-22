import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, isSubscriptionActive, incrementFreeBuilderUsed } from '@/lib/users'
import Groq from 'groq-sdk'

const BSD_BASE = 'https://sports.bzzoiro.com/api'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── FETCH ALL FIXTURES (paginated across all leagues) ─────────────────────
async function fetchAllFixtures(dateFrom: string, dateTo: string): Promise<unknown[]> {
  const allFixtures: unknown[] = []
  await Promise.all([0, 100, 200, 300].map(async offset => {
    try {
      const res = await fetch(
        `${BSD_BASE}/events/?date_from=${dateFrom}&date_to=${dateTo}&limit=100&offset=${offset}&sport=1`,
        { headers: bsdHeaders, signal: AbortSignal.timeout(12000) }
      )
      if (!res.ok) return
      const data = await res.json()
      allFixtures.push(...(data.results || []))
    } catch { }
  }))
  const seen = new Set<number>()
  return allFixtures.filter(f => {
    const id = (f as Record<string, unknown>).id as number
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

async function fetchEventDetail(id: number): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${BSD_BASE}/events/${id}/`, { headers: bsdHeaders, signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

interface ScoredPick {
  pick: string
  market: string
  tier: 1 | 2
  confidence: number
  estimatedOdds: number
  reason: string
}

// ─── RISK THRESHOLDS ────────────────────────────────────────────────────────
const RISK = {
  low:    { minConf: 82, minOdds: 1.05, maxOdds: 1.8  },
  medium: { minConf: 72, minOdds: 1.10, maxOdds: 2.5  },
  high:   { minConf: 62, minOdds: 1.15, maxOdds: 4.0  },
}

// ─── CORE SCORING ENGINE ───────────────────────────────────────────────────
// Evaluates all 16 preferred markets per fixture using H2H + form + BSD prediction
// Returns the smartest single pick per game — not the safest, but the most likely
function scorePicks(
  fixture: Record<string, unknown>,
  detail: Record<string, unknown>,
  riskLevel: 'low' | 'medium' | 'high'
): ScoredPick[] {
  const hf = detail.home_form as Record<string, unknown> | null
  const af = detail.away_form as Record<string, unknown> | null
  const h2h = detail.head_to_head as Record<string, unknown> | null
  const pred = detail.prediction as Record<string, unknown> | null
  const unavail = detail.unavailable_players as Record<string, unknown> | null
  const srStats = detail.sr_stats as Record<string, unknown> | null

  const homeTeam = fixture.home_team as string
  const awayTeam = fixture.away_team as string

  const probHome = Number(pred?.prob_home_win || 0)
  const probDraw  = Number(pred?.prob_draw || 0)
  const probAway  = Number(pred?.prob_away_win || 0)

  const homeWins    = Number(hf?.wins || 0)
  const homeDraws   = Number(hf?.draws || 0)
  const homeLosses  = Number(hf?.losses || 0)
  const homePlayed  = homeWins + homeDraws + homeLosses || 1
  const homeScored  = Number(hf?.goals_scored_last_n || 0)
  const homeConceded= Number((hf as Record<string,unknown>)?.goals_conceded_last_n || 0)
  const homeAvgScored   = homeScored / homePlayed
  const homeAvgConceded = homeConceded / homePlayed
  const homeWinRate     = (homeWins / homePlayed) * 100
  const homeUnbeatenRate= ((homeWins + homeDraws) / homePlayed) * 100
  const homeFormStr     = String(hf?.form_string || '')
  const homeRecentForm  = homeFormStr.length > 0 ? (homeFormStr.match(/W/g)||[]).length / homeFormStr.length : 0.5

  const awayWins    = Number(af?.wins || 0)
  const awayDraws   = Number(af?.draws || 0)
  const awayLosses  = Number(af?.losses || 0)
  const awayPlayed  = awayWins + awayDraws + awayLosses || 1
  const awayScored  = Number(af?.goals_scored_last_n || 0)
  const awayConceded= Number((af as Record<string,unknown>)?.goals_conceded_last_n || 0)
  const awayAvgScored   = awayScored / awayPlayed
  const awayAvgConceded = awayConceded / awayPlayed
  const awayWinRate     = (awayWins / awayPlayed) * 100
  const awayUnbeatenRate= ((awayWins + awayDraws) / awayPlayed) * 100
  const awayFormStr     = String(af?.form_string || '')
  const awayRecentForm  = awayFormStr.length > 0 ? (awayFormStr.match(/W/g)||[]).length / awayFormStr.length : 0.5

  const h2hHW = Number(h2h?.home_wins || 0)
  const h2hD  = Number(h2h?.draws || 0)
  const h2hAW = Number(h2h?.away_wins || 0)
  const h2hTotal   = h2hHW + h2hD + h2hAW || 1
  const h2hGoals   = Number((h2h as Record<string,unknown>)?.total_goals || 0)
  const h2hAvgGoals= h2hGoals / h2hTotal
  const h2hHomeUnbeaten = ((h2hHW + h2hD) / h2hTotal) * 100
  const h2hAwayUnbeaten = ((h2hAW + h2hD) / h2hTotal) * 100

  const homeInjured = (unavail?.home as unknown[] || []).length
  const awayInjured = (unavail?.away as unknown[] || []).length

  const expectedGoals  = ((homeAvgScored + awayAvgConceded) / 2) + ((awayAvgScored + homeAvgConceded) / 2)
  const combinedAvgGoals = (expectedGoals + h2hAvgGoals) / 2

  const srDangerous = Number(srStats?.dangerous_attack || 0)
  const attackPressure = (homeAvgScored + awayAvgScored) + (homeAvgConceded + awayAvgConceded) * 0.3
  const cornersProxy = attackPressure * 2.5 + (srDangerous > 0 ? srDangerous / 20 : 0)

  const threshold = RISK[riskLevel]
  const candidates: ScoredPick[] = []

  const add = (pick: string, market: string, tier: 1|2, odds: number, conf: number, reason: string) => {
    if (conf >= threshold.minConf && odds >= threshold.minOdds && odds <= threshold.maxOdds) {
      candidates.push({ pick, market, tier, estimatedOdds: parseFloat(odds.toFixed(2)), confidence: Math.min(99, Math.round(conf * 10) / 10), reason })
    }
  }

  // ── 1. HOME WIN OR DRAW ──
  {
    const bsd  = probHome + probDraw > 0 ? Math.min(97, (probHome + probDraw) * 0.6) : 50
    const form = homeUnbeatenRate * 0.25
    const h2hC = h2hHomeUnbeaten * 0.12
    const conf = bsd + form + h2hC - homeInjured * 2
    const odds = probHome + probDraw > 0 ? Math.max(1.05, 100 / ((probHome + probDraw) * 0.95)) : 1.3
    add('Home Win or Draw', 'Double Chance', 1, Math.min(odds, 2.2), conf,
      `${homeTeam} unbeaten ${Math.round(homeUnbeatenRate)}%, BSD home+draw ${Math.round(probHome+probDraw)}%, H2H unbeaten ${Math.round(h2hHomeUnbeaten)}%`)
  }

  // ── 2. AWAY WIN OR DRAW ──
  {
    const bsd  = probAway + probDraw > 0 ? Math.min(97, (probAway + probDraw) * 0.6) : 48
    const form = awayUnbeatenRate * 0.25
    const h2hC = h2hAwayUnbeaten * 0.12
    const conf = bsd + form + h2hC - awayInjured * 2
    const odds = probAway + probDraw > 0 ? Math.max(1.05, 100 / ((probAway + probDraw) * 0.95)) : 1.4
    add('Away Win or Draw', 'Double Chance', 1, Math.min(odds, 2.2), conf,
      `${awayTeam} unbeaten ${Math.round(awayUnbeatenRate)}% away, BSD away+draw ${Math.round(probAway+probDraw)}%`)
  }

  // ── 3. HOME WIN TO NIL – NO ──
  {
    const conf = (awayAvgScored >= 0.7 && homeAvgConceded >= 0.8)
      ? Math.min(94, 55 + awayAvgScored * 15 + homeAvgConceded * 12)
      : awayAvgScored >= 0.7 ? Math.min(88, 50 + awayAvgScored * 15)
      : 44
    add('Home Win to Nil – No', 'Win to Nil', 1, 1.6, conf,
      `${awayTeam} scores ${awayAvgScored.toFixed(1)}/game, ${homeTeam} concedes ${homeAvgConceded.toFixed(1)}/game`)
  }

  // ── 4. AWAY WIN TO NIL – NO ──
  {
    const conf = (homeAvgScored >= 0.8 && awayAvgConceded >= 0.7)
      ? Math.min(94, 56 + homeAvgScored * 15 + awayAvgConceded * 12)
      : homeAvgScored >= 0.8 ? Math.min(88, 50 + homeAvgScored * 15)
      : 44
    add('Away Win to Nil – No', 'Win to Nil', 1, 1.55, conf,
      `${homeTeam} scores ${homeAvgScored.toFixed(1)}/game, ${awayTeam} concedes ${awayAvgConceded.toFixed(1)}/game`)
  }

  // ── 5. ANY TEAM 3+ IN A ROW – NO ──
  {
    const conf = combinedAvgGoals <= 3.0
      ? Math.min(95, 82 + (3.0 - combinedAvgGoals) * 6)
      : Math.min(88, 78)
    add('Any Team to Score 3+ Goals in a Row – No', 'Consecutive Goals', 1, 1.15, conf,
      `Avg ${combinedAvgGoals.toFixed(1)} goals/game — 3 consecutive goals very rare`)
  }

  // ── 6. OVER 1.5 GOALS ──
  {
    const conf = combinedAvgGoals >= 2.8 ? 93
      : combinedAvgGoals >= 2.3 ? 88
      : combinedAvgGoals >= 1.8 ? 82
      : combinedAvgGoals >= 1.5 ? 75 : 60
    const bsdBoost = (probHome > 55 || probAway > 55) ? 3 : 0
    add('Over 1.5 Goals', 'Over/Under', 1, 1.45, conf + bsdBoost,
      `Expected ${expectedGoals.toFixed(1)} goals, H2H avg ${h2hAvgGoals.toFixed(1)}`)
  }

  // ── 7. UNDER 3.5 GOALS ──
  {
    const conf = combinedAvgGoals <= 1.8 ? 95
      : combinedAvgGoals <= 2.2 ? 91
      : combinedAvgGoals <= 2.5 ? 87
      : combinedAvgGoals <= 3.0 ? 82 : 68
    add('Under 3.5 Goals', 'Over/Under', 1, 1.35, conf,
      `Avg ${combinedAvgGoals.toFixed(1)} goals/game — Under 3.5 strongly supported`)
  }

  // ── 8. UNDER 4.5 GOALS ──
  {
    const conf = combinedAvgGoals <= 3.0 ? 95
      : combinedAvgGoals <= 3.5 ? 92
      : combinedAvgGoals <= 4.0 ? 88 : 80
    add('Under 4.5 Goals', 'Over/Under', 1, 1.15, conf,
      `Very safe — avg ${combinedAvgGoals.toFixed(1)} goals/game`)
  }

  // ── 9. CORNERS OVER 7.5 ──
  {
    const conf = cornersProxy >= 9 ? 88
      : cornersProxy >= 7.5 ? 82
      : cornersProxy >= 6 ? 74 : 60
    add('Total Corners Over 7.5', 'Corners', 2, 1.55, conf,
      `Attacking play suggests ~${Math.round(cornersProxy)} corners`)
  }

  // ── 10. CORNERS OVER 8.5 ──
  {
    const conf = cornersProxy >= 10 ? 88
      : cornersProxy >= 9 ? 82
      : cornersProxy >= 8 ? 75 : 60
    add('Total Corners Over 8.5', 'Corners', 2, 1.75, conf,
      `High pressure match — ${Math.round(cornersProxy)} corners projected`)
  }

  // ── 11. HOME WIN EITHER HALF ──
  {
    const conf = (homeRecentForm >= 0.6 && homeWinRate >= 50)
      ? Math.min(92, 40 + homeWinRate * 0.4 + homeRecentForm * 20 + (probHome > 50 ? probHome * 0.2 : 0) - homeInjured * 2)
      : Math.min(85, 35 + homeWinRate * 0.4 + homeRecentForm * 15 - homeInjured * 2)
    const odds = probHome > 0 ? Math.max(1.4, 100 / (probHome * 0.85)) : 1.7
    add('Home Team Win Either Half', 'Either Half', 1, Math.min(odds, 2.5), conf,
      `${homeTeam} wins ${Math.round(homeWinRate)}% — strong enough to lead in one half`)
  }

  // ── 12. AWAY WIN EITHER HALF ──
  {
    const conf = (awayRecentForm >= 0.55 && awayWinRate >= 45)
      ? Math.min(90, 35 + awayWinRate * 0.4 + awayRecentForm * 20 + (probAway > 45 ? probAway * 0.2 : 0) - awayInjured * 2)
      : Math.min(82, 30 + awayWinRate * 0.4 + awayRecentForm * 15 - awayInjured * 2)
    const odds = probAway > 0 ? Math.max(1.5, 100 / (probAway * 0.82)) : 1.9
    add('Away Team Win Either Half', 'Either Half', 1, Math.min(odds, 2.5), conf,
      `${awayTeam} wins ${Math.round(awayWinRate)}% — can lead in at least one half`)
  }

  // ── 13. HOME OR AWAY WIN (No Draw) ──
  {
    const noDrawProb   = probHome + probAway
    const h2hNoDrawRate= ((h2hHW + h2hAW) / h2hTotal) * 100
    const conf = noDrawProb > 0
      ? Math.min(93, noDrawProb * 0.55 + h2hNoDrawRate * 0.25 + (homeWinRate + awayWinRate) * 0.1)
      : Math.min(80, h2hNoDrawRate * 0.5 + (homeWinRate + awayWinRate) * 0.15)
    const odds = noDrawProb > 0 ? Math.max(1.3, 100 / (noDrawProb * 0.92)) : 1.5
    add('Home or Away Win (No Draw)', 'Double Chance', 1, Math.min(odds, 2.5), conf,
      `BSD home+away prob ${Math.round(noDrawProb)}%, H2H decisive ${Math.round(h2hNoDrawRate)}%`)
  }

  // ── 14. OVER 0.5 SECOND HALF ──
  {
    const conf = combinedAvgGoals >= 2.0 ? 93
      : combinedAvgGoals >= 1.5 ? 88
      : combinedAvgGoals >= 1.0 ? 82 : 72
    add('Over 0.5 Goals – Second Half', 'Second Half', 1, 1.3, conf,
      `${combinedAvgGoals.toFixed(1)} avg goals/game — second half goal almost certain`)
  }

  // ── 15. HOME TEAM OVER 0.5 ──
  {
    const conf = Math.min(93, 42 + homeAvgScored * 22 + homeRecentForm * 20 + (probHome > 50 ? 8 : 0) - homeInjured * 3)
    const odds = Math.max(1.25, Math.min(1.9, 2.2 - homeAvgScored * 0.4))
    add('Home Team Over 0.5 Goals', 'Team Goals', 1, odds, conf,
      `${homeTeam} scores ${homeAvgScored.toFixed(1)}/game, form ${homeFormStr}`)
  }

  // ── 16. AWAY TEAM OVER 0.5 ──
  {
    const conf = Math.min(90, 38 + awayAvgScored * 20 + awayRecentForm * 18 + (probAway > 40 ? 8 : 0) - awayInjured * 3)
    const odds = Math.max(1.3, Math.min(2.1, 2.4 - awayAvgScored * 0.4))
    add('Away Team Over 0.5 Goals', 'Team Goals', 1, odds, conf,
      `${awayTeam} scores ${awayAvgScored.toFixed(1)}/game, form ${awayFormStr}`)
  }

  return candidates
}

// ─── SELECT BEST PICK PER FIXTURE ─────────────────────────────────────────
// Picks the single most intelligent option per game
// For high risk: prefer higher odds when confidence is close
// For low risk: prefer highest confidence
function selectBestPick(candidates: ScoredPick[], riskLevel: 'low' | 'medium' | 'high'): ScoredPick | null {
  if (!candidates.length) return null
  candidates.sort((a, b) => {
    const confDiff = b.confidence - a.confidence
    if (Math.abs(confDiff) > 5) return confDiff
    if (riskLevel === 'high') return b.estimatedOdds - a.estimatedOdds
    if (riskLevel === 'low') return a.estimatedOdds - b.estimatedOdds
    // medium: balance confidence and value
    return (b.confidence * 0.6 + b.estimatedOdds * 0.4) - (a.confidence * 0.6 + a.estimatedOdds * 0.4)
  })
  return candidates[0]
}

// ─── BUILD ACCUMULATOR ────────────────────────────────────────────────────
// Priority: quantity of safe picks over risky ones
// For high target odds: keep adding picks rather than making risky picks per game
function buildAccumulator(
  scored: Array<{ fixture: Record<string, unknown>; pick: ScoredPick }>,
  targetOdds: number
): Array<{ fixture: Record<string, unknown>; pick: ScoredPick }> {
  // Sort by confidence desc
  scored.sort((a, b) => b.pick.confidence - a.pick.confidence)

  const selected: typeof scored = []
  let currentOdds = 1.0

  for (const item of scored) {
    if (currentOdds >= targetOdds) break
    // Avoid massively overshooting when we have picks already
    if (selected.length > 2 && currentOdds * item.pick.estimatedOdds > targetOdds * 2.5) continue
    selected.push(item)
    currentOdds *= item.pick.estimatedOdds
  }

  // If still under target, add more
  if (currentOdds < targetOdds) {
    const remaining = scored.filter(s => !selected.includes(s))
    for (const item of remaining) {
      if (currentOdds >= targetOdds) break
      selected.push(item)
      currentOdds *= item.pick.estimatedOdds
    }
  }

  return selected
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const hasSubscription = isSubscriptionActive(user)
  const freeBuilderUsed = user.freeBuilderUsed || 0
  const hasFreeTrials = freeBuilderUsed < 2 && !user.isAdmin
  const canUse = user.isAdmin || hasSubscription || hasFreeTrials
  if (!canUse) return res.status(403).json({ error: 'Subscription required', requiresSubscription: true })

  const { targetOdds = 10, riskLevel = 'medium', dateRange = 'today' } = req.body

  try {
    const today = new Date()
    const dateFrom = today.toISOString().split('T')[0]
    let dateTo = dateFrom
    if (dateRange === 'tomorrow') { const t = new Date(today); t.setDate(today.getDate() + 1); dateTo = t.toISOString().split('T')[0] }
    else if (dateRange === 'week') { const t = new Date(today); t.setDate(today.getDate() + 7); dateTo = t.toISOString().split('T')[0] }
    else if (dateRange === 'month') { const t = new Date(today); t.setDate(today.getDate() + 30); dateTo = t.toISOString().split('T')[0] }

    const fixtures = await fetchAllFixtures(dateFrom, dateTo)
    if (!fixtures.length) return res.status(200).json({ tier1: [], tier2: [], message: 'No fixtures found' })

    console.log(`[builder] ${fixtures.length} fixtures for ${dateFrom}–${dateTo}`)

    // Analyse in batches
    const BATCH = 6
    const allScored: Array<{ fixture: Record<string, unknown>; pick: ScoredPick }> = []

    for (let i = 0; i < Math.min(fixtures.length, 80); i += BATCH) {
      const batch = (fixtures as Record<string, unknown>[]).slice(i, i + BATCH)
      const results = await Promise.all(batch.map(async f => {
        const detail = await fetchEventDetail(f.id as number)
        if (!detail) return null
        const candidates = scorePicks(f, detail, riskLevel as 'low' | 'medium' | 'high')
        const best = selectBestPick(candidates, riskLevel as 'low' | 'medium' | 'high')
        if (!best) return null
        return { fixture: f, pick: best }
      }))
      for (const r of results) { if (r) allScored.push(r) }
    }

    const selected = buildAccumulator(allScored, targetOdds)
    const tier1 = selected.filter(s => s.pick.tier === 1)
    const tier2 = selected.filter(s => s.pick.tier === 2)
    const totalOdds = selected.reduce((acc, s) => acc * s.pick.estimatedOdds, 1)

    const format = (s: { fixture: Record<string, unknown>; pick: ScoredPick }, tier: number) => ({
      tier,
      homeTeam: s.fixture.home_team as string,
      awayTeam: s.fixture.away_team as string,
      league: (s.fixture.league as Record<string, unknown>)?.name as string || '',
      startTime: s.fixture.event_date as string || '',
      pick: s.pick.pick,
      market: s.pick.market,
      odds: s.pick.estimatedOdds,
      confidence: Math.round(s.pick.confidence),
      reason: s.pick.reason,
    })

    let summary = `Built ${selected.length}-leg accumulator at ${totalOdds.toFixed(2)} odds (target: ${targetOdds}x).`
    try {
      const sc = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Write short 2-sentence punter-friendly summaries. Nigerian casual tone. No markdown, no team names.' },
          { role: 'user', content: `Built ${selected.length} game accumulator at ${totalOdds.toFixed(2)} odds targeting ${targetOdds}x. Risk level: ${riskLevel}. ${tier1.length} verified picks. Summarise.` }
        ],
        temperature: 0.5, max_tokens: 80,
      })
      summary = sc.choices[0]?.message?.content || summary
    } catch { }

    if (hasFreeTrials && !user.isAdmin) await incrementFreeBuilderUsed(user.id)

    return res.status(200).json({
      tier1: tier1.map(s => format(s, 1)),
      tier2: tier2.map(s => format(s, 2)),
      totalOdds: parseFloat(totalOdds.toFixed(2)),
      targetOdds, riskLevel, dateRange,
      fixturesAnalysed: Math.min(fixtures.length, 80),
      summary,
    })
  } catch (err) {
    console.error('[builder] error:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to build accumulator' })
  }
}