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
        <title>Groove Slip — Where Sharp Minds Meet Sharper Picks</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 60%, #f0fdf4 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <div className="fade-up" style={{ width: '100%', maxWidth: 400 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--accent)', marginBottom: 14,
              boxShadow: '0 4px 20px rgba(22,163,74,0.35)',
            }}>
              <span style={{ fontSize: 26 }}>⚡</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--navy)', marginBottom: 6 }}>
              Groove Slip
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 14, fontStyle: 'italic' }}>
              Where sharp minds meet sharper picks
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: '#fff', borderRadius: 20,
            padding: '24px 20px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            border: '1px solid var(--border)',
            marginBottom: 16,
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex', gap: 4,
              background: 'var(--bg)',
              borderRadius: 10, padding: 4, marginBottom: 20,
            }}>
              {(['login', 'register'] as const).map(m => (
                <button key={m}
                  onClick={() => { setMode(m); setError(''); setPending(false) }}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8,
                    fontSize: 14, fontWeight: mode === m ? 700 : 500,
                    background: mode === m ? '#fff' : 'transparent',
                    color: mode === m ? 'var(--accent)' : 'var(--text3)',
                    border: mode === m ? '1.5px solid var(--border)' : '1.5px solid transparent',
                    boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {pending ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>⏳</div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Account Submitted!</h3>
                <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
                  Your account is pending admin approval. You will get an email once approved.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mode === 'register' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>USERNAME</label>
                    <input type="text" placeholder="e.g. punter_king"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      required />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>EMAIL</label>
                  <input type="email" placeholder="your@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>PASSWORD</label>
                  <input type="password" placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required />
                </div>

                {error && (
                  <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 14px', color: 'var(--red)', fontSize: 13 }}>
                    ⚠ {error}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                        Please wait...
                      </span>
                    : mode === 'login' ? 'Sign In →' : 'Create Account →'}
                </button>
              </form>
            )}
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '📈', text: 'Reads team form, injuries & head-to-head history like a seasoned scout' },
              { icon: '🚩', text: 'Flags the weak legs on your slip before they cost you' },
              { icon: '🔄', text: 'Returns a fresh SportyBet code with stronger selections' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}