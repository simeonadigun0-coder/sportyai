// components/AdminUsersTable.tsx
// Add this to your existing admin page

import { useState, useEffect } from 'react'

interface AdminUser {
  id: string
  username: string
  email: string
  fullName?: string
  phone?: string
  subscriptionTier?: string
  subscriptionExpiry?: string | null
  joinDate?: string
  createdAt?: string
  lastActive?: string
  slipsOptimised?: number
  status?: string
}

type SortKey = keyof AdminUser
type SortDir = 'asc' | 'desc'

export function AdminUsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  useEffect(() => {
    fetch('/api/admin/users', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setUsers(data.users || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = users
    .filter(u => {
      if (!search) return true
      const s = search.toLowerCase()
      return u.email.toLowerCase().includes(s) ||
        (u.fullName || '').toLowerCase().includes(s) ||
        (u.username || '').toLowerCase().includes(s)
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })

  const tierColor = (t?: string) => t === 'pro' ? '#16a34a' : t === 'basic' ? '#2563eb' : '#94a3b8'
  const tierBg = (t?: string) => t === 'pro' ? 'rgba(22,163,74,0.1)' : t === 'basic' ? 'rgba(37,99,235,0.1)' : 'rgba(148,163,184,0.1)'

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <th onClick={() => handleSort(k)} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e8ede8', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2010' }}>👥 All Users ({filtered.length})</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Pro: {users.filter(u => u.subscriptionTier === 'pro').length} · Basic: {users.filter(u => u.subscriptionTier === 'basic').length} · Free: {users.filter(u => !u.subscriptionTier || u.subscriptionTier === 'free').length}</div>
        </div>
        <input type="text" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e8ede8', fontSize: 12, width: 200 }} />
      </div>

      {loading && <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</div>}

      {!loading && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8ede8' }}>
                <SortBtn k="fullName" label="Name" />
                <SortBtn k="email" label="Email" />
                <SortBtn k="phone" label="Phone" />
                <SortBtn k="subscriptionTier" label="Tier" />
                <SortBtn k="createdAt" label="Joined" />
                <SortBtn k="lastActive" label="Last Active" />
                <SortBtn k="slipsOptimised" label="Slips" />
                <SortBtn k="subscriptionExpiry" label="Expires" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f0f4f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f2010' }}>{u.fullName || u.username}</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>{u.email}</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>{u.phone || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: tierBg(u.subscriptionTier), color: tierColor(u.subscriptionTier) }}>
                      {u.subscriptionTier || 'free'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{u.lastActive ? new Date(u.lastActive).toLocaleDateString('en-GB') : '—'}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#1a3d1e', textAlign: 'center' }}>{u.slipsOptimised || 0}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {u.subscriptionExpiry ? new Date(u.subscriptionExpiry).toLocaleDateString('en-GB') : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}