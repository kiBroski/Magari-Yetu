import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

const NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/listings', label: 'My listings' },
  { href: '/dashboard/saved', label: 'Saved vehicles' },
  { href: '/dashboard/saved-searches', label: 'Saved searches & alerts' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/whatsapp', label: 'WhatsApp drafts' },
  { href: '/dashboard/moderation', label: 'Moderation' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/dashboard')

  return (
    <div className="min-h-screen bg-paper">
      {/* Top Header Bar */}
      <header className="border-b border-ink-100 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-display text-lg font-bold uppercase tracking-tight text-ink">
              Magari<span className="text-stamp">yetu</span>
            </Link>
            <Link href="/" className="text-xs font-medium text-ink-400 hover:text-ink">
              ← Main Site
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-ink-400">{user.email}</span>
            <form action="/api/users/logout" method="POST">
              <button type="submit" className="text-alert hover:underline">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
          <Link href="/sell" className="rounded bg-stamp px-4 py-2 text-sm font-display text-white hover:opacity-90">
            + New listing
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
          <nav className="space-y-1" aria-label="Dashboard">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded px-3 py-2 text-sm font-medium text-ink-400 hover:bg-ink-50 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}
