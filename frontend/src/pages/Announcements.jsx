import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import client from '../api/client'

export default function Announcements() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState([])

  useEffect(() => {
    client.get('/content/announcements/').then(r => setItems(r.data)).catch(() => {})
  }, [])

  return (
    <div className="container" style={{ padding: '56px 24px', maxWidth: '720px' }}>
      <h1>{t('nav.announcements')}</h1>
      <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
        {items.length === 0 && <p>No announcements yet.</p>}
        {items.map(a => (
          <div key={a.id} className="card">
            <h3>{i18n.language === 'rw' && a.title_rw ? a.title_rw : a.title_en}</h3>
            <p>{i18n.language === 'rw' && a.body_rw ? a.body_rw : a.body_en}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
