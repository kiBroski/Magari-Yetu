import type { CollectionConfig } from 'payload'

export const WhatsAppSubmissions: CollectionConfig = {
  slug: 'whatsapp-submissions', admin: { useAsTitle: 'fromPhone', defaultColumns: ['fromPhone', 'status', 'onboardingStatus', 'createdAt'] },
  access: { create: () => false, read: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? ''), update: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? ''), delete: ({ req: { user } }) => user?.role === 'admin' },
  fields: [
    { name: 'fromPhone', type: 'text', required: true, index: true }, { name: 'rawText', type: 'textarea' }, { name: 'parsed', type: 'json' },
    { name: 'claimedBy', type: 'relationship', relationTo: 'users' }, { name: 'claimTokenUsedAt', type: 'date' }, { name: 'claimExpiresAt', type: 'date' },
    { name: 'status', type: 'select', defaultValue: 'received', options: ['received', 'needs-details', 'claimed', 'under-review', 'approved', 'rejected', 'converted'].map(value => ({ value, label: value })) },
    { name: 'onboardingStatus', type: 'select', defaultValue: 'unassigned', options: ['unassigned', 'assigned', 'awaiting-dealer', 'dealer-approved', 'completed'].map(value => ({ value, label: value })) },
    { name: 'assignedTo', type: 'relationship', relationTo: 'users' }, { name: 'followUpAt', type: 'date' }, { name: 'slaDueAt', type: 'date' }, { name: 'staffNotes', type: 'textarea' }, { name: 'dealer', type: 'relationship', relationTo: 'dealers' }, { name: 'listing', type: 'relationship', relationTo: 'listings' },
  ],
}
