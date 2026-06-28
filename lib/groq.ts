import Groq from 'groq-sdk'
import Anthropic from '@anthropic-ai/sdk'
import { SportyBetGame, resolveFromAvailableMarkets, getSmartReplacement, findSafestPickFromMarkets, fetchLiveMarketsForEvents, AvailableMarket } from './sportybet'
import { sendAdminAlert } from './email'
import { Redis } from '@upstash/redis'

const PROXY_URL = 'https://sportybet-proxy.grooveslip.workers.dev'
const PROXY_KEY = 'grooveslip_proxy_2026'
const ADMIN_EMAIL = 'simeonadigun0@gmail.com'

// ─── AI PROVIDER CONFIG ────────────────────────────────────────────────────
const PRIMARY_AI: 'claude' | 'groq' = 'groq'
const FALLBACK_AI: 'claude' | 'groq' = 'groq'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

// ─── REDIS TOKEN TRACKING ──────────────────────────────────────────────────
let redis: Redis | null = null
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  }
} catch { redis = null }

const TOKEN_BUDGETS = {
  groq: parseInt(process.env.GROQ_DAILY_TOKEN_BUDGET || '500000'),
  claude: parseInt(process.env.CLAUDE_DAILY_TOKEN_BUDGET || '100000'),
}

async function trackTokens(provider: 'groq' | 'claude', tokensUsed: number) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const key = `token_usage:${provider}:${today}`
    const alertKey = `token_alert_sent:${provider}:${today}`
    let currentUsage = tokensUsed
    let alertSent = false
    if (redis) {
      currentUsage = await redis.incrby(key, tokensUsed)
      await redis.expire(key, 90000)
      alertSent = !!(await redis.get(alertKey))
    }
    const budget = TOKEN_BUDGETS[provider]
    const usagePercent = currentUsage / budget
    if (usagePercent >= 0.80 && !alertSent) {
      if (redis) await redis.set(alertKey, '1', { ex: 90000 })
      const percent = Math.round(usagePercent * 100)
      await sendAdminAlert({
        subject: `🚨 Groove Slip — ${provider.toUpperCase()} API at ${percent}% token budget`,
        text: `Your ${provider.toUpperCase()} API has used ${percent}% of its daily token budget.\n\nTokens used: ${currentUsage.toLocaleString()} / ${budget.toLocaleString()}\nDate: ${today}\n\nGo to ${provider === 'groq' ? 'console.groq.com' : 'console.anthropic.com'} to check usage.\nUpdate the key in Vercel environment variables if needed.\n\nGroove Slip will automatically use ${FALLBACK_AI.toUpperCase()} as fallback.`,
      })
    }
  } catch (err) {
    console.error('[trackTokens]', err)
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

// ─── BSD DATA ──────────────────────────────────────────────────────────────
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
  return { raw: '', predictionResult: null, probHome: 0, probDraw: 0, probAway: 0, homeForm: '', awayForm: '', h2hHomeWins: 0, h2hDraws: 0, h2hAwayWins: 0, avgGoalsH2H: 0, homeAvgScored: 0, homeAvgConceded: 0, awayAvgScored: 0, awayAvgConceded: 0, hasData: false }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))])
}

async function getBSDData(homeTeam: string, awayTeam: string): Promise<BSDData> {
  try {
    const yesterday = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
    const next2w = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    for (const term of [homeTeam, homeTeam.split(' ')[0], awayTeam]) {
      const res = await withTimeout(
        fetch(`${BSD_BASE}/events/?team=${encodeURIComponent(term)}&date_from=${yesterday}&date_to=${next2w}&limit=20`, { headers: bsdHeaders }),
        5000, null as unknown as Response
      )
      if (!res || !res.ok) continue
      const data = await res.json()
      const match = (data.results || []).find((e: unknown) => {
        const ev = e as Record<string, unknown>
        return teamsMatch(ev.home_team as string || '', ev.away_team as string || '', homeTeam, awayTeam)
      })
      if (!match) continue
      const ev = match as Record<string, unknown>
      const det = await withTimeout(fetch(`${BSD_BASE}/events/${ev.id}/`, { headers: bsdHeaders }), 5000, null as unknown as Response)
      const event = (det && det.ok) ? await det.json() : ev
      const hf = event.home_form as Record<string, unknown> | null
      const af = event.away_form as Record<string, unknown> | null
      const h2h = event.head_to_head as Record<string, unknown> | null
      const pred = event.prediction as Record<string, unknown> | null
      const homeWins = Number(hf?.wins || 0), homeDraws = Number(hf?.draws || 0), homeLosses = Number(hf?.losses || 0)
      const awayWins = Number(af?.wins || 0), awayDraws = Number(af?.draws || 0), awayLosses = Number(af?.losses || 0)
      const homeScored = Number(hf?.goals_scored_last_n || 0), homeConceded = Number(hf?.goals_conceded_last_n || 0)
      const awayScored = Number(af?.goals_scored_last_n || 0), awayConceded = Number(af?.goals_conceded_last_n || 0)
      const homeGames = homeWins + homeDraws + homeLosses || 1
      const awayGames = awayWins + awayDraws + awayLosses || 1
      const h2hHW = Number(h2h?.home_wins || 0), h2hD = Number(h2h?.draws || 0), h2hAW = Number(h2h?.away_wins || 0)
      const h2hTotal = h2hHW + h2hD + h2hAW || 1
      const h2hGoals = Number(h2h?.total_goals || 0)
      const probHome = Number(pred?.prob_home_win || 0), probDraw = Number(pred?.prob_draw || 0), probAway = Number(pred?.prob_away_win || 0)
      const predResult = String(pred?.predicted_result || '')

      // ── RICHER READABLE STATS (key upgrade) ──
      const parts: string[] = []
      if (hf) parts.push(
        `HOME FORM: ${hf.form_string || '?'} | W${homeWins} D${homeDraws} L${homeLosses} | Scored ${homeScored} Conceded ${homeConceded} (avg ${(homeScored/homeGames).toFixed(1)} scored, ${(homeConceded/homeGames).toFixed(1)} conceded per game)`
      )
      if (af) parts.push(
        `AWAY FORM: ${af.form_string || '?'} | W${awayWins} D${awayDraws} L${awayLosses} | Scored ${awayScored} Conceded ${awayConceded} (avg ${(awayScored/awayGames).toFixed(1)} scored, ${(awayConceded/awayGames).toFixed(1)} conceded per game)`
      )
      if (h2h) parts.push(
        `H2H (${h2hTotal} meetings): Home wins ${h2hHW} | Draws ${h2hD} | Away wins ${h2hAW} | Total goals ${h2hGoals} (avg ${(h2hGoals/h2hTotal).toFixed(1)} per game)`
      )
      if (pred) parts.push(
        `PREDICTION: ${predResult || 'N/A'} | Home win ${probHome}% | Draw ${probDraw}% | Away win ${probAway}%`
      )

      return {
        raw: parts.join('\n'),
        predictionResult: predResult || null,
        probHome, probDraw, probAway,
        homeForm: String(hf?.form_string || ''),
        awayForm: String(af?.form_string || ''),
        h2hHomeWins: h2hHW, h2hDraws: h2hD, h2hAwayWins: h2hAW,
        avgGoalsH2H: h2hGoals / h2hTotal,
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
      const res = await withTimeout(fetch(`${SOFA_BASE}/search/teams/${encodeURIComponent(name)}`, { headers: sofaHeaders }), 4000, null as unknown as Response)
      if (!res || !res.ok) return null
      const teams = (await res.json()).teams || []
      const match = teams.find((t: unknown) => normalize((t as Record<string, unknown>).name as string || '').includes(normalize(name).split(' ')[0]))
      return ((match || teams[0]) as Record<string, unknown>)?.id as number || null
    }
    const getForm = async (id: number, name: string): Promise<string> => {
      const res = await withTimeout(fetch(`${SOFA_BASE}/team/${id}/events/last/0`, { headers: sofaHeaders }), 4000, null as unknown as Response)
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
      return `${name} last 5: W${w} D${d} L${l}`
    }
    const [hId, aId] = await Promise.all([getId(homeTeam), getId(awayTeam)])
    if (!hId && !aId) return ''
    const [hf, af] = await Promise.all([hId ? getForm(hId, homeTeam) : Promise.resolve(''), aId ? getForm(aId, awayTeam) : Promise.resolve('')])
    return [hf, af].filter(Boolean).join(' | ')
  } catch { return '' }
}

// ─── SMART PRE-FILTER ─────────────────────────────────────────────────────
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

  // Already safest markets — keep
  if (market.includes('double chance') && !market.includes('1up') && !market.includes('2up')) {
    return { decision: 'keep', confidence: 78, reason: 'Double Chance is already a safe market' }
  }
  if (market.includes('draw no bet')) {
    return { decision: 'keep', confidence: 76, reason: 'Draw No Bet is a safe market' }
  }
  if (market.includes('over/under') && !market.includes('corner') && pick === 'over 0.5') {
    return { decision: 'keep', confidence: 80, reason: 'Over 0.5 is the safest over/under line' }
  }

  // No data — use smart market-based decisions
  if (!bsd.hasData) {
    if (market.includes('2up')) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 32, reason: '2UP requires dominant winning margin — risky without data', suggestedPick: pick === 'home' || pick === '1' ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }
    if (market.includes('1up')) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: '1UP requires winning margin — risky without data', suggestedPick: pick === 'home' || pick === '1' ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }
    if ((market === '1x2' || market.includes('1x2')) && (pick === 'draw' || pick === 'x')) {
      return { decision: allowSwitching ? 'replace' : 'remove', confidence: 35, reason: 'Draw without data — too unpredictable', suggestedPick: 'Home/Draw', suggestedMarket: 'Double Chance' }
    }
    if ((market === '1x2' || market.includes('1x2')) && (pick === 'away' || pick === '2')) {
      return { decision: allowSwitching ? 'replace' : 'remove', confidence: 35, reason: `Away win at ${odds} without data — risky`, suggestedPick: 'Draw/Away', suggestedMarket: 'Double Chance' }
    }
    if ((market === '1x2' || market.includes('1x2')) && (pick === 'home' || pick === '1') && odds >= 2.0) {
      return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: `Home win at ${odds} without data — risky`, suggestedPick: 'Home/Draw', suggestedMarket: 'Double Chance' }
    }
    if (market.includes('over/under') && !market.includes('corner')) {
      const num = parseFloat(pick.replace(/[^0-9.]/g, ''))
      if (pick.startsWith('over') && !isNaN(num)) {
        if (num >= 2.5) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: `Over ${num} without goal data — risky`, suggestedPick: num >= 3.5 ? 'Over 2.5' : 'Over 1.5', suggestedMarket: 'Over/Under' }
        if (num >= 1.5 && odds > 1.5) return { decision: allowSwitching ? 'replace' : 'ai', confidence: 44, reason: `Over ${num} at ${odds} needs data verification`, suggestedPick: 'Over 0.5', suggestedMarket: 'Over/Under' }
      }
    }
    if ((market.includes('gg') || market.includes('both teams')) && (pick === 'yes' || pick === 'gg')) {
      return { decision: allowSwitching ? 'replace' : 'ai', confidence: 45, reason: 'GG Yes needs scoring data', suggestedPick: 'No', suggestedMarket: 'GG/NG' }
    }
    if (odds >= 4.0) return { decision: 'remove', confidence: 28, reason: `Odds of ${odds} — very high risk without data` }
    if (odds >= 2.5) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 35, reason: `${odds} odds is significant risk without data`, suggestedPick: (market === '1x2' || market.includes('1x2')) ? (pick === 'home' || pick === '1' ? 'Home/Draw' : 'Draw/Away') : undefined, suggestedMarket: (market === '1x2' || market.includes('1x2')) ? 'Double Chance' : undefined }
    if (odds <= 1.4) return { decision: 'keep', confidence: 65, reason: `Low odds of ${odds} — safe enough without data` }
    return { decision: 'keep', confidence: 55, reason: `No data — kept based on acceptable odds (${odds})` }
  }

  // We have BSD data — make intelligent decisions
  let pickProbability = 0
  if (pick === 'home' || pick === '1') pickProbability = bsd.probHome
  else if (pick === 'away' || pick === '2') pickProbability = bsd.probAway
  else if (pick === 'draw' || pick === 'x') pickProbability = bsd.probDraw

  // 1X2 decisions
  if (market === '1x2' || (market.includes('1x2') && !market.includes('up'))) {
    if (pickProbability >= 65) return { decision: 'keep', confidence: Math.min(85, pickProbability), reason: `BSD strongly supports this pick at ${pickProbability}% win probability` }
    if (pickProbability >= 50) return { decision: 'ai', confidence: pickProbability, reason: `Moderate ${pickProbability}% probability — AI will weigh form and H2H` }
    if (pick === 'draw' || pick === 'x') return { decision: allowSwitching ? 'replace' : 'remove', confidence: 35, reason: `Draw probability only ${bsd.probDraw}% — data does not support`, suggestedPick: bsd.probHome > bsd.probAway ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }
    return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: `Only ${pickProbability}% win probability — data does not support this pick`, suggestedPick: pick === 'home' || pick === '1' ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }
  }

  // Over/Under using real goal data
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
          if (!goalsMarginal) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 40, reason: `Low expected goals (${expectedGoals.toFixed(1)}, H2H ${h2hAvg.toFixed(1)}) — Over ${num} is risky`, suggestedPick: 'Over 0.5', suggestedMarket: 'Over/Under' }
          return { decision: 'ai', confidence: 55, reason: `Borderline scoring data for Over ${num} — AI will assess` }
        }
        if (num >= 2.5) {
          if (goalsSupport) return { decision: 'keep', confidence: 65, reason: `Strong scoring data (exp ${expectedGoals.toFixed(1)}, H2H ${h2hAvg.toFixed(1)}) supports Over ${num}` }
          return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: `Expected goals ${expectedGoals.toFixed(1)} insufficient for Over ${num}`, suggestedPick: num >= 3.5 ? 'Over 2.5' : 'Over 1.5', suggestedMarket: 'Over/Under' }
        }
        if (goalsSupport) return { decision: 'keep', confidence: 68, reason: `Goal data supports Over ${num} (expected ${expectedGoals.toFixed(1)})` }
        if (!goalsMarginal) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 42, reason: `Low expected goals (${expectedGoals.toFixed(1)}) for Over ${num}`, suggestedPick: 'Over 0.5', suggestedMarket: 'Over/Under' }
        return { decision: 'ai', confidence: 52, reason: `Marginal goal data for Over ${num} — AI will decide` }
      }
    }
  }

  // GG/Both Teams
  if (market.includes('gg') || market.includes('both teams')) {
    if (pick === 'yes' || pick === 'gg') {
      const bothScore = bsd.homeAvgScored >= 1.0 && bsd.awayAvgScored >= 0.8
      const h2hBothScore = bsd.avgGoalsH2H >= 2.0
      if (bothScore && h2hBothScore) return { decision: 'keep', confidence: 70, reason: `Both teams score regularly — home ${bsd.homeAvgScored.toFixed(1)} avg, away ${bsd.awayAvgScored.toFixed(1)} avg` }
      if (bsd.homeAvgScored < 0.6 || bsd.awayAvgScored < 0.6) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 38, reason: `One team rarely scores (home ${bsd.homeAvgScored.toFixed(1)}, away ${bsd.awayAvgScored.toFixed(1)}) — GG Yes is risky`, suggestedPick: 'No', suggestedMarket: 'GG/NG' }
      return { decision: 'ai', confidence: 52, reason: 'Mixed scoring data — AI will assess GG probability' }
    }
  }

  // 2UP
  if (market.includes('2up')) {
    if ((pick === 'home' || pick === '1') && bsd.probHome >= 70 && bsd.homeAvgScored >= 2.0) return { decision: 'ai', confidence: 55, reason: `Home dominant at ${bsd.probHome}% probability — AI will verify 2UP viability` }
    return { decision: allowSwitching ? 'replace' : 'remove', confidence: 35, reason: `Data doesn't support 2UP margin — home probability ${bsd.probHome}%`, suggestedPick: pick === 'home' || pick === '1' ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }
  }

  // 1UP
  if (market.includes('1up')) {
    if ((pick === 'home' || pick === '1') && bsd.probHome >= 60) return { decision: 'ai', confidence: 58, reason: `${bsd.probHome}% home probability — AI will assess 1UP` }
    if ((pick === 'away' || pick === '2') && bsd.probAway >= 60) return { decision: 'ai', confidence: 58, reason: `${bsd.probAway}% away probability — AI will assess 1UP` }
    return { decision: allowSwitching ? 'replace' : 'remove', confidence: 40, reason: `Insufficient probability for 1UP`, suggestedPick: pick === 'home' || pick === '1' ? 'Home/Draw' : 'Draw/Away', suggestedMarket: 'Double Chance' }
  }

  if (odds >= 4.0) return { decision: 'remove', confidence: 30, reason: `Odds of ${odds} — very high risk` }
  if (odds >= 2.5 && pickProbability > 0 && pickProbability < 45) return { decision: allowSwitching ? 'replace' : 'remove', confidence: 35, reason: `Only ${pickProbability}% probability at ${odds} odds` }
  return { decision: 'ai', confidence: 60, reason: 'AI will analyse available data for final decision' }
}

// ─── AI ANALYSIS ──────────────────────────────────────────────────────────
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

function buildAIPrompt(
  games: Array<{ game: SportyBetGame; bsd: BSDData; sofa: string; preReason: string; liveMarkets: AvailableMarket[] }>,
  allowSwitching: boolean
): string {
  const gameLines = games.map((gd, i) => {
    // Use rich readable stats, fall back to sofascore, then flag no data
    const stats = gd.bsd.hasData
      ? gd.bsd.raw
      : gd.sofa
        ? `Sofascore form: ${gd.sofa}`
        : 'No statistical data available — use odds and market context only'

    // Build available safe options from LIVE SportyBet market data
    let saferOptions = 'No live market data — use best judgment'
    if (gd.liveMarkets.length > 0) {
      const safePicks: string[] = []
      for (const m of gd.liveMarkets) {
        const md = m.desc.toLowerCase()
        if (md.includes('corner') || md.includes('card') || md.includes('half') || md.includes('player')) continue
        for (const o of m.outcomes) {
          if (o.odds >= gd.game.odds) continue
          if (o.odds <= 1.03) continue
          const oDesc = o.desc.toLowerCase()
          if (oDesc.startsWith('over')) {
            const num = parseFloat(oDesc.replace(/[^0-9.]/g, ''))
            if (!isNaN(num) && num >= 2.5) continue
          }
          safePicks.push(`"${o.desc}" in market "${m.desc}" @ odds ${o.odds}`)
          if (safePicks.length >= 6) break
        }
        if (safePicks.length >= 6) break
      }
      saferOptions = safePicks.length > 0
        ? safePicks.join(' | ')
        : 'No safer options found in live data'
    }

    return `── GAME ${i + 1} ──────────────────────────────
Event ID: ${gd.game.eventId}
Match: ${gd.game.homeTeam} vs ${gd.game.awayTeam}
League: ${gd.game.league}
Current Pick: ${gd.game.pick} | Market: ${gd.game.market} | Odds: ${gd.game.odds}
Pre-filter note: ${gd.preReason}

STATISTICAL DATA:
${stats}

AVAILABLE SAFER PICKS (from live SportyBet data):
${saferOptions}`
  }).join('\n\n')

  return `You are a sharp, experienced football betting analyst working for Groove Slip — a slip optimisation platform for Nigerian punters. Your job is to protect users from risky picks and replace them with smarter, data-backed alternatives.

${allowSwitching
    ? `YOU ARE IN REPLACE MODE. Follow these rules strictly:

1. For each game, read the statistical data carefully. Do not skim.
2. If the stats STRONGLY support the current pick (win probability ≥ 65%, consistent form, H2H backs it) → KEEP it. Set replacePick and replaceMarket to null.
3. If the pick is risky or stats don't support it → choose the SMARTEST option from the "AVAILABLE SAFER PICKS" list.
4. replacePick must be the EXACT text of the pick as listed (e.g. "Home/Draw", "Over 1.5").
5. replaceMarket must be the EXACT market name as listed (e.g. "Double Chance", "Over/Under").
6. Do NOT always default to Over 0.5 — it is boring and lazy. If a team is dominant at home, Home/Draw is smarter. Think about what the data actually says.
7. Your reason and replacementReason must reference specific numbers from the stats (probability %, form record, goals average, H2H record). Never write vague reasons.
8. If no safer pick exists in the live data → keep original pick.
9. Your confidenceScore (0–100) must reflect the actual strength of the data behind your decision.`
    : `YOU ARE IN REMOVE MODE. Decide keep or remove based purely on stats. Set replacePick and replaceMarket to null. Your reason must cite specific numbers.`}

${gameLines}

Return ONLY a valid JSON array. No markdown, no explanation, no preamble. One object per game in the same order:
[{"eventId":"ID","keep":true,"riskLevel":"LOW","confidenceScore":72,"reason":"Specific data-backed reason referencing actual stats","formSummary":"Key stat summary e.g. home team W4D0L1 last 5, 68% win prob","replacePick":null,"replaceMarket":null,"replacementReason":null}]`
}

// ─── GROQ CALL — upgraded to llama-3.3-70b-versatile ─────────────────────
async function callGroq(
  games: Array<{ game: SportyBetGame; bsd: BSDData; sofa: string; preReason: string; liveMarkets: AvailableMarket[] }>,
  allowSwitching: boolean
): Promise<AIDecision[]> {
  const prompt = buildAIPrompt(games, allowSwitching)
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile', // UPGRADED from llama-3.1-8b-instant
    messages: [
      {
        role: 'system',
        content: 'You are a football betting analyst API. Output ONLY a valid JSON array with one object per game. No markdown, no explanation, no preamble. Numbers must be accurate to the data provided.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.15, // slightly up from 0.1 — allows slightly more natural reasoning without going loose
    max_tokens: 500 * games.length, // UPGRADED from 250 — enough room to reason properly
  })
  const raw = completion.choices[0]?.message?.content || '[]'
  await trackTokens('groq', completion.usage?.total_tokens || 0)
  return parseAIResponse(raw)
}

// ─── CLAUDE CALL — upgraded token budget ──────────────────────────────────
async function callClaude(
  games: Array<{ game: SportyBetGame; bsd: BSDData; sofa: string; preReason: string; liveMarkets: AvailableMarket[] }>,
  allowSwitching: boolean
): Promise<AIDecision[]> {
  const prompt = buildAIPrompt(games, allowSwitching)
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500 * games.length, // UPGRADED from 280
    messages: [{ role: 'user', content: prompt }],
    system: 'You are a football betting analyst API. Output ONLY a valid JSON array with one object per game. No markdown, no explanation, no preamble.',
  })
  const raw = response.content
    .filter((b: { type: string; text?: string }) => b.type === 'text')
    .map((b: { type: string; text?: string }) => b.text || '')
    .join('')
  await trackTokens('claude', response.usage.input_tokens + response.usage.output_tokens)
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
  games: Array<{ game: SportyBetGame; bsd: BSDData; sofa: string; preReason: string; liveMarkets: AvailableMarket[] }>,
  allowSwitching: boolean
): Promise<Map<string, AIDecision>> {
  const map = new Map<string, AIDecision>()
  if (games.length === 0) return map
  let results: AIDecision[] = []
  try {
    results = PRIMARY_AI === 'claude' ? await callClaude(games, allowSwitching) : await callGroq(games, allowSwitching)
  } catch (primaryErr) {
    console.error(`[AI] ${PRIMARY_AI} failed:`, primaryErr)
    try {
      results = FALLBACK_AI === 'claude' ? await callClaude(games, allowSwitching) : await callGroq(games, allowSwitching)
    } catch {
      for (const gd of games) {
        map.set(gd.game.eventId, {
          eventId: gd.game.eventId, keep: true, riskLevel: 'MEDIUM', confidenceScore: 50,
          reason: gd.preReason, formSummary: '',
          replacePick: null, replaceMarket: null, replacementReason: null,
        })
      }
      return map
    }
  }
  for (const r of results) {
    if (r.eventId) map.set(r.eventId, r)
  }
  for (const gd of games) {
    if (!map.has(gd.game.eventId)) {
      map.set(gd.game.eventId, {
        eventId: gd.game.eventId, keep: true, riskLevel: 'MEDIUM', confidenceScore: 52,
        reason: gd.preReason, formSummary: '',
        replacePick: null, replaceMarket: null, replacementReason: null,
      })
    }
  }
  return map
}

// ─── HARDCODED IDs FALLBACK ────────────────────────────────────────────────
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
  'home|1x2': { marketId: '1', outcomeId: '1' },
  'draw|1x2': { marketId: '1', outcomeId: '2' },
  'away|1x2': { marketId: '1', outcomeId: '3' },
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

// ─── SUMMARY GENERATION — upgraded model ──────────────────────────────────
async function generateSummary(
  username: string,
  totalGames: number,
  keptCount: number,
  removedCount: number,
  replacedCount: number,
  newOdds: number,
  targetOdds: number
): Promise<string> {
  const fallback = `Hi ${username}, checked ${totalGames} games and kept ${keptCount} solid ones at ${newOdds.toFixed(2)} odds (target: ${targetOdds}). Cut ${removedCount} risky picks${replacedCount > 0 ? ` and swapped ${replacedCount} for safer options` : ''} — your slip is cleaner now.`

  const userMsg = `Write EXACTLY 2 sentences for a Nigerian sports bettor. First sentence starts with "Hi ${username}," and mentions how many games were checked and kept plus the new odds. Second sentence mentions what was removed or swapped and why the slip is better. Casual, friendly, direct. No markdown, no asterisks, no bullet points. STOP after 2 sentences.\n\nFacts: ${totalGames} games checked, ${keptCount} kept at ${newOdds.toFixed(2)} odds, target was ${targetOdds}, cut ${removedCount} risky picks${replacedCount > 0 ? `, swapped ${replacedCount} for safer picks` : ''}.`

  try {
    if (PRIMARY_AI === 'claude') {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [{ role: 'user', content: userMsg }],
        system: 'Write 2-sentence betting summaries for Nigerian punters. Casual, warm, direct. No markdown. Exactly 2 sentences.',
      })
      const text = response.content
        .filter((b: { type: string; text?: string }) => b.type === 'text')
        .map((b: { type: string; text?: string }) => b.text || '')
        .join('')
      await trackTokens('claude', response.usage.input_tokens + response.usage.output_tokens)
      return text || fallback
    } else {
      const sc = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // UPGRADED from llama-3.1-8b-instant
        messages: [
          {
            role: 'system',
            content: 'Write 2-sentence betting summaries for Nigerian punters. Casual, warm, direct. No markdown. Exactly 2 sentences. STOP after 2 sentences.',
          },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.5,
        max_tokens: 120, // slightly more room for natural phrasing
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

  // PHASE 1: Fetch BSD + Sofascore + Live Markets ALL in parallel
  const [dataMapResult, liveMarketsMap] = await Promise.all([
    Promise.all(
      games.filter(isFootball).map(async (g) => {
        const [bsd, sofa] = await Promise.all([getBSDData(g.homeTeam, g.awayTeam), getSofaData(g.homeTeam, g.awayTeam)])
        return {
          eventId: g.eventId,
          bsd,
          sofaRaw: sofa,
          dataSource: bsd.hasData && sofa ? 'BSD+SOFASCORE' : bsd.hasData ? 'BSD' : sofa ? 'SOFASCORE' : 'AI_WEB_SEARCH',
        }
      })
    ).then(results => {
      const map = new Map<string, GameData>()
      results.forEach(r => map.set(r.eventId, r))
      return map
    }),
    fetchLiveMarketsForEvents(games),
  ])

  const dataMap = dataMapResult
  console.log('[analyseSlip] live markets fetched for', liveMarketsMap.size, 'of', games.length, 'games')
  console.log('[analyseSlip] allowSwitching:', allowSwitching)

  // PHASE 2: Smart pre-filter using BSD data — zero AI tokens
  const preResults = new Map<string, PreFilterResult>()
  const needsAI: Array<{ game: SportyBetGame; bsd: BSDData; sofa: string; preReason: string; liveMarkets: AvailableMarket[] }> = []

  for (const game of games) {
    const d = dataMap.get(game.eventId) || { bsd: emptyBSD(), sofaRaw: '', dataSource: 'AI_WEB_SEARCH' }
    const pre = smartPreFilter(game, d.bsd, allowSwitching)
    preResults.set(game.eventId, pre)
    if (pre.decision === 'ai') {
      needsAI.push({
        game,
        bsd: d.bsd,
        sofa: d.sofaRaw,
        preReason: pre.reason,
        liveMarkets: liveMarketsMap.get(game.eventId) || [],
      })
    }
  }

  // PHASE 3: AI for unclear games only
  const aiDecisions = await getAIDecisions(needsAI, allowSwitching)

  // PHASE 4: Build final analysis
  const analysisResults: GameAnalysis[] = games.map(game => {
    const d = dataMap.get(game.eventId) || { bsd: emptyBSD(), sofaRaw: '', dataSource: 'AI_WEB_SEARCH' }
    const pre = preResults.get(game.eventId)!
    const ai = aiDecisions.get(game.eventId)
    const liveMarkets = liveMarketsMap.get(game.eventId) || game.availableMarkets || []

    let finalKeep = true
    let finalReplacement: { pick: string; market: string; reason: string; marketId?: string; outcomeId?: string; odds?: number } | null = null
    let finalConfidence = pre.confidence
    let finalReason = pre.reason
    let finalRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'

    if (pre.decision === 'remove') {
      finalKeep = false
      finalRiskLevel = 'HIGH'
    } else if (pre.decision === 'replace' && pre.suggestedPick && pre.suggestedMarket) {
      finalKeep = true
      finalRiskLevel = 'HIGH'
      const safest = findSafestPickFromMarkets(liveMarkets, game.marketId, game.outcomeId, game.odds)
      if (safest) {
        finalReplacement = { pick: safest.pick, market: safest.market, reason: pre.reason, marketId: safest.marketId, outcomeId: safest.outcomeId, odds: safest.odds }
      } else {
        finalReplacement = { pick: pre.suggestedPick, market: pre.suggestedMarket, reason: pre.reason }
      }
    } else if (pre.decision === 'keep') {
      finalKeep = true
      finalRiskLevel = pre.confidence >= 70 ? 'LOW' : 'MEDIUM'
    } else if (pre.decision === 'ai' && ai) {
      finalKeep = ai.keep
      finalRiskLevel = (['LOW', 'MEDIUM', 'HIGH'].includes(ai.riskLevel) ? ai.riskLevel : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH'
      finalConfidence = ai.confidenceScore || pre.confidence
      finalReason = ai.reason || pre.reason

      if (allowSwitching && ai.replacePick && ai.replaceMarket) {
        const aiPick = ai.replacePick.toLowerCase()
        const aiMarket = ai.replaceMarket.toLowerCase()
        let foundInLive: { marketId: string; outcomeId: string; odds: number } | null = null

        for (const m of liveMarkets) {
          const md = m.desc.toLowerCase()
          if (!md.includes(aiMarket) && !aiMarket.includes(md)) continue
          for (const o of m.outcomes) {
            const od = o.desc.toLowerCase()
            if (od === aiPick || od.includes(aiPick) || aiPick.includes(od)) {
              foundInLive = { marketId: m.id, outcomeId: o.id, odds: o.odds }
              break
            }
          }
          if (foundInLive) break
        }

        if (foundInLive) {
          finalReplacement = { pick: ai.replacePick, market: ai.replaceMarket, reason: ai.replacementReason || pre.reason, marketId: foundInLive.marketId, outcomeId: foundInLive.outcomeId, odds: foundInLive.odds }
        } else {
          const safest = findSafestPickFromMarkets(liveMarkets, game.marketId, game.outcomeId, game.odds)
          if (safest) {
            finalReplacement = { pick: safest.pick, market: safest.market, reason: ai.replacementReason || pre.reason, marketId: safest.marketId, outcomeId: safest.outcomeId, odds: safest.odds }
          } else {
            finalReplacement = { pick: ai.replacePick, market: ai.replaceMarket, reason: ai.replacementReason || pre.reason }
          }
        }
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
      const resolvedMarketId = finalReplacement.marketId ||
        hardcodedIds(finalReplacement.pick, finalReplacement.market)?.marketId ||
        getSmartReplacement(game.marketId, game.outcomeId, game.pick, game.market, game.odds)?.marketId

      const resolvedOutcomeId = finalReplacement.outcomeId ||
        hardcodedIds(finalReplacement.pick, finalReplacement.market)?.outcomeId ||
        getSmartReplacement(game.marketId, game.outcomeId, game.pick, game.market, game.odds)?.outcomeId ||
        (() => { const r = resolveFromAvailableMarkets(liveMarkets, finalReplacement!.pick, finalReplacement!.market, game.odds); return r?.outcomeId })()

      if (resolvedMarketId && resolvedOutcomeId) {
        return {
          ...base,
          keep: true,
          replaced: true,
          originalPick: game.pick,
          originalMarket: game.market,
          originalOdds: game.odds,
          replacedPick: finalReplacement.pick,
          replacedMarketDesc: finalReplacement.market,
          replacedOdds: finalReplacement.odds || estimateSaferOdds(game.odds, finalReplacement.pick, finalReplacement.market),
          replacementReason: finalReplacement.reason,
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

  const keptIds = new Set(keptGames.map(g => g.eventId))
  const finalGames = analysisResults.map(g => ({ ...g, keep: keptIds.has(g.eventId) }))
  const removedGames = finalGames.filter(g => !g.keep)
  const replacedCount = keptGames.filter(g => g.replaced).length
  const finalNewOdds = keptGames.reduce((acc, g) => acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)

  console.log('[analyseSlip] replaced games:', replacedCount)

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