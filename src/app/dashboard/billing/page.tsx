import { getCurrentUser } from '@/lib/auth'
import { getPayload } from '@/lib/payload'

function formatKes(amount: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)
}

export default async function BillingPage() {
  const user = await getCurrentUser()
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'featured-orders',
    where: { user: { equals: user!.id } },
    sort: '-createdAt',
    limit: 50,
  })

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-ink">Payment history</h2>
      {docs.length === 0 ? (
        <p className="text-sm text-ink-400">No payments yet — boost a listing from <a href="/dashboard/listings" className="text-stamp-dark hover:underline">My listings</a> to see it here.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-ink-400">
              <th className="pb-2">Plan</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((o: any) => (
              <tr key={o.id} className="border-t border-ink-50">
                <td className="py-2 text-ink">{o.plan}</td>
                <td className="py-2 font-mono">{formatKes(o.amount)}</td>
                <td className="py-2 capitalize text-ink-400">{o.status}</td>
                <td className="py-2 text-ink-400">{new Date(o.createdAt).toLocaleDateString('en-KE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
