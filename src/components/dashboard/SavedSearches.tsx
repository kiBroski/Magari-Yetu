'use client'

import { useEffect, useState } from 'react'

export function SavedSearches() {
  const [searches, setSearches] = useState<any[]>([])
  const [error, setError] = useState('')

  async function load() {
    const response = await fetch('/api/saved-searches')
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setError(data?.error || 'Could not load saved searches.')
      return
    }

    setSearches(data.docs || [])
  }

  useEffect(() => {
    void load()
  }, [])

  async function update(
    id: number,
    action: 'toggle' | 'delete',
    active?: boolean,
  ) {
    const response = await fetch('/api/saved-searches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, active }),
    })

    if (!response.ok) {
      setError('Could not update this saved search.')
      return
    }

    await load()
  }

  if (searches.length === 0) {
    return (
      <p className="rounded border border-dashed border-ink-100 bg-white p-6 text-sm text-ink-400">
        You have not saved any searches yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-alert">{error}</p>}

      {searches.map((search) => (
        <article
          key={search.id}
          className="rounded border border-ink-100 bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-medium text-ink">{search.name}</h3>
              <p className="mt-1 text-xs text-ink-400">
                {search.frequency} · {(search.channels || []).join(', ')}
              </p>
            </div>

            <span
              className={`text-xs ${
                search.active ? 'text-matatu' : 'text-ink-400'
              }`}
            >
              {search.active ? 'Active' : 'Paused'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={`/cars?${search.queryString}`}
              className="text-sm text-stamp-dark hover:underline"
            >
              View search
            </a>

            <button
              type="button"
              onClick={() => update(search.id, 'toggle', !search.active)}
              className="text-sm text-ink-400 hover:text-ink"
            >
              {search.active ? 'Pause alerts' : 'Resume alerts'}
            </button>

            <button
              type="button"
              onClick={() => update(search.id, 'delete')}
              className="text-sm text-alert hover:underline"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}