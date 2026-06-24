// components/ProfileCard.tsx
// Drop this into your dashboard — shows user profile + subscription tier

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

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

interface Props {
  onSubscribe: (tier: 'basic' | 'pro') => void
}

export function ProfileCard({ onSubscribe }: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  useEffect(() => {
    fetch('/api/profile', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setFullName(data.fullName || '')
        setPhone(data.phone || '')
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ fullName, phone }),
      })
      setProfile(prev => prev ? { ...prev, fullName, phone } : prev)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  if (!profile) return null

  const tierColor = (t: string) => t === 'pro' ? '#16a34a' : t === 'basic' ? '#2563eb' : '#94a3b8'
  const tierBg = (t: string) => t === 'pro' ? 'rgba(22,163,74,0.1)' : t === 'basic' ? 'rgba(37,99,235,0.1)' : 'rgba(148,163,184,0.1)'
  const tierLabel = (t: string) => t === 'pro' ? '⭐ Pro' : t === 'basic' ? '🔵 Basic' : '🔒 Free'

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, border: '1px solid #e8ede8', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#1a3d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#4ade80', fontWeight: 800 }}>
            {(profile.fullName || profile.username)[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f2010' }}>{profile.fullName || profile.username}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>@{profile.username}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: tierBg(profile.subscriptionTier), color: tierColor(profile.subscriptionTier) }}>
            {tierLabel(profile.subscriptionTier)}
          </span>
          <button onClick={() => setEditing(!editing)} style={{ fontSize: 11, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: editing ? 14 : 0 }}>
        <div style={{ background: '#f8faf8', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 2 }}>SLIPS</div>
          <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: '#1a3d1e' }}>{profile.slipsOptimised}</div>
        </div>
        <div style={{ background: '#f8faf8', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 2 }}>JOINED</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#1a3d1e' }}>{new Date(profile.joinDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}</div>
        </div>
        <div style={{ background: '#f8faf8', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 2 }}>LAST ACTIVE</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#1a3d1e' }}>{new Date(profile.lastActive).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ marginTop: 12 }}>
          <input type="text" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e8ede8', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
          <input type="tel" placeholder="Phone number (optional)" value={phone} onChange={e => setPhone(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e8ede8', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', padding: 10, background: saving ? '#94a3b8' : '#1a3d1e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Upgrade prompt for free/basic users */}
      {profile.subscriptionTier === 'free' && (
        <div style={{ marginTop: 14, background: 'rgba(26,61,30,0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(26,61,30,0.12)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2010', marginBottom: 4 }}>🔓 Unlock Groove Slip</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Get access to the Slip Editor, Daily Banker, and Accumulator Builder.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onSubscribe('basic')}
              style={{ flex: 1, padding: '9px 0', background: '#fff', color: '#2563eb', border: '1.5px solid #2563eb', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Basic ₦1,500/mo
            </button>
            <button onClick={() => onSubscribe('pro')}
              style={{ flex: 1, padding: '9px 0', background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Pro ₦2,500/mo ⭐
            </button>
          </div>
        </div>
      )}

      {profile.subscriptionTier === 'basic' && (
        <div style={{ marginTop: 14, background: 'rgba(37,99,235,0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(37,99,235,0.12)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2010', marginBottom: 4 }}>⭐ Upgrade to Pro</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Unlock Daily Banker and Accumulator Builder — our most profitable features.</div>
          <button onClick={() => onSubscribe('pro')}
            style={{ width: '100%', padding: '10px 0', background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Upgrade to Pro — ₦2,500/month
          </button>
        </div>
      )}
    </div>
  )
}