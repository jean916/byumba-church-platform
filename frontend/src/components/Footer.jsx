import ArchDivider from './ArchDivider'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--color-indigo-950)', color: 'var(--color-white)', marginTop: 'var(--space-6)' }}>
      <ArchDivider />
      <div className="container" style={{ padding: '32px 24px', fontSize: '0.9rem', opacity: 0.8 }}>
        <p style={{ color: 'inherit', margin: 0 }}>
          Anglican Diocese of Byumba &middot; Rwanda
        </p>
      </div>
    </footer>
  )
}
