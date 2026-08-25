import { getCurrentUser } from '@/lib/auth'
import { getPayload } from '@/lib/payload'

// The headline seller-facing differentiator: views vs. inquiries vs.
// conversion, not just a raw view counter. Neither Jiji nor PigiaMe surface
// this to sellers today, which is exactly why it's here.
export default async function DashboardOverviewPage() {
  const user = await getCurrentUser()
  const payload = await getPayload()

  const [listings, inquiries] = await Promise.all([
    payload.find({ collection: 'listings', where: { seller: { equals: user!.id } }, limit: 200 }),
    payload.find({ collection: 'inquiries', where: { 'listing.seller': { equals: user!.id } }, limit: 500 }),
  ])

  const activeCount = listings.docs.filter((l: any) => l.status === 'active').length
  const totalViews = listings.docs.reduce((sum: number, l: any) => sum + (l.views ?? 0), 0)
  const totalInquiries = inquiries.totalDocs
  const conversionRate = totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : '0.0'

  const stats = [
    { label: 'Active listings', value: activeCount },
    { label: 'Total views', value: totalViews.toLocaleString() },
    { label: 'Total inquiries', value: totalInquiries },
    { label: 'View → inquiry rate', value: `${conversionRate}%` },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-ink-100 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-ink-400">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-ink-100 bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Listing performance</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-ink-400">
              <th className="pb-2">Listing</th><th className="pb-2">Status</th><th className="pb-2">Views</th><th className="pb-2">Inquiries</th>
            </tr>
          </thead>
          <tbody>
            {listings.docs.map((l: any) => (
              <tr key={l.id} className="border-t border-ink-50">
                <td className="py-2 text-ink">{l.title}</td>
                <td className="py-2 capitalize text-ink-400">{l.status.replace('-', ' ')}</td>
                <td className="py-2 font-mono">{l.views ?? 0}</td>
                <td className="py-2 font-mono">{l.inquiryCount ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
