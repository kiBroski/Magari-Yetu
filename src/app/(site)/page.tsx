import Link from 'next/link'
import { getPayload } from '@/lib/payload'
import { CarCard } from '@/components/listings/CarCard'
import type { ListingCardData } from '@/types/listing'

const CATEGORY_SHORTCUTS = [
  { href: '/cars?condition=brand-new', label: 'Brand new' },
  { href: '/cars?condition=foreign-used', label: 'Fresh imports' },
  { href: '/cars?condition=locally-used', label: 'Locally used' },
  { href: '/heavy-machinery', label: 'Heavy machinery' },
  { href: '/services?service=spare-parts', label: 'Spare parts' },
  { href: '/services', label: 'Mechanics & services' },
  { href: '/services?service=car-hire', label: 'Car hire & leasing' },
]

const POPULAR_SEARCHES = [
  { href: '/cars?q=Toyota', label: 'Toyota' },
  { href: '/cars?q=Honda', label: 'Honda' },
  { href: '/cars?condition=foreign-used', label: 'Fresh imports' },
  { href: '/cars?county=Nairobi', label: 'In Nairobi' },
]

const EXPLORE_CATEGORIES = [
  { href: '/cars', eyebrow: 'Everyday driving', title: 'Cars', body: 'New, imported and locally used vehicles.', mark: '01' },
  { href: '/trucks', eyebrow: 'For the job', title: 'Trucks & lorries', body: 'Commercial vehicles ready for work.', mark: '02' },
  { href: '/motorbikes', eyebrow: 'Move faster', title: 'Motorbikes', body: 'Bikes for business and the open road.', mark: '03' },
  { href: '/heavy-machinery', eyebrow: 'Build bigger', title: 'Heavy machinery', body: 'Equipment for construction and industry.', mark: '04' },
]

const DIFFERENTIATORS = [
  {
    mark: '01',
    title: 'Know the duty before you commit',
    body: 'Estimate import duty using KRA CRSP data before you commit.',
    href: '/tools/import-duty-calculator',
  },
  {
    mark: '02',
    title: 'Verification you can actually see',
    body: 'See which dealers have cleared document verification at a glance.',
    href: '/pricing',
  },
  {
    mark: '03',
    title: 'Sellers get real numbers back',
    body: 'Track the inquiries and leads your listing is actually generating.',
    href: '/dashboard',
  },
]

// Fetches directly via the Payload Local API (no HTTP round trip) since this
// runs on the server. Replace the `as unknown as` cast once
// `npm run generate:types` has produced real Listing types from the live
// collection config.
async function getHomeListings(): Promise<{ listings: ListingCardData[]; showingFeatured: boolean }> {
  const payload = await getPayload()
  const featured = await payload.find({
    collection: 'listings',
    where: { status: { equals: 'active' }, featured: { equals: true } },
    limit: 8,
    sort: '-createdAt',
  })

  if (featured.docs.length > 0) {
    return { listings: featured.docs.map(toCardData), showingFeatured: true }
  }

  const latest = await payload.find({
    collection: 'listings',
    where: { status: { equals: 'active' } },
    limit: 8,
    sort: '-createdAt',
  })
  return { listings: latest.docs.map(toCardData), showingFeatured: false }
}

function toCardData(doc: any): ListingCardData {
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    price: doc.price,
    currency: doc.currency ?? 'KES',
    county: doc.county,
    town: doc.town,
    yearOfManufacture: doc.yearOfManufacture,
    mileageKm: doc.mileageKm,
    transmission: doc.transmission,
    fuelType: doc.fuelType,
    condition: doc.condition,
    category: doc.category,
    coverImageUrl: doc.images?.[0]?.image?.sizes?.card?.url ?? '/placeholder-vehicle.jpg',
    featured: doc.featured,
    dealerVerified: doc.dealer?.verificationStatus === 'verified',
  }
}

export default async function HomePage() {
  const homeListings = await getHomeListings().catch(() => ({ listings: [] as ListingCardData[], showingFeatured: false }))

  return (
    <div className="space-y-12 lg:space-y-14">
      <section className="overflow-hidden rounded-lg bg-ink text-white">
        <div className="grid gap-8 px-6 py-12 lg:grid-cols-[1.15fr_.85fr] lg:px-14 lg:py-14">
          <div>
          <p className="font-mono text-xs uppercase tracking-widest text-stamp-light">Kenya&apos;s vehicle &amp; machinery marketplace</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Every gari, every duka, one logbook.
          </h1>
          <p className="mt-4 max-w-lg text-ink-100">
            Buy or sell vehicles, parts and machinery — then find verified dealers, certified mechanics, car hire and leasing services across Kenya.
          </p>
            <form action="/cars" className="mt-7 max-w-xl rounded-lg bg-white p-2 text-ink shadow-xl" role="search">
              <label htmlFor="hero-search" className="sr-only">Search listings</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input id="hero-search" name="q" type="search" placeholder="Search make, model or vehicle type" className="min-w-0 flex-1 rounded border border-ink-100 px-4 py-3 text-sm outline-none placeholder:text-ink-400 focus:border-stamp" />
                <label htmlFor="hero-max-price" className="sr-only">Maximum price</label>
                <select id="hero-max-price" name="maxPrice" defaultValue="" className="rounded border border-ink-100 bg-white px-3 py-3 text-sm text-ink">
                  <option value="">Price range</option><option value="500000">Up to KES 500K</option><option value="1000000">Up to KES 1M</option><option value="2500000">Up to KES 2.5M</option><option value="5000000">Up to KES 5M</option>
                </select>
                <label htmlFor="hero-county" className="sr-only">Location</label>
                <select id="hero-county" name="county" defaultValue="" className="rounded border border-ink-100 bg-white px-3 py-3 text-sm text-ink">
                  <option value="">Any location</option><option value="Nairobi">Nairobi</option><option value="Mombasa">Mombasa</option><option value="Kiambu">Kiambu</option><option value="Nakuru">Nakuru</option><option value="Kisumu">Kisumu</option>
                </select>
                <button type="submit" className="rounded bg-stamp px-5 py-3 font-display text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-stamp-dark">Search</button>
              </div>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-100">
              <span>Popular:</span>
              {POPULAR_SEARCHES.map((search) => <Link key={search.href} href={search.href} className="rounded-full border border-white/20 px-3 py-1 transition hover:bg-white/10">{search.label}</Link>)}
            </div>
            <div className="mt-6"><Link href="/sell" className="rounded border border-white/30 px-5 py-2.5 font-display text-sm uppercase tracking-wide text-white transition hover:bg-white/10">Sell your vehicle</Link></div>
          </div>
          <div className="relative flex min-h-64 flex-wrap content-center gap-3 overflow-hidden rounded-lg border border-white/10 bg-ink-900/40 p-5 lg:pl-6">
            {homeListings.listings.length > 0 && (
              <div className="pointer-events-none absolute inset-0 grid grid-cols-2 gap-1 opacity-30">
                {homeListings.listings.slice(0, 4).map((listing) => (
                  listing.coverImageUrl !== '/placeholder-vehicle.jpg' && <img key={listing.id} src={listing.coverImageUrl} alt="" className="h-full w-full object-cover" />
                ))}
              </div>
            )}
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-stamp/30" />
            <div className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full border border-white/10" />
            <div className="relative flex flex-wrap content-center gap-3">
            <p className="w-full font-mono text-xs uppercase tracking-widest text-stamp-light">Browse by need</p>
              {CATEGORY_SHORTCUTS.slice(0, 5).map((c) => (
                <Link key={c.href} href={c.href} className="rounded border border-white/20 bg-ink/70 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/10">
                  {c.label}
                </Link>
              ))}
              <Link href="/cars" className="w-full text-sm font-semibold text-stamp-light transition hover:text-white">View all categories →</Link>
            </div>
          </div>
        </div>
        <div className="grid border-t border-white/10 bg-ink-900/30 sm:grid-cols-3">
          <p className="px-6 py-4 text-sm text-ink-100 lg:px-14"><span className="mr-2 font-semibold text-white">Verified sellers</span>clear identification for confident buying</p>
          <p className="px-6 py-4 text-sm text-ink-100"><span className="mr-2 font-semibold text-white">Duty clarity</span>estimates before you commit</p>
          <p className="px-6 py-4 text-sm text-ink-100"><span className="mr-2 font-semibold text-white">Built for Kenya</span>vehicles, parts and services in one place</p>
        </div>
      </section>

      {homeListings.listings.length > 0 && (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold text-ink">{homeListings.showingFeatured ? 'Featured this week' : 'Latest listings'}</h2>
            <Link href="/cars" className="text-sm text-stamp-dark hover:underline">See all listings →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {homeListings.listings.map((listing) => <CarCard key={listing.id} listing={listing} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="explore-heading">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-stamp-dark">Start exploring</p>
            <h2 id="explore-heading" className="mt-2 font-display text-2xl font-bold text-ink">Find the right thing for the road ahead</h2>
          </div>
          <Link href="/cars" className="text-sm font-semibold text-stamp-dark hover:underline">Browse all listings →</Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLORE_CATEGORIES.map((category) => (
            <Link key={category.title} href={category.href} className="group relative min-h-52 overflow-hidden rounded-lg bg-white p-5 ring-1 ring-ink-100 transition hover:-translate-y-1 hover:bg-ink hover:shadow-lg">
              <span className="font-mono text-xs text-stamp-dark transition group-hover:text-stamp-light">{category.mark}</span>
              <p className="mt-10 text-xs font-semibold uppercase tracking-widest text-ink-400 transition group-hover:text-ink-100">{category.eyebrow}</p>
              <h3 className="mt-2 font-display text-xl font-bold text-ink transition group-hover:text-white">{category.title}</h3>
              <p className="mt-2 text-sm text-ink-400 transition group-hover:text-ink-100">{category.body}</p>
              <span className="absolute bottom-5 right-5 text-lg text-stamp-dark transition group-hover:translate-x-1 group-hover:text-stamp-light">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-stamp-dark">Built for confident decisions</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink">Why Magariyetu</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          {DIFFERENTIATORS.map((d) => (
            <Link key={d.title} href={d.href} className="rounded-lg border border-ink-100 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="font-mono text-xs font-semibold text-stamp-dark">{d.mark}</span>
              <h3 className="font-display text-lg font-semibold text-ink">{d.title}</h3>
              <p className="mt-2 text-sm text-ink-400">{d.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-lg bg-ink p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-stamp-light">For dealers and service providers</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Build trust before the first call.</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-100">Create your storefront, show verification clearly, and turn buyer interest into trackable leads.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dealers" className="rounded border border-white/30 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10">Find verified dealers</Link>
          <Link href="/services/join" className="rounded bg-stamp px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stamp-dark">Join as a provider</Link>
        </div>
      </section>
    </div>
  )
}
