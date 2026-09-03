import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth'
import { clientKey, rateLimit, rateLimitedResponse, safetySignals } from '@/lib/security'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  const { id } = await params

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in required' },
      { status: 401 },
    )
  }

  const conversationId = Number(id)

  if (!Number.isFinite(conversationId)) {
    return NextResponse.json(
      { error: 'Invalid conversation ID' },
      { status: 400 },
    )
  }

  const payload = await getPayload()

  const conversation: any = await payload
    .findByID({
      collection: 'conversations',
      id: conversationId,
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => null)

  if (
    !conversation ||
    !conversation.participants.some(
      (p: any) => (typeof p === 'string' ? Number(p) : p.id) === user.id,
    )
  ) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 },
    )
  }

  const messages = await payload.find({
    collection: 'messages',
    where: {
      conversation: {
        equals: conversationId,
      },
    },
    sort: 'createdAt',
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })

  return NextResponse.json({
    conversation,
    messages: messages.docs,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(clientKey(req, 'chat-message'), 60, 60 * 60 * 1000)
  if (!limited.allowed) return rateLimitedResponse(limited.retryAfter)
  const user = await getCurrentUser()
  const { id } = await params

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in required' },
      { status: 401 },
    )
  }

  const body = await req.json().catch(() => null)

  if (!body?.body?.trim()) {
    return NextResponse.json(
      { error: 'Message required' },
      { status: 400 },
    )
  }
  const safety = safetySignals(body.body)
  if (safety.score >= 60) {
    return NextResponse.json({ error: 'This message cannot be sent. Do not request advance payment or move a transaction to an unverified channel.' }, { status: 422 })
  }

  const conversationId = Number(id)

  if (!Number.isFinite(conversationId)) {
    return NextResponse.json(
      { error: 'Invalid conversation ID' },
      { status: 400 },
    )
  }

  const payload = await getPayload()

  const conversation: any = await payload
    .findByID({
      collection: 'conversations',
      id: conversationId,
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => null)

  if (
    !conversation ||
    !conversation.participants.some(
      (p: any) => Number(typeof p === 'string' ? p : p.id) === Number(user.id),
    )
  ) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 },
    )
  }

  const message = await payload.create({
    collection: 'messages',
    data: {
      conversation: conversationId,
      sender: user.id,
      body: body.body.trim(),
    },
    overrideAccess: true,
  })

  return NextResponse.json(message, { status: 201 })
}
