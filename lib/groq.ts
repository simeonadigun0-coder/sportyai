import Groq from 'groq-sdk'
import { SportyBetGame, fetchEventMarkets, findSaferReplacement } from './sportybet'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const BSD_BASE = 'https://sports.bzzoiro.com/api'
const SOFA_BASE = 'https://api.sofascore.com/api/v1'

const bsdHeaders = {
  'Authorization': `Token ${BSD_TOKEN}`,
  'Content-Type': 'application/json',
}

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
  replacedMarketId?: string
  replacedOutcomeId?: string
  replacedMarketDesc?: string
  replacedPick?: string
  replacedOdds?: number
  replacementReason?: string
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

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

function teamsMatch(a: string, b: string, c: string, d: string): boolean {
  const fw = (s: string) => normalize(s).split(' ')[0]
  const overlap = (x: string, y: string) =>
    normalize(x).includes(fw(y)) || normalize(y).includes(fw(x))
  return overlap(a, c) && overlap(b, d)
}

async function getBSDEvent(homeTeam: string, awayTeam: string): Promise<Record<string, unknown> | null> {
  const yesterday = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
  const nextTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  for (const term of [homeTeam, homeTeam.split(' ')[0], awayTeam, awayTeam.split(' ')[0]]) {
    try {
      const res = await fetch(
        `${BSD_BASE}/events/?team=${encodeURIComponent(term)}&date_from=${yesterday}&date_to=${nextTwoWeeks}&limit=50`,
        { headers: bsdHeaders }
      )
      if (!res.ok) continue
      const data = await res.json()
      const match = (data.results || []).find((e: unknown) => {
        const ev = e as Record<string, unknown>
        return teamsMatch(ev.home_team as string || '', ev.away_team as string || '', homeTeam, awayTeam)
      })
      if (match) {
        const ev = match as Record<string, unknown>
        const detail = await fetch(`${BSD_BASE}/events/${ev.id}/`, { headers: bsdHeaders })
        return detail.ok ? await detail.json() : ev
      }
    } catch { continue }
  }
  return null
}

function parseBSD(event: Record<string, unknown>, homeTeam: string, awayTeam: string): string {
  const hf = event.home_form as Record<string, unknown> | null
  const af = event.away_form as Record<string, unknown> | null
  const h2h = event.head_to_head as Record<string, unknown> | null
  const unavail = event.unavailable_players as Record<string, unknown> | null
  const pred = event.prediction as Record<string, unknown> | null

  const fmt = (f: Record<string, unknown> | null, name: string) =>
    f ? `${name}:[${f.form_string || '?'}] W${f.wins || 0}D${f.draws || 0}L${f.losses || 0} scored:${f.goals_scored_last_n || 0} conceded:${f.goals_conceded_last_n || 0}`
      : `${name}:no form data`

  const fmtH2H = (h: Record<string, unknown> | null) =>
    h ? `H2H(${h.total_matches || 0}): ${homeTeam} wins:${h.home_wins || 0} draws:${h.draws || 0} ${awayTeam} wins:${h.away_wins || 0}`
      : 'H2H:no data'

  const fmtInj = (u: Record<string, unknown> | null) => {
    if (!u) return ''
    const fmt2 = (arr: unknown[]) => arr.slice(0, 3).map((p: unknown) => {
      const pl = p as Record<string, unknown>
      return `${pl.name}(${pl.status})`
    }).join(',')
    const h = (u.home as unknown[] || [])
    const a = (u.away as unknown[] || [])
    if (!h.length && !a.length) return ''
    return `Injuries-H:[${h.length ? fmt2(h) : 'none'}] A:[${a.length ? fmt2(a) : 'none'}]`
  }

  const parts = [fmt(hf, homeTeam), fmt(af, awayTeam), fmtH2H(h2h)]
  const inj = fmtInj(unavail)
  if (inj) parts.push(inj)
  if (pred) parts.push(`ML:${pred.predicted_result} H:${pred.prob_home_win}% D:${pred.prob_draw}% A:${pred.prob_away_win}%`)
  return parts.join(' | ')
}

async function getSofaTeamId(name: string): Promise<number | null> {
  try {
    const res = await fetch(`${SOFA_BASE}/search/teams/${encodeURIComponent(name)}`, { headers: sofaHeaders })
    if (!res.ok) return null
    const data = await res.json()
    const teams: unknown[] = data.teams || []
    if (!teams.length) return null
    const match = teams.find((t: unknown) => {
      const team = t as Record<string, unknown>
      return normalize(team.name as string || '').includes(normalize(name).split(' ')[0])
    }) as Record<string, unknown> | undefined
    const found = (match || teams[0]) as Record<string, unknown>
    return (found?.id as number) || null
  } catch { return null }
}

async function getSofaForm(teamId: number, teamName: string): Promise<string> {
  try {
    const res = await fetch(`${SOFA_BASE}/team/${teamId}/events/last/0`, { headers: sofaHeaders })
    if (!res.ok) return `${teamName}:no data`
    const data = await res.json()
    const events = ((data.events || []) as unknown[]).slice(-5)
    if (!events.length) return `${teamName}:no recent matches`

    let w = 0, d = 0, l = 0
    const results = events.map((e: unknown) => {
      const ev = e as Record<string, unknown>
      const hs = ev.homeScore as Record<string, unknown>
      const as_ = ev.awayScore as Record<string, unknown>
      const ht = ev.homeTeam as Record<string, unknown>
      const isHome = normalize(ht?.name as string || '').includes(normalize(teamName).split(' ')[0])
      const scored = Number(isHome ? hs?.current : as_?.current) || 0
      const conceded = Number(isHome ? as_?.current : hs?.current) || 0
      let r = 'D'
      if (scored > conceded) { r = 'W'; w++ }
      else if (scored < conceded) { r = 'L'; l++ }
      else d++
      return `${r}${scored}-${conceded}`
    })
    return `${teamName} last5:W${w}D${d}L${l}[${results.join(',')}]`
  } catch { return `${teamName}:no data` }
}

async function getSofaData(homeTeam: string, awayTeam: string): Promise<string | null> {
  try {
    const [homeId, awayId] = await Promise.all([getSofaTeamId(homeTeam), getSofaTeamId(awayTeam)])
    if (!homeId && !awayId) return null
    const [homeForm, awayForm] = await Promise.all([
      homeId ? getSofaForm(homeId, homeTeam) : Promise.resolve(`${homeTeam}:no data`),
      awayId ? getSofaForm(awayId, awayTeam) : Promise.resolve(`${awayTeam}:no data`),
    ])
    return `${homeForm} | ${awayForm}`
  } catch { return null }
}

async function gatherGameData(game: SportyBetGame): Promise<{
  game: SportyBetGame
  context: string
  dataSource: string
}> {
  const isFootball = !game.sport ||
    game.sport.toLowerCase().includes('football') ||
    game.sport.toLowerCase().includes('soccer')

  if (!isFootball) return { game, context: '', dataSource: 'AI_WEB_SEARCH' }

  let context = ''
  let dataSource = 'FALLBACK'

  const [bsdEvent, sofaData] = await Promise.all([
    getBSDEvent(game.homeTeam, game.awayTeam),
    getSofaData(game.homeTeam, game.awayTeam),
  ])

  if (bsdEvent) {
    context += `BSD:${parseBSD(bsdEvent, game.homeTeam, game.awayTeam)}`
    dataSource = 'BSD'
  }
  if (sofaData) {
    context += context ? ` | SOFA:${sofaData}` : `SOFA:${sofaData}`
    dataSource = bsdEvent ? 'BSD+SOFASCORE' : 'SOFASCORE'
  }
  if (!context) dataSource = 'AI_WEB_SEARCH'

  return { game, context, dataSource }
}

interface AnalysisResult {
  eventId: string
  confidenceScore: number
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  keep: boolean
  reason: string
  formSummary: string
  suggestReplacement?: boolean
  replacePick?: string | null
  replaceMarket?: string | null
}

function extractJSON(raw: string): AnalysisResult[] {
  try {
    const direct = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    return JSON.parse(direct)
  } catch { /* continue */ }

  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('No JSON array found')

  let slice = raw.substring(start, end + 1)
  slice = slice
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
    .replace(/:\s*'([^']*)'/g, ': "$1"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')

  return JSON.parse(slice)
}

async function batchAnalyse(
  gameData: Array<{ game: SportyBetGame; context: string; dataSource: string }>,
  targetOdds: number,
  allowSwitching: boolean
): Promise<Map<string, AnalysisResult>> {

  const gamesList = gameData.map((gd, i) => {
    const hasData = Boolean(gd.context)
    const dataNote = hasData ? gd.context : 'NO_STATS - keep unless pick is clearly wrong'
    const oddsNote = gd.game.odds >= 4.0 ? 'VERY_HIGH_ODDS' : gd.game.odds >= 2.5 ? 'HIGH_ODDS' : gd.game.odds >= 1.8 ? 'MEDIUM_ODDS' : 'LOW_ODDS'
    return `G${i + 1}|id:${gd.game.eventId}|${gd.game.homeTeam} vs ${gd.game.awayTeam}|${gd.game.league}|pick:"${gd.game.pick}"(${gd.game.market})|odds:${gd.game.odds}|${oddsNote}|${dataNote}`
  }).join('\n')

  const replacementNote = allowSwitching
  ? `REPLACEMENT MODE: When a pick is risky and a safer market exists, provide the replacement directly.
Use these known safer alternatives:
- Over 2.5 → replace with "Over 1.5" in "Over/Under" market  
- Over 3.5 → replace with "Over 2.5"
- Over 4.5 → replace with "Over 2.5" or "Over 1.5"
- Away Win (1X2) → replace with "Draw/Away" in "Double Chance"
- Home Win (1X2) with uncertain form → replace with "Home/Draw" in "Double Chance"
- Draw (1X2) → replace with "Home/Draw" or "Draw/Away" in "Double Chance"
- GG Yes (risky) → replace with "No" in "GG/NG"
- 1UP Home → replace with "Home" in "1X2" or "Home/Draw" in "Double Chance"
- 2UP any → replace with equivalent in "1X2" or "Double Chance"
Add to your JSON: "replacePick": "new pick name or null", "replaceMarket": "market name or null"`
  : `REMOVAL MODE: suggestReplacement=false for all.`

  const prompt = `You are a professional football punter. Analyse each match and provide honest assessments.

RULES:
- Missing stats = keep, give confidence 55-65, suggestReplacement based on market type
- Only set keep=false if data CLEARLY shows pick will lose
- Target odds: ${targetOdds}
- ${replacementNote}

MARKET REPLACEMENT GUIDE (for suggestReplacement):
- Over 2.5, Over 3.5, Over 4.5 = suggest replacement (step down line)
- Away Win (high odds) = suggest replacement (X2 double chance)  
- Home Win (uncertain form) = suggest replacement (1X double chance)
- Draw (risky) = suggest replacement (double chance)
- GG Yes (defensive teams) = suggest replacement (GG No or Under)
- 1UP, 2UP markets = suggest replacement (standard 1X2)
- Under 1.5, Under 0.5 = suggest replacement (Under 2.5)

GAMES:
${gamesList}

RESPOND WITH ONLY A JSON ARRAY. NO OTHER TEXT:
[{"eventId":"EXACT_ID","confidenceScore":NUMBER,"riskScore":NUMBER,"riskLevel":"LOW or MEDIUM or HIGH","keep":true or false,"reason":"brief reason","formSummary":"key stat","suggestReplacement":true or false,"replacePick":"safer pick name or null","replaceMarket":"safer market name or null"}]`

  const map = new Map<string, AnalysisResult>()

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON API. Output ONLY valid JSON arrays. Never output text, markdown, or explanation. Always start with [ and end with ].'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const results = extractJSON(raw)

    for (const r of results) {
      const gd = gameData.find(g => g.game.eventId === r.eventId)
      let keep = r.keep === true
      if (gd && !gd.context && !keep && r.confidenceScore > 30) keep = true

      map.set(r.eventId, {
        ...r,
        keep,
        suggestReplacement: r.suggestReplacement === true,
        riskLevel: (['LOW', 'MEDIUM', 'HIGH'].includes(r.riskLevel) ? r.riskLevel : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
      })
    }
  } catch (err) {
    console.error('AI batch analysis failed:', err)
    for (const gd of gameData) {
      const hasData = Boolean(gd.context)
      // In replacement mode, suggest replacement for common risky markets
      const market = gd.game.market.toLowerCase()
      const pick = gd.game.pick.toLowerCase()
      const suggestReplacement = allowSwitching && (
        (market.includes('over/under') && (pick.includes('over 2') || pick.includes('over 3') || pick.includes('over 4'))) ||
        (market === '1x2' && (pick === 'away' || pick === 'home')) ||
        (market.includes('gg') && pick === 'yes') ||
        market.includes('1up') || market.includes('2up')
      )
      map.set(gd.game.eventId, {
        eventId: gd.game.eventId,
        confidenceScore: hasData ? 65 : 55,
        riskScore: hasData ? 4 : 5,
        riskLevel: 'MEDIUM',
        reason: hasData ? 'Data found — keeping based on available statistics' : 'No stats — kept as missing data is not a removal reason',
        formSummary: hasData ? gd.dataSource : 'Small league',
        keep: true,
        suggestReplacement,
      })
    }
  }

  return map
}

function findBestCombination(games: GameAnalysis[], targetOdds: number): GameAnalysis[] {
  if (games.length === 0) return games

  const currentTotal = games.reduce((acc, g) =>
    acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)

  if (currentTotal <= targetOdds * 1.2) return games

  const sorted = [...games].sort((a, b) => a.confidenceScore - b.confidenceScore)
  let bestCombo = games
  let bestDiff = Math.abs(currentTotal - targetOdds)

  for (let removeCount = 1; removeCount < sorted.length - 1; removeCount++) {
    const candidate = sorted.slice(removeCount)
    const candidateOdds = candidate.reduce((acc, g) =>
      acc * (g.replaced ? (g.replacedOdds || g.odds) : g.odds), 1)
    const diff = Math.abs(candidateOdds - targetOdds)

    if (diff < bestDiff) {
      bestDiff = diff
      bestCombo = candidate
    }
    if (candidateOdds < targetOdds * 0.5) break
  }

  if (bestCombo.length < 2) bestCombo = sorted.slice(sorted.length - 2)
  return bestCombo
}
// Known SportyBet market IDs and outcome IDs
// These are consistent across all matches on SportyBet Nigeria
function getKnownMarketReplacement(
  marketName: string,
  pickName: string,
  originalOdds: number
): { marketId: string; outcomeId: string; estimatedOdds: number } | null {
  const market = marketName.toLowerCase().trim()
  const pick = pickName.toLowerCase().trim()

  // Over/Under — marketId 2, outcomes vary by line
  if (market.includes('over/under') || market === 'over/under') {
    const num = parseFloat(pick.replace(/[^0-9.]/g, ''))
    if (!isNaN(num)) {
      // Over outcomes: Over 0.5=id:12, Over 1=id:2, Over 1.5=id:3, Over 2=id:4, Over 2.5=id:5
      // Under outcomes: Under 0.5=id:22, Under 1=id:11, Under 1.5=id:13, Under 2=id:14, Under 2.5=id:15
      const overMap: Record<number, string> = { 0.5: '12', 1: '2', 1.5: '3', 2: '4', 2.5: '5', 3: '6', 3.5: '7', 4: '8', 4.5: '9', 5: '10' }
      const underMap: Record<number, string> = { 0.5: '22', 1: '11', 1.5: '13', 2: '14', 2.5: '15', 3: '16', 3.5: '17', 4: '18', 4.5: '19', 5: '20' }

      if (pick.startsWith('over') && overMap[num]) {
        const estimatedOdds = Math.max(1.04, originalOdds * 0.6) // safer = lower odds estimate
        return { marketId: '2', outcomeId: overMap[num], estimatedOdds: parseFloat(estimatedOdds.toFixed(2)) }
      }
      if (pick.startsWith('under') && underMap[num]) {
        const estimatedOdds = Math.max(1.04, originalOdds * 0.65)
        return { marketId: '2', outcomeId: underMap[num], estimatedOdds: parseFloat(estimatedOdds.toFixed(2)) }
      }
    }
  }

  // Double Chance — marketId 3
  // Home/Draw = outcomeId 1, Draw/Away = outcomeId 3, Home/Away = outcomeId 2
  if (market.includes('double chance')) {
    if (pick.includes('home/draw') || pick.includes('1x') || pick === 'home or draw') {
      return { marketId: '3', outcomeId: '1', estimatedOdds: parseFloat((originalOdds * 0.5).toFixed(2)) }
    }
    if (pick.includes('draw/away') || pick.includes('x2') || pick === 'draw or away') {
      return { marketId: '3', outcomeId: '3', estimatedOdds: parseFloat((originalOdds * 0.55).toFixed(2)) }
    }
    if (pick.includes('home/away') || pick.includes('12') || pick === 'home or away') {
      return { marketId: '3', outcomeId: '2', estimatedOdds: parseFloat((originalOdds * 0.45).toFixed(2)) }
    }
  }

  // GG/NG — marketId 5
  // Yes = outcomeId 1, No = outcomeId 2
  if (market.includes('gg') || market.includes('both teams')) {
    if (pick === 'yes' || pick === 'gg') {
      return { marketId: '5', outcomeId: '1', estimatedOdds: parseFloat((originalOdds * 0.7).toFixed(2)) }
    }
    if (pick === 'no' || pick === 'ng') {
      return { marketId: '5', outcomeId: '2', estimatedOdds: parseFloat((originalOdds * 0.65).toFixed(2)) }
    }
  }

  // 1X2 — marketId 1
  // Home = outcomeId 1, Draw = outcomeId 2, Away = outcomeId 3
  if (market === '1x2') {
    if (pick === 'home' || pick === '1') {
      return { marketId: '1', outcomeId: '1', estimatedOdds: parseFloat((originalOdds * 0.75).toFixed(2)) }
    }
    if (pick === 'draw' || pick === 'x') {
      return { marketId: '1', outcomeId: '2', estimatedOdds: parseFloat((originalOdds * 0.8).toFixed(2)) }
    }
    if (pick === 'away' || pick === '2') {
      return { marketId: '1', outcomeId: '3', estimatedOdds: parseFloat((originalOdds * 0.75).toFixed(2)) }
    }
  }

  return null
}

export async function analyseSlip(
games: SportyBetGame[], targetOdds: number, originalTotalOdds: number, allowSwitching: boolean = false, clientMarkets: Record<string, unknown> = {}): Promise<SlipAnalysis> {

  const footballGames = games.filter(g =>
    !g.sport || g.sport.toLowerCase().includes('football') || g.sport.toLowerCase().includes('soccer')
  )
  const otherGames = games.filter(g =>
    g.sport && !g.sport.toLowerCase().includes('football') && !g.sport.toLowerCase().includes('soccer')
  )

  // Use client-side fetched markets (bypasses Vercel IP block)
  // Fall back to server-side fetch only if client didn't provide markets
  const buildEventMarketsMap = async () => {
    if (!allowSwitching) return new Map()
    
    const map = new Map()
    
    for (const game of games) {
      // Use client-provided markets first
      if (clientMarkets[game.eventId]) {
        const cm = clientMarkets[game.eventId] as Record<string, unknown>
        const rawMarkets = (cm.markets as unknown[]) || []
        
        const markets = rawMarkets.map((m: unknown) => {
          const market = m as Record<string, unknown>
          const rawOutcomes = (market.outcomes as unknown[]) || []
          const outcomes = rawOutcomes
            .map((o: unknown) => {
              const outcome = o as Record<string, unknown>
              return {
                id: String(outcome.id || ''),
                odds: parseFloat(String(outcome.odds || 1)),
                probability: parseFloat(String(outcome.probability || 0)),
                desc: String(outcome.desc || ''),
                isActive: outcome.isActive === 1 || outcome.isActive === true,
              }
            })
            .filter((o: { isActive: boolean; odds: number }) => o.isActive && o.odds > 1.0)

          return {
            id: String(market.id || ''),
            desc: String(market.desc || market.name || ''),
            name: String(market.name || market.desc || ''),
            group: String(market.group || 'Main'),
            outcomes,
          }
        }).filter((m: { outcomes: unknown[] }) => m.outcomes.length > 0)

        if (markets.length > 0) {
          map.set(game.eventId, {
            eventId: game.eventId,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            markets,
          })
        }
      } else {
        // Fallback to server-side fetch
        const serverMarkets = await fetchEventMarkets(game)
        if (serverMarkets) map.set(game.eventId, serverMarkets)
      }
    }
    
    return map
  }

  const [footballData, eventMarketsMap] = await Promise.all([
    Promise.all(footballGames.map(g => gatherGameData(g))),
    buildEventMarketsMap(),
  ])

  const footballResults = await batchAnalyse(footballData, targetOdds, allowSwitching)

  const otherResults = new Map<string, AnalysisResult>()
  if (otherGames.length > 0) {
    try {
      const gamesList = otherGames.map((g, i) =>
        `G${i + 1}|id:${g.eventId}|${g.homeTeam} vs ${g.awayTeam}|${g.sport}|${g.league}|pick:"${g.pick}"(${g.market})|odds:${g.odds}`
      ).join('\n')

      const completion = await groq.chat.completions.create({
        model: 'compound-beta',
        messages: [
          { role: 'system', content: 'You are a JSON API. Output ONLY valid JSON arrays.' },
          { role: 'user', content: `Research these matches. Missing data=keep. Target:${targetOdds}\n${gamesList}\n[{"eventId":"...","confidenceScore":0-100,"riskScore":1-10,"riskLevel":"LOW or MEDIUM or HIGH","keep":true or false,"reason":"...","formSummary":"...","suggestReplacement":true or false}]` }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      })

      const raw = completion.choices[0]?.message?.content || '[]'
      const results = extractJSON(raw)
      for (const r of results) {
        otherResults.set(r.eventId, { ...r, keep: r.keep === true })
      }
    } catch {
      for (const g of otherGames) {
        otherResults.set(g.eventId, {
          eventId: g.eventId, confidenceScore: 58, riskScore: 5,
          riskLevel: 'MEDIUM', reason: 'Unable to research — kept by default',
          formSummary: 'No data', keep: true, suggestReplacement: false,
        })
      }
    }
  }

  const allResults = new Map<string, AnalysisResult>()
  footballResults.forEach((v, k) => allResults.set(k, v))
  otherResults.forEach((v, k) => allResults.set(k, v))

  const dataSourceMap = new Map(footballData.map(fd => [fd.game.eventId, fd.dataSource]))

  const analysisResults: GameAnalysis[] = games.map(game => {
    const result = allResults.get(game.eventId)
    const dataSource = dataSourceMap.get(game.eventId) || 'AI_WEB_SEARCH'

    const baseResult: GameAnalysis = result ? {
      ...game,
      confidenceScore: result.confidenceScore,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      reason: result.reason,
      formSummary: result.formSummary,
      keep: result.keep,
      dataSource,
    } : {
      ...game,
      confidenceScore: 55,
      riskScore: 5,
      riskLevel: 'MEDIUM',
      reason: 'Kept by default',
      formSummary: 'No stats',
      keep: true,
      dataSource: 'FALLBACK',
    }

    // Apply AI-suggested replacement directly using known market IDs
    if (allowSwitching && result?.replacePick && result?.replaceMarket) {
      const replacement = getKnownMarketReplacement(
        result.replaceMarket,
        result.replacePick,
        game.odds
      )
      if (replacement) {
        return {
          ...baseResult,
          keep: true,
          replaced: true,
          replacedMarketId: replacement.marketId,
          replacedOutcomeId: replacement.outcomeId,
          replacedMarketDesc: result.replaceMarket,
          replacedPick: result.replacePick,
          replacedOdds: replacement.estimatedOdds,
          replacementReason: result.reason,
        }
      }
    }

    return baseResult
  })

  const aiKept = analysisResults.filter(g => g.keep)
  const aiRemoved = analysisResults.filter(g => !g.keep)

  const keptGames = findBestCombination(aiKept, targetOdds)

  if (keptGames.length < 2) {
    const safest = [...aiRemoved].sort((a, b) => b.confidenceScore - a.confidenceScore)
    for (const g of safest) {
      if (keptGames.length >= 2) break
      keptGames.push(g)
    }
  }

  const keptIds = new Set(keptGames.map(g => g.eventId))
  const finalGames = analysisResults.map(g => ({ ...g, keep: keptIds.has(g.eventId) }))
  const removedGames = finalGames.filter(g => !g.keep)

  const newOdds = keptGames.reduce((acc, g) => {
    const odds = g.replaced ? (g.replacedOdds || g.odds) : g.odds
    return acc * odds
  }, 1)

  const finalKeptGames = keptGames.map(g => {
    if (g.replaced && g.replacedMarketId && g.replacedOutcomeId) {
      return {
        ...g,
        marketId: g.replacedMarketId,
        outcomeId: g.replacedOutcomeId,
        market: g.replacedMarketDesc || g.market,
        pick: g.replacedPick || g.pick,
        odds: g.replacedOdds || g.odds,
      }
    }
    return g
  })

  let summary = `Analysed ${games.length} games. Kept ${keptGames.length} at ${newOdds.toFixed(2)} odds (target: ${targetOdds}). Removed ${removedGames.length} picks.`
  try {
    const replacedCount = keptGames.filter(g => g.replaced).length
    const sc = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Write short direct betting summaries for Nigerian punters.' },
        {
          role: 'user',
          content: `2 sentences. Analysed ${games.length} games, kept ${keptGames.length} at ${newOdds.toFixed(2)} odds (target:${targetOdds}). ${replacedCount > 0 ? `Replaced ${replacedCount} risky picks with safer options.` : ''} Removed:${removedGames.map(g => `${g.homeTeam}vs${g.awayTeam}`).join(',') || 'none'}.`
        }
      ],
      temperature: 0.4,
      max_tokens: 120,
    })
    summary = sc.choices[0]?.message?.content || summary
  } catch { /* use default */ }

  return {
    games: finalGames,
    removedGames,
    keptGames: finalKeptGames,
    originalOdds: parseFloat(originalTotalOdds.toFixed(2)),
    newOdds: parseFloat(newOdds.toFixed(2)),
    targetOdds,
    summary,
  }
}