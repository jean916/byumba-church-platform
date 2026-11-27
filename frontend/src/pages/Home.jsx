import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import client from '../api/client'
import { useGroupTypeLogos } from '../api/useGroupTypeLogos'
import ArchDivider from '../components/ArchDivider'
import ParishFinder from '../components/ParishFinder'
import GroupUpdateCard from '../components/GroupUpdateCard'
import { useDiocese } from '../context/DioceseContext'

export default function Home() {
  const { t, i18n } = useTranslation()
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const [groupNews, setGroupNews] = useState([])

  useEffect(() => {
    client.get('/content/announcements/').then(r => setAnnouncements(r.data.slice(0, 3))).catch(() => {})
    client.get('/content/events/').then(r => {
      const now = new Date()
      setEvents(r.data.filter(e => new Date(e.start_time) >= now).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).slice(0, 3))
    }).catch(() => {})
    client.get('/content/group-updates/?limit=3').then(r => setGroupNews(r.data)).catch(() => {})
  }, [])

  const groupTypes = ['MOTHERS_UNION', 'FATHERS_UNION', 'YOUTH_UNION', 'CHOIR', 'CHILDREN', 'GFS']
  const diocese = useDiocese()
  const typeLogos = useGroupTypeLogos()
  const parishes = diocese?.parishes || []
  const parishName = id => parishes.find(p => p.id === id)?.name
  const pick = (en, rw) => (i18n.language === 'rw' && rw ? rw : en)

  return (
    <>
      <section style={{
        background: diocese?.cover_photo
          ? `linear-gradient(160deg, rgba(19,27,51,0.88) 0%, rgba(27,42,74,0.85) 55%, rgba(47,82,51,0.8) 140%), url(${diocese.cover_photo}) center/cover no-repeat`
          : `linear-gradient(160deg, var(--color-indigo-950) 0%, var(--color-indigo-900) 55%, var(--color-hill-green) 140%)`,
        color: 'var(--color-white)',
        padding: '96px 24px 72px',
        textAlign: 'center',
      }}>
        <div className="container">
          {(diocese?.intego_theme || diocese?.intego_verse_text) && (
            <div style={{
              background: 'rgba(0,0,0,0.22)',
              border: '1px solid rgba(230,201,107,0.35)',
              borderRadius: '10px',
              padding: '18px 24px',
              maxWidth: '520px',
              margin: '0 auto 28px',
            }}>
              <p style={{ color: 'var(--color-gold-light)', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 600, marginBottom: '8px' }}>
                Intego y'Umwaka {diocese.intego_year || ''}
              </p>
              {diocese.intego_theme && (
                <p style={{ color: 'var(--color-white)', fontWeight: 700, fontSize: '1.05rem', margin: '0 0 8px' }}>{diocese.intego_theme}</p>
              )}
              {diocese.intego_verse_text && (
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', fontStyle: 'italic', margin: 0 }}>
                  &ldquo;{diocese.intego_verse_text}&rdquo;
                </p>
              )}
              {diocese.intego_verse_reference && (
                <p style={{ color: 'var(--color-gold-light)', fontWeight: 600, fontSize: '0.85rem', marginTop: '6px', marginBottom: 0 }}>
                  {diocese.intego_verse_reference}
                </p>
              )}
            </div>
          )}

          <p style={{ color: 'var(--color-gold-light)', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, marginBottom: '16px' }}>
            Byumba &middot; Rwanda
          </p>
          <h1 style={{ color: 'var(--color-white)' }}>{t('home.hero_title')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.15rem', maxWidth: '520px', margin: '0 auto 32px' }}>
            {t('home.hero_subtitle')}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/parishes" className="btn btn-gold">{t('home.cta_parishes')}</Link>
            <Link to="/register" className="btn btn-outline">{t('home.cta_register')}</Link>
          </div>
        </div>
        <div style={{ marginTop: '64px' }}>
          <ArchDivider color="rgba(255,255,255,0.35)" />
        </div>
      </section>

      <section className="container" style={{ padding: '48px 24px 8px', maxWidth: '860px' }}>
        <ParishFinder parishes={parishes} />
      </section>

      <section className="container" style={{ padding: '40px 24px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ margin: 0 }}>{t('home.upcoming_events')}</h2>
          <Link to="/events">{t('home.all_events')} →</Link>
        </div>
        {events.length === 0 && <p style={{ marginTop: '16px' }}>{t('home.no_events')}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {events.map(e => {
            const when = new Date(e.start_time)
            return (
              <div key={e.id} className="card">
                <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 600 }}>
                  {when.toLocaleDateString('en-GB')} · {when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <h3 style={{ margin: 0 }}>{pick(e.title_en, e.title_rw)}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{[parishName(e.parish), e.location].filter(Boolean).join(' · ')}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="container" style={{ padding: '64px 24px' }}>
        <h2>{t('home.our_groups')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px' }}>
          {groupTypes.map(gt => (
            <div key={gt} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {typeLogos[gt] && (
                <img src={typeLogos[gt]} alt="" loading="lazy" style={{ height: '56px', width: '56px', objectFit: 'contain', flexShrink: 0 }} />
              )}
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{t(`groups.${gt}`)}</h3>
            </div>
          ))}
        </div>
      </section>

      {groupNews.length > 0 && (
        <section className="container" style={{ padding: '0 24px 64px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ margin: 0 }}>{t('home.group_news')}</h2>
            <Link to="/groups">{t('home.all_groups')} →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '20px' }}>
            {groupNews.map(u => <GroupUpdateCard key={u.id} update={u} showGroup parishName={parishName(u.parish)} />)}
          </div>
        </section>
      )}

      <section style={{ background: 'var(--color-parchment)', padding: '64px 24px' }}>
        <div className="container">
          <h2>{t('home.latest_news')}</h2>
          <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
            {announcements.length === 0 && <p>—</p>}
            {announcements.map(a => (
              <div key={a.id} className="card">
                <h3>{i18n.language === 'rw' && a.title_rw ? a.title_rw : a.title_en}</h3>
                <p>{(i18n.language === 'rw' && a.body_rw ? a.body_rw : a.body_en)?.slice(0, 160)}...</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '48px 24px' }}>
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 40px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 260px' }}>
            <h2 style={{ margin: '0 0 6px' }}>{t('contact.title')}</h2>
            {diocese?.office_address && <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{diocese.office_address}</p>}
            {diocese?.office_hours && <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{diocese.office_hours}</p>}
          </div>
          <div style={{ overflowWrap: 'anywhere' }}>
            {diocese?.contact_phone && <p style={{ margin: 0 }}><a href={`tel:${diocese.contact_phone}`}>{diocese.contact_phone}</a></p>}
            {diocese?.contact_email && <p style={{ margin: '4px 0 0' }}><a href={`mailto:${diocese.contact_email}`}>{diocese.contact_email}</a></p>}
          </div>
          <Link to="/contact" className="btn btn-gold">{t('about.contact_cta')}</Link>
        </div>
      </section>
    </>
  )
}
