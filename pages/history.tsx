import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'

interface SavedGame {
  eventId: string
  homeTeam: string
  awayTeam: string
  pick: string
  market: string
  odds: number
  league: string
  replaced?: boolean
  originalPick?: string
  originalOdds?: number
}

interface SavedSlip {
  id: string
  bookingCode: string
  originalCode: string
  originalOdds: number
  newOdds: number
  targetOdds: number
  games: SavedGame[]
  removedCount: number
  replacedCount: number
  savedAt: string
  status: 'pending' | 'won' | 'lost'
  settledAt?: string
}

interface Stats {
  total: number
  won: number
  lost: number
  pending: number
  winRate: number
  avgOriginalOdds: number
  avgNewOdds: number
  avgOddsImprovement: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [slips, setSlips] = useState<SavedSlip[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/slips/list', { headers: authHeaders() })
      if (res.status === 401) { router.push('/'); return }
      const data = await res.json()
      setSlips(data.slips || [])
      setStats(data.stats || null)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    fetchData()
  }, [fetchData, router])

  const settle = async (slipId: string, status: 'won' | 'lost') => {
    setSettling(slipId + status)
    try {
      await fetch('/api/slips/settle', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ slipId, status }),
      })
      await fetchData()
    } finally { setSettling(null) }
  }

  const filtered = slips.filter(s => filter === 'all' || s.status === filter)

  const statusStyle = (status: string) => {
    if (status === 'won') return { bg: 'rgba(22,163,74,0.08)', color: '#16a34a', border: 'rgba(22,163,74,0.2)' }
    if (status === 'lost') return { bg: 'rgba(220,38,38,0.08)', color: '#dc2626', border: 'rgba(220,38,38,0.2)' }
    return { bg: 'rgba(217,119,6,0.08)', color: '#d97706', border: 'rgba(217,119,6,0.2)' }
  }

  return (
    <>
      <Head>
        <title>Slip History — Groove Slip</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#f0f4f0', fontFamily: 'Inter, sans-serif' }}>
        {/* Nav */}
        <nav style={{
          background: '#1a3d1e', padding: '0 16px', height: 54,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/logo.png" alt="Groove Slip" width={28} height={28} style={{ objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>
              Groove <span style={{ color: '#4ade80' }}>Slip</span>
            </span>
          </div>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            ← Dashboard
          </button>
        </nav>

        <main style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 100px' }}>

          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2010', marginBottom: 2 }}>Slip History</h2>
            <p style={{ color: '#64748b', fontSize: 13 }}>Track your analysed slips and mark results</p>
          </div>

          {/* Stats */}
          {stats && stats.total > 0 && (
            <div style={{ background: '#1a3d1e', borderRadius: 16, padding: '18px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.06em', marginBottom: 14 }}>YOUR STATS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Total', value: stats.total, color: '#fff' },
                  { label: 'Won', value: stats.won, color: '#4ade80' },
                  { label: 'Lost', value: stats.lost, color: '#f87171' },
                  { label: 'Win Rate', value: `${stats.winRate}%`, color: '#fbbf24' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Avg Original Odds', value: stats.avgOriginalOdds },
                  { label: 'Avg New Odds', value: stats.avgNewOdds },
                  { label: 'Odds Reduction', value: `${stats.avgOddsImprovement}%` },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#4ade80' }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter tabs */}
          {slips.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {(['all', 'pending', 'won', 'lost'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: filter === f ? '#1a3d1e' : '#fff',
                    color: filter === f ? '#fff' : '#64748b',
                    border: filter === f ? 'none' : '1px solid #e8ede8',
                    cursor: 'pointer', textTransform: 'capitalize',
                  }}>
                  {f} {f !== 'all' ? `(${slips.filter(s => s.status === f).length})` : `(${slips.length})`}
                </button>
              ))}
            </div>
          )}

          {/* Slips */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b', fontSize: 14 }}>
              Loading history...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
              <h3 style={{ fontWeight: 700, color: '#0f2010', marginBottom: 8 }}>
                {slips.length === 0 ? 'No slips yet' : `No ${filter} slips`}
              </h3>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                {slips.length === 0
                  ? 'Analyse your first slip and it will appear here'
                  : 'Try a different filter'}
              </p>
              {slips.length === 0 && (
                <button onClick={() => router.push('/dashboard')}
                  style={{ marginTop: 16, padding: '12px 24px', background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Analyse a Slip
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(slip => {
                const ss = statusStyle(slip.status)
                const isExpanded = expanded === slip.id
                return (
                  <div key={slip.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #e8ede8' }}>
                    {/* Header */}
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: '#1a3d1e', marginBottom: 2 }}>
                            {slip.bookingCode}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            {new Date(slip.savedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'uppercase' }}>
                          {slip.status === 'pending' ? '⏳ Pending' : slip.status === 'won' ? '✅ Won' : '❌ Lost'}
                        </span>
                      </div>

                      {/* Odds row */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <div style={{ flex: 1, background: '#f8faf8', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>ORIGINAL</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#64748b', textDecoration: 'line-through' }}>{slip.originalOdds}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: 14 }}>→</div>
                        <div style={{ flex: 1, background: '#f0faf0', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: '#16a34a', fontWeight: 600, marginBottom: 2 }}>CLEANED</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#1a3d1e' }}>{slip.newOdds}</div>
                        </div>
                        <div style={{ flex: 1, background: '#f8faf8', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>GAMES</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#0f2010' }}>{slip.games.length}</div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                        {slip.removedCount > 0 && (
                          <span style={{ fontSize: 11, background: 'rgba(220,38,38,0.08)', color: '#dc2626', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                            ❌ {slip.removedCount} removed
                          </span>
                        )}
                        {slip.replacedCount > 0 && (
                          <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.08)', color: '#3b82f6', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                            🔄 {slip.replacedCount} replaced
                          </span>
                        )}
                        <span style={{ fontSize: 11, background: '#f0faf0', color: '#16a34a', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                          🎯 Target: {slip.targetOdds}x
                        </span>
                      </div>

                      {/* Settle buttons */}
                      {slip.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                          <button
                            onClick={() => settle(slip.id, 'won')}
                            disabled={!!settling}
                            style={{ flex: 1, padding: '10px', background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1.5px solid rgba(22,163,74,0.3)', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: settling ? 0.7 : 1 }}>
                            {settling === slip.id + 'won' ? '...' : '✅ Mark Won'}
                          </button>
                          <button
                            onClick={() => settle(slip.id, 'lost')}
                            disabled={!!settling}
                            style={{ flex: 1, padding: '10px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: settling ? 0.7 : 1 }}>
                            {settling === slip.id + 'lost' ? '...' : '❌ Mark Lost'}
                          </button>
                        </div>
                      )}
                      {slip.status !== 'pending' && slip.settledAt && (
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                          Settled: {new Date(slip.settledAt).toLocaleDateString('en-NG')}
                        </div>
                      )}

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : slip.id)}
                        style={{ width: '100%', padding: '8px', background: '#f8faf8', border: '1px solid #e8ede8', borderRadius: 8, fontSize: 12, color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>
                        {isExpanded ? '▲ Hide games' : `▼ Show ${slip.games.length} games`}
                      </button>
                    </div>

                    {/* Games list */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #e8ede8', padding: '12px 16px', background: '#f8faf8' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {slip.games.map((g, i) => (
                            <div key={g.eventId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 10px', background: '#fff', borderRadius: 9, border: g.replaced ? '1px solid rgba(59,130,246,0.2)' : '1px solid #e8ede8' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f2010' }}>
                                  {i + 1}. {g.homeTeam} vs {g.awayTeam}
                                </div>
                                {g.replaced ? (
                                  <div style={{ fontSize: 11, marginTop: 2 }}>
                                    <span style={{ color: '#dc2626', textDecoration: 'line-through', marginRight: 6 }}>
                                      {g.originalPick} @ {g.originalOdds}
                                    </span>
                                    <span style={{ color: '#3b82f6', fontWeight: 700 }}>
                                      → {g.pick} @ {g.odds}
                                    </span>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                    {g.pick} · {g.market}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#1a3d1e', flexShrink: 0, marginLeft: 8 }}>
                                {g.odds}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>

        {/* Bottom Nav */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTop: '1px solid #e8ede8',
          display: 'flex', padding: '10px 0 20px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            Analyse
          </button>
          <button
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#1a3d1e', fontSize: 10, fontWeight: 700 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            History
          </button>
        </div>
      </div>
    </>
  )
}