import type { CollectionConfig, Where } from 'payload'

// The trust gap this closes: everything else in this project verifies the
// *seller* (Dealers.verificationStatus, Users.idVerified). Nothing verified
// the *vehicle* until now. One Inspection document = one physical check of
// one specific listing, done by a moderator/admin or a designated inspector
// account, resulting in a pass/fail checklist and an optional PDF report.
// The badge this produces (InspectedBadge.tsx) is deliberately a separate
// visual from VerifiedBadge — a buyer needs to be able to tell "this seller
// is who they say they are" apart from "this specific car was mechanically
// checked." Conflating the two is exactly the kind of trust-signal mush
// that lets bad listings hide behind an unrelated seller's good reputation.

export const Inspections: CollectionConfig = {
  slug: 'inspections',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['listing', 'status', 'overallResult', 'inspectionDate'],
  },
  access: {
    // A listing's inspection is public once completed — that's the whole
    // point, it's the trust artifact a buyer clicks through to. Requested/
    // scheduled ones are only visible to the seller and staff so a pending
    // inspection isn't mistaken for a completed one by anyone browsing.
    read: ({ req: { user } }): boolean | Where => {
      if (user?.role === 'admin' || user?.role === 'moderator') return true
      return { or: [{ status: { equals: 'completed' } }, { 'listing.seller': { equals: user?.id ?? '' } }] }
    },
    // Any logged-in user can *request* an inspection on their own listing.
    // Only staff can actually fill in results — enforced per-field below.
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'moderator',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'listing', type: 'relationship', relationTo: 'listings', required: true },
    { name: 'requestedBy', type: 'relationship', relationTo: 'users', defaultValue: ({ user }) => user?.id },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'requested',
      options: ['requested', 'scheduled', 'completed', 'failed'].map((v) => ({ label: v, value: v })),
      access: { update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'moderator' },
    },
    { name: 'inspector', type: 'relationship', relationTo: 'users', admin: { description: 'Staff account that performed the check.' } },
    { name: 'inspectionDate', type: 'date' },
    {
      name: 'checklist',
      type: 'array',
      admin: { description: 'e.g. Engine, Transmission, Brakes, Suspension, Electricals, Body/frame, Logbook match, Chassis/VIN match.' },
      fields: [
        { name: 'item', type: 'text', required: true },
        { name: 'result', type: 'select', options: ['pass', 'fail', 'not-applicable'].map((v) => ({ label: v, value: v })) },
        { name: 'note', type: 'text' },
      ],
    },
    {
      name: 'overallResult',
      type: 'select',
      options: [
        { label: 'Pass', value: 'pass' },
        { label: 'Pass with notes', value: 'pass-with-notes' },
        { label: 'Fail', value: 'fail' },
      ],
      access: { update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'moderator' },
    },
    { name: 'reportFile', type: 'upload', relationTo: 'media', admin: { description: 'PDF report, shown to buyers as "View inspection report" on the listing.' } },
  ],
}
