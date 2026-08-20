import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const emptyForm = { parish: '', title: '', preacher_name: '', date_preached: new Date().toISOString().slice(0, 10), scripture_reference: '', summary: '', video_url: '', audio_url: '' }

export default function AdminSermons() {
  const { user } = useAuth()
  const [sermons, setSermons] = useState([])
  const [parishes, setParishes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')

  const load = () => client.get('/content/sermons/').then(r => setSermons(r.data)).catch(() => {})
  useEffect(() => {
    load()
    client.get('/dioceses/parishes/').then(r => setParishes(r.data))
  }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('saving')
    try {
      const dioceseId = user?.diocese || parishes[0]?.diocese
      await client.post('/content/sermons/', { ...form, diocese: dioceseId, parish: form.parish || null })
      setForm(f => ({ ...emptyForm, parish: f.parish }))
      setStatus('done')
      load()
    } catch {
      setStatus('error')
    }
  }

  const handleDelete = async id => {
    if (!confirm('Delete this sermon?')) return
    await client.delete(`/content/sermons/${id}/`)
    load()
  }

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }

  return (
    <div>
      <h1>Sermons</h1>
      <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
        {sermons.map(s => (
          <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0 }}>{s.title}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{s.date_preached} {s.preacher_name && `— ${s.preacher_name}`}</p>
              {s.scripture_reference && <p style={{ margin: 0, fontSize: '0.9rem' }}>{s.scripture_reference}</p>}
              {s.video_url && <p style={{ margin: 0, fontSize: '0.85rem' }}>🎬 <a href={s.video_url} target="_blank" rel="noreferrer">Video link</a></p>}
              {s.audio_url && <p style={{ margin: 0, fontSize: '0.85rem' }}>🎧 <a href={s.audio_url} target="_blank" rel="noreferrer">Audio link</a></p>}
            </div>
            <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: '1px solid crimson', color: 'crimson', borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem' }}>Delete</button>
          </div>
        ))}
        {sermons.length === 0 && <p>No sermons added yet.</p>}
      </div>

      <h2>New sermon</h2>
      <p style={{ fontSize: '0.85rem' }}>For video/audio, paste a link (e.g. YouTube, SoundCloud) rather than uploading a file — large media files aren't practical to host directly.</p>
      <form onSubmit={handleSubmit} style={{ maxWidth: '480px' }}>
        <label>Parish (leave blank for diocese-wide)</label>
        <select style={inputStyle} name="parish" value={form.parish} onChange={handleChange}>
          <option value="">— Diocese-wide —</option>
          {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label>Title</label>
        <input style={inputStyle} name="title" value={form.title} onChange={handleChange} required />
        <label>Preacher</label>
        <input style={inputStyle} name="preacher_name" value={form.preacher_name} onChange={handleChange} />
        <label>Date preached</label>
        <input style={inputStyle} type="date" name="date_preached" value={form.date_preached} onChange={handleChange} required />
        <label>Scripture reference</label>
        <input style={inputStyle} name="scripture_reference" value={form.scripture_reference} onChange={handleChange} placeholder="e.g. John 3:16-21" />
        <label>Summary</label>
        <textarea style={{ ...inputStyle, minHeight: '80px' }} name="summary" value={form.summary} onChange={handleChange} />
        <label>Video link (optional)</label>
        <input style={inputStyle} name="video_url" value={form.video_url} onChange={handleChange} placeholder="https://youtube.com/..." />
        <label>Audio link (optional)</label>
        <input style={inputStyle} name="audio_url" value={form.audio_url} onChange={handleChange} placeholder="https://..." />
        <button className="btn btn-gold" type="submit" disabled={status === 'saving'}>Add sermon</button>
        {status === 'error' && <p style={{ color: 'crimson' }}>Something went wrong — check the fields and try again.</p>}
      </form>
    </div>
  )
}
