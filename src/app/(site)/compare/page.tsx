import Link from 'next/link'
import { getPayload } from '@/lib/payload'

function parseIds(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value

  return Array.from(
    new Set(
      String(raw || '')
        .split(',')
        .map(Number)
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ).slice(0, 4)
}

function value(item: unknown, suffix = '') {
  if (item === undefined || item === null || item === '') {
    return 'Not specified'
  }

  return `${item}${suffix}`
}

function money(amount: number | undefined) {
  if (!amount) return 'Not specified'

  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[] }>
}) {
  const ids = parseIds((await searchParams).ids)

  if (ids.length < 2) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-dashed border-ink-100 bg-white p-10 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">
          Compare vehicles
        </h1>
        <p className="mt-3 text-sm text-ink-400">
          Select two to four vehicles from search results or listing pages to compare them here.
        </p>
        <Link
          href="/cars"
          className="mt-5 inline-block rounded bg-ink px-4 py-2 text-sm text-white"
        >
          Browse vehicles
        </Link>
      </div>
    )
  }

  const payload = await getPayload()

  const listingsResult = await payload.find({
    collection: 'listings',
    where: {
      and: [
        { id: { in: ids } },
        { status: { equals: 'active' } },
      ],
    },
    limit: 4,
    depth: 2,
  })

  const listings = ids
    .map((id) => listingsResult.docs.find((listing: any) => listing.id === id))
    .filter(Boolean) as any[]

  const inspections = await payload.find({
    collection: 'inspections',
    where: {
      and: [
        { listing: { in: listings.map((listing) => listing.id) } },
        { status: { equals: 'completed' } },
        { overallResult: { in: ['pass', 'pass-with-notes'] } },
      ],
    },
    limit: 50,
  })

  const inspectedIds = new Set(
    inspections.docs.map((inspection: any) =>
      Number(
        typeof inspection.listing === 'object'
          ? inspection.listing.id
          : inspection.listing,
      ),
    ),
  )

  const rows = [
    {
      label: 'Price',
      render: (listing: any) => money(listing.price),
    },
    {
      label: 'Year',
      render: (listing: any) => value(listing.yearOfManufacture),
    },
    {
      label: 'Mileage',
      render: (listing: any) =>
        listing.mileageKm !== undefined && listing.mileageKm !== null
          ? `${Number(listing.mileageKm).toLocaleString()} km`
          : 'Not specified',
    },
    {
      label: 'Engine',
      render: (listing: any) => value(listing.engineCc, ' cc'),
    },
    {
      label: 'Transmission',
      render: (listing: any) => value(listing.transmission),
    },
    {
      label: 'Fuel',
      render: (listing: any) => value(listing.fuelType),
    },
    {
      label: 'Body type',
      render: (listing: any) => value(listing.bodyType),
    },
    {
      label: 'Location',
      render: (listing: any) =>
        value([listing.town, listing.county].filter(Boolean).join(', ')),
    },
    {
      label: 'Duty status',
      render: (listing: any) =>
        listing.dutyStatus === 'duty-paid'
          ? 'Duty paid'
          : listing.dutyStatus === 'bonded-pre-clearance'
            ? 'Bonded / pre-clearance'
            : 'Not applicable',
    },
    {
      label: 'Seller verification',
      render: (listing: any) =>
        listing.dealer?.verificationStatus === 'verified'
          ? 'Verified dealer'
          : listing.seller?.idVerified
            ? 'Verified ID'
            : 'Not verified',
    },
    {
      label: 'Inspection',
      render: (listing: any) =>
        inspectedIds.has(Number(listing.id))
          ? 'Inspected'
          : 'No verified inspection',
    },
    {
      label: 'Ownership estimate',
      render: () => 'Coming later',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            Compare vehicles
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Compare important facts side by side. “Not specified” means the seller did not provide that information.
          </p>
        </div>

        <Link
          href="/cars"
          className="rounded border border-ink-100 px-4 py-2 text-sm text-ink hover:bg-ink-50"
        >
          Add another vehicle
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-100 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ink-100 bg-ink-50">
            <tr>
              <th className="min-w-40 px-4 py-3 font-medium text-ink">
                Specification
              </th>

              {listings.map((listing) => (
                <th
                  key={listing.id}
                  className="min-w-56 px-4 py-3 font-medium text-ink"
                >
                  <Link
                    href={`/cars/${listing.slug}`}
                    className="hover:text-stamp-dark hover:underline"
                  >
                    {listing.title}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-ink-100 last:border-0">
                <th className="bg-ink-50/50 px-4 py-3 font-medium text-ink">
                  {row.label}
                </th>

                {listings.map((listing) => (
                  <td key={listing.id} className="px-4 py-3 text-ink-400">
                    {row.render(listing)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}