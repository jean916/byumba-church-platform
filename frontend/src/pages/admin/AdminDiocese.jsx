import { useEffect, useState } from 'react'
import client from '../../api/client'
import { explainError } from '../../api/errors'
import { prepareImage } from '../../api/images'
import { useAuth } from '../../context/AuthContext'

const TEXT_FIELDS = [
  'bishop_name', 'description', 'history', 'vision', 'mission',
  'contact_phone', 'contact_email', 'office_address', 'office_hours', 'map_url',
  'intego_year', 'intego_theme', 'intego_verse_reference', 'intego_verse_text',
  'facebook_url', 'instagram_url', 'tiktok_url',
]

const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px', font: 'inherit' }

const GROUP_TYPES = [
  ['MOTHERS_UNION', "Mothers' Union"], ['FATHERS_UNION', "Fathers' Union"], ['YOUTH_UNION', 'Youth Union'],
  ['CHOIR', 'Choir (Amatorero)'], ['CHILDREN', 'Children / Sunday School'], ['GFS', "Girls' Friendly Society (GFS)"],
]

// One emblem per kind of group, shown on the home page and used by any parish
// group that has not uploaded its own logo.
function GroupTypeLogos({ diocese }) {
  const [logos, setLogos] = useState({})
  const [files, setFiles] = useState({})
  const [status, setStatus] = useState({})
  const say = (type, msg) => setStatus(s => ({ ...s, [type]: msg }))

  const load = () => client.get(`/content/group-type-logos/?diocese=${diocese.slug}`).then(r => {
    const map = {}
    r.data.forEach(l => { map[l.group_type] = l })
    setLogos(map)
  }).catch(() => {})
  useEffect(() => { load() }, [diocese.id])

  const save = async type => {
    if (!files[type]) return
    say(type, 'Saving…')
    try {
      const data = new FormData()
      data.append('logo', await prepareImage(files[type]))
      const config = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (logos[type]) {
        await client.patch(`/content/group-type-logos/${logos[type].id}/`, data, config)
      } else {
        data.append('diocese', diocese.id)
        data.append('group_type', type)
        await client.post('/content/group-type-logos/', data, config)
      }
      setFiles(f => ({ ...f, [type]: null }))
      say(type, 'Saved.')
      load()
    } catch (err) {
      say(type, explainError(err))
    }
  }

  const remove = async type => {
    if (!confirm('Remove this logo?')) return
    await client.delete(`/content/group-type-logos/${logos[type].id}/`)
    say(type, '')
    load()
  }

  return (
    <div style={{ marginTop: '48px' }}>
      <h2>Logos of groups &amp; unions</h2>
      <p>One emblem for each kind of group. They appear on the home page, and on any parish group that has no logo of its own. Each parish can still give its own group a different logo.</p>
      <div style={{ display: 'grid', gap: '12px' }}>
        {GROUP_TYPES.map(([type, label]) => (
          <div key={type} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {logos[type] && <img src={logos[type].logo} alt={`${label} logo`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <strong>{label}</strong>
              <div>
                <input key={logos[type]?.logo || 'none'} type="file" accept="image/*" onChange={e => setFiles(f => ({ ...f, [type]: e.target.files[0] }))} />
              </div>
              {status[type] && <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{status[type]}</p>}
            </div>
            <button className="btn btn-gold" style={{ padding: '6px 14px' }} disabled={!files[type]} onClick={() => save(type)}>
              {logos[type] ? 'Replace logo' : 'Save logo'}
            </button>
            {logos[type] && (
              <button onClick={() => remove(type)} style={{ background: 'none', border: '1px solid crimson', color: 'crimson', borderRadius: '4px', padding: '5px 12px' }}>Remove</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDiocese() {
  const { user } = useAuth()
  const [diocese, setDiocese] = useState(null)
  const [form, setForm] = useState({})
  const [logo, setLogo] = useState(null)
  const [cover, setCover] = useState(null)
  const [status, setStatus] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'DIOCESE_ADMIN'

  const fill = d => {
    setDiocese(d)
    setForm(Object.fromEntries(TEXT_FIELDS.map(k => [k, d[k] ?? ''])))
  }

  useEffect(() => {
    client.get('/dioceses/dioceses/').then(r => {
      const mine = r.data.find(d => d.id === user?.diocese) || r.data.find(d => d.slug === 'byumba') || r.data[0]
      if (mine) fill(mine)
    })
  }, [user?.diocese])

  if (!canEdit) return <p>Only a Diocese Admin can edit the diocese information.</p>
  if (!diocese) return <p>Loading…</p>

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')
    try {
      const data = new FormData()
      TEXT_FIELDS.forEach(k => data.append(k, form[k] ?? ''))
      if (logo) data.append('logo', logo)
      if (cover) data.append('cover_photo', cover)
      const r = await client.patch(`/dioceses/dioceses/${diocese.id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      fill(r.data)
      setLogo(null)
      setCover(null)
      setStatus('done')
    } catch (err) {
      setErrorMsg(explainError(err))
      setStatus('error')
    }
  }

  const field = (name, label, { rows, ...props } = {}) => (
    <>
      <label htmlFor={`f-${name}`}>{label}</label>
      {rows
        ? <textarea id={`f-${name}`} style={{ ...inputStyle, minHeight: `${rows * 24}px` }} name={name} value={form[name]} onChange={handleChange} />
        : <input id={`f-${name}`} style={inputStyle} name={name} value={form[name]} onChange={handleChange} {...props} />}
    </>
  )

  return (
    <div style={{ maxWidth: '720px' }}>
      <h1 style={{ fontSize: '2rem' }}>Diocese information</h1>
      <p>Everything here appears on the public website: the home page, the About page, the Contact page and the footer. A section stays hidden until you fill it in.</p>

      <form onSubmit={handleSubmit}>
        <h2>About the diocese</h2>
        {field('bishop_name', 'Bishop', { placeholder: 'e.g. Rt. Rev. …' })}
        {field('description', 'Short introduction', { rows: 4 })}
        {field('history', 'Our story / history', { rows: 8 })}
        {field('vision', 'Vision', { rows: 3 })}
        {field('mission', 'Mission', { rows: 3 })}

        <h2 style={{ marginTop: '32px' }}>Contact details</h2>
        {field('contact_phone', 'Office phone', { placeholder: '07XXXXXXXX', inputMode: 'numeric', maxLength: 10 })}
        {field('contact_email', 'Office email (messages from the Contact form arrive here)', { type: 'email' })}
        {field('office_address', 'Office address', { rows: 2 })}
        {field('office_hours', 'Office hours', { placeholder: 'e.g. Monday–Friday, 8:00–17:00' })}
        {field('map_url', 'Google Maps link to the office', { placeholder: 'https://maps.google.com/…' })}

        <h2 style={{ marginTop: '32px' }}>Intego (yearly theme)</h2>
        {field('intego_year', 'Year', { type: 'number', placeholder: '2027' })}
        {field('intego_theme', 'Theme')}
        {field('intego_verse_reference', 'Verse reference', { placeholder: 'e.g. Yohana 3:16' })}
        {field('intego_verse_text', 'Verse text', { rows: 3 })}

        <h2 style={{ marginTop: '32px' }}>Social media</h2>
        {field('facebook_url', 'Facebook page link', { type: 'url' })}
        {field('instagram_url', 'Instagram link', { type: 'url' })}
        {field('tiktok_url', 'TikTok link', { type: 'url' })}

        <h2 style={{ marginTop: '32px' }}>Images</h2>
        <p style={{ marginBottom: '6px' }}>Logo {diocese.logo && <img src={diocese.logo} alt="Current logo" style={{ height: '40px', verticalAlign: 'middle', marginLeft: '8px' }} />}</p>
        <input type="file" accept="image/*" onChange={e => setLogo(e.target.files[0])} style={{ marginBottom: '14px' }} />
        <p style={{ marginBottom: '6px' }}>Home page cover photo {diocese.cover_photo && <img src={diocese.cover_photo} alt="Current cover" style={{ height: '40px', verticalAlign: 'middle', marginLeft: '8px' }} />}</p>
        <input type="file" accept="image/*" onChange={e => setCover(e.target.files[0])} style={{ marginBottom: '20px' }} />

        <div>
          <button className="btn btn-gold" type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
        </div>
        {status === 'done' && <p role="status" style={{ color: 'var(--color-hill-green-light)', fontWeight: 600 }}>Saved. Reload the public pages to see the changes.</p>}
        {status === 'error' && <p role="alert" style={{ color: '#b00020' }}>{errorMsg}</p>}
      </form>

      <GroupTypeLogos diocese={diocese} />
    </div>
  )
}
