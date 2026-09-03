import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { requireRole } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
const states = ['active', 'warned', 'suspended', 'banned']
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole('admin', 'moderator')
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || !states.includes(body.accountStatus)) return NextResponse.json({ error: 'Invalid account status' }, { status: 400 })
  if (id === String(actor.id) && body.accountStatus !== 'active') return NextResponse.json({ error: 'You cannot restrict your own account' }, { status: 400 })
  const payload = await getPayload()
  const previous: any = await payload.findByID({ collection: 'users', id, overrideAccess: true }).catch(() => null)
  if (!previous) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const user = await (payload as any).update({ collection: 'users', id, data: { accountStatus: body.accountStatus, suspensionEndsAt: body.suspensionEndsAt || null, moderationNote: body.note || undefined }, overrideAccess: true })
  await writeAudit(payload, { actor: String(actor.id), action: `user.${body.accountStatus}`, targetType: 'user', targetId: id, previous: { accountStatus: previous.accountStatus }, next: { accountStatus: body.accountStatus, suspensionEndsAt: body.suspensionEndsAt }, note: body.note, ip: req.headers.get('x-forwarded-for') || undefined })
  return NextResponse.json(user)
}
