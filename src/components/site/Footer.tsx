import Link from 'next/link'

const SOCIAL_LINKS = [
  { label: 'Facebook', shortLabel: 'f', href: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? '/contact' },
  { label: 'Instagram', shortLabel: '◎', href: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? '/contact' },
  { label: 'TikTok', shortLabel: '♪', href: process.env.NEXT_PUBLIC_TIKTOK_URL ?? '/contact' },
  { label: 'YouTube', shortLabel: '▶', href: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? '/contact' },
]

export function Footer() {
  return (
    <footer className="mt-14 border-t border-ink-100 bg-ink text-ink-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold uppercase text-white">Magariyetu</p>
          <p className="mt-2 text-sm text-ink-100">Kenya&apos;s marketplace for new, imported, and locally used vehicles &amp; heavy machinery.</p>
          <div className="mt-5">
            <p className="font-mono text-xs uppercase tracking-widest text-stamp">Follow us</p>
            <div className="mt-3 flex gap-2">
              {SOCIAL_LINKS.map((social) => (
                <Link key={social.label} href={social.href} aria-label={social.label} className="flex h-8 w-8 items-center justify-center rounded border border-white/20 text-sm font-bold text-white transition hover:border-stamp hover:bg-stamp hover:text-ink">
                  <span aria-hidden="true">{social.shortLabel}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-wide text-stamp">Browse</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/cars?condition=brand-new">Brand new cars</Link></li>
            <li><Link href="/cars?condition=foreign-used">Fresh imports</Link></li>
            <li><Link href="/cars?condition=locally-used">Locally used cars</Link></li>
            <li><Link href="/heavy-machinery">Heavy machinery</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-wide text-stamp">Sell</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/sell">Post a listing</Link></li>
            <li><Link href="/pricing">Featured ad plans</Link></li>
            <li><Link href="/dashboard">Dealer dashboard</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-wide text-stamp">Tools</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/tools/import-duty-calculator">Import duty calculator</Link></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 border-t border-ink-700 px-4 py-4 text-center text-xs text-ink-100 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} Magariyetu. Not affiliated with KRA or NTSA — duty estimates are informational only.</span>
        <span className="flex gap-4">
          <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
        </span>
      </div>
    </footer>
  )
}
