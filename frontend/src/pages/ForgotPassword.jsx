import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState('request') // 'request' | 'verify' | 'done'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '14px', fontFamily: 'var(--font-body)' }

  const handleRequestSubmit = async e => {
    e.preventDefault()
    setStatus('loading')
    try {
      await client.post('/accounts/password-reset/', { email })
    } catch {
      // Backend always returns success regardless - never reveal whether
      // an email is registered.
    }
    setStatus('')
    setStep('verify')
  }

  const handleVerifySubmit = async e => {
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
      await client.post('/accounts/password-reset-verify/', { email, code, new_password: newPassword })
      setStep('done')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setStatus('')
      setErrorMsg(err?.response?.data?.detail || 'That code is invalid or has expired. Please request a new one.')
    }
  }

  return (
    <div className="container" style={{ padding: '72px 24px', maxWidth: '400px' }}>
      <h1>Forgot Password</h1>

      {step === 'request' && (
        <>
          <p>Enter the email you registered with. We'll email you a 6-digit code and remind you of your username too.</p>
          <form onSubmit={handleRequestSubmit}>
            <label>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <button className="btn btn-gold" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending...' : 'Send code'}
            </button>
          </form>
        </>
      )}

      {step === 'verify' && (
        <>
          <p>Check your email (and spam folder) for a 6-digit code and your username reminder. Enter the code below along with a new password.</p>
          <form onSubmit={handleVerifySubmit}>
            <label>6-digit code</label>
            <input
              style={inputStyle} value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric" maxLength={6} placeholder="123456" required
            />
            <label>New password</label>
            <input style={inputStyle} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
            <label>Confirm new password</label>
            <input style={inputStyle} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
            {errorMsg && <p style={{ color: 'crimson' }}>{errorMsg}</p>}
            <button className="btn btn-gold" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Saving...' : 'Reset password'}
            </button>
          </form>
          <p style={{ marginTop: '14px', fontSize: '0.85rem' }}>
            <button onClick={() => setStep('request')} style={{ background: 'none', border: 'none', color: 'var(--color-indigo-700)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>
              Didn't get a code? Try again
            </button>
          </p>
        </>
      )}

      {step === 'done' && <p>Your password has been reset. Redirecting you to login...</p>}

      <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  )
}
