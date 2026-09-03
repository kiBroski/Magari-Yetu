import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getPayload } from '@/lib/payload'
import { clientKey, rateLimit, rateLimitedResponse } from '@/lib/security'

function listingId(value: unknown) {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ saved: false })

  const id = listingId(req.nextUrl.searchParams.get('listingId'))
  if (!id) return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 })

  const payload = await getPayload()
  const account: any = await payload.findByID({
    collection: 'users',
    id: user.id,
    depth: 0,
    overrideAccess: true,
  })

  const savedIds = (account.savedListings || []).map((item: any) =>
    Number(typeof item === 'object' ? item.id : item),
  )

  return NextResponse.json({ saved: savedIds.includes(id) })
}

export async function PATCH(req: NextRequest) {
  const limited = rateLimit(clientKey(req, 'saved-listings'), 60, 60 * 60 * 1000)
  if (!limited.allowed) return rateLimitedResponse(limited.retryAfter)

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const id = listingId(body?.listingId)

  if (!id || !['save', 'remove'].includes(body?.action)) {
    return NextResponse.json({ error: 'Invalid saved-listing request' }, { status: 400 })
  }

  const payload = await getPayload()
  const listing = await payload.findByID({
    collection: 'listings',
    id,
    overrideAccess: true,
  }).catch(() => null)

  if (!listing || listing.status !== 'active') {
    return NextResponse.json({ error: 'Listing is not available' }, { status: 404 })
  }

  const account: any = await payload.findByID({
    collection: 'users',
    id: user.id,
    depth: 0,
    overrideAccess: true,
  })

  const current = (account.savedListings || [])
    .map((item: any) => Number(typeof item === 'object' ? item.id : item))
    .filter(Number.isFinite)

  const savedListings = body.action === 'save'
    ? Array.from(new Set([...current, id]))
    : current.filter((savedId: number) => savedId !== id)

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { savedListings } as any,
    overrideAccess: true,
  })

  return NextResponse.json({
    saved: body.action === 'save',
    savedListings,
  })
}