'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'magariyetu-comparison-listings'
const MAX_LISTINGS = 4

function getIds(): number[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]',
    )

    if (!Array.isArray(stored)) return []

    return Array.from(
      new Set(
        stored
          .map((item) => Number(item))
          .filter((item): item is number => Number.isFinite(item)),
      ),
    ).slice(0, MAX_LISTINGS)
  } catch {
    return []
  }
}

export function ComparisonButton({ listingId }: { listingId: number | string }) {
  const id = Number(listingId)
  const [ids, setIds] = useState<number[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    setIds(getIds())
  }, [])

  const selected = ids.includes(id)

  function save(next: number[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setIds(next)
  }

  function toggle() {
    if (selected) {
      save(ids.filter((item) => item !== id))
      setMessage('')
      return
    }

    if (ids.length >= MAX_LISTINGS) {
      setMessage('You can compare up to 4 vehicles.')
      return
    }

    save([...ids, id])
    setMessage('')
  }

  const compareUrl = `/compare?ids=${ids.join(',')}`

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className={`rounded border px-2 py-1 text-xs ${
          selected
            ? 'border-stamp bg-stamp/10 text-stamp-dark'
            : 'border-ink-100 text-ink-400 hover:bg-ink-50'
        }`}
        aria-pressed={selected}
      >
        {selected ? 'In comparison' : 'Compare'}
      </button>

      {ids.length >= 2 && (
        <a
          href={compareUrl}
          className="text-xs text-stamp-dark hover:underline"
        >
          Compare ({ids.length})
        </a>
      )}

      {message && (
        <span className="text-xs text-alert">{message}</span>
      )}
    </div>
  )
}