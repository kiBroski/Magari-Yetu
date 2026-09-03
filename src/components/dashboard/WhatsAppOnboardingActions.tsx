'use client'
import { useState } from 'react'

export function WhatsAppOnboardingActions({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  async function save() { const response = await fetch('/api/whatsapp/submissions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: value, onboardingStatus: value === 'approved' ? 'dealer-approved' : 'assigned', staffNotes: note }) }); setSaved(response.ok) }
  return <div className="flex flex-wrap items-center gap-2"><select value={value} onChange={(e) => setValue(e.target.value)} className="rounded border border-ink-100 px-2 py-1 text-xs"><option value="received">Received</option><option value="needs-details">Needs details</option><option value="claimed">Claimed</option><option value="under-review">Under review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" className="rounded border border-ink-100 px-2 py-1 text-xs" /><button onClick={save} className="rounded bg-ink px-3 py-1 text-xs text-white">{saved ? 'Saved' : 'Assign/update'}</button></div>
}
