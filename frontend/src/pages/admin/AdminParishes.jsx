import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const emptyForm = { name: '', slug: '', location: '', parish_pastor: '', service_times: '', contact_phone: '', archdeaconry: '', archdeacon_name: '' }

// Shared field list for both the "Add" form and the inline "Edit" form.
function ParishFields({ form, onChange, inputStyle }) {
  return (
    <>
      <label>Name</label>
      <input style={inputStyle} name="name" value={form.name} onChange={onChange} required />
      <label>Slug (short web-address name)</label>
      <input style={inputStyle} name="slug" value={form.slug} onChange={onChange} required />
      <label>Location</label>
      <input style={inputStyle} name="location" value={form.location} onChange={onChange} />
      <label>Archdeaconry</label>
      <input style={inputStyle} name="archdeaconry" value={form.archdeaconry} onChange={onChange} placeholder="e.g. Byumba Archdeaconry" />
      <label>Archdeacon (Ven.)</label>
      <input style={inputStyle} name="archdeacon_name" value={form.archdeacon_name} onChange={onChange} placeholder="e.g. Ven. Dismas Ngendabanga" />
      <label>Parish pastor</label>
      <input style={inputStyle} name="parish_pastor" value={form.parish_pastor} onChange={onChange} />
      <label>Service times</label>
      <input style={inputStyle} name="service_times" value={form.service_times} onChange={onChange} />
      <label>Contact phone</label>
      <input style={inputStyle} name="contact_phone" value={form.contact_phone} onChange={onChange} placeholder="07XXXXXXXX" inputMode="numeric" maxLength={10} />
    </>
  )
}

export default function AdminParishes() {
  const { user } = useAuth()
  const [parishes, setParishes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [photoFile, setPhotoFile] = useState(null)
  const [dioceseId, setDioceseId] = useState(user?.diocese || '')
  const [status, setStatus] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editPhotoFile, setEditPhotoFile] = useState(null)
  const [editStatus, setEditStatus] = useState('')

  const canAdd = user?.role === 'SUPER_ADMIN' || user?.role === 'DIOCESE_ADMIN'
  const canEdit = canAdd // same permission level for now

  const load = () => client.get('/dioceses/parishes/').then(r => setParishes(r.data))
  useEffect(() => { load() }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })
  const handleEditChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('saving')
    try {
      const data = new FormData()
      Object.entries({ ...form, diocese: dioceseId }).forEach(([k, v]) => data.append(k, v))
      if (photoFile) data.append('photo', photoFile)

      await client.post('/dioceses/parishes/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm(emptyForm)
      setPhotoFile(null)
      setStatus('done')
      load()
    } catch {
      setStatus('error')
    }
  }

  const startEdit = p => {
    setEditingId(p.id)
    setEditForm({
      name: p.name, slug: p.slug, location: p.location, parish_pastor: p.parish_pastor,
      service_times: p.service_times, contact_phone: p.contact_phone,
      archdeaconry: p.archdeaconry, archdeacon_name: p.archdeacon_name,
    })
    setEditPhotoFile(null)
    setEditStatus('')
  }

  const cancelEdit = () => { setEditingId(null); setEditStatus('') }

  const handleEditSubmit = async e => {
    e.preventDefault()
    setEditStatus('saving')
    try {
      const data = new FormData()
      Object.entries(editForm).forEach(([k, v]) => data.append(k, v))
      if (editPhotoFile) data.append('photo', editPhotoFile)

      await client.patch(`/dioceses/parishes/${editingId}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setEditingId(null)
      load()
    } catch {
      setEditStatus('error')
    }
  }

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }

  const grouped = parishes.reduce((acc, p) => {
    const key = p.archdeaconry || 'Unassigned'
    acc[key] = acc[key] || []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <div>
      <h1>Parishes</h1>
      {Object.entries(grouped).map(([archdeaconry, list]) => (
        <div key={archdeaconry} style={{ marginBottom: '28px' }}>
          <h3 style={{ marginBottom: '4px' }}>{archdeaconry}</h3>
          {list[0]?.archdeacon_name && <p style={{ fontSize: '0.85rem', marginTop: 0 }}>Archdeacon: {list[0].archdeacon_name}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {list.map(p => (
              <div key={p.id} className="card">
                {editingId === p.id ? (
                  <form onSubmit={handleEditSubmit}>
                    <ParishFields form={editForm} onChange={handleEditChange} inputStyle={inputStyle} />
                    <label>Replace photo (optional)</label>
                    <input style={inputStyle} type="file" accept="image/*" onChange={e => setEditPhotoFile(e.target.files[0])} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-gold" type="submit" disabled={editStatus === 'saving'} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Save</button>
                      <button type="button" onClick={cancelEdit} className="btn btn-outline" style={{ color: 'var(--color-indigo-900)', borderColor: 'var(--color-indigo-900)', padding: '6px 14px', fontSize: '0.85rem' }}>Cancel</button>
                    </div>
                    {editStatus === 'error' && <p style={{ color: 'crimson', fontSize: '0.85rem' }}>Something went wrong.</p>}
                  </form>
                ) : (
                  <>
                    {p.photo && (
                      <img src={p.photo} alt={p.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />
                    )}
                    <h3 style={{ margin: 0 }}>{p.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{p.location}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{p.parish_pastor}</p>
                    {canEdit && (
                      <button onClick={() => startEdit(p)} className="btn btn-outline" style={{ marginTop: '10px', color: 'var(--color-indigo-900)', borderColor: 'var(--color-indigo-900)', padding: '5px 12px', fontSize: '0.8rem' }}>Edit</button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {canAdd ? (
        <>
          <h2>Add a parish</h2>
          <form onSubmit={handleSubmit} style={{ maxWidth: '420px' }}>
            <ParishFields form={form} onChange={handleChange} inputStyle={inputStyle} />
            <label>Photo (optional)</label>
            <input style={inputStyle} type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
            <button className="btn btn-gold" type="submit" disabled={status === 'saving'}>Add parish</button>
            {status === 'error' && <p style={{ color: 'crimson' }}>Something went wrong — check the fields and try again.</p>}
          </form>
        </>
      ) : (
        <p>Only Diocese Admins can add new parishes.</p>
      )}
    </div>
  )
}
