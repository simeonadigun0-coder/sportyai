import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'

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
  availableMarkets?: Array<{
    id: string
    desc: string
    outcomes: Array<{ id: string; desc: string; odds: number }>
  }>
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
  needsResolution?: boolean
}

interface SlipAnalysis {
  games: GameAnalysis[]
  removedGames: GameAnalysis[]
  keptGames: GameAnalysis[]
  originalOdds: number
  newOdds: number
  targetOdds: number
  summary: string
  wasFreeTrial?: boolean
}

type Step = 'input' | 'decoded' | 'analysing' | 'result'

export default function Dashboard() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [freeAnalysisUsed, setFreeAnalysisUsed] = useState(false)
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
  const [showPayment, setShowPayment] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showFreeTrialPrompt, setShowFreeTrialPrompt] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUsername(payload.username)
      const adminEmail = 'simeonadigun0@gmail.com'
      setIsAdmin(payload.email === adminEmail)
      if (payload.email === adminEmail) setSubscriptionActive(true)
    } catch { router.push('/') }

    const subExpiry = localStorage.getItem('subscriptionExpiry')
    const subWaived = localStorage.getItem('subscriptionWaived')
    const freeUsed = localStorage.getItem('freeAnalysisUsed')

    if (subWaived === 'true') setSubscriptionActive(true)
    else if (subExpiry) setSubscriptionActive(new Date(subExpiry) > new Date())

    setFreeAnalysisUsed(freeUsed === 'true')
  }, [router])

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

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
      if (!data.games?.length) throw new Error('No games found')
      setSlip(data); setAllowSwitching(null); setStep('decoded')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to decode')
    } finally { setLoading(false) }
  }
  const resolveReplacementsClientSide = async (
  replacedGames: GameAnalysis[]
): Promise<Array<{ eventId: string; marketId: string; outcomeId: string; replacedOdds: number; needsResolution: false }>> => {
  const results = []

  for (const game of replacedGames) {
    if (!game.replacedPick || !game.replacedMarketDesc) continue

    try {
      // Fetch real markets from SportyBet directly from browser
      // Browser is NOT blocked by SportyBet (only Vercel server IPs are)
      const payload = [
        { eventId: game.eventId, marketId: '1', outcomeId: '1', specifier: null },
        { eventId: game.eventId, marketId: '2', outcomeId: '1', specifier: null },
        { eventId: game.eventId, marketId: '3', outcomeId: '1', specifier: null },
        { eventId: game.eventId, marketId: '4', outcomeId: '1', specifier: null },
        { eventId: game.eventId, marketId: '5', outcomeId: '1', specifier: null },
        { eventId: game.eventId, marketId: '18', outcomeId: '1', specifier: null },
        { eventId: game.eventId, marketId: '21', outcomeId: '1', specifier: null },
        { eventId: game.eventId, marketId: '29', outcomeId: '1', specifier: null },
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

      if (!res.ok) continue
      const data = await res.json()
      if (!data || data.bizCode !== 10000) continue

      // Build markets list from response
      const marketsMap = new Map<string, { id: string; desc: string; outcomes: Array<{ id: string; desc: string; odds: number; isActive: boolean }> }>()

      for (const ev of (data.data || [])) {
        for (const m of (ev.markets || [])) {
          if (!marketsMap.has(m.id)) {
            marketsMap.set(m.id, {
              id: m.id,
              desc: m.desc || m.name || '',
              outcomes: (m.outcomes || [])
                .filter((o: { isActive: number | boolean }) => o.isActive === 1 || o.isActive === true)
                .map((o: { id: string; desc: string; odds: string }) => ({
                  id: o.id,
                  desc: o.desc || '',
                  odds: parseFloat(String(o.odds || 1)),
                  isActive: true,
                }))
            })
          }
        }
      }

      const allMarkets = Array.from(marketsMap.values())
      const targetMarket = game.replacedMarketDesc!.toLowerCase()
      const targetPick = game.replacedPick!.toLowerCase()

      // Find matching market
      const market = allMarkets.find(m => {
        const d = m.desc.toLowerCase()
        return d === targetMarket || d.includes(targetMarket) || targetMarket.includes(d)
      })

      if (!market) continue

      // Find matching outcome
      const outcome = market.outcomes.find(o => {
        const d = o.desc.toLowerCase()

        // Numeric Over/Under match
        if (targetPick.startsWith('over') || targetPick.startsWith('under')) {
          const tNum = parseFloat(targetPick.replace(/[^0-9.]/g, ''))
          const dNum = parseFloat(d.replace(/[^0-9.]/g, ''))
          const dir = targetPick.startsWith('over') ? 'over' : 'under'
          if (!isNaN(tNum) && !isNaN(dNum)) {
            return d.startsWith(dir) && Math.abs(dNum - tNum) < 0.1
          }
        }

        // Double Chance
        if (targetPick === 'home/draw') return d === 'home/draw' || d === '1x' || d.includes('home') && d.includes('draw')
        if (targetPick === 'draw/away') return d === 'draw/away' || d === 'x2' || d.includes('draw') && d.includes('away')
        if (targetPick === 'home/away') return d === 'home/away' || d === '12'

        return d === targetPick || d.includes(targetPick) || targetPick.includes(d)
      })

      if (!outcome) continue

      // Only use if genuinely safer odds
      if (outcome.odds >= (game.originalOdds || game.odds)) continue
      if (outcome.odds <= 1.02) continue

      results.push({
        eventId: game.eventId,
        marketId: market.id,
        outcomeId: outcome.id,
        replacedOdds: outcome.odds,
        needsResolution: false as const,
      })

    } catch { continue }
  }

  return results
}

 const handleAnalyse = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!slip) return

  const freeTrialAvailable = !freeAnalysisUsed && !isAdmin
  const canAnalyse = subscriptionActive || isAdmin || freeTrialAvailable
  if (!canAnalyse) { setShowPayment(true); return }
  if (allowSwitching === null) { setError('Please choose what to do with risky picks'); return }
  const target = parseFloat(targetOdds)
  if (!target || target < 1) { setError('Enter valid target odds'); return }

  setLoading(true); setError(''); setStep('analysing')

  try {
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

    if (data.wasFreeTrial) {
      localStorage.setItem('freeAnalysisUsed', 'true')
      setFreeAnalysisUsed(true)
    }

    setAnalysis(data)

    // Generate booking code — replaced games now have real IDs from server
    let rebookCode = ''
    if (data.keptGames?.length > 0) {
      const rebookRes = await fetch('/api/rebook', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ games: data.keptGames }),
      })
      const rebookData = await rebookRes.json()
      if (rebookRes.ok && rebookData.code) {
        rebookCode = rebookData.code
        setNewCode(rebookData.code)
      }
    }

    setStep('result')
    if (data.wasFreeTrial) setShowFreeTrialPrompt(true)

    // Auto-save slip to history
    if (data.keptGames?.length > 0) {
      try {
        await fetch('/api/slips/save', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            bookingCode: rebookCode || 'N/A',
            originalCode: slip?.shareCode || '',
            originalOdds: data.originalOdds,
            newOdds: data.newOdds,
            targetOdds: target,
            games: data.keptGames.map((g: GameAnalysis) => ({
              eventId: g.eventId,
              homeTeam: g.homeTeam,
              awayTeam: g.awayTeam,
              pick: g.replacedPick || g.pick,
              market: g.replacedMarketDesc || g.market,
              odds: g.replacedOdds || g.odds,
              league: g.league,
              kickoffTime: g.kickoffTime,
              replaced: g.replaced || false,
              originalPick: g.originalPick,
              originalOdds: g.originalOdds,
            })),
            removedCount: data.removedGames?.length || 0,
            replacedCount: data.keptGames?.filter((g: GameAnalysis) => g.replaced).length || 0,
          }),
        })
      } catch { /* non-critical */ }
    }

  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Analysis failed')
    setStep('decoded')
  } finally { setLoading(false) }
}
  const handlePayment = async () => {
    setPaymentLoading(true)
    try {
      const res = await fetch('/api/payment/initialize', { method: 'POST', headers: authHeaders() })
      const data = await res.json()
      if (data.authorizationUrl) window.location.href = data.authorizationUrl
    } catch { setError('Failed to initialize payment') }
    finally { setPaymentLoading(false) }
  }

  const reset = () => {
    setStep('input'); setCode(''); setTargetOdds('')
    setSlip(null); setAnalysis(null); setNewCode('')
    setError(''); setCopied(false); setAllowSwitching(null)
  }

  const logout = async () => {
    await fetch('/api/auth/logout')
    localStorage.removeItem('token')
    localStorage.removeItem('subscriptionExpiry')
    localStorage.removeItem('subscriptionWaived')
    router.push('/')
  }

  const confidenceColor = (s: number) => s >= 75 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626'
  const riskBg = (r: string) => r === 'LOW' ? 'rgba(22,163,74,0.1)' : r === 'MEDIUM' ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)'
  const riskColor = (r: string) => r === 'LOW' ? '#16a34a' : r === 'MEDIUM' ? '#d97706' : '#dc2626'

  const dataSourceLabel = (s: string) => {
    if (s === 'BSD+SOFASCORE') return { label: 'BSD + Sofascore', color: '#16a34a' }
    if (s === 'BSD') return { label: 'BSD Data', color: '#16a34a' }
    if (s === 'SOFASCORE') return { label: 'Sofascore', color: '#3b82f6' }
    if (s === 'AI_WEB_SEARCH') return { label: 'Web Search', color: '#d97706' }
    return { label: 'Limited Data', color: '#dc2626' }
  }

  const freeTrialAvailable = !freeAnalysisUsed && !isAdmin
  const canAnalyse = subscriptionActive || isAdmin || freeTrialAvailable

  return (
    <>
      <Head>
        <title>Groove Slip — Analyse</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1a3d1e" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#f0f4f0', fontFamily: 'Inter, sans-serif' }}>

        {/* NAV */}
        <nav style={{
          background: '#1a3d1e', padding: '0 16px', height: 54,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/logo.png" alt="Groove Slip" width={28} height={28} style={{ objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-0.01em' }}>
              Groove <span style={{ color: '#4ade80' }}>Slip</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isAdmin && (
              <button onClick={() => router.push('/admin')}
                style={{ background: 'rgba(255,255,255,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                ⚙ Admin
              </button>
            )}
            {!canAnalyse && (
              <button onClick={() => setShowPayment(true)}
                style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Subscribe ₦2,500
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 10px' }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{username}</span>
              <button onClick={logout} style={{ background: 'none', color: '#64748b', fontSize: 11, padding: 0, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                · Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Subscription Banner */}
        {!canAnalyse && (
          <div style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', padding: '10px 16px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
              🔒 Subscribe to keep analysing slips
            </span>
            <button onClick={() => setShowPayment(true)}
              style={{ background: '#fff', color: '#15803d', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ₦2,500/month
            </button>
          </div>
        )}

        {freeTrialAvailable && (
          <div style={{ background: 'rgba(22,163,74,0.08)', border: '0', borderBottom: '1px solid rgba(22,163,74,0.15)', padding: '8px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
              🎁 You have 1 free analysis remaining — try it now!
            </span>
          </div>
        )}

        <main style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 100px' }}>

          {/* STEP 1 — Input */}
          {step === 'input' && (
            <div className="fade-up">
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 2, color: '#0f2010' }}>
                  Analyse Your Slip
                </h2>
                <p style={{ color: '#64748b', fontSize: 13 }}>Paste your SportyBet booking code</p>
              </div>

              <div style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                <form onSubmit={handleDecode} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>
                      BOOKING CODE
                    </label>
                    <input type="text" placeholder="e.g. YQKP2M"
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, letterSpacing: '0.12em', textAlign: 'center', padding: '14px', background: '#f8faf8', border: '2px solid #e2e8e2', borderRadius: 10, color: '#0f2010' }}
                      required />
                  </div>
                  {error && (
                    <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 12px', color: '#dc2626', fontSize: 13 }}>
                      ⚠ {error}
                    </div>
                  )}
                  <button type="submit" disabled={loading}
                    style={{ padding: '14px', background: loading ? '#94a3b8' : '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', width: 16, height: 16 }} />
                          Reading...
                        </span>
                      : '🔍 Read Booking Code'}
                  </button>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '📊', title: 'Real Data', desc: 'BSD + Sofascore stats for every match' },
                  { icon: '🔄', title: 'Smart Replacements', desc: 'Risky picks swapped for safer options' },
                  { icon: '⚡', title: 'Instant Code', desc: 'Fresh SportyBet code in seconds' },
                ].map(item => (
                  <div key={item.title} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #e8ede8', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f0faf0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2010' }}>{item.title}</div>
                      <div style={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Decoded */}
          {step === 'decoded' && slip && (
            <div className="fade-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <button onClick={reset}
                  style={{ background: '#fff', border: '1px solid #e2e8e2', color: '#475569', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                <div style={{ background: '#1a3d1e', borderRadius: 8, padding: '5px 12px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{slip.shareCode}</span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'GAMES', value: slip.games.length, color: '#1a3d1e' },
                  { label: 'ODDS', value: slip.totalOdds, color: '#1a3d1e' },
                  { label: 'SPORT', value: slip.games[0]?.sport || 'Football', color: '#1a3d1e' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '12px', textAlign: 'center', border: '1px solid #e8ede8' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Games */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 12, border: '1px solid #e8ede8' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>ALL GAMES ({slip.games.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {slip.games.map((g, i) => (
                    <div key={g.eventId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px', borderRadius: 9, background: '#f8faf8' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, minWidth: 18, paddingTop: 1 }}>{i + 1}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f2010', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.homeTeam} vs {g.awayTeam}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{g.pick} · {g.market}</div>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#1a3d1e', flexShrink: 0, marginLeft: 8 }}>{g.odds}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consent */}
              <div style={{ background: '#fff', border: '2px solid #1a3d1e', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: '#0f2010' }}>🤔 When I find a risky pick, what should I do?</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>This affects how risky games are handled.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { value: false, icon: '🗑️', title: 'Remove the game', desc: 'Remove risky picks entirely from the slip' },
                    { value: true, icon: '🔄', title: 'Replace with safer pick', desc: 'Swap risky pick for a safer option on same match' },
                  ].map(opt => (
                    <button key={String(opt.value)}
                      onClick={() => setAllowSwitching(opt.value)}
                      style={{
                        padding: '12px 14px', borderRadius: 10, fontSize: 13,
                        textAlign: 'left', cursor: 'pointer',
                        background: allowSwitching === opt.value ? (opt.value ? '#f0faf0' : '#fef2f2') : '#f8faf8',
                        border: allowSwitching === opt.value
                          ? `2px solid ${opt.value ? '#16a34a' : '#dc2626'}`
                          : '1.5px solid #e8ede8',
                        color: '#0f2010',
                      }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>{opt.icon} {opt.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Odds */}
              <div style={{ background: '#fff', border: '2px solid #16a34a', borderRadius: 14, padding: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#0f2010' }}>Set Target Odds</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>AI will aim to land close to your target</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {[5, 20, 50, 100, 500].map(odd => (
                    <button key={odd} onClick={() => setTargetOdds(String(odd))}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, background: targetOdds === String(odd) ? '#1a3d1e' : '#f8faf8', color: targetOdds === String(odd) ? '#fff' : '#475569', border: targetOdds === String(odd) ? '1.5px solid #1a3d1e' : '1.5px solid #e8ede8', cursor: 'pointer' }}>
                      {odd}x
                    </button>
                  ))}
                </div>
                <form onSubmit={handleAnalyse} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input type="number" placeholder="Or type any number e.g. 3000"
                    value={targetOdds} onChange={e => setTargetOdds(e.target.value)}
                    min={1} step="any"
                    style={{ background: '#f8faf8', border: '1.5px solid #e8ede8', borderRadius: 9, padding: '12px 14px', fontSize: 14, color: '#0f2010' }}
                    required />
                  {error && <div style={{ color: '#dc2626', fontSize: 13 }}>⚠ {error}</div>}
                  <button type="submit" disabled={loading || allowSwitching === null}
                    style={{ padding: '14px', background: (loading || allowSwitching === null) ? '#94a3b8' : '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: (loading || allowSwitching === null) ? 'not-allowed' : 'pointer' }}>
                    {loading ? '⏳ Analysing...' : !canAnalyse ? '🔒 Subscribe to Analyse' : freeTrialAvailable ? '🎁 Analyse Free' : '🤖 Analyse & Clean Slip'}
                  </button>
                  {allowSwitching === null && (
                    <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>↑ Choose what to do with risky picks first</div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* STEP 3 — Analysing */}
          {step === 'analysing' && (
            <div className="fade-up" style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: '#1a3d1e', border: '2px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>🤖</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: '#0f2010' }}>Deep Analysis Running</h3>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
                {allowSwitching ? 'Finding safer alternatives...' : 'Identifying bad eggs...'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 260, margin: '0 auto' }}>
                {['Searching BSD database...', 'Checking Sofascore form...', 'Analysing H2H records...', allowSwitching ? 'Finding safer picks...' : 'Targeting desired odds...', 'Building clean slip...'].map(msg => (
                  <div key={msg} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid #e8ede8' }}>
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                    <span style={{ fontSize: 13, color: '#475569' }}>{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 — Results */}
          {step === 'result' && analysis && (
            <div className="fade-up">
              {/* New Code */}
              {newCode ? (
                <div style={{ background: 'linear-gradient(135deg,#1a3d1e,#15803d)', borderRadius: 18, padding: '20px', marginBottom: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.08em', marginBottom: 6 }}>✅ NEW BOOKING CODE</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '0.15em', marginBottom: 14 }}>{newCode}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { navigator.clipboard.writeText(newCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                      style={{ flex: 2, padding: '12px', background: '#fff', color: '#1a3d1e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                      {copied ? '✓ Copied!' : '📋 Copy Code'}
                    </button>
                    <button onClick={reset}
                      style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      New Slip
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid rgba(217,119,6,0.3)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: '#d97706', fontSize: 14, marginBottom: 2 }}>⚠ Auto-booking unavailable</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Load kept games manually on SportyBet.</div>
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Original', value: analysis.originalOdds, color: '#64748b' },
                  { label: 'New Odds', value: analysis.newOdds, color: '#1a3d1e' },
                  { label: 'Kept', value: analysis.keptGames.length, color: '#16a34a' },
                  { label: 'Removed', value: analysis.removedGames.length, color: '#dc2626' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid #e8ede8' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4, letterSpacing: '0.04em' }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Replaced count */}
              {analysis.keptGames.filter(g => g.replaced).length > 0 && (
                <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>🔄</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>
                      {analysis.keptGames.filter(g => g.replaced).length} pick{analysis.keptGames.filter(g => g.replaced).length > 1 ? 's' : ''} swapped for safer options
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Look for the 🔄 badge below</div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 10, border: '1px solid #e8ede8' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{analysis.summary}</p>
              </div>

              {/* Kept Games */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 10, border: '1px solid #e8ede8' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '0.05em', marginBottom: 12 }}>
                  ✅ KEPT GAMES ({analysis.keptGames.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analysis.keptGames.map(g => (
                    <div key={g.eventId} style={{
                      padding: '14px', borderRadius: 12,
                      background: g.replaced ? 'rgba(59,130,246,0.04)' : '#f8faf8',
                      border: `1.5px solid ${g.replaced ? 'rgba(59,130,246,0.2)' : '#e8ede8'}`,
                      position: 'relative',
                    }}>
                      {g.replaced && (
                        <div style={{ position: 'absolute', top: -1, right: 10, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: '0 0 6px 6px', letterSpacing: '0.05em' }}>
                          🔄 PICK CHANGED
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, marginTop: g.replaced ? 8 : 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, flex: 1, paddingRight: 8, color: '#0f2010' }}>
                          {g.homeTeam} vs {g.awayTeam}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: g.replaced ? '#3b82f6' : '#1a3d1e' }}>
                            {g.replaced ? `~${g.replacedOdds}` : g.odds}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: riskBg(g.riskLevel), color: riskColor(g.riskLevel) }}>
                            {g.riskLevel}
                          </span>
                        </div>
                      </div>

                      {/* Pick change */}
                      {g.replaced ? (
                        <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 9, padding: '10px 12px', marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', marginBottom: 6, letterSpacing: '0.04em' }}>PICK CHANGED TO SAFER OPTION</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, padding: '4px 9px', fontSize: 12, color: '#dc2626', textDecoration: 'line-through' }}>
                              {g.originalPick || g.pick} ({g.originalMarket || g.market}) @ {g.originalOdds || g.odds}
                            </div>
                            <span style={{ color: '#94a3b8', fontSize: 14 }}>→</span>
                            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, padding: '4px 9px', fontSize: 12, color: '#3b82f6', fontWeight: 700 }}>
                              {g.replacedPick} ({g.replacedMarketDesc}) @ ~{g.replacedOdds}
                            </div>
                          </div>
                          {g.replacementReason && (
                            <div style={{ fontSize: 11, color: '#6366f1', marginTop: 6, fontStyle: 'italic' }}>💡 {g.replacementReason}</div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                          {g.league} · Pick: <strong style={{ color: '#0f2010' }}>{g.pick}</strong> ({g.market})
                        </div>
                      )}

                      {/* Confidence bar */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>CONFIDENCE</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor(g.confidenceScore) }}>{g.confidenceScore}%</span>
                        </div>
                        <div style={{ height: 4, background: '#f0f4f0', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${g.confidenceScore}%`, background: g.replaced ? 'linear-gradient(90deg,#3b82f6,#6366f1)' : confidenceColor(g.confidenceScore), borderRadius: 2 }} />
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', marginBottom: 4 }}>💡 {g.reason}</div>
                      {g.formSummary && !g.replaced && (
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>📊 {g.formSummary}</div>
                      )}
                      <div>
                        {(() => {
                          const src = dataSourceLabel(g.dataSource)
                          return <span style={{ fontSize: 10, color: src.color, fontWeight: 600 }}>● {src.label}</span>
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Removed Games */}
              {analysis.removedGames.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 14, border: '1px solid #e8ede8' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', letterSpacing: '0.05em', marginBottom: 12 }}>
                    ❌ REMOVED BAD EGGS ({analysis.removedGames.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {analysis.removedGames.map(g => (
                      <div key={g.eventId} style={{ padding: '12px', borderRadius: 10, background: 'rgba(220,38,38,0.03)', border: '1px solid rgba(220,38,38,0.12)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, textDecoration: 'line-through', color: '#94a3b8', flex: 1, paddingRight: 8 }}>{g.homeTeam} vs {g.awayTeam}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#dc2626' }}>{g.odds}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: riskBg(g.riskLevel), color: riskColor(g.riskLevel) }}>{g.riskLevel}</span>
                          </div>
                        </div>

                        <div style={{ marginBottom: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>CONFIDENCE</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor(g.confidenceScore) }}>{g.confidenceScore}%</span>
                          </div>
                          <div style={{ height: 3, background: '#f0f4f0', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${g.confidenceScore}%`, background: confidenceColor(g.confidenceScore), borderRadius: 2 }} />
                          </div>
                        </div>

                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{g.league} · {g.pick}</div>
                        <div style={{ fontSize: 12, color: '#dc2626', fontStyle: 'italic' }}>⚠ {g.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={reset}
                style={{ width: '100%', padding: '14px', background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Analyse Another Slip
              </button>

              <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => router.push('/history')}
                  style={{ width: '100%', padding: '12px', background: '#fff', color: '#1a3d1e', border: '1.5px solid #1a3d1e', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  📋 View Slip History
                </button>
                <a href="https://wa.me/2349075520182" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>
                  💬 Encounter a challenge? Contact Support
                </a>
              </div>
            </div>
          )}
          {/* Bottom Nav */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTop: '1px solid #e8ede8',
          display: 'flex', padding: '10px 0 20px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
          zIndex: 50,
        }}>
          <button
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#1a3d1e', fontSize: 10, fontWeight: 700 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            Analyse
          </button>
          <button onClick={() => router.push('/history')}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            History
          </button>
        </div>
        </main>

        {/* Payment Modal */}
        {showPayment && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f2010', marginBottom: 8 }}>Subscription Required</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>Subscribe to continue analysing slips.</p>
              </div>
              <div style={{ background: '#f0faf0', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 14, padding: '16px', marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Monthly Subscription</div>
                <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 800, color: '#1a3d1e' }}>₦2,500</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>per month · Cancel anytime</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {['✅ Unlimited slip analyses', '✅ AI pick replacement', '✅ Real BSD + Sofascore data', '✅ Fresh booking codes instantly'].map(f => (
                  <div key={f} style={{ fontSize: 13, color: '#475569' }}>{f}</div>
                ))}
              </div>
              <button onClick={handlePayment} disabled={paymentLoading}
                style={{ width: '100%', padding: '14px', background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10, opacity: paymentLoading ? 0.7 : 1 }}>
                {paymentLoading ? 'Redirecting...' : '💳 Subscribe with Paystack'}
              </button>
              <button onClick={() => setShowPayment(false)}
                style={{ width: '100%', padding: '12px', background: 'none', color: '#94a3b8', border: '1px solid #e8ede8', borderRadius: 12, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Free Trial Prompt */}
        {showFreeTrialPrompt && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f2010', marginBottom: 8 }}>Free analysis used!</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Hope the analysis was helpful! Subscribe to keep winning smarter.
              </p>
              <div style={{ background: '#f0faf0', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 14, padding: '14px', marginBottom: 20 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 800, color: '#1a3d1e' }}>₦2,500</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Unlimited analyses · Cancel anytime</div>
              </div>
              <button onClick={() => { setShowFreeTrialPrompt(false); handlePayment() }}
                style={{ width: '100%', padding: '14px', background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
                💳 Subscribe Now
              </button>
              <button onClick={() => setShowFreeTrialPrompt(false)}
                style={{ width: '100%', padding: '12px', background: 'none', color: '#94a3b8', border: '1px solid #e8ede8', borderRadius: 12, fontSize: 13, cursor: 'pointer' }}>
                Maybe later
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

async function resolveReplacementsClientSide(replacedGames: GameAnalysis[]): Promise<GameAnalysis[]> {
  // Browser-side replacement resolution is not available yet.
  // Return the input data so the merge step can continue safely.
  return replacedGames
}
