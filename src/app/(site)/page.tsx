import Link from 'next/link'
import { getPayload } from '@/lib/payload'
import { CarCard } from '@/components/listings/CarCard'
import type { ListingCardData } from '@/types/listing'

const CATEGORY_SHORTCUTS = [
  { href: '/cars?condition=brand-new', label: 'Brand new' },
  { href: '/cars?condition=foreign-used', label: 'Fresh imports' },
  { href: '/cars?condition=locally-used', label: 'Locally used' },
  { href: '/heavy-machinery', label: 'Heavy machinery' },
]

const DIFFERENTIATORS = [
  {
    title: 'Know the duty before you commit',
    body: 'Our import duty calculator runs KRA\u2019s CRSP and depreciation formula right inside every import listing \u2014 no separate tool, no guessing.',
    href: '/tools/import-duty-calculator',
  },
  {
    title: 'Verification you can actually see',
    body: 'Dealers go through document verification before the clearance-stamp badge shows on their storefront. Buyers can tell a checked seller from an unchecked one at a glance.',
    href: '/pricing',
  },
  {
    title: 'Sellers get real numbers back',
    body: 'Every WhatsApp click and phone reveal is logged as a lead. Sellers see views vs. inquiries vs. conversion \u2014 not just a raw view count.',
    href: '/dashboard',
  },
]

// Fetches directly via the Payload Local API (no HTTP round trip) since this
// runs on the server. Replace the `as unknown as` cast once
// `npm run generate:types` has produced real Listing types from the live
// collection config.
async function getFeaturedListings(): Promise<ListingCardData[]> {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'listings',
    where: { status: { equals: 'active' }, featured: { equals: true } },
    limit: 8,
    sort: '-createdAt',
  })
  return docs.map(toCardData)
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
  const featured = await getFeaturedListings().catch(() => [] as ListingCardData[])

  return (
    <div className="space-y-16">
      <section className="grid gap-8 rounded-lg bg-ink px-6 py-14 text-white lg:grid-cols-2 lg:px-14">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-stamp-light">Kenya&apos;s vehicle &amp; machinery marketplace</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Every gari, every duka, one logbook.
          </h1>
          <p className="mt-4 max-w-lg text-ink-100">
            Buy or sell new, locally assembled, imported and locally used vehicles — plus trucks, trailers, and heavy machinery — from individuals and verified dealers across Kenya.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/cars" className="rounded bg-stamp px-6 py-3 font-display text-sm uppercase tracking-wide text-white hover:opacity-90">
              Browse listings
            </Link>
            <Link href="/sell" className="rounded border border-white/30 px-6 py-3 font-display text-sm uppercase tracking-wide text-white hover:bg-white/10">
              Sell your vehicle
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap content-start gap-3">
          {CATEGORY_SHORTCUTS.map((c) => (
            <Link key={c.href} href={c.href} className="rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10">
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold text-ink">Featured this week</h2>
            <Link href="/cars" className="text-sm text-stamp-dark hover:underline">See all listings →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((listing) => <CarCard key={listing.id} listing={listing} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl font-bold text-ink">Why Magariyetu</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          {DIFFERENTIATORS.map((d) => (
            <Link key={d.title} href={d.href} className="rounded-lg border border-ink-100 bg-white p-6 transition hover:shadow-md">
              <h3 className="font-display text-lg font-semibold text-ink">{d.title}</h3>
              <p className="mt-2 text-sm text-ink-400">{d.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
