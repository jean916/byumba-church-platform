import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '14px', fontFamily: 'var(--font-body)' }

  const ADMIN_ROLES = ['SUPER_ADMIN', 'DIOCESE_ADMIN', 'PARISH_ADMIN', 'GROUP_LEADER']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      // useAuth's user state updates asynchronously via loadMe(); re-check
      // the freshest value straight from the API response by reading it
      // back from localStorage-driven state on next tick is avoided here -
      // login() already awaits loadMe(), so `user` in this closure may still
      // be stale on the very first render, but AuthContext exposes isAdmin
      // reliably right after - we just redirect to a router that decides.
      navigate('/account')
    } catch {
      setError('Incorrect username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: '72px 24px', maxWidth: '400px' }}>
      <h1>Log in</h1>
      <p>Members, group leaders, and admins all log in here.</p>
      <form onSubmit={handleSubmit}>
        <label>Username</label>
        <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} required />
        <label>Password</label>
        <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <p style={{ margin: '-8px 0 14px', fontSize: '0.85rem' }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button className="btn btn-gold" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
        Not a member yet? <a href="/register">Register here</a>.
      </p>
    </div>
  )
}
