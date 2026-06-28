// Groove Slip — TypeScript Interfaces
// Module 1 — Database Types
// These mirror the Prisma schema exactly

// ─── FIXTURES ─────────────────────────────────────────────────────────────

export type FixtureStatus = 'UPCOMING' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED'

export interface Fixture {
  id: string
  fixtureId: string        // TheSportsDB event ID
  homeTeam: string
  awayTeam: string
  homeTeamId: string
  awayTeamId: string
  league: string
  leagueId: string
  country: string
  matchDate: Date
  status: FixtureStatus
  homeScore: number | null
  awayScore: number | null
  createdAt: Date
  updatedAt: Date
}

// ─── MATCH STATISTICS ─────────────────────────────────────────────────────

export interface MatchStatistics {
  id: string
  fixtureId: string

  // Home form
  homeFormString: string | null
  homeWins: number
  homeDraws: number
  homeLosses: number
  homeGoalsScored: number
  homeGoalsConceded: number
  homeAvgScored: number
  homeAvgConceded: number

  // Away form
  awayFormString: string | null
  awayWins: number
  awayDraws: number
  awayLosses: number
  awayGoalsScored: number
  awayGoalsConceded: number
  awayAvgScored: number
  awayAvgConceded: number

  // Predictions
  probHome: number
  probDraw: number
  probAway: number
  predictedResult: string | null

  // Goal trends
  over15Rate: number
  over25Rate: number
  bttsRate: number

  // xG
  xGHome: number | null
  xGAway: number | null

  // Injuries
  homeInjuredCount: number
  awayInjuredCount: number

  // Odds
  oddsHome: number | null
  oddsDraw: number | null
  oddsAway: number | null

  dataSource: string
  fetchedAt: Date
  updatedAt: Date
}

// ─── H2H ──────────────────────────────────────────────────────────────────

export interface H2HRecord {
  id: string
  homeTeamId: string
  awayTeamId: string
  fixtureRef: string | null
  totalMeetings: number
  homeWins: number
  awayWins: number
  draws: number
  totalGoals: number
  avgGoalsPerGame: number
  homeWinRate: number
  awayWinRate: number
  drawRate: number
  updatedAt: Date
}

// ─── TEAM STRENGTH ────────────────────────────────────────────────────────

export interface TeamStrength {
  id: string
  teamId: string
  teamName: string
  leagueId: string
  attackStrength: number
  defenceStrength: number
  overallStrength: number
  homeStrength: number
  awayStrength: number
  formPoints: number
  formString: string | null
  gamesPlayed: number
  updatedAt: Date
}

// ─── CONFIDENCE SCORE ─────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface ConfidenceScore {
  id: string
  fixtureId: string
  pick: string
  market: string

  // Component scores
  formScore: number
  homeAwayScore: number
  h2hScore: number
  goalTrendScore: number
  oddsScore: number
  teamStrengthScore: number

  // Final score
  grooveScore: number

  riskLevel: RiskLevel
  confidence: number

  // Value
  impliedProbability: number
  realProbability: number
  valueEdge: number

  calculatedAt: Date
}

// ─── MARKET RULES ─────────────────────────────────────────────────────────

export type MarketRisk = 'SAFE' | 'MEDIUM' | 'HIGH_VOLATILITY' | 'CUSTOM'

export interface MarketRule {
  id: string
  marketKey: string
  marketName: string
  marketGroup: string
  riskCategory: MarketRisk

  // Thresholds
  minConfidence: number
  keepThreshold: number
  replaceThreshold: number
  removeThreshold: number

  // Required data
  requiredMetrics: string[]

  // Formula weights
  formWeight: number
  homeAwayWeight: number
  h2hWeight: number
  goalTrendWeight: number
  oddsWeight: number
  teamStrengthWeight: number

  correlationGroup: string | null
  safeAlternative: string | null

  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ─── VALUE BET SCAN ───────────────────────────────────────────────────────

export interface ValueBetScan {
  id: string
  fixtureId: string
  pick: string
  market: string
  odds: number
  grooveScore: number
  realProbability: number
  impliedProbability: number
  valueEdge: number
  confidence: number
  reason: string
  scanDate: Date
  isActive: boolean
}

// ─── SLIP ANALYSIS LOG ────────────────────────────────────────────────────

export interface SlipAnalysisLog {
  id: string
  userId: string
  slipId: string | null
  totalGames: number
  keptGames: number
  removedGames: number
  replacedGames: number
  originalOdds: number
  newOdds: number
  targetOdds: number
  allowSwitching: boolean
  avgGrooveScore: number
  analysedAt: Date
}

// ─── ACCUMULATOR BUILD ────────────────────────────────────────────────────

export interface AccumulatorBuild {
  id: string
  userId: string
  targetOdds: number
  actualOdds: number
  riskLevel: RiskLevel
  legsCount: number
  avgGrooveScore: number
  picks: AccumulatorPick[]
  builtAt: Date
}

export interface AccumulatorPick {
  fixtureId: string
  homeTeam: string
  awayTeam: string
  league: string
  pick: string
  market: string
  odds: number
  grooveScore: number
  confidence: number
  reason: string
}

// ─── CONFIDENCE FORMULA INPUT ─────────────────────────────────────────────
// Used by Module 5 — Confidence Engine

export interface ConfidenceInput {
  // Form component (weight: 0.30)
  homeFormPoints: number    // 0-15 (W=3, D=1, L=0, last 5 games)
  awayFormPoints: number

  // Home/Away component (weight: 0.20)
  homeWinRateHome: number   // win rate when playing at home (0-1)
  awayWinRateAway: number   // win rate when playing away (0-1)

  // H2H component (weight: 0.15)
  h2hWinRate: number        // relevant team's H2H win rate (0-1)
  h2hMeetings: number       // number of H2H meetings (credibility weight)

  // Goal trend component (weight: 0.15)
  over15Rate: number        // % of games with over 1.5 goals
  over25Rate: number
  bttsRate: number
  avgGoalsPerGame: number

  // Odds component (weight: 0.10)
  impliedProbability: number // from bookmaker odds (0-100)
  pickProbability: number    // BSD prediction probability

  // Team strength component (weight: 0.10)
  teamStrength: number       // relevant team's overall strength (0-100)
  opponentStrength: number
}

export interface ConfidenceOutput {
  grooveScore: number        // 0-100 final score
  formScore: number          // component breakdown
  homeAwayScore: number
  h2hScore: number
  goalTrendScore: number
  oddsScore: number
  teamStrengthScore: number
  riskLevel: RiskLevel
  confidence: number
  valueEdge: number
}