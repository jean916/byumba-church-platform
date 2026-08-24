import { useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '14px', fontFamily: 'var(--font-body)' }

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('loading')
    try {
      await client.post('/accounts/password-reset/', { email })
      setStatus('done')
    } catch {
      // Backend always returns success regardless, but just in case of a
      // network error, still show the same message - never reveal whether
      // an email is registered.
      setStatus('done')
    }
  }

  return (
    <div className="container" style={{ padding: '72px 24px', maxWidth: '400px' }}>
      <h1>Forgot Password</h1>
      {status === 'done' ? (
        <p>If an account with that email exists, we've sent a link to reset your password. Check your inbox (and spam folder).</p>
      ) : (
        <>
          <p>Enter the email you registered with, and we'll send you a link to reset your password.</p>
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <button className="btn btn-gold" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </>
      )}
      <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  )
}
