// Lightweight view-model types for components that render listing data.
// These are intentionally looser than the generated Payload types
// (src/payload-types.ts, produced by `npm run generate:types` once the
// collections are live) — components should accept "enough of a listing to
// render a card," not the full Payload document shape, so Storybook-style
// isolated development and testing doesn't require a live database.

export interface ListingCardData {
  id: string
  slug: string
  title: string
  price: number
  currency: string
  county: string
  town?: string
  yearOfManufacture: number
  mileageKm?: number
  transmission?: string
  fuelType?: string
  condition: 'brand-new' | 'locally-assembled' | 'foreign-used' | 'locally-used'
  category: string
  coverImageUrl: string
  featured?: boolean
  dealerVerified?: boolean
}

export const CONDITION_LABELS: Record<ListingCardData['condition'], string> = {
  'brand-new': 'Brand new',
  'locally-assembled': 'Locally assembled',
  'foreign-used': 'Foreign used',
  'locally-used': 'Locally used',
}
