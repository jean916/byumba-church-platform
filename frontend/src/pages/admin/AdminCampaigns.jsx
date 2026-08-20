import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const emptyForm = {
  parish: '', title: '', description: '', target_amount_rwf: '',
  start_date: new Date().toISOString().slice(0, 10), end_date: '',
  momo_code: '', airtel_code: '', bank_details: '',
}

export default function AdminCampaigns() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [parishes, setParishes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'DIOCESE_ADMIN' || user?.role === 'PARISH_ADMIN'

  const load = () => client.get('/offerings/campaigns/').then(r => setCampaigns(r.data)).catch(() => {})
  useEffect(() => {
    load()
    client.get('/dioceses/parishes/').then(r => setParishes(r.data))
  }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('saving')
    try {
      const dioceseId = user?.diocese || parishes[0]?.diocese
      await client.post('/offerings/campaigns/', {
        ...form, diocese: dioceseId, parish: form.parish || null, end_date: form.end_date || null,
      })
      setForm(emptyForm)
      setStatus('done')
      load()
    } catch {
      setStatus('error')
    }
  }

  const toggleActive = async c => {
    await client.patch(`/offerings/campaigns/${c.id}/`, { is_active: !c.is_active })
    load()
  }

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }

  return (
    <div>
      <h1>Campaigns</h1>
      <p>Fundraising goals (e.g. a building project) with a public progress bar. People pay via MoMo/bank/cash on their own, then confirm on the public page — this doesn't charge anyone automatically.</p>

      <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
        {campaigns.map(c => {
          const pct = Math.min(100, Math.round((c.raised_amount_rwf / c.target_amount_rwf) * 100))
          return (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0 }}>{c.title} {!c.is_active && <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-soft)' }}>(closed)</span>}</h3>
                {canManage && (
                  <button onClick={() => toggleActive(c)} className="btn btn-outline" style={{ color: 'var(--color-indigo-900)', borderColor: 'var(--color-indigo-900)', padding: '4px 12px', fontSize: '0.8rem' }}>
                    {c.is_active ? 'Close campaign' : 'Reopen'}
                  </button>
                )}
              </div>
              <p style={{ margin: '4px 0' }}>{Number(c.raised_amount_rwf).toLocaleString()} / {Number(c.target_amount_rwf).toLocaleString()} RWF ({pct}%)</p>
              <div style={{ background: 'var(--color-parchment)', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--color-gold)', height: '100%', width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
        {campaigns.length === 0 && <p>No campaigns yet.</p>}
      </div>

      {canManage && (
        <>
          <h2>New campaign</h2>
          <form onSubmit={handleSubmit} style={{ maxWidth: '480px' }}>
            <label>Parish (leave blank for diocese-wide)</label>
            <select style={inputStyle} name="parish" value={form.parish} onChange={handleChange}>
              <option value="">— Diocese-wide —</option>
              {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label>Title</label>
            <input style={inputStyle} name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Building Fund 2026" />
            <label>Description</label>
            <textarea style={{ ...inputStyle, minHeight: '70px' }} name="description" value={form.description} onChange={handleChange} />
            <label>Target amount (RWF)</label>
            <input style={inputStyle} type="number" name="target_amount_rwf" value={form.target_amount_rwf} onChange={handleChange} required min="0" step="1" />
            <label>Start date</label>
            <input style={inputStyle} type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
            <label>End date (optional)</label>
            <input style={inputStyle} type="date" name="end_date" value={form.end_date} onChange={handleChange} />
            <label>MTN MoMo code</label>
            <input style={inputStyle} name="momo_code" value={form.momo_code} onChange={handleChange} />
            <label>Airtel Money code</label>
            <input style={inputStyle} name="airtel_code" value={form.airtel_code} onChange={handleChange} />
            <label>Bank details</label>
            <input style={inputStyle} name="bank_details" value={form.bank_details} onChange={handleChange} placeholder="e.g. Bank of Kigali, Acct 000-123456" />
            <button className="btn btn-gold" type="submit" disabled={status === 'saving'}>Create campaign</button>
            {status === 'error' && <p style={{ color: 'crimson' }}>Something went wrong — check the fields and try again.</p>}
          </form>
        </>
      )}
    </div>
  )
}
