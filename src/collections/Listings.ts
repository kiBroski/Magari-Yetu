import type { CollectionConfig, Where } from 'payload'

// The core of the marketplace. One document = one vehicle or machine for
// sale. Deliberately one collection (not separate "Cars" / "Trucks" /
// "HeavyMachinery" collections) so search, filtering, and featuring all work
// against a single index — the `category` field plus the conditional
// `heavyMachineSpecs` group is what lets a Bell dozer, a Massey Ferguson tractor,
// and a Toyota Vitz live in the same table without either one carrying irrelevant fields.

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kiambu', 'Nakuru', 'Uasin Gishu', 'Kisumu',
  'Machakos', 'Kajiado', 'Kilifi', 'Meru', 'Nyeri', 'Other',
]

export const Listings: CollectionConfig = {
  slug: 'listings',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'condition', 'price', 'status', 'featured', 'views'],
  },
  access: {
    // Public can only ever see 'active' listings. Owners see their own
    // regardless of status (draft/pending/rejected included) so their
    // dashboard shows everything they've posted.
    read: ({ req: { user } }): boolean | Where => {
      if (user?.role === 'admin' || user?.role === 'moderator') return true
      if (user) {
        return { or: [{ status: { equals: 'active' } }, { seller: { equals: user.id } }] }
      }
      return { status: { equals: 'active' } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'moderator') return true
      return { seller: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { seller: { equals: user.id } }
    },
  },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'e.g. "2019 Toyota Harrier — Foreign Used, 1998cc" or "Massey Ferguson MF-385 Tractor". Shown in search results and the browser tab.' } },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'seller', type: 'relationship', relationTo: 'users', required: true, defaultValue: ({ user }) => user?.id },
    { name: 'dealer', type: 'relationship', relationTo: 'dealers', admin: { description: 'Set automatically if the seller has a dealer profile. Powers the dealer storefront grouping.' } },

    {
      name: 'category',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Car', value: 'car' },
        { label: 'Motorcycle / boda', value: 'motorcycle' },
        { label: 'Tractor', value: 'tractor' },
        { label: 'Heavy machinery & graders', value: 'heavy-machinery' },
        { label: 'Pickup / van', value: 'pickup-van' },
        { label: 'Truck / lorry', value: 'truck' },
        { label: 'Bus / minibus', value: 'bus' },
        { label: 'Trailer', value: 'trailer' },
        { label: 'Tuk-tuk', value: 'tuk-tuk' },
        { label: 'Spare parts & accessories', value: 'spare-parts' },
      ],
    },
    {
      name: 'condition',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Brand new', value: 'brand-new' },
        { label: 'Locally assembled', value: 'locally-assembled' },
        { label: 'Foreign used (import)', value: 'foreign-used' },
        { label: 'Locally used', value: 'locally-used' },
      ],
    },

    // --- Standard vehicle fields (hidden when category is heavy-machinery, tractor, trailer, or spare-parts) ---
    { name: 'make', type: 'text', required: true, index: true },
    { name: 'model', type: 'text', required: true, index: true },
    { name: 'trim', type: 'text' },
    { name: 'yearOfManufacture', type: 'number', required: true, min: 1980, max: 2027, index: true },
    {
      name: 'transmission',
      type: 'select',
      admin: { condition: (data) => !['heavy-machinery', 'tractor', 'trailer', 'spare-parts'].includes(data?.category) },
      options: ['Manual', 'Automatic', 'CVT'].map((v) => ({ label: v, value: v.toLowerCase() })),
    },
    {
      name: 'fuelType',
      type: 'select',
      admin: { condition: (data) => !['trailer', 'spare-parts'].includes(data?.category) },
      options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'].map((v) => ({ label: v, value: v.toLowerCase() })),
    },
    {
      name: 'engineCc',
      type: 'number',
      admin: {
        description: 'Engine capacity in cc (or horsepower/KW equivalent). Feeds the import duty calculator.',
        condition: (data) => !['heavy-machinery', 'trailer', 'spare-parts'].includes(data?.category),
      },
    },
    {
      name: 'mileageKm',
      type: 'number',
      index: true,
      admin: { condition: (data) => !['heavy-machinery', 'tractor', 'spare-parts'].includes(data?.category) },
    },
    {
      name: 'bodyType',
      type: 'select',
      admin: { condition: (data) => ['car', 'pickup-van'].includes(data?.category) },
      options: ['Sedan', 'SUV', 'Hatchback', 'Wagon', 'Pickup', 'Van', 'Coupe', 'Convertible'].map((v) => ({ label: v, value: v.toLowerCase() })),
    },
    { name: 'color', type: 'text' },

    // --- Heavy machinery & agricultural fields (shown when category === 'heavy-machinery' or 'tractor') ---
    {
      name: 'heavyMachineSpecs',
      type: 'group',
      admin: { condition: (data) => ['heavy-machinery', 'tractor'].includes(data?.category) },
      fields: [
        {
          name: 'equipmentType',
          type: 'select',
          options: [
            'Excavator',
            'Bulldozer',
            'Wheel loader',
            'Grader',
            'Backhoe loader',
            'Tractor',
            'Crane',
            'Forklift',
            'Compactor / roller',
            'Combine harvester',
            'Cane loader',
            'Generator',
            'Other',
          ].map((v) => ({ label: v, value: v.toLowerCase().replace(/\s+/g, '-') })),
        },
        {
          name: 'powerRatingHp',
          type: 'number',
          admin: { description: 'Power output in Horsepower (HP) or CC / KW (from KRA schedule).' },
        },
        { name: 'operatingHours', type: 'number' },
        { name: 'capacityOrTonnage', type: 'text', admin: { description: 'e.g. "3.5 tonne", "20-tonne excavator", "100 KVA", "2.5m³ bucket"' } },
        { name: 'attachments', type: 'text', admin: { description: 'Comma-separated, e.g. "bucket, breaker, forks, canopy"' } },
      ],
    },

    // --- Spare parts fields (shown only when category === 'spare-parts') ---
    {
      name: 'sparePartDetails',
      type: 'group',
      admin: { condition: (data) => data?.category === 'spare-parts' },
      fields: [
        { name: 'partType', type: 'text', admin: { description: 'e.g. "Alternator", "Headlight assembly", "ECU"' } },
        { name: 'compatibleModels', type: 'text', admin: { description: 'Comma-separated, e.g. "Toyota Harrier 2015-2020, Toyota Vanguard"' } },
        { name: 'partCondition', type: 'select', options: ['New', 'Refurbished', 'Used'].map((v) => ({ label: v, value: v.toLowerCase() })) },
      ],
    },

    // Only meaningful for foreign-used (import) listings — whether KRA duty
    // has already been settled or the unit is still bonded/pending clearance.
    {
      name: 'dutyStatus',
      type: 'select',
      admin: { condition: (data) => data?.condition === 'foreign-used', description: 'Only relevant for foreign-used imports.' },
      options: [
        { label: 'Duty paid — ready for transfer', value: 'duty-paid' },
        { label: 'Bonded — duty not yet cleared', value: 'bonded-pre-clearance' },
      ],
    },

    { name: 'vinOrChassis', type: 'text', admin: { description: 'Not shown publicly; used for internal duplicate/fraud detection.' } },
    { name: 'price', type: 'number', required: true, index: true },
    { name: 'negotiable', type: 'checkbox', defaultValue: true },
    { name: 'currency', type: 'select', defaultValue: 'KES', options: [{ label: 'KES', value: 'KES' }] },

    { name: 'description', type: 'textarea', required: true },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      maxRows: 24,
      required: true,
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    { name: 'videoUrl', type: 'text', admin: { description: 'Optional YouTube/TikTok walkaround link.' } },

    { name: 'county', type: 'select', required: true, options: KENYAN_COUNTIES.map((c) => ({ label: c, value: c })) },
    { name: 'town', type: 'text' },

    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending-review',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending review', value: 'pending-review' },
        { label: 'Active', value: 'active' },
        { label: 'Sold', value: 'sold' },
        { label: 'Expired', value: 'expired' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
      access: { update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'moderator' },
    },
    {
      name: 'moderationFlag',
      type: 'select',
      admin: { position: 'sidebar', description: 'Auto-set by the price-outlier check on create/update. A flagged listing still goes live but is queued for a human look — this is a nudge, not a block.' },
      options: [
        { label: 'None', value: 'none' },
        { label: 'Price far below market average', value: 'price-outlier-low' },
        { label: 'Duplicate VIN/chassis detected', value: 'duplicate-vin' },
      ],
      defaultValue: 'none',
    },

    { name: 'featured', type: 'checkbox', defaultValue: false, index: true, admin: { position: 'sidebar', description: 'Set by a paid FeaturedOrder, not directly by the seller.' } },
    { name: 'featuredUntil', type: 'date', admin: { position: 'sidebar' } },

    { name: 'views', type: 'number', defaultValue: 0, admin: { position: 'sidebar', readOnly: true } },
    { name: 'inquiryCount', type: 'number', defaultValue: 0, admin: { position: 'sidebar', readOnly: true } },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.title && !data.slug) {
          data.slug = `${data.title}-${Math.random().toString(36).slice(2, 7)}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        }
        return data
      },
    ],
    beforeChange: [
      // Enforce the dealer's subscription-tier listing cap. Individual
      // sellers are capped at 3 concurrent active listings on the free tier
      // to keep the marketplace from filling with one person's inventory —
      // dealers are the ones expected to pay for volume.
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !req.user) return data
        const activeCount = await req.payload.count({
          collection: 'listings',
          where: { seller: { equals: req.user.id }, status: { in: ['active', 'pending-review'] } },
        })
        let cap = 3
        if (data.dealer) {
          const dealer = await req.payload.findByID({ collection: 'dealers', id: data.dealer }).catch(() => null)
          if (dealer?.subscriptionTier === 'pro') cap = 40
          if (dealer?.subscriptionTier === 'premium') cap = Infinity
        }
        if (activeCount.totalDocs >= cap) {
          throw new Error(`Listing cap reached (${cap}). Upgrade your dealer plan on /pricing to post more.`)
        }
        return data
      },
      // Price-outlier flag: compares against the median price of active
      // listings with the same make/model within +/-2 model years. Doesn't
      // block publishing — it queues a human look via moderationFlag.
      async ({ data, req }) => {
        if (!data?.make || !data?.model || !data?.price || !data?.yearOfManufacture) return data
        const comparables = await req.payload.find({
          collection: 'listings',
          where: {
            and: [
              { make: { equals: data.make } },
              { model: { equals: data.model } },
              { status: { equals: 'active' } },
              { yearOfManufacture: { greater_than_equal: data.yearOfManufacture - 2 } },
              { yearOfManufacture: { less_than_equal: data.yearOfManufacture + 2 } },
            ],
          },
          limit: 50,
        })
        if (comparables.totalDocs < 3) return data
        const prices = comparables.docs.map((d: any) => d.price).sort((a: number, b: number) => a - b)
        const median = prices[Math.floor(prices.length / 2)]
        if (data.price < median * 0.6) {
          data.moderationFlag = 'price-outlier-low'
        }
        return data
      },
    ],
  },
}