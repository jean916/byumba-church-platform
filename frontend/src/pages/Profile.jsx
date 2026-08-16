import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const ADMIN_ROLES = ['SUPER_ADMIN', 'DIOCESE_ADMIN', 'PARISH_ADMIN', 'GROUP_LEADER']

export default function Profile() {
  const { user, loading, logout } = useAuth()
  const [offerings, setOfferings] = useState([])

  useEffect(() => {
    if (user) client.get('/offerings/').then(r => setOfferings(r.data)).catch(() => {})
  }, [user])

  if (loading) return <div className="container" style={{ padding: '56px 24px' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  // Admins/leaders have their own richer dashboard - send them there instead.
  if (ADMIN_ROLES.includes(user.role)) return <Navigate to="/admin" replace />

  const total = offerings.reduce((sum, o) => sum + Number(o.amount_rwf), 0)

  return (
    <div className="container" style={{ padding: '56px 24px', maxWidth: '640px' }}>
      <h1>My Account</h1>
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0 }}>{user.first_name} {user.last_name}</h3>
        <p style={{ margin: 0 }}>Username: {user.username}</p>
        {user.email && <p style={{ margin: 0 }}>Email: {user.email}</p>}
        {user.phone_number && <p style={{ margin: 0 }}>Phone: {user.phone_number}</p>}
      </div>

      <h2>My contributions</h2>
      <p style={{ fontSize: '0.9rem' }}>Only you and your parish's admin can see this list — it's private.</p>
      <div className="card" style={{ marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>Total given (RWF)</p>
        <h2 style={{ margin: 0 }}>{total.toLocaleString()}</h2>
      </div>
      <div style={{ display: 'grid', gap: '10px' }}>
        {offerings.length === 0 && <p>No contributions logged yet.</p>}
        {offerings.map(o => (
          <div key={o.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{o.date_given} — {o.purpose}</span>
            <strong>{Number(o.amount_rwf).toLocaleString()} RWF</strong>
          </div>
        ))}
      </div>

      <button onClick={logout} className="btn btn-outline" style={{ marginTop: '32px', color: 'var(--color-indigo-900)', borderColor: 'var(--color-indigo-900)' }}>
        Log out
      </button>
    </div>
  )
}
