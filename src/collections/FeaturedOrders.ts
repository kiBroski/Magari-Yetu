import type { CollectionConfig } from 'payload'

// One row per attempt to buy a featured/boosted placement for a listing.
// This is the money trail: created 'pending' the instant STK push fires,
// flipped to 'paid' by the M-Pesa callback, and it's the callback handler —
// never the client — that sets listing.featured = true. See
// src/app/api/payments/mpesa/callback/route.ts.

export const PLANS = {
  'boost-3d': { label: '3-day boost', days: 3, price: 150 },
  'boost-7d': { label: '7-day boost', days: 7, price: 300 },
  'boost-30d': { label: '30-day boost', days: 30, price: 1000 },
  'homepage-spotlight-7d': { label: '7-day homepage spotlight', days: 7, price: 2500 },
} as const

export const FeaturedOrders: CollectionConfig = {
  slug: 'featured-orders',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['listing', 'plan', 'amount', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => user?.role === 'admin', // only the callback route (using the Local API with overrideAccess) or an admin can flip status
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'listing', type: 'relationship', relationTo: 'listings', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, defaultValue: ({ user }) => user?.id },
    {
      name: 'plan',
      type: 'select',
      required: true,
      options: Object.entries(PLANS).map(([value, p]) => ({ label: `${p.label} — KES ${p.price}`, value })),
    },
    { name: 'amount', type: 'number', required: true, admin: { description: 'KES, snapshotted from PLANS at order time so later price changes never rewrite history.' } },
    { name: 'durationDays', type: 'number', required: true },
    {
      name: 'paymentProvider',
      type: 'select',
      defaultValue: 'mpesa',
      options: [{ label: 'M-Pesa (STK push via Safaricom Daraja)', value: 'mpesa' }, { label: 'Card', value: 'card' }],
    },
    { name: 'providerCheckoutId', type: 'text', index: true, admin: { description: 'Daraja CheckoutRequestID, used to match the async callback back to this order.' } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending (STK push sent)', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Failed', value: 'failed' },
        { label: 'Expired', value: 'expired' },
      ],
    },
    { name: 'startDate', type: 'date' },
    { name: 'endDate', type: 'date' },
  ],
}
