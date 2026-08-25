// Deliberately NOT the rotated "clearance-stamp" treatment VerifiedBadge
// uses — a different shape (pill, not stamp), a different icon (check-in-
// circle, not a stamp ring), so it reads as a distinct claim at a glance:
// this is about the *vehicle*, not the *seller*. See collections/
// Inspections.ts for the reasoning.

export function InspectedBadge({ result = 'pass' as 'pass' | 'pass-with-notes' }: { result?: 'pass' | 'pass-with-notes' }) {
  const label = result === 'pass' ? 'Inspected — Passed' : 'Inspected — Passed w/ notes'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-white px-2.5 py-1 text-[11px] font-display uppercase tracking-wide text-ink"
      role="img"
      aria-label={label}
    >
      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 10l2.5 2.5L14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  )
}
