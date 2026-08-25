import type { Metadata } from 'next'
import { SellWizard } from '@/components/listings/SellWizard'

export const metadata: Metadata = {
  title: 'Sell your vehicle or machinery',
  description: 'Post a car, truck, or heavy machine for sale on Magariyetu in a few guided steps.',
}

export default function SellPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">List it in a few steps</h1>
        <p className="mt-1 text-ink-400">No account needed until you're ready to publish.</p>
      </div>
      <SellWizard />
    </div>
  )
}
