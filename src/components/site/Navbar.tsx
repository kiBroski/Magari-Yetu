import Link from 'next/link'

const browseLinks = [
  { name: 'Cars', href: '/cars' }, { name: 'Trucks & lorries', href: '/trucks' },
  { name: 'Motorbikes', href: '/motorbikes' }, { name: 'Tuk-tuks', href: '/tuktuks' },
  { name: 'Heavy machinery', href: '/heavy-machinery' }, { name: 'Parts & services', href: '/services' },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 font-display text-xl font-bold tracking-tight text-ink" aria-label="Magariyetu home">MAGARI<span className="text-stamp-dark">YETU</span></Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded px-3 py-2 text-sm font-semibold text-ink transition hover:bg-paper hover:text-stamp-dark">Browse vehicles <span className="text-xs transition group-open:rotate-180">⌄</span></summary>
            <div className="absolute left-0 top-full mt-2 grid w-80 grid-cols-2 gap-1 rounded-lg border border-ink-100 bg-white p-2 shadow-lg">
              {browseLinks.map((link) => <Link key={link.href} href={link.href} className="rounded px-3 py-2 text-sm text-ink-400 transition hover:bg-paper hover:text-ink">{link.name}</Link>)}
            </div>
          </details>
          <Link href="/sell" className="rounded px-3 py-2 text-sm font-semibold text-ink transition hover:bg-paper hover:text-stamp-dark">Sell</Link>
          <Link href="/services" className="rounded px-3 py-2 text-sm font-semibold text-ink transition hover:bg-paper hover:text-stamp-dark">Services</Link>
          <Link href="/tools/import-duty-calculator" className="rounded px-3 py-2 text-sm font-semibold text-ink transition hover:bg-paper hover:text-stamp-dark">Duty calculator</Link>
        </nav>
        <div className="ml-auto hidden items-center gap-3 sm:flex">
          <Link href="/login" className="text-sm font-semibold text-ink-400 transition hover:text-ink">Sign in</Link>
          <Link href="/sell" className="rounded bg-stamp px-4 py-2 text-sm font-semibold text-white transition hover:bg-stamp-dark">Post an ad</Link>
        </div>
        <details className="relative ml-auto lg:hidden">
          <summary className="cursor-pointer list-none rounded border border-ink-100 px-3 py-2 text-sm font-semibold text-ink">Menu</summary>
          <nav className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-ink-100 bg-white p-2 shadow-lg" aria-label="Mobile navigation">
            {browseLinks.map((link) => <Link key={link.href} href={link.href} className="block rounded px-3 py-2 text-sm text-ink hover:bg-paper">{link.name}</Link>)}
            <div className="my-2 border-t border-ink-100" />
            <Link href="/services" className="block rounded px-3 py-2 text-sm text-ink hover:bg-paper">Services</Link>
            <Link href="/dealers" className="block rounded px-3 py-2 text-sm text-ink hover:bg-paper">Verified dealers</Link>
            <Link href="/tools/import-duty-calculator" className="block rounded px-3 py-2 text-sm text-ink hover:bg-paper">Duty calculator</Link>
            <Link href="/login" className="block rounded px-3 py-2 text-sm text-ink hover:bg-paper">Sign in</Link>
            <Link href="/sell" className="mt-2 block rounded bg-stamp px-3 py-2 text-center text-sm font-semibold text-white">Post an ad</Link>
          </nav>
        </details>
      </div>
    </header>
  )
}
