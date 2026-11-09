import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDiocese } from '../context/DioceseContext'

const paragraph = { whiteSpace: 'pre-line', marginBottom: 0 }

export default function About() {
  const { t } = useTranslation()
  const diocese = useDiocese()

  if (!diocese) return <div className="container" style={{ padding: '56px 24px' }}>…</div>

  const parishes = diocese.parishes || []
  // Group parishes by archdeaconry, keeping each archdeacon's name.
  const groups = {}
  parishes.forEach(p => {
    if (!p.archdeaconry) return
    groups[p.archdeaconry] = groups[p.archdeaconry] || { name: p.archdeaconry, archdeacon: p.archdeacon_name, parishes: [] }
    groups[p.archdeaconry].parishes.push(p)
  })
  const archdeaconries = Object.values(groups)

  const sections = [
    ['history', diocese.history],
    ['vision', diocese.vision],
    ['mission', diocese.mission],
  ].filter(([, text]) => text)
  const hasAnyText = diocese.description || sections.length > 0

  const stat = (value, label) => (
    <div className="card" style={{ textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>{value}</p>
      <p style={{ margin: 0 }}>{label}</p>
    </div>
  )

  return (
    <div className="container" style={{ padding: '56px 24px', maxWidth: '860px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {diocese.logo && <img src={diocese.logo} alt="" style={{ height: '64px', width: '64px', objectFit: 'contain' }} />}
        <h1 style={{ margin: 0 }}>{t('about.title')}</h1>
      </div>
      <h2 style={{ fontSize: '1.3rem', color: 'var(--color-ink-soft)', fontWeight: 400 }}>{diocese.name}</h2>

      {diocese.description && (
        <p style={{ ...paragraph, fontSize: '1.1rem', lineHeight: 1.7, marginTop: '16px' }}>{diocese.description}</p>
      )}

      {diocese.bishop_name && (
        <div className="card" style={{ marginTop: '24px', borderLeft: '4px solid var(--color-gold)' }}>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('about.bishop')}</p>
          <h3 style={{ margin: 0 }}>{diocese.bishop_name}</h3>
        </div>
      )}

      {parishes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginTop: '24px' }}>
          {stat(parishes.length, t('about.parishes'))}
          {archdeaconries.length > 0 && stat(archdeaconries.length, t('about.archdeaconries'))}
        </div>
      )}

      {sections.map(([key, text]) => (
        <div key={key} className="card" style={{ marginTop: '24px' }}>
          <h2>{t(`about.${key}`)}</h2>
          <p style={{ ...paragraph, lineHeight: 1.7 }}>{text}</p>
        </div>
      ))}

      {archdeaconries.length > 0 && (
        <>
          <h2 style={{ marginTop: '40px' }}>{t('about.archdeaconries_title')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {archdeaconries.map(a => (
              <div key={a.name} className="card">
                <h3>{a.name}</h3>
                {a.archdeacon && <p style={{ fontWeight: 600 }}>{t('about.archdeacon')}: {a.archdeacon}</p>}
                <p style={{ marginBottom: 0 }}>
                  {a.parishes.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 && ' · '}
                      <Link to={`/parishes/${p.slug}`}>{p.name}</Link>
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {!hasAnyText && (
        <div className="card" style={{ marginTop: '24px' }}><p style={{ margin: 0 }}>{t('about.soon')}</p></div>
      )}

      <p style={{ marginTop: '40px' }}>
        <Link to="/contact" className="btn btn-gold">{t('about.contact_cta')}</Link>
      </p>
    </div>
  )
}
