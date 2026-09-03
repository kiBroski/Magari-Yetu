import type { CollectionConfig } from 'payload'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs', admin: { useAsTitle: 'action', defaultColumns: ['action', 'targetType', 'targetId', 'actor', 'createdAt'] },
  access: { create: () => false, read: ({ req: { user } }) => ['admin', 'moderator'].includes(user?.role ?? ''), update: () => false, delete: ({ req: { user } }) => user?.role === 'admin' },
  fields: [
    { name: 'actor', type: 'relationship', relationTo: 'users' }, { name: 'action', type: 'text', required: true }, { name: 'targetType', type: 'text', required: true }, { name: 'targetId', type: 'text', required: true },
    { name: 'previous', type: 'json' }, { name: 'next', type: 'json' }, { name: 'note', type: 'textarea' }, { name: 'ip', type: 'text' },
  ],
}
