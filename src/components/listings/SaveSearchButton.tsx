'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function SaveSearchButton() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [channels, setChannels] = useState<string[]>(['in-app'])
  const [message, setMessage] = useState('')

  function toggleChannel(channel: string) {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    )
  }

  async function save() {
    const filters = Object.fromEntries(searchParams.entries())

    const response = await fetch('/api/saved-searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        frequency,
        channels,
        filters,
      }),
    })

    if (response.status === 401) {
      window.location.href = `/login?redirect=${encodeURIComponent(
        `${pathname}?${searchParams.toString()}`,
      )}`
      return
    }

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setMessage(data?.error || 'Could not save this search.')
      return
    }

    setMessage('Search saved.')
    setOpen(false)
    setName('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded border border-ink-100 px-4 py-2 text-sm text-ink hover:bg-ink-50"
      >
        Save this search
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border border-ink-100 bg-white p-4 shadow-lg">
          <label className="block text-sm font-medium text-ink">
            Search name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Toyota Harrier in Nairobi"
              className="mt-1 w-full rounded border border-ink-100 px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-3 block text-sm font-medium text-ink">
            Alert frequency
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              className="mt-1 w-full rounded border border-ink-100 px-3 py-2 text-sm"
            >
              <option value="instant">Instant</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
              <option value="off">Off</option>
            </select>
          </label>

          <fieldset className="mt-3">
            <legend className="text-sm font-medium text-ink">
              Notify me by
            </legend>

            {[
              ['in-app', 'In-app'],
              ['email', 'Email'],
              ['sms', 'SMS'],
              ['whatsapp', 'WhatsApp'],
            ].map(([value, label]) => (
              <label
                key={value}
                className="mt-2 flex items-center gap-2 text-sm text-ink-400"
              >
                <input
                  type="checkbox"
                  checked={channels.includes(value)}
                  onChange={() => toggleChannel(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            onClick={save}
            className="mt-4 rounded bg-stamp px-4 py-2 text-sm font-medium text-white"
          >
            Save search
          </button>
        </div>
      )}

      {message && (
        <p className="mt-2 text-xs text-ink-400">{message}</p>
      )}
    </div>
  )
}