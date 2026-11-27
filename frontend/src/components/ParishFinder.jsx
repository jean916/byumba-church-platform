import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Lower-case and drop accents so "Kibáli" and "kibali" match.
const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const FILLER = new Set(['parish', 'parishes', 'paroki', 'amaparoki', 'church', 'itorero', 'of', 'the', 'ya', 'mu'])

export default function ParishFinder({ parishes }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const q = norm(query.trim())
  // Every typed word must appear somewhere in the parish's name, place or
  // archdeaconry, so "Kibali parish" and "paroki ya Kibali" both find Kibali.
  // Filler words are ignored; if only filler is typed, the first parishes show.
  const words = q.split(/[^\p{L}\p{N}]+/u).filter(w => w && !FILLER.has(w))
  const matches = !q
    ? []
    : parishes
        .filter(p => {
          const haystack = norm([p.name, p.location, p.archdeaconry].join(' '))
          return words.every(w => haystack.includes(w))
        })
        .slice(0, 6)

  return (
    <div>
      <label htmlFor="parish-search" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>{t('home.find_title')}</label>
      <input
        id="parish-search"
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('home.find_placeholder')}
        autoComplete="off"
        style={{ width: '100%', padding: '14px 16px', fontSize: '1.05rem', borderRadius: '8px', border: '1px solid #ccc', font: 'inherit' }}
      />
      {!q && <p style={{ margin: '10px 0 0', fontSize: '0.9rem' }}>{t('home.find_hint')}</p>}
      {q && matches.length === 0 && (
        <p style={{ margin: '12px 0 0' }}>{t('home.find_none')} <Link to="/parishes">{t('home.all_parishes')}</Link></p>
      )}
      {matches.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginTop: '14px' }}>
          {matches.map(p => (
            <div key={p.id} className="card" style={{ padding: '16px 18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}><Link to={`/parishes/${p.slug}`}>{p.name}</Link></h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>{[p.archdeaconry, p.location].filter(Boolean).join(' · ')}</p>
              {p.service_times && <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}><strong>{t('home.service_times')}:</strong> {p.service_times}</p>}
              {p.contact_phone && <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}><a href={`tel:${p.contact_phone}`}>{p.contact_phone}</a></p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
