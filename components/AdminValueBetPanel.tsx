// ─── ADMIN VALUE BET SETTLEMENT PANEL ─────────────────────────────────────
// Add this component to your existing admin.tsx page
// Drop it in wherever you want the manual settlement controls to appear

import { useState, useEffect } from 'react'

interface ValueBetLeg {
  homeTeam: string
  awayTeam: string
  pick: string
  market: string
  odds: number
  result: 'pending' | 'won' | 'lost'
  finalScore?: string
}

interface ValueBetRecord {
  date: string
  legs: ValueBetLeg[]
  totalOdds: number
  combinedProbability: number
  status: 'active' | 'settled' | 'no_bet'
  overallResult?: 'won' | 'lost'
}

export function AdminValueBetPanel() {
  const [record, setRecord] = useState<ValueBetRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [legResults, setLegResults] = useState<Record<number, 'won' | 'lost'>>({})
  const [finalScores, setFinalScores] = useState<Record<number, string>>({})
  const [message, setMessage] = useState('')

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  const loadRecord = async (date: string) => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/value-bets/today', { headers: authHeaders() })
      const data = await res.json()
      // For non-today dates, you'd need a separate endpoint — using today's for now
      if (date === new Date().toISOString().split('T')[0]) {
        setRecord(data.today)
        if (data.today?.legs) {
          const initial: Record<number, 'won' | 'lost'> = {}
          data.today.legs.forEach((l: ValueBetLeg, i: number) => {
            if (l.result !== 'pending') initial[i] = l.result as 'won' | 'lost'
          })
          setLegResults(initial)
        }
      }
    } catch {
      setMessage('Failed to load record')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecord(selectedDate) }, [selectedDate])

  const handleSubmit = async () => {
    if (!record) return
    setLoading(true)
    setMessage('')
    try {
      const legResultsArray = Object.entries(legResults).map(([index, result]) => ({
        index: parseInt(index),
        result,
        finalScore: finalScores[parseInt(index)] || undefined,
      }))
      const res = await fetch('/api/admin/settle-value-bet', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ date: selectedDate, legResults: legResultsArray }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('✅ Settlement updated successfully')
      loadRecord(selectedDate)
    } catch (err) {
      setMessage(`⚠ ${err instanceof Error ? err.message : 'Failed to update'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e8ede8', marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2010', marginBottom: 4 }}>💎 Value Bet Manual Settlement</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Override Sofascore auto-detection if it misbehaves</div>

      <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e8ede8', fontSize: 13, marginBottom: 16, width: '100%', boxSizing: 'border-box' }} />

      {loading && <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading...</div>}

      {message && (
        <div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, marginBottom: 12, background: message.startsWith('✅') ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', color: message.startsWith('✅') ? '#16a34a' : '#dc2626' }}>
          {message}
        </div>
      )}

      {record && !loading && (
        <>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
            Status: <strong>{record.status}</strong> | Odds: <strong>{record.totalOdds}</strong> | Games: <strong>{record.legs.length}</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {record.legs.map((leg, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 10, background: '#f8faf8', border: '1px solid #e8ede8' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{leg.homeTeam} vs {leg.awayTeam}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{leg.pick} ({leg.market}) @ {leg.odds}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button onClick={() => setLegResults(prev => ({ ...prev, [i]: 'won' }))}
                    style={{ flex: 1, padding: '6px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: legResults[i] === 'won' ? '#16a34a' : '#fff', color: legResults[i] === 'won' ? '#fff' : '#16a34a', border: '1.5px solid #16a34a' }}>
                    ✅ Won
                  </button>
                  <button onClick={() => setLegResults(prev => ({ ...prev, [i]: 'lost' }))}
                    style={{ flex: 1, padding: '6px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: legResults[i] === 'lost' ? '#dc2626' : '#fff', color: legResults[i] === 'lost' ? '#fff' : '#dc2626', border: '1.5px solid #dc2626' }}>
                    ❌ Lost
                  </button>
                </div>
                <input type="text" placeholder="Final score e.g. 2-1" value={finalScores[i] || ''}
                  onChange={e => setFinalScores(prev => ({ ...prev, [i]: e.target.value }))}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #e8ede8', fontSize: 12, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: 12, background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Save Settlement
          </button>
        </>
      )}
    </div>
  )
}