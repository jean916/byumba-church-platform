import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useDiocese } from '../context/DioceseContext'

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '12px', font: 'inherit' }

export default function Contact() {
  const { t } = useTranslation()
  const diocese = useDiocese()
  const { user } = useAuth()

  const [form, setForm] = useState({
    name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
    email: user?.email || '',
    phone: '', message: '', website: '',
  })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error | limit

  if (!diocese) return <div className="container" style={{ padding: '56px 24px' }}>…</div>

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('sending')
    try {
      await client.post('/dioceses/contact/', { ...form, diocese: diocese.id })
      setForm({ ...form, message: '', phone: '' })
      setStatus('sent')
    } catch (err) {
      setStatus(err?.response?.status === 429 ? 'limit' : 'error')
    }
  }

  const parishPhones = (diocese.parishes || []).filter(p => p.contact_phone)
  const social = [
    ['Facebook', diocese.facebook_url],
    ['Instagram', diocese.instagram_url],
    ['TikTok', diocese.tiktok_url],
  ].filter(([, url]) => url)
  const hasDetails = diocese.contact_phone || diocese.contact_email || diocese.office_address || diocese.office_hours

  const info = (label, content) => (
    <div className="card">
      <p style={{ margin: '0 0 4px', fontSize: '0.85rem' }}>{label}</p>
      <div style={{ fontWeight: 600, color: 'var(--color-ink)', overflowWrap: 'anywhere' }}>{content}</div>
    </div>
  )

  return (
    <div className="container" style={{ padding: '56px 24px', maxWidth: '860px' }}>
      <h1>{t('contact.title')}</h1>
      <p style={{ fontSize: '1.05rem' }}>{t('contact.intro')}</p>

      {hasDetails && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', margin: '24px 0' }}>
          {diocese.contact_phone && info(t('contact.phone'), <a href={`tel:${diocese.contact_phone}`}>{diocese.contact_phone}</a>)}
          {diocese.contact_email && info(t('contact.email'), <a href={`mailto:${diocese.contact_email}`}>{diocese.contact_email}</a>)}
          {diocese.office_address && info(t('contact.address'), (
            <>
              <span style={{ whiteSpace: 'pre-line' }}>{diocese.office_address}</span>
              {diocese.map_url && <><br /><a href={diocese.map_url} target="_blank" rel="noreferrer">{t('contact.map')} →</a></>}
            </>
          ))}
          {diocese.office_hours && info(t('contact.hours'), diocese.office_hours)}
        </div>
      )}

      {diocese.contact_email && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2>{t('contact.form_title')}</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="c-name">{t('contact.name')}</label>
            <input id="c-name" style={inputStyle} name="name" value={form.name} onChange={handleChange} required maxLength={100} />
            <label htmlFor="c-email">{t('contact.email_label')}</label>
            <input id="c-email" style={inputStyle} type="email" name="email" value={form.email} onChange={handleChange} required />
            <label htmlFor="c-phone">{t('contact.phone_label')}</label>
            <input id="c-phone" style={inputStyle} name="phone" value={form.phone} onChange={handleChange} inputMode="tel" maxLength={20} />
            <label htmlFor="c-message">{t('contact.message')}</label>
            <textarea id="c-message" style={{ ...inputStyle, minHeight: '140px' }} name="message" value={form.message} onChange={handleChange} required minLength={5} maxLength={2000} />
            {/* Honeypot: invisible to people, bots fill it in and get ignored. */}
            <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
              <label>Website <input name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" /></label>
            </div>
            <button className="btn btn-gold" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? t('contact.sending') : t('contact.send')}
            </button>
            {status === 'sent' && <p role="status" style={{ color: 'var(--color-hill-green-light)', marginTop: '12px', fontWeight: 600 }}>{t('contact.sent')}</p>}
            {status === 'error' && <p role="alert" style={{ color: '#b00020', marginTop: '12px' }}>{t('contact.error')}</p>}
            {status === 'limit' && <p role="alert" style={{ color: '#b00020', marginTop: '12px' }}>{t('contact.too_many')}</p>}
          </form>
        </div>
      )}

      {parishPhones.length > 0 && (
        <>
          <h2>{t('contact.parish_title')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {parishPhones.map(p => (
              <div key={p.id} className="card" style={{ padding: '14px 18px' }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-ink)' }}>{p.name}</p>
                <a href={`tel:${p.contact_phone}`}>{p.contact_phone}</a>
              </div>
            ))}
          </div>
        </>
      )}

      {social.length > 0 && (
        <p style={{ marginTop: '32px' }}>
          <strong>{t('contact.follow')}:</strong>{' '}
          {social.map(([name, url], i) => (
            <span key={name}>{i > 0 && ' · '}<a href={url} target="_blank" rel="noreferrer">{name}</a></span>
          ))}
        </p>
      )}

      {!hasDetails && parishPhones.length === 0 && social.length === 0 && (
        <div className="card"><p style={{ margin: 0 }}>{t('contact.soon')}</p></div>
      )}
    </div>
  )
}
