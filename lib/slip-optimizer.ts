// lib/slip-optimizer.ts
// Module 6 — Slip Optimizer Engine
// Replaces the old groq.ts analysis flow
// Flow: Fetch Stats → Calculate Groove Score → Apply Market Rules → AI Explanation

import { prisma } from './db/prisma'
import { calculateGrooveScore } from './confidence'
import { applyMarketRule, resolveMarketKey } from './market-rules'
import { fetchStatsByTeamSearch, getStatisticsForFixture, getH2HRecord } from './statistics'
import { getFixtureById } from './fixtures'
import { SportyBetGame } from './sportybet'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface OptimizedGame extends SportyBetGame {
  grooveScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
  decision: 'KEEP' | 'REPLACE' | 'REMOVE'
  reason: string
  formSummary: string
  valueEdge: number
  dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL'
  keep: boolean

  // Replacement fields
  replaced?: boolean
  originalPick?: string
  originalMarket?: string
  originalOdds?: number
  replacedPick?: string
  replacedMarketDesc?: string
  replacedOdds?: number
  replacementReason?: string
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
    // Try to find by team names
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

    // Create minimal fixture record
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

// ─── AI EXPLANATION GENERATOR ─────────────────────────────────────────────

interface GameForAI {
  game: SportyBetGame
  grooveScore: number
  decision: 'KEEP' | 'REPLACE' | 'REMOVE'
  safeAlternative: string | null
  formSummary: string
  valueEdge: number
  ruleReason: string
}

async function generateAIExplanations(
  games: GameForAI[],
  allowSwitching: boolean,
  username: string
): Promise<Map<string, { reason: string; replacedPick?: string; replacedMarket?: string; replacementReason?: string }>> {
  const results = new Map<string, { reason: string; replacedPick?: string; replacedMarket?: string; replacementReason?: string }>()

  if (games.length === 0) return results

  const gameLines = games.map((gd, i) => `
── GAME ${i + 1} ──────────────────────────────
Event ID: ${gd.game.eventId}
Match: ${gd.game.homeTeam} vs ${gd.game.awayTeam}
League: ${gd.game.league}
Pick: ${gd.game.pick} | Market: ${gd.game.market} | Odds: ${gd.game.odds}
Groove Score: ${gd.grooveScore}/100
Decision: ${gd.decision}
Data Summary: ${gd.formSummary}
Value Edge: ${gd.valueEdge > 0 ? '+' : ''}${gd.valueEdge}%
Rule Reason: ${gd.ruleReason}
${gd.safeAlternative ? `Safe Alternative: ${gd.safeAlternative}` : ''}`
  ).join('\n')

  const prompt = `You are a sharp football betting analyst for Groove Slip, a Nigerian slip optimisation platform.

${allowSwitching
    ? `For each game below, write a specific 1-2 sentence reason explaining the decision using the actual data. If decision is REPLACE, suggest what to replace with based on the safe alternative provided. Reference actual numbers — Groove Score, value edge, form.`
    : `For each game below, write a specific 1-2 sentence reason explaining why the pick is kept or removed. Reference actual numbers — Groove Score, value edge, form. Never be vague.`}

${gameLines}

Return ONLY a valid JSON array, one object per game in the same order:
[{"eventId":"ID","reason":"Specific data-backed reason","replacedPick":null,"replacedMarket":null,"replacementReason":null}]

Rules:
- reason must reference actual numbers (Groove Score, odds, probabilities)
- Never say "insufficient data" — say what the data actually shows
- replacedPick and replacedMarket only filled if decision is REPLACE and allowSwitching is ${allowSwitching}
- No markdown, no preamble, valid JSON only`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a football betting analyst API. Output ONLY valid JSON array. No markdown. No explanation.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.15,
      max_tokens: 500 * games.length,
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = clean.indexOf('['), end = clean.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('No JSON array found')

    const parsed = JSON.parse(clean.substring(start, end + 1))
    for (const r of parsed) {
      if (r.eventId) results.set(r.eventId, r)
    }
  } catch (err) {
    console.error('[slip-optimizer] AI explanation failed:', err)
    // Fallback — use rule reasons
    for (const gd of games) {
      results.set(gd.game.eventId, { reason: gd.ruleReason })
    }
  }

  return results
}

// ─── SUMMARY GENERATOR ───────────────────────────────────────────────────

async function generateSummary(
  username: string,
  total: number,
  kept: number,
  removed: number,
  replaced: number,
  newOdds: number,
  targetOdds: number,
  avgGrooveScore: number
): Promise<string> {
  const fallback = `Hi ${username}, analysed ${total} games and kept ${kept} with a Groove Score of ${avgGrooveScore}/100 at ${newOdds.toFixed(2)} odds. Cut ${removed} risky picks${replaced > 0 ? ` and swapped ${replaced} for safer options` : ''}.`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Write 2-sentence betting summaries for Nigerian punters. Casual, warm, direct. No markdown. Exactly 2 sentences.',
        },
        {
          role: 'user',
          content: `Write exactly 2 sentences for ${username}. Start with "Hi ${username},". Facts: ${total} games analysed, ${kept} kept at ${newOdds.toFixed(2)} odds (target was ${targetOdds}), avg Groove Score ${avgGrooveScore}/100, cut ${removed} risky picks${replaced > 0 ? `, swapped ${replaced} for safer options` : ''}.`,
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

  const optimizedGames: OptimizedGame[] = []
  const needsAIExplanation: GameForAI[] = []

  // Phase 1: For each game — fetch stats, calculate Groove Score, apply market rules
  for (const game of games) {
    try {
      // Ensure fixture exists in DB
      const fixtureDbId = await ensureFixtureInDB(game)

      /// Fetch statistics — slip optimizer analyses SportyBet games which
      // don't have real BSD event IDs, so we use team-name search instead
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
      // Calculate Groove Score
      const scoreOutput = await calculateGrooveScore({
        pick: game.pick,
        market: game.market,
        odds: game.odds,
        stats,
        h2h,
      })

      // Apply market rules
      const ruleResult = await applyMarketRule(
        game.pick,
        game.market,
        game.odds,
        scoreOutput.grooveScore,
        stats,
        h2h
      )

      // Build form summary
      const formSummary = stats
        ? `${game.homeTeam} W${stats.homeWins}D${stats.homeDraws}L${stats.homeLosses} (${stats.homeAvgScored.toFixed(1)} scored/game) | ${game.awayTeam} W${stats.awayWins}D${stats.awayDraws}L${stats.awayLosses} (${stats.awayAvgScored.toFixed(1)} scored/game) | BSD: Home ${stats.probHome}% Draw ${stats.probDraw}% Away ${stats.probAway}%`
        : 'No statistical data available'

      const optimized: OptimizedGame = {
        ...game,
        grooveScore: scoreOutput.grooveScore,
        riskLevel: scoreOutput.riskLevel,
        confidence: scoreOutput.confidence,
        decision: ruleResult.decision,
        reason: ruleResult.reason,
        formSummary,
        valueEdge: scoreOutput.valueEdge,
        dataQuality: scoreOutput.dataQuality,
        keep: ruleResult.decision !== 'REMOVE',
      }

      optimizedGames.push(optimized)

      // Queue for AI explanation
      needsAIExplanation.push({
        game,
        grooveScore: scoreOutput.grooveScore,
        decision: ruleResult.decision,
        safeAlternative: ruleResult.safeAlternative,
        formSummary,
        valueEdge: scoreOutput.valueEdge,
        ruleReason: ruleResult.reason,
      })

    } catch (err) {
      console.error(`[slip-optimizer] Error processing ${game.homeTeam} vs ${game.awayTeam}:`, err)

      // Add with minimal data
      optimizedGames.push({
        ...game,
        grooveScore: 50,
        riskLevel: 'MEDIUM',
        confidence: 50,
        decision: 'KEEP',
        reason: 'Analysis unavailable — kept by default',
        formSummary: 'No data available',
        valueEdge: 0,
        dataQuality: 'MINIMAL',
        keep: true,
      })
    }
  }

  // Phase 2: Get AI explanations for all games
  const aiExplanations = await generateAIExplanations(
    needsAIExplanation,
    allowSwitching,
    username
  )

  // Phase 3: Apply AI explanations and handle replacements
  let replacedCount = 0
  const finalGames = optimizedGames.map(g => {
    const ai = aiExplanations.get(g.eventId)
    if (!ai) return g

    const updated = { ...g, reason: ai.reason || g.reason }

    // Handle replacement
    if (allowSwitching && g.decision === 'REPLACE' && ai.replacedPick && ai.replacedMarket) {
      replacedCount++
      return {
        ...updated,
        keep: true,
        replaced: true,
        originalPick: g.pick,
        originalMarket: g.market,
        originalOdds: g.odds,
        replacedPick: ai.replacedPick,
        replacedMarketDesc: ai.replacedMarket,
        replacedOdds: estimateSaferOdds(g.odds, ai.replacedPick),
        replacementReason: ai.replacementReason || ai.reason,
      }
    }

    return updated
  })

  // Phase 4: Calculate final odds and stats
  const keptGames = finalGames.filter(g => g.keep)
  const removedGames = finalGames.filter(g => !g.keep)

  const newOdds = keptGames.reduce((acc, g) => {
    const odds = g.replaced ? (g.replacedOdds || g.odds) : g.odds
    return acc * odds
  }, 1)

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
        replacedGames: replacedCount,
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
    replacedCount,
    newOdds,
    targetOdds,
    avgGrooveScore
  )

  return {
    games: finalGames,
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

// ─── HELPER ───────────────────────────────────────────────────────────────

function estimateSaferOdds(originalOdds: number, newPick: string): number {
  const p = newPick.toLowerCase()
  if (p.includes('double chance')) return Math.max(1.08, parseFloat((1 + (originalOdds - 1) * 0.35).toFixed(2)))
  if (p.includes('over 0.5')) return 1.10
  if (p.includes('over 1.5')) return Math.max(1.12, parseFloat((1 + (originalOdds - 1) * 0.30).toFixed(2)))
  if (p.includes('draw no bet')) return Math.max(1.10, parseFloat((1 + (originalOdds - 1) * 0.40).toFixed(2)))
  return Math.max(1.08, parseFloat((1 + (originalOdds - 1) * 0.45).toFixed(2)))
}