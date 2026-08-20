import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const emptyForm = { parish: '', group_type: 'YOUTH_UNION', name: '', description: '', leader_name: '', leader_contact: '' }
const GROUP_TYPES = ['MOTHERS_UNION', 'FATHERS_UNION', 'YOUTH_UNION', 'CHOIR', 'CHILDREN', 'GFS', 'OTHER']

// A small panel for managing a single group's members, songs, and photo
// gallery - built with choirs in mind, but works for any group.
function GroupManagePanel({ group, onClose, onChanged }) {
  const [memberName, setMemberName] = useState('')
  const [memberMarried, setMemberMarried] = useState(false)
  const [songTitle, setSongTitle] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoCaption, setPhotoCaption] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = () => onChanged()

  const addMember = async e => {
    e.preventDefault()
    if (!memberName.trim()) return
    setBusy(true)
    try {
      await client.post('/content/group-members/', { group: group.id, name: memberName, is_married: memberMarried })
      setMemberName(''); setMemberMarried(false)
      refresh()
    } finally { setBusy(false) }
  }

  const removeMember = async id => {
    await client.delete(`/content/group-members/${id}/`)
    refresh()
  }

  const addSong = async e => {
    e.preventDefault()
    if (!songTitle.trim()) return
    setBusy(true)
    try {
      await client.post('/content/songs/', { group: group.id, title: songTitle })
      setSongTitle('')
      refresh()
    } finally { setBusy(false) }
  }

  const removeSong = async id => {
    await client.delete(`/content/songs/${id}/`)
    refresh()
  }

  const addPhoto = async e => {
    e.preventDefault()
    if (!photoFile) return
    setBusy(true)
    try {
      const data = new FormData()
      data.append('group', group.id)
      data.append('image', photoFile)
      data.append('caption', photoCaption)
      await client.post('/content/group-photos/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      setPhotoFile(null); setPhotoCaption('')
      refresh()
    } finally { setBusy(false) }
  }

  const removePhoto = async id => {
    await client.delete(`/content/group-photos/${id}/`)
    refresh()
  }

  const inputStyle = { padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '8px' }

  return (
    <div style={{ background: 'var(--color-parchment)', borderRadius: '10px', padding: '20px', marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Managing: {group.name}</h3>
        <button onClick={onClose} className="btn btn-outline" style={{ color: 'var(--color-indigo-900)', borderColor: 'var(--color-indigo-900)', padding: '6px 14px' }}>Close</button>
      </div>

      <h4>Members ({group.members_list?.length || 0})</h4>
      <ul style={{ paddingLeft: '18px' }}>
        {group.members_list?.map(m => (
          <li key={m.id}>
            {m.name} — {m.is_married ? 'Married' : 'Not married'}{' '}
            <button onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', color: 'crimson', cursor: 'pointer', fontSize: '0.85rem' }}>remove</button>
          </li>
        ))}
      </ul>
      <form onSubmit={addMember} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
        <input style={inputStyle} placeholder="Member name" value={memberName} onChange={e => setMemberName(e.target.value)} />
        <label style={{ fontSize: '0.9rem', marginRight: '8px' }}>
          <input type="checkbox" checked={memberMarried} onChange={e => setMemberMarried(e.target.checked)} /> Married
        </label>
        <button className="btn btn-gold" style={{ padding: '6px 14px' }} disabled={busy}>Add member</button>
      </form>

      <h4 style={{ marginTop: '24px' }}>Songs ({group.songs?.length || 0})</h4>
      <ul style={{ paddingLeft: '18px' }}>
        {group.songs?.map(s => (
          <li key={s.id}>
            {s.title}{' '}
            <button onClick={() => removeSong(s.id)} style={{ background: 'none', border: 'none', color: 'crimson', cursor: 'pointer', fontSize: '0.85rem' }}>remove</button>
          </li>
        ))}
      </ul>
      <form onSubmit={addSong} style={{ display: 'flex', gap: '4px' }}>
        <input style={inputStyle} placeholder="Song title" value={songTitle} onChange={e => setSongTitle(e.target.value)} />
        <button className="btn btn-gold" style={{ padding: '6px 14px' }} disabled={busy}>Add song</button>
      </form>

      <h4 style={{ marginTop: '24px' }}>Photos ({group.photos?.length || 0})</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
        {group.photos?.map(p => (
          <div key={p.id} style={{ position: 'relative' }}>
            <img src={p.image} alt={p.caption} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px' }} />
            <button onClick={() => removePhoto(p.id)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'crimson', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.7rem' }}>×</button>
          </div>
        ))}
      </div>
      <form onSubmit={addPhoto} style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
        <input style={inputStyle} placeholder="Caption (optional)" value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} />
        <button className="btn btn-gold" style={{ padding: '6px 14px' }} disabled={busy}>Add photo</button>
      </form>
    </div>
  )
}

export default function AdminGroups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [parishes, setParishes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [photoFile, setPhotoFile] = useState(null)
  const [status, setStatus] = useState('')
  const [managingId, setManagingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editPhotoFile, setEditPhotoFile] = useState(null)
  const [editStatus, setEditStatus] = useState('')

  const load = () => client.get('/content/groups/').then(r => setGroups(r.data))
  useEffect(() => {
    load()
    client.get('/dioceses/parishes/').then(r => {
      setParishes(r.data)
      if (user?.parish) setForm(f => ({ ...f, parish: user.parish }))
      else if (r.data.length) setForm(f => ({ ...f, parish: r.data[0].id }))
    })
  }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('saving')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      if (photoFile) data.append('photo', photoFile)

      await client.post('/content/groups/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm({ ...emptyForm, parish: form.parish })
      setPhotoFile(null)
      setStatus('done')
      load()
    } catch {
      setStatus('error')
    }
  }

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }

  const handleEditChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value })

  const startEdit = g => {
    setEditingId(g.id)
    setEditForm({
      parish: g.parish, group_type: g.group_type, name: g.name,
      description: g.description, leader_name: g.leader_name, leader_contact: g.leader_contact,
    })
    setEditPhotoFile(null)
    setEditStatus('')
    setManagingId(null)
  }

  const cancelEdit = () => { setEditingId(null); setEditStatus('') }

  const handleEditSubmit = async e => {
    e.preventDefault()
    setEditStatus('saving')
    try {
      const data = new FormData()
      Object.entries(editForm).forEach(([k, v]) => data.append(k, v))
      if (editPhotoFile) data.append('photo', editPhotoFile)
      await client.patch(`/content/groups/${editingId}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setEditingId(null)
      load()
    } catch {
      setEditStatus('error')
    }
  }

  return (
    <div>
      <h1>Groups</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {groups.map(g => (
          <div key={g.id} className="card">
            {editingId === g.id ? (
              <form onSubmit={handleEditSubmit}>
                <label>Parish</label>
                <select style={inputStyle} name="parish" value={editForm.parish} onChange={handleEditChange} required>
                  {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <label>Group type</label>
                <select style={inputStyle} name="group_type" value={editForm.group_type} onChange={handleEditChange}>
                  {GROUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <label>Name</label>
                <input style={inputStyle} name="name" value={editForm.name} onChange={handleEditChange} required />
                <label>Description</label>
                <input style={inputStyle} name="description" value={editForm.description} onChange={handleEditChange} />
                <label>{editForm.group_type === 'CHOIR' ? 'President name' : 'Leader name'}</label>
                <input style={inputStyle} name="leader_name" value={editForm.leader_name} onChange={handleEditChange} />
                <label>{editForm.group_type === 'CHOIR' ? 'President contact' : 'Leader contact'}</label>
                <input style={inputStyle} name="leader_contact" value={editForm.leader_contact} onChange={handleEditChange} />
                <label>Replace cover photo (optional)</label>
                <input style={inputStyle} type="file" accept="image/*" onChange={e => setEditPhotoFile(e.target.files[0])} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-gold" type="submit" disabled={editStatus === 'saving'} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Save</button>
                  <button type="button" onClick={cancelEdit} className="btn btn-outline" style={{ color: 'var(--color-indigo-900)', borderColor: 'var(--color-indigo-900)', padding: '6px 14px', fontSize: '0.85rem' }}>Cancel</button>
                </div>
                {editStatus === 'error' && <p style={{ color: 'crimson', fontSize: '0.85rem' }}>Something went wrong.</p>}
              </form>
            ) : (
              <>
                {g.photo && (
                  <img src={g.photo} alt={g.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />
                )}
                <h3 style={{ margin: 0 }}>{g.name}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{g.group_type}</p>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{g.group_type === 'CHOIR' ? 'President' : 'Leader'}: {g.leader_name}</p>
                {g.group_type === 'CHOIR' && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                    {g.members_list?.length || 0} members · {g.songs?.length || 0} songs · {g.photos?.length || 0} photos
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => setManagingId(managingId === g.id ? null : g.id)} className="btn btn-outline" style={{ color: 'var(--color-indigo-900)', borderColor: 'var(--color-indigo-900)', padding: '6px 14px', fontSize: '0.85rem' }}>
                    {managingId === g.id ? 'Hide details' : 'Manage'}
                  </button>
                  <button onClick={() => startEdit(g)} className="btn btn-outline" style={{ color: 'var(--color-indigo-900)', borderColor: 'var(--color-indigo-900)', padding: '6px 14px', fontSize: '0.85rem' }}>
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {managingId && (
        <GroupManagePanel
          group={groups.find(g => g.id === managingId)}
          onClose={() => setManagingId(null)}
          onChanged={load}
        />
      )}

      <h2 style={{ marginTop: '32px' }}>Add a group</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '420px' }}>
        <label>Parish</label>
        <select style={inputStyle} name="parish" value={form.parish} onChange={handleChange} required>
          {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label>Group type</label>
        <select style={inputStyle} name="group_type" value={form.group_type} onChange={handleChange}>
          {GROUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <label>Name</label>
        <input style={inputStyle} name="name" value={form.name} onChange={handleChange} required />
        <label>Description</label>
        <input style={inputStyle} name="description" value={form.description} onChange={handleChange} />
        <label>{form.group_type === 'CHOIR' ? 'President name' : 'Leader name'}</label>
        <input style={inputStyle} name="leader_name" value={form.leader_name} onChange={handleChange} />
        <label>{form.group_type === 'CHOIR' ? 'President contact' : 'Leader contact'}</label>
        <input style={inputStyle} name="leader_contact" value={form.leader_contact} onChange={handleChange} />
        <label>Cover photo (optional)</label>
        <input style={inputStyle} type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
        <button className="btn btn-gold" type="submit" disabled={status === 'saving'}>Add group</button>
        {status === 'error' && <p style={{ color: 'crimson' }}>Something went wrong — check the fields and try again.</p>}
      </form>
      {status === 'done' && <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>After adding a choir, use "Manage members / songs / photos" on its card above to fill in the rest.</p>}
    </div>
  )
}
