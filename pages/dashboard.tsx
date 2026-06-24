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
  suggestedPick?: string
  suggestedOdds?: number
  switchSuggestion?: string
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

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUsername(payload.username)
      setIsAdmin(payload.email === 'simeonadigun0@gmail.com')
    } catch { router.push('/') }
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
      if (!data.games?.length) throw new Error('No games found in this booking code')
      setSlip(data)
      setAllowSwitching(null) // reset consent
      setStep('decoded')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to decode')
    } finally { setLoading(false) }
  }

  const handleAnalyse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slip) return
    if (allowSwitching === null) { setError('Please choose what AI should do with risky picks'); return }
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
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysis(data)

      if (data.keptGames?.length > 0) {
        const rebookRes = await fetch('/api/rebook', {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ games: data.keptGames }),
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
        <title>SportyAI</title>
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
              Sporty<span style={{ color: 'var(--accent)' }}>AI</span>
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
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Analyse Your Slip</h2>
                <p style={{ color: 'var(--text2)', fontSize: 14 }}>Paste your SportyBet booking code below</p>
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
                  { icon: '🤖', title: 'Smart Odds Targeting', desc: 'Lands close to your desired odds' },
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

              {/* CONSENT QUESTION */}
              <div style={{ background: '#fff', border: '2px solid var(--navy)', borderRadius: 14, padding: '16px', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: 'var(--navy)' }}>
                  🤔 When i find a risky pick, what should i do?
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.5 }}>
                  This choice affects how the AI handles low-confidence games on your slip.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => setAllowSwitching(false)}
                    style={{
                      padding: '12px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      textAlign: 'left', cursor: 'pointer',
                      background: allowSwitching === false ? 'rgba(220,38,38,0.08)' : 'var(--bg)',
                      border: allowSwitching === false ? '2px solid var(--red)' : '1.5px solid var(--border)',
                      color: 'var(--text)',
                    }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>🗑️ Remove the game</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Remove risky picks entirely from the slip</div>
                  </button>
                  <button
                    onClick={() => setAllowSwitching(true)}
                    style={{
                      padding: '12px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      textAlign: 'left', cursor: 'pointer',
                      background: allowSwitching === true ? 'var(--accent-dim)' : 'var(--bg)',
                      border: allowSwitching === true ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                      color: 'var(--text)',
                    }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>🔄 Suggest a safer pick</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>AI recommends a safer option on the same match</div>
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
                    🤖 Analyse & Clean Slip
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
                {allowSwitching ? 'Finding safer alternatives for risky picks...' : 'Identifying and removing bad eggs...'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 280, margin: '0 auto' }}>
                {['Searching BSD database...', 'Checking Sofascore form...', 'Analysing H2H records...', 'Targeting your desired odds...', 'Building clean slip...'].map(msg => (
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
                    <div key={g.eventId} style={{ padding: '12px', borderRadius: 10, background: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.15)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, flex: 1, paddingRight: 8 }}>{g.homeTeam} vs {g.awayTeam}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{g.odds}</span>
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

                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
                        {g.league} · Pick: <strong style={{ color: 'var(--text2)' }}>{g.pick}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 4 }}>💡 {g.reason}</div>
                      {g.formSummary && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>📊 {g.formSummary}</div>}
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

                        {/* Switch suggestion */}
                        {g.suggestedPick && g.switchSuggestion && (
                          <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
                              🔄 Safer option: {g.suggestedPick} {g.suggestedOdds ? `(~${g.suggestedOdds} odds)` : ''}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{g.switchSuggestion}</div>
                          </div>
                        )}

                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{dataSourceLabel(g.dataSource)}</div>
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
        </main>
      </div>
    </>
  )
}