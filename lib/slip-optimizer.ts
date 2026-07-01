// lib/slip-optimizer.ts
// Module 6 — Slip Optimizer Engine
// Flow: Score all games → Groq batch inference for MINIMAL data → 
//       Odds-risk adjusted ranking → Greedily select toward targetOdds

import { prisma } from './db/prisma'
import { calculateGrooveScore } from './confidence'
import { fetchStatsByTeamSearch, getStatisticsForFixture, getH2HRecord } from './statistics'
import { SportyBetGame } from './sportybet'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface OptimizedGame extends SportyBetGame {
  grooveScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
  decision: 'KEEP' | 'REMOVE'
  reason: string
  formSummary: string
  valueEdge: number
  dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL'
  keep: boolean
}

export interface SlipOptimizationResult {
  games: OptimizedGame[]
  keptGames: OptimizedGame[]
  removedGames: OptimizedGame[]
  originalOdds: number
  newOdds: number
  targetOdds: number
  avgGrooveScore: number
  summary: string
  wasFreeTrial: boolean
}

// ─── FIND OR CREATE FIXTURE IN DB ─────────────────────────────────────────

async function ensureFixtureInDB(game: SportyBetGame): Promise<string | null> {
  try {
    const existing = await prisma.fixture.findFirst({
      where: {
        homeTeam: { contains: game.homeTeam.split(' ')[0], mode: 'insensitive' },
        awayTeam: { contains: game.awayTeam.split(' ')[0], mode: 'insensitive' },
        matchDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    })
    if (existing) return existing.id

    const created = await prisma.fixture.create({
      data: {
        fixtureId: game.eventId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeTeamId: `home_${game.eventId}`,
        awayTeamId: `away_${game.eventId}`,
        league: game.league || 'Unknown',
        leagueId: '0',
        country: 'Unknown',
        matchDate: game.kickoffTime ? new Date(game.kickoffTime) : new Date(),
        status: 'UPCOMING',
      },
    })
    return created.id
  } catch {
    return null
  }
}

// ─── GROQ BATCH INFERENCE FOR MINIMAL DATA ────────────────────────────────
// ONE single Groq call for ALL result-market games with no BSD data.
// Returns estimated home/away strength scores (0-100) per game.

interface GroqStrengthEstimate {
  eventId: string
  homeStrength: number
  awayStrength: number
  note: string
}

async function batchInferTeamStrengths(
  games: Array<{ eventId: string; homeTeam: string; awayTeam: string; league: string; pick: string; market: string }>
): Promise<Map<string, GroqStrengthEstimate>> {
  const result = new Map<string, GroqStrengthEstimate>()
  if (games.length === 0) return result

  // Only infer for result-oriented markets where team quality matters
  const resultMarkets = games.filter(g => {
    const m = g.market.toLowerCase()
    const p = g.pick.toLowerCase()
    return m.includes('1x2') || p === 'home' || p === 'away' || p === 'draw' ||
           m.includes('double chance') || m.includes('draw no bet') ||
           m.includes('asian handicap') || m.includes('handicap')
  })

  if (resultMarkets.length === 0) return result

  const gameList = resultMarkets.map((g, i) =>
    `${i + 1}. ${g.homeTeam} vs ${g.awayTeam} (${g.league}) — eventId: ${g.eventId}`
  ).join('\n')

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a football analyst with knowledge of teams across all leagues worldwide. Estimate team strengths as scores 0-100 based on your knowledge. Output ONLY valid JSON array, no markdown.',
        },
        {
          role: 'user',
          content: `Estimate home and away team strength scores (0-100) for each match below. Base it on your knowledge of these teams — league level, typical form, quality. Be realistic.

${gameList}

Return ONLY a JSON array in the same order:
[{"eventId":"ID","homeStrength":65,"awayStrength":58,"note":"Brief reason e.g. mid-table K-League 2 sides"}]

Rules:
- Scores 0-100 where 100 = world class (e.g. Man City, Real Madrid), 50 = average mid-table lower division
- If you genuinely don't know a team, use 50 for both
- Keep notes under 10 words`,
        },
      ],
      temperature: 0.2,
      max_tokens: 60 * resultMarkets.length + 100,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = clean.indexOf('['), end = clean.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No JSON')

    const parsed: GroqStrengthEstimate[] = JSON.parse(clean.substring(start, end + 1))
    for (const item of parsed) {
      if (item.eventId) result.set(item.eventId, item)
    }
  } catch (err) {
    console.error('[slip-optimizer] Groq batch inference failed:', err)
  }

  return result
}

// ─── SCORE A SINGLE GAME ──────────────────────────────────────────────────

interface ScoredGame {
  game: SportyBetGame
  grooveScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
  valueEdge: number
  dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL'
  formSummary: string
  adjustedScore: number  // grooveScore after odds-risk penalty
}

async function scoreGame(
  game: SportyBetGame,
  groqStrength?: GroqStrengthEstimate
): Promise<ScoredGame> {
  const fallback: ScoredGame = {
    game,
    grooveScore: 50,
    riskLevel: 'MEDIUM',
    confidence: 50,
    valueEdge: 0,
    dataQuality: 'MINIMAL',
    formSummary: 'No data available',
    adjustedScore: 50,
  }

  try {
    const fixtureDbId = await ensureFixtureInDB(game)
    let stats = null
    let h2h = null

    if (fixtureDbId) {
      stats = await getStatisticsForFixture(fixtureDbId)
      if (!stats) {
        await fetchStatsByTeamSearch(
          fixtureDbId,
          game.homeTeam,
          game.awayTeam,
          `home_${game.eventId}`,
          `away_${game.eventId}`
        )
        stats = await getStatisticsForFixture(fixtureDbId)
      }
      h2h = await getH2HRecord(`home_${game.eventId}`, `away_${game.eventId}`)
    }

    const scoreOutput = await calculateGrooveScore({
      pick: game.pick,
      market: game.market,
      odds: game.odds,
      stats,
      h2h,
      groqHomeStrength: groqStrength?.homeStrength,
      groqAwayStrength: groqStrength?.awayStrength,
    })

    const formSummary = stats
      ? `${game.homeTeam} W${stats.homeWins}D${stats.homeDraws}L${stats.homeLosses} (${stats.homeAvgScored.toFixed(1)} scored/game) | ${game.awayTeam} W${stats.awayWins}D${stats.awayDraws}L${stats.awayLosses} (${stats.awayAvgScored.toFixed(1)} scored/game) | BSD: Home ${stats.probHome}% Draw ${stats.probDraw}% Away ${stats.probAway}%`
      : groqStrength
        ? `Estimated: ${game.homeTeam} strength ${groqStrength.homeStrength}/100 | ${game.awayTeam} strength ${groqStrength.awayStrength}/100 | ${groqStrength.note}`
        : 'No statistical data available'

    const adjustedScore = applyOddsRiskPenalty(scoreOutput.grooveScore, game.odds, scoreOutput.dataQuality)

    return {
      game,
      grooveScore: scoreOutput.grooveScore,
      riskLevel: scoreOutput.riskLevel,
      confidence: scoreOutput.confidence,
      valueEdge: scoreOutput.valueEdge,
      dataQuality: scoreOutput.dataQuality,
      formSummary,
      adjustedScore,
    }
  } catch {
    return fallback
  }
}

// ─── ODDS-RISK PENALTY ────────────────────────────────────────────────────
// High odds = bookmaker thinks it's unlikely = needs stronger analytical backing.
// Without that backing, we apply a penalty to its ranking score.
// This prevents the optimizer from naively keeping big-odds picks
// just because their Groove Score is similar to safer picks.

function applyOddsRiskPenalty(
  grooveScore: number,
  odds: number,
  dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL'
): number {
  const impliedProb = odds > 1 ? (1 / odds) * 100 : 50

  // Very low odds — bookmaker very confident — no penalty
  if (impliedProb >= 75) return grooveScore  // odds <= 1.33

  // Low-medium odds — slight penalty only if analytical score is weak
  if (impliedProb >= 60) {  // odds 1.33–1.67
    return grooveScore >= 55 ? grooveScore : grooveScore - 5
  }

  // Medium odds — moderate penalty if analytical backing is weak
  if (impliedProb >= 50) {  // odds 1.67–2.0
    if (grooveScore >= 65) return grooveScore
    if (grooveScore >= 50) return grooveScore - 8
    return grooveScore - 12
  }

  // High odds — bookmaker says unlikely — question it strongly
  if (impliedProb >= 35) {  // odds 2.0–2.86
    if (grooveScore >= 70) return grooveScore - 3
    if (grooveScore >= 55) return grooveScore - 15
    return grooveScore - 22
  }

  // Very high odds — major red flag — heavy penalty unless exceptional data
  if (impliedProb >= 25) {  // odds 2.86–4.0
    if (grooveScore >= 75 && dataQuality !== 'MINIMAL') return grooveScore - 5
    if (grooveScore >= 60) return grooveScore - 25
    return grooveScore - 35
  }

  // Extreme odds > 4.0 — almost never keep without exceptional analysis
  if (grooveScore >= 80 && dataQuality === 'FULL') return grooveScore - 10
  return grooveScore - 40
}

// ─── TARGET ODDS SELECTION ────────────────────────────────────────────────
// Sort by adjustedScore (Groove Score + odds risk) descending.
// Greedily add games until combined odds reaches targetOdds.

function selectGamesForTarget(
  scored: ScoredGame[],
  targetOdds: number
): { kept: ScoredGame[]; removed: ScoredGame[] } {
  // Sort by adjustedScore — best analytical pick first, risky big-odds penalised
  const sorted = [...scored].sort((a, b) => b.adjustedScore - a.adjustedScore)

  const kept: ScoredGame[] = []
  const removed: ScoredGame[] = []
  let combinedOdds = 1.0

  for (const s of sorted) {
    if (combinedOdds >= targetOdds) {
      removed.push(s)
      continue
    }
    kept.push(s)
    combinedOdds = combinedOdds * s.game.odds
  }

  // Edge case: first game alone exceeds target — keep just that one
  if (kept.length > 0 && kept[0].game.odds >= targetOdds) {
    return { kept: [kept[0]], removed: sorted.slice(1) }
  }

  return { kept, removed }
}

// ─── AI EXPLANATION GENERATOR ─────────────────────────────────────────────

async function generateAIExplanations(
  kept: ScoredGame[],
  removed: ScoredGame[],
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  const all = [...kept, ...removed]
  if (all.length === 0) return results

  const keptIds = new Set(kept.map(s => s.game.eventId))

  const gameLines = all.map((s, i) => `
── GAME ${i + 1} ──
Match: ${s.game.homeTeam} vs ${s.game.awayTeam}
Pick: ${s.game.pick} | Market: ${s.game.market} | Odds: ${s.game.odds}
Groove Score: ${s.grooveScore}/100 | Adjusted Score: ${s.adjustedScore}/100
Data: ${s.dataQuality} | Form: ${s.formSummary}
Decision: ${keptIds.has(s.game.eventId) ? 'KEEP' : 'REMOVE'}`).join('\n')

  const prompt = `You are a sharp football betting analyst for Groove Slip, a Nigerian platform.

Write one specific 1-sentence reason per game explaining the decision.

RULES:
- Base reasoning ONLY on Groove Score, form data, H2H, team quality, market type
- NEVER mention "target odds", "to reach odds", or any odds-based reasoning
- For KEEP: what analytics support this pick (form, probability, team strength)
- For REMOVE: what makes this pick analytically weak (poor form, low probability, high risk)
- Reference actual numbers where available (Groove Score, win rates, BSD probabilities)
- If data is MINIMAL/estimated, say "based on available estimates" 

${gameLines}

Return ONLY valid JSON array, one per game in same order:
[{"eventId":"ID","reason":"One sentence analytics reason"}]
No markdown.`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Football analyst API. ONLY valid JSON. Never mention odds in reasoning.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.15,
      max_tokens: 80 * all.length,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = clean.indexOf('['), end = clean.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No JSON')

    const parsed = JSON.parse(clean.substring(start, end + 1))
    all.forEach((s, i) => {
      if (parsed[i]?.reason) results.set(s.game.eventId, parsed[i].reason)
    })
  } catch {
    // Fallback — analytics-based reasons
    kept.forEach((s, i) => {
      const rank = i + 1
      const suffix = rank === 1 ? 'highest' : rank === 2 ? '2nd highest' : `${rank}th highest`
      results.set(s.game.eventId,
        s.dataQuality === 'MINIMAL'
          ? `Kept based on market probability estimates — Groove Score ${s.grooveScore}/100`
          : `${suffix} analytical score (${s.grooveScore}/100) — supported by available form and probability data`
      )
    })
    removed.forEach((s, i) => {
      const rank = i + 1
      const suffix = rank === 1 ? 'lowest' : rank === 2 ? '2nd lowest' : `${rank}th lowest`
      results.set(s.game.eventId,
        `${suffix} adjusted score (${s.adjustedScore}/100) — analytics indicate higher risk relative to kept picks`
      )
    })
  }

  return results
}

// ─── SUMMARY GENERATOR ───────────────────────────────────────────────────

async function generateSummary(
  username: string,
  total: number,
  kept: number,
  removed: number,
  newOdds: number,
  targetOdds: number,
  avgGrooveScore: number
): Promise<string> {
  const fallback = `Hi ${username}, after analysing ${total} games, our engine kept the best ${kept} picks at ${newOdds.toFixed(2)} odds — closest to your ${targetOdds}x target. Cut ${removed} higher-risk picks based on analytics.`
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Write 2-sentence betting summaries for Nigerian punters. Casual, warm, direct. No markdown.' },
        {
          role: 'user',
          content: `Write exactly 2 sentences for ${username}. Start with "Hi ${username},". Facts: ${total} games analysed, kept ${kept} best picks at ${newOdds.toFixed(2)} odds (target ${targetOdds}x), avg Groove Score ${avgGrooveScore}/100, cut ${removed} higher-risk picks.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 120,
    })
    return completion.choices[0]?.message?.content || fallback
  } catch {
    return fallback
  }
}

// ─── MAIN OPTIMIZER ───────────────────────────────────────────────────────

export async function optimizeSlip(
  games: SportyBetGame[],
  targetOdds: number,
  originalTotalOdds: number,
  allowSwitching: boolean = false,
  username: string = 'Champ'
): Promise<SlipOptimizationResult> {

  // Phase 1: Score all games (fetch BSD stats per game)
  const BATCH = 5
  const initialScored: Omit<ScoredGame, 'adjustedScore'>[] = []

  for (let i = 0; i < games.length; i += BATCH) {
    const batch = games.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(async g => {
      const fallback = {
        game: g, grooveScore: 50, riskLevel: 'MEDIUM' as const,
        confidence: 50, valueEdge: 0, dataQuality: 'MINIMAL' as const,
        formSummary: 'No data available',
      }
      try {
        const fixtureDbId = await ensureFixtureInDB(g)
        let stats = null, h2h = null
        if (fixtureDbId) {
          stats = await getStatisticsForFixture(fixtureDbId)
          if (!stats) {
            await fetchStatsByTeamSearch(fixtureDbId, g.homeTeam, g.awayTeam, `home_${g.eventId}`, `away_${g.eventId}`)
            stats = await getStatisticsForFixture(fixtureDbId)
          }
          h2h = await getH2HRecord(`home_${g.eventId}`, `away_${g.eventId}`)
        }
        const scoreOutput = await calculateGrooveScore({ pick: g.pick, market: g.market, odds: g.odds, stats, h2h })
        const formSummary = stats
          ? `${g.homeTeam} W${stats.homeWins}D${stats.homeDraws}L${stats.homeLosses} (${stats.homeAvgScored.toFixed(1)} scored/game) | ${g.awayTeam} W${stats.awayWins}D${stats.awayDraws}L${stats.awayLosses} (${stats.awayAvgScored.toFixed(1)} scored/game) | BSD: Home ${stats.probHome}% Draw ${stats.probDraw}% Away ${stats.probAway}%`
          : 'No statistical data available'
        return { game: g, grooveScore: scoreOutput.grooveScore, riskLevel: scoreOutput.riskLevel, confidence: scoreOutput.confidence, valueEdge: scoreOutput.valueEdge, dataQuality: scoreOutput.dataQuality, formSummary }
      } catch { return fallback }
    }))
    initialScored.push(...results)
    if (i + BATCH < games.length) await new Promise(r => setTimeout(r, 200))
  }

  // Phase 2: Batch Groq inference for MINIMAL data result markets (ONE call)
  const minimalResultGames = initialScored
    .filter(s => s.dataQuality === 'MINIMAL')
    .map(s => ({
      eventId: s.game.eventId,
      homeTeam: s.game.homeTeam,
      awayTeam: s.game.awayTeam,
      league: s.game.league,
      pick: s.game.pick,
      market: s.game.market,
    }))

  const groqStrengths = await batchInferTeamStrengths(minimalResultGames)

  // Phase 3: Re-score MINIMAL games with Groq strength data + apply odds-risk penalty to all
  const allScored: ScoredGame[] = await Promise.all(
    initialScored.map(async s => {
      const groqStrength = groqStrengths.get(s.game.eventId)

      // Re-score if we got Groq data
      let finalScore = s
      if (groqStrength && s.dataQuality === 'MINIMAL') {
        try {
          const rescored = await calculateGrooveScore({
            pick: s.game.pick,
            market: s.game.market,
            odds: s.game.odds,
            stats: null,
            h2h: null,
            groqHomeStrength: groqStrength.homeStrength,
            groqAwayStrength: groqStrength.awayStrength,
          })
          const formSummary = `Estimated: ${s.game.homeTeam} strength ${groqStrength.homeStrength}/100 | ${s.game.awayTeam} strength ${groqStrength.awayStrength}/100 | ${groqStrength.note}`
          finalScore = { ...s, grooveScore: rescored.grooveScore, riskLevel: rescored.riskLevel, confidence: rescored.confidence, formSummary }
        } catch { /* keep original */ }
      }

      const adjustedScore = applyOddsRiskPenalty(finalScore.grooveScore, finalScore.game.odds, finalScore.dataQuality)
      return { ...finalScore, adjustedScore }
    })
  )

  // Phase 4: Select games toward targetOdds using adjustedScore ranking
  const { kept, removed } = selectGamesForTarget(allScored, targetOdds)

  // Phase 5: AI explanations
  const aiReasons = await generateAIExplanations(kept, removed)

  // Phase 6: Build final game objects
  const keptGames: OptimizedGame[] = kept.map((s, i) => {
    const rank = i + 1
    const suffix = rank === 1 ? 'highest' : rank === 2 ? '2nd highest' : `${rank}th highest`
    return {
      ...s.game,
      grooveScore: s.grooveScore,
      riskLevel: s.riskLevel,
      confidence: s.confidence,
      decision: 'KEEP' as const,
      reason: aiReasons.get(s.game.eventId) || `${suffix} analytical score (${s.grooveScore}/100)`,
      formSummary: s.formSummary,
      valueEdge: s.valueEdge,
      dataQuality: s.dataQuality,
      keep: true,
    }
  })

  const removedGames: OptimizedGame[] = removed.map((s, i) => {
    const rank = i + 1
    const suffix = rank === 1 ? 'lowest' : rank === 2 ? '2nd lowest' : `${rank}th lowest`
    return {
      ...s.game,
      grooveScore: s.grooveScore,
      riskLevel: s.riskLevel,
      confidence: s.confidence,
      decision: 'REMOVE' as const,
      reason: aiReasons.get(s.game.eventId) || `${suffix} adjusted analytical score (${s.adjustedScore}/100)`,
      formSummary: s.formSummary,
      valueEdge: s.valueEdge,
      dataQuality: s.dataQuality,
      keep: false,
    }
  })

  const allGames = [...keptGames, ...removedGames]
  const newOdds = keptGames.reduce((acc, g) => acc * g.odds, 1)
  const avgGrooveScore = keptGames.length > 0
    ? Math.round(keptGames.reduce((acc, g) => acc + g.grooveScore, 0) / keptGames.length)
    : 0

  try {
    await prisma.slipAnalysisLog.create({
      data: {
        userId: username,
        totalGames: games.length,
        keptGames: keptGames.length,
        removedGames: removedGames.length,
        replacedGames: 0,
        originalOdds: originalTotalOdds,
        newOdds: parseFloat(newOdds.toFixed(2)),
        targetOdds,
        allowSwitching,
        avgGrooveScore,
      },
    })
  } catch { /* non-critical */ }

  const summary = await generateSummary(username, games.length, keptGames.length, removedGames.length, newOdds, targetOdds, avgGrooveScore)

  return {
    games: allGames,
    keptGames,
    removedGames,
    originalOdds: parseFloat(originalTotalOdds.toFixed(2)),
    newOdds: parseFloat(newOdds.toFixed(2)),
    targetOdds,
    avgGrooveScore,
    summary,
    wasFreeTrial: false,
  }
}