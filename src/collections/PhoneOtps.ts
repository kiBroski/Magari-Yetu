import type { CollectionConfig } from 'payload'

// A purely internal, server-only table backing phone-OTP login (see
// src/app/api/auth/otp/*). It intentionally has NO public access at all —
// access is locked to `() => false` on every operation, so it's invisible
// to the REST API and the admin panel's regular users. The OTP request/
// verify route handlers still work because Payload's Local API bypasses
// `access` by default for trusted server code (no `overrideAccess: false`
// is passed there) — this table is exactly the kind of thing that pattern
// exists for: server-only bookkeeping that must never be reachable over
// HTTP by anyone, including a logged-in user poking at the API directly.
export const PhoneOtps: CollectionConfig = {
  slug: 'phone-otps',
  admin: { useAsTitle: 'phone', defaultColumns: ['phone', 'expiresAt', 'consumed'] },
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'phone', type: 'text', required: true, index: true },
    { name: 'codeHash', type: 'text', required: true },
    { name: 'expiresAt', type: 'date', required: true },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'consumed', type: 'checkbox', defaultValue: false },
  ],
}
