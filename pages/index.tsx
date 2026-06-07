import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter()
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setPending(false)
    const endpoint = showAuth === 'login' ? '/api/auth/login' : '/api/auth/register'
    const body = showAuth === 'login'
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
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      if (data.token) localStorage.setItem('token', data.token)
      if (data.user?.subscriptionExpiry) localStorage.setItem('subscriptionExpiry', data.user.subscriptionExpiry)
      if (data.user?.subscriptionWaived) localStorage.setItem('subscriptionWaived', String(data.user.subscriptionWaived))
      localStorage.setItem('freeAnalysisUsed', String(data.user?.freeAnalysisUsed || false))
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <>
      <Head>
        <title>Groove Slip — Where Sharp Minds Meet Sharper Picks</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Bet slip analyser for SportyBet Nigeria. Remove bad eggs, replace risky picks, get smarter codes." />
      </Head>

      <div style={{ background: '#0d1f0e', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>

        {/* NAV */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(13,31,14,0.95)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo.png" alt="Groove Slip" width={30} height={30} style={{ objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>
              Groove <span style={{ color: '#4ade80' }}>Slip</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowAuth('login')}
              style={{ padding: '9px 18px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Sign In
            </button>
            <button onClick={() => setShowAuth('register')}
              style={{ padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(22,163,74,0.4)' }}>
              Get Started Free
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ padding: '80px 24px 60px', textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 20, padding: '6px 14px', marginBottom: 28, fontSize: 12, color: '#4ade80', fontWeight: 600 }}>
            ⚡ Your Slip. Stripped of Bad Picks
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Stop losing slips to<br />
            <span style={{ background: 'linear-gradient(135deg,#4ade80,#16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>bad eggs</span>
          </h1>
          <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
            Paste your SportyBet booking code. We read every pick, remove the weak ones, replace risky selections with safer options, and hand you a brand new code — in seconds.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowAuth('register')}
              style={{ padding: '14px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(22,163,74,0.4)' }}>
              🎁 Try Free — 1 Free Analysis
            </button>
            <button onClick={() => setShowAuth('login')}
              style={{ padding: '14px 28px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Sign In →
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 14 }}>
            No credit card required · 1 free analysis · ₦2,500/month after
          </p>
        </section>

        {/* BEFORE/AFTER */}
        <section style={{ padding: '20px 24px 60px', maxWidth: 720, margin: '0 auto' }}>
          <div className="before-after-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>

            {/* Before */}
            <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 12, letterSpacing: '0.06em' }}>❌ BEFORE — Original Slip</div>
              {[
                { match: 'PSG vs Arsenal', pick: 'Away Win', odds: '3.31', risk: 'high' },
                { match: 'Boca Jr vs CD Univ', pick: 'Away Win', odds: '6.75', risk: 'high' },
                { match: 'SE Palmeiras vs CD Jr', pick: 'Home Win', odds: '1.22', risk: 'low' },
                { match: 'Cerro vs Cristal', pick: 'Home Win', odds: '1.67', risk: 'low' },
              ].map(g => (
                <div key={g.match} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: g.risk === 'high' ? '#f87171' : '#e2e8f0' }}>{g.match}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{g.pick}</div>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: g.risk === 'high' ? '#f87171' : '#94a3b8' }}>{g.odds}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Total Odds</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#f87171' }}>98.64</span>
              </div>
            </div>

            {/* GS Edit Badge */}
            <div className="gs-edit-badge" style={{ textAlign: 'center' }}>
              <Image src="/logo.png" alt="Groove Slip" width={40} height={40} style={{ objectFit: 'contain' }} />
              <div style={{ fontSize: 10, color: '#475569', marginTop: 6, fontWeight: 600 }}>GS<br />EDIT</div>
            </div>

            {/* After */}
            <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', marginBottom: 12, letterSpacing: '0.06em' }}>✅ AFTER — Cleaned Slip</div>
              {[
                { match: 'PSG vs Arsenal', pick: 'Draw/Away DC', odds: '1.45', changed: true },
                { match: 'SE Palmeiras vs CD Jr', pick: 'Home Win', odds: '1.22', changed: false },
                { match: 'Cerro vs Cristal', pick: 'Home Win', odds: '1.67', changed: false },
              ].map(g => (
                <div key={g.match} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {g.match}
                      {g.changed && <span style={{ fontSize: 9, background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>CHANGED</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{g.pick}</div>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{g.odds}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Total Odds</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#4ade80' }}>2.97</span>
              </div>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginTop: 16 }}>
            Boca Juniors removed (6.75 odds, poor away form). Arsenal pick replaced with safer Draw/Away.
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: '60px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>How it works</h2>
            <p style={{ color: '#64748b', marginBottom: 48, fontSize: 15 }}>Three steps. Thirty seconds. Smarter slip.</p>
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { step: '01', icon: '📋', title: 'Paste Your Code', desc: 'Enter your SportyBet booking code. We decode every pick instantly.' },
                { step: '02', icon: '📊', title: 'Deep Match Analysis', desc: 'We check real form, H2H, injuries and stats for every game on your slip.' },
                { step: '03', icon: '⚡', title: 'Get Smarter Code', desc: 'Bad eggs removed. Risky picks replaced. Fresh booking code ready.' },
              ].map(item => (
                <div key={item.step} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '24px 18px' }}>
                  <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginBottom: 12, letterSpacing: '0.08em' }}>{item.step}</div>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ padding: '60px 24px', maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8, textAlign: 'center', letterSpacing: '-0.02em' }}>Built for serious punters</h2>
          <p style={{ color: '#64748b', marginBottom: 48, fontSize: 15, textAlign: 'center' }}>Every feature designed to protect your slip</p>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { icon: '📊', title: 'Real Match Data', desc: 'BSD and Sofascore databases with live form, H2H and injury reports' },
              { icon: '🔄', title: 'Smart Replacements', desc: 'Risky picks swapped for safer alternatives — Over 2.5 becomes Over 1.5' },
              { icon: '🗑️', title: 'Bad Egg Removal', desc: 'Games with poor form, injuries or bad H2H removed automatically' },
              { icon: '⚡', title: 'Instant New Code', desc: 'Fresh SportyBet booking code generated in seconds' },
              { icon: '🎯', title: 'Target Odds', desc: 'Set your desired odds — we edit the slip to match as closely as possible' },
              { icon: '📱', title: 'Works on Phone', desc: 'Mobile-first design, install as app, works on any Android or iPhone' },
            ].map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section style={{ padding: '60px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>Simple pricing</h2>
            <p style={{ color: '#64748b', marginBottom: 36, fontSize: 15 }}>One plan. Everything included.</p>
            <div style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(22,163,74,0.05))', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 20, padding: '32px 28px' }}>
              <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 700, marginBottom: 16, letterSpacing: '0.06em' }}>MONTHLY PLAN</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 18, color: '#64748b', fontWeight: 600 }}>₦</span>
                <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>2,500</span>
                <span style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>/month</span>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Cancel anytime. No contracts.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' }}>
                {[
                  'Unlimited slip analyses',
                  'Smart pick replacement',
                  'Real-time match data',
                  'Fresh booking codes',
                  'Win/loss tracking',
                  'Priority support',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#e2e8f0' }}>
                    <span style={{ color: '#4ade80', fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAuth('register')}
                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 20px rgba(22,163,74,0.4)' }}>
                Start with 1 Free Analysis
              </button>
              <p style={{ fontSize: 11, color: '#475569', marginTop: 12 }}>First analysis is completely free. No card needed.</p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: '32px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            <Image src="/logo.png" alt="Groove Slip" width={28} height={28} style={{ objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Groove <span style={{ color: '#4ade80' }}>Slip</span></span>
          </div>
          <p style={{ fontSize: 12, color: '#334155', marginBottom: 8 }}>
            18+ only · Bet responsibly · For entertainment purposes only
          </p>
          <a href="https://wa.me/2349075520182" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>
            💬 Support on WhatsApp
          </a>
        </footer>

        {/* AUTH MODAL */}
        {showAuth && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}>
            <div style={{
              background: '#111', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '28px 24px', maxWidth: 380, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>
                  {showAuth === 'login' ? 'Welcome back' : 'Create account'}
                </h3>
                <button onClick={() => { setShowAuth(null); setError(''); setPending(false) }}
                  style={{ background: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer', border: 'none' }}>×</button>
              </div>

              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4, marginBottom: 20 }}>
                {(['login', 'register'] as const).map(m => (
                  <button key={m} onClick={() => { setShowAuth(m); setError(''); setPending(false) }}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 6, fontSize: 13,
                      fontWeight: showAuth === m ? 700 : 500,
                      background: showAuth === m ? 'rgba(22,163,74,0.2)' : 'transparent',
                      color: showAuth === m ? '#4ade80' : '#64748b',
                      border: showAuth === m ? '1px solid rgba(22,163,74,0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                    }}>
                    {m === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {showAuth === 'register' && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>USERNAME</label>
                      <input type="text" placeholder="e.g. punter_king"
                        value={form.username}
                        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '12px 14px', fontSize: 14, width: '100%', outline: 'none' }}
                        required />
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>EMAIL</label>
                    <input type="email" placeholder="your@email.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '12px 14px', fontSize: 14, width: '100%', outline: 'none' }}
                      required />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>PASSWORD</label>
                    <input type="password" placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '12px 14px', fontSize: 14, width: '100%', outline: 'none' }}
                      required />
                  </div>
                  {error && (
                    <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '10px 12px', color: '#f87171', fontSize: 13 }}>
                      ⚠ {error}
                    </div>
                  )}
                  <button type="submit" disabled={loading}
                    style={{ marginTop: 4, padding: '13px', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Please wait...' : showAuth === 'login' ? 'Sign In →' : 'Create Account →'}
                  </button>
                  {showAuth === 'register' && (
                    <p style={{ fontSize: 11, color: '#475569', textAlign: 'center' }}>
                      First analysis free. ₦2,500/month after.
                    </p>
                  )}
                </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: #475569 !important; }
        input:focus { border-color: rgba(22,163,74,0.5) !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; }
        @media (max-width: 600px) {
          h1 { font-size: 32px !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .before-after-grid {
            grid-template-columns: 1fr !important;
          }
          .gs-edit-badge {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            padding: 8px 0;
          }
        }
      `}</style>
    </>
  )
}