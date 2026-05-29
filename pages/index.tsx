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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 60%, #eff6ff 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <div className="fade-up" style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--accent)', marginBottom: 12,
              boxShadow: '0 4px 16px rgba(22,163,74,0.30)',
            }}>
              <span style={{ fontSize: 24 }}>⚡</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--navy)' }}>
              Sporty<span style={{ color: 'var(--accent)' }}>AI</span>
            </h1>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>
              AI-powered bet slip analyser
            </p>
          </div>

          <div style={{
            background: '#fff', borderRadius: 20,
            padding: '24px 20px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            border: '1px solid var(--border)',
          }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {[
              { icon: '🤖', text: 'AI analyses real team form and injuries' },
              { icon: '🎯', text: 'Removes bad eggs from your slip' },
              { icon: '⚡', text: 'Generates a fresh SportyBet code' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}