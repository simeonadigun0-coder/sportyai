import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'

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
      if (data.user?.subscriptionExpiry) localStorage.setItem('subscriptionExpiry', data.user.subscriptionExpiry)
      if (data.user?.subscriptionWaived) localStorage.setItem('subscriptionWaived', String(data.user.subscriptionWaived))
        localStorage.setItem('freeAnalysisUsed', String(data.user?.freeAnalysisUsed || false))
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
        background: '#0a0f0a',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(22,163,74,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(22,163,74,0.08) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(15,23,42,0.9) 0%, transparent 100%)
          `,
        }} />

        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Left Panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 56px',
          position: 'relative',
          zIndex: 1,
        }} className="left-panel">

          {/* Logo — desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
            <Image
              src="/logo.png"
              alt="Groove Slip"
              width={44}
              height={44}
              style={{ objectFit: 'contain' }}
            />
            <span style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.02em' }}>
              Groove <span style={{ color: '#4ade80' }}>Slip</span>
            </span>
          </div>

          <div style={{ marginBottom: 48 }}>
            <h1 style={{
              fontSize: 44, fontWeight: 900, color: '#fff',
              lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20,
            }}>
              Stop guessing.<br />
              <span style={{
                background: 'linear-gradient(135deg, #4ade80, #16a34a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Start winning.</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7, maxWidth: 420 }}>
              Groove Slip reads your SportyBet booking code, analyses every pick using real match data, and hands you a cleaner slip with higher chances of winning.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 48 }}>
            {[
              { value: 'BSD + Sofascore', label: 'Real data sources' },
              { value: 'AI Powered', label: 'Punter-grade analysis' },
              { value: 'Instant', label: 'New code in seconds' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#4ade80', marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '📊', text: 'Reads team form, injuries & H2H like a seasoned scout' },
              { icon: '🚩', text: 'Flags weak legs before they cost you the slip' },
              { icon: '🔄', text: 'Replaces risky picks with safer market options' },
              { icon: '⚡', text: 'Returns a fresh SportyBet code instantly' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(22,163,74,0.1)',
                  border: '1px solid rgba(22,163,74,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0,
                }}>{item.icon}</div>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Form */}
        <div style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          position: 'relative',
          zIndex: 1,
          background: 'rgba(255,255,255,0.03)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div className="fade-up" style={{ width: '100%', maxWidth: 380 }}>

            {/* Mobile logo */}
            <div className="mobile-logo" style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Image
                  src="/logo.png"
                  alt="Groove Slip"
                  width={56}
                  height={56}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Groove <span style={{ color: '#4ade80' }}>Slip</span>
              </h1>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>
                Where sharp minds meet sharper picks
              </p>
            </div>

            {/* Form card */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '28px 24px',
              backdropFilter: 'blur(20px)',
            }}>
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
                {mode === 'login'
                  ? 'Sign in to analyse your bet slip'
                  : 'Register to start winning smarter'}
              </p>

              {/* Tabs */}
              <div style={{
                display: 'flex', gap: 4,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 10, padding: 4, marginBottom: 24,
              }}>
                {(['login', 'register'] as const).map(m => (
                  <button key={m}
                    onClick={() => { setMode(m); setError(''); setPending(false) }}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 7,
                      fontSize: 13, fontWeight: mode === m ? 700 : 500,
                      background: mode === m ? 'rgba(22,163,74,0.2)' : 'transparent',
                      color: mode === m ? '#4ade80' : '#64748b',
                      border: mode === m ? '1px solid rgba(22,163,74,0.3)' : '1px solid transparent',
                      transition: 'all 0.2s',
                    }}>
                    {m === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              {pending ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>⏳</div>
                  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#fff' }}>Account Submitted!</h3>
                  <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
                    Pending admin approval. You will get an email once approved.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {mode === 'register' && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>USERNAME</label>
                      <input type="text" placeholder="e.g. punter_king"
                        value={form.username}
                        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff', borderRadius: 10, padding: '13px 16px',
                          fontSize: 14,
                        }}
                        required />
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>EMAIL</label>
                    <input type="email" placeholder="your@email.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', borderRadius: 10, padding: '13px 16px',
                        fontSize: 14,
                      }}
                      required />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>PASSWORD</label>
                    <input type="password" placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', borderRadius: 10, padding: '13px 16px',
                        fontSize: 14,
                      }}
                      required />
                  </div>

                  {error && (
                    <div style={{
                      background: 'rgba(220,38,38,0.1)',
                      border: '1px solid rgba(220,38,38,0.3)',
                      borderRadius: 10, padding: '10px 14px',
                      color: '#f87171', fontSize: 13,
                    }}>
                      ⚠ {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} style={{
                    marginTop: 4,
                    background: 'linear-gradient(135deg, #16a34a, #15803d)',
                    color: '#fff', padding: '14px 24px',
                    borderRadius: 10, fontSize: 14, fontWeight: 700,
                    width: '100%', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.15s',
                  }}>
                    {loading
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', width: 16, height: 16 }} />
                          Please wait...
                        </span>
                      : mode === 'login' ? 'Sign In →' : 'Create Account →'}
                  </button>
                </form>
              )}
            </div>

            <p style={{ textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 20 }}>
              18+ only · Bet responsibly · For entertainment purposes
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .left-panel { display: none !important; }
          .mobile-logo { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-logo { display: none !important; }
        }
        input::placeholder { color: #475569 !important; }
        input:focus {
          border-color: rgba(22,163,74,0.5) !important;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important;
          outline: none !important;
        }
      `}</style>
    </>
  )
}