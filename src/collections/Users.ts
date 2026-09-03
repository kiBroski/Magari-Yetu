import type { CollectionConfig } from 'payload'

// Every account on Magariyetu — buyers, individual sellers, dealer staff, and
// internal admins/moderators — is a row in this collection. Payload's built-in
// auth (email+password, sessions, password reset) is used as-is; we layer a
// `role` field on top and gate everything else (dashboard routes, the /sell
// wizard, the admin panel) off that field. Dealers get a *separate* `Dealers`
// collection for their storefront profile, linked back here via `owner`, so a
// dealer's business identity (verification, logo, subscription tier) is not
// tangled up with their personal login.

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Individual accounts self-verify by email. Dealers additionally go
    // through manual document verification on the Dealers collection before
    // their storefront badge lights up — auth identity and trust are
    // deliberately decoupled.
    tokenExpiration: 60 * 60 * 24 * 7,
    verify: true,
    maxLoginAttempts: 5,
    lockTime: 30 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'phone', 'createdAt'],
  },
  access: {
    // Anyone can register (create). Users can read/update their own record;
    // admins can do anything. Never allow role escalation from the frontend —
    // see the `role` field's own access control below.
    create: () => true,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'publicSlug', type: 'text', unique: true, index: true, admin: { description: 'Automatic public profile URL: /sellers/[publicSlug].' } },
    { name: 'bio', type: 'textarea', admin: { description: 'Optional public seller introduction.' } },
    { name: 'website', type: 'text', admin: { description: 'Public website, including https://.' } },
    { name: 'county', type: 'text', admin: { description: 'Public county for buyers looking nearby.' } },
    { name: 'town', type: 'text' },
    { name: 'accountStatus', type: 'select', defaultValue: 'active', options: ['active', 'warned', 'suspended', 'banned'].map(value => ({ value, label: value })), access: { update: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? '') } },
    { name: 'suspensionEndsAt', type: 'date', access: { update: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? '') } },
    { name: 'moderationNote', type: 'textarea', access: { update: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? '') } },
    { name: 'verificationExpiresAt', type: 'date', access: { update: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? '') } },
    {
      name: 'phone',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'MSISDN in 2547XXXXXXXX format — used for M-Pesa STK push, WhatsApp contact, and phone-OTP login (find-or-create in api/auth/otp/verify relies on this being unique).' },
    },
    {
      name: 'whatsappOptIn',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show a "Chat on WhatsApp" button on my listings',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'buyer',
      options: [
        { label: 'Buyer', value: 'buyer' },
        { label: 'Individual seller', value: 'individual_seller' },
        { label: 'Dealer', value: 'dealer' },
        { label: 'Moderator', value: 'moderator' },
        { label: 'Admin', value: 'admin' },
      ],
      // Only an existing admin may set/change role. A brand-new signup is
      // always forced to 'buyer' by the beforeChange hook below, regardless
      // of what the client sends — this closes the classic "POST role: admin
      // during registration" hole.
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'requestedRole',
      type: 'select',
      options: [
        { label: 'Buyer', value: 'buyer' },
        { label: 'Individual seller', value: 'individual_seller' },
        { label: 'Dealer', value: 'dealer' },
      ],
      admin: { position: 'sidebar', description: 'Signup intent. An admin must approve any role change.' },
      access: { update: ({ req: { user } }) => user?.role === 'admin' },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'idVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'National ID / passport checked by a moderator. Drives the "Verified ID" badge on the buyer-facing profile, same pattern Jiji and PigiaMe use.', position: 'sidebar' },
      access: { update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'moderator' },
    },
    {
      name: 'savedListings',
      type: 'relationship',
      relationTo: 'listings',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user?.role !== 'admin') {
          data.role = 'buyer'
          data.idVerified = false
        }
        if (data?.name && !data.publicSlug) {
          data.publicSlug = `${data.name}-${Math.random().toString(36).slice(2, 7)}`
            .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        }
        return data
      },
    ],
    beforeLogin: [({ user }) => {
      if (['suspended', 'banned'].includes(user.accountStatus) && (!user.suspensionEndsAt || new Date(user.suspensionEndsAt) > new Date())) throw new Error('This account is unavailable. Contact support if you believe this is an error.')
      return user
    }],
  },
}
