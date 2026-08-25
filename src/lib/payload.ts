import { getPayload as getPayloadInstance, type Payload } from 'payload'
import config from '@payload-config'

// Payload's Local API lets server components and route handlers query the
// database directly (no HTTP round-trip to your own API). This memoizes the
// instance per server process so we're not re-initializing Payload on every
// request — important in dev with hot reload, essential in serverless.
let cached: Promise<Payload> | null = null

export function getPayload(): Promise<Payload> {
  if (!cached) {
    cached = getPayloadInstance({ config })
  }
  return cached
}
