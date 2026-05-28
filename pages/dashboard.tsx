import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

type Step = 'input' | 'result'

export default function Dashboard() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugData, setDebugData] = useState<unknown>(null)

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

  const handleDecode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebugData(null)
    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      setDebugData(data)
      setStep('result')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout')
    localStorage.removeItem('token')
    router.push('/')
  }

  return (
    <>
      <Head>
        <title>SportyAI Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <nav style={{
          borderBottom: '1px solid var(--border)',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,10,0.8)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>
            Sporty<span style={{ color: 'var(--accent)' }}>AI</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--text2)', fontSize: 13 }}>
              👤 <span style={{ color: 'var(--accent)' }}>{username}</span>
            </span>
            <button className="btn-secondary" onClick={logout}
              style={{ padding: '6px 14px', fontSize: 12 }}>
              Logout
            </button>
          </div>
        </nav>

        <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
          {step === 'input' && (
            <div className="fade-up">
              <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
                Analyse Your Bet Slip
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
                Paste your SportyBet booking code. AI will read the games and remove the bad eggs.
              </p>

              <div className="card">
                <form onSubmit={handleDecode}
                  style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{
                      fontSize: 12, color: 'var(--text2)',
                      display: 'block', marginBottom: 8, fontWeight: 600
                    }}>
                      SPORTYBET BOOKING CODE
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. YQKP2M"
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: 18,
                        fontWeight: 600, letterSpacing: '0.1em', textAlign: 'center'
                      }}
                      required
                    />
                  </div>

                  {error && (
                    <div style={{
                      background: 'var(--red-dim)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 8, padding: '10px 14px',
                      color: '#f87171', fontSize: 13
                    }}>
                      ⚠ {error}
                    </div>
                  )}

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading
                      ? <span style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', gap: 8
                        }}>
                          <span className="spinner" />Reading games...
                        </span>
                      : '🔍 Read Booking Code →'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="fade-up">
              <button onClick={() => { setStep('input'); setDebugData(null); setError('') }}
                style={{ background: 'none', color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
                ← Back
              </button>

              <div className="card">
                <h3 style={{ marginBottom: 12, fontSize: 14, color: 'var(--accent)' }}>
                  DEBUG — SportyBet Raw Response
                </h3>
                <pre style={{
                  fontSize: 11, color: 'var(--text2)', overflow: 'auto',
                  maxHeight: 500, background: 'var(--bg2)',
                  padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                }}>
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}