import type { CollectionConfig } from 'payload'

export const SavedSearches: CollectionConfig = {
  slug: 'saved-searches',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'frequency', 'active', 'user', 'updatedAt'],
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => {
      if (!user) return false
      if (['admin', 'moderator'].includes(user.role)) return true
      return { user: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (['admin', 'moderator'].includes(user.role)) return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }) => user?.id,
    },
    { name: 'name', type: 'text', required: true },
    {
      name: 'queryString',
      type: 'text',
      required: true,
      admin: {
        description: 'Normalised URL query, without the leading question mark.',
      },
    },
    {
      name: 'filters',
      type: 'json',
      admin: {
        description: 'Structured copy of the saved search filters.',
      },
    },
    {
      name: 'frequency',
      type: 'select',
      required: true,
      defaultValue: 'daily',
      options: [
        { label: 'Instant', value: 'instant' },
        { label: 'Daily digest', value: 'daily' },
        { label: 'Weekly digest', value: 'weekly' },
        { label: 'Off', value: 'off' },
      ],
    },
    {
      name: 'channels',
      type: 'select',
      hasMany: true,
      defaultValue: ['in-app'],
      options: [
        { label: 'In-app', value: 'in-app' },
        { label: 'Email', value: 'email' },
        { label: 'SMS', value: 'sms' },
        { label: 'WhatsApp', value: 'whatsapp' },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'lastNotifiedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Updated by the alerts worker.',
      },
    },
  ],
}