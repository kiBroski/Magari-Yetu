import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { requireRole } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'

const statuses = ['active', 'rejected', 'pending-review', 'expired']
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole('admin', 'moderator')
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || !statuses.includes(body.status)) return NextResponse.json({ error: 'Invalid listing moderation status' }, { status: 400 })
  const payload = await getPayload()
  const previous: any = await payload.findByID({ collection: 'listings', id, overrideAccess: true }).catch(() => null)
  if (!previous) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  const listing = await (payload as any).update({ collection: 'listings', id, data: { status: body.status, moderationNote: body.note || undefined }, overrideAccess: true })
  await writeAudit(payload, { actor: String(actor.id), action: `listing.${body.status}`, targetType: 'listing', targetId: id, previous: { status: previous.status }, next: { status: body.status }, note: body.note, ip: req.headers.get('x-forwarded-for') || undefined })
  return NextResponse.json(listing)
}
