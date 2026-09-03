import { SavedSearches } from '@/components/dashboard/SavedSearches'

export default function SavedSearchesPage() {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-ink">
        Saved searches and alerts
      </h2>

      <p className="mt-1 text-sm text-ink-400">
        Manage the vehicle searches you want Magariyetu to monitor.
      </p>

      <div className="mt-6">
        <SavedSearches />
      </div>
    </div>
  )
}