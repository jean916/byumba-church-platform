import { useState } from 'react'
import client from '../api/client'

// Shared "confirm what I gave" mini-form for a single campaign - used on
// both the diocese-wide Give page and on each parish's own page, so this
// logic lives in one place instead of being duplicated.
export default function GiveForm({ campaign, onDone }) {
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
