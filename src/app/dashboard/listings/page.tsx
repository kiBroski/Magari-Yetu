import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getPayload } from '@/lib/payload'
import { BoostButton } from '@/components/dashboard/BoostButton'

function formatKes(amount: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)
}

export default async function DashboardListingsPage() {
  const user = await getCurrentUser()
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'listings',
    where: { seller: { equals: user!.id } },
    sort: '-createdAt',
    limit: 100,
  })

  if (docs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-100 bg-white p-12 text-center text-ink-400">
        You haven&apos;t posted anything yet. <Link href="/sell" className="text-stamp-dark hover:underline">Post your first listing</Link>.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {docs.map((l: any) => (
        <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-100 bg-white p-4">
          <div>
            <Link href={`/cars/${l.slug}`} className="font-display font-semibold text-ink hover:underline">{l.title}</Link>
            <p className="text-sm text-ink-400">
              {formatKes(l.price)} · <span className="capitalize">{l.status.replace('-', ' ')}</span> · {l.views ?? 0} views · {l.inquiryCount ?? 0} inquiries
              {l.featured && <span className="ml-2 rounded bg-stamp/10 px-2 py-0.5 text-xs text-stamp-dark">Featured</span>}
            </p>
          </div>
          {l.status === 'active' && !l.featured && <BoostButton listingId={l.id} />}
        </div>
      ))}
    </div>
  )
}
