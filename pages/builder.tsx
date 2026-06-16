import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'

interface BuilderGame {
  eventId: string
  homeTeam: string
  awayTeam: string
  league: string
  pick: string
  market: string
  odds: number
  confidence: number
  reason: string
  homeForm: string
  awayForm: string
  kickoffTime: string
}

export default function BuilderPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [games, setGames] = useState<BuilderGame[]>([])
  const [bookingCode, setBookingCode] = useState('')
  const [totalOdds, setTotalOdds] = useState(0)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [targetOdds, setTargetOdds] = useState('10')
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

  const handleBuild = async () => {
    const target = parseFloat(targetOdds)
    if (!target || target < 1.5) { setError('Enter a valid target odds (minimum 1.5)'); return }
    setLoading(true)
    setError('')
    setGames([])
    setBookingCode('')
    setSummary('')

    try {
      const res = await fetch('/api/builder', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ targetOdds: target, riskLevel, dateRange }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setGames(data.games || [])
      setBookingCode(data.bookingCode || '')
      setTotalOdds(data.totalOdds || 0)
      setSummary(data.summary || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build accumulator')
    } finally {
      setLoading(false)
    }
  }

  const confColor = (c: number) => c >= 75 ? '#16a34a' : c >= 60 ? '#d97706' : '#dc2626'
  const riskBg = (r: string) => ({ low: '#f0faf0', medium: '#fefce8', high: '#fef2f2' }[r] || '#f8faf8')
  const riskBorder = (r: string) => ({ low: '#16a34a', medium: '#d97706', high: '#dc2626' }[r] || '#e8ede8')

  return (
    <>
      <Head>
        <title>Groove Slip — Accumulator Builder</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#f0f4f0', fontFamily: 'Inter, sans-serif' }}>
        {/* NAV */}
        <nav style={{ background: '#1a3d1e', padding: '0 16px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/logo.png" alt="Groove Slip" width={28} height={28} style={{ objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Groove <span style={{ color: '#4ade80' }}>Slip</span></span>
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 10px' }}>{username}</span>
        </nav>

        <main style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 100px' }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 2, color: '#0f2010' }}>🏗️ Accumulator Builder</h2>
            <p style={{ color: '#64748b', fontSize: 13 }}>Set your target — AI builds the best slip from today's fixtures</p>
          </div>

          {/* Builder Controls */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>

            {/* Target Odds */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>TARGET ODDS</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {[5, 10, 20, 50, 100].map(odd => (
                  <button key={odd} onClick={() => setTargetOdds(String(odd))}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, background: targetOdds === String(odd) ? '#1a3d1e' : '#f8faf8', color: targetOdds === String(odd) ? '#fff' : '#475569', border: targetOdds === String(odd) ? '1.5px solid #1a3d1e' : '1.5px solid #e8ede8', cursor: 'pointer' }}>
                    {odd}x
                  </button>
                ))}
              </div>
              <input type="number" placeholder="Or type any target e.g. 500"
                value={targetOdds} onChange={e => setTargetOdds(e.target.value)}
                min={1.5} step="any"
                style={{ width: '100%', background: '#f8faf8', border: '1.5px solid #e8ede8', borderRadius: 9, padding: '12px 14px', fontSize: 14, color: '#0f2010', boxSizing: 'border-box' }} />
            </div>

            {/* Risk Level */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>RISK LEVEL</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { value: 'low', label: '🛡️ Low Risk', desc: 'Very safe picks — Over 0.5, strong home favourites. Lower odds but very likely to win.' },
                  { value: 'medium', label: '⚖️ Medium Risk', desc: 'Balanced picks — solid data-backed selections. Good mix of odds and probability.' },
                  { value: 'high', label: '🎯 High Risk', desc: 'Higher odds picks — AI will push for bigger returns using form and H2H data.' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setRiskLevel(opt.value as 'low' | 'medium' | 'high')}
                    style={{ padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', background: riskLevel === opt.value ? riskBg(opt.value) : '#f8faf8', border: riskLevel === opt.value ? `2px solid ${riskBorder(opt.value)}` : '1.5px solid #e8ede8' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: '#0f2010' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>DATE RANGE</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { value: 'today', label: 'Today' },
                  { value: 'tomorrow', label: '+Tomorrow' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setDateRange(opt.value)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, background: dateRange === opt.value ? '#1a3d1e' : '#f8faf8', color: dateRange === opt.value ? '#fff' : '#475569', border: dateRange === opt.value ? '1.5px solid #1a3d1e' : '1.5px solid #e8ede8', cursor: 'pointer' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 12px', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>
                ⚠ {error}
              </div>
            )}

            <button onClick={handleBuild} disabled={loading}
              style={{ width: '100%', padding: 14, background: loading ? '#94a3b8' : '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Building your slip...' : '🏗️ Build My Accumulator'}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#1a3d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🏗️</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2010', marginBottom: 4 }}>Building Your Accumulator</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>Scanning fixtures and selecting best picks...</p>
            </div>
          )}

          {/* Results */}
          {games.length > 0 && !loading && (
            <>
              {/* Booking Code */}
              {bookingCode ? (
                <div style={{ background: 'linear-gradient(135deg,#1a3d1e,#15803d)', borderRadius: 18, padding: 20, marginBottom: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.08em', marginBottom: 6 }}>✅ BOOKING CODE READY</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '0.15em', marginBottom: 14 }}>{bookingCode}</div>
                  <button onClick={() => { navigator.clipboard.writeText(bookingCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    style={{ width: '100%', padding: 12, background: '#fff', color: '#1a3d1e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                    {copied ? '✓ Copied!' : '📋 Copy Code'}
                  </button>
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid rgba(217,119,6,0.3)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: '#d97706', fontSize: 14, marginBottom: 2 }}>⚠ Load games manually on SportyBet</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Booking code unavailable — add each game below manually.</div>
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'GAMES', value: games.length, color: '#1a3d1e' },
                  { label: 'TOTAL ODDS', value: totalOdds.toFixed(2), color: '#16a34a' },
                  { label: 'RISK', value: riskLevel.toUpperCase(), color: riskLevel === 'low' ? '#16a34a' : riskLevel === 'medium' ? '#d97706' : '#dc2626' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid #e8ede8' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              {summary && (
                <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 10, border: '1px solid #e8ede8' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{summary}</p>
                </div>
              )}

              {/* Games */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e8ede8' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '0.05em', marginBottom: 12 }}>✅ SELECTED GAMES ({games.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {games.map((g, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 10, background: '#f8faf8', border: '1px solid #e8ede8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2010' }}>{g.homeTeam} vs {g.awayTeam}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{g.league}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#1a3d1e' }}>{g.odds}</div>
                          <div style={{ fontSize: 10, color: confColor(g.confidence), fontWeight: 700 }}>{g.confidence}%</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                        Pick: <strong style={{ color: '#0f2010' }}>{g.pick}</strong> ({g.market})
                      </div>
                      {g.reason && (
                        <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>💡 {g.reason}</div>
                      )}
                      {g.homeForm && g.awayForm && (
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                          Form: {g.homeTeam.split(' ')[0]} {g.homeForm} | {g.awayTeam.split(' ')[0]} {g.awayForm}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleBuild} style={{ width: '100%', marginTop: 12, padding: 12, background: '#fff', color: '#1a3d1e', border: '1.5px solid #1a3d1e', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                🔄 Rebuild with Same Settings
              </button>
            </>
          )}
        </main>

        {/* Bottom Nav */}
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
          <button onClick={() => router.push('/history')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>📋</span>History
          </button>
        </div>
      </div>
    </>
  )
}