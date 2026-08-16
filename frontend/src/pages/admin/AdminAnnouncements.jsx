import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const emptyForm = { diocese: '', parish: '', title_en: '', title_rw: '', body_en: '', body_rw: '', is_pinned: false }

export default function AdminAnnouncements() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [parishes, setParishes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')

  const load = () => client.get('/content/announcements/').then(r => setItems(r.data))
  useEffect(() => {
    load()
    client.get('/dioceses/parishes/').then(r => {
      setParishes(r.data)
      const dioceseId = r.data[0]?.diocese
      setForm(f => ({ ...f, diocese: user?.diocese || dioceseId || '', parish: user?.parish || '' }))
    })
  }, [])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('saving')
    try {
      const payload = { ...form, parish: form.parish || null }
      await client.post('/content/announcements/', payload)
      setForm(f => ({ ...emptyForm, diocese: f.diocese, parish: f.parish }))
      setStatus('done')
      load()
    } catch {
      setStatus('error')
    }
  }

  const handleDelete = async id => {
    if (!confirm('Delete this announcement?')) return
    await client.delete(`/content/announcements/${id}/`)
    load()
  }

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }

  return (
    <div>
      <h1>Announcements</h1>
      <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
        {items.map(a => (
          <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0 }}>{a.title_en} {a.is_pinned && '📌'}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{a.body_en}</p>
            </div>
            <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: '1px solid crimson', color: 'crimson', borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem' }}>Delete</button>
          </div>
        ))}
      </div>

      <h2>New announcement</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '480px' }}>
        <label>Parish (leave blank for diocese-wide)</label>
        <select style={inputStyle} name="parish" value={form.parish} onChange={handleChange}>
          <option value="">— Diocese-wide —</option>
          {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label>Title (English)</label>
        <input style={inputStyle} name="title_en" value={form.title_en} onChange={handleChange} required />
        <label>Title (Kinyarwanda)</label>
        <input style={inputStyle} name="title_rw" value={form.title_rw} onChange={handleChange} />
        <label>Body (English)</label>
        <textarea style={{ ...inputStyle, minHeight: '80px' }} name="body_en" value={form.body_en} onChange={handleChange} required />
        <label>Body (Kinyarwanda)</label>
        <textarea style={{ ...inputStyle, minHeight: '80px' }} name="body_rw" value={form.body_rw} onChange={handleChange} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <input type="checkbox" name="is_pinned" checked={form.is_pinned} onChange={handleChange} /> Pin to top
        </label>
        <button className="btn btn-gold" type="submit" disabled={status === 'saving'}>Publish announcement</button>
        {status === 'error' && <p style={{ color: 'crimson' }}>Something went wrong — check the fields and try again.</p>}
      </form>
    </div>
  )
}
