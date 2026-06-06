import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

interface Game {
  eventId: string
  homeTeam: string
  awayTeam: string
  odds: number
  pick: string
  market: string
  marketId: string
  outcomeId: string
  specifier: string | null
  league: string
  kickoffTime: string
  sport: string
}

interface GameAnalysis extends Game {
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
}

interface SlipAnalysis {
  games: GameAnalysis[]
  removedGames: GameAnalysis[]
  keptGames: GameAnalysis[]
  originalOdds: number
  newOdds: number
  targetOdds: number
  summary: string
}

type Step = 'input' | 'decoded' | 'analysing' | 'result'

export default function Dashboard() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [step, setStep] = useState<Step>('input')
  const [code, setCode] = useState('')
  const [targetOdds, setTargetOdds] = useState('')
  const [allowSwitching, setAllowSwitching] = useState<boolean | null>(null)
  const [slip, setSlip] = useState<{ shareCode: string; totalOdds: number; games: Game[] } | null>(null)
  const [analysis, setAnalysis] = useState<SlipAnalysis | null>(null)
  const [newCode, setNewCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [freeAnalysisUsed, setFreeAnalysisUsed] = useState(false)
const [showFreeTrialPrompt, setShowFreeTrialPrompt] = useState(false)
  useEffect(() => {
  const token = localStorage.getItem('token')
  if (!token) { router.push('/'); return }
  const freeUsed = localStorage.getItem('freeAnalysisUsed')
setFreeAnalysisUsed(freeUsed === 'true')
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    setUsername(payload.username)
    setIsAdmin(payload.email === 'simeonadigun0@gmail.com')
    if (payload.email === 'simeonadigun0@gmail.com') {
      setSubscriptionActive(true)
    }
  } catch { router.push('/') }

  // Check subscription status
  const subExpiry = localStorage.getItem('subscriptionExpiry')
  const subWaived = localStorage.getItem('subscriptionWaived')
  if (subWaived === 'true') {
    setSubscriptionActive(true)
  } else if (subExpiry) {
    setSubscriptionExpiry(subExpiry)
    setSubscriptionActive(new Date(subExpiry) > new Date())
  }
}, [router])

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })
const handlePayment = async () => {
  setPaymentLoading(true)
  try {
    const res = await fetch('/api/payment/initialize', {
      method: 'POST',
      headers: authHeaders(),
    })
    const data = await res.json()
    if (data.authorizationUrl) {
      window.location.href = data.authorizationUrl
    }
    const fetchMarketsClientSide = async (games: Game[]): Promise<Record<string, unknown>> => {
  const marketsMap: Record<string, unknown> = {}
  
  await Promise.all(games.map(async (game) => {
    try {
      const commonMarketIds = ['1','2','3','4','5','18','19','20','21','29','45']
      const payload = commonMarketIds.map(marketId => ({
        eventId: game.eventId,
        marketId,
        outcomeId: '1',
        specifier: null,
      }))

      const res = await fetch('https://www.sportybet.com/api/ng/factsCenter/Outcomes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Origin': 'https://www.sportybet.com',
          'Referer': 'https://www.sportybet.com/ng/',
          'Clientid': 'web',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) return
      const data = await res.json()
      if (!data || data.bizCode !== 10000) return

      // Collect all unique markets
      const allMarkets: unknown[] = []
      const seenIds = new Set<string>()

      for (const eventData of (data.data || [])) {
        for (const m of (eventData.markets || [])) {
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id)
            allMarkets.push(m)
          }
        }
      }

      if (allMarkets.length > 0) {
        marketsMap[game.eventId] = {
          eventId: game.eventId,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          markets: allMarkets,
        }
      }
    } catch { /* skip */ }
  }))

  return marketsMap
}
  } catch {
    setError('Failed to initialize payment')
  } finally {
    setPaymentLoading(false)
  }
}
  const handleDecode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/decode', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to decode')
      if (!data.games?.length) throw new Error('No games found in this booking code')
      setSlip(data)
      setAllowSwitching(null)
      setStep('decoded')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to decode')
    } finally { setLoading(false) }
  }
const resolveReplacedPicks = async (replacedGames: GameAnalysis[]): Promise<GameAnalysis[]> => {
  const resolved: GameAnalysis[] = []

  for (const game of replacedGames) {
    if (!game.replaced || !game.replacedPick || !game.replacedMarketDesc) {
      resolved.push(game)
      continue
    }

    try {
      // Fetch real markets from SportyBet browser-side
      const payload = [
        { eventId: game.eventId, marketId: '1', outcomeId: '1', specifier: null },
        { eventId: game.eventId, marketId: '2', outcomeId: '1', specifier: null },
        { eventId: game.eventId, marketId: '3', outcomeId: '1', specifier: null },
        { eventId: game.eventId, marketId: '5', outcomeId: '1', specifier: null },
      ]

      const res = await fetch('https://www.sportybet.com/api/ng/factsCenter/Outcomes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Origin': 'https://www.sportybet.com',
          'Referer': 'https://www.sportybet.com/ng/',
          'Clientid': 'web',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) { resolved.push(game); continue }
      const data = await res.json()
      if (!data || data.bizCode !== 10000) { resolved.push(game); continue }

      // Find the market and outcome
      const allMarkets: Record<string, unknown>[] = []
      for (const ev of (data.data || [])) {
        for (const m of ((ev as Record<string, unknown>).markets as unknown[] || [])) {
          allMarkets.push(m as Record<string, unknown>)
        }
      }

      const targetMarketName = game.replacedMarketDesc!.toLowerCase()
      const targetPickName = game.replacedPick!.toLowerCase()

      const market = allMarkets.find(m => {
        const desc = (m.desc as string || '').toLowerCase()
        return desc === targetMarketName ||
          desc.includes(targetMarketName) ||
          targetMarketName.includes(desc)
      })

      if (!market) { resolved.push(game); continue }

      const outcomes = (market.outcomes as unknown[] || []) as Record<string, unknown>[]
      const outcome = outcomes.find(o => {
        const desc = (o.desc as string || '').toLowerCase()
        if (targetPickName.startsWith('over') || targetPickName.startsWith('under')) {
          const tNum = parseFloat(targetPickName.replace(/[^0-9.]/g, ''))
          const oNum = parseFloat(desc.replace(/[^0-9.]/g, ''))
          const dir = targetPickName.startsWith('over') ? 'over' : 'under'
          return desc.startsWith(dir) && Math.abs(oNum - tNum) < 0.1
        }
        return desc === targetPickName ||
          desc.includes(targetPickName) ||
          targetPickName.includes(desc)
      })

      if (!outcome) { resolved.push(game); continue }

      const realOdds = parseFloat(String(outcome.odds || game.replacedOdds || game.odds))
      const isActive = outcome.isActive === 1 || outcome.isActive === true

      if (!isActive) { resolved.push(game); continue }

      // Return game with REAL marketId, outcomeId and odds
      resolved.push({
        ...game,
        marketId: String(market.id || game.marketId),
        outcomeId: String(outcome.id || game.outcomeId),
        replacedOdds: realOdds,
        odds: realOdds,
      })
    } catch {
      resolved.push(game)
    }
  }

  return resolved
}

 const handleAnalyse = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!slip) return

  // Check access
const freeTrialAvailable = !freeAnalysisUsed && !isAdmin
const canAnalyse = subscriptionActive || isAdmin || freeTrialAvailable

if (!canAnalyse) {
  setShowPayment(true)
  return
}

  if (allowSwitching === null) { setError('Please choose what to do with risky picks'); return }
  const target = parseFloat(targetOdds)
  if (!target || target < 1) { setError('Enter valid target odds'); return }
  setLoading(true); setError(''); setStep('analysing')

  try {
    // Step 1: Run AI analysis
    const res = await fetch('/api/analyse', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({
        games: slip.games,
        targetOdds: target,
        originalTotalOdds: slip.totalOdds,
        allowSwitching,
        clientMarkets: {},
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setAnalysis(data)
  if (data.wasFreeTrial) {
  localStorage.setItem('freeAnalysisUsed', 'true')
  setFreeAnalysisUsed(true)
  setShowFreeTrialPrompt(true)
}

    // Step 2: For replaced games, fetch real market data from browser
    // then rebook with real outcomeIds
    let gamesToBook = data.keptGames as GameAnalysis[]

    if (allowSwitching && data.keptGames?.some((g: GameAnalysis) => g.replaced)) {
      // Fetch real markets for replaced games from browser
      const replacedGames = data.keptGames.filter((g: GameAnalysis) => g.replaced)
      const resolvedGames = await resolveReplacedPicks(replacedGames)

      // Merge resolved games back
      gamesToBook = data.keptGames.map((g: GameAnalysis) => {
        const resolved = resolvedGames.find(r => r.eventId === g.eventId)
        return resolved || g
      })

      // Update analysis with resolved odds
      setAnalysis({ ...data, keptGames: gamesToBook })
    }

    if (gamesToBook?.length > 0) {
      const rebookRes = await fetch('/api/rebook', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ games: gamesToBook }),
      })
      const rebookData = await rebookRes.json()
      if (rebookRes.ok && rebookData.code) setNewCode(rebookData.code)
    }

    setStep('result')
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Analysis failed')
    setStep('decoded')
  } finally { setLoading(false) }
}
  const reset = () => {
    setStep('input'); setCode(''); setTargetOdds('')
    setSlip(null); setAnalysis(null); setNewCode('')
    setError(''); setCopied(false); setAllowSwitching(null)
  }

  const logout = async () => {
    await fetch('/api/auth/logout')
    localStorage.removeItem('token')
    router.push('/')
  }

  const confidenceColor = (score: number) =>
    score >= 75 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'

  const dataSourceLabel = (source: string) => {
    if (source === 'BSD+SOFASCORE') return '🟢 BSD + Sofascore'
    if (source === 'BSD') return '🟢 BSD Data'
    if (source === 'SOFASCORE') return '🔵 Sofascore'
    if (source === 'AI_WEB_SEARCH') return '🟡 Web Search'
    return '🔴 Limited Data'
  }

  return (
    <>
      <Head>
        <title>Groove Slip</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Nav */}
        <nav style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '0 16px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
              Groove <span style={{ color: 'var(--accent)' }}>Slip</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isAdmin && (
              <button onClick={() => router.push('/admin')}
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                ⚙ Admin
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', borderRadius: 8, padding: '6px 10px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{username}</span>
              <button onClick={logout} style={{ background: 'none', color: 'var(--text3)', fontSize: 11, padding: 0, fontWeight: 600 }}>
                · Logout
              </button>
            </div>
          </div>
        </nav>

        <main style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 40px' }}>

          {/* STEP 1: Input */}
          {step === 'input' && (
            <div className="fade-up">
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                  Analyse Your Slip
                </h2>
                <p style={{ color: 'var(--text2)', fontSize: 14 }}>
                  Paste your SportyBet booking code below
                </p>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <form onSubmit={handleDecode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8, letterSpacing: '0.04em' }}>
                      BOOKING CODE
                    </label>
                    <input type="text" placeholder="e.g. YQKP2M"
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', textAlign: 'center', padding: '16px' }}
                      required />
                  </div>
                  {error && (
                    <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 14px', color: 'var(--red)', fontSize: 13 }}>
                      ⚠ {error}
                    </div>
                  )}
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                          Reading games...
                        </span>
                      : '🔍 Read Booking Code'}
                  </button>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '📊', title: 'Real Data Analysis', desc: 'BSD + Sofascore real match statistics' },
                  { icon: '🔄', title: 'Smart Pick Replacement', desc: 'Swaps risky picks for safer alternatives' },
                  { icon: '🎯', title: 'Fresh Booking Code', desc: 'New clean code instantly generated' },
                ].map(item => (
                  <div key={item.title} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{item.title}</div>
                      <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 1 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Decoded */}
          {step === 'decoded' && slip && (
            <div className="fade-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <button onClick={reset} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600 }}>← Back</button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '4px 10px', borderRadius: 6 }}>{slip.shareCode}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Games', value: slip.games.length },
                  { label: 'Total Odds', value: slip.totalOdds },
                  { label: 'Sport', value: slip.games[0]?.sport || 'Football' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Games list */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.04em', marginBottom: 12 }}>ALL GAMES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {slip.games.map((g, i) => (
                    <div key={g.eventId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, minWidth: 16, paddingTop: 1 }}>{i + 1}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.homeTeam} vs {g.awayTeam}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{g.pick} · {g.market}</div>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--accent)', flexShrink: 0, marginLeft: 8 }}>{g.odds}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consent question */}
              <div style={{ background: '#fff', border: '2px solid var(--navy)', borderRadius: 14, padding: '16px', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: 'var(--navy)' }}>
                  🤔 When i find a risky pick, what should i do?
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.5 }}>
                  This choice affects how i handles low-confidence games on your slip.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => setAllowSwitching(false)}
                    style={{
                      padding: '12px 14px', borderRadius: 10, fontSize: 13,
                      textAlign: 'left', cursor: 'pointer',
                      background: allowSwitching === false ? 'rgba(220,38,38,0.06)' : 'var(--bg)',
                      border: allowSwitching === false ? '2px solid var(--red)' : '1.5px solid var(--border)',
                      color: 'var(--text)',
                    }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>🗑️ Remove the game</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Remove risky picks entirely from the slip</div>
                  </button>
                  <button
                    onClick={() => setAllowSwitching(true)}
                    style={{
                      padding: '12px 14px', borderRadius: 10, fontSize: 13,
                      textAlign: 'left', cursor: 'pointer',
                      background: allowSwitching === true ? 'var(--accent-dim)' : 'var(--bg)',
                      border: allowSwitching === true ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                      color: 'var(--text)',
                    }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>🔄 Replace risky pick with a safer one</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>I will replace low confidence pick with a safer pick on the same match</div>
                  </button>
                </div>
              </div>

              {/* Target odds */}
              <div style={{ background: '#fff', border: '2px solid var(--accent)', borderRadius: 16, padding: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Set Target Odds</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                  AI will aim to land close to your target — slightly above or below is fine
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {[5, 20, 50, 100, 500].map(odd => (
                    <button key={odd} onClick={() => setTargetOdds(String(odd))}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700, background: targetOdds === String(odd) ? 'var(--accent)' : 'var(--bg)', color: targetOdds === String(odd) ? '#fff' : 'var(--text2)', border: targetOdds === String(odd) ? '1.5px solid var(--accent)' : '1.5px solid var(--border)', cursor: 'pointer' }}>
                      {odd}x
                    </button>
                  ))}
                </div>
                <form onSubmit={handleAnalyse} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input type="number" placeholder="Or type any number e.g. 3000"
                    value={targetOdds}
                    onChange={e => setTargetOdds(e.target.value)}
                    min={1} step="any" required />
                  {error && <div style={{ color: 'var(--red)', fontSize: 13 }}>⚠ {error}</div>}
                  <button type="submit" className="btn-primary" disabled={loading || allowSwitching === null}>
                    {loading ? '⏳ Analysing...' : !subscriptionActive && !isAdmin && !freeAnalysisUsed
  ? '🎁 Analyse Free (1 free trial)'
  : '🧹 Analyse & Clean Slip'}
                  </button>
                  {allowSwitching === null && (
                    <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
                      ↑ Choose what to do with risky picks first
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* STEP 3: Analysing */}
          {step === 'analysing' && (
            <div className="fade-up" style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--accent-dim)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>🤖</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Deep Analysis Running</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>
                {allowSwitching
                  ? 'Finding safer alternatives for risky picks...'
                  : 'Identifying and removing bad eggs...'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 280, margin: '0 auto' }}>
                {[
                  'Searching BSD database...',
                  'Checking Sofascore form...',
                  'Analysing H2H records...',
                  allowSwitching ? 'Finding safer market options...' : 'Targeting your desired odds...',
                  'Building clean slip...',
                ].map(msg => (
                  <div key={msg} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
                    <span className="spinner" />
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Results */}
          {step === 'result' && analysis && (
            <div className="fade-up">
              {/* New Code */}
              {newCode ? (
                <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid var(--accent)', borderRadius: 18, padding: '20px', marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', marginBottom: 6 }}>✅ NEW BOOKING CODE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 800, color: 'var(--navy)', letterSpacing: '0.15em', marginBottom: 14 }}>{newCode}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { navigator.clipboard.writeText(newCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                      className="btn-primary" style={{ flex: 2 }}>
                      {copied ? '✓ Copied!' : '📋 Copy Code'}
                    </button>
                    <button onClick={reset} className="btn-secondary" style={{ flex: 1 }}>New Slip</button>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--yellow-dim)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: 'var(--yellow)', fontSize: 14, marginBottom: 2 }}>⚠ Auto-booking unavailable</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>Load the kept games manually on SportyBet.</div>
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Original Odds', value: analysis.originalOdds, color: 'var(--text2)' },
                  { label: 'New Odds', value: analysis.newOdds, color: 'var(--accent)' },
                  { label: 'Games Kept', value: analysis.keptGames.length, color: 'var(--accent)' },
                  { label: 'Removed', value: analysis.removedGames.length, color: 'var(--red)' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 4 }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Replaced count banner */}
              {analysis.keptGames.filter(g => g.replaced).length > 0 && (
                <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.06))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🔄</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>
                      {analysis.keptGames.filter(g => g.replaced).length} pick{analysis.keptGames.filter(g => g.replaced).length > 1 ? 's' : ''} replaced with safer options
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Look for the 🔄 PICK CHANGED badge below</div>
                  </div>
                </div>
              )}

              {/* AI Summary */}
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{analysis.summary}</p>
              </div>

              {/* Kept Games */}
              <div className="card" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.04em', marginBottom: 12 }}>
                  ✅ KEPT GAMES ({analysis.keptGames.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analysis.keptGames.map(g => (
                    <div key={g.eventId} style={{
                      padding: '14px',
                      borderRadius: 12,
                      background: g.replaced
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(99,102,241,0.04))'
                        : 'rgba(22,163,74,0.04)',
                      border: `2px solid ${g.replaced ? 'rgba(59,130,246,0.3)' : 'rgba(22,163,74,0.15)'}`,
                      position: 'relative',
                    }}>
                      {/* Replaced badge */}
                      {g.replaced && (
                        <div style={{
                          position: 'absolute', top: -1, right: 10,
                          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                          color: '#fff', fontSize: 10, fontWeight: 800,
                          padding: '2px 8px', borderRadius: '0 0 6px 6px',
                          letterSpacing: '0.05em',
                        }}>
                          🔄 PICK CHANGED
                        </div>
                      )}

                      {/* Match name + odds */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, marginTop: g.replaced ? 8 : 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, flex: 1, paddingRight: 8 }}>
                          {g.homeTeam} vs {g.awayTeam}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: g.replaced ? '#3b82f6' : 'var(--accent)' }}>
                            {g.replaced ? (g.replacedOdds || g.odds) : g.odds}
                          </span>
                          <span className={`tag tag-${g.riskLevel.toLowerCase()}`}>{g.riskLevel}</span>
                        </div>
                      </div>

                      {/* Pick change display */}
                      {g.replaced ? (
                        <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 6, letterSpacing: '0.04em' }}>
                            PICK CHANGED TO SAFER OPTION
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {/* Original pick - struck through */}
<div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#dc2626', textDecoration: 'line-through' }}>
  {g.originalPick || g.pick} ({g.originalMarket || g.market}) @ {g.originalOdds || g.odds}
</div>
<span style={{ fontSize: 14, color: 'var(--text3)' }}>→</span>
{/* New safer pick */}
<div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#3b82f6', fontWeight: 700 }}>
  {g.replacedPick} ({g.replacedMarketDesc}) @ ~{g.replacedOdds}
</div>
                          </div>
                          <div style={{ fontSize: 11, color: '#6366f1', marginTop: 6, fontStyle: 'italic' }}>
                            💡 {g.replacementReason}
                          </div>
                        </div>
                      ) : (
  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
    {g.league} · Pick: <strong style={{ color: g.replaced ? '#3b82f6' : 'var(--text2)' }}>{g.replaced ? g.replacedPick : g.pick}</strong> ({g.replaced ? g.replacedMarketDesc : g.market})
  </div>
)}

                      {/* Confidence bar */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>CONFIDENCE</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor(g.confidenceScore) }}>{g.confidenceScore}%</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${g.confidenceScore}%`, background: g.replaced ? 'linear-gradient(90deg, #3b82f6, #6366f1)' : confidenceColor(g.confidenceScore), borderRadius: 2, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 4 }}>
                        💡 {g.reason}
                      </div>
                      {g.formSummary && !g.replaced && (
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
                          📊 {g.formSummary}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{dataSourceLabel(g.dataSource)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Removed Games */}
              {analysis.removedGames.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', letterSpacing: '0.04em', marginBottom: 12 }}>
                    ❌ REMOVED BAD EGGS ({analysis.removedGames.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {analysis.removedGames.map(g => (
                      <div key={g.eventId} style={{ padding: '12px', borderRadius: 10, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, textDecoration: 'line-through', color: 'var(--text3)', flex: 1, paddingRight: 8 }}>{g.homeTeam} vs {g.awayTeam}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--red)' }}>{g.odds}</span>
                            <span className={`tag tag-${g.riskLevel.toLowerCase()}`}>{g.riskLevel}</span>
                          </div>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>CONFIDENCE</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor(g.confidenceScore) }}>{g.confidenceScore}%</span>
                          </div>
                          <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${g.confidenceScore}%`, background: confidenceColor(g.confidenceScore), borderRadius: 2 }} />
                          </div>
                        </div>

                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{g.league} · Pick: {g.pick}</div>
                        <div style={{ fontSize: 12, color: 'var(--red)', fontStyle: 'italic', marginBottom: 4 }}>⚠ {g.reason}</div>
                        {g.formSummary && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>📊 {g.formSummary}</div>}
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{dataSourceLabel(g.dataSource)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={reset} className="btn-primary" style={{ background: 'var(--navy)' }}>
                Analyse Another Slip
              </button>
            </div>
          )}
          {/* Free Trial Used Prompt */}
{showFreeTrialPrompt && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
  }}>
    <div style={{
      background: '#fff', borderRadius: 20, padding: 28,
      maxWidth: 380, width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Free Trial Used</h3>
      <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        You've used your free analysis. Subscribe to keep optimising your slips.
      </p>
      <button onClick={() => { setShowFreeTrialPrompt(false); setShowPayment(true) }} style={{
        background: 'linear-gradient(135deg, #16a34a, #15803d)',
        color: '#fff', padding: '12px 24px', borderRadius: 10,
        fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', width: '100%',
      }}>
        Subscribe — ₦2,500/month
      </button>
      <button onClick={() => setShowFreeTrialPrompt(false)} style={{
        marginTop: 10, background: 'transparent', border: 'none',
        color: '#94a3b8', fontSize: 13, cursor: 'pointer',
      }}>
        Maybe later
      </button>
    </div>
  </div>
)}
          {/* Payment Modal */}
{showPayment && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
  }}>
    <div style={{
      background: '#fff', borderRadius: 20, padding: 28,
      maxWidth: 380, width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>
          Subscription Required
        </h3>
        <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
          {subscriptionExpiry && new Date(subscriptionExpiry) < new Date()
            ? 'Your subscription has expired. Renew to continue analysing slips.'
            : 'Subscribe to unlock AI analysis and slip cleaning.'}
        </p>
      </div>

      <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 14, padding: '16px', marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Monthly Subscription</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>₦2,500</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>per month · Cancel anytime</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {[
          '✅ Unlimited slip analysis',
          '✅ Expert pick replacement',
          '✅ Live form, injuries & stats',
          '✅ Fresh booking codes instantly',
        ].map(f => (
          <div key={f} style={{ fontSize: 13, color: 'var(--text2)' }}>{f}</div>
        ))}
      </div>

      <button
        onClick={handlePayment}
        disabled={paymentLoading}
        style={{
          width: '100%', padding: '14px', background: 'var(--accent)',
          color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          marginBottom: 10,
        }}>
        {paymentLoading
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              Redirecting...
            </span>
          : '💳 Subscribe with Paystack'}
      </button>

      <button onClick={() => setShowPayment(false)}
        style={{ width: '100%', padding: '12px', background: 'none', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, cursor: 'pointer' }}>
        Cancel
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 12 }}>
        Secure payment via Paystack · ₦2,500/month
      </p>
    </div>
  </div>
)}
        </main>

        {/* Footer */}
        <div style={{
          textAlign: 'center', padding: '16px',
          borderTop: '1px solid var(--border)',
          background: '#fff',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>
            Encounter a challenge?{' '}
            <a
              href="https://wa.me/2349113349715"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#25D366', fontWeight: 700, textDecoration: 'none' }}
            >
              💬 Contact Support on WhatsApp
            </a>
          </span>
        </div>
      </div>
    </>
  )
}

function fetchMarketsClientSide(games: Game[]): Record<string, unknown> | PromiseLike<Record<string, unknown>> {
  throw new Error('Function not implemented.')
}

async function resolveReplacedPicks(replacedGames: GameAnalysis[]): Promise<GameAnalysis[]> {
  // Currently no browser market resolution logic is implemented.
  // Return the input games unchanged so downstream analysis can continue.
  return replacedGames
}

