import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { resendAdapter } from '@payloadcms/email-resend'
import { buildConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './src/collections/Users'
import { Dealers } from './src/collections/Dealers'
import { Listings } from './src/collections/Listings'
import { FeaturedOrders } from './src/collections/FeaturedOrders'
import { Inquiries } from './src/collections/Inquiries'
import { Media } from './src/collections/Media'
import { Inspections } from './src/collections/Inspections'
import { PhoneOtps } from './src/collections/PhoneOtps'
import { CrspSchedule } from './src/collections/CrspSchedule'
import { ServiceProviders } from './src/collections/ServiceProviders'
import { Reviews } from './src/collections/Reviews'
import { Reports } from './src/collections/Reports'
import { Conversations } from './src/collections/Conversations'
import { Messages } from './src/collections/Messages'
import { WhatsAppSubmissions } from './src/collections/WhatsAppSubmissions'
import { ContactMessages } from './src/collections/ContactMessages'
import { AuditLogs } from './src/collections/AuditLogs'
import { VerificationDocuments } from './src/collections/VerificationDocuments'
import { WhatsAppMessages } from './src/collections/WhatsAppMessages'
import { WhatsAppMedia } from './src/collections/WhatsAppMedia'
import { SavedSearches } from './src/collections/SavedSearches'
import { Notifications } from './src/collections/Notifications'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default buildConfig({
  sharp,
  serverURL,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — Magariyetu Admin' },
  },
  collections: [
    Users,
    Dealers,
    ServiceProviders,
    Listings,
    Reviews,
    Reports,
    ContactMessages,
    SavedSearches,
    Notifications,
    AuditLogs,
    VerificationDocuments,
    Conversations,
    Messages,
    WhatsAppSubmissions,
    WhatsAppMessages,
    WhatsAppMedia,
    FeaturedOrders,
    Inquiries,
    Media,
    Inspections,
    PhoneOtps,
    CrspSchedule,
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'src/payload-types.ts') },
  email: resendAdapter({
    defaultFromAddress: 'onboarding@resend.dev',
    defaultFromName: 'Magariyetu',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: true }
          : false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    },
  }),
  cors: [serverURL],
  csrf: [serverURL],
  plugins: [
    vercelBlobStorage({
      collections: {
        media: true,
        'verification-documents': true,
        'whatsapp-media': true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})