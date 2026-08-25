import type { Metadata } from 'next'
import { ImportDutyCalculator } from '@/components/tools/ImportDutyCalculator'

export const metadata: Metadata = {
  title: 'Import Duty Calculator',
  description: 'Estimate KRA import duty, excise, VAT, IDF and RDL for a used vehicle import into Kenya, based on CRSP and age depreciation.',
}

export default function ImportDutyCalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Import duty calculator</h1>
        <p className="mt-1 max-w-2xl text-ink-400">
          KRA taxes an imported used vehicle on its official CRSP value minus age-based depreciation — not on what you paid for it.
          This runs that same calculation so you know roughly what to budget before you commit to a unit.
        </p>
      </div>
      <ImportDutyCalculator />
    </div>
  )
}
