import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import client from '../api/client'

export default function ResetPasswordConfirm() {
  const { uid, token } = useParams()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '14px', fontFamily: 'var(--font-body)' }

  const handleSubmit = async e => {
    e.preventDefault()
    setErrorMsg('')

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords don't match.")
      return
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters.')
      return
    }

    setStatus('loading')
    try {
      await client.post('/accounts/password-reset-confirm/', { uid, token, new_password: newPassword })
      setStatus('done')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err?.response?.data?.detail || 'This reset link is invalid or has expired. Please request a new one.')
    }
  }

  return (
    <div className="container" style={{ padding: '72px 24px', maxWidth: '400px' }}>
      <h1>Set a New Password</h1>
      {status === 'done' ? (
        <p>Your password has been reset. Redirecting you to login...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>New password</label>
          <input style={inputStyle} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
          <label>Confirm new password</label>
          <input style={inputStyle} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
          {errorMsg && <p style={{ color: 'crimson' }}>{errorMsg}</p>}
          <button className="btn btn-gold" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Saving...' : 'Reset password'}
          </button>
        </form>
      )}
      <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  )
}
