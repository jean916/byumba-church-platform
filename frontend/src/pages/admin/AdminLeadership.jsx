import { useEffect, useState } from 'react'
import client from '../../api/client'
import { explainError } from '../../api/errors'
import { prepareImage } from '../../api/images'
import { useAuth } from '../../context/AuthContext'

const LEVELS = ['BISHOP', 'ARCHDEACON', 'MOTHERS_UNION_LEADER', 'FATHERS_UNION_LEADER', 'PARISH_PASTOR', 'ASSISTANT_PASTOR', 'DEACON', 'EVANGELIST', 'OTHER']
// A Parish Admin may only record the people of their own parish.
const PARISH_ADMIN_LEVELS = ['PARISH_PASTOR', 'ASSISTANT_PASTOR', 'DEACON', 'EVANGELIST', 'OTHER']
const LEVEL_LABELS = {
  BISHOP: 'Bishop', ARCHDEACON: 'Archdeacon', PARISH_PASTOR: 'Parish Pastor',
  ASSISTANT_PASTOR: 'Assistant Pastor', DEACON: 'Deacon', EVANGELIST: 'Evangelist', OTHER: 'Other',
  MOTHERS_UNION_LEADER: "Mothers' Union leader (diocese)", FATHERS_UNION_LEADER: "Fathers' Union leader (diocese)",
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
  const [photoFile, setPhotoFile] = useState(null)
  const [currentPhoto, setCurrentPhoto] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const isParishAdmin = user?.role === 'PARISH_ADMIN'
  const canAdd = user?.role === 'SUPER_ADMIN' || user?.role === 'DIOCESE_ADMIN' || isParishAdmin
  const levelOptions = isParishAdmin ? PARISH_ADMIN_LEVELS : LEVELS
  // Parish Admins can change only the people of their own parish.
  const canEditRow = c => !isParishAdmin || (c.parish === user.parish && PARISH_ADMIN_LEVELS.includes(c.level))

  const load = () => client.get('/dioceses/clergy/').then(r => setClergy(r.data)).catch(() => {})
  useEffect(() => {
    if (isParishAdmin && user.parish) setForm(f => ({ ...f, parish: user.parish }))
    load()
    client.get('/dioceses/parishes/').then(r => setParishes(r.data))
    client.get('/content/groups/').then(r => setGroups(r.data))
  }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')
    try {
      const dioceseId = user?.diocese || parishes[0]?.diocese
      const parish = isParishAdmin ? user.parish : form.parish
      const data = new FormData()
      Object.entries({ ...form, diocese: dioceseId, parish: parish || '' }).forEach(([k, v]) => data.append(k, v ?? ''))
      if (photoFile) data.append('photo', await prepareImage(photoFile))
      const config = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (editingId) {
        await client.patch(`/dioceses/clergy/${editingId}/`, data, config)
      } else {
        await client.post('/dioceses/clergy/', data, config)
      }
      setForm(isParishAdmin ? { ...emptyForm, parish: user.parish } : emptyForm)
      setPhotoFile(null)
      setCurrentPhoto(null)
      setEditingId(null)
      setStatus('done')
      load()
    } catch (err) {
      setErrorMsg(explainError(err))
      setStatus('error')
    }
  }

  const startEdit = c => {
    setEditingId(c.id)
    setPhotoFile(null)
    setCurrentPhoto(c.photo)
    setForm({
      name: c.name, level: c.level, parish: c.parish || '', archdeaconry: c.archdeaconry,
      contact_phone: c.contact_phone, contact_email: c.contact_email, notes: c.notes,
    })
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  const cancelEdit = () => { setEditingId(null); setPhotoFile(null); setCurrentPhoto(null); setForm(isParishAdmin ? { ...emptyForm, parish: user.parish } : emptyForm) }

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

      <h2>Bishop, Archdeacons, Pastors &amp; Leaders</h2>
      <p>Photos, phone numbers, emails and notes you enter here are shown publicly on the About page and the parish pages. Leave a field empty to keep it private.</p>
      <div className="table-scroll"><table style={tableStyle}>
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
                <td style={tdStyle}>
                  {c.photo && <img src={c.photo} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: '8px' }} />}
                  {c.name}
                </td>
                <td style={tdStyle}>{LEVEL_LABELS[c.level]}</td>
                <td style={tdStyle}>{parishName || c.archdeaconry || '—'}</td>
                <td style={tdStyle}>{c.contact_phone || c.contact_email || '—'}</td>
                {canAdd && (
                  <td style={tdStyle}>
                    {canEditRow(c) && <>
                    <button onClick={() => startEdit(c)} style={{ background: 'none', border: '1px solid var(--color-indigo-900)', color: 'var(--color-indigo-900)', borderRadius: '4px', padding: '3px 10px', fontSize: '0.8rem', marginRight: '6px' }}>Edit</button>
                    <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: '1px solid crimson', color: 'crimson', borderRadius: '4px', padding: '3px 10px', fontSize: '0.8rem' }}>Remove</button>
                    </>}
                  </td>
                )}
              </tr>
            )
          })}
          {sortedClergy.length === 0 && <tr><td colSpan={5} style={tdStyle}>Nobody added yet.</td></tr>}
        </tbody>
      </table></div>

      {canAdd && (
        <>
          <h3>{editingId ? 'Edit clergy' : 'Add clergy'}</h3>
          <form onSubmit={handleSubmit} style={{ maxWidth: '420px', marginBottom: '40px' }}>
            <label>Name</label>
            <input style={inputStyle} name="name" value={form.name} onChange={handleChange} required />
            <label>Level</label>
            <select style={inputStyle} name="level" value={form.level} onChange={handleChange}>
              {levelOptions.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
            </select>
            <label>{isParishAdmin ? 'Parish' : 'Parish (leave blank for diocese-wide roles like Bishop)'}</label>
            <select style={inputStyle} name="parish" value={isParishAdmin ? user.parish : form.parish} onChange={handleChange} disabled={isParishAdmin} required={isParishAdmin}>
              {!isParishAdmin && <option value="">— Diocese-wide —</option>}
              {parishes.filter(p => !isParishAdmin || p.id === user.parish).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label>Photo {currentPhoto && <img src={currentPhoto} alt="Current photo" style={{ height: '36px', width: '36px', objectFit: 'cover', borderRadius: '50%', verticalAlign: 'middle', marginLeft: '8px' }} />}</label>
            <input style={inputStyle} type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
            <p style={{ fontSize: '0.8rem', marginTop: '-4px' }}>For the Mothers' Union / Fathers' Union leaders you can upload a photo of the leader, or of the Cathedral or diocese instead.</p>
            <label>Archdeaconry (if applicable)</label>
            <input style={inputStyle} name="archdeaconry" value={form.archdeaconry} onChange={handleChange} placeholder="e.g. Byumba Archdeaconry" />
            <label>Contact phone</label>
            <input style={inputStyle} name="contact_phone" value={form.contact_phone} onChange={handleChange} placeholder="07XXXXXXXX" inputMode="numeric" maxLength={10} />
            <label>Contact email</label>
            <input style={inputStyle} name="contact_email" value={form.contact_email} onChange={handleChange} />
            <label>Notes (shown publicly)</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', font: 'inherit' }} name="notes" value={form.notes} onChange={handleChange} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-gold" type="submit" disabled={status === 'saving'}>{editingId ? 'Save changes' : 'Add to directory'}</button>
              {editingId && <button type="button" onClick={cancelEdit} className="btn btn-outline" style={{ color: 'var(--color-indigo-900)', borderColor: 'var(--color-indigo-900)' }}>Cancel</button>}
            </div>
            {status === 'error' && <p style={{ color: 'crimson' }}>{errorMsg}</p>}
            {status === 'saving' && <p style={{ fontSize: '0.85rem' }}>Saving… large photos are shrunk first, which can take a moment.</p>}
          </form>
        </>
      )}

      <h2>Archdeaconries</h2>
      <div className="table-scroll"><table style={tableStyle}>
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
      </table></div>

      <h2>Group Leaders</h2>
      <div className="table-scroll"><table style={tableStyle}>
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
      </table></div>
    </div>
  )
}
