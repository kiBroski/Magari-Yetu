import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { requireRole } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
const statuses = ['open', 'triaged', 'under-review', 'actioned', 'resolved', 'dismissed']
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole('admin', 'moderator'); const { id } = await params; const body = await req.json().catch(() => null)
  if (!body || !statuses.includes(body.status)) return NextResponse.json({ error: 'Invalid report status' }, { status: 400 })
  const payload = await getPayload(); const previous: any = await payload.findByID({ collection: 'reports', id, overrideAccess: true }).catch(() => null)
  if (!previous) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  const report = await (payload as any).update({ collection: 'reports', id, data: { status: body.status, assignedTo: actor.id, moderatorNote: body.note || undefined, resolution: body.resolution || undefined }, overrideAccess: true })
  await writeAudit(payload, { actor: String(actor.id), action: `report.${body.status}`, targetType: 'report', targetId: id, previous: { status: previous.status }, next: { status: body.status }, note: body.note })
  return NextResponse.json(report)
}
