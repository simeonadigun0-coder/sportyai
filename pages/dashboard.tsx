import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import ProfileCard from '@/components/ProfileCard'
import { UpgradePrompt } from '@/components/UpgradePrompt'

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
  const [slip, setSlip] = useState<{ shareCode: string; totalOdds: number; games: Game[] } | null>(null)
  const [analysis, setAnalysis] = useState<SlipAnalysis | null>(null)
  const [newCode, setNewCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showFreeTrialPrompt, setShowFreeTrialPrompt] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUsername(payload.username)
      const adminEmail = 'simeonadigun0@gmail.com'
      setIsAdmin(payload.email === adminEmail)
      if (payload.email === adminEmail) setSubscriptionActive(true)
    } catch { router.push('/'); return }

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

  const handleProFeature = (path: string) => {
    const tier = localStorage.getItem('subscriptionTier')
    if (tier === 'basic') {
      setShowUpgradePrompt(true)
      return
    }
    router.push(path)
  }

  const handleSubscribe = async (tier: 'basic' | 'pro') => {
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.authorizationUrl) window.location.href = data.authorizationUrl
    } catch {}
  }

  const handleDecode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to decode')
      if (!data.games?.length) throw new Error('No games found')
      setSlip(data)
      setStep('decoded')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to decode')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slip) return

    const freeTrialAvailable = !freeAnalysisUsed && !isAdmin
    const canAnalyse = subscriptionActive || isAdmin || freeTrialAvailable
    if (!canAnalyse) { setShowPayment(true); return }

    const target = parseFloat(targetOdds)
    if (!target || target < 1) { setError('Enter valid target odds'); return }

    setLoading(true)
    setError('')
    setStep('analysing')

    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          games: slip.games,
          targetOdds: target,
          originalTotalOdds: slip.totalOdds,
          allowSwitching: false,
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

      let rebookCode = ''
      if (data.keptGames?.length > 0) {
        const rebookRes = await fetch('/api/rebook', {
          method: 'POST',
          headers: authHeaders(),
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
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setPaymentLoading(true)
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ tier: 'pro' }),
      })
      const data = await res.json()
      if (data.authorizationUrl) window.location.href = data.authorizationUrl
    } catch {
      setError('Failed to initialize payment')
    } finally {
      setPaymentLoading(false)
    }
  }

  const reset = () => {
    setStep('input')
    setCode('')
    setTargetOdds('')
    setSlip(null)
    setAnalysis(null)
    setNewCode('')
    setError('')
    setCopied(false)
  }

  const logout = async () => {
    await fetch('/api/auth/logout')
    localStorage.removeItem('token')
    localStorage.removeItem('subscriptionExpiry')
    localStorage.removeItem('subscriptionWaived')
    localStorage.removeItem('subscriptionTier')
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
        <nav style={{ background: '#1a3d1e', padding: '0 16px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
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
                Subscribe
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

        {/* Banners */}
        {!canAnalyse && (
          <div style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', padding: '10px 16px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>🔒 Subscribe to keep analysing slips</span>
            <button onClick={() => setShowPayment(true)}
              style={{ background: '#fff', color: '#15803d', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ₦2,500/month
            </button>
          </div>
        )}

        {freeTrialAvailable && (
          <div style={{ background: 'rgba(22,163,74,0.08)', borderBottom: '1px solid rgba(22,163,74,0.15)', padding: '8px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>🎁 You have 1 free analysis remaining — try it now!</span>
          </div>
        )}

        <main style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 100px' }}>

          {/* Profile Card — always visible */}
          <ProfileCard onSubscribe={handleSubscribe} />

          {/* STEP 1 — Input */}
          {step === 'input' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 2, color: '#0f2010' }}>Analyse Your Slip</h2>
                <p style={{ color: '#64748b', fontSize: 13 }}>Paste your SportyBet booking code</p>
              </div>

              <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                <form onSubmit={handleDecode} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>BOOKING CODE</label>
                    <input type="text" placeholder="e.g. YQKP2M"
                      value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                      style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, letterSpacing: '0.12em', textAlign: 'center', padding: 14, background: '#f8faf8', border: '2px solid #e2e8e2', borderRadius: 10, color: '#0f2010', width: '100%', boxSizing: 'border-box' }}
                      required />
                  </div>
                  {error && (
                    <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 12px', color: '#dc2626', fontSize: 13 }}>⚠ {error}</div>
                  )}
                  <button type="submit" disabled={loading}
                    style={{ padding: 14, background: loading ? '#94a3b8' : '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? '⏳ Reading...' : '🔍 Read Booking Code'}
                  </button>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '📊', title: 'Real Data', desc: 'BSD + Sofascore stats for every match' },
                  { icon: '🗑️', title: 'Smart Removal', desc: 'Risky picks removed based on real form and H2H' },
                  { icon: '⚡', title: 'Instant Code', desc: 'Fresh SportyBet booking code in seconds' },
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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <button onClick={reset}
                  style={{ background: '#fff', border: '1px solid #e2e8e2', color: '#475569', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  ← Back
                </button>
                <div style={{ background: '#1a3d1e', borderRadius: 8, padding: '5px 12px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{slip.shareCode}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'GAMES', value: slip.games.length },
                  { label: 'ODDS', value: slip.totalOdds },
                  { label: 'SPORT', value: slip.games[0]?.sport || 'Football' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e8ede8' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#1a3d1e' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e8ede8' }}>
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

              <div style={{ background: '#f0faf0', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#1a3d1e', fontWeight: 600 }}>
                  🗑️ Bad picks will be removed based on real match data
                </div>
              </div>

              <div style={{ background: '#fff', border: '2px solid #16a34a', borderRadius: 14, padding: 16 }}>
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
                    style={{ background: '#f8faf8', border: '1.5px solid #e8ede8', borderRadius: 9, padding: '12px 14px', fontSize: 14, color: '#0f2010', width: '100%', boxSizing: 'border-box' }}
                    required />
                  {error && <div style={{ color: '#dc2626', fontSize: 13 }}>⚠ {error}</div>}
                  <button type="submit" disabled={loading}
                    style={{ padding: 14, background: loading ? '#94a3b8' : '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? '⏳ Analysing...' : !canAnalyse ? '🔒 Subscribe to Analyse' : freeTrialAvailable ? '🎁 Analyse Free' : '🤖 Analyse & Clean Slip'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 3 — Analysing */}
          {step === 'analysing' && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: '#1a3d1e', border: '2px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>🤖</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: '#0f2010' }}>Deep Analysis Running</h3>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Identifying bad eggs and cleaning your slip...</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 260, margin: '0 auto' }}>
                {['Searching BSD database...', 'Checking Sofascore form...', 'Analysing H2H records...', 'Targeting desired odds...', 'Building clean slip...'].map(msg => (
                  <div key={msg} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid #e8ede8' }}>
                    <span style={{ fontSize: 13, color: '#475569' }}>⏳ {msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 — Results */}
          {step === 'result' && analysis && (
            <div>
              {newCode ? (
                <div style={{ background: 'linear-gradient(135deg,#1a3d1e,#15803d)', borderRadius: 18, padding: 20, marginBottom: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.08em', marginBottom: 6 }}>✅ NEW BOOKING CODE</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '0.15em', marginBottom: 14 }}>{newCode}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { navigator.clipboard.writeText(newCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                      style={{ flex: 2, padding: 12, background: '#fff', color: '#1a3d1e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                      {copied ? '✓ Copied!' : '📋 Copy Code'}
                    </button>
                    <button onClick={reset}
                      style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'ORIGINAL', value: analysis.originalOdds, color: '#64748b' },
                  { label: 'NEW ODDS', value: analysis.newOdds, color: '#1a3d1e' },
                  { label: 'KEPT', value: analysis.keptGames.length, color: '#16a34a' },
                  { label: 'REMOVED', value: analysis.removedGames.length, color: '#dc2626' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid #e8ede8' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 10, border: '1px solid #e8ede8' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{analysis.summary}</p>
              </div>

              {/* Kept Games */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid #e8ede8' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '0.05em', marginBottom: 12 }}>✅ KEPT GAMES ({analysis.keptGames.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analysis.keptGames.map(g => (
                    <div key={g.eventId} style={{ padding: 14, borderRadius: 12, background: '#f8faf8', border: '1.5px solid #e8ede8', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, flex: 1, paddingRight: 8, color: '#0f2010' }}>{g.homeTeam} vs {g.awayTeam}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#1a3d1e' }}>{g.odds}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: riskBg(g.riskLevel), color: riskColor(g.riskLevel) }}>{g.riskLevel}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{g.league} · Pick: <strong style={{ color: '#0f2010' }}>{g.pick}</strong> ({g.market})</div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>CONFIDENCE</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor(g.confidenceScore) }}>{g.confidenceScore}%</span>
                        </div>
                        <div style={{ height: 4, background: '#f0f4f0', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${g.confidenceScore}%`, background: confidenceColor(g.confidenceScore), borderRadius: 2 }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', marginBottom: 4 }}>💡 {g.reason}</div>
                      {g.formSummary && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>📊 {g.formSummary}</div>}
                      {(() => { const src = dataSourceLabel(g.dataSource); return <span style={{ fontSize: 10, color: src.color, fontWeight: 600 }}>● {src.label}</span> })()}
                    </div>
                  ))}
                </div>
              </div>

              {/* Removed Games */}
              {analysis.removedGames.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, border: '1px solid #e8ede8' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', letterSpacing: '0.05em', marginBottom: 12 }}>❌ REMOVED BAD EGGS ({analysis.removedGames.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {analysis.removedGames.map(g => (
                      <div key={g.eventId} style={{ padding: 12, borderRadius: 10, background: 'rgba(220,38,38,0.03)', border: '1px solid rgba(220,38,38,0.12)' }}>
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
                          <div style={{ height: 3, background: '#f0f4f0', borderRadius: 2 }}>
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
                style={{ width: '100%', padding: 14, background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>
                Analyse Another Slip
              </button>

              <div style={{ textAlign: 'center' }}>
                <a href="https://wa.me/2349075520182" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>
                  💬 Encounter a challenge? Contact Support
                </a>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Nav */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e8ede8', display: 'flex', padding: '10px 0 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', zIndex: 50 }}>
          <button style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#1a3d1e', fontSize: 10, fontWeight: 700 }}>
            <span style={{ fontSize: 20 }}>⚡</span>Analyse
          </button>
          <button onClick={() => handleProFeature('/value-bets')}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>💎</span>Value Bets
          </button>
          <button onClick={() => handleProFeature('/builder')}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>🏗️</span>Builder
          </button>
        </div>

        {/* Payment Modal */}
        {showPayment && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f2010', marginBottom: 8 }}>Subscribe to Groove Slip</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>Choose a plan to continue.</p>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, background: '#f0f4f0', borderRadius: 14, padding: 16, textAlign: 'center', border: '1.5px solid #e8ede8' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Basic</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: '#2563eb' }}>₦1,500</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>/month</div>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>Slip Editor only</div>
                  <button onClick={() => { setShowPayment(false); handleSubscribe('basic') }}
                    style={{ width: '100%', padding: '9px 0', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Get Basic
                  </button>
                </div>
                <div style={{ flex: 1, background: '#f0faf0', borderRadius: 14, padding: 16, textAlign: 'center', border: '2px solid #16a34a' }}>
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>Pro ⭐</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: '#1a3d1e' }}>₦2,500</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>/month</div>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>Everything included</div>
                  <button onClick={() => { setShowPayment(false); handleSubscribe('pro') }}
                    style={{ width: '100%', padding: '9px 0', background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Get Pro
                  </button>
                </div>
              </div>
              <button onClick={() => setShowPayment(false)}
                style={{ width: '100%', padding: 12, background: 'none', color: '#94a3b8', border: '1px solid #e8ede8', borderRadius: 12, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Free Trial Used Prompt */}
        {showFreeTrialPrompt && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f2010', marginBottom: 8 }}>Free analysis used!</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>Hope the analysis was helpful! Subscribe to keep winning smarter.</p>
              <button onClick={() => { setShowFreeTrialPrompt(false); setShowPayment(true) }}
                style={{ width: '100%', padding: 14, background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
                💳 Subscribe Now
              </button>
              <button onClick={() => setShowFreeTrialPrompt(false)}
                style={{ width: '100%', padding: 12, background: 'none', color: '#94a3b8', border: '1px solid #e8ede8', borderRadius: 12, fontSize: 13, cursor: 'pointer' }}>
                Maybe later
              </button>
            </div>
          </div>
        )}

        {/* Upgrade Prompt for Basic users */}
        {showUpgradePrompt && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%' }}>
              <UpgradePrompt
                feature="Daily Banker & Accumulator Builder"
                onUpgrade={() => { setShowUpgradePrompt(false); handleSubscribe('pro') }}
                onClose={() => setShowUpgradePrompt(false)}
              />
            </div>
          </div>
        )}

      </div>
    </>
  )
}