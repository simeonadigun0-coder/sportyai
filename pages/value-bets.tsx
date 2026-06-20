import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'

interface ValueBetLeg {
  homeTeam: string
  awayTeam: string
  league: string
  startTime: string
  pick: string
  market: string
  odds: number
  realProb: number
  impliedProbValue: number
  edge: number
  reason: string
  result: 'pending' | 'won' | 'lost'
  finalScore?: string
}

interface ValueBetRecord {
  date: string
  legs: ValueBetLeg[]
  totalOdds: number
  combinedProbability: number
  summary: string
  status: 'active' | 'settled' | 'no_bet'
  generatedAt: string
  settledAt?: string
  overallResult?: 'won' | 'lost'
}

interface HistoryItem {
  date: string
  status: string
  overallResult?: 'won' | 'lost'
  totalOdds: number
  legsCount: number
}

export default function ValueBetsPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [todayBet, setTodayBet] = useState<ValueBetRecord | null>(null)
  const [stats, setStats] = useState({ wins: 0, total: 0, winRate: 0 })
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUsername(payload.username)
      setIsAdmin(payload.email === 'simeonadigun0@gmail.com')
    } catch { router.push('/'); return }
    loadData()
  }, [router])

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/value-bets/today', { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setTodayBet(data.today)
      setStats(data.stats)
      setHistory(data.history || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load value bet')
    } finally {
      setLoading(false)
    }
  }

  const confColor = (c: number) => c >= 95 ? '#16a34a' : c >= 90 ? '#22c55e' : '#3b82f6'
  const resultColor = (r?: string) => r === 'won' ? '#16a34a' : r === 'lost' ? '#dc2626' : '#94a3b8'
  const resultBg = (r?: string) => r === 'won' ? 'rgba(22,163,74,0.08)' : r === 'lost' ? 'rgba(220,38,38,0.08)' : 'rgba(148,163,184,0.08)'

  return (
    <>
      <Head>
        <title>Groove Slip — Value Bet of the Day</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#f0f4f0', fontFamily: 'Inter, sans-serif' }}>
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
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f2010', marginBottom: 2 }}>💎 Value Bet of the Day</h2>
            <p style={{ color: '#64748b', fontSize: 13 }}>Our daily banker — 90%+ probability, backed by real data</p>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#1a3d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>💎</div>
              <p style={{ color: '#64748b', fontSize: 13 }}>Loading today's value bet...</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '14px', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>
          )}

          {/* Streak Banner */}
          {!loading && stats.total > 0 && (
            <div style={{ background: 'linear-gradient(135deg,#1a3d1e,#15803d)', borderRadius: 18, padding: '20px 16px', marginBottom: 16, textAlign: 'center', boxShadow: '0 4px 16px rgba(26,61,30,0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.1em', marginBottom: 8 }}>TRACK RECORD</div>
              <div style={{ fontFamily: 'monospace', fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {stats.wins}/{stats.total}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{stats.winRate}% success rate since launch</div>
            </div>
          )}

          {/* Today's Bet */}
          {!loading && todayBet && todayBet.status !== 'no_bet' && (
            <div style={{ background: '#fff', borderRadius: 18, padding: 20, marginBottom: 16, border: '2px solid rgba(22,163,74,0.25)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>TODAY'S BANKER</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(todayBet.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                </div>
                {todayBet.status === 'settled' ? (
                  <div style={{ padding: '6px 14px', borderRadius: 20, background: resultBg(todayBet.overallResult), color: resultColor(todayBet.overallResult), fontWeight: 800, fontSize: 13 }}>
                    {todayBet.overallResult === 'won' ? '✅ WON' : '❌ LOST'}
                  </div>
                ) : (
                  <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(217,119,6,0.1)', color: '#d97706', fontWeight: 800, fontSize: 13 }}>⏳ LIVE</div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
                <div style={{ background: '#f8faf8', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>GAMES</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#1a3d1e' }}>{todayBet.legs.length}</div>
                </div>
                <div style={{ background: '#f8faf8', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>ODDS</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#1a3d1e' }}>{todayBet.totalOdds}</div>
                </div>
                <div style={{ background: '#f8faf8', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>PROBABILITY</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: confColor(todayBet.combinedProbability) }}>{todayBet.combinedProbability}%</div>
                </div>
              </div>

              {todayBet.summary && (
                <div style={{ background: 'rgba(22,163,74,0.05)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🤖</span>
                  <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>{todayBet.summary}</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayBet.legs.map((leg, i) => (
                  <div key={i} style={{ background: leg.result === 'won' ? 'rgba(22,163,74,0.04)' : leg.result === 'lost' ? 'rgba(220,38,38,0.04)' : '#f8faf8', border: `1px solid ${leg.result === 'won' ? 'rgba(22,163,74,0.15)' : leg.result === 'lost' ? 'rgba(220,38,38,0.15)' : '#e8ede8'}`, borderRadius: 10, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2010' }}>{leg.homeTeam} vs {leg.awayTeam}</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#1a3d1e' }}>{leg.odds}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>{leg.pick} ({leg.market})</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${confColor(leg.realProb)}15`, color: confColor(leg.realProb), fontWeight: 700 }}>{leg.realProb}% probability</span>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{leg.league}</span>
                      {leg.finalScore && <span style={{ fontSize: 10, fontWeight: 700, color: resultColor(leg.result) }}>FT: {leg.finalScore}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>💡 {leg.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && todayBet?.status === 'no_bet' && (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e8ede8', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2010', marginBottom: 4 }}>No banker today</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>No combination met our 90%+ confidence threshold today. Check back tomorrow.</p>
            </div>
          )}

          {!loading && !todayBet && (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e8ede8', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2010', marginBottom: 4 }}>Today's banker is being prepared</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>New value bet drops by 10am daily. Check back soon.</p>
            </div>
          )}

          {/* Recent History Tracker */}
          {!loading && history.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e8ede8' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: 12 }}>RECENT RESULTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: resultBg(h.overallResult) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{h.overallResult === 'won' ? '✅' : h.overallResult === 'lost' ? '❌' : '⏳'}</span>
                      <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                        {new Date(h.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{h.legsCount} {h.legsCount === 1 ? 'game' : 'games'}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: resultColor(h.overallResult) }}>{h.totalOdds}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e8ede8', display: 'flex', padding: '10px 0 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', zIndex: 50 }}>
          <button onClick={() => router.push('/dashboard')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>⚡</span>Analyse
          </button>
          <button style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#1a3d1e', fontSize: 10, fontWeight: 700 }}>
            <span style={{ fontSize: 20 }}>💎</span>Value Bet
          </button>
          <button onClick={() => router.push('/builder')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>🏗️</span>Builder
          </button>
        </div>
      </div>
    </>
  )
}