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
  isRecommended: boolean
  dataQuality: 'FULL' | 'PARTIAL' | 'MINIMAL'
}

interface SuggestedAccumulator {
  legs: AccumulatorPick[]
  totalOdds: number
  avgGrooveScore: number
  legsCount: number
  potentialReturn: number
}

export default function BuilderPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [allPicks, setAllPicks] = useState<AccumulatorPick[]>([])
  const [recommendedPicks, setRecommendedPicks] = useState<AccumulatorPick[]>([])
  const [suggestedAccumulator, setSuggestedAccumulator] = useState<SuggestedAccumulator | null>(null)
  const [fixturesScanned, setFixturesScanned] = useState(0)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [dateRange, setDateRange] = useState('today')
  const [showAll, setShowAll] = useState(false)

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
    setAllPicks([])
    setRecommendedPicks([])
    setSuggestedAccumulator(null)
    setSummary('')
    setShowAll(false)

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
      setAllPicks(data.allPicks || [])
      setRecommendedPicks(data.recommendedPicks || [])
      setSuggestedAccumulator(data.suggestedAccumulator || null)
      setFixturesScanned(data.fixturesScanned || 0)
      setSummary(data.summary || '')
      if ((data.allPicks || []).length === 0) {
        setError(data.summary || 'No fixtures found — try a different date range.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build accumulator')
    } finally {
      setLoading(false)
    }
  }

  const handleCopySuggested = () => {
    if (!suggestedAccumulator) return
    const lines = suggestedAccumulator.legs.map(l =>
      `${l.homeTeam} vs ${l.awayTeam} — ${l.pick} (${l.market})`
    )
    navigator.clipboard.writeText(lines.join('\n'))
  }

  const scoreColor = (s: number, isRecommended?: boolean, dataQuality?: string) => {
    if (dataQuality === 'MINIMAL') return '#94a3b8'
    if (isRecommended) return '#16a34a'
    if (s >= 70) return '#16a34a'
    if (s >= 55) return '#d97706'
    return '#dc2626'
  }

  const scoreBg = (s: number, isRecommended?: boolean, dataQuality?: string) => {
    if (dataQuality === 'MINIMAL') return 'rgba(148,163,184,0.08)'
    if (isRecommended) return 'rgba(22,163,74,0.08)'
    if (s >= 70) return 'rgba(22,163,74,0.08)'
    if (s >= 55) return 'rgba(217,119,6,0.08)'
    return 'rgba(220,38,38,0.08)'
  }

  const scoreLabel = (s: number, isRecommended?: boolean, dataQuality?: string) => {
    if (dataQuality === 'MINIMAL') return 'EST'
    if (isRecommended) return 'REC'
    if (s >= 70) return 'GOOD'
    if (s >= 55) return 'FAIR'
    return 'WEAK'
  }

  const riskBg = (r: string) => ({ low: '#f0faf0', medium: '#fefce8', high: '#fef2f2' }[r] || '#f8faf8')
  const riskBorder = (r: string) => ({ low: '#16a34a', medium: '#d97706', high: '#dc2626' }[r] || '#e8ede8')

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch { return '' }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })
    } catch { return '' }
  }

  const displayedPicks = showAll ? allPicks : allPicks.slice(0, 10)

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
            <p style={{ color: '#64748b', fontSize: 13 }}>See all fixtures with predictions and probability — pick your best combination</p>
          </div>

          {/* Settings Card */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>RISK LEVEL</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { value: 'low', label: '🛡️ Low Risk', desc: 'Only highest confidence picks (Groove Score 72+)' },
                  { value: 'medium', label: '⚖️ Medium Risk', desc: 'Balanced confidence picks (Groove Score 65+)' },
                  { value: 'high', label: '🎯 High Risk', desc: 'Broader picks including lower confidence (Groove Score 55+)' },
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
              <p style={{ color: '#64748b', fontSize: 13 }}>Fetching predictions and analysing every match...</p>
            </div>
          )}

          {allPicks.length > 0 && !loading && (
            <>
              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'FIXTURES', value: fixturesScanned },
                  { label: 'RECOMMENDED', value: recommendedPicks.length },
                  { label: 'ALL PICKS', value: allPicks.length },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid #e8ede8' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: '#1a3d1e' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {summary && (
                <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, border: '1px solid #e8ede8' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{summary}</p>
                </div>
              )}

              {/* Suggested Accumulator */}
              {suggestedAccumulator && (
                <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '2px solid #1a3d1e', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a3d1e', letterSpacing: '0.05em' }}>⭐ SUGGESTED ACCUMULATOR</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{suggestedAccumulator.legsCount} legs · Est. return on ₦1,000: ₦{suggestedAccumulator.potentialReturn.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: '#16a34a' }}>{suggestedAccumulator.avgGrooveScore}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>AVG SCORE</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {suggestedAccumulator.legs.map((leg, i) => (
                      <div key={i} style={{ padding: '10px 12px', borderRadius: 9, background: '#f0faf0', border: '1px solid rgba(22,163,74,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2010' }}>{leg.homeTeam} vs {leg.awayTeam}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{leg.league} · {formatTime(leg.matchDate)}</div>
                          <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>Pick: <strong>{leg.pick}</strong> ({leg.market})</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>{leg.probability.toFixed(0)}%</div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>PROBABILITY</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a3d1e', marginTop: 2 }}>{leg.grooveScore}/100</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleCopySuggested} style={{ width: '100%', padding: 10, background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    📋 Copy Suggested Slip
                  </button>
                </div>
              )}

              {/* All Fixtures */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: 10 }}>
                  ALL FIXTURES ({allPicks.length}) — sorted by Groove Score
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {displayedPicks.map((pick, i) => (
                    <div key={i} style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '12px 14px',
                      border: pick.isRecommended ? '1.5px solid rgba(22,163,74,0.3)' : '1px solid #e8ede8',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            {pick.isRecommended && (
                              <span style={{ fontSize: 9, fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.1)', borderRadius: 4, padding: '2px 5px' }}>⭐ REC</span>
                            )}
                            <span style={{ fontSize: 10, color: '#94a3b8' }}>{pick.league}</span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2010' }}>{pick.homeTeam} vs {pick.awayTeam}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{formatDate(pick.matchDate)} · {formatTime(pick.matchDate)}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: scoreColor(pick.grooveScore, pick.isRecommended, pick.dataQuality) }}>{pick.probability.toFixed(0)}%</div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>PROBABILITY</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: '#475569' }}>
                          Best pick: <strong style={{ color: '#0f2010' }}>{pick.pick}</strong> ({pick.market})
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: scoreBg(pick.grooveScore, pick.isRecommended, pick.dataQuality),
                          border: `1px solid ${scoreColor(pick.grooveScore, pick.isRecommended, pick.dataQuality)}30`,
                          borderRadius: 6, padding: '3px 7px'
                        }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 12, color: scoreColor(pick.grooveScore, pick.isRecommended, pick.dataQuality) }}>
                            {pick.dataQuality === 'MINIMAL' ? '~' : ''}{pick.grooveScore}
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: scoreColor(pick.grooveScore, pick.isRecommended, pick.dataQuality) }}>
                            {scoreLabel(pick.grooveScore, pick.isRecommended, pick.dataQuality)}
                          </span>
                        </div>
                      </div>

                      {pick.reason && (
                        <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 6 }}>💡 {pick.reason}</div>
                      )}
                    </div>
                  ))}
                </div>

                {allPicks.length > 10 && (
                  <button onClick={() => setShowAll(!showAll)}
                    style={{ width: '100%', marginTop: 10, padding: 12, background: '#fff', color: '#1a3d1e', border: '1.5px solid #1a3d1e', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {showAll ? '▲ Show Less' : `▼ Show All ${allPicks.length} Fixtures`}
                  </button>
                )}
              </div>

              <button onClick={handleBuild} style={{ width: '100%', marginTop: 4, padding: 12, background: '#f8faf8', color: '#1a3d1e', border: '1.5px solid #1a3d1e', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
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