import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import client from '../api/client'

export default function Parishes() {
  const { t } = useTranslation()
  const [parishes, setParishes] = useState([])

  useEffect(() => {
    client.get('/dioceses/parishes/').then(r => setParishes(r.data)).catch(() => {})
  }, [])

  return (
    <div className="container" style={{ padding: '56px 24px' }}>
      <h1>{t('nav.parishes')}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '24px' }}>
        {parishes.length === 0 && <p>No parishes added yet — a Diocese Admin can add them from the admin dashboard.</p>}
        {parishes.map(p => (
          <Link key={p.id} to={`/parishes/${p.slug}`} className="card" style={{ display: 'block', color: 'inherit', padding: 0, overflow: 'hidden' }}>
            {p.photo && (
              <img src={p.photo} alt={p.name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
            )}
            <div style={{ padding: '20px' }}>
              <h3>{p.name}</h3>
              <p style={{ margin: 0 }}>{p.location}</p>
              {p.archdeaconry && <p style={{ margin: 0, fontSize: '0.85rem' }}>{p.archdeaconry}</p>}
              {p.parish_pastor && <p style={{ margin: 0, fontSize: '0.9rem' }}>Pastor: {p.parish_pastor}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
