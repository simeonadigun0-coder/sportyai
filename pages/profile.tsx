import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'

interface Profile {
  username: string
  email: string
  fullName: string
  phone: string
  subscriptionTier: 'free' | 'basic' | 'pro'
  joinDate: string
  slipsOptimised: number
  lastActive: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    fetch('/api/profile', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.error) { router.push('/'); return }
        setProfile(data)
        setFullName(data.fullName || '')
        setPhone(data.phone || '')
        setLoading(false)
      })
      .catch(() => { router.push('/') })
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ fullName, phone }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setProfile(prev => prev ? { ...prev, fullName, phone } : prev)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save changes')
    }
    setSaving(false)
  }

  const handleSubscribe = async (tier: 'basic' | 'pro') => {
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.authorizationUrl) window.location.href = data.authorizationUrl
    } catch {}
  }

  const logout = async () => {
    await fetch('/api/auth/logout')
    localStorage.clear()
    router.push('/')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>Loading profile...</div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const tierColor = (t: string) => t === 'pro' ? '#16a34a' : t === 'basic' ? '#2563eb' : '#64748b'
  const tierBg = (t: string) => t === 'pro' ? 'rgba(22,163,74,0.1)' : t === 'basic' ? 'rgba(37,99,235,0.1)' : 'rgba(100,116,139,0.1)'
  const tierLabel = (t: string) => t === 'pro' ? '⭐ Pro Member' : t === 'basic' ? '🔵 Basic Member' : '🔒 Free'
  const tierDesc = (t: string) => t === 'pro' ? 'Full access — Slip Editor, Daily Banker & Builder' : t === 'basic' ? 'Slip Editor access only' : 'No active subscription'

  return (
    <>
      <Head>
        <title>Groove Slip — Profile</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#f0f4f0', fontFamily: 'Inter, sans-serif' }}>

        {/* NAV */}
        <nav style={{ background: '#1a3d1e', padding: '0 16px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/logo.png" alt="Groove Slip" width={28} height={28} style={{ objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Groove <span style={{ color: '#4ade80' }}>Slip</span></span>
          </div>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </nav>

        <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 100px' }}>

          {/* Profile Hero */}
          <div style={{ background: 'linear-gradient(135deg,#1a3d1e,#15803d)', borderRadius: 20, padding: '28px 24px', marginBottom: 16, textAlign: 'center', position: 'relative' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 auto 14px' }}>
              {(profile.fullName || profile.username)[0].toUpperCase()}
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 4 }}>
              {profile.fullName || profile.username}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>@{profile.username}</div>
            <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' }}>
              {tierLabel(profile.subscriptionTier)}
            </span>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Slips Optimised', value: profile.slipsOptimised, icon: '⚡' },
              { label: 'Member Since', value: new Date(profile.joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), icon: '📅' },
              { label: 'Last Active', value: new Date(profile.lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), icon: '🕐' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 10px', textAlign: 'center', border: '1px solid #e8ede8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#0f2010', marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Subscription Status */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e8ede8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 14 }}>SUBSCRIPTION</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f2010', marginBottom: 2 }}>{tierLabel(profile.subscriptionTier)}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{tierDesc(profile.subscriptionTier)}</div>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: 20, background: tierBg(profile.subscriptionTier), color: tierColor(profile.subscriptionTier), fontSize: 12, fontWeight: 700 }}>
                {profile.subscriptionTier.toUpperCase()}
              </span>
            </div>

            {profile.subscriptionTier === 'free' && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 12, fontWeight: 600 }}>Choose a plan to get started:</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, border: '1.5px solid #e8ede8', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, marginBottom: 4 }}>Basic</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#0f2010', marginBottom: 2 }}>₦1,500</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>/month</div>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>Slip Editor only</div>
                    <button onClick={() => handleSubscribe('basic')}
                      style={{ width: '100%', padding: '9px 0', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Get Basic
                    </button>
                  </div>
                  <div style={{ flex: 1, border: '2px solid #16a34a', borderRadius: 12, padding: 14, textAlign: 'center', background: '#f0faf0' }}>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>Pro ⭐</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#0f2010', marginBottom: 2 }}>₦2,500</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>/month</div>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>Everything included</div>
                    <button onClick={() => handleSubscribe('pro')}
                      style={{ width: '100%', padding: '9px 0', background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Get Pro
                    </button>
                  </div>
                </div>
              </div>
            )}

            {profile.subscriptionTier === 'basic' && (
              <div style={{ marginTop: 14, background: 'rgba(37,99,235,0.04)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(37,99,235,0.15)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2010', marginBottom: 4 }}>⭐ Upgrade to Pro</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Unlock Daily Banker and Accumulator Builder — our most profitable features.</div>
                <button onClick={() => handleSubscribe('pro')}
                  style={{ width: '100%', padding: 12, background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Upgrade to Pro — ₦2,500/month
                </button>
              </div>
            )}

            {profile.subscriptionTier === 'pro' && (
              <div style={{ marginTop: 14, background: 'rgba(22,163,74,0.06)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(22,163,74,0.15)' }}>
                <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>✅ You have full access to all features</div>
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e8ede8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>PERSONAL INFORMATION</div>
              {!editing && (
                <button onClick={() => setEditing(true)}
                  style={{ fontSize: 12, color: '#1a3d1e', background: 'rgba(26,61,30,0.06)', border: 'none', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
                  ✏️ Edit
                </button>
              )}
            </div>

            {!editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Full Name', value: profile.fullName || '—' },
                  { label: 'Username', value: `@${profile.username}` },
                  { label: 'Email Address', value: profile.email },
                  { label: 'Phone Number', value: profile.phone || '—' },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #f0f4f0' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: '#0f2010', fontWeight: 600 }}>{f.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>FULL NAME</label>
                  <input type="text" placeholder="Enter your full name" value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e8ede8', fontSize: 14, color: '#0f2010', boxSizing: 'border-box', background: '#f8faf8' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>PHONE NUMBER</label>
                  <input type="tel" placeholder="e.g. 08012345678" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e8ede8', fontSize: 14, color: '#0f2010', boxSizing: 'border-box', background: '#f8faf8' }} />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Email and username cannot be changed</div>
                {error && <div style={{ fontSize: 13, color: '#dc2626' }}>⚠ {error}</div>}
                {saved && <div style={{ fontSize: 13, color: '#16a34a' }}>✅ Profile updated successfully</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setEditing(false); setError('') }}
                    style={{ flex: 1, padding: 12, background: '#fff', color: '#64748b', border: '1.5px solid #e8ede8', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    style={{ flex: 2, padding: 12, background: saving ? '#94a3b8' : '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e8ede8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 14 }}>ACCOUNT</div>
            <button onClick={logout}
              style={{ width: '100%', padding: 13, background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              🚪 Logout
            </button>
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <a href="https://wa.me/2349075520182" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>
                💬 Contact Support
              </a>
            </div>
          </div>
        </main>

        {/* Bottom Nav */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e8ede8', display: 'flex', padding: '10px 0 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', zIndex: 50 }}>
          <button onClick={() => router.push('/dashboard')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>⚡</span>Analyse
          </button>
          <button onClick={() => router.push('/value-bets')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>💎</span>Value Bet
          </button>
          <button onClick={() => router.push('/builder')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>🏗️</span>Builder
          </button>
          <button style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#1a3d1e', fontSize: 10, fontWeight: 700 }}>
            <span style={{ fontSize: 20 }}>👤</span>Profile
          </button>
        </div>
      </div>
    </>
  )
}