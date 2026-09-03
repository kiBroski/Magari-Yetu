import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayload } from '@/lib/payload'
import { CarCard } from '@/components/listings/CarCard'

export default async function SavedListingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/dashboard/saved')

  const payload = await getPayload()
  const account: any = await payload.findByID({
    collection: 'users',
    id: user.id,
    depth: 0,
    overrideAccess: true,
  })

  const ids = (account.savedListings || [])
    .map((item: any) => Number(typeof item === 'object' ? item.id : item))
    .filter(Number.isFinite)

  const result = ids.length
    ? await payload.find({
        collection: 'listings',
        where: {
          and: [
            { id: { in: ids } },
            { status: { equals: 'active' } },
          ],
        },
        limit: 100,
        sort: '-createdAt',
        depth: 1,
      })
    : { docs: [] }

  const listings = result.docs.map((listing: any) => ({
    ...listing,
    coverImageUrl: listing.images?.[0]?.image?.sizes?.card?.url || '/placeholder-vehicle.jpg',
    dealerVerified: listing.dealer?.verificationStatus === 'verified',
  }))

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-ink">Saved vehicles</h2>
      <p className="mt-1 text-sm text-ink-400">
        Keep track of vehicles you may want to compare or contact later.
      </p>

      {listings.length === 0 ? (
        <div className="mt-6 rounded border border-dashed border-ink-100 bg-white p-8 text-sm text-ink-400">
          You have not saved any active listings yet.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing: any) => (
            <CarCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}