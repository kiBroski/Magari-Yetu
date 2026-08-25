import Link from 'next/link'
import { PLANS } from '@/collections/FeaturedOrders'

const DEALER_TIERS = [
  { name: 'Free', price: 'KES 0', points: ['Up to 5 active listings', 'Standard search ranking', 'WhatsApp lead capture'] },
  { name: 'Pro', price: 'KES 3,500/mo', points: ['Up to 40 active listings', 'Storefront analytics dashboard', 'Verified badge eligibility'], highlighted: true },
  { name: 'Premium', price: 'KES 9,000/mo', points: ['Unlimited listings', 'Homepage placement rotation', 'Priority moderation review'] },
]

export default function PricingPage() {
  return (
    <div className="space-y-16">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Get seen first</h1>
        <p className="mt-1 max-w-2xl text-ink-400">
          Boost any single listing, or subscribe as a dealer for higher listing caps and storefront tools. All boosts are paid via M-Pesa STK push straight from your listing&apos;s dashboard page.
        </p>
      </div>

      <section>
        <h2 className="font-display text-xl font-bold text-ink">Boost a listing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div key={key} className="rounded-lg border border-ink-100 bg-white p-6">
              <p className="font-display text-lg font-semibold text-ink">{plan.label}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-stamp-dark">KES {plan.price.toLocaleString()}</p>
              <p className="mt-1 text-xs text-ink-400">{plan.days} days of top-of-search placement</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-400">
          <Link href="/dashboard/listings" className="text-stamp-dark hover:underline">Go to your listings</Link> to boost one.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-ink">Dealer subscriptions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {DEALER_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg border p-6 ${tier.highlighted ? 'border-stamp bg-stamp/5' : 'border-ink-100 bg-white'}`}
            >
              <p className="font-display text-lg font-semibold text-ink">{tier.name}</p>
              <p className="mt-2 font-mono text-xl font-bold text-ink">{tier.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink-400">
                {tier.points.map((p) => <li key={p}>• {p}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-400">
          <Link href="/dashboard" className="text-stamp-dark hover:underline">Set up your dealer profile</Link> to subscribe.
        </p>
      </section>
    </div>
  )
}
