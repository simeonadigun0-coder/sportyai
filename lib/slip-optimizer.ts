// lib/slip-optimizer.ts
// Module 6 — Slip Optimizer Engine
// REWRITTEN: Target-odds-aware selection
// Flow: Score all games → Sort by Groove Score → Greedily select toward targetOdds → AI explanation

import { prisma } from './db/prisma'
import { calculateGrooveScore } from './confidence'
import { resolveMarketKey } from './market-rules'
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
// combined odds reaches targetOdds. Returns selected + rejected sets.

function selectGamesForTarget(
  scored: ScoredGame[],
  targetOdds: number
): { kept: ScoredGame[]; removed: ScoredGame[] } {
  // Sort best Groove Score first
  const sorted = [...scored].sort((a, b) => b.grooveScore - a.grooveScore)

  const kept: ScoredGame[] = []
  const removed: ScoredGame[] = []
  let combinedOdds = 1.0

  for (const s of sorted) {
    const projectedOdds = combinedOdds * s.game.odds

    if (combinedOdds >= targetOdds) {
      // Already hit target — remove the rest
      removed.push(s)
      continue
    }

    // Adding this game won't overshoot too badly, or we haven't hit target yet
    kept.push(s)
    combinedOdds = projectedOdds

    // If we've hit or exceeded target, remaining games get removed
    if (combinedOdds >= targetOdds) continue
  }

  // Edge case: if we used all games and still didn't hit target,
  // that's fine — return all kept, none removed
  // Edge case: if even first game alone exceeds target,
  // just keep that one game
  if (kept.length > 0 && kept[0].game.odds >= targetOdds) {
    return {
      kept: [kept[0]],
      removed: sorted.slice(1),
    }
  }

  return { kept, removed }
}

// ─── BUILD REASON FOR REMOVED GAME ───────────────────────────────────────

function buildRemoveReason(s: ScoredGame, rank: number, totalKept: number): string {
  const rankSuffix = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`
  return `Ranked ${rankSuffix} lowest Groove Score (${s.grooveScore}/100) among your picks — target odds reached with the top ${totalKept} games`
}

function buildKeepReason(s: ScoredGame, rank: number): string {
  const rankSuffix = rank === 1 ? 'highest' : rank === 2 ? '2nd highest' : rank === 3 ? '3rd highest' : `${rank}th highest`
  if (s.dataQuality === 'MINIMAL') {
    return `Analysis unavailable — kept by default (Groove Score ${s.grooveScore}/100)`
  }
  return `${rankSuffix} Groove Score (${s.grooveScore}/100) among your picks${s.valueEdge > 0 ? ` with +${s.valueEdge}% value edge` : ''}`
}

// ─── AI EXPLANATION GENERATOR ─────────────────────────────────────────────

async function generateAIExplanations(
  kept: ScoredGame[],
  removed: ScoredGame[],
  username: string,
  targetOdds: number,
  newOdds: number
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  const all = [...kept, ...removed]
  if (all.length === 0) return results

  const gameLines = all.map((s, i) => `
── GAME ${i + 1} ──────────────────────────────
Match: ${s.game.homeTeam} vs ${s.game.awayTeam}
Pick: ${s.game.pick} | Market: ${s.game.market} | Odds: ${s.game.odds}
Groove Score: ${s.grooveScore}/100
Decision: ${kept.includes(s) ? 'KEEP' : 'REMOVE'}
Form: ${s.formSummary}`).join('\n')

  const prompt = `You are a sharp football betting analyst for Groove Slip, a Nigerian slip optimisation platform.

The user had ${all.length} games. We kept ${kept.length} games to reach target odds of ${targetOdds}x (actual: ${newOdds.toFixed(2)}x). Removed games had lower Groove Scores.

Write one specific 1-sentence reason per game referencing its Groove Score and decision. Be direct.

${gameLines}

Return ONLY a valid JSON array, one object per game in the same order:
[{"eventId":"${all[0]?.game.eventId}","reason":"..."}]

Rules:
- Reference actual Groove Score numbers
- For KEEP: explain why it qualified
- For REMOVE: explain it was outscored by kept picks
- No markdown, valid JSON only`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Football betting analyst API. Output ONLY valid JSON array. No markdown.' },
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
    // Fallback — use rule-based reasons
    kept.forEach((s, i) => results.set(s.game.eventId, buildKeepReason(s, i + 1)))
    removed.forEach((s, i) => results.set(s.game.eventId, buildRemoveReason(s, i + 1, kept.length)))
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
  const fallback = `Hi ${username}, after analysing ${total} games, our engine kept the best ${kept} picks with a combined Groove Score of ${avgGrooveScore}/100 at ${newOdds.toFixed(2)} odds — closest to your target of ${targetOdds}x. Cut ${removed} lower-scoring picks.`

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

  // Phase 1: Score all games concurrently (in batches to avoid overwhelming BSD)
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

  // Phase 3: Get AI explanations
  const newOdds = kept.reduce((acc, s) => acc * s.game.odds, 1)
  const aiReasons = await generateAIExplanations(kept, removed, username, targetOdds, newOdds)

  // Phase 4: Build final game objects
  const keptGames: OptimizedGame[] = kept.map((s, i) => ({
    ...s.game,
    grooveScore: s.grooveScore,
    riskLevel: s.riskLevel,
    confidence: s.confidence,
    decision: 'KEEP' as const,
    reason: aiReasons.get(s.game.eventId) || buildKeepReason(s, i + 1),
    formSummary: s.formSummary,
    valueEdge: s.valueEdge,
    dataQuality: s.dataQuality,
    keep: true,
  }))

  const removedGames: OptimizedGame[] = removed.map((s, i) => ({
    ...s.game,
    grooveScore: s.grooveScore,
    riskLevel: s.riskLevel,
    confidence: s.confidence,
    decision: 'REMOVE' as const,
    reason: aiReasons.get(s.game.eventId) || buildRemoveReason(s, i + 1, kept.length),
    formSummary: s.formSummary,
    valueEdge: s.valueEdge,
    dataQuality: s.dataQuality,
    keep: false,
  }))

  const allGames = [...keptGames, ...removedGames]

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

  // Generate summary
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