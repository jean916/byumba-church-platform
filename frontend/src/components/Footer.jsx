import ArchDivider from './ArchDivider'
import { useDiocese } from '../context/DioceseContext'

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/>
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.8c-.7-.8-1.1-1.8-1.1-2.9h-3.1v13.4c0 1.5-1.2 2.7-2.7 2.7s-2.7-1.2-2.7-2.7 1.2-2.7 2.7-2.7c.3 0 .5 0 .8.1v-3.2c-.3 0-.5-.1-.8-.1-3.2 0-5.8 2.6-5.8 5.9s2.6 5.9 5.8 5.9 5.8-2.6 5.8-5.9V9.5c1.2.9 2.7 1.4 4.3 1.4V7.8c-.9 0-1.8-.3-2.5-.8-.3-.2-.6-.5-.7-.6-.4-.4-.7-.6-1-.6z"/>
    </svg>
  )
}

export default function Footer() {
  const diocese = useDiocese()

  const iconLinkStyle = {
    color: 'var(--color-white)',
    opacity: 0.8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.25)',
    transition: 'opacity 0.15s ease',
  }

  const hasSocial = diocese?.facebook_url || diocese?.instagram_url || diocese?.tiktok_url

  return (
    <footer style={{ background: 'var(--color-indigo-950)', color: 'var(--color-white)', marginTop: 'var(--space-6)' }}>
      <ArchDivider />
      <div className="container" style={{ padding: '32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <p style={{ color: 'inherit', margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
          Anglican Diocese of Byumba &middot; Rwanda
        </p>
        {hasSocial && (
          <div style={{ display: 'flex', gap: '10px' }}>
            {diocese.facebook_url && (
              <a href={diocese.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook" style={iconLinkStyle}>
                <FacebookIcon />
              </a>
            )}
            {diocese.instagram_url && (
              <a href={diocese.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram" style={iconLinkStyle}>
                <InstagramIcon />
              </a>
            )}
            {diocese.tiktok_url && (
              <a href={diocese.tiktok_url} target="_blank" rel="noreferrer" aria-label="TikTok" style={iconLinkStyle}>
                <TikTokIcon />
              </a>
            )}
          </div>
        )}
      </div>
    </footer>
  )
}
