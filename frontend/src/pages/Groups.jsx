import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import client from '../api/client'

export default function Groups() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState([])
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    client.get('/content/groups/').then(r => setGroups(r.data)).catch(() => {})
  }, [])

  return (
    <div className="container" style={{ padding: '56px 24px' }}>
      <h1>{t('nav.groups')}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '24px' }}>
        {groups.length === 0 && <p>No groups added yet.</p>}
        {groups.map(g => (
          <div key={g.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {g.photo && (
              <img src={g.photo} alt={g.name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
            )}
            <div style={{ padding: '20px' }}>
              <h3>{g.name}</h3>
              <p style={{ margin: 0 }}>{t(`groups.${g.group_type}`)}</p>
              {g.leader_name && (
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  {g.group_type === 'CHOIR' ? 'President' : 'Leader'}: {g.leader_name}
                </p>
              )}

              {g.group_type === 'CHOIR' && (
                <>
                  <button
                    onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-indigo-700)', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: '10px', fontSize: '0.9rem' }}
                  >
                    {expandedId === g.id ? 'Hide details' : `See members, songs & photos (${g.members_list?.length || 0} members)`}
                  </button>

                  {expandedId === g.id && (
                    <div style={{ marginTop: '14px', borderTop: '1px solid var(--color-parchment)', paddingTop: '14px' }}>
                      {g.members_list?.length > 0 && (
                        <>
                          <h4 style={{ margin: '0 0 6px' }}>Members</h4>
                          <ul style={{ margin: '0 0 14px', paddingLeft: '18px', fontSize: '0.9rem' }}>
                            {g.members_list.map(m => (
                              <li key={m.id}>{m.name} — {m.is_married ? 'Married' : 'Not married'}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {g.songs?.length > 0 && (
                        <>
                          <h4 style={{ margin: '0 0 6px' }}>Songs</h4>
                          <ul style={{ margin: '0 0 14px', paddingLeft: '18px', fontSize: '0.9rem' }}>
                            {g.songs.map(s => <li key={s.id}>{s.title}</li>)}
                          </ul>
                        </>
                      )}
                      {g.photos?.length > 0 && (
                        <>
                          <h4 style={{ margin: '0 0 6px' }}>Photos</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {g.photos.map(p => (
                              <img key={p.id} src={p.image} alt={p.caption} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '6px' }} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
