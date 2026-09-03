import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { getPayload } from '@/lib/payload'
import { writeAudit } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole('admin', 'moderator')
  const { id } = await params
  const { verificationStatus, note, verificationExpiresAt } = await req.json().catch(() => ({}))
  if (!['unverified', 'pending', 'verified', 'rejected', 'expired'].includes(verificationStatus)) return NextResponse.json({ error: 'Invalid verification status' }, { status: 400 })
  const payload = await getPayload()
  const previous: any = await payload.findByID({ collection: 'service-providers', id, overrideAccess: true }).catch(() => null)
  if (!previous) return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  const provider = await (payload as any).update({ collection: 'service-providers', id, data: { verificationStatus, verificationNote: note || undefined, verificationExpiresAt: verificationExpiresAt || undefined }, overrideAccess: true })
  await writeAudit(payload, { actor: String(actor.id), action: `service-provider.${verificationStatus}`, targetType: 'service-provider', targetId: id, previous: { verificationStatus: previous.verificationStatus }, next: { verificationStatus, verificationExpiresAt }, note, ip: req.headers.get('x-forwarded-for') || undefined })
  return NextResponse.json(provider)
}
