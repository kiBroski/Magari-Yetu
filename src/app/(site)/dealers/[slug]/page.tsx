import { notFound } from 'next/navigation'
import { getPayload } from '@/lib/payload'
import { CarCard } from '@/components/listings/CarCard'
import { VerifiedBadge } from '@/components/badges/VerifiedBadge'
import type { ListingCardData } from '@/types/listing'

function toCardData(doc: any): ListingCardData {
  return {
    id: doc.id, slug: doc.slug, title: doc.title, price: doc.price, currency: doc.currency ?? 'KES',
    county: doc.county, town: doc.town, yearOfManufacture: doc.yearOfManufacture, mileageKm: doc.mileageKm,
    transmission: doc.transmission, fuelType: doc.fuelType, condition: doc.condition, category: doc.category,
    coverImageUrl: doc.images?.[0]?.image?.sizes?.card?.url ?? '/placeholder-vehicle.jpg', featured: doc.featured,
  }
}

export default async function DealerStorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload()

  const { docs: dealerDocs } = await payload.find({ collection: 'dealers', where: { slug: { equals: slug } }, limit: 1 })
  const dealer = dealerDocs[0] as any
  if (!dealer) notFound()

  const { docs: listingDocs, totalDocs } = await payload.find({
    collection: 'listings',
    where: { and: [{ dealer: { equals: dealer.id } }, { status: { equals: 'active' } }] },
    sort: '-featured,-createdAt',
    limit: 48,
  })

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-ink-100 bg-white">
        <div className="relative h-40 bg-ink-100" />
        <div className="p-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-ink">{dealer.businessName}</h1>
            {dealer.verificationStatus === 'verified' && <VerifiedBadge label="Verified dealer" />}
          </div>
          <p className="mt-1 text-sm text-ink-400">{[dealer.town, dealer.county].filter(Boolean).join(', ')}</p>
          {dealer.description && <p className="mt-3 max-w-2xl text-ink-400">{dealer.description}</p>}
          {dealer.whatsappNumber && (
            <a
              href={`https://wa.me/${dealer.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-block rounded bg-matatu px-5 py-2.5 text-sm font-display uppercase text-white"
            >
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>

      <h2 className="mb-4 mt-8 font-display text-xl font-bold text-ink">{totalDocs} listing{totalDocs === 1 ? '' : 's'}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {listingDocs.map((l: any) => <CarCard key={l.id} listing={toCardData(l)} />)}
      </div>
    </div>
  )
}
