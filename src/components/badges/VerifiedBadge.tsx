// The signature visual element (per frontend-design guidance): a rotated,
// double-ringed "clearance stamp" rather than a generic checkmark pill. It's
// meant to evoke the ink stamp on a cleared logbook/customs document — the
// single visual motif this product should be remembered by, used sparingly
// (verified dealers, ID-verified users) so it keeps its weight.

export function VerifiedBadge({ label = 'Verified' }: { label?: string }) {
  return (
    <span
      className="clearance-stamp inline-flex items-center gap-1 text-[11px] font-display uppercase tracking-wider text-matatu"
      role="img"
      aria-label={`${label} seller`}
    >
      {label}
    </span>
  )
}
