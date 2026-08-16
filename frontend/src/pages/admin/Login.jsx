import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '14px', fontFamily: 'var(--font-body)' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/admin')
    } catch {
      setError('Incorrect username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: '72px 24px', maxWidth: '400px' }}>
      <h1>Admin Login</h1>
      <p>For parish admins, diocese admins, and group leaders. Members should use the regular member login (coming soon).</p>
      <form onSubmit={handleSubmit}>
        <label>Username</label>
        <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} required />
        <label>Password</label>
        <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button className="btn btn-gold" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
