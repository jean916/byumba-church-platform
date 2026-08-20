import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const emptyForm = { parish: '', group: '', title_en: '', title_rw: '', description_en: '', description_rw: '', start_time: '', location: '' }

export default function AdminEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [parishes, setParishes] = useState([])
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')

  const load = () => client.get('/content/events/').then(r => setEvents(r.data)).catch(() => {})
  useEffect(() => {
    load()
    client.get('/dioceses/parishes/').then(r => {
      setParishes(r.data)
      setForm(f => ({ ...f, parish: user?.parish || r.data[0]?.id || '' }))
    })
    client.get('/content/groups/').then(r => setGroups(r.data))
  }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('saving')
    try {
      await client.post('/content/events/', { ...form, group: form.group || null })
      setForm(f => ({ ...emptyForm, parish: f.parish }))
      setStatus('done')
      load()
    } catch {
      setStatus('error')
    }
  }

  const handleDelete = async id => {
    if (!confirm('Delete this event?')) return
    await client.delete(`/content/events/${id}/`)
    load()
  }

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }

  return (
    <div>
      <h1>Events</h1>
      <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
        {events.map(e => (
          <div key={e.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0 }}>{e.title_en}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{new Date(e.start_time).toLocaleString()} {e.location && `— ${e.location}`}</p>
              {e.description_en && <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{e.description_en}</p>}
            </div>
            <button onClick={() => handleDelete(e.id)} style={{ background: 'none', border: '1px solid crimson', color: 'crimson', borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem' }}>Delete</button>
          </div>
        ))}
        {events.length === 0 && <p>No events yet.</p>}
      </div>

      <h2>New event</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '480px' }}>
        <label>Parish</label>
        <select style={inputStyle} name="parish" value={form.parish} onChange={handleChange} required>
          {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label>Related group (optional)</label>
        <select style={inputStyle} name="group" value={form.group} onChange={handleChange}>
          <option value="">— None —</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <label>Title (English)</label>
        <input style={inputStyle} name="title_en" value={form.title_en} onChange={handleChange} required />
        <label>Title (Kinyarwanda)</label>
        <input style={inputStyle} name="title_rw" value={form.title_rw} onChange={handleChange} />
        <label>Description (English)</label>
        <textarea style={{ ...inputStyle, minHeight: '70px' }} name="description_en" value={form.description_en} onChange={handleChange} />
        <label>Description (Kinyarwanda)</label>
        <textarea style={{ ...inputStyle, minHeight: '70px' }} name="description_rw" value={form.description_rw} onChange={handleChange} />
        <label>Date &amp; time</label>
        <input style={inputStyle} type="datetime-local" name="start_time" value={form.start_time} onChange={handleChange} required />
        <label>Location</label>
        <input style={inputStyle} name="location" value={form.location} onChange={handleChange} />
        <button className="btn btn-gold" type="submit" disabled={status === 'saving'}>Add event</button>
        {status === 'error' && <p style={{ color: 'crimson' }}>Something went wrong — check the fields and try again.</p>}
      </form>
    </div>
  )
}
