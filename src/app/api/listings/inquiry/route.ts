import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth'
import { clientKey, rateLimit, rateLimitedResponse } from '@/lib/security'

// A dedicated route (rather than pointing WhatsAppButton straight at
// Payload's own /api/inquiries) exists so lead-capture gets basic
// server-side sanity checks — right now just "does this listing exist" —
// without complicating the Inquiries collection's own access rules. Uses
// the Local API (trusted server context), not the REST API.
export async function POST(req: NextRequest) {
  const limited = rateLimit(clientKey(req, 'inquiry'), 20, 60 * 60 * 1000)
  if (!limited.allowed) return rateLimitedResponse(limited.retryAfter)
  const body = await req.json().catch(() => null)
  if (!body?.listing || !body?.channel) {
    return NextResponse.json({ error: 'listing and channel are required' }, { status: 400 })
  }

  const payload = await getPayload()
  const listing = await payload.findByID({ collection: 'listings', id: body.listing }).catch(() => null)
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  const user = await getCurrentUser()

  const inquiry = await payload.create({
    collection: 'inquiries',
    data: {
      listing: body.listing,
      channel: body.channel,
      buyerUser: user?.id,
      buyerName: body.buyerName,
      buyerPhone: body.buyerPhone,
      buyerEmail: body.buyerEmail,
      message: body.message,
    },
  })

  return NextResponse.json({ id: inquiry.id }, { status: 201 })
}
