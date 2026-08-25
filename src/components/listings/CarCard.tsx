import Image from 'next/image'
import Link from 'next/link'
import { CONDITION_LABELS, type ListingCardData } from '@/types/listing'
import { FeaturedBadge } from '@/components/badges/FeaturedBadge'
import { VerifiedBadge } from '@/components/badges/VerifiedBadge'

function formatKes(amount: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)
}

export function CarCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link
      href={`/cars/${listing.slug}`}
      className="group block overflow-hidden rounded-lg border border-ink-100 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-50">
        <Image
          src={listing.coverImageUrl}
          alt={listing.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {listing.featured && (
          <div className="absolute left-2 top-2">
            <FeaturedBadge />
          </div>
        )}
        <div className="absolute bottom-2 left-2 rounded-sm bg-ink/80 px-2 py-0.5 font-mono text-[11px] text-white">
          {CONDITION_LABELS[listing.condition]}
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 font-display text-base font-semibold text-ink">{listing.title}</h3>
        <p className="mt-1 font-mono text-lg font-bold text-ink">{formatKes(listing.price)}</p>

        <dl className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-400">
          <div>{listing.yearOfManufacture}</div>
          {listing.mileageKm !== undefined && <div>{listing.mileageKm.toLocaleString()} km</div>}
          {listing.transmission && <div className="capitalize">{listing.transmission}</div>}
          {listing.fuelType && <div className="capitalize">{listing.fuelType}</div>}
        </dl>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-ink-400">{listing.town ? `${listing.town}, ` : ''}{listing.county}</span>
          {listing.dealerVerified && <VerifiedBadge label="Dealer" />}
        </div>
      </div>
    </Link>
  )
}
