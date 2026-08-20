import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

function GiveForm({ campaign, onDone }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('MTN_MOMO')
  const [status, setStatus] = useState('')

  const submit = async e => {
    e.preventDefault()
    setStatus('saving')
    try {
      await client.post('/offerings/', {
        parish: campaign.parish || null,
        campaign: campaign.id,
        amount_rwf: amount,
        purpose: 'OTHER',
        method,
        date_given: new Date().toISOString().slice(0, 10),
      })
      setStatus('done')
      setAmount('')
      onDone()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') return <p style={{ color: 'var(--color-hill-green)', fontWeight: 600 }}>Thank you! Your contribution has been recorded.</p>

  return (
    <form onSubmit={submit} style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        type="number" min="0" step="1" required placeholder="Amount (RWF)"
        value={amount} onChange={e => setAmount(e.target.value)}
        style={{ padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', width: '140px' }}
      />
      <select value={method} onChange={e => setMethod(e.target.value)} style={{ padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc' }}>
        <option value="MTN_MOMO">MTN Mobile Money</option>
        <option value="AIRTEL_MONEY">Airtel Money</option>
        <option value="BANK_TRANSFER">Bank transfer</option>
        <option value="CASH">Cash</option>
      </select>
      <button className="btn btn-gold" type="submit" disabled={status === 'saving'} style={{ padding: '8px 16px' }}>
        I've given — confirm
      </button>
      {status === 'error' && <p style={{ color: 'crimson', width: '100%' }}>Something went wrong — please try again.</p>}
    </form>
  )
}

export default function Campaigns() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])

  const load = () => client.get('/offerings/campaigns/?active=true').then(r => setCampaigns(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  return (
    <div className="container" style={{ padding: '56px 24px', maxWidth: '720px' }}>
      <h1>Give to a Project</h1>
      <p>Support one of the diocese's current fundraising campaigns. Pay via Mobile Money, bank transfer, or cash, then confirm your contribution below.</p>

      {campaigns.length === 0 && <p>No active campaigns right now.</p>}

      <div style={{ display: 'grid', gap: '24px', marginTop: '24px' }}>
        {campaigns.map(c => {
          const pct = Math.min(100, Math.round((c.raised_amount_rwf / c.target_amount_rwf) * 100))
          return (
            <div key={c.id} className="card">
              <h2 style={{ marginTop: 0 }}>{c.title}</h2>
              {c.description && <p>{c.description}</p>}
              <p style={{ fontWeight: 600, margin: '4px 0' }}>
                {Number(c.raised_amount_rwf).toLocaleString()} / {Number(c.target_amount_rwf).toLocaleString()} RWF raised ({pct}%)
              </p>
              <div style={{ background: 'var(--color-parchment)', borderRadius: '6px', height: '14px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ background: 'var(--color-gold)', height: '100%', width: `${pct}%` }} />
              </div>

              <div style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                {c.momo_code && <p style={{ margin: 0 }}><strong>MTN MoMo:</strong> {c.momo_code}</p>}
                {c.airtel_code && <p style={{ margin: 0 }}><strong>Airtel Money:</strong> {c.airtel_code}</p>}
                {c.bank_details && <p style={{ margin: 0 }}><strong>Bank:</strong> {c.bank_details}</p>}
              </div>

              {user ? (
                <GiveForm campaign={c} onDone={load} />
              ) : (
                <p style={{ fontSize: '0.9rem' }}>
                  <Link to="/login">Log in</Link> or <Link to="/register">register</Link> to confirm your contribution.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
