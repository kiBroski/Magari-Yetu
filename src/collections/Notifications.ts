import type { CollectionConfig } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['type', 'title', 'recipient', 'readAt', 'createdAt'],
  },
  access: {
    create: () => false,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (['admin', 'moderator'].includes(user.role)) return true
      return { recipient: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (['admin', 'moderator'].includes(user.role)) return true
      return { recipient: { equals: user.id } }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'New matching listing', value: 'new-listing' },
        { label: 'Price drop', value: 'price-drop' },
        { label: 'New verified business', value: 'new-verified-business' },
        { label: 'Wanted request response', value: 'wanted-response' },
        { label: 'System', value: 'system' },
      ],
    },
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'href', type: 'text' },
    { name: 'readAt', type: 'date' },
  ],
}