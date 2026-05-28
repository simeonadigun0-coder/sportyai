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
  league: string
  kickoffTime: string
  sport: string
}

interface SlipAnalysis {
  games: Array<Game & {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    riskScore: number
    reason: string
    keep: boolean
  }>
  removedGames: Array<Game & { riskLevel: string; riskScore: number; reason: string; keep: boolean }>
  keptGames: Array<Game & { riskLevel: string; riskScore: number; reason: string; keep: boolean }>
  originalOdds: number
  newOdds: number
  targetOdds: number
  summary: string
}

type Step = 'input' | 'decoded' | 'analysing' | 'result'

export default function Dashboard() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [code, setCode] = useState('')
  const [targetOdds, setTargetOdds] = useState('')
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
    } catch { router.push('/') }
  }, [router])

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  const parseSlipFromRaw = (raw: string) => {
    const data = JSON.parse(raw)
    const outcomes = data?.data?.outcomes || []
    const selections = data?.data?.ticket?.selections || []
    const displayTotalOdds = parseFloat(data?.data?.ticket?.displayTotalOdds || '1')
    const shareCode = data?.data?.shareCode || ''

    const games: Game[] = outcomes.map((item: Record<string, unknown>, index: number) => {
      const sel = (selections[index] || {}) as Record<string, unknown>
      const sport = item.sport as Record<string, unknown>
      const sportName = (sport?.name as string) || 'Football'
      const category = sport?.category as Record<string, unknown>
      const tournament = category?.tournament as Record<string, unknown>
      const league = (tournament?.name as string) || ''
      const markets = (item.markets as unknown[]) || []
      let odds = 1
      let pick = ''
      let market = '1X2'

      if (markets.length > 0) {
        const firstMarket = markets[0] as Record<string, unknown>
        market = (firstMarket.desc as string) || '1X2'
        const outs = (firstMarket.outcomes as unknown[]) || []
        const outcomeId = sel.outcomeId as string
        const matched = outs.find((o: unknown) => {
          const oc = o as Record<string, unknown>
          return String(oc.id) === String(outcomeId)
        }) as Record<string, unknown> | undefined

        if (matched) {
          odds = parseFloat(String(matched.odds || 1))
          pick = (matched.desc as string) || ''
        } else if (outs.length > 0) {
          const first = outs[0] as Record<string, unknown>
          odds = parseFloat(String(first.odds || 1))
          pick = (first.desc as string) || ''
        }
      }

      return {
        eventId: String(item.eventId || index),
        homeTeam: (item.homeTeamName as string) || 'Home',
        awayTeam: (item.awayTeamName as string) || 'Away',
        market,
        pick,
        odds,
        kickoffTime: String(item.estimateStartTime || ''),
        league,
        sport: sportName,
      }
    })

    return { shareCode, totalOdds: displayTotalOdds, games }
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
      
      const parsed = parseSlipFromRaw(data.rawResponse)
      if (!parsed.games.length) throw new Error('No games found in this booking code')
      setSlip(parsed)
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
    const target = parseFloat(targetOdds)
    if (!target || target < 1) { setError('Enter valid target odds'); return }
    setLoading(true)
    setError('')
    setStep('analysing')
    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ games: slip.games, targetOdds: target, originalTotalOdds: slip.totalOdds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysis(data)

      if (data.keptGames?.length > 0) {
        const rebookRes = await fetch('/api/rebook', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ games: data.keptGames }),
        })
        const rebookData = await rebookRes.json()
        if (rebookRes.ok && rebookData.code) setNewCode(rebookData.code)
      }
      setStep('result')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStep('decoded')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('input'); setCode(''); setTargetOdds('')
    setSlip(null); setAnalysis(null); setNewCode(''); setError(''); setCopied(false)
  }

  const logout = async () => {
    await fetch('/api/auth/logout')
    localStorage.removeItem('token')
    router.push('/')
  }

  return (
    <>
      <Head><title>SportyAI Dashboard</title></Head>
      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <nav style={{
          borderBottom: '1px solid var(--border)', padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,10,0.8)', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>
            Sporty<span style={{ color: 'var(--accent)' }}>AI</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--text2)', fontSize: 13 }}>
              👤 <span style={{ color: 'var(--accent)' }}>{username}</span>
            </span>
            <button className="btn-secondary" onClick={logout} style={{ padding: '6px 14px', fontSize: 12 }}>Logout</button>
          </div>
        </nav>

        <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>

          {step === 'input' && (
            <div className="fade-up">
              <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Analyse Your Bet Slip</h2>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
                Paste your SportyBet booking code. AI will read the games and remove the bad eggs.
              </p>
              <div className="card">
                <form onSubmit={handleDecode} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                      SPORTYBET BOOKING CODE
                    </label>
                    <input type="text" placeholder="e.g. YQKP2M" value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, letterSpacing: '0.1em', textAlign: 'center' }}
                      required />
                  </div>
                  {error && (
                    <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>
                      ⚠ {error}
                    </div>
                  )}
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span className="spinner" />Reading games...</span>
                      : '🔍 Read Booking Code →'}
                  </button>
                </form>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 24 }}>
                {[
                  { icon: '📋', title: 'Paste Code', desc: 'Enter your SportyBet booking code' },
                  { icon: '🤖', title: 'AI Analyses', desc: 'Groq AI identifies the risky picks' },
                  { icon: '🎯', title: 'Get New Code', desc: 'Get a fresh code with safer odds' },
                ].map(item => (
                  <div key={item.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'decoded' && slip && (
            <div className="fade-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button onClick={reset} style={{ background: 'none', color: 'var(--text2)', fontSize: 13 }}>← New Code</button>
                <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
                <span style={{ color: 'var(--text2)', fontSize: 13 }}>
                  Code: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>{slip.shareCode}</span>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'TOTAL GAMES', value: slip.games.length },
                  { label: 'TOTAL ODDS', value: slip.totalOdds },
                  { label: 'SPORT', value: slip.games[0]?.sport || 'Football' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.05em', marginBottom: 14 }}>ALL GAMES IN SLIP</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {slip.games.map((g, i) => (
                    <div key={g.eventId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', minWidth: 20 }}>{i + 1}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{g.homeTeam} <span style={{ color: 'var(--text3)' }}>vs</span> {g.awayTeam}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{g.league} · {g.pick} · {g.market}</div>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{g.odds}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ border: '1px solid var(--accent)', background: 'var(--accent-dim)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Set Your Target Odds</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>AI will remove the riskiest games to reach your target.</p>
                <form onSubmit={handleAnalyse} style={{ display: 'flex', gap: 10 }}>
                  <input type="number" placeholder="e.g. 100" value={targetOdds}
                    onChange={e => setTargetOdds(e.target.value)} min={1} step="any"
                    style={{ background: 'var(--surface)', flex: 1 }} required />
                  <button type="submit" className="btn-primary" disabled={loading}
                    style={{ width: 'auto', whiteSpace: 'nowrap', padding: '12px 20px' }}>
                    🤖 Analyse & Clean
                  </button>
                </form>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {[5, 20, 50, 100, 500].map(odd => (
                    <button key={odd} onClick={() => setTargetOdds(String(odd))}
                      style={{ background: targetOdds === String(odd) ? 'var(--accent)' : 'var(--surface2)', color: targetOdds === String(odd) ? '#041a08' : 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {odd}x
                    </button>
                  ))}
                </div>
                {error && <div style={{ marginTop: 12, color: '#f87171', fontSize: 13 }}>⚠ {error}</div>}
              </div>
            </div>
          )}

          {step === 'analysing' && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 20 }}>🤖</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>AI is Analysing Your Slip</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>Groq AI is reading each game and identifying the bad eggs...</p>
            </div>
          )}

          {step === 'result' && analysis && (
            <div className="fade-up">
              {newCode ? (
                <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.08))', border: '1px solid var(--accent)', borderRadius: 14, padding: '20px 24px', marginBottom: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 8 }}>✅ NEW SPORTYBET BOOKING CODE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: 12 }}>{newCode}</div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button onClick={() => { navigator.clipboard.writeText(newCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                      className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>
                      {copied ? '✓ Copied!' : '📋 Copy Code'}
                    </button>
                    <button onClick={reset} className="btn-secondary">New Slip</button>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--yellow-dim)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>⚠ Auto-booking unavailable</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>Load the kept games manually on SportyBet.</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'ORIGINAL ODDS', value: analysis.originalOdds, color: 'var(--text)' },
                  { label: 'NEW ODDS', value: analysis.newOdds, color: 'var(--accent)' },
                  { label: 'GAMES KEPT', value: analysis.keptGames.length, color: 'var(--accent)' },
                  { label: 'REMOVED', value: analysis.removedGames.length, color: 'var(--red)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{analysis.summary}</p>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: 14 }}>
                  ✅ KEPT GAMES ({analysis.keptGames.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analysis.keptGames.map(g => (
                    <div key={g.eventId} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{g.homeTeam} vs {g.awayTeam}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{g.league} · Pick: <strong style={{ color: 'var(--text2)' }}>{g.pick}</strong></div>
                          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, fontStyle: 'italic' }}>💡 {g.reason}</div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: 12 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>{g.odds}</span>
                          <div style={{ marginTop: 4 }}>
                            <span className={`tag tag-${g.riskLevel.toLowerCase()}`}>{g.riskLevel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {analysis.removedGames.length > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', letterSpacing: '0.05em', marginBottom: 14 }}>
                    ❌ REMOVED BAD EGGS ({analysis.removedGames.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {analysis.removedGames.map(g => (
                      <div key={g.eventId} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', opacity: 0.8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, textDecoration: 'line-through', color: 'var(--text2)' }}>{g.homeTeam} vs {g.awayTeam}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{g.league} · Pick: {g.pick}</div>
                            <div style={{ fontSize: 11, color: '#f87171', marginTop: 4, fontStyle: 'italic' }}>⚠ {g.reason}</div>
                          </div>
                          <div style={{ textAlign: 'right', marginLeft: 12 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--red)' }}>{g.odds}</span>
                            <div style={{ marginTop: 4 }}>
                              <span className={`tag tag-${g.riskLevel.toLowerCase()}`}>{g.riskLevel}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button onClick={reset} className="btn-secondary" style={{ padding: '12px 32px' }}>
                  Analyse Another Slip
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}