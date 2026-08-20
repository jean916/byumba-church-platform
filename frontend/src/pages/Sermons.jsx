import { useEffect, useState } from 'react'
import client from '../api/client'

export default function Sermons() {
  const [sermons, setSermons] = useState([])

  useEffect(() => {
    client.get('/content/sermons/').then(r => setSermons(r.data)).catch(() => {})
  }, [])

  return (
    <div className="container" style={{ padding: '56px 24px', maxWidth: '720px' }}>
      <h1>Sermons</h1>
      {sermons.length === 0 && <p>No sermons posted yet.</p>}
      <div style={{ display: 'grid', gap: '16px' }}>
        {sermons.map(s => (
          <div key={s.id} className="card">
            <h3 style={{ margin: 0 }}>{s.title}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{s.date_preached}{s.preacher_name && ` — ${s.preacher_name}`}</p>
            {s.scripture_reference && <p style={{ margin: '4px 0 0', fontSize: '0.9rem', fontStyle: 'italic' }}>{s.scripture_reference}</p>}
            {s.summary && <p style={{ margin: '8px 0 0' }}>{s.summary}</p>}
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
              {s.video_url && <a href={s.video_url} target="_blank" rel="noreferrer">🎬 Watch</a>}
              {s.audio_url && <a href={s.audio_url} target="_blank" rel="noreferrer">🎧 Listen</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
