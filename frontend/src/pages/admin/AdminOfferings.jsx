import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const emptyForm = { parish: '', member: '', amount_rwf: '', purpose: 'OFFERING', method: 'MTN_MOMO', transaction_reference: '', date_given: new Date().toISOString().slice(0, 10) }

export default function AdminOfferings() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [parishes, setParishes] = useState([])
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')

  const load = () => client.get('/offerings/').then(r => setRecords(r.data)).catch(() => {})
  const loadMembers = () => client.get('/accounts/members/').then(r => setMembers(r.data)).catch(() => {})

  useEffect(() => {
    load()
    loadMembers()
    client.get('/dioceses/parishes/').then(r => {
      setParishes(r.data)
      setForm(f => ({ ...f, parish: user?.parish || r.data[0]?.id || '' }))
    })
  }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('saving')
    try {
      const payload = { ...form, member: form.member || null }
      await client.post('/offerings/', payload)
      setForm(f => ({ ...emptyForm, parish: f.parish }))
      setStatus('done')
      load()
    } catch {
      setStatus('error')
    }
  }

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }

  return (
    <div>
      <h1>Offerings</h1>
      <p>Log a contribution someone already paid via Mobile Money, bank transfer, or cash — this keeps a record for reconciliation and reporting. It does not charge anyone automatically.</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-surface)', borderRadius: '10px', overflow: 'hidden', marginBottom: '32px' }}>
        <thead>
          <tr style={{ background: 'var(--color-indigo-900)', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '10px 14px' }}>Date</th>
            <th style={{ padding: '10px 14px' }}>Member</th>
            <th style={{ padding: '10px 14px' }}>Amount (RWF)</th>
            <th style={{ padding: '10px 14px' }}>Purpose</th>
            <th style={{ padding: '10px 14px' }}>Method</th>
          </tr>
        </thead>
        <tbody>
          {records.map(r => {
            const m = members.find(mm => mm.id === r.member)
            return (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--color-parchment)' }}>
                <td style={{ padding: '10px 14px' }}>{r.date_given}</td>
                <td style={{ padding: '10px 14px' }}>{m ? `${m.first_name} ${m.last_name}` : '— (not linked to a member)'}</td>
                <td style={{ padding: '10px 14px' }}>{Number(r.amount_rwf).toLocaleString()}</td>
                <td style={{ padding: '10px 14px' }}>{r.purpose}</td>
                <td style={{ padding: '10px 14px' }}>{r.method}</td>
              </tr>
            )
          })}
          {records.length === 0 && <tr><td colSpan={5} style={{ padding: '10px 14px' }}>No records yet.</td></tr>}
        </tbody>
      </table>

      <h2>Log a contribution</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '420px' }}>
        <label>Parish</label>
        <select style={inputStyle} name="parish" value={form.parish} onChange={handleChange} required>
          {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label>Member (optional — leave blank for an unnamed/walk-in gift)</label>
        <select style={inputStyle} name="member" value={form.member} onChange={handleChange}>
          <option value="">— Not linked to a member —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.username})</option>)}
        </select>
        <label>Amount (RWF)</label>
        <input style={inputStyle} type="number" name="amount_rwf" value={form.amount_rwf} onChange={handleChange} required min="0" step="1" />
        <label>Purpose</label>
        <select style={inputStyle} name="purpose" value={form.purpose} onChange={handleChange}>
          <option value="TITHE">Tithe</option>
          <option value="OFFERING">General offering</option>
          <option value="BUILDING_FUND">Building fund</option>
          <option value="GROUP_CONTRIBUTION">Group/union contribution</option>
          <option value="OTHER">Other</option>
        </select>
        <label>Method</label>
        <select style={inputStyle} name="method" value={form.method} onChange={handleChange}>
          <option value="MTN_MOMO">MTN Mobile Money</option>
          <option value="AIRTEL_MONEY">Airtel Money</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="CASH">Cash</option>
        </select>
        <label>Transaction reference (optional)</label>
        <input style={inputStyle} name="transaction_reference" value={form.transaction_reference} onChange={handleChange} />
        <label>Date given</label>
        <input style={inputStyle} type="date" name="date_given" value={form.date_given} onChange={handleChange} required />
        <button className="btn btn-gold" type="submit" disabled={status === 'saving'}>Log contribution</button>
        {status === 'error' && <p style={{ color: 'crimson' }}>Something went wrong — check the fields and try again.</p>}
      </form>
    </div>
  )
}
