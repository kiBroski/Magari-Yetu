'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'car', label: 'Cars' },
  { value: 'motorcycle', label: 'Motorcycles' },
  { value: 'pickup-van', label: 'Pickups & vans' },
  { value: 'truck', label: 'Trucks & lorries' },
  { value: 'bus', label: 'Buses' },
  { value: 'trailer', label: 'Trailers' },
  { value: 'heavy-machinery', label: 'Heavy machinery' },
  { value: 'tuk-tuk', label: 'Tuk-tuks' },
  { value: 'spare-parts', label: 'Spare parts & accessories' },
]

const DUTY_STATUSES = [
  { value: '', label: 'Any duty status' },
  { value: 'duty-paid', label: 'Duty paid' },
  { value: 'bonded-pre-clearance', label: 'Bonded / pre-clearance' },
]

const CONDITIONS = [
  { value: '', label: 'Any condition' },
  { value: 'brand-new', label: 'Brand new' },
  { value: 'locally-assembled', label: 'Locally assembled' },
  { value: 'foreign-used', label: 'Foreign used (import)' },
  { value: 'locally-used', label: 'Locally used' },
]

const COUNTIES = ['', 'Nairobi', 'Mombasa', 'Kiambu', 'Nakuru', 'Uasin Gishu', 'Kisumu', 'Machakos']

// Filters live entirely in the URL (?category=car&county=Nairobi&...) rather
// than component state. That means a search is a link you can paste into
// WhatsApp — which, for this market, is not a nice-to-have, it's how people
// actually share listings with each other.
export function SearchFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

  return (
    <form className="grid grid-cols-2 gap-3 rounded-lg border border-ink-100 bg-white p-4 sm:grid-cols-3 lg:grid-cols-7" role="search" aria-label="Filter listings">
      <input type="search" placeholder="Search make, model or part" defaultValue={searchParams.get('q') ?? ''} onBlur={(e) => setParam('q', e.target.value)} className="col-span-2 rounded border border-ink-100 bg-white px-3 py-2 text-sm" aria-label="Search listings" />
      <select
        className="col-span-2 rounded border border-ink-100 bg-white px-3 py-2 text-sm sm:col-span-1"
        defaultValue={searchParams.get('category') ?? ''}
        onChange={(e) => setParam('category', e.target.value)}
        aria-label="Category"
      >
        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      <select
        className="rounded border border-ink-100 bg-white px-3 py-2 text-sm"
        defaultValue={searchParams.get('condition') ?? ''}
        onChange={(e) => setParam('condition', e.target.value)}
        aria-label="Condition"
      >
        {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      <input
        type="text"
        placeholder="Make (e.g. Toyota)"
        defaultValue={searchParams.get('make') ?? ''}
        onBlur={(e) => setParam('make', e.target.value)}
        className="rounded border border-ink-100 bg-white px-3 py-2 text-sm"
        aria-label="Make"
      />

      <select
        className="rounded border border-ink-100 bg-white px-3 py-2 text-sm"
        defaultValue={searchParams.get('county') ?? ''}
        onChange={(e) => setParam('county', e.target.value)}
        aria-label="County"
      >
        {COUNTIES.map((c) => <option key={c} value={c}>{c || 'All counties'}</option>)}
      </select>

      <input
        type="number"
        placeholder="Min price (KES)"
        defaultValue={searchParams.get('minPrice') ?? ''}
        onBlur={(e) => setParam('minPrice', e.target.value)}
        className="rounded border border-ink-100 bg-white px-3 py-2 text-sm"
        aria-label="Minimum price"
      />

      <input
        type="number"
        placeholder="Max price (KES)"
        defaultValue={searchParams.get('maxPrice') ?? ''}
        onBlur={(e) => setParam('maxPrice', e.target.value)}
        className="rounded border border-ink-100 bg-white px-3 py-2 text-sm"
        aria-label="Maximum price"
      />

      <select
        className="rounded border border-ink-100 bg-white px-3 py-2 text-sm"
        defaultValue={searchParams.get('dutyStatus') ?? ''}
        onChange={(e) => setParam('dutyStatus', e.target.value)}
        aria-label="Duty status"
      >
        {DUTY_STATUSES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>
    </form>
  )
}
