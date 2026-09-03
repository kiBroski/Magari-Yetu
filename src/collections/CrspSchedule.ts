import type { CollectionConfig } from 'payload'

// Replaces the hardcoded ~10-model CRSP_SEED object that used to live in
// dutyCalculator.ts. KRA's real Current Retail Selling Price list — the
// official reference table used to compute import duty on used vehicles —
// has over 5,200 line items, keyed by make, model, AND trim/spec level
// (KRA's own 2025 methodology notes explicitly moved from engine-capacity-
// only matching in 2019 to trim-level matching now), published as a single
// spreadsheet at kra.go.ke/images/publications. That file is blocked to
// automated fetching by its own robots.txt, so it cannot be scraped or
// bulk-imported programmatically from outside — it has to be downloaded by
// a person in a browser and imported through the bulk-upload route
// alongside this collection (api/crsp-schedule/bulk-upload/route.ts).
//
// Every row's `verified` field matters more than it might look like it
// should. This is a case where a wrong number isn't just a UI bug — it
// feeds a real estimate of real money someone is about to spend on customs
// duty. Rows seeded at project setup are split into two honest categories:
// a handful with `verified: true` and a `sourceNote` citing exactly where
// the figure came from (KRA's own published examples, reported via Kenyan
// news coverage of the July 2025 CRSP revision), and a larger set with
// `verified: false` — common Kenya-import models with a market-informed
// ballpark figure, explicitly NOT the real official CRSP value, meant to
// keep the calculator useful for models KRA's real list will eventually
// cover but hasn't been imported for yet. The calculator UI is expected to
// visibly distinguish the two, not blend them.

export const CrspSchedule: CollectionConfig = {
  slug: 'crsp-schedule',
  admin: {
    useAsTitle: 'model',
    defaultColumns: ['make', 'model', 'variant', 'crspValueKes', 'verified'],
  },
  access: {
    read: () => true, // the calculator is a public tool, needs to query this without auth
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'moderator',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'moderator',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'make', type: 'text', required: true, index: true },
    { name: 'model', type: 'text', required: true, index: true },
    { name: 'modelNumber', type: 'text', admin: { description: 'KRA model number, where supplied in the source schedule.' } },
    { name: 'variant', type: 'text', admin: { description: 'Trim/spec descriptor, e.g. "G Package", "TX-L", "2.0G" — KRA\'s real list is trim-specific, not just make+model.' } },
    { name: 'transmission', type: 'text' },
    { name: 'driveConfiguration', type: 'text', admin: { description: 'For example 2WD, 4WD, AWD, FWD or RWD.' } },
    { name: 'engineCc', type: 'number' },
    { name: 'fuelType', type: 'select', options: ['petrol', 'diesel', 'hybrid', 'electric'].map((v) => ({ label: v, value: v })) },
    { name: 'bodyType', type: 'text' },
    { name: 'gvwKg', type: 'number', admin: { description: 'Gross vehicle weight in kilograms.' } },
    { name: 'seatingCapacity', type: 'number' },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: ['car', 'motorcycle', 'tractor', 'heavy-machinery', 'pickup-van', 'truck', 'bus', 'trailer', 'tuk-tuk', 'spare-parts'].map((v) => ({ label: v, value: v })),
    },
    { name: 'crspValueKes', type: 'number', required: true },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'True only if this figure is confirmed against an actual KRA-published source — not a general market estimate.' },
    },
    {
      name: 'sourceNote',
      type: 'text',
      admin: { position: 'sidebar', description: 'Where this number came from. Required in spirit even though not enforced as required — every row should have one.' },
    },
  ],
}
