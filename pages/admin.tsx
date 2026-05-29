import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

interface User {
  id: string
  username: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  isAdmin: boolean
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { headers: authHeaders() })
      if (res.status === 401 || res.status === 403) { router.push('/dashboard'); return }
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
      setAuthorized(true)
    } catch { router.push('/dashboard') }
    finally { setLoading(false) }
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    fetchUsers()
  }, [fetchUsers, router])

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoading(userId + action)
    try {
      await fetch('/api/admin/users', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ userId, action }) })
      await fetchUsers()
    } finally { setActionLoading(null) }
  }

  const nonAdminUsers = users.filter(u => !u.isAdmin)
  const pending = nonAdminUsers.filter(u => u.status === 'pending')
  const approved = nonAdminUsers.filter(u => u.status === 'approved')
  const rejected = nonAdminUsers.filter(u => u.status === 'rejected')

  const statusColor = (s: string) => s === 'approved' ? '#16a34a' : s === 'pending' ? '#d97706' : '#dc2626'
  const statusBg = (s: string) => s === 'approved' ? 'rgba(22,163,74,0.08)' : s === 'pending' ? 'rgba(217,119,6,0.08)' : 'rgba(220,38,38,0.08)'

  if (!authorized && !loading) return null

  return (
    <>
      <Head><title>SportyAI Admin</title></Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '0 16px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 15 }}>Sporty<span style={{ color: 'var(--accent)' }}>AI</span></span>
              <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>Admin</span>
            </div>
          </div>
          <button className="btn-secondary" onClick={() => router.push('/dashboard')}
            style={{ padding: '6px 12px', fontSize: 12 }}>
            ← Dashboard
          </button>
        </nav>

        <main style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 40px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <span className="spinner" />
              <p style={{ color: 'var(--text2)', marginTop: 12, fontSize: 14 }}>Loading...</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'Total', value: users.length, color: 'var(--navy)' },
                  { label: 'Pending', value: pending.length, color: '#d97706' },
                  { label: 'Active', value: approved.length, color: '#16a34a' },
                  { label: 'Rejected', value: rejected.length, color: '#dc2626' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4 }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Pending */}
              {pending.length > 0 && (
                <div className="card" style={{ marginBottom: 14, border: '1.5px solid rgba(217,119,6,0.3)', background: 'rgba(217,119,6,0.02)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 12, letterSpacing: '0.04em' }}>
                    ⏳ PENDING APPROVAL ({pending.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pending.map(u => (
                      <div key={u.id} style={{ background: '#fff', borderRadius: 10, padding: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{u.username}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>{u.email} · {new Date(u.createdAt).toLocaleDateString()}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleAction(u.id, 'approve')}
                            disabled={actionLoading === u.id + 'approve'}
                            style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            {actionLoading === u.id + 'approve' ? '...' : '✓ Approve'}
                          </button>
                          <button onClick={() => handleAction(u.id, 'reject')}
                            disabled={actionLoading === u.id + 'reject'}
                            style={{ flex: 1, padding: '10px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            {actionLoading === u.id + 'reject' ? '...' : '✗ Reject'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Users */}
              <div className="card">
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 12, letterSpacing: '0.04em' }}>
                  ALL USERS ({users.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {users.map(u => (
                    <div key={u.id} style={{ background: u.isAdmin ? 'rgba(22,163,74,0.04)' : 'var(--bg)', borderRadius: 10, padding: '12px', border: u.isAdmin ? '1px solid rgba(22,163,74,0.2)' : '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{u.username}</span>
                            {u.isAdmin && <span style={{ fontSize: 10, background: 'var(--accent)', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>ADMIN</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Joined {new Date(u.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginLeft: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: u.isAdmin ? 'var(--accent)' : statusColor(u.status), background: u.isAdmin ? 'var(--accent-dim)' : statusBg(u.status), padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                            {u.isAdmin ? 'Admin' : u.status}
                          </span>
                          {!u.isAdmin && u.status === 'approved' && (
                            <button onClick={() => handleAction(u.id, 'reject')}
                              style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                              Revoke
                            </button>
                          )}
                          {!u.isAdmin && u.status === 'pending' && (
                            <button onClick={() => handleAction(u.id, 'approve')}
                              style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                              Approve
                            </button>
                          )}
                          {!u.isAdmin && u.status === 'rejected' && (
                            <button onClick={() => handleAction(u.id, 'approve')}
                              style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 20, fontSize: 13 }}>No users yet</div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}