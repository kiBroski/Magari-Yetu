'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RegisterFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [intendedRole, setIntendedRole] = useState<'buyer' | 'individual_seller' | 'dealer'>('individual_seller')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, requestedRole: intendedRole }),
      })

      const body = await res.json().catch(() => null)

      if (!res.ok) {
        setLoading(false)
        setError(body?.errors?.[0]?.message ?? 'Could not create your account.')
        return
      }

      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      setLoading(false)

      if (!loginRes.ok) {
        // If login failed due to unverified email requirement, redirect to login with query param
        router.push('/login?registered=true')
        return
      }

      if (intendedRole === 'dealer') {
        router.push('/dashboard?setup=dealer')
      } else {
        router.push(redirectTo)
      }
      router.refresh()
    } catch (err) {
      setLoading(false)
      setError('Network connection error. Check your connection and try again.')
    }
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-ink-100 bg-white p-6">
        {error && <p className="rounded bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

        <div>
          <span className="block text-sm font-medium text-ink">I'm here to</span>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(
              [
                ['buyer', 'Buy'],
                ['individual_seller', 'Sell my own'],
                ['dealer', 'Sell as a dealer'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setIntendedRole(value)}
                className={`rounded border px-2 py-2 text-xs font-medium ${
                  intendedRole === value ? 'border-stamp bg-stamp/10 text-stamp-dark' : 'border-ink-100 text-ink-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink">
            Full name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-ink-100 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-ink">
            Phone (for M-Pesa &amp; WhatsApp)
          </label>
          <input
            id="phone"
            required
            placeholder="2547XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded border border-ink-100 px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-ink-100 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-ink-100 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-stamp py-2.5 font-display text-sm uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-center text-sm text-ink-400">
          Already registered?{' '}
          <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-stamp-dark hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md py-12 text-center text-sm">Loading registration...</div>}>
      <RegisterFormContent />
    </Suspense>
  )
}