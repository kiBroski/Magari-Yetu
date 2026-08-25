// Deliberately distinct from VerifiedBadge: this marks a *paid placement*,
// not trust. Conflating the two (as some marketplaces do with a single
// "Gold" star) muddies the exact thing Magariyetu is trying to fix — buyers
// should always be able to tell "this seller paid to be seen" apart from
// "this seller is who they say they are."

export function FeaturedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-stamp px-2 py-0.5 text-[11px] font-display uppercase tracking-wider text-white">
      Featured
    </span>
  )
}
