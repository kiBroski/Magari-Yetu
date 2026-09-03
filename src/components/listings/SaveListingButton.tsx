'use client'

import { useEffect, useState } from 'react'

export function SaveListingButton({ listingId }: { listingId: number | string }) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/saved-listings?listingId=${listingId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setSaved(Boolean(data?.saved)))
      .finally(() => setLoading(false))
  }, [listingId])

  async function toggle() {
    const response = await fetch('/api/saved-listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId,
        action: saved ? 'remove' : 'save',
      }),
    })

    if (response.status === 401) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }

    if (response.ok) setSaved(!saved)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="rounded border border-ink-100 px-2 py-1 text-xs text-ink-400 hover:bg-ink-50 disabled:opacity-50"
      aria-pressed={saved}
    >
      {loading ? '…' : saved ? 'Saved' : 'Save'}
    </button>
  )
}