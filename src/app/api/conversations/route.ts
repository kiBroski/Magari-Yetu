import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth'
import { clientKey, rateLimit, rateLimitedResponse } from '@/lib/security'

export async function POST(req: NextRequest) {
  const limited = rateLimit(clientKey(req, 'conversation'), 20, 60 * 60 * 1000)
  if (!limited.allowed) return rateLimitedResponse(limited.retryAfter)
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body?.recipientId || body.recipientId === user.id) return NextResponse.json({ error: 'A different recipient is required' }, { status: 400 })
  const payload = await getPayload()
  const existing = await payload.find({ collection: 'conversations', where: { and: [{ participants: { contains: user.id } }, { participants: { contains: body.recipientId } }, ...(body.listingId ? [{ listing: { equals: body.listingId } }] : [])] }, limit: 1, overrideAccess: true })
  const conversation = existing.docs[0] || await payload.create({ collection: 'conversations', data: { participants: [user.id, body.recipientId], listing: body.listingId } as any, overrideAccess: true })
  return NextResponse.json({ id: conversation.id }, { status: existing.docs[0] ? 200 : 201 })
}
