'use client'

import { useState } from 'react'

// Triggers an M-Pesa STK push for a boost plan, then polls the order status
// every 3s until it's paid (or the user gives up). This is the entire "pay
// to be featured" loop from the seller's side — see
// src/app/api/payments/mpesa/stk-push/route.ts for what happens server-side,
// and .../callback/route.ts for how a successful payment actually flips
// listing.featured to true (never done client-side, on purpose).

const PLAN_OPTIONS = [
  { value: 'boost-3d', label: '3-day boost — KES 150' },
  { value: 'boost-7d', label: '7-day boost — KES 300' },
  { value: 'boost-30d', label: '30-day boost — KES 1,000' },
]

export function BoostButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState('boost-7d')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'awaiting-pin' | 'paid' | 'failed'>('idle')

  async function startBoost() {
    setStatus('sending')
    const res = await fetch('/api/payments/mpesa/stk-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ listingId, plan, phoneNumber: phone }),
    })
    if (!res.ok) { setStatus('failed'); return }
    const { orderId } = await res.json()
    setStatus('awaiting-pin')
    poll(orderId)
  }

  function poll(orderId: string, attempt = 0) {
    if (attempt > 20) { setStatus('failed'); return } // ~60s timeout
    setTimeout(async () => {
      const res = await fetch(`/api/payments/mpesa/status?orderId=${orderId}`, { credentials: 'include' })
      const data = await res.json().catch(() => null)
      if (data?.status === 'paid') setStatus('paid')
      else if (data?.status === 'failed') setStatus('failed')
      else poll(orderId, attempt + 1)
    }, 3000)
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="rounded border border-stamp px-3 py-1.5 text-xs font-medium text-stamp-dark hover:bg-stamp/10">Boost</button>
  }

  return (
    <div className="w-full rounded border border-ink-100 bg-paper p-3 text-sm sm:w-80">
      {status === 'paid' ? (
        <p className="text-matatu">Payment received — this listing is now featured.</p>
      ) : (
        <>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full rounded border border-ink-100 px-2 py-1.5 text-xs">
            {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <input
            placeholder="M-Pesa phone (2547XXXXXXXX)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded border border-ink-100 px-2 py-1.5 text-xs font-mono"
          />
          <button
            onClick={startBoost}
            disabled={status === 'sending' || status === 'awaiting-pin' || !phone}
            className="mt-2 w-full rounded bg-stamp py-1.5 text-xs font-display uppercase text-white disabled:opacity-50"
          >
            {status === 'awaiting-pin' ? 'Enter M-Pesa PIN on your phone…' : status === 'sending' ? 'Sending…' : 'Pay with M-Pesa'}
          </button>
          {status === 'failed' && <p className="mt-1 text-xs text-alert">Payment didn&apos;t go through — try again.</p>}
        </>
      )}
    </div>
  )
}
