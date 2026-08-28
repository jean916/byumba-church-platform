import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import client from '../api/client'

// The six standard group types every parish is expected to have (or be
// working toward) - shown in this fixed order regardless of which ones
// actually exist yet, so it's clear at a glance what's set up and what
// isn't for a given parish.
const GROUP_TYPE_ORDER = ['MOTHERS_UNION', 'FATHERS_UNION', 'YOUTH_UNION', 'CHOIR', 'CHILDREN', 'GFS']

export default function ParishDetail() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()
  const [parish, setParish] = useState(null)
  const [groups, setGroups] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const [sermons, setSermons] = useState([])
  const [clergy, setClergy] = useState([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setParish(null)
    setNotFound(false)

    client.get('/dioceses/parishes/').then(r => {
      const match = r.data.find(p => p.slug === slug)
      if (!match) {
        setNotFound(true)
        return
      }
      setParish(match)

      client.get(`/content/groups/?parish=${slug}`).then(res => setGroups(res.data)).catch(() => {})
      client.get(`/content/announcements/?parish=${slug}`).then(res => setAnnouncements(res.data)).catch(() => {})
      client.get(`/content/events/?parish=${slug}`).then(res => setEvents(res.data)).catch(() => {})
      client.get(`/content/sermons/?parish=${slug}`).then(res => setSermons(res.data)).catch(() => {})
      // Clergy aren't filterable by parish on the backend yet, only by
      // diocese - so fetch the (small) diocese-wide list and filter here.
      // Hardcoded to "byumba" since this is currently a single-diocese
      // deployment; would need to come from the diocese record once a
      // second diocese is added.
      client.get('/dioceses/clergy/?diocese=byumba')
        .then(res => setClergy(res.data.filter(c => c.parish === match.id)))
        .catch(() => {})
    }).catch(() => setNotFound(true))
  }, [slug])

  if (notFound) {
    return (
      <div className="container" style={{ padding: '56px 24px' }}>
        <h1>Parish not found</h1>
        <p><Link to="/parishes">Back to all parishes</Link></p>
      </div>
    )
  }

  if (!parish) {
    return <div className="container" style={{ padding: '56px 24px' }}>Loading...</div>
  }

  return (
    <div>
      {parish.photo && (
        <div style={{ width: '100%', height: '280px', overflow: 'hidden' }}>
          <img src={parish.photo} alt={parish.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      <div className="container" style={{ padding: '40px 24px', maxWidth: '760px' }}>
        <p style={{ marginBottom: '4px' }}><Link to="/parishes">&larr; {t('nav.parishes')}</Link></p>
        <h1 style={{ marginBottom: '4px' }}>{parish.name}</h1>
        {parish.archdeaconry && <p style={{ margin: 0, fontWeight: 600 }}>{parish.archdeaconry}</p>}

        <div className="card" style={{ marginTop: '20px', marginBottom: '32px' }}>
          {parish.location && <p style={{ margin: '0 0 6px' }}><strong>Location:</strong> {parish.location}</p>}
          {parish.parish_pastor && <p style={{ margin: '0 0 6px' }}><strong>Pastor:</strong> {parish.parish_pastor}</p>}
          {parish.service_times && <p style={{ margin: '0 0 6px' }}><strong>Service times:</strong> {parish.service_times}</p>}
          {parish.contact_phone && <p style={{ margin: 0 }}><strong>Contact:</strong> {parish.contact_phone}</p>}
          {!parish.location && !parish.parish_pastor && !parish.service_times && !parish.contact_phone && (
            <p style={{ margin: 0, color: 'var(--color-ink-soft)' }}>No additional details added yet.</p>
          )}
        </div>

        {clergy.length > 0 && (
          <>
            <h2>Clergy</h2>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '32px' }}>
              {clergy.map(c => (
                <div key={c.id} className="card">
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{c.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{c.level_display || c.level}</p>
                  {c.contact_phone && <p style={{ margin: 0, fontSize: '0.85rem' }}>{c.contact_phone}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        <h2>Groups &amp; Choirs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '32px' }}>
          {GROUP_TYPE_ORDER.map(type => {
            const match = groups.find(g => g.group_type === type)
            return (
              <div key={type} className="card" style={{ opacity: match ? 1 : 0.5 }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{t(`groups.${type}`, type)}</h3>
                {match ? (
                  <>
                    <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{match.name}</p>
                    {match.leader_name && (
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>
                        {type === 'CHOIR' ? 'President' : 'Leader'}: {match.leader_name}
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Not yet set up at this parish</p>
                )}
              </div>
            )
          })}
        </div>

        {groups.filter(g => g.group_type === 'OTHER' || !GROUP_TYPE_ORDER.includes(g.group_type)).length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '32px' }}>
            {groups.filter(g => g.group_type === 'OTHER' || !GROUP_TYPE_ORDER.includes(g.group_type)).map(g => (
              <div key={g.id} className="card">
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{g.name}</h3>
                {g.leader_name && <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Leader: {g.leader_name}</p>}
              </div>
            ))}
          </div>
        )}

        {events.length > 0 && (
          <>
            <h2>Upcoming Events</h2>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '32px' }}>
              {events.filter(e => new Date(e.start_time) >= new Date()).map(e => (
                <div key={e.id} className="card">
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{i18n.language === 'rw' && e.title_rw ? e.title_rw : e.title_en}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{new Date(e.start_time).toLocaleString()}{e.location && ` — ${e.location}`}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {announcements.length > 0 && (
          <>
            <h2>Announcements</h2>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '32px' }}>
              {announcements.map(a => (
                <div key={a.id} className="card">
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{i18n.language === 'rw' && a.title_rw ? a.title_rw : a.title_en}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{i18n.language === 'rw' && a.body_rw ? a.body_rw : a.body_en}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {sermons.length > 0 && (
          <>
            <h2>Sermons</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              {sermons.map(s => (
                <div key={s.id} className="card">
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{s.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{s.date_preached}{s.preacher_name && ` — ${s.preacher_name}`}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
