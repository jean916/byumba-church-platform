import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function DashboardLayout() {
  const { user, logout } = useAuth()

  const linkStyle = ({ isActive }) => ({
    display: 'block',
    padding: '10px 16px',
    borderRadius: '6px',
    color: isActive ? 'var(--color-indigo-950)' : 'var(--color-ink-soft)',
    background: isActive ? 'var(--color-gold-light)' : 'transparent',
    fontWeight: 600,
    marginBottom: '4px',
  })

  return (
    <div style={{ display: 'flex', minHeight: '70vh' }}>
      <aside style={{ width: '220px', background: 'var(--color-parchment)', padding: '24px 16px', flexShrink: 0 }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-soft)', marginBottom: '4px' }}>Logged in as</p>
        <p style={{ fontWeight: 700, marginBottom: '20px' }}>{user?.first_name || user?.username} <br /><span style={{ fontWeight: 400, fontSize: '0.85rem' }}>{user?.role}</span></p>
        <nav>
          <NavLink to="/admin" end style={linkStyle}>Overview</NavLink>
          <NavLink to="/admin/parishes" style={linkStyle}>Parishes</NavLink>
          <NavLink to="/admin/groups" style={linkStyle}>Groups</NavLink>
          <NavLink to="/admin/announcements" style={linkStyle}>Announcements</NavLink>
          <NavLink to="/admin/events" style={linkStyle}>Events</NavLink>
          <NavLink to="/admin/sermons" style={linkStyle}>Sermons</NavLink>
          <NavLink to="/admin/leadership" style={linkStyle}>Leadership</NavLink>
          <NavLink to="/admin/offerings" style={linkStyle}>Offerings</NavLink>
          <NavLink to="/admin/campaigns" style={linkStyle}>Campaigns</NavLink>
        </nav>
        <button onClick={logout} className="btn btn-outline" style={{ marginTop: '24px', color: 'var(--color-indigo-900)', borderColor: 'var(--color-indigo-900)', width: '100%' }}>
          Log out
        </button>
      </aside>
      <div style={{ flex: 1, padding: '32px' }}>
        <Outlet />
      </div>
    </div>
  )
}
