import Groq from 'groq-sdk'
import Anthropic from '@anthropic-ai/sdk'
import { SportyBetGame, resolveFromAvailableMarkets, getSmartReplacement, findSafestPickFromMarkets, fetchLiveMarketsForEvents, AvailableMarket } from './sportybet'
import { sendAdminAlert } from './email'
import { Redis } from '@upstash/redis'

const PROXY_URL = 'https://sportybet-proxy.grooveslip.workers.dev'
const PROXY_KEY = 'grooveslip_proxy_2026'
const ADMIN_EMAIL = 'simeonadigun0@gmail.com'

// ─── AI PROVIDER CONFIG ────────────────────────────────────────────────────
// Primary: Groq now — change PRIMARY_AI to 'claude' when ready
// FALLBACK_AI stays 'groq' as backup
const PRIMARY_AI: 'claude' | 'groq' = 'groq'
const FALLBACK_AI: 'claude' | 'groq' = 'groq'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

// ─── REDIS TOKEN TRACKING ──────────────────────────────────────────────────
// Persists across Vercel cold starts — accurate daily tracking
let redis: Redis | null = null
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  }
} catch { redis = null }

const TOKEN_BUDGETS = {
  groq: parseInt(process.env.GROQ_DAILY_TOKEN_BUDGET || '500000'),
  claude: parseInt(process.env.CLAUDE_DAILY_TOKEN_BUDGET || '100000'),
}
const ALERT_THRESHOLD = 0.80

async function trackTokens(provider: 'groq' | 'claude', tokensUsed: number) {
  try {
    const today = new Date().toISOString().split('T')[0] // e.g. "2026-06-10"
    const key = `token_usage:${provider}:${today}`
    const alertKey = `token_alert_sent:${provider}:${today}`

    let currentUsage = 0
    let alertSent = false

    if (redis) {
      // Increment token count in Redis — persists across cold starts
      currentUsage = await redis.incrby(key, tokensUsed)
      // Set expiry to 25 hours so it auto-cleans daily
      await redis.expire(key, 90000)
      alertSent = !!(await redis.get(alertKey))
    } else {
      // Fallback to in-memory if Redis unavailable
      currentUsage = tokensUsed
    }

    const budget = TOKEN_BUDGETS[provider]
    const usagePercent = currentUsage / budget

    if (usagePercent >= ALERT_THRESHOLD && !alertSent) {
      // Mark alert as sent in Redis
      if (redis) {
        await redis.set(alertKey, '1', { ex: 90000 })
      }
      const percent = Math.round(usagePercent * 100)
      await sendAdminAlert({
        subject: `🚨 Groove Slip — ${provider.toUpperCase()} API at ${percent}% token budget`,
        text: `Your ${provider.toUpperCase()} API has used ${percent}% of its daily token budget.\n\nTokens used today: ${currentUsage.toLocaleString()} / ${budget.toLocaleString()}\nDate: ${today}\n\nAction needed:\n- Go to ${provider === 'groq' ? 'console.groq.com' : 'console.anthropic.com'} to check usage\n- Consider upgrading your plan or rotating the API key\n- Update the key in Vercel environment variables if needed\n\nGroove Slip will automatically use the ${FALLBACK_AI.toUpperCase()} fallback if this provider fails.`,
      })
      console.log(`[token-alert] ${provider} at ${percent}% — alert sent to ${ADMIN_EMAIL}`)
    }
  } catch (err) {
    console.error('[trackTokens] error:', err)
  }
}

const BSD_TOKEN = process.env.BSD_API_KEY || ''
const BSD_BASE = 'https://sports.bzzoiro.com/api'
const SOFA_BASE = 'https://api.sofascore.com/api/v1'
const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }
const sofaHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Referer': 'https://www.sofascore.com/',
}

// ─── 5-SECOND TIMEOUT WRAPPER ──────────────────────────────────────────────
// Cuts off slow API calls that would hang and push past Vercel's 10s limit
// 5s gives BSD/Sofascore enough time for legitimate slow responses
// while killing calls that were going to fail anyway
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  return Promise.race([promise, timeout])
}

export interface GameAnalysis extends SportyBetGame {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore: number
  confidenceScore: number
  reason: string
  formSummary: string
  keep: boolean
  dataSource: string
  replaced?: boolean
  originalPick?: string
  originalMarket?: string
  originalOdds?: number
  replacedPick?: string
  replacedMarketDesc?: string
  replacedOdds?: number
  replacementReason?: string
  needsResolution?: boolean
}

export interface SlipAnalysis {
  games: GameAnalysis[]
  removedGames: GameAnalysis[]
  keptGames: GameAnalysis[]
  originalOdds: number
  newOdds: number
  targetOdds: number
  summary: string
}

interface BSDData {
  raw: string
  predictionResult: string | null
  probHome: number
  probDraw: number
  probAway: number
  homeForm: string
  awayForm: string
  h2hHomeWins: number
  h2hDraws: number
  h2hAwayWins: number
  avgGoalsH2H: number
  homeAvgScored: number
  homeAvgConceded: number
  awayAvgScored: number
  awayAvgConceded: number
  hasData: boolean
}

interface GameData {
  bsd: BSDData
  sofaRaw: string
  dataSource: string
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}
function teamsMatch(a: string, b: string, c: string, d: string) {
  const fw = (s: string) => normalize(s).split(' ')[0]
  return normalize(a).includes(fw(c)) && normalize(b).includes(fw(d))
}

function emptyBSD(): BSDData {
  return {
    raw: '', predictionResult: null, probHome: 0, probDraw: 0, probAway: 0,
    homeForm: '', awayForm: '', h2hHomeWins: 0, h2hDraws: 0, h2hAwayWins: 0,
    avgGoalsH2H: 0, homeAvgScored: 0, homeAvgConceded: 0, awayAvgScored: 0,
    awayAvgConceded: 0, hasData: false,
  }
}

async function getBSDData(homeTeam: string, awayTeam: string): Promise<BSDData> {
  const fetch5s = (url: string, opts: RequestInit) =>
    withTimeout(fetch(url, { ...opts, signal: AbortSignal.timeout(5000) }), 5000, null as unknown as Response)

  try {
    const yesterday = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
    const next2w = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

    for (const term of [homeTeam, homeTeam.split(' ')[0], awayTeam]) {
      const res = await fetch5s(
        `${BSD_BASE}/events/?team=${encodeURIComponent(term)}&date_from=${yesterday}&date_to=${next2w}&limit=20`,
        { headers: bsdHeaders }
      )
      if (!res || !res.ok) continue
      const data = await res.json()
      const match = (data.results || []).find((e: unknown) => {
        const ev = e as Record<string, unknown>
        return teamsMatch(ev.home_team as string || '', ev.away_team as string || '', homeTeam, awayTeam)
      })
      if (!match) continue

      const ev = match as Record<string, unknown>
      const det = await fetch5s(`${BSD_BASE}/events/${ev.id}/`, { headers: bsdHeaders })
      const event = (det && det.ok) ? await det.json() : ev

      const hf = event.home_form as Record<string, unknown> | null
      const af = event.away_form as Record<string, unknown> | null
      const h2h = event.head_to_head as Record<string, unknown> | null
      const pred = event.prediction as Record<string, unknown> | null

      const homeWins = Number(hf?.wins || 0)
      const homeDraws = Number(hf?.draws || 0)
      const homeLosses = Number(hf?.losses || 0)
      const awayWins = Number(af?.wins || 0)
      const awayDraws = Number(af?.draws || 0)
      const awayLosses = Number(af?.losses || 0)
      const homeScored = Number(hf?.goals_scored_last_n || 0)
      const homeConceded = Number(hf?.goals_conceded_last_n || 0)
      const awayScored = Number(af?.goals_scored_last_n || 0)
      const awayConceded = Number(af?.goals_conceded_last_n || 0)
      const homeGames = homeWins + homeDraws + homeLosses || 1
      const awayGames = awayWins + awayDraws + awayLosses || 1

      const h2hHW = Number(h2h?.home_wins || 0)
      const h2hD = Number(h2h?.draws || 0)
      const h2hAW = Number(h2h?.away_wins || 0)
      const h2hTotal = h2hHW + h2hD + h2hAW || 1
      const h2hGoals = Number(h2h?.total_goals || 0)

      const probHome = Number(pred?.prob_home_win || 0)
      const probDraw = Number(pred?.prob_draw || 0)
      const probAway = Number(pred?.prob_away_win || 0)
      const predResult = String(pred?.predicted_result || '')

      const parts: string[] = []
      if (hf) parts.push(`H:${hf.form_string || '?'} W${homeWins}D${homeDraws}L${homeLosses} GF${homeScored}GA${homeConceded}`)
      if (af) parts.push(`A:${af.form_string || '?'} W${awayWins}D${awayDraws}L${awayLosses} GF${awayScored}GA${awayConceded}`)
      if (h2h) parts.push(`H2H(${h2hTotal}):HW${h2hHW}D${h2hD}AW${h2hAW} goals:${h2hGoals}`)
      if (pred) parts.push(`Pred:${predResult} H${probHome}%D${probDraw}%A${probAway}%`)

      return {
        raw: parts.join('|'),
        predictionResult: predResult || null,
        probHome, probDraw, probAway,
        homeForm: String(hf?.form_string || ''),
        awayForm: String(af?.form_string || ''),
        h2hHomeWins: h2hHW, h2hDraws: h2hD, h2hAwayWins: h2hAW,
        avgGoalsH2H: h2hTotal > 0 ? h2hGoals / h2hTotal : 0,
        homeAvgScored: homeScored / homeGames,
        homeAvgConceded: homeConceded / homeGames,
        awayAvgScored: awayScored / awayGames,
        awayAvgConceded: awayConceded / awayGames,
        hasData: true,
      }
    }
  } catch { /* silent */ }
  return emptyBSD()
}

async function getSofaData(homeTeam: string, awayTeam: string): Promise<string> {
  try {
    const getId = async (name: string): Promise<number | null> => {
      const res = await withTimeout(
        fetch(`${SOFA_BASE}/search/teams/${encodeURIComponent(name)}`, { headers: sofaHeaders }),
        5000, null as unknown as Response
      )
      if (!res || !res.ok) return null
      const teams = (await res.json()).teams || []
      const match = teams.find((t: unknown) => normalize((t as Record<string, unknown>).name as string || '').includes(normalize(name).split(' ')[0]))
      return ((match || teams[0]) as Record<string, unknown>)?.id as number || null
    }
    const getForm = async (id: number, name: string): Promise<string> => {
      const res = await withTimeout(
        fetch(`${SOFA_BASE}/team/${id}/events/last/0`, { headers: sofaHeaders }),
        5000, null as unknown as Response
      )
      if (!res || !res.ok) return ''
      const events = ((await res.json()).events || []).slice(-5) as unknown[]
      let w = 0, d = 0, l = 0
      events.forEach((e: unknown) => {
        const ev = e as Record<string, unknown>
        const isHome = normalize(((ev.homeTeam as Record<string, unknown>)?.name as string) || '').includes(normalize(name).split(' ')[0])
        const s = Number(isHome ? (ev.homeScore as Record<string, unknown>)?.current : (ev.awayScore as Record<string, unknown>)?.current) || 0
        const c = Number(isHome ? (ev.awayScore as Record<string, unknown>)?.current : (ev.homeScore as Record<string, unknown>)?.current) || 0
        if (s > c) w++; else if (s < c) l++; else d++
      })
      return `${name.split(' ')[0]}:W${w}D${d}L${l}`
    }
    const [hId, aId] = await Promise.all([getId(homeTeam), getId(awayTeam)])
    if (!hId && !aId) return ''
    const [hf, af] = await Promise.all([
      hId ? getForm(hId, homeTeam) : Promise.resolve(''),
      aId ? getForm(aId, awayTeam) : Promise.resolve(''),
    ])
    return [hf, af].filter(Boolean).join('|')
  } catch { return '' }
}

// ─── SMART NO-DATA FALLBACK ────────────────────────────────────────────────
// When BSD/Sofascore can't find the match, use smarter rules than just odds
function noDataDecision(
  game: SportyBetGame,
  allowSwitching: boolean
): { decision: 'keep' | 'remove' | 'replace' | 'ai'; confidence: number; reason: string; suggestedPick?: string; suggestedMarket?: string } {
  const market = game.market.toLowerCase().trim()
  const pick = game.pick.toLowerCase().trim()
  const odds = game.odds

  // Already safest — always keep
  if (market.includes('double chance')) return { decision: 'keep', confidence: 72, reason: 'Double Chance is already the safest market option' }
  if (market.includes('over/under') && pick === 'over 0.5') return { decision: 'keep', confidence: 68, reason: 'Over 0.5 is the safest over/under option' }

  // 2UP/1UP — always risky without data
  if (market.includes('2up')) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 32, reason: '2UP requires dominant winning margin — too risky without data', suggestedPick: pick === 'home' ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }
  if (market.includes('1up')) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: '1UP requires winning margin — risky without supporting data', suggestedPick: pick === 'home' ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }

  // Draw — always risky without data
  if ((market === '1x2' || market.includes('1x2')) && (pick === 'draw' || pick === 'x')) {
    return { decision: allowSwitching ? 'replace' : 'remove', confidence: 35, reason: 'Draw is unpredictable — no data to support it', suggestedPick: 'Home/Draw', suggestedMarket: 'Double Chance' }
  }

  // Over 2.5+ without data — risky
  if (market.includes('over/under') && !market.includes('corner')) {
    const num = parseFloat(pick.replace(/[^0-9.]/g, ''))
    if (pick.startsWith('over') && !isNaN(num)) {
      if (num >= 2.5) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: `Over ${num} is high risk without goal data to support it`, suggestedPick: num >= 3.5 ? 'Over 2.5' : 'Over 1.5', suggestedMarket: 'Over/Under' }
      if (num >= 1.5 && odds > 1.5) return { decision: allowSwitching ? 'replace' : 'ai', confidence: 44, reason: `Over ${num} at ${odds} odds needs data verification`, suggestedPick: 'Over 0.5', suggestedMarket: 'Over/Under' }
      if (num >= 1.5) return { decision: 'keep', confidence: 58, reason: `Over ${num} at ${odds} odds — low risk without data` }
    }
  }

  // Away win at high odds without data
  if ((market === '1x2' || market.includes('1x2')) && (pick === 'away' || pick === '2') && odds >= 2.0) {
    return { decision: allowSwitching ? 'replace' : 'remove', confidence: 36, reason: `Away win at ${odds} odds — risky without data`, suggestedPick: 'Draw/Away', suggestedMarket: 'Double Chance' }
  }

  // Home win at high odds without data
  if ((market === '1x2' || market.includes('1x2')) && (pick === 'home' || pick === '1') && odds >= 2.5) {
    return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: `Home win at ${odds} odds — risky without data`, suggestedPick: 'Home/Draw', suggestedMarket: 'Double Chance' }
  }

  // GG Yes without data
  if ((market.includes('gg') || market.includes('both teams')) && (pick === 'yes' || pick === 'gg')) {
    return { decision: allowSwitching ? 'replace' : 'ai', confidence: 45, reason: 'GG Yes needs scoring data — unavailable for this match', suggestedPick: 'No', suggestedMarket: 'GG/NG' }
  }

  // Very high odds without data — remove
  if (odds >= 4.0) return { decision: 'remove', confidence: 28, reason: `Odds of ${odds} are very high risk without any supporting data` }
  if (odds >= 2.5) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 35, reason: `${odds} odds is significant risk without data` }

  // Low odds, relatively safe market — keep
  if (odds <= 1.4) return { decision: 'keep', confidence: 65, reason: `Low odds of ${odds} — reasonably safe even without data` }

  return { decision: 'keep', confidence: 55, reason: `No data available — kept based on acceptable odds (${odds})` }
}

// ─── SMART PRE-FILTER (with data) ─────────────────────────────────────────
type PreDecision = 'keep' | 'remove' | 'replace' | 'ai'
interface PreFilterResult {
  decision: PreDecision
  confidence: number
  reason: string
  suggestedPick?: string
  suggestedMarket?: string
}

function smartPreFilter(game: SportyBetGame, bsd: BSDData, allowSwitching: boolean): PreFilterResult {
  const market = game.market.toLowerCase().trim()
  const pick = game.pick.toLowerCase().trim()
  const odds = game.odds

  if (!bsd.hasData) return noDataDecision(game, allowSwitching)

  if (market.includes('double chance')) return { decision: 'keep', confidence: 78, reason: 'Double Chance is already a safe market' }

  // Pick probability from BSD prediction
  let pickProbability = 0
  if (pick === 'home' || pick === '1') pickProbability = bsd.probHome
  else if (pick === 'away' || pick === '2') pickProbability = bsd.probAway
  else if (pick === 'draw' || pick === 'x') pickProbability = bsd.probDraw

  // 1X2 decisions
  if (market === '1x2' || (market.includes('1x2') && !market.includes('up'))) {
    if (pickProbability >= 65) return { decision: 'keep', confidence: Math.min(85, pickProbability), reason: `BSD prediction strongly supports this pick (${pickProbability}% probability)` }
    if (pickProbability >= 50) return { decision: 'ai', confidence: pickProbability, reason: `Moderate probability (${pickProbability}%) — AI will assess form and H2H` }
    if (pick === 'draw' || pick === 'x') return { decision: allowSwitching ? 'replace' : 'remove', confidence: 35, reason: `Draw probability only ${bsd.probDraw}% — risky pick`, suggestedPick: bsd.probHome > bsd.probAway ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }
    if (pickProbability < 50) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: `Only ${pickProbability}% win probability — data does not support this pick`, suggestedPick: pick === 'home' || pick === '1' ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }
  }

  // Over/Under using goal data
  if (market.includes('over/under') && !market.includes('corner')) {
    const num = parseFloat(pick.replace(/[^0-9.]/g, ''))
    if (!isNaN(num)) {
      const expectedGoals = ((bsd.homeAvgScored + bsd.awayAvgConceded) / 2) + ((bsd.awayAvgScored + bsd.homeAvgConceded) / 2)
      const h2hAvg = bsd.avgGoalsH2H

      if (pick.startsWith('over')) {
        const goalsSupport = expectedGoals > num && h2hAvg > num
        const goalsMarginal = expectedGoals > num * 0.85 || h2hAvg > num * 0.85

        if (num <= 0.5) return { decision: 'keep', confidence: 80, reason: 'Over 0.5 — very likely with any goal scored' }
        if (num <= 1.5) {
          if (goalsSupport) return { decision: 'keep', confidence: 75, reason: `Expected goals ${expectedGoals.toFixed(1)} and H2H avg ${h2hAvg.toFixed(1)} support Over ${num}` }
          if (!goalsMarginal) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 40, reason: `Low expected goals (exp:${expectedGoals.toFixed(1)}, H2H:${h2hAvg.toFixed(1)}) — Over ${num} is risky`, suggestedPick: 'Over 0.5', suggestedMarket: 'Over/Under' }
          return { decision: 'ai', confidence: 55, reason: `Borderline scoring data for Over ${num} — AI will assess` }
        }
        if (num >= 2.5) {
          if (goalsSupport && expectedGoals >= num) return { decision: 'keep', confidence: 65, reason: `Strong scoring data (exp:${expectedGoals.toFixed(1)}, H2H:${h2hAvg.toFixed(1)}) supports Over ${num}` }
          return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: `Expected goals ${expectedGoals.toFixed(1)} insufficient for Over ${num}`, suggestedPick: num >= 3.5 ? 'Over 2.5' : 'Over 1.5', suggestedMarket: 'Over/Under' }
        }
        if (goalsSupport) return { decision: 'keep', confidence: 68, reason: `Goal data supports Over ${num} (exp:${expectedGoals.toFixed(1)})` }
        if (!goalsMarginal) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 42, reason: `Low expected goals (${expectedGoals.toFixed(1)}) for Over ${num}`, suggestedPick: 'Over 0.5', suggestedMarket: 'Over/Under' }
        return { decision: 'ai', confidence: 52, reason: `Marginal goal data for Over ${num} — AI will make final call` }
      }
    }
  }

  // GG/Both Teams
  if (market.includes('gg') || market.includes('both teams')) {
    if (pick === 'yes' || pick === 'gg') {
      const bothScore = bsd.homeAvgScored >= 1.0 && bsd.awayAvgScored >= 0.8
      const h2hBothScore = bsd.avgGoalsH2H >= 2.0
      if (bothScore && h2hBothScore) return { decision: 'keep', confidence: 70, reason: `Both teams score regularly (H:${bsd.homeAvgScored.toFixed(1)}, A:${bsd.awayAvgScored.toFixed(1)} avg)` }
      if (bsd.homeAvgScored < 0.6 || bsd.awayAvgScored < 0.6) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: `One team rarely scores — GG Yes is risky`, suggestedPick: 'No', suggestedMarket: 'GG/NG' }
      return { decision: 'ai', confidence: 52, reason: 'Mixed scoring data — AI will assess GG probability' }
    }
  }

  // 2UP
  if (market.includes('2up')) {
    const homeDominant = bsd.probHome >= 70 && bsd.homeAvgScored >= 2.0
    if ((pick === 'home' || pick === '1') && homeDominant) return { decision: 'ai', confidence: 55, reason: `Home looks dominant (${bsd.probHome}% prob) — AI will verify 2UP viability` }
    return { decision: allowSwitching ? 'replace' : 'remove', confidence: 35, reason: `Data doesn't strongly support 2UP margin`, suggestedPick: pick === 'home' ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }
  }

  // 1UP
  if (market.includes('1up')) {
    if ((pick === 'home' || pick === '1') && bsd.probHome >= 60) return { decision: 'ai', confidence: 58, reason: `${bsd.probHome}% home probability — AI will assess 1UP viability` }
    if ((pick === 'away' || pick === '2') && bsd.probAway >= 60) return { decision: 'ai', confidence: 58, reason: `${bsd.probAway}% away probability — AI will assess 1UP viability` }
    return { decision: allowSwitching ? 'replace' : 'remove', confidence: 40, reason: `Insufficient probability for 1UP market`, suggestedPick: pick === 'home' ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }
  }

  // Very high odds
  if (odds >= 4.0) return { decision: 'remove', confidence: 30, reason: `Odds of ${odds} are very high risk` }
  if (odds >= 2.5 && pickProbability > 0 && pickProbability < 45) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 35, reason: `Only ${pickProbability}% probability at ${odds} odds` }

  return { decision: 'ai', confidence: 60, reason: 'AI will analyse available data for final decision' }
}

// ─── VALID REPLACEMENTS ────────────────────────────────────────────────────
function getValidReplacements(market: string, pick: string): Array<{ pick: string; market: string }> {
  const m = market.toLowerCase().trim()
  const p = pick.toLowerCase().trim()
  if (m.includes('double chance')) return []
  if (m.includes('over/under') && p === 'over 0.5') return []
  if (m === '1x2' || (m.includes('1x2') && !m.includes('up'))) {
    if (p === 'home' || p === '1') return [{ pick: 'Home/Draw', market: 'Double Chance' }, { pick: 'Home/Away', market: 'Double Chance' }]
    if (p === 'away' || p === '2') return [{ pick: 'Draw/Away', market: 'Double Chance' }, { pick: 'Home/Away', market: 'Double Chance' }]
    if (p === 'draw' || p === 'x') return [{ pick: 'Home/Draw', market: 'Double Chance' }, { pick: 'Draw/Away', market: 'Double Chance' }]
  }
  if (m.includes('over/under') && !m.includes('corner')) {
    const num = parseFloat(p.replace(/[^0-9.]/g, ''))
    if (p.startsWith('over') && !isNaN(num)) {
      if (num >= 4.5) return [{ pick: 'Over 3.5', market: 'Over/Under' }, { pick: 'Over 2.5', market: 'Over/Under' }, { pick: 'Over 1.5', market: 'Over/Under' }]
      if (num >= 3.5) return [{ pick: 'Over 2.5', market: 'Over/Under' }, { pick: 'Over 1.5', market: 'Over/Under' }]
      if (num >= 2.5) return [{ pick: 'Over 1.5', market: 'Over/Under' }, { pick: 'Over 0.5', market: 'Over/Under' }]
      if (num >= 1.5) return [{ pick: 'Over 0.5', market: 'Over/Under' }]
    }
  }
  if (m.includes('gg') || m.includes('both teams')) {
    if (p === 'yes' || p === 'gg') return [{ pick: 'No', market: 'GG/NG' }, { pick: 'Home/Draw', market: 'Double Chance' }, { pick: 'Draw/Away', market: 'Double Chance' }]
  }
  if (m.includes('2up')) {
    if (p === 'home') return [{ pick: 'Home/Draw', market: 'Double Chance' }, { pick: 'Home', market: '1X2 - 1UP' }]
    if (p === 'away') return [{ pick: 'Draw/Away', market: 'Double Chance' }, { pick: 'Away', market: '1X2 - 1UP' }]
  }
  if (m.includes('1up')) {
    if (p === 'home') return [{ pick: 'Home/Draw', market: 'Double Chance' }, { pick: 'Home', market: '1X2' }]
    if (p === 'away') return [{ pick: 'Draw/Away', market: 'Double Chance' }, { pick: 'Away', market: '1X2' }]
  }
  return []
}

// ─── AI DECISION ───────────────────────────────────────────────────────────
interface AIDecision {
  eventId: string
  keep: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidenceScore: number
  reason: string
  formSummary: string
  replacePick: string | null
  replaceMarket: string | null
  replacementReason: string | null
}

function buildAIPrompt(games: Array<{ game: SportyBetGame; bsd: BSDData; sofa: string; preReason: string }>, allowSwitching: boolean): string {
  const gameLines = games.map((gd, i) => {
    const validOpts = getValidReplacements(gd.game.market, gd.game.pick)
    const optsStr = validOpts.map(o => `"${o.pick}" (${o.market})`).join(', ') || 'none'
    const stats = gd.bsd.hasData ? gd.bsd.raw : (gd.sofa || 'No stats available')
    return `G${i + 1}|${gd.game.eventId}
Match: ${gd.game.homeTeam} vs ${gd.game.awayTeam} | ${gd.game.league}
Pick: ${gd.game.pick} (${gd.game.market}) @ ${gd.game.odds}
Pre-analysis: ${gd.preReason}
Stats: ${stats}
Valid safer options: ${optsStr}`
  }).join('\n\n')

  return `You are an elite football analyst for Groove Slip — a Nigerian betting tool. Protect users from losing tickets.

CRITICAL RULES:
- Analyse every game using the actual stats — not generic rules
- Even a 1.05 odds pick can kill a ticket — flag it if data shows risk (e.g. H2H avg 0.8 goals on Over 0.5)
- KEEP only if data STRONGLY supports the pick (probability ≥ 60%, form matches, H2H agrees)
- ${allowSwitching ? 'REPLACE with smartest option from valid options — must reference actual stats in replacementReason' : 'Only decide keep/remove — set replacePick and replaceMarket to null'}
- replacePick and replaceMarket must be EXACTLY as written in valid options list
- reason and replacementReason must reference specific stats — never generic

${gameLines}

Return ONLY a JSON array:
[{"eventId":"ID","keep":true,"riskLevel":"MEDIUM","confidenceScore":65,"reason":"specific stat reason","formSummary":"key stat","replacePick":null,"replaceMarket":null,"replacementReason":null}]`
}

async function callClaude(games: Array<{ game: SportyBetGame; bsd: BSDData; sofa: string; preReason: string }>, allowSwitching: boolean): Promise<AIDecision[]> {
  const prompt = buildAIPrompt(games, allowSwitching)
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 280 * games.length,
    messages: [{ role: 'user', content: prompt }],
    system: 'You are a JSON API. Output ONLY a valid JSON array. No markdown.',
  })
  const raw = response.content.filter((b: { type: string; text?: string }) => b.type === 'text').map((b: { type: string; text?: string }) => b.text || '').join('')
  await trackTokens('claude', response.usage.input_tokens + response.usage.output_tokens)
  return parseAIResponse(raw)
}

async function callGroq(games: Array<{ game: SportyBetGame; bsd: BSDData; sofa: string; preReason: string }>, allowSwitching: boolean): Promise<AIDecision[]> {
  const prompt = buildAIPrompt(games, allowSwitching)
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are a JSON API. Output ONLY a valid JSON array. No markdown.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 250 * games.length,
  })
  const raw = completion.choices[0]?.message?.content || '[]'
  await trackTokens('groq', completion.usage?.total_tokens || 0)
  return parseAIResponse(raw)
}

function parseAIResponse(raw: string): AIDecision[] {
  try {
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = clean.indexOf('['), end = clean.lastIndexOf(']')
    if (start === -1 || end === -1) return []
    return JSON.parse(clean.substring(start, end + 1))
  } catch { return [] }
}

async function getAIDecisions(
  games: Array<{ game: SportyBetGame; bsd: BSDData; sofa: string; preReason: string }>,
  allowSwitching: boolean
): Promise<Map<string, AIDecision>> {
  const map = new Map<string, AIDecision>()
  if (games.length === 0) return map

  let results: AIDecision[] = []
  try {
    results = PRIMARY_AI === 'claude' ? await callClaude(games, allowSwitching) : await callGroq(games, allowSwitching)
  } catch (primaryErr) {
    console.error(`[AI] ${PRIMARY_AI} failed, trying ${FALLBACK_AI}:`, primaryErr)
    try {
      results = FALLBACK_AI === 'claude' ? await callClaude(games, allowSwitching) : await callGroq(games, allowSwitching)
    } catch {
      for (const gd of games) {
        const validOpts = getValidReplacements(gd.game.market, gd.game.pick)
        map.set(gd.game.eventId, {
          eventId: gd.game.eventId, keep: true, riskLevel: 'MEDIUM', confidenceScore: 50,
          reason: gd.preReason, formSummary: '',
          replacePick: allowSwitching && validOpts.length > 0 ? validOpts[0].pick : null,
          replaceMarket: allowSwitching && validOpts.length > 0 ? validOpts[0].market : null,
          replacementReason: 'Safer alternative selected automatically',
        })
      }
      return map
    }
  }

  for (const r of results) {
    if (!r.eventId) continue
    const gd = games.find(g => g.game.eventId === r.eventId)
    if (gd && r.replacePick && r.replaceMarket) {
      const validOpts = getValidReplacements(gd.game.market, gd.game.pick)
      const isValid = validOpts.some(o =>
        o.pick.toLowerCase() === r.replacePick!.toLowerCase() &&
        o.market.toLowerCase() === r.replaceMarket!.toLowerCase()
      )
      if (!isValid && validOpts.length > 0) { r.replacePick = validOpts[0].pick; r.replaceMarket = validOpts[0].market }
      else if (!isValid) { r.replacePick = null; r.replaceMarket = null }
    }
    map.set(r.eventId, r)
  }

  for (const gd of games) {
    if (!map.has(gd.game.eventId)) {
      const validOpts = getValidReplacements(gd.game.market, gd.game.pick)
      map.set(gd.game.eventId, {
        eventId: gd.game.eventId, keep: true, riskLevel: 'MEDIUM', confidenceScore: 52,
        reason: gd.preReason, formSummary: '',
        replacePick: allowSwitching && validOpts.length > 0 ? validOpts[0].pick : null,
        replaceMarket: allowSwitching && validOpts.length > 0 ? validOpts[0].market : null,
        replacementReason: null,
      })
    }
  }
  return map
}

// ─── HARDCODED IDs ─────────────────────────────────────────────────────────
const PICK_TO_IDS: Record<string, { marketId: string; outcomeId: string }> = {
  'home/draw|double chance': { marketId: '3', outcomeId: '1' },
  'draw/away|double chance': { marketId: '3', outcomeId: '3' },
  'home/away|double chance': { marketId: '3', outcomeId: '2' },
  'yes|gg/ng': { marketId: '5', outcomeId: '1' },
  'no|gg/ng': { marketId: '5', outcomeId: '2' },
  'over 0.5|over/under': { marketId: '18', outcomeId: '12' },
  'over 1.5|over/under': { marketId: '18', outcomeId: '12' },
  'over 2.5|over/under': { marketId: '18', outcomeId: '12' },
  'over 3.5|over/under': { marketId: '18', outcomeId: '12' },
  'under 1.5|over/under': { marketId: '18', outcomeId: '13' },
  'under 2.5|over/under': { marketId: '18', outcomeId: '13' },
  'under 3.5|over/under': { marketId: '18', outcomeId: '13' },
  'home|1x2': { marketId: '1', outcomeId: '1' },
  'draw|1x2': { marketId: '1', outcomeId: '2' },
  'away|1x2': { marketId: '1', outcomeId: '3' },
  'home|1x2 - 1up': { marketId: '60200', outcomeId: '1' },
  'away|1x2 - 1up': { marketId: '60200', outcomeId: '3' },
  'home|1x2 - 2up': { marketId: '60100', outcomeId: '1' },
  'away|1x2 - 2up': { marketId: '60100', outcomeId: '3' },
}

function hardcodedIds(pick: string, market: string): { marketId: string; outcomeId: string } | null {
  const key = `${pick.toLowerCase().trim()}|${market.toLowerCase().trim()}`
  if (PICK_TO_IDS[key]) return PICK_TO_IDS[key]
  const m = market.toLowerCase().trim()
  const p = pick.toLowerCase().trim()
  if (m.includes('double chance')) {
    if (p.includes('home') && p.includes('draw')) return { marketId: '3', outcomeId: '1' }
    if (p.includes('draw') && p.includes('away')) return { marketId: '3', outcomeId: '3' }
    if (p.includes('home') && p.includes('away')) return { marketId: '3', outcomeId: '2' }
  }
  if (m.includes('over') && m.includes('under')) {
    if (p.startsWith('over')) return { marketId: '18', outcomeId: '12' }
    if (p.startsWith('under')) return { marketId: '18', outcomeId: '13' }
  }
  if (m.includes('gg') || m.includes('both teams')) {
    if (p === 'yes' || p === 'gg') return { marketId: '5', outcomeId: '1' }
    if (p === 'no' || p === 'ng') return { marketId: '5', outcomeId: '2' }
  }
  if (m === '1x2' || (m.includes('1x2') && !m.includes('up'))) {
    if (p === 'home' || p === '1') return { marketId: '1', outcomeId: '1' }
    if (p === 'draw' || p === 'x') return { marketId: '1', outcomeId: '2' }
    if (p === 'away' || p === '2') return { marketId: '1', outcomeId: '3' }
  }
  return null
}

function estimateSaferOdds(originalOdds: number, newPick: string, newMarket: string): number {
  const nm = newMarket.toLowerCase()
  const np = newPick.toLowerCase()
  if (nm.includes('over/under')) {
    const num = parseFloat(np.replace(/[^0-9.]/g, ''))
    if (!isNaN(num)) {
      if (num <= 0.5) return 1.08
      if (num <= 1.5) return Math.max(1.10, parseFloat((1 + (originalOdds - 1) * 0.25).toFixed(2)))
      if (num <= 2.5) return Math.max(1.15, parseFloat((1 + (originalOdds - 1) * 0.45).toFixed(2)))
    }
  }
  if (nm.includes('double chance')) return Math.max(1.08, parseFloat((1 + (originalOdds - 1) * 0.35).toFixed(2)))
  if (nm.includes('gg')) return Math.max(1.08, parseFloat((originalOdds * 0.6).toFixed(2)))
  return Math.max(1.08, parseFloat((1 + (originalOdds - 1) * 0.45).toFixed(2)))
}

async function resolveRealIdsFromProxy(eventId: string, targetPick: string, targetMarket: string): Promise<{ marketId: string; outcomeId: string; realOdds: number } | null> {
  try {
    const res = await withTimeout(
      fetch(`${PROXY_URL}/markets/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
        body: JSON.stringify({}),
      }),
      8000, null as unknown as Response
    )
    if (!res || !res.ok) return null
    const data = await res.json()
    if (!data.success || !data.markets) return null
    const tm = targetMarket.toLowerCase().trim()
    const tp = targetPick.toLowerCase().trim()
    const market = data.markets.find((m: { id: string; desc: string; outcomes: Array<{ id: string; desc: string; odds: number }> }) => {
      const d = m.desc.toLowerCase().trim()
      return d === tm || d.includes(tm) || tm.includes(d) ||
        (tm.includes('double chance') && d.includes('double chance')) ||
        (tm === 'gg/ng' && (d.includes('gg') || d.includes('both teams'))) ||
        (tm.includes('over/under') && d.includes('over/under') && !d.includes('corner'))
    })
    if (!market) return null
    const outcome = market.outcomes.find((o: { id: string; desc: string; odds: number }) => {
      const d = o.desc.toLowerCase().trim()
      if (tp.startsWith('over') || tp.startsWith('under')) {
        const tNum = parseFloat(tp.replace(/[^0-9.]/g, ''))
        const dNum = parseFloat(d.replace(/[^0-9.]/g, ''))
        const dir = tp.startsWith('over') ? 'over' : 'under'
        if (!isNaN(tNum) && !isNaN(dNum)) return d.startsWith(dir) && Math.abs(dNum - tNum) < 0.1
      }
      if (tp === 'home/draw') return d === 'home/draw' || d === '1x' || (d.includes('home') && d.includes('draw'))
      if (tp === 'draw/away') return d === 'draw/away' || d === 'x2' || (d.includes('draw') && d.includes('away'))
      if (tp === 'home/away') return d === 'home/away' || d === '12'
      if (tp === 'yes' || tp === 'gg') return d === 'yes' || d === 'gg'
      if (tp === 'no' || tp === 'ng') return d === 'no' || d === 'ng'
      return d === tp || d.includes(tp)
    })
    if (!outcome) return null
    return { marketId: market.id, outcomeId: outcome.id, realOdds: outcome.odds }
  } catch { return null }
}

function findBestCombination(games: GameAnalysis[], targetOdds: number): GameAnalysis[] {
  if (games.length === 0) return games
  const total = games.reduce((acc, g) => acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)
  if (total <= targetOdds * 1.2) return games
  const sorted = [...games].sort((a, b) => a.confidenceScore - b.confidenceScore)
  let best = games
  let bestDiff = Math.abs(total - targetOdds)
  for (let i = 1; i < sorted.length - 1; i++) {
    const candidate = sorted.slice(i)
    const odds = candidate.reduce((acc, g) => acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)
    const diff = Math.abs(odds - targetOdds)
    if (diff < bestDiff) { bestDiff = diff; best = candidate }
    if (odds < targetOdds * 0.5) break
  }
  if (best.length < 2) best = sorted.slice(sorted.length - 2)
  return best
}

async function generateSummary(username: string, totalGames: number, keptCount: number, removedCount: number, replacedCount: number, newOdds: number, targetOdds: number): Promise<string> {
  const fallback = `Hi ${username}, checked ${totalGames} games and kept ${keptCount} solid ones at ${newOdds.toFixed(2)} odds (target: ${targetOdds}). Cut ${removedCount} risky picks${replacedCount > 0 ? ` and swapped ${replacedCount} for safer options` : ''} — your slip is cleaner now.`
  const userMsg = `Write EXACTLY 2 sentences. First sentence starts with "Hi ${username}," then mentions games kept and odds. Second sentence mentions cuts and swaps if any. Casual Nigerian punter tone. No team names, no markdown, no asterisks, no lists. STOP after 2 sentences.\n\nFacts: ${totalGames} checked, ${keptCount} kept at ${newOdds.toFixed(2)} odds, target ${targetOdds}, cut ${removedCount}${replacedCount > 0 ? `, swapped ${replacedCount}` : ''}.`
  try {
    if (PRIMARY_AI === 'claude') {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', max_tokens: 100,
        messages: [{ role: 'user', content: userMsg }],
        system: 'Write 2-sentence betting summaries. Casual Nigerian tone. No team names, no markdown. 2 sentences only.',
      })
      const text = response.content.filter((b: { type: string; text?: string }) => b.type === 'text').map((b: { type: string; text?: string }) => b.text || '').join('')
      await trackTokens('claude', response.usage.input_tokens + response.usage.output_tokens)
      return text || fallback
    } else {
      const sc = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Write 2-sentence betting summaries. Casual Nigerian punter tone. No team names, no markdown, no asterisks. HARD LIMIT: 2 sentences only.' },
          { role: 'user', content: userMsg }
        ],
        temperature: 0.5, max_tokens: 80,
      })
      await trackTokens('groq', sc.usage?.total_tokens || 0)
      return sc.choices[0]?.message?.content || fallback
    }
  } catch { return fallback }
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────
export async function analyseSlip(
  games: SportyBetGame[],
  targetOdds: number,
  originalTotalOdds: number,
  allowSwitching: boolean = false,
  clientMarkets: Record<string, unknown> = {},
  username: string = 'Champ'
): Promise<SlipAnalysis> {

  const isFootball = (g: SportyBetGame) =>
    !g.sport || g.sport.toLowerCase().includes('football') || g.sport.toLowerCase().includes('soccer')

  // PHASE 1A: Fetch BSD + Sofascore data for all games in parallel
  const dataMap = new Map<string, GameData>()
  await Promise.all(
    games.filter(isFootball).map(async (g) => {
      const [bsd, sofa] = await Promise.all([
        getBSDData(g.homeTeam, g.awayTeam),
        getSofaData(g.homeTeam, g.awayTeam),
      ])
      dataMap.set(g.eventId, {
        bsd, sofaRaw: sofa,
        dataSource: bsd.hasData && sofa ? 'BSD+SOFASCORE' : bsd.hasData ? 'BSD' : sofa ? 'SOFASCORE' : 'AI_WEB_SEARCH',
      })
    })
  )

  // PHASE 1B: Fetch ALL live markets from SportyBet via Cloudflare Worker
  // This runs in parallel with BSD/Sofascore fetch above
  // Gives us real marketId/outcomeId for every pick including replacements
  let liveMarketsMap = new Map<string, AvailableMarket[]>()
  if (allowSwitching) {
    liveMarketsMap = await fetchLiveMarketsForEvents(games)
    console.log('[analyseSlip] live markets fetched for', liveMarketsMap.size, 'of', games.length, 'games')
  }

  // PHASE 2: Smart pre-filter using actual data — zero AI tokens
  const preResults = new Map<string, PreFilterResult>()
  const needsAI: Array<{ game: SportyBetGame; bsd: BSDData; sofa: string; preReason: string }> = []

  for (const game of games) {
    const d = dataMap.get(game.eventId) || { bsd: emptyBSD(), sofaRaw: '', dataSource: 'AI_WEB_SEARCH' }
    const pre = smartPreFilter(game, d.bsd, allowSwitching)
    preResults.set(game.eventId, pre)
    if (pre.decision === 'ai') {
      needsAI.push({ game, bsd: d.bsd, sofa: d.sofaRaw, preReason: pre.reason })
    }
  }

  // PHASE 3: Single AI call for genuinely unclear games only
  const aiDecisions = await getAIDecisions(needsAI, allowSwitching)

  // PHASE 4: Build final analysis
  const analysisResults: GameAnalysis[] = games.map(game => {
    const d = dataMap.get(game.eventId) || { bsd: emptyBSD(), sofaRaw: '', dataSource: 'AI_WEB_SEARCH' }
    const pre = preResults.get(game.eventId)!
    const ai = aiDecisions.get(game.eventId)

    let finalKeep = true
    let finalReplacement: { pick: string; market: string; reason: string } | null = null
    let finalConfidence = pre.confidence
    let finalReason = pre.reason
    let finalRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'

    if (pre.decision === 'remove') {
      finalKeep = false
      finalRiskLevel = 'HIGH'
    } else if (pre.decision === 'replace' && pre.suggestedPick && pre.suggestedMarket) {
      finalKeep = true
      finalRiskLevel = 'HIGH'
      finalReplacement = { pick: pre.suggestedPick, market: pre.suggestedMarket, reason: pre.reason }
    } else if (pre.decision === 'keep') {
      finalKeep = true
      finalRiskLevel = pre.confidence >= 70 ? 'LOW' : 'MEDIUM'
    } else if (pre.decision === 'ai' && ai) {
      finalKeep = ai.keep
      finalRiskLevel = ai.riskLevel || 'MEDIUM'
      finalConfidence = ai.confidenceScore || pre.confidence
      finalReason = ai.reason || pre.reason
      if (ai.replacePick && ai.replaceMarket) {
        finalReplacement = { pick: ai.replacePick, market: ai.replaceMarket, reason: ai.replacementReason || pre.reason }
      }
    }

    const base: GameAnalysis = {
      ...game,
      riskLevel: finalRiskLevel,
      riskScore: finalRiskLevel === 'HIGH' ? 8 : finalRiskLevel === 'MEDIUM' ? 4 : 2,
      confidenceScore: finalConfidence,
      reason: finalReason,
      formSummary: ai?.formSummary || (d.bsd.hasData ? `H2H: ${d.bsd.h2hHomeWins}W-${d.bsd.h2hDraws}D-${d.bsd.h2hAwayWins}L` : ''),
      keep: finalKeep,
      dataSource: d.dataSource,
    }

    if (allowSwitching && finalReplacement && finalKeep) {
      // Use live markets from Cloudflare Worker — real SportyBet data
      const liveMarkets = liveMarketsMap.get(game.eventId) || game.availableMarkets || []

      // Find safest pick from real live market data
      const safest = liveMarkets.length
        ? findSafestPickFromMarkets(liveMarkets, game.marketId, game.outcomeId, game.odds)
        : null

      const finalPick = safest?.pick || finalReplacement.pick
      const finalMarket = safest?.market || finalReplacement.market
      const finalMarketId = safest?.marketId || null
      const finalOutcomeId = safest?.outcomeId || null
      const finalOdds = safest?.odds || estimateSaferOdds(game.odds, finalPick, finalMarket)

      // Fallback to hardcoded IDs if no live data
      const fallbackIds = !finalMarketId ? (
        hardcodedIds(finalPick, finalMarket) ||
        getSmartReplacement(game.marketId, game.outcomeId, game.pick, game.market, game.odds) ||
        (liveMarkets.length
          ? (() => { const r = resolveFromAvailableMarkets(liveMarkets, finalPick, finalMarket, game.odds); return r ? { marketId: r.marketId, outcomeId: r.outcomeId } : null })()
          : null)
      ) : null

      const resolvedMarketId = finalMarketId || fallbackIds?.marketId
      const resolvedOutcomeId = finalOutcomeId || fallbackIds?.outcomeId

      if (resolvedMarketId && resolvedOutcomeId) {
        return {
          ...base,
          keep: true,
          replaced: true,
          originalPick: game.pick,
          originalMarket: game.market,
          originalOdds: game.odds,
          replacedPick: finalPick,
          replacedMarketDesc: finalMarket,
          replacedOdds: finalOdds,
          replacementReason: safest
            ? `Safest available: ${finalPick} (${finalMarket}) @ ${finalOdds} — verified from SportyBet live data`
            : finalReplacement.reason,
          marketId: resolvedMarketId,
          outcomeId: resolvedOutcomeId,
          specifier: null,
          needsResolution: false,
        }
      }
    }

    return base
  })

  const kept = analysisResults.filter(g => g.keep)
  const removed = analysisResults.filter(g => !g.keep)
  let keptGames = findBestCombination(kept, targetOdds)
  if (keptGames.length < 2) {
    const safest = [...removed].sort((a, b) => b.confidenceScore - a.confidenceScore)
    for (const g of safest) { if (keptGames.length >= 2) break; keptGames.push(g) }
  }

  // PHASE 5: Real IDs already resolved from live markets in Phase 1B + 4
  // No additional proxy calls needed
  const replacedGames = keptGames.filter(g => g.replaced)
  console.log('[analyseSlip] replaced games:', replacedGames.length)

  const keptIds = new Set(keptGames.map(g => g.eventId))
  const finalGames = analysisResults.map(g => ({ ...g, keep: keptIds.has(g.eventId) }))
  const removedGames = finalGames.filter(g => !g.keep)
  const replacedCount = keptGames.filter(g => g.replaced).length
  const finalNewOdds = keptGames.reduce((acc, g) => acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)

  const summary = await generateSummary(username, games.length, keptGames.length, removedGames.length, replacedCount, finalNewOdds, targetOdds)

  return {
    games: finalGames,
    removedGames,
    keptGames,
    originalOdds: parseFloat(originalTotalOdds.toFixed(2)),
    newOdds: parseFloat(finalNewOdds.toFixed(2)),
    targetOdds,
    summary,
  }
}