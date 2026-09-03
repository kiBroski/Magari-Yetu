import type { CollectionConfig } from 'payload'

// Files are deliberately not in Media: this private collection has no public
// read route and its local fallback directory is outside Next's public folder.
export const VerificationDocuments: CollectionConfig = {
  slug: 'verification-documents', admin: { useAsTitle: 'filename', defaultColumns: ['ownerType', 'status', 'expiresAt', 'createdAt'] },
  upload: { staticDir: '../private-documents', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] },
  access: { create: ({ req: { user } }) => Boolean(user), read: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? ''), update: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? ''), delete: ({ req: { user } }) => user?.role === 'admin' },
  fields: [
    { name: 'ownerType', type: 'select', required: true, options: ['user', 'dealer', 'service-provider'].map(value => ({ value, label: value })) }, { name: 'ownerId', type: 'text', required: true },
    { name: 'documentType', type: 'select', required: true, options: ['national-id', 'business-permit', 'kra-pin', 'professional-certificate', 'other'].map(value => ({ value, label: value })) },
    { name: 'status', type: 'select', defaultValue: 'pending', options: ['pending', 'accepted', 'rejected', 'expired'].map(value => ({ value, label: value })) }, { name: 'expiresAt', type: 'date' }, { name: 'reviewNote', type: 'textarea' }, { name: 'reviewedBy', type: 'relationship', relationTo: 'users' }, { name: 'reviewedAt', type: 'date' },
  ],
}
