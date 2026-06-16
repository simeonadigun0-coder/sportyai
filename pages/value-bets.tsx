import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'

interface ValueBet {
  homeTeam: string
  awayTeam: string
  league: string
  startTime: string
  pick: string
  market: string
  odds: number
  realProbability: number
  impliedProbability: number
  edge: number
  predictionResult: string
  stats: string
  confidence: number
}

export default function ValueBetsPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [valueBets, setValueBets] = useState<ValueBet[]>([])
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('today')
  const [fixturesAnalysed, setFixturesAnalysed] = useState(0)
  const [maxBets, setMaxBets] = useState(5)

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

  const handleFind = async () => {
    setLoading(true)
    setError('')
    setValueBets([])
    setSummary('')

    const today = new Date().toISOString().split('T')[0]
    let dateTo = today
    if (dateRange === 'tomorrow') {
      const t = new Date(); t.setDate(t.getDate() + 1)
      dateTo = t.toISOString().split('T')[0]
    } else if (dateRange === 'week') {
      const t = new Date(); t.setDate(t.getDate() + 7)
      dateTo = t.toISOString().split('T')[0]
    }

    try {
      const res = await fetch('/api/value-bets', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ dateFrom: today, dateTo, maxBets }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setValueBets(data.valueBets || [])
      setSummary(data.summary || '')
      setFixturesAnalysed(data.fixturesAnalysed || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find value bets')
    } finally {
      setLoading(false)
    }
  }

  const edgeColor = (edge: number) => edge >= 15 ? '#16a34a' : edge >= 10 ? '#d97706' : '#3b82f6'
  const confColor = (c: number) => c >= 75 ? '#16a34a' : c >= 60 ? '#d97706' : '#dc2626'

  return (
    <>
      <Head>
        <title>Groove Slip — Value Bets</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#f0f4f0', fontFamily: 'Inter, sans-serif' }}>
        {/* NAV */}
        <nav style={{ background: '#1a3d1e', padding: '0 16px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/logo.png" alt="Groove Slip" width={28} height={28} style={{ objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Groove <span style={{ color: '#4ade80' }}>Slip</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isAdmin && (
              <button onClick={() => router.push('/admin')} style={{ background: 'rgba(255,255,255,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>⚙ Admin</button>
            )}
            <span style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 10px' }}>{username}</span>
          </div>
        </nav>

        <main style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 100px' }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 2, color: '#0f2010' }}>💎 Value Bet Finder</h2>
            <p style={{ color: '#64748b', fontSize: 13 }}>Games where the real probability beats the bookmaker odds</p>
          </div>

          {/* Controls */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>DATE RANGE</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { value: 'today', label: 'Today' },
                  { value: 'tomorrow', label: '+Tomorrow' },
                  { value: 'week', label: 'This Week' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setDateRange(opt.value)}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, background: dateRange === opt.value ? '#1a3d1e' : '#f8faf8', color: dateRange === opt.value ? '#fff' : '#475569', border: dateRange === opt.value ? '1.5px solid #1a3d1e' : '1.5px solid #e8ede8', cursor: 'pointer' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>MAX VALUE BETS TO SHOW</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[3, 5, 8, 10].map(n => (
                  <button key={n} onClick={() => setMaxBets(n)}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, background: maxBets === n ? '#1a3d1e' : '#f8faf8', color: maxBets === n ? '#fff' : '#475569', border: maxBets === n ? '1.5px solid #1a3d1e' : '1.5px solid #e8ede8', cursor: 'pointer' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 12px', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>
                ⚠ {error}
              </div>
            )}

            <button onClick={handleFind} disabled={loading}
              style={{ width: '100%', padding: 14, background: loading ? '#94a3b8' : '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '🔍 Scanning fixtures...' : '💎 Find Value Bets'}
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#1a3d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>💎</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2010', marginBottom: 4 }}>Scanning Today's Fixtures</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>Comparing bookmaker odds vs real probabilities...</p>
            </div>
          )}

          {/* Summary */}
          {summary && !loading && (
            <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 10, border: '1px solid #e8ede8' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{summary}</p>
            </div>
          )}

          {/* Stats */}
          {fixturesAnalysed > 0 && !loading && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid #e8ede8' }}>
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>SCANNED</div>
                <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#1a3d1e' }}>{fixturesAnalysed}</div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid #e8ede8' }}>
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>VALUE BETS</div>
                <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{valueBets.length}</div>
              </div>
            </div>
          )}

          {/* Value Bets */}
          {valueBets.length > 0 && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1a3d1e', letterSpacing: '0.05em' }}>💎 VALUE BETS ({valueBets.length})</div>
              {valueBets.map((bet, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 16, border: '2px solid rgba(22,163,74,0.2)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                  {/* Edge badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0f2010' }}>{bet.homeTeam} vs {bet.awayTeam}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{bet.league}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 20, color: '#1a3d1e' }}>{bet.odds}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: `${edgeColor(bet.edge)}15`, color: edgeColor(bet.edge), marginTop: 2 }}>
                        +{bet.edge}% EDGE
                      </div>
                    </div>
                  </div>

                  {/* Pick */}
                  <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 9, padding: '10px 12px', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', marginBottom: 4, letterSpacing: '0.04em' }}>RECOMMENDED PICK</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#0f2010' }}>{bet.pick} <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>({bet.market})</span></div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                      <div style={{ fontSize: 11, color: '#475569' }}>
                        Real probability: <strong style={{ color: '#16a34a' }}>{bet.realProbability}%</strong>
                      </div>
                      <div style={{ fontSize: 11, color: '#475569' }}>
                        Bookie says: <strong style={{ color: '#dc2626' }}>{bet.impliedProbability}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>CONFIDENCE</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: confColor(bet.confidence) }}>{bet.confidence}%</span>
                    </div>
                    <div style={{ height: 4, background: '#f0f4f0', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${bet.confidence}%`, background: confColor(bet.confidence), borderRadius: 2 }} />
                    </div>
                  </div>

                  {/* Stats */}
                  {bet.stats && (
                    <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>📊 {bet.stats.split('|')[0]}</div>
                  )}

                  {/* Kickoff */}
                  {bet.startTime && (
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                      🕐 {new Date(bet.startTime).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && fixturesAnalysed > 0 && valueBets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e8ede8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2010', marginBottom: 4 }}>No value bets found</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>Bookmaker odds are accurate today. Try a wider date range.</p>
            </div>
          )}
        </main>

        {/* Bottom Nav */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e8ede8', display: 'flex', padding: '10px 0 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', zIndex: 50 }}>
          <button onClick={() => router.push('/dashboard')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>⚡</span>Analyse
          </button>
          <button style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#1a3d1e', fontSize: 10, fontWeight: 700 }}>
            <span style={{ fontSize: 20 }}>💎</span>Value Bets
          </button>
          <button onClick={() => router.push('/builder')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>🏗️</span>Builder
          </button>
          <button onClick={() => router.push('/history')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>📋</span>History
          </button>
        </div>
      </div>
    </>
  )
}