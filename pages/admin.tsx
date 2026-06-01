import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

interface User {
  id: string
  username: string
  email: string
  status: 'pending' | 'approved' | 'rejected' | 'paused'
  isAdmin: boolean
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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

  const handleAction = async (userId: string, action: string) => {
    if (action === 'delete' && confirmDelete !== userId) {
      setConfirmDelete(userId)
      return
    }
    setActionLoading(userId + action)
    setConfirmDelete(null)
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId, action }),
      })
      await fetchUsers()
    } finally { setActionLoading(null) }
  }

  const nonAdminUsers = users.filter(u => !u.isAdmin)
  const pending = nonAdminUsers.filter(u => u.status === 'pending')
  const approved = nonAdminUsers.filter(u => u.status === 'approved')
  const paused = nonAdminUsers.filter(u => u.status === 'paused')
  const rejected = nonAdminUsers.filter(u => u.status === 'rejected')

  const statusColor = (s: string) => {
    if (s === 'approved') return '#16a34a'
    if (s === 'pending') return '#d97706'
    if (s === 'paused') return '#6366f1'
    return '#dc2626'
  }

  const statusBg = (s: string) => {
    if (s === 'approved') return 'rgba(22,163,74,0.08)'
    if (s === 'pending') return 'rgba(217,119,6,0.08)'
    if (s === 'paused') return 'rgba(99,102,241,0.08)'
    return 'rgba(220,38,38,0.08)'
  }

  if (!authorized && !loading) return null

  return (
    <>
      <Head><title>Groove Slip Admin</title></Head>
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
              <span style={{ fontWeight: 800, fontSize: 15 }}>Groove <span style={{ color: 'var(--accent)' }}>Slip</span></span>
              <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>Admin</span>
            </div>
          </div>
          <button className="btn-secondary" onClick={() => router.push('/dashboard')}
            style={{ padding: '6px 12px', fontSize: 12 }}>
            ← Dashboard
          </button>
        </nav>

        <main style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px 40px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <span className="spinner" />
              <p style={{ color: 'var(--text2)', marginTop: 12, fontSize: 14 }}>Loading...</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'Total', value: users.length, color: 'var(--navy)' },
                  { label: 'Pending', value: pending.length, color: '#d97706' },
                  { label: 'Active', value: approved.length, color: '#16a34a' },
                  { label: 'Paused', value: paused.length, color: '#6366f1' },
                  { label: 'Rejected', value: rejected.length, color: '#dc2626' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4 }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Pending Section */}
              {pending.length > 0 && (
                <div className="card" style={{ marginBottom: 14, border: '1.5px solid rgba(217,119,6,0.3)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 12 }}>
                    ⏳ PENDING APPROVAL ({pending.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pending.map(u => (
                      <div key={u.id} style={{ background: '#fff', borderRadius: 10, padding: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{u.username}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>{u.email} · {new Date(u.createdAt).toLocaleDateString()}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleAction(u.id, 'approve')}
                            disabled={!!actionLoading}
                            style={{ flex: 1, padding: '9px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            {actionLoading === u.id + 'approve' ? '...' : '✓ Approve'}
                          </button>
                          <button onClick={() => handleAction(u.id, 'reject')}
                            disabled={!!actionLoading}
                            style={{ flex: 1, padding: '9px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
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
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 14 }}>
                  ALL USERS ({users.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {users.map(u => (
                    <div key={u.id} style={{
                      background: u.isAdmin ? 'rgba(22,163,74,0.04)' : 'var(--bg)',
                      borderRadius: 10, padding: '12px',
                      border: u.isAdmin ? '1px solid rgba(22,163,74,0.2)' : '1px solid var(--border)',
                    }}>
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
                          {/* Status badge */}
                          <span style={{ fontSize: 11, fontWeight: 700, color: u.isAdmin ? 'var(--accent)' : statusColor(u.status), background: u.isAdmin ? 'var(--accent-dim)' : statusBg(u.status), padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                            {u.isAdmin ? 'Admin' : u.status}
                          </span>

                          {/* Action buttons */}
                          {!u.isAdmin && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {u.status === 'approved' && (
                                <>
                                  <button onClick={() => handleAction(u.id, 'pause')}
                                    style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                                    ⏸ Pause
                                  </button>
                                  <button onClick={() => handleAction(u.id, 'reject')}
                                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                                    Revoke
                                  </button>
                                </>
                              )}
                              {u.status === 'paused' && (
                                <>
                                  <button onClick={() => handleAction(u.id, 'unpause')}
                                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                                    ▶ Unpause
                                  </button>
                                  <button onClick={() => handleAction(u.id, 'reject')}
                                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                                    Revoke
                                  </button>
                                </>
                              )}
                              {u.status === 'pending' && (
                                <>
                                  <button onClick={() => handleAction(u.id, 'approve')}
                                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                                    Approve
                                  </button>
                                  <button onClick={() => handleAction(u.id, 'reject')}
                                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                                    Reject
                                  </button>
                                </>
                              )}
                              {u.status === 'rejected' && (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button onClick={() => handleAction(u.id, 'approve')}
                                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                                    Restore
                                  </button>
                                  {confirmDelete === u.id ? (
                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                      <span style={{ fontSize: 11, color: 'var(--red)' }}>Sure?</span>
                                      <button onClick={() => handleAction(u.id, 'delete')}
                                        style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--red)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                                        Yes, Delete
                                      </button>
                                      <button onClick={() => setConfirmDelete(null)}
                                        style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button onClick={() => handleAction(u.id, 'delete')}
                                      style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--red)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                                      🗑 Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
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