// lib/slip-optimizer.ts
// Module 6 — Slip Optimizer Engine
// REWRITTEN: Target-odds-aware selection
// Flow: Score all games → Sort by Groove Score → Greedily select toward targetOdds → AI explanation

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

// ─── SCORE A SINGLE GAME ──────────────────────────────────────────────────

interface ScoredGame {
  game: SportyBetGame
  grooveScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
  valueEdge: number
  dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL'
  formSummary: string
}

async function scoreGame(game: SportyBetGame): Promise<ScoredGame> {
  const fallback: ScoredGame = {
    game,
    grooveScore: 50,
    riskLevel: 'MEDIUM',
    confidence: 50,
    valueEdge: 0,
    dataQuality: 'MINIMAL',
    formSummary: 'No data available',
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
    })

    const formSummary = stats
      ? `${game.homeTeam} W${stats.homeWins}D${stats.homeDraws}L${stats.homeLosses} (${stats.homeAvgScored.toFixed(1)} scored/game) | ${game.awayTeam} W${stats.awayWins}D${stats.awayDraws}L${stats.awayLosses} (${stats.awayAvgScored.toFixed(1)} scored/game) | BSD: Home ${stats.probHome}% Draw ${stats.probDraw}% Away ${stats.probAway}%`
      : 'No statistical data available'

    return {
      game,
      grooveScore: scoreOutput.grooveScore,
      riskLevel: scoreOutput.riskLevel,
      confidence: scoreOutput.confidence,
      valueEdge: scoreOutput.valueEdge,
      dataQuality: scoreOutput.dataQuality,
      formSummary,
    }
  } catch {
    return fallback
  }
}

// ─── TARGET ODDS SELECTION ────────────────────────────────────────────────
// Sorts by Groove Score descending, greedily adds games until
// combined odds reaches targetOdds. Everything after that is removed.

function selectGamesForTarget(
  scored: ScoredGame[],
  targetOdds: number
): { kept: ScoredGame[]; removed: ScoredGame[] } {
  const sorted = [...scored].sort((a, b) => b.grooveScore - a.grooveScore)

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

  // Edge case: first game alone exceeds target — just keep that one
  if (kept.length > 0 && kept[0].game.odds >= targetOdds) {
    return {
      kept: [kept[0]],
      removed: sorted.slice(1),
    }
  }

  return { kept, removed }
}

// ─── AI EXPLANATION GENERATOR ─────────────────────────────────────────────

async function generateAIExplanations(
  kept: ScoredGame[],
  removed: ScoredGame[],
  username: string
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  const all = [...kept, ...removed]
  if (all.length === 0) return results

  const keptIds = new Set(kept.map(s => s.game.eventId))

  const gameLines = all.map((s, i) => `
── GAME ${i + 1} ──────────────────────────────
Match: ${s.game.homeTeam} vs ${s.game.awayTeam}
Pick: ${s.game.pick} | Market: ${s.game.market}
Groove Score: ${s.grooveScore}/100
Decision: ${keptIds.has(s.game.eventId) ? 'KEEP' : 'REMOVE'}
Form: ${s.formSummary}`).join('\n')

  const prompt = `You are a sharp football betting analyst for Groove Slip, a Nigerian slip optimisation platform.

Analyse each game below and write one specific 1-sentence reason per game explaining the decision.

CRITICAL RULES:
- Base ALL decisions ONLY on the Groove Score and form/H2H data shown
- NEVER mention odds, target odds, or any numbers related to odds in your reasoning
- For KEEP decisions: explain what the analytics show that makes this pick viable (form, H2H, win rate, BSD probability)
- For REMOVE decisions: explain what the analytics show that makes this pick risky (poor form, low probability, weak H2H)
- Reference actual numbers — Groove Score, win rates, goal averages, BSD probabilities
- Never say "to reach target odds" or any variation of that

${gameLines}

Return ONLY a valid JSON array, one object per game in the same order:
[{"eventId":"ID","reason":"Analytics-based reason only — no mention of odds"}]

No markdown, valid JSON only.`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Football betting analyst API. Output ONLY valid JSON array. No markdown. Never mention odds in reasoning.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.15,
      max_tokens: 80 * all.length,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = clean.indexOf('['), end = clean.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No JSON array')

    const parsed = JSON.parse(clean.substring(start, end + 1))
    all.forEach((s, i) => {
      if (parsed[i]?.reason) results.set(s.game.eventId, parsed[i].reason)
    })
  } catch {
    // Fallback — analytics-based reasons, no odds
    kept.forEach((s, i) => {
      const rank = i + 1
      const suffix = rank === 1 ? 'highest' : rank === 2 ? '2nd highest' : `${rank}th highest`
      results.set(s.game.eventId,
        s.dataQuality === 'MINIMAL'
          ? `Analysis unavailable — kept by default (Groove Score ${s.grooveScore}/100)`
          : `${suffix} Groove Score (${s.grooveScore}/100) among all picks — analytics support this selection`
      )
    })
    removed.forEach((s, i) => {
      const rank = i + 1
      const suffix = rank === 1 ? 'lowest' : rank === 2 ? '2nd lowest' : `${rank}th lowest`
      results.set(s.game.eventId,
        `${suffix} Groove Score (${s.grooveScore}/100) — analytics indicate higher risk than kept picks`
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
  const fallback = `Hi ${username}, after analysing ${total} games, our engine kept the best ${kept} picks based on Groove Score analytics at ${newOdds.toFixed(2)} odds — close to your target of ${targetOdds}x. Cut ${removed} lower-scoring picks.`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Write 2-sentence betting summaries for Nigerian punters. Casual, warm, direct. No markdown. Exactly 2 sentences.' },
        {
          role: 'user',
          content: `Write exactly 2 sentences for ${username}. Start with "Hi ${username},". Facts: ${total} games analysed, kept ${kept} best picks at ${newOdds.toFixed(2)} odds (target was ${targetOdds}x), avg Groove Score ${avgGrooveScore}/100, cut ${removed} lower-scoring picks.`,
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

  // Phase 1: Score all games concurrently in batches
  const BATCH = 5
  const allScored: ScoredGame[] = []

  for (let i = 0; i < games.length; i += BATCH) {
    const batch = games.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(g => scoreGame(g)))
    allScored.push(...results)
    if (i + BATCH < games.length) await new Promise(r => setTimeout(r, 200))
  }

  // Phase 2: Select best games toward targetOdds
  const { kept, removed } = selectGamesForTarget(allScored, targetOdds)

  // Phase 3: Get AI explanations (analytics-based only, no odds)
  const aiReasons = await generateAIExplanations(kept, removed, username)

  // Phase 4: Build final game objects
  const keptGames: OptimizedGame[] = kept.map((s, i) => {
    const rank = i + 1
    const suffix = rank === 1 ? 'highest' : rank === 2 ? '2nd highest' : `${rank}th highest`
    const fallbackReason = s.dataQuality === 'MINIMAL'
      ? `Analysis unavailable — kept by default (Groove Score ${s.grooveScore}/100)`
      : `${suffix} Groove Score (${s.grooveScore}/100) — analytics support this selection`
    return {
      ...s.game,
      grooveScore: s.grooveScore,
      riskLevel: s.riskLevel,
      confidence: s.confidence,
      decision: 'KEEP' as const,
      reason: aiReasons.get(s.game.eventId) || fallbackReason,
      formSummary: s.formSummary,
      valueEdge: s.valueEdge,
      dataQuality: s.dataQuality,
      keep: true,
    }
  })

  const removedGames: OptimizedGame[] = removed.map((s, i) => {
    const rank = i + 1
    const suffix = rank === 1 ? 'lowest' : rank === 2 ? '2nd lowest' : `${rank}th lowest`
    const fallbackReason = `${suffix} Groove Score (${s.grooveScore}/100) — analytics indicate higher risk than kept picks`
    return {
      ...s.game,
      grooveScore: s.grooveScore,
      riskLevel: s.riskLevel,
      confidence: s.confidence,
      decision: 'REMOVE' as const,
      reason: aiReasons.get(s.game.eventId) || fallbackReason,
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

  // Log to DB
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

  const summary = await generateSummary(
    username,
    games.length,
    keptGames.length,
    removedGames.length,
    newOdds,
    targetOdds,
    avgGrooveScore
  )

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