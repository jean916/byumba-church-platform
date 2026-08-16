import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import client from '../api/client'

export default function Register() {
  const { t } = useTranslation()
  const [parishes, setParishes] = useState([])
  const [status, setStatus] = useState(null)
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '',
    phone_number: '', parish: '', password: '',
  })

  useEffect(() => {
    client.get('/dioceses/parishes/').then(r => setParishes(r.data)).catch(() => {})
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await client.post('/accounts/register/', form)
      setStatus('success')
    } catch (err) {
      setStatus('error')
    }
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '14px', fontFamily: 'var(--font-body)' }

  return (
    <div className="container" style={{ padding: '56px 24px', maxWidth: '480px' }}>
      <h1>{t('register.title')}</h1>
      {status === 'success' ? (
        <p>Murakoze! Your account was created — Webasabwe! Konti yawe yashyizweho.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>{t('register.first_name')}</label>
          <input style={inputStyle} name="first_name" value={form.first_name} onChange={handleChange} required />
          <label>{t('register.last_name')}</label>
          <input style={inputStyle} name="last_name" value={form.last_name} onChange={handleChange} required />
          <label>{t('register.username')}</label>
          <input style={inputStyle} name="username" value={form.username} onChange={handleChange} required />
          <label>{t('register.email')}</label>
          <input style={inputStyle} type="email" name="email" value={form.email} onChange={handleChange} />
          <label>{t('register.phone')}</label>
          <input style={inputStyle} name="phone_number" value={form.phone_number} onChange={handleChange} />
          <label>{t('register.parish')}</label>
          <select style={inputStyle} name="parish" value={form.parish} onChange={handleChange} required>
            <option value="">—</option>
            {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label>{t('register.password')}</label>
          <input style={inputStyle} type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} />
          <button className="btn btn-gold" type="submit" disabled={status === 'loading'}>
            {t('register.submit')}
          </button>
          {status === 'error' && <p style={{ color: 'crimson' }}>Something went wrong — please check the fields and try again.</p>}
        </form>
      )}
    </div>
  )
}
