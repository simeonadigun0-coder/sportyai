import { useState, useEffect } from 'react'

interface ValueBetLeg {
  homeTeam: string
  awayTeam: string
  pick: string
  market: string
  odds: number
  result: 'pending' | 'won' | 'lost'
  finalScore?: string
  reason?: string
}

interface ValueBetRecord {
  date: string
  legs: ValueBetLeg[]
  totalOdds: number
  combinedProbability: number
  status: 'active' | 'settled' | 'no_bet'
  overallResult?: 'won' | 'lost'
  summary?: string
}

export function AdminValueBetPanel() {
  const [record, setRecord] = useState<ValueBetRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [legResults, setLegResults] = useState<Record<number, 'won' | 'lost'>>({})
  const [finalScores, setFinalScores] = useState<Record<number, string>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  const loadRecord = async (date: string) => {
    setLoading(true)
    setMessage('')
    setError('')
    setRecord(null)
    try {
      const res = await fetch(`/api/admin/settle-value-bet?date=${date}`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load record')
        return
      }
      const r = data.record as ValueBetRecord
      setRecord(r)
      // Pre-fill existing results
      const initial: Record<number, 'won' | 'lost'> = {}
      const scores: Record<number, string> = {}
      r.legs?.forEach((l, i) => {
        if (l.result !== 'pending') initial[i] = l.result as 'won' | 'lost'
        if (l.finalScore) scores[i] = l.finalScore
      })
      setLegResults(initial)
      setFinalScores(scores)
    } catch {
      setError('Failed to load record')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecord(selectedDate) }, [])

  const handleSubmit = async () => {
    if (!record) return
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const legResultsArray = Object.entries(legResults).map(([index, result]) => ({
        index: parseInt(index),
        result,
        finalScore: finalScores[parseInt(index)] || undefined,
      }))
      const res = await fetch('/api/admin/settle-value-bet', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          date: selectedDate,
          legResults: legResultsArray,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('✅ Settlement saved successfully')
      loadRecord(selectedDate)
    } catch (err) {
      setError(`⚠ ${err instanceof Error ? err.message : 'Failed'}`)
    } finally {
      setLoading(false)
    }
  }

  const resultColor = (r?: string) => r === 'won' ? '#16a34a' : r === 'lost' ? '#dc2626' : '#94a3b8'

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e8ede8', marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2010', marginBottom: 4 }}>💎 Value Bet Manual Settlement</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Override auto-settlement for any date</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input type="date" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e8ede8', fontSize: 13 }} />
        <button onClick={() => loadRecord(selectedDate)} disabled={loading}
          style={{ padding: '8px 14px', background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Load
        </button>
      </div>

      {loading && <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Loading...</div>}

      {error && (
        <div style={{ fontSize: 12, padding: '10px 12px', borderRadius: 8, marginBottom: 12, background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ fontSize: 12, padding: '10px 12px', borderRadius: 8, marginBottom: 12, background: 'rgba(22,163,74,0.06)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }}>
          {message}
        </div>
      )}

      {record && !loading && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, background: '#f8faf8', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>STATUS</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: record.status === 'settled' ? resultColor(record.overallResult) : '#d97706' }}>
                {record.status === 'settled' ? (record.overallResult === 'won' ? '✅ WON' : '❌ LOST') : '⏳ PENDING'}
              </div>
            </div>
            <div style={{ flex: 1, background: '#f8faf8', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>ODDS</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3d1e' }}>{record.totalOdds}x</div>
            </div>
            <div style={{ flex: 1, background: '#f8faf8', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>GAMES</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3d1e' }}>{record.legs?.length || 0}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {record.legs?.map((leg, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 10, background: '#f8faf8', border: '1px solid #e8ede8' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: '#0f2010' }}>{leg.homeTeam} vs {leg.awayTeam}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{leg.pick} ({leg.market}) @ {leg.odds}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button onClick={() => setLegResults(prev => ({ ...prev, [i]: 'won' }))}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: legResults[i] === 'won' ? '#16a34a' : '#fff', color: legResults[i] === 'won' ? '#fff' : '#16a34a', border: '1.5px solid #16a34a' }}>
                    ✅ Won
                  </button>
                  <button onClick={() => setLegResults(prev => ({ ...prev, [i]: 'lost' }))}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: legResults[i] === 'lost' ? '#dc2626' : '#fff', color: legResults[i] === 'lost' ? '#fff' : '#dc2626', border: '1.5px solid #dc2626' }}>
                    ❌ Lost
                  </button>
                </div>
                <input type="text" placeholder="Final score e.g. 2-1 (optional)"
                  value={finalScores[i] || ''}
                  onChange={e => setFinalScores(prev => ({ ...prev, [i]: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e8ede8', fontSize: 12, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: 12, background: loading ? '#94a3b8' : '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : 'Save Settlement'}
          </button>
        </>
      )}
    </div>
  )
}