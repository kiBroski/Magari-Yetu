'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PhoneOtpLogin } from '@/components/auth/PhoneOtpLogin'

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.errors?.[0]?.message ?? 'Could not log in. Check your email and password.')
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="font-display text-2xl font-bold text-ink">Log in</h1>

      <div className="mt-6 mb-3 flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setMode('phone')}
          className={`rounded px-3 py-1 ${mode === 'phone' ? 'bg-ink text-white' : 'border border-ink-100 text-ink-400'}`}
        >
          Phone (SMS code)
        </button>
        <button
          type="button"
          onClick={() => setMode('email')}
          className={`rounded px-3 py-1 ${mode === 'email' ? 'bg-ink text-white' : 'border border-ink-100 text-ink-400'}`}
        >
          Email &amp; password
        </button>
      </div>

      {mode === 'phone' ? (
        <div className="rounded-lg border border-ink-100 bg-white p-6">
          <PhoneOtpLogin onSuccess={() => { router.push(redirectTo); router.refresh() }} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-ink-100 bg-white p-6">
          {error && <p className="rounded bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">Email</label>
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
            <label htmlFor="password" className="block text-sm font-medium text-ink">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-ink-100 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-ink py-2.5 font-display text-sm uppercase tracking-wide text-white hover:bg-ink-700 disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-ink-400">
        No account?{' '}
        <Link href={`/register?redirect=${encodeURIComponent(redirectTo)}`} className="text-stamp-dark hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md py-12 text-center text-sm">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  )
}