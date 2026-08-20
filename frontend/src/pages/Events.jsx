import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import client from '../api/client'

export default function Events() {
  const { i18n } = useTranslation()
  const [events, setEvents] = useState([])

  useEffect(() => {
    client.get('/content/events/').then(r => setEvents(r.data)).catch(() => {})
  }, [])

  const now = new Date()
  const upcoming = events.filter(e => new Date(e.start_time) >= now)
  const past = events.filter(e => new Date(e.start_time) < now)

  const EventCard = ({ e }) => (
    <div className="card" style={{ marginBottom: '12px' }}>
      <h3 style={{ margin: 0 }}>{i18n.language === 'rw' && e.title_rw ? e.title_rw : e.title_en}</h3>
      <p style={{ margin: '4px 0 0' }}>{new Date(e.start_time).toLocaleString()}{e.location && ` — ${e.location}`}</p>
      {(i18n.language === 'rw' && e.description_rw ? e.description_rw : e.description_en) && (
        <p style={{ margin: '4px 0 0' }}>{i18n.language === 'rw' && e.description_rw ? e.description_rw : e.description_en}</p>
      )}
    </div>
  )

  return (
    <div className="container" style={{ padding: '56px 24px', maxWidth: '720px' }}>
      <h1>Events</h1>

      <h2>Upcoming</h2>
      {upcoming.length === 0 && <p>No upcoming events right now.</p>}
      {upcoming.map(e => <EventCard key={e.id} e={e} />)}

      {past.length > 0 && (
        <>
          <h2 style={{ marginTop: '32px' }}>Past events</h2>
          {past.map(e => <EventCard key={e.id} e={e} />)}
        </>
      )}
    </div>
  )
}
