import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const LEVELS = ['BISHOP', 'ARCHDEACON', 'PARISH_PASTOR', 'ASSISTANT_PASTOR', 'DEACON', 'EVANGELIST', 'OTHER']
const LEVEL_LABELS = {
  BISHOP: 'Bishop', ARCHDEACON: 'Archdeacon', PARISH_PASTOR: 'Parish Pastor',
  ASSISTANT_PASTOR: 'Assistant Pastor', DEACON: 'Deacon', EVANGELIST: 'Evangelist', OTHER: 'Other',
}

const emptyForm = { name: '', level: 'PARISH_PASTOR', parish: '', archdeaconry: '', contact_phone: '', contact_email: '', notes: '' }

const thStyle = { padding: '10px 14px', textAlign: 'left' }
const tdStyle = { padding: '10px 14px' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', background: 'var(--color-surface)', borderRadius: '10px', overflow: 'hidden', marginBottom: '32px' }
const headRowStyle = { background: 'var(--color-indigo-900)', color: 'white', textAlign: 'left' }
const rowStyle = { borderBottom: '1px solid var(--color-parchment)' }

export default function AdminLeadership() {
  const { user } = useAuth()
  const [clergy, setClergy] = useState([])
  const [parishes, setParishes] = useState([])
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')
  const [editingId, setEditingId] = useState(null)

  const canAdd = user?.role === 'SUPER_ADMIN' || user?.role === 'DIOCESE_ADMIN'

  const load = () => client.get('/dioceses/clergy/').then(r => setClergy(r.data)).catch(() => {})
  useEffect(() => {
    load()
    client.get('/dioceses/parishes/').then(r => setParishes(r.data))
    client.get('/content/groups/').then(r => setGroups(r.data))
  }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('saving')
    try {
      const dioceseId = user?.diocese || parishes[0]?.diocese
      const payload = { ...form, diocese: dioceseId, parish: form.parish || null }
      if (editingId) {
        await client.patch(`/dioceses/clergy/${editingId}/`, payload)
      } else {
        await client.post('/dioceses/clergy/', payload)
      }
      setForm(emptyForm)
      setEditingId(null)
      setStatus('done')
      load()
    } catch {
      setStatus('error')
    }
  }

  const startEdit = c => {
    setEditingId(c.id)
    setForm({
      name: c.name, level: c.level, parish: c.parish || '', archdeaconry: c.archdeaconry,
      contact_phone: c.contact_phone, contact_email: c.contact_email, notes: c.notes,
    })
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm) }

  const handleDelete = async id => {
    if (!confirm('Remove this person from the clergy directory?')) return
    await client.delete(`/dioceses/clergy/${id}/`)
    load()
  }

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }

  const archdeaconries = parishes.reduce((acc, p) => {
    if (!p.archdeaconry) return acc
    acc[p.archdeaconry] = acc[p.archdeaconry] || { archdeacon: p.archdeacon_name, parishes: [] }
    acc[p.archdeaconry].parishes.push(p.name)
    return acc
  }, {})

  const groupLeaders = groups.filter(g => g.leader_name)

  // Sorted so Bishop appears first, then Archdeacon, then pastors in order -
  // one continuous table instead of separate cards per level.
  const sortedClergy = [...clergy].sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level))

  return (
    <div>
      <h1>Leadership</h1>

      <h2>Bishop, Archdeacons &amp; Pastors</h2>
      <table style={tableStyle}>
        <thead>
          <tr style={headRowStyle}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Level</th>
            <th style={thStyle}>Parish / Archdeaconry</th>
            <th style={thStyle}>Contact</th>
            {canAdd && <th style={thStyle}></th>}
          </tr>
        </thead>
        <tbody>
          {sortedClergy.map(c => {
            const parishName = parishes.find(p => p.id === c.parish)?.name
            return (
              <tr key={c.id} style={rowStyle}>
                <td style={tdStyle}>{c.name}</td>
                <td style={tdStyle}>{LEVEL_LABELS[c.level]}</td>
                <td style={tdStyle}>{parishName || c.archdeaconry || '—'}</td>
                <td style={tdStyle}>{c.contact_phone || c.contact_email || '—'}</td>
                {canAdd && (
                  <td style={tdStyle}>
                    <button onClick={() => startEdit(c)} style={{ background: 'none', border: '1px solid var(--color-indigo-900)', color: 'var(--color-indigo-900)', borderRadius: '4px', padding: '3px 10px', fontSize: '0.8rem', marginRight: '6px' }}>Edit</button>
                    <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: '1px solid crimson', color: 'crimson', borderRadius: '4px', padding: '3px 10px', fontSize: '0.8rem' }}>Remove</button>
                  </td>
                )}
              </tr>
            )
          })}
          {sortedClergy.length === 0 && <tr><td colSpan={5} style={tdStyle}>No clergy added yet.</td></tr>}
        </tbody>
      </table>

      {canAdd && (
        <>
          <h3>{editingId ? 'Edit clergy' : 'Add clergy'}</h3>
          <form onSubmit={handleSubmit} style={{ maxWidth: '420px', marginBottom: '40px' }}>
            <label>Name</label>
            <input style={inputStyle} name="name" value={form.name} onChange={handleChange} required />
            <label>Level</label>
            <select style={inputStyle} name="level" value={form.level} onChange={handleChange}>
              {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
            </select>
            <label>Parish (leave blank for diocese-wide roles like Bishop)</label>
            <select style={inputStyle} name="parish" value={form.parish} onChange={handleChange}>
              <option value="">— Diocese-wide —</option>
              {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label>Archdeaconry (if applicable)</label>
            <input style={inputStyle} name="archdeaconry" value={form.archdeaconry} onChange={handleChange} placeholder="e.g. Byumba Archdeaconry" />
            <label>Contact phone</label>
            <input style={inputStyle} name="contact_phone" value={form.contact_phone} onChange={handleChange} placeholder="07XXXXXXXX" inputMode="numeric" maxLength={10} />
            <label>Contact email</label>
            <input style={inputStyle} name="contact_email" value={form.contact_email} onChange={handleChange} />
            <label>Notes</label>
            <input style={inputStyle} name="notes" value={form.notes} onChange={handleChange} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-gold" type="submit" disabled={status === 'saving'}>{editingId ? 'Save changes' : 'Add to directory'}</button>
              {editingId && <button type="button" onClick={cancelEdit} className="btn btn-outline" style={{ color: 'var(--color-indigo-900)', borderColor: 'var(--color-indigo-900)' }}>Cancel</button>}
            </div>
            {status === 'error' && <p style={{ color: 'crimson' }}>Something went wrong — check the fields and try again.</p>}
          </form>
        </>
      )}

      <h2>Archdeaconries</h2>
      <table style={tableStyle}>
        <thead>
          <tr style={headRowStyle}>
            <th style={thStyle}>Archdeaconry</th>
            <th style={thStyle}>Archdeacon</th>
            <th style={thStyle}>Parishes</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(archdeaconries).map(([name, info]) => (
            <tr key={name} style={rowStyle}>
              <td style={tdStyle}>{name}</td>
              <td style={tdStyle}>{info.archdeacon || '—'}</td>
              <td style={tdStyle}>{info.parishes.length} parishes: {info.parishes.join(', ')}</td>
            </tr>
          ))}
          {Object.keys(archdeaconries).length === 0 && <tr><td colSpan={3} style={tdStyle}>No archdeaconry info yet — add it on each parish's record.</td></tr>}
        </tbody>
      </table>

      <h2>Group Leaders</h2>
      <table style={tableStyle}>
        <thead>
          <tr style={headRowStyle}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Contact</th>
          </tr>
        </thead>
        <tbody>
          {groupLeaders.map(g => (
            <tr key={g.id} style={rowStyle}>
              <td style={tdStyle}>{g.leader_name}</td>
              <td style={tdStyle}>{g.group_type === 'CHOIR' ? 'President' : 'Leader'} of {g.name}</td>
              <td style={tdStyle}>{g.leader_contact || '—'}</td>
            </tr>
          ))}
          {groupLeaders.length === 0 && <tr><td colSpan={3} style={tdStyle}>No group leaders recorded yet.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
