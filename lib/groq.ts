import Groq from 'groq-sdk'
import Anthropic from '@anthropic-ai/sdk'
import { SportyBetGame, resolveFromAvailableMarkets, getSmartReplacement } from './sportybet'
import { sendAdminAlert } from './email'

const PROXY_URL = 'https://sportybet-proxy.grooveslip.workers.dev'
const PROXY_KEY = 'grooveslip_proxy_2026'
const ADMIN_EMAIL = 'simeonadigun0@gmail.com'

// ─── AI PROVIDER CONFIG ────────────────────────────────────────────────────
// Primary: Claude | Fallback: Groq
// To swap: change PRIMARY_AI to 'groq' and FALLBACK_AI to 'claude'
const PRIMARY_AI: 'claude' | 'groq' = 'groq'       // change to 'claude' when ready
const FALLBACK_AI: 'claude' | 'groq' = 'groq'       // change to 'claude' when Claude is primary

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

// ─── TOKEN TRACKING ────────────────────────────────────────────────────────
// Groq free tier: ~500k tokens/day | Paid: based on plan
// Claude: based on plan
const TOKEN_BUDGETS = {
  groq: parseInt(process.env.GROQ_DAILY_TOKEN_BUDGET || '500000'),
  claude: parseInt(process.env.CLAUDE_DAILY_TOKEN_BUDGET || '100000'),
}
const ALERT_THRESHOLD = 0.80 // alert at 80%

// In-memory token counters (resets on cold start — good enough for daily tracking)
const tokenUsage = { groq: 0, claude: 0, groqAlertSent: false, claudeAlertSent: false }

async function trackTokens(provider: 'groq' | 'claude', tokensUsed: number) {
  tokenUsage[provider] += tokensUsed
  const budget = TOKEN_BUDGETS[provider]
  const usagePercent = tokenUsage[provider] / budget
  const alertKey = provider === 'groq' ? 'groqAlertSent' : 'claudeAlertSent'

  if (usagePercent >= ALERT_THRESHOLD && !tokenUsage[alertKey]) {
    tokenUsage[alertKey] = true
    const percent = Math.round(usagePercent * 100)
    try {
      await sendAdminAlert({
        subject: `🚨 Groove Slip — ${provider.toUpperCase()} API at ${percent}% token budget`,
        text: `Your ${provider.toUpperCase()} API has used ${percent}% of its daily token budget.\n\nTokens used: ${tokenUsage[provider].toLocaleString()} / ${budget.toLocaleString()}\n\nAction needed:\n- Go to ${provider === 'groq' ? 'console.groq.com' : 'console.anthropic.com'} to check usage\n- Consider upgrading your plan or rotating the API key\n- Update the key in Vercel environment variables if needed\n\nGroove Slip will continue using the ${FALLBACK_AI.toUpperCase()} fallback automatically.`,
      })
      console.log(`[token-alert] ${provider} at ${percent}% — alert sent to ${ADMIN_EMAIL}`)
    } catch (err) {
      console.error('[token-alert] Failed to send alert:', err)
    }
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

// ─── STEP 1: PURE CODE RISK SCORING ───────────────────────────────────────
function scoreRisk(game: SportyBetGame): {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore: number
  confidenceScore: number
  keep: boolean
  reason: string
} {
  const odds = game.odds
  const market = game.market.toLowerCase().trim()
  const pick = game.pick.toLowerCase().trim()

  if (market.includes('2up'))
    return { riskLevel: 'HIGH', riskScore: 9, confidenceScore: 38, keep: true, reason: '2UP requires winning by 2+ goals — very risky' }
  if (market.includes('1up'))
    return { riskLevel: 'HIGH', riskScore: 7, confidenceScore: 45, keep: true, reason: '1UP requires a winning margin — risky' }
  if ((market === '1x2' || market.includes('1x2')) && (pick === 'draw' || pick === 'x'))
    return { riskLevel: 'HIGH', riskScore: 8, confidenceScore: 40, keep: true, reason: 'Draw picks are unpredictable' }
  if ((market.includes('gg') || market.includes('both teams')) && (pick === 'yes' || pick === 'gg'))
    return { riskLevel: 'MEDIUM', riskScore: 5, confidenceScore: 58, keep: true, reason: 'Both teams to score is uncertain' }
  if (market.includes('over/under') && !market.includes('corner')) {
    const num = parseFloat(pick.replace(/[^0-9.]/g, ''))
    if (pick.startsWith('over') && !isNaN(num)) {
      if (num >= 2.5) return { riskLevel: 'HIGH', riskScore: 8, confidenceScore: 42, keep: true, reason: `Over ${num} goals is a high-risk bet` }
      if (num >= 1.5) return { riskLevel: 'MEDIUM', riskScore: 4, confidenceScore: 62, keep: true, reason: `Over ${num} carries moderate risk` }
      return { riskLevel: 'LOW', riskScore: 1, confidenceScore: 82, keep: true, reason: `Over ${num} is relatively safe` }
    }
  }
  if (odds >= 4.0) return { riskLevel: 'HIGH', riskScore: 9, confidenceScore: 35, keep: false, reason: `Odds of ${odds} are very high risk` }
  if (odds >= 2.5) return { riskLevel: 'HIGH', riskScore: 7, confidenceScore: 44, keep: false, reason: `Odds of ${odds} carry significant risk` }
  if ((market === '1x2' || market.includes('1x2')) && (pick === 'away' || pick === '2') && odds >= 2.0)
    return { riskLevel: 'HIGH', riskScore: 7, confidenceScore: 43, keep: false, reason: `Away win at ${odds} odds is risky` }
  if (odds >= 1.8) return { riskLevel: 'MEDIUM', riskScore: 4, confidenceScore: 63, keep: true, reason: `Moderate odds of ${odds}` }
  return { riskLevel: 'LOW', riskScore: 2, confidenceScore: 76, keep: true, reason: `Safe pick at ${odds} odds` }
}

// ─── STEP 2: DATA FETCHING ─────────────────────────────────────────────────
function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}
function teamsMatch(a: string, b: string, c: string, d: string) {
  const fw = (s: string) => normalize(s).split(' ')[0]
  return normalize(a).includes(fw(c)) && normalize(b).includes(fw(d))
}

async function getBSDData(homeTeam: string, awayTeam: string): Promise<string> {
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
      const det = await fetch(`${BSD_BASE}/events/${ev.id}/`, { headers: bsdHeaders, signal: AbortSignal.timeout(4000) })
      const event = det.ok ? await det.json() : ev
      const hf = event.home_form as Record<string, unknown> | null
      const af = event.away_form as Record<string, unknown> | null
      const h2h = event.head_to_head as Record<string, unknown> | null
      const pred = event.prediction as Record<string, unknown> | null
      const parts: string[] = []
      if (hf) parts.push(`H:${hf.form_string || '?'} W${hf.wins}D${hf.draws}L${hf.losses} GF${hf.goals_scored_last_n}GA${hf.goals_conceded_last_n}`)
      if (af) parts.push(`A:${af.form_string || '?'} W${af.wins}D${af.draws}L${af.losses} GF${af.goals_scored_last_n}GA${af.goals_conceded_last_n}`)
      if (h2h) parts.push(`H2H:HW${h2h.home_wins}D${h2h.draws}AW${h2h.away_wins}`)
      if (pred) parts.push(`Pred:${pred.predicted_result} H${pred.prob_home_win}%D${pred.prob_draw}%A${pred.prob_away_win}%`)
      return parts.join('|')
    }
  } catch { /* silent */ }
  return ''
}

async function getSofaData(homeTeam: string, awayTeam: string): Promise<string> {
  try {
    const getId = async (name: string): Promise<number | null> => {
      const res = await fetch(`${SOFA_BASE}/search/teams/${encodeURIComponent(name)}`, { headers: sofaHeaders, signal: AbortSignal.timeout(4000) })
      if (!res.ok) return null
      const teams = (await res.json()).teams || []
      const match = teams.find((t: unknown) => normalize((t as Record<string, unknown>).name as string || '').includes(normalize(name).split(' ')[0]))
      return ((match || teams[0]) as Record<string, unknown>)?.id as number || null
    }
    const getForm = async (id: number, name: string): Promise<string> => {
      const res = await fetch(`${SOFA_BASE}/team/${id}/events/last/0`, { headers: sofaHeaders, signal: AbortSignal.timeout(4000) })
      if (!res.ok) return ''
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

// ─── STEP 3: VALID REPLACEMENTS PER MARKET ────────────────────────────────
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

// ─── STEP 4: AI REPLACEMENT DECISIONS ─────────────────────────────────────
interface ReplacementDecision {
  eventId: string
  replacePick: string | null
  replaceMarket: string | null
  replacementReason: string
  confidenceScore: number
  reason: string
  formSummary: string
  keep: boolean
}

function buildReplacementPrompt(
  riskyGames: Array<{ game: SportyBetGame; bsd: string; sofa: string }>,
  allowSwitching: boolean
): string {
  const gameLines = riskyGames.map((gd, i) => {
    const stats = [gd.bsd, gd.sofa].filter(Boolean).join(' | ') || 'No stats available'
    const validOpts = getValidReplacements(gd.game.market, gd.game.pick)
    const optsStr = validOpts.map(o => `"${o.pick}" (${o.market})`).join(', ')
    return `G${i + 1}|${gd.game.eventId}|${gd.game.homeTeam} vs ${gd.game.awayTeam}|${gd.game.league}
Pick: ${gd.game.pick} (${gd.game.market}) @ ${gd.game.odds}
Stats: ${stats}
Valid safer options: ${optsStr || 'none — already safest'}`
  }).join('\n\n')

  return `You are a sharp football analyst. For each risky bet below, decide the smartest action based on the actual stats.

${allowSwitching ? `REPLACE MODE:
- Read the stats carefully for each game
- If stats STRONGLY support current pick → keep it (keep:true, replacePick:null)
- If stats are weak, missing, or contradict the pick → replace with BEST option from valid options
- replacePick and replaceMarket must be EXACTLY as written in valid options
- reason must reference actual stats, not generic phrases` : `REMOVE MODE:
- keep:false for truly high risk, keep:true otherwise
- replacePick and replaceMarket must be null always`}

${gameLines}

Return ONLY a JSON array, one object per game:
[{"eventId":"ID","keep":true,"replacePick":"Home/Draw","replaceMarket":"Double Chance","replacementReason":"stat-based reason","confidenceScore":72,"reason":"why based on stats","formSummary":"key stat"}]`
}

function parseAIResponse(raw: string, riskyGames: Array<{ game: SportyBetGame; bsd: string; sofa: string }>): ReplacementDecision[] {
  const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  const start = clean.indexOf('['), end = clean.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('No JSON array')
  const results: ReplacementDecision[] = JSON.parse(clean.substring(start, end + 1))

  // Validate each replacement is in valid options
  return results.map(r => {
    if (r.replacePick && r.replaceMarket) {
      const gd = riskyGames.find(g => g.game.eventId === r.eventId)
      if (gd) {
        const validOpts = getValidReplacements(gd.game.market, gd.game.pick)
        const isValid = validOpts.some(o =>
          o.pick.toLowerCase() === r.replacePick!.toLowerCase() &&
          o.market.toLowerCase() === r.replaceMarket!.toLowerCase()
        )
        if (!isValid && validOpts.length > 0) {
          r.replacePick = validOpts[0].pick
          r.replaceMarket = validOpts[0].market
        }
      }
    }
    return r
  })
}

// ─── CLAUDE AI CALL ────────────────────────────────────────────────────────
async function callClaude(
  riskyGames: Array<{ game: SportyBetGame; bsd: string; sofa: string }>,
  allowSwitching: boolean
): Promise<ReplacementDecision[]> {
  const prompt = buildReplacementPrompt(riskyGames, allowSwitching)
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300 * riskyGames.length,
    messages: [{ role: 'user', content: prompt }],
    system: 'You are a JSON API. Output ONLY a valid JSON array. No markdown, no explanation.',
  })
  const raw = response.content.filter((b: { type: string; text?: string }) => b.type === 'text').map((b: { type: string; text?: string }) => b.text || '').join('')
  await trackTokens('claude', response.usage.input_tokens + response.usage.output_tokens)
  return parseAIResponse(raw, riskyGames)
}

// ─── GROQ AI CALL ──────────────────────────────────────────────────────────
async function callGroq(
  riskyGames: Array<{ game: SportyBetGame; bsd: string; sofa: string }>,
  allowSwitching: boolean
): Promise<ReplacementDecision[]> {
  const prompt = buildReplacementPrompt(riskyGames, allowSwitching)
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are a JSON API. Output ONLY a valid JSON array. No markdown.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.15,
    max_tokens: 250 * riskyGames.length,
  })
  const raw = completion.choices[0]?.message?.content || '[]'
  const tokensUsed = completion.usage?.total_tokens || 0
  await trackTokens('groq', tokensUsed)
  return parseAIResponse(raw, riskyGames)
}

// ─── SUMMARY WITH PRIMARY/FALLBACK ────────────────────────────────────────
async function generateSummary(
  username: string,
  totalGames: number,
  keptCount: number,
  removedCount: number,
  replacedCount: number,
  newOdds: number,
  targetOdds: number
): Promise<string> {
  const fallback = `Hi ${username}, we checked ${totalGames} games and kept ${keptCount} solid ones at ${newOdds.toFixed(2)} odds, close to your ${targetOdds} target. Cut ${removedCount} risky picks${replacedCount > 0 ? ` and swapped ${replacedCount} for safer options` : ''} — your slip is cleaner now.`

  const userMsg = `Write EXACTLY 2 sentences. First sentence starts with "Hi ${username}," and mentions how many games kept and the odds. Second sentence mentions cuts and swaps. No team names, no lists, no markdown. Stop after 2 sentences.\n\nFacts: ${totalGames} games checked, ${keptCount} kept at ${newOdds.toFixed(2)} odds, target was ${targetOdds}, cut ${removedCount}${replacedCount > 0 ? `, swapped ${replacedCount} for safer picks` : ''}.`

  // Try primary AI first
  try {
    if (PRIMARY_AI === 'claude') {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [{ role: 'user', content: userMsg }],
        system: 'You write 2-sentence betting summaries. Casual Nigerian punter tone. No team names, no markdown, no asterisks, no bullet points. HARD LIMIT: 2 sentences only.',
      })
      const text = response.content.filter((b: { type: string; text?: string }) => b.type === 'text').map((b: { type: string; text?: string }) => b.text || '').join('')
      await trackTokens('claude', response.usage.input_tokens + response.usage.output_tokens)
      return text || fallback
    } else {
      const sc = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You write 2-sentence betting summaries. Casual Nigerian punter tone. No team names, no markdown, no asterisks, no bullet points. HARD LIMIT: 2 sentences only.' },
          { role: 'user', content: userMsg }
        ],
        temperature: 0.5,
        max_tokens: 80,
      })
      const text = sc.choices[0]?.message?.content || ''
      await trackTokens('groq', sc.usage?.total_tokens || 0)
      return text || fallback
    }
  } catch (primaryErr) {
    console.error(`[summary] ${PRIMARY_AI} failed, trying ${FALLBACK_AI}:`, primaryErr)
    // Fallback AI
    try {
      if (FALLBACK_AI === 'claude') {
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 120,
          messages: [{ role: 'user', content: userMsg }],
          system: 'You write 2-sentence betting summaries. Casual Nigerian punter tone. No team names, no markdown. 2 sentences only.',
        })
        const text = response.content.filter((b: { type: string; text?: string }) => b.type === 'text').map((b: { type: string; text?: string }) => b.text || '').join('')
        await trackTokens('claude', response.usage.input_tokens + response.usage.output_tokens)
        return text || fallback
      } else {
        const sc = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You write 2-sentence betting summaries. Casual Nigerian punter tone. 2 sentences only.' },
            { role: 'user', content: userMsg }
          ],
          temperature: 0.5,
          max_tokens: 80,
        })
        const text = sc.choices[0]?.message?.content || ''
        await trackTokens('groq', sc.usage?.total_tokens || 0)
        return text || fallback
      }
    } catch { return fallback }
  }
}

// ─── AI REPLACEMENT WITH PRIMARY/FALLBACK ─────────────────────────────────
async function getAIReplacementDecisions(
  riskyGames: Array<{ game: SportyBetGame; bsd: string; sofa: string }>,
  allowSwitching: boolean
): Promise<Map<string, ReplacementDecision>> {
  const decisions = new Map<string, ReplacementDecision>()
  if (riskyGames.length === 0) return decisions

  let results: ReplacementDecision[] = []

  // Try primary AI
  try {
    if (PRIMARY_AI === 'claude') {
      results = await callClaude(riskyGames, allowSwitching)
    } else {
      results = await callGroq(riskyGames, allowSwitching)
    }
  } catch (primaryErr) {
    console.error(`[AI] ${PRIMARY_AI} failed, trying ${FALLBACK_AI}:`, primaryErr)
    // Try fallback AI
    try {
      if (FALLBACK_AI === 'claude') {
        results = await callClaude(riskyGames, allowSwitching)
      } else {
        results = await callGroq(riskyGames, allowSwitching)
      }
    } catch (fallbackErr) {
      console.error(`[AI] ${FALLBACK_AI} also failed:`, fallbackErr)
      // Both failed — use code-based fallback
      for (const gd of riskyGames) {
        const validOpts = getValidReplacements(gd.game.market, gd.game.pick)
        decisions.set(gd.game.eventId, {
          eventId: gd.game.eventId,
          keep: true,
          replacePick: allowSwitching && validOpts.length > 0 ? validOpts[0].pick : null,
          replaceMarket: allowSwitching && validOpts.length > 0 ? validOpts[0].market : null,
          replacementReason: 'Safer alternative selected automatically',
          confidenceScore: 55,
          reason: 'Replaced based on risk assessment',
          formSummary: '',
        })
      }
      return decisions
    }
  }

  for (const r of results) {
    if (r.eventId) decisions.set(r.eventId, r)
  }

  // Fill any missing games
  for (const gd of riskyGames) {
    if (!decisions.has(gd.game.eventId)) {
      const validOpts = getValidReplacements(gd.game.market, gd.game.pick)
      decisions.set(gd.game.eventId, {
        eventId: gd.game.eventId,
        keep: true,
        replacePick: allowSwitching && validOpts.length > 0 ? validOpts[0].pick : null,
        replaceMarket: allowSwitching && validOpts.length > 0 ? validOpts[0].market : null,
        replacementReason: 'Safer alternative selected automatically',
        confidenceScore: 55,
        reason: 'No AI decision — kept by default',
        formSummary: '',
      })
    }
  }

  return decisions
}

// ─── RESOLVE REAL IDs FROM PROXY ──────────────────────────────────────────
async function resolveRealIdsFromProxy(
  eventId: string,
  targetPick: string,
  targetMarket: string
): Promise<{ marketId: string; outcomeId: string; realOdds: number } | null> {
  try {
    const res = await fetch(`${PROXY_URL}/markets/${eventId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Proxy-Key': PROXY_KEY },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
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

// ─── HARDCODED FALLBACK IDs ────────────────────────────────────────────────
const PICK_TO_IDS: Record<string, { marketId: string; outcomeId: string }> = {
  'home/draw|double chance':  { marketId: '3', outcomeId: '1' },
  'draw/away|double chance':  { marketId: '3', outcomeId: '3' },
  'home/away|double chance':  { marketId: '3', outcomeId: '2' },
  'yes|gg/ng':                { marketId: '5', outcomeId: '1' },
  'no|gg/ng':                 { marketId: '5', outcomeId: '2' },
  'over 0.5|over/under':      { marketId: '18', outcomeId: '12' },
  'over 1.5|over/under':      { marketId: '18', outcomeId: '12' },
  'over 2.5|over/under':      { marketId: '18', outcomeId: '12' },
  'over 3.5|over/under':      { marketId: '18', outcomeId: '12' },
  'under 1.5|over/under':     { marketId: '18', outcomeId: '13' },
  'under 2.5|over/under':     { marketId: '18', outcomeId: '13' },
  'under 3.5|over/under':     { marketId: '18', outcomeId: '13' },
  'home|1x2':                 { marketId: '1', outcomeId: '1' },
  'draw|1x2':                 { marketId: '1', outcomeId: '2' },
  'away|1x2':                 { marketId: '1', outcomeId: '3' },
  'home|1x2 - 1up':           { marketId: '60200', outcomeId: '1' },
  'away|1x2 - 1up':           { marketId: '60200', outcomeId: '3' },
  'home|1x2 - 2up':           { marketId: '60100', outcomeId: '1' },
  'away|1x2 - 2up':           { marketId: '60100', outcomeId: '3' },
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
    const num = parseFloat(p.replace(/[^0-9.]/g, ''))
    if (p.startsWith('over') && !isNaN(num)) return { marketId: '18', outcomeId: '12' }
    if (p.startsWith('under') && !isNaN(num)) return { marketId: '18', outcomeId: '13' }
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

// ─── FIND BEST COMBINATION ─────────────────────────────────────────────────
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

  // STEP 1: Score every game instantly with pure code
  const riskScores = new Map(games.map(g => [g.eventId, scoreRisk(g)]))

  // STEP 2: Fetch data only for HIGH risk games
  const riskyGames = games.filter(g => riskScores.get(g.eventId)!.riskLevel === 'HIGH' && isFootball(g))
  console.log('[debug] total games:', games.length, '| risky:', riskyGames.length, '| allowSwitching:', allowSwitching, '| riskLevels:', games.map(g => `${g.pick}(${g.market})@${g.odds}=${riskScores.get(g.eventId)?.riskLevel}`).join(', '))
  const dataMap = new Map<string, { bsd: string; sofa: string }>()
  if (riskyGames.length > 0) {
    await Promise.all(riskyGames.map(async (g) => {
      const [bsd, sofa] = await Promise.all([getBSDData(g.homeTeam, g.awayTeam), getSofaData(g.homeTeam, g.awayTeam)])
      dataMap.set(g.eventId, { bsd, sofa })
    }))
  }

  // STEP 3: AI decides on risky games only — small prompt, never hits token limit
  const riskyWithData = riskyGames.map(g => ({
    game: g,
    bsd: dataMap.get(g.eventId)?.bsd || '',
    sofa: dataMap.get(g.eventId)?.sofa || '',
  }))
  const aiDecisions = await getAIReplacementDecisions(riskyWithData, allowSwitching)

  // STEP 4: Build final analysis
  const analysisResults: GameAnalysis[] = games.map(game => {
    const score = riskScores.get(game.eventId)!
    const ai = aiDecisions.get(game.eventId)
    const d = dataMap.get(game.eventId)
    const dataSource = d ? (d.bsd && d.sofa ? 'BSD+SOFASCORE' : d.bsd ? 'BSD' : d.sofa ? 'SOFASCORE' : 'AI_WEB_SEARCH') : 'AI_WEB_SEARCH'

    const base: GameAnalysis = {
      ...game,
      riskLevel: score.riskLevel,
      riskScore: score.riskScore,
      confidenceScore: ai?.confidenceScore || score.confidenceScore,
      reason: ai?.reason || score.reason,
      formSummary: ai?.formSummary || '',
      keep: ai ? ai.keep : score.keep,
      dataSource,
    }

    if (allowSwitching && ai?.replacePick && ai?.replaceMarket) {
      const ids = hardcodedIds(ai.replacePick, ai.replaceMarket) ||
        getSmartReplacement(game.marketId, game.outcomeId, game.pick, game.market, game.odds) ||
        (game.availableMarkets?.length
          ? (() => { const r = resolveFromAvailableMarkets(game.availableMarkets!, ai.replacePick!, ai.replaceMarket!, game.odds); return r ? { marketId: r.marketId, outcomeId: r.outcomeId } : null })()
          : null)

      if (ids) {
        return {
          ...base,
          keep: true,
          replaced: true,
          originalPick: game.pick,
          originalMarket: game.market,
          originalOdds: game.odds,
          replacedPick: ai.replacePick,
          replacedMarketDesc: ai.replaceMarket,
          replacedOdds: estimateSaferOdds(game.odds, ai.replacePick, ai.replaceMarket),
          replacementReason: ai.replacementReason || 'Safer option based on match data',
          marketId: ids.marketId,
          outcomeId: ids.outcomeId,
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

  // STEP 5: Resolve real IDs + real odds from proxy for replaced games
  const replacedGames = keptGames.filter(g => g.replaced)
  if (replacedGames.length > 0) {
    await Promise.all(replacedGames.map(async (g) => {
      const real = await resolveRealIdsFromProxy(g.eventId, g.replacedPick!, g.replacedMarketDesc!)
      if (real) {
        g.marketId = real.marketId
        g.outcomeId = real.outcomeId
        g.replacedOdds = real.realOdds
        g.odds = real.realOdds
      }
    }))
  }

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