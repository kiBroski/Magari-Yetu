import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getPayload } from '@/lib/payload'
import { clientKey, rateLimit, rateLimitedResponse } from '@/lib/security'

const ALLOWED_FILTERS = new Set([
  'q',
  'category',
  'condition',
  'make',
  'county',
  'minPrice',
  'maxPrice',
  'dutyStatus',
])

function normaliseSearch(input: unknown) {
  const params = new URLSearchParams()

  if (!input || typeof input !== 'object') {
    return { queryString: '', filters: {} }
  }

  for (const [key, rawValue] of Object.entries(input as Record<string, unknown>)) {
    if (!ALLOWED_FILTERS.has(key)) continue

    const value = String(rawValue || '').trim()
    if (value) params.set(key, value)
  }

  const queryString = Array.from(params.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')

  return {
    queryString,
    filters: Object.fromEntries(params.entries()),
  }
}

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const payload = await getPayload()

  const result = await (payload as any).find({
    collection: 'saved-searches',
    where: { user: { equals: user.id } },
    limit: 100,
    sort: '-updatedAt',
    overrideAccess: true,
  })

  return NextResponse.json({ docs: result.docs })
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(clientKey(req, 'saved-searches'), 20, 60 * 60 * 1000)

  if (!limited.allowed) {
    return rateLimitedResponse(limited.retryAfter)
  }

  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const name = String(body?.name || '').trim()
  const frequency = body?.frequency
  const channels = Array.isArray(body?.channels) ? body.channels : ['in-app']
  const { queryString, filters } = normaliseSearch(body?.filters)

  if (!name || !queryString) {
    return NextResponse.json(
      { error: 'Enter a name and select at least one search filter.' },
      { status: 400 },
    )
  }

  if (!['instant', 'daily', 'weekly', 'off'].includes(frequency)) {
    return NextResponse.json({ error: 'Invalid alert frequency' }, { status: 400 })
  }

  const allowedChannels = ['in-app', 'email', 'sms', 'whatsapp']

  const safeChannels = channels.filter((channel: unknown) =>
    allowedChannels.includes(String(channel)),
  )

  const payload = await getPayload()

  const existing = await (payload as any).find({
    collection: 'saved-searches',
    where: {
      and: [
        { user: { equals: user.id } },
        { queryString: { equals: queryString } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    return NextResponse.json(
      { error: 'You already saved this search.' },
      { status: 409 },
    )
  }

  const savedSearch = await (payload as any).create({
    collection: 'saved-searches',
    data: {
      user: user.id,
      name,
      queryString,
      filters,
      frequency,
      channels: safeChannels.length ? safeChannels : ['in-app'],
      active: frequency !== 'off',
    },
    overrideAccess: true,
  })

  return NextResponse.json(savedSearch, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const id = Number(body?.id)

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid saved search' }, { status: 400 })
  }

  const payload = await getPayload()

  const savedSearch: any = await (payload as any)
    .findByID({
      collection: 'saved-searches',
      id,
      overrideAccess: true,
    })
    .catch(() => null)

  const ownerId =
    typeof savedSearch?.user === 'object'
      ? savedSearch.user.id
      : savedSearch?.user

  if (!savedSearch || Number(ownerId) !== Number(user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (body.action === 'delete') {
    await (payload as any).delete({
      collection: 'saved-searches',
      id,
      overrideAccess: true,
    })

    return NextResponse.json({ deleted: true })
  }

  if (body.action === 'toggle') {
    const updated = await (payload as any).update({
      collection: 'saved-searches',
      id,
      data: { active: Boolean(body.active) },
      overrideAccess: true,
    })

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}