import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'

interface AccumulatorLeg {
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
  reason: string
}

interface Accumulator {
  id: string
  legs: AccumulatorLeg[]
  totalOdds: number
  avgGrooveScore: number
  avgConfidence: number
  riskTier: string
  legsCount: number
  potentialReturn: number
  summary: string
}

export default function BuilderPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [accumulators, setAccumulators] = useState<Accumulator[]>([])
  const [fixturesScanned, setFixturesScanned] = useState(0)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [dateRange, setDateRange] = useState('today')

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
    setAccumulators([])
    setSummary('')

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
      setAccumulators(data.accumulators || [])
      setFixturesScanned(data.fixturesScanned || 0)
      setSummary(data.summary || '')
      if ((data.accumulators || []).length === 0) {
        setError(data.summary || 'No accumulators could be built — try a different risk level or date range.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build accumulator')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (acc: Accumulator) => {
    const lines = acc.legs.map(l => `${l.homeTeam} vs ${l.awayTeam} — ${l.pick} (${l.market})`)
    navigator.clipboard.writeText(lines.join('\n'))
  }

  const scoreColor = (s: number) => s >= 75 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626'
  const riskBg = (r: string) => ({ low: '#f0faf0', medium: '#fefce8', high: '#fef2f2' }[r] || '#f8faf8')
  const riskBorder = (r: string) => ({ low: '#16a34a', medium: '#d97706', high: '#dc2626' }[r] || '#e8ede8')

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
            <p style={{ color: '#64748b', fontSize: 13 }}>Pick a risk level — AI builds the best slip from upcoming fixtures using real Groove Score data</p>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>RISK LEVEL</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { value: 'low', label: '🛡️ Low Risk', desc: 'Safe picks — strong favourites, highest Groove Score threshold' },
                  { value: 'medium', label: '⚖️ Medium Risk', desc: 'Balanced picks — data-backed, moderate threshold' },
                  { value: 'high', label: '🎯 High Risk', desc: 'Bigger combinations — broader picks based on form/H2H' },
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
              {loading ? '⏳ Building your slip...' : '🏗️ Build My Accumulator'}
            </button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#1a3d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🏗️</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2010', marginBottom: 4 }}>Building Your Accumulator</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>Analysing fixtures with real form and H2H data...</p>
            </div>
          )}

          {accumulators.length > 0 && !loading && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
                <div style={{ background: '#fff', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid #e8ede8' }}>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>OPTIONS BUILT</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: '#1a3d1e' }}>{accumulators.length}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid #e8ede8' }}>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>FIXTURES SCANNED</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: '#1a3d1e' }}>{fixturesScanned}</div>
                </div>
              </div>

              {summary && (
                <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, border: '1px solid #e8ede8' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{summary}</p>
                </div>
              )}

              {accumulators.map((acc) => (
                <div key={acc.id} style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e8ede8', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a3d1e', letterSpacing: '0.05em' }}>
                        {acc.legsCount}-LEG {acc.riskTier}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Est. return on ₦1,000: ₦{acc.potentialReturn.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: scoreColor(acc.avgGrooveScore) }}>{acc.avgGrooveScore}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>GROOVE SCORE</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                    {acc.legs.map((g, i) => (
                      <div key={i} style={{ padding: 12, borderRadius: 10, background: '#f8faf8', border: '1px solid #e8ede8' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2010' }}>{g.homeTeam} vs {g.awayTeam}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{g.league}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: scoreColor(g.grooveScore) }}>{g.grooveScore}</div>
                            <div style={{ fontSize: 9, color: '#94a3b8' }}>SCORE</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>Pick: <strong style={{ color: '#0f2010' }}>{g.pick}</strong> ({g.market})</div>
                        <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>💡 {g.reason}</div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => handleCopy(acc)} style={{ width: '100%', padding: 10, background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    📋 Copy This Slip
                  </button>
                </div>
              ))}

              <button onClick={handleBuild} style={{ width: '100%', marginTop: 4, padding: 12, background: '#fff', color: '#1a3d1e', border: '1.5px solid #1a3d1e', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                🔄 Rebuild with Same Settings
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