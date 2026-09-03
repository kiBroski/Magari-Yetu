import type { CollectionConfig } from 'payload'

const services = ['certified-mechanic', 'auto-electrical', 'body-painting', 'tinting', 'detailing', 'identity-marking', 'inspection', 'spare-parts', 'car-hire', 'leasing', 'towing']

export const ServiceProviders: CollectionConfig = {
  slug: 'service-providers', admin: { useAsTitle: 'businessName', defaultColumns: ['businessName', 'verificationStatus', 'county'] },
  access: { read: () => true, create: ({ req: { user } }) => Boolean(user), update: ({ req: { user } }) => user ? (['admin', 'moderator'].includes(user.role) ? true : { owner: { equals: user.id } }) : false, delete: ({ req: { user } }) => user?.role === 'admin' },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, defaultValue: ({ user }) => user?.id },
    { name: 'businessName', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'logo', type: 'upload', relationTo: 'media' }, { name: 'description', type: 'textarea', required: true },
    { name: 'services', type: 'select', hasMany: true, required: true, options: services.map(value => ({ value, label: value.replace(/-/g, ' ') })) },
    { name: 'makesServiced', type: 'text', admin: { description: 'Comma-separated makes/models.' } }, { name: 'website', type: 'text' },
    { name: 'contactPhone', type: 'text', required: true }, { name: 'whatsappNumber', type: 'text' }, { name: 'county', type: 'text', required: true }, { name: 'town', type: 'text' }, { name: 'physicalAddress', type: 'text' }, { name: 'latitude', type: 'number', min: -5, max: 6 }, { name: 'longitude', type: 'number', min: 33, max: 43 },
    { name: 'verificationStatus', type: 'select', defaultValue: 'pending', options: ['unverified', 'pending', 'verified', 'rejected', 'expired'].map(value => ({ value, label: value })), access: { update: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? '') } }, { name: 'verificationExpiresAt', type: 'date', access: { update: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? '') } }, { name: 'verificationNote', type: 'textarea', access: { update: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? '') } },
  ], hooks: { beforeValidate: [({ data }) => { if (data?.businessName && !data.slug) data.slug = data.businessName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); return data }] },
}
