// A meeting report posted by a group: date, title, text and a photo grid.
export default function GroupUpdateCard({ update, showGroup = false }) {
  const date = new Date(`${update.event_date}T00:00:00`).toLocaleDateString('en-GB')
  return (
    <div className="card">
      <p style={{ margin: '0 0 4px', fontSize: '0.82rem', fontWeight: 600 }}>
        {showGroup && <>{update.group_name} · </>}{date}
      </p>
      <h3 style={{ margin: '0 0 8px' }}>{update.title}</h3>
      {update.text && <p style={{ whiteSpace: 'pre-line', marginBottom: update.photos?.length ? '12px' : 0 }}>{update.text}</p>}
      {update.photos?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
          {update.photos.map(p => (
            <a key={p.id} href={p.image} target="_blank" rel="noreferrer" title={p.caption || ''}>
              <img src={p.image} alt={p.caption || update.title} loading="lazy"
                style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: '6px', display: 'block' }} />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
