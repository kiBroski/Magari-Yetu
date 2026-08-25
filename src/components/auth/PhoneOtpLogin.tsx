'use client'

import { useState } from 'react'

// Reusable two-step phone login: request a code, then verify it. Wired
// into /login as a tab (see login/page.tsx). Dropping this same component
// into SellWizard's step-4 inline auth block is a small, mechanical follow-
// up if you want phone-first sign-in there too — not done yet, flagged so
// it isn't mistaken for finished.

export function PhoneOtpLogin({ onSuccess }: { onSuccess: (user: { id: string; role: string }) => void }) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [stage, setStage] = useState<'phone' | 'code'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function requestCode() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? 'Could not send the code.')
      return
    }
    setStage('code')
  }

  async function verifyCode() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone, code, name }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? 'Incorrect or expired code.')
      return
    }
    const { user } = await res.json()
    onSuccess(user)
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

      {stage === 'phone' ? (
        <>
          <input
            placeholder="2547XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border border-ink-100 px-3 py-2 text-sm font-mono"
          />
          <button
            type="button"
            disabled={loading || !phone}
            onClick={requestCode}
            className="w-full rounded bg-ink py-2.5 font-display text-sm uppercase tracking-wide text-white disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send code'}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-400">Enter the code sent to {phone}.</p>
          <input
            placeholder="Full name (first time only)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-ink-100 px-3 py-2 text-sm"
          />
          <input
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded border border-ink-100 px-3 py-2 text-sm font-mono tracking-widest"
          />
          <button
            type="button"
            disabled={loading || code.length < 6}
            onClick={verifyCode}
            className="w-full rounded bg-stamp py-2.5 font-display text-sm uppercase tracking-wide text-white disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify & log in'}
          </button>
          <button type="button" onClick={() => setStage('phone')} className="text-xs text-ink-400 hover:underline">
            Use a different number
          </button>
        </>
      )}
    </div>
  )
}
