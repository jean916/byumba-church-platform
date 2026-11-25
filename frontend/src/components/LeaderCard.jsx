// One person in a leadership gallery: photo (or initials), name, role,
// and whatever contact details/notes were filled in. Empty fields are not shown.
const TITLES = new Set(['rt', 'rev', 'ven', 'canon', 'dr', 'mr', 'mrs', 'ms', 'pastor', 'bishop', 'archdeacon', 'the'])

function initials(name) {
  return (name || '')
    .split(/\s+/)
    .map(w => w.replace(/\./g, ''))
    .filter(w => w && !TITLES.has(w.toLowerCase()) && /^\p{L}/u.test(w))
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

export default function LeaderCard({ person, role, fallbackImage }) {
  const image = person.photo || fallbackImage
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {image ? (
        <img
          src={image}
          alt={person.photo ? person.name : ''}
          loading="lazy"
          style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            width: '100%', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-indigo-900)', color: 'var(--color-gold-light)',
            fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 600,
          }}
        >
          {initials(person.name)}
        </div>
      )}
      <div style={{ padding: '14px 16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{person.name}</h3>
        {role && <p style={{ margin: '2px 0 0', fontSize: '0.88rem', fontWeight: 600 }}>{role}</p>}
        {person.contact_phone && (
          <p style={{ margin: '8px 0 0', fontSize: '0.88rem' }}><a href={`tel:${person.contact_phone}`}>{person.contact_phone}</a></p>
        )}
        {person.contact_email && (
          <p style={{ margin: '2px 0 0', fontSize: '0.85rem', overflowWrap: 'anywhere' }}><a href={`mailto:${person.contact_email}`}>{person.contact_email}</a></p>
        )}
        {person.notes && (
          <p style={{ margin: '8px 0 0', fontSize: '0.85rem', whiteSpace: 'pre-line' }}>{person.notes}</p>
        )}
      </div>
    </div>
  )
}
