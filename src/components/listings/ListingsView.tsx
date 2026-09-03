import type { ReactNode } from 'react'
import type { Where } from 'payload'
import { getPayload } from '@/lib/payload'
import { SearchFilters } from '@/components/listings/SearchFilters'
import { CarCard } from '@/components/listings/CarCard'
import type { ListingCardData } from '@/types/listing'
import { SaveSearchButton } from '@/components/listings/SaveSearchButton'

interface SearchParams {
  category?: string | string[]
  condition?: string | string[]
  make?: string | string[]
  county?: string | string[]
  minPrice?: string | string[]
  maxPrice?: string | string[]
  dutyStatus?: string | string[]
  q?: string | string[]
  page?: string | string[]
}

interface ListingsViewProps {
  forcedCategory?: string
  searchParams?: Promise<SearchParams>
  title?: string
  description?: ReactNode
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function buildWhere(params: SearchParams, forcedCategory?: string): Where {
  const and: Where[] = [{ status: { equals: 'active' } }]
  const category = forcedCategory ?? firstParam(params.category)
  const condition = firstParam(params.condition)
  const make = firstParam(params.make)
  const county = firstParam(params.county)
  const minPrice = firstParam(params.minPrice)
  const maxPrice = firstParam(params.maxPrice)
  const dutyStatus = firstParam(params.dutyStatus)
  const q = firstParam(params.q)

  if (category) and.push({ category: { equals: category } })
  if (condition) and.push({ condition: { equals: condition } })
  if (make) and.push({ make: { contains: make } })
  if (county) and.push({ county: { equals: county } })
  if (minPrice) and.push({ price: { greater_than_equal: Number(minPrice) } })
  if (maxPrice) and.push({ price: { less_than_equal: Number(maxPrice) } })
  if (dutyStatus) and.push({ dutyStatus: { equals: dutyStatus } })
  if (q) and.push({ or: [{ title: { contains: q } }, { make: { contains: q } }, { model: { contains: q } }, { 'sparePartDetails.partType': { contains: q } }, { 'sparePartDetails.compatibleModels': { contains: q } }] })

  return { and }
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

const PAGE_SIZE = 24

export async function ListingsView({ forcedCategory, searchParams, title, description }: ListingsViewProps) {
  const params = (await searchParams) ?? {}
  const payload = await getPayload()
  const currentPage = Number(firstParam(params.page) ?? 1)
  const { docs, totalDocs, totalPages, page } = await payload.find({
    collection: 'listings',
    where: buildWhere(params, forcedCategory),
    limit: PAGE_SIZE,
    page: Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1,
    sort: '-featured,-createdAt',
  })

  const listings = docs.map(toCardData)
  const queryParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const normalized = firstParam(value)
    if (normalized && key !== 'page') queryParams.set(key, normalized)
  }

  return (
    <div className="space-y-6">
      {title && (
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
          {description && <p className="mt-1 text-ink-400">{description}</p>}
        </div>
      )}
      <div className="space-y-3">
        <SearchFilters />
        <div className="flex justify-end">
          <SaveSearchButton />
        </div>
      </div>
      <p className="text-sm text-ink-400">{totalDocs} listing{totalDocs === 1 ? '' : 's'} found</p>

      {listings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-100 bg-white p-12 text-center text-ink-400">
          No listings match those filters yet. Try widening your search, or{' '}
          <a href="/sell" className="text-stamp-dark hover:underline">be the first to list one</a>.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => <CarCard key={listing.id} listing={listing} />)}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex justify-center gap-2 pt-4" aria-label="Pagination">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
            const pageQuery = new URLSearchParams(queryParams)
            pageQuery.set('page', String(pageNumber))
            return (
              <a
                key={pageNumber}
                href={`?${pageQuery.toString()}`}
                className={`rounded px-3 py-1.5 text-sm ${pageNumber === page ? 'bg-ink text-white' : 'border border-ink-100 text-ink-400 hover:bg-ink-50'}`}
              >
                {pageNumber}
              </a>
            )
          })}
        </nav>
      )}
    </div>
  )
}
