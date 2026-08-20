import { useEffect, useState } from 'react'
import client from '../../api/client'

export default function Overview() {
  const [totals, setTotals] = useState(null)
  const [counts, setCounts] = useState({ parishes: 0, groups: 0, announcements: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    client.get('/offerings/totals/').then(r => setTotals(r.data)).catch(() => setError('Could not load offerings totals — you may not have access.'))
    client.get('/dioceses/parishes/').then(r => setCounts(c => ({ ...c, parishes: r.data.length })))
    client.get('/content/groups/').then(r => setCounts(c => ({ ...c, groups: r.data.length })))
    client.get('/content/announcements/').then(r => setCounts(c => ({ ...c, announcements: r.data.length })))
  }, [])

  const statCard = { background: 'var(--color-surface)', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(27,42,74,0.08)' }

  return (
    <div>
      <h1>Overview</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '24px' }}>
        <div style={statCard}><p style={{ margin: 0, fontSize: '0.85rem' }}>Parishes</p><h2 style={{ margin: 0 }}>{counts.parishes}</h2></div>
        <div style={statCard}><p style={{ margin: 0, fontSize: '0.85rem' }}>Groups</p><h2 style={{ margin: 0 }}>{counts.groups}</h2></div>
        <div style={statCard}><p style={{ margin: 0, fontSize: '0.85rem' }}>Announcements</p><h2 style={{ margin: 0 }}>{counts.announcements}</h2></div>
      </div>

      <h2 style={{ marginTop: '40px' }}>Offerings totals</h2>
      {error && <p style={{ color: 'var(--color-ink-soft)' }}>{error}</p>}
      {totals && (
        <>
          <div style={{ ...statCard, maxWidth: '260px', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Grand total (RWF)</p>
            <h2 style={{ margin: 0 }}>{Number(totals.grand_total_rwf).toLocaleString()}</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-surface)', borderRadius: '10px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: 'var(--color-indigo-900)', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Purpose</th>
                <th style={{ padding: '10px 14px' }}>Total (RWF)</th>
              </tr>
            </thead>
            <tbody>
              {totals.by_purpose.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-parchment)' }}>
                  <td style={{ padding: '10px 14px' }}>{row.purpose}</td>
                  <td style={{ padding: '10px 14px' }}>{Number(row.total_rwf).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '0.85rem', marginTop: '12px' }}>Note: this shows totals only — individual member giving records are not listed here, in line with the privacy approach in the requirements document.</p>
        </>
      )}
    </div>
  )
}
