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
      if (res.status === 401 || res.status === 403) {
        router.push('/dashboard')
        return
      }
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
      setAuthorized(true)
    } catch {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    fetchUsers()
  }, [fetchUsers, router])

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoading(userId + action)
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId, action }),
      })
      await fetchUsers()
    } finally {
      setActionLoading(null) }
  }

  const pending = users.filter(u => u.status === 'pending' && !u.isAdmin)
  const approved = users.filter(u => u.status === 'approved' && !u.isAdmin)
  const rejected = users.filter(u => u.status === 'rejected')

  const statusColor = (s: string) =>
    s === 'approved' ? '#22c55e' : s === 'pending' ? '#eab308' : '#ef4444'

  if (!authorized && !loading) return null

  return (
    <>
      <Head><title>SportyAI Admin</title></Head>
      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <nav style={{
          borderBottom: '1px solid var(--border)', padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,10,0.8)', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>
            Sporty<span style={{ color: 'var(--accent)' }}>AI</span>
            <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8, fontWeight: 400 }}>Admin Panel</span>
          </span>
          <button className="btn-secondary" onClick={() => router.push('/dashboard')}
            style={{ padding: '6px 14px', fontSize: 12 }}>
            ← Back to Dashboard
          </button>
        </nav>

        <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <span className="spinner" />
              <p style={{ color: 'var(--text2)', marginTop: 16, fontSize: 14 }}>Loading admin panel...</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
                {[
                  { label: 'PENDING APPROVAL', value: pending.length, color: '#eab308' },
                  { label: 'APPROVED USERS', value: approved.length, color: '#22c55e' },
                  { label: 'REJECTED', value: rejected.length, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {pending.length > 0 && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#eab308', marginBottom: 14, letterSpacing: '0.05em' }}>
                    ⏳ PENDING APPROVAL ({pending.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pending.map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 8, background: 'var(--yellow-dim)', border: '1px solid rgba(234,179,8,0.2)' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{u.username}</div>
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{u.email}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                            Registered: {new Date(u.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleAction(u.id, 'approve')}
                            disabled={actionLoading === u.id + 'approve'}
                            style={{ background: '#22c55e', color: '#041a08', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            {actionLoading === u.id + 'approve' ? '...' : '✓ Approve'}
                          </button>
                          <button onClick={() => handleAction(u.id, 'reject')}
                            disabled={actionLoading === u.id + 'reject'}
                            style={{ background: 'var(--red-dim)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            {actionLoading === u.id + 'reject' ? '...' : '✗ Reject'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 14, letterSpacing: '0.05em' }}>
                  ALL USERS ({users.filter(u => !u.isAdmin).length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {users.filter(u => !u.isAdmin).map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.username}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{u.email}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                          {new Date(u.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(u.status), background: `${statusColor(u.status)}20`, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                          {u.status}
                        </span>
                        {u.status === 'pending' && (
                          <button onClick={() => handleAction(u.id, 'approve')}
                            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Approve
                          </button>
                        )}
                        {u.status === 'approved' && (
                          <button onClick={() => handleAction(u.id, 'reject')}
                            style={{ background: 'var(--red-dim)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Revoke
                          </button>
                        )}
                        {u.status === 'rejected' && (
                          <button onClick={() => handleAction(u.id, 'approve')}
                            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.filter(u => !u.isAdmin).length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 20, fontSize: 13 }}>
                      No users yet
                    </div>
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