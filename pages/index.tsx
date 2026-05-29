import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setPending(false)

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const body = mode === 'login'
      ? { email: form.email, password: form.password }
      : { username: form.username, email: form.email, password: form.password }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.pending) { setPending(true); return }
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      if (data.token) localStorage.setItem('token', data.token)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>SportyAI — Smart Bet Slip Analyser</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #eff6ff 100%)',
      }}>
        {/* Left panel — branding */}
        <div style={{
          flex: 1, display: 'none',
          flexDirection: 'column', justifyContent: 'center',
          padding: '60px', background: 'var(--navy)',
          position: 'relative', overflow: 'hidden',
        }}
          className="left-panel">
          {/* Background pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(22,163,74,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.1) 0%, transparent 50%)',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--accent)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>⚡</div>
              <span style={{ fontWeight: 800, fontSize: 22, color: '#fff' }}>
                Sporty<span style={{ color: '#4ade80' }}>AI</span>
              </span>
            </div>

            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
              Stop losing bets.<br />
              <span style={{ color: '#4ade80' }}>Start winning smarter.</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
              Paste your SportyBet booking code. Our AI analyses every game, removes the bad eggs, and gives you a cleaner slip with better odds of winning.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '🔍', text: 'Decodes your SportyBet booking code instantly' },
                { icon: '🤖', text: 'AI searches real team form and injury news' },
                { icon: '🎯', text: 'Removes risky picks and generates a new code' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ color: '#cbd5e1', fontSize: 14 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '40px 20px',
        }}>
          <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>

            {/* Logo — mobile only */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                marginBottom: 8,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>⚡</div>
                <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--navy)' }}>
                  Sporty<span style={{ color: 'var(--accent)' }}>AI</span>
                </span>
              </div>
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>
                AI-powered bet slip analyser for SportyBet Nigeria
              </p>
            </div>

            {/* Card */}
            <div style={{
              background: '#fff', borderRadius: 20,
              padding: '32px', boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
              border: '1px solid var(--border)',
            }}>
              {/* Tabs */}
              <div style={{
                display: 'flex', gap: 4, background: 'var(--bg2)',
                borderRadius: 10, padding: 4, marginBottom: 24,
              }}>
                {(['login', 'register'] as const).map(m => (
                  <button key={m} onClick={() => { setMode(m); setError(''); setPending(false) }}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13,
                      fontWeight: mode === m ? 700 : 500,
                      background: mode === m ? '#fff' : 'transparent',
                      color: mode === m ? 'var(--accent)' : 'var(--text3)',
                      border: mode === m ? '1.5px solid var(--border)' : '1.5px solid transparent',
                      boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                    {m === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              {pending ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
                  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--navy)' }}>
                    Registration Successful!
                  </h3>
                  <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
                    Your account is pending admin approval. You'll receive an email once approved.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {mode === 'register' && (
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                        USERNAME
                      </label>
                      <input type="text" placeholder="e.g. punter_king"
                        value={form.username}
                        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                        required />
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                      EMAIL ADDRESS
                    </label>
                    <input type="email" placeholder="your@email.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                      PASSWORD
                    </label>
                    <input type="password" placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required />
                  </div>

                  {error && (
                    <div style={{
                      background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)',
                      borderRadius: 10, padding: '10px 14px',
                      color: 'var(--red)', fontSize: 13,
                    }}>
                      ⚠ {error}
                    </div>
                  )}

                  <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                    {loading
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                          Processing...
                        </span>
                      : mode === 'login' ? 'Sign In →' : 'Create Account →'}
                  </button>
                </form>
              )}
            </div>

            <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: 20 }}>
              SportyAI analyses your bet slips using AI to remove risky picks
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .left-panel { display: flex !important; }
        }
      `}</style>
    </>
  )
}