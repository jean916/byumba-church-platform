import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useDiocese } from '../context/DioceseContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, isAdmin } = useAuth()
  const diocese = useDiocese()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const switchLang = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
  }

  const linkStyle = ({ isActive }) => ({
    color: isActive ? 'var(--color-gold-light)' : 'var(--color-white)',
    fontWeight: 600,
    fontSize: '0.95rem',
  })

  return (
    <header style={{ background: 'var(--color-indigo-900)' }}>
      <div className="container site-header-inner">
        <Link to="/" style={{ color: 'var(--color-white)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {diocese?.logo && (
            <img src={diocese.logo} alt={`${diocese.name} logo`} style={{ height: '40px', width: '40px', objectFit: 'contain', borderRadius: '4px' }} />
          )}
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>
            Byumba Anglican
          </span>
        </Link>
        <button
          className="nav-toggle"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? '✕' : '☰'}
        </button>
        <nav id="site-nav" className={`site-nav${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
          <NavLink to="/" style={linkStyle}>{t('nav.home')}</NavLink>
          <NavLink to="/about" style={linkStyle}>{t('nav.about')}</NavLink>
          <NavLink to="/parishes" style={linkStyle}>{t('nav.parishes')}</NavLink>
          <NavLink to="/groups" style={linkStyle}>{t('nav.groups')}</NavLink>
          <NavLink to="/announcements" style={linkStyle}>{t('nav.announcements')}</NavLink>
          <NavLink to="/events" style={linkStyle}>Events</NavLink>
          <NavLink to="/sermons" style={linkStyle}>Sermons</NavLink>
          <NavLink to="/give" style={linkStyle}>Give</NavLink>
          <NavLink to="/contact" style={linkStyle}>{t('nav.contact')}</NavLink>
          {user ? (
            <NavLink to={isAdmin ? '/admin' : '/account'} style={linkStyle}>
              {isAdmin ? 'Admin' : 'My Account'}
            </NavLink>
          ) : (
            <NavLink to="/login" style={linkStyle}>{t('nav.login')}</NavLink>
          )}
          {!user && (
            <NavLink to="/register" className="btn btn-gold" style={{ padding: '8px 18px' }}>
              {t('nav.register')}
            </NavLink>
          )}
          <div className="nav-tools">
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => switchLang('rw')} aria-label="Kinyarwanda" style={{ background: 'none', border: 'none', color: 'var(--color-white)', opacity: i18n.language === 'rw' ? 1 : 0.5, fontWeight: 700 }}>RW</button>
            <button onClick={() => switchLang('en')} aria-label="English" style={{ background: 'none', border: 'none', color: 'var(--color-white)', opacity: i18n.language === 'en' ? 1 : 0.5, fontWeight: 700 }}>EN</button>
          </div>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', color: 'var(--color-white)', padding: '4px 8px', fontSize: '1rem', lineHeight: 1, marginLeft: '4px' }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
