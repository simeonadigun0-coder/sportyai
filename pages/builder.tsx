import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'

interface AccumulatorPick {
  fixtureId: string
  homeTeam: string
  awayTeam: string
  league: string
  country: string
  matchDate: string
  pick: string
  market: string
  odds: number
  grooveScore: number
  confidence: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  valueEdge: number
  probability: number
  reason: string
  dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL'
}

export default function BuilderPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [picks, setPicks] = useState<AccumulatorPick[]>([])
  const [fixturesScanned, setFixturesScanned] = useState(0)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [dateRange, setDateRange] = useState('today')
  const [activeTier, setActiveTier] = useState<string>('')

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

  const tierFromRisk = (r: 'low' | 'medium' | 'high'): 'SAFE' | 'BALANCED' | 'AGGRESSIVE' =>
    r === 'low' ? 'SAFE' : r === 'high' ? 'AGGRESSIVE' : 'BALANCED'

  const daysAheadFromRange = (r: string): number => {
    if (r === 'tomorrow') return 2
    if (r === 'week') return 7
    if (r === 'month') return 30
    return 1
  }

  const handleBuild = async () => {
    setLoading(true)
    setError('')
    setPicks([])
    setSummary('')
    setActiveTier(riskLevel)

    try {
      const res = await fetch('/api/builder', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          tier: tierFromRisk(riskLevel),
          legs: 0,
          daysAhead: daysAheadFromRange(dateRange),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.requiresSubscription) { setError('Subscribe to access the Builder'); return }
        throw new Error(data.error || 'Failed')
      }
      setPicks(data.picks || [])
      setFixturesScanned(data.fixturesScanned || 0)
      setSummary(data.summary || '')
      if ((data.picks || []).length === 0) {
        setError(data.summary || 'No qualifying games found — try a different risk level or date range.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build accumulator')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAll = () => {
    const lines = picks.map(p => `${p.homeTeam} vs ${p.awayTeam} — ${p.pick} (${p.market})`)
    navigator.clipboard.writeText(lines.join('\n'))
  }

  const scoreColor = (s: number, dq?: string) => {
    if (dq === 'MINIMAL') return '#94a3b8'
    if (s >= 75) return '#16a34a'
    if (s >= 60) return '#d97706'
    return '#dc2626'
  }

  const riskBg   = (r: string) => ({ low: '#f0faf0', medium: '#fefce8', high: '#fef2f2' }[r] || '#f8faf8')
  const riskBorder = (r: string) => ({ low: '#16a34a', medium: '#d97706', high: '#dc2626' }[r] || '#e8ede8')

  const tierLabel = (r: string) => ({ low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' }[r] || '')

  const formatTime = (d: string) => {
    try { return new Date(d).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true }) } catch { return '' }
  }
  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }) } catch { return '' }
  }

  return (
    <>
      <Head>
        <title>Groove Slip — Accumulator Builder</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#f0f4f0', fontFamily: 'Inter, sans-serif' }}>
        <nav style={{ background: '#1a3d1e', padding: '0 16px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/logo.png" alt="Groove Slip" width={28} height={28} style={{ objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Groove <span style={{ color: '#4ade80' }}>Slip</span></span>
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 10px' }}>{username}</span>
        </nav>

        <main style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 100px' }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2010', marginBottom: 2 }}>🏗️ Accumulator Builder</h2>
            <p style={{ color: '#64748b', fontSize: 13 }}>Select a risk level — see all qualifying games with predictions and Groove Score</p>
          </div>

          {/* Settings */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>RISK LEVEL</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { value: 'low',    label: '🛡️ Low Risk',    desc: 'Only the safest picks — Groove Score 72 and above' },
                  { value: 'medium', label: '⚖️ Medium Risk', desc: 'Balanced picks with solid data — Groove Score 65 and above' },
                  { value: 'high',   label: '🎯 High Risk',   desc: 'Wider selection including moderate picks — Groove Score 55 and above' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setRiskLevel(opt.value as 'low' | 'medium' | 'high')}
                    style={{ padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', background: riskLevel === opt.value ? riskBg(opt.value) : '#f8faf8', border: riskLevel === opt.value ? `2px solid ${riskBorder(opt.value)}` : '1.5px solid #e8ede8' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: '#0f2010' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>DATE RANGE</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ value: 'today', label: 'Today' }, { value: 'tomorrow', label: '+Tomorrow' }, { value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' }].map(opt => (
                  <button key={opt.value} onClick={() => setDateRange(opt.value)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, background: dateRange === opt.value ? '#1a3d1e' : '#f8faf8', color: dateRange === opt.value ? '#fff' : '#475569', border: dateRange === opt.value ? '1.5px solid #1a3d1e' : '1.5px solid #e8ede8', cursor: 'pointer' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 12px', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>
            )}

            <button onClick={handleBuild} disabled={loading}
              style={{ width: '100%', padding: 14, background: loading ? '#94a3b8' : '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Scanning fixtures...' : '🏗️ Build My Accumulator'}
            </button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#1a3d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🏗️</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2010', marginBottom: 4 }}>Scanning Fixtures</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>Analysing every match and filtering by {tierLabel(riskLevel)} threshold...</p>
            </div>
          )}

          {picks.length > 0 && !loading && (
            <>
              {/* Stats bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'FIXTURES SCANNED', value: fixturesScanned },
                  { label: `${tierLabel(activeTier).toUpperCase()} PICKS`, value: picks.length, highlight: true },
                  { label: 'AVG GROOVE SCORE', value: Math.round(picks.reduce((a, p) => a + p.grooveScore, 0) / picks.length) },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: s.highlight ? '1.5px solid #1a3d1e' : '1px solid #e8ede8' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: s.highlight ? '#1a3d1e' : '#475569' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {summary && (
                <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, border: '1px solid #e8ede8' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{summary}</p>
                </div>
              )}

              {/* Section header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>
                  ✅ {tierLabel(activeTier).toUpperCase()} PICKS ({picks.length}) — sorted by Groove Score
                </div>
                <button onClick={handleCopyAll}
                  style={{ fontSize: 11, fontWeight: 700, color: '#1a3d1e', background: 'none', border: '1px solid #1a3d1e', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                  📋 Copy All
                </button>
              </div>

              {/* All qualifying picks — flat list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {picks.map((pick, i) => (
                  <div key={i} style={{
                    background: '#fff', borderRadius: 12, padding: '14px 16px',
                    border: '1px solid #e8ede8',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                    {/* Match header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{pick.league} · {pick.country}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f2010' }}>{pick.homeTeam} vs {pick.awayTeam}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{formatDate(pick.matchDate)} · {formatTime(pick.matchDate)}</div>
                      </div>
                      {/* Groove Score badge */}
                      <div style={{
                        textAlign: 'center', flexShrink: 0, marginLeft: 12,
                        background: `${scoreColor(pick.grooveScore, pick.dataQuality)}10`,
                        border: `1.5px solid ${scoreColor(pick.grooveScore, pick.dataQuality)}30`,
                        borderRadius: 10, padding: '6px 12px',
                      }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: scoreColor(pick.grooveScore, pick.dataQuality), lineHeight: 1 }}>
                          {pick.dataQuality === 'MINIMAL' ? '~' : ''}{pick.grooveScore}
                        </div>
                        <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>GROOVE</div>
                      </div>
                    </div>

                    {/* Pick + probability row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8faf8', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>Best Pick: </span>
                        <strong style={{ fontSize: 13, color: '#0f2010' }}>{pick.pick}</strong>
                        <span style={{ fontSize: 11, color: '#64748b' }}> ({pick.market})</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: scoreColor(pick.grooveScore, pick.dataQuality) }}>
                          {pick.probability.toFixed(0)}%
                        </div>
                        <div style={{ fontSize: 9, color: '#94a3b8' }}>PROBABILITY</div>
                      </div>
                    </div>

                    {/* Reason */}
                    {pick.reason && (
                      <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                        💡 {pick.reason}
                        {pick.dataQuality === 'MINIMAL' && (
                          <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: '#94a3b8', background: 'rgba(148,163,184,0.1)', borderRadius: 4, padding: '1px 5px', fontStyle: 'normal' }}>EST</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={handleBuild}
                style={{ width: '100%', marginTop: 14, padding: 12, background: '#fff', color: '#1a3d1e', border: '1.5px solid #1a3d1e', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                🔄 Refresh Analysis
              </button>
            </>
          )}
        </main>

        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e8ede8', display: 'flex', padding: '10px 0 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', zIndex: 50 }}>
          <button onClick={() => router.push('/dashboard')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>⚡</span>Analyse
          </button>
          <button onClick={() => router.push('/value-bets')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>💎</span>Value Bets
          </button>
          <button style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#1a3d1e', fontSize: 10, fontWeight: 700 }}>
            <span style={{ fontSize: 20 }}>🏗️</span>Builder
          </button>
          <button onClick={() => router.push('/profile')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <span style={{ fontSize: 20 }}>👤</span>Profile
          </button>
        </div>
      </div>
    </>
  )
}