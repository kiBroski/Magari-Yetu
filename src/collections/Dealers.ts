import type { CollectionConfig } from 'payload'

// A Dealer is a storefront: /dealers/[slug]. One User (role: dealer) owns one
// Dealer profile. Splitting this out from Users means a dealership can have
// a rich public presence — logo, cover photo, verification badge, physical
// yard location, subscription tier — without any of that living on the login
// record, and lets us later support multiple staff logins against one
// storefront without a schema change.

export const Dealers: CollectionConfig = {
  slug: 'dealers',
  admin: {
    useAsTitle: 'businessName',
    defaultColumns: ['businessName', 'verificationStatus', 'subscriptionTier', 'county'],
  },
  access: {
    read: () => true, // storefronts are public
    create: ({ req: { user } }) => Boolean(user), // any logged-in user can apply to become a dealer
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'moderator') return true
      return { owner: { equals: user.id } }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, hasMany: false },
    { name: 'businessName', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { description: 'Used in /dealers/[slug]. Lowercase, hyphenated.' } },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    { name: 'description', type: 'textarea' },
    {
      name: 'county',
      type: 'select',
      required: true,
      options: ['Nairobi', 'Mombasa', 'Kiambu', 'Nakuru', 'Uasin Gishu', 'Kisumu', 'Machakos', 'Other'].map((c) => ({ label: c, value: c })),
    },
    { name: 'town', type: 'text' },
    { name: 'physicalAddress', type: 'text' },
    { name: 'latitude', type: 'number', min: -5, max: 6 },
    { name: 'longitude', type: 'number', min: 33, max: 43 },
    { name: 'verificationExpiresAt', type: 'date', admin: { position: 'sidebar' }, access: { update: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? '') } },
    { name: 'verificationNote', type: 'textarea', admin: { position: 'sidebar' }, access: { update: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? '') } },
    { name: 'contactPhone', type: 'text', required: true },
    { name: 'whatsappNumber', type: 'text' },
    {
      name: 'dealsIn',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'New vehicles', value: 'new' },
        { label: 'Fresh imports', value: 'import' },
        { label: 'Locally used', value: 'locally-used' },
        { label: 'Heavy machinery', value: 'heavy-machinery' },
      ],
    },
    {
      name: 'verificationStatus',
      type: 'select',
      defaultValue: 'unverified',
      options: [
        { label: 'Unverified', value: 'unverified' },
        { label: 'Pending review', value: 'pending' },
        { label: 'Verified', value: 'verified' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
      access: { update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'moderator' },
    },
    {
      name: 'verificationDocs',
      type: 'array',
      admin: { description: 'Business permit, KRA PIN certificate, ID of the owner/director. Reviewed manually before verificationStatus flips to "verified".' },
      fields: [
        { name: 'label', type: 'text', required: true },
        // KYC evidence must never use the public listing-media collection.
        { name: 'file', type: 'upload', relationTo: 'verification-documents', required: true },
      ],
    },
    {
      name: 'subscriptionTier',
      type: 'select',
      defaultValue: 'free',
      options: [
        { label: 'Free — up to 5 active listings', value: 'free' },
        { label: 'Pro — up to 40 active listings + storefront analytics', value: 'pro' },
        { label: 'Premium — unlimited listings + homepage placement', value: 'premium' },
      ],
      admin: { position: 'sidebar', description: 'Controls listing caps in the Listings beforeValidate hook and which dashboard analytics widgets render.' },
    },
    {
      name: 'subscriptionRenewsAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.businessName && !data.slug) {
          data.slug = data.businessName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        }
        return data
      },
    ],
  },
}
