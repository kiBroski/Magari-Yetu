import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'
import config from '@payload-config'

// This one file is what makes every collection's default REST endpoints
// live — /api/users, /api/users/login, /api/listings, /api/media,
// /api/dealers, /api/inquiries, /api/featured-orders — all generated from
// the collection configs, with each collection's own `access` rules
// enforced automatically. Client components (the sell wizard, login form,
// dashboard) talk to these directly with `credentials: 'include'`; only the
// handful of routes with extra business logic (M-Pesa, bulk upload, the
// inquiry logger) get their own custom route handler elsewhere under
// src/app/api/.

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
