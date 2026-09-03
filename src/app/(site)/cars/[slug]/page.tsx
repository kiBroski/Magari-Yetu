import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from '@/lib/payload'
import { CONDITION_LABELS } from '@/types/listing'
import { WhatsAppButton } from '@/components/listings/WhatsAppButton'
import { VerifiedBadge } from '@/components/badges/VerifiedBadge'
import { FeaturedBadge } from '@/components/badges/FeaturedBadge'
import { InspectedBadge } from '@/components/badges/InspectedBadge'
import { PlatformChatButton } from '@/components/site/PlatformChatButton'
import { ReportButton } from '@/components/site/ReportButton'
import Link from 'next/link'
import { ShareButtons } from '@/components/site/ShareButtons'
import { ComparisonButton } from '@/components/listings/ComparisonButton'

function formatKes(amount: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)
}

async function getListing(slug: string) {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'listings',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }] },
    depth: 2, // resolve seller + dealer + image relationships
    limit: 1,
  })
  return docs[0] as any | undefined
}

// Fixes an inconsistency in the original build: the whole point of
// URL-driven search was that results are shareable via WhatsApp, but
// without these tags a pasted listing link previewed as a bare URL —
// no image, no title, nothing. This is what makes the preview card show up.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const listing = await getListing(slug)
  if (!listing) return {}

  const imageUrl = listing.images?.[0]?.image?.sizes?.card?.url
  const description = `${listing.yearOfManufacture} ${listing.make} ${listing.model} — KES ${Number(listing.price).toLocaleString()}. ${listing.description?.slice(0, 140) ?? ''}`

  return {
    title: listing.title,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: listing.title, description, images: imageUrl ? [imageUrl] : undefined },
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const listing = await getListing(slug)
  if (!listing) notFound()

  const vehicleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: listing.title,
    brand: listing.make,
    model: listing.model,
    vehicleModelDate: String(listing.yearOfManufacture),
    mileageFromOdometer: listing.mileageKm ? { '@type': 'QuantitativeValue', value: listing.mileageKm, unitCode: 'KMT' } : undefined,
    fuelType: listing.fuelType,
    vehicleTransmission: listing.transmission,
    image: listing.images?.map((img: any) => img.image?.sizes?.full?.url).filter(Boolean),
    offers: { '@type': 'Offer', price: listing.price, priceCurrency: 'KES', availability: 'https://schema.org/InStock' },
  }

  // Best-effort view increment — fire and forget, never block rendering on
  // it, and never let it throw the page over a transient DB hiccup.
  const payload = await getPayload()
  payload
    .update({ collection: 'listings', id: listing.id, data: { views: (listing.views ?? 0) + 1 } })
    .catch(() => undefined)

  const sellerPhone = listing.dealer?.whatsappNumber || listing.seller?.phone
  const isDealer = Boolean(listing.dealer)
  const isVerified = listing.dealer?.verificationStatus === 'verified' || listing.seller?.idVerified

  const specs: [string, string | number | undefined][] = [
    ['Condition', CONDITION_LABELS[listing.condition as keyof typeof CONDITION_LABELS]],
    ['Make', listing.make],
    ['Model', listing.model],
    ['Model number', listing.modelNumber],
    ['Year of manufacture', listing.yearOfManufacture],
    ['Mileage', listing.mileageKm ? `${listing.mileageKm.toLocaleString()} km` : undefined],
    ['Transmission', listing.transmission],
    ['Drive configuration', listing.driveConfiguration?.toUpperCase()],
    ['Fuel type', listing.fuelType],
    ['Engine capacity', listing.engineCc ? `${listing.engineCc.toLocaleString()} cc` : undefined],
    ['Body type', listing.bodyType],
    ['GVW', listing.grossVehicleWeightKg ? `${listing.grossVehicleWeightKg.toLocaleString()} kg` : undefined],
    ['Seating', listing.seatingCapacity ? `${listing.seatingCapacity} seats` : undefined],
    ['CRSP (KES)', listing.crspValueKes ? formatKes(listing.crspValueKes) : undefined],
    ['Color', listing.color],
    ['Location', [listing.town, listing.county].filter(Boolean).join(', ')],
    ['Duty status', listing.dutyStatus === 'duty-paid' ? 'Duty paid — ready for transfer' : listing.dutyStatus === 'bonded-pre-clearance' ? 'Bonded — duty not yet cleared' : undefined],
  ]

  if (listing.category === 'heavy-machinery' && listing.heavyMachineSpecs) {
    specs.push(
      ['Equipment type', listing.heavyMachineSpecs.equipmentType],
      ['Operating hours', listing.heavyMachineSpecs.operatingHours],
      ['Capacity / tonnage', listing.heavyMachineSpecs.capacityOrTonnage],
    )
  }
  if (listing.category === 'spare-parts' && listing.sparePartDetails) {
    specs.push(
      ['Part type', listing.sparePartDetails.partType],
      ['Compatible with', listing.sparePartDetails.compatibleModels],
      ['Part condition', listing.sparePartDetails.partCondition],
    )
  }

  const { docs: passedInspections } = await payload.find({
    collection: 'inspections',
    where: { and: [{ listing: { equals: listing.id } }, { status: { equals: 'completed' } }, { overallResult: { in: ['pass', 'pass-with-notes'] } }] },
    sort: '-inspectionDate',
    limit: 1,
  })
  const inspection = passedInspections[0] as any | undefined

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleSchema) }} />
      <div className="lg:col-span-2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-ink-50">
          {listing.images?.[0]?.image?.sizes?.full?.url && (
            <Image
              src={listing.images[0].image.sizes.full.url}
              alt={listing.title}
              fill
              className="object-cover"
              priority
            />
          )}
          {listing.featured && <div className="absolute left-3 top-3"><FeaturedBadge /></div>}
        </div>

        {listing.images?.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {listing.images.slice(1, 6).map((img: any, i: number) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded bg-ink-50">
                {img.image?.sizes?.thumbnail?.url && (
                  <Image src={img.image.sizes.thumbnail.url} alt="" fill className="object-cover" />
                )}
              </div>
            ))}
          </div>
        )}

        <h1 className="mt-6 font-display text-2xl font-bold text-ink">{listing.title}</h1>
        <p className="mt-2 whitespace-pre-line text-ink-400">{listing.description}</p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-ink-100 bg-white p-6 sm:grid-cols-3">
          {specs.filter(([, v]) => v !== undefined && v !== '').map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
              <dd className="font-mono text-sm text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border border-ink-100 bg-white p-6">
          <p className="font-mono text-3xl font-bold text-ink">{formatKes(listing.price)}</p>
          {listing.negotiable && <p className="text-xs text-ink-400">Negotiable</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isDealer ? <Link href={`/dealers/${listing.dealer.slug}`} className="text-sm font-medium text-ink hover:underline">{listing.dealer.businessName}</Link> : listing.seller?.publicSlug ? <Link href={`/sellers/${listing.seller.publicSlug}`} className="text-sm font-medium text-ink hover:underline">{listing.seller.name}</Link> : null}
            {isVerified && <VerifiedBadge label={isDealer ? 'Dealer' : 'ID'} />}
            {inspection && <InspectedBadge result={inspection.overallResult} />}
          </div>

          {inspection?.reportFile?.url && (
            <a href={inspection.reportFile.url} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-stamp-dark hover:underline">
              View inspection report →
            </a>
          )}

          {sellerPhone && (
            <div className="mt-4">
              <WhatsAppButton listingId={listing.id} phoneNumber={sellerPhone} listingTitle={listing.title} />
            </div>
          )}
          {listing.seller?.id && <div className="mt-3"><PlatformChatButton recipientId={listing.seller.id} listingId={listing.id} /></div>}
          <div className="mt-4"><ReportButton targetType="listing" targetId={listing.id} /></div>
          <div className="mt-3"><ShareButtons title={listing.title} /></div>
          <div className="mt-3">
             <ComparisonButton listingId={listing.id} />
          </div>
        </div>

        <a
          href={`/tools/import-duty-calculator?year=${listing.yearOfManufacture}&cc=${listing.engineCc ?? ''}&fuel=${listing.fuelType ?? 'petrol'}`}
          className="block rounded-lg border border-stamp/40 bg-stamp/5 p-4 text-sm text-ink hover:bg-stamp/10"
        >
          <span className="font-display font-semibold text-stamp-dark">Thinking of importing a similar unit?</span>
          <br />Estimate KRA duty for this year, engine, and fuel type →
        </a>
      </aside>
    </div>
  )
}
