import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requireRole } from '@/lib/auth'
import { getPayload } from '@/lib/payload'
import { normaliseWhatsAppPhone, verifyClaimToken } from '@/lib/whatsapp'
import { writeAudit } from '@/lib/audit'
import { sendWhatsAppText } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const claim = verifyClaimToken(req.nextUrl.searchParams.get('claimToken') || undefined)
  if (claim) {
    const submission: any = await (await getPayload()).findByID({ collection: 'whatsapp-submissions', id: claim.id, overrideAccess: true }).catch(() => null)
    if (!submission || submission.claimTokenUsedAt) return NextResponse.json({ error: 'This draft link is no longer available.' }, { status: 404 })
    return NextResponse.json({ draft: submission })
  }
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  const payload = await getPayload()
  const isStaff = ['admin', 'moderator'].includes(user.role)
  const result = await payload.find({ collection: 'whatsapp-submissions', where: isStaff ? {} : { fromPhone: { equals: normaliseWhatsAppPhone(user.phone) } }, limit: 100, sort: '-createdAt', overrideAccess: true })
  return NextResponse.json({ docs: result.docs })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  const body = await req.json().catch(() => null)
  if (!user || !body?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  const payload = await getPayload()
  const submission: any = await payload.findByID({ collection: 'whatsapp-submissions', id: body.id, overrideAccess: true }).catch(() => null)
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const isStaff = ['admin', 'moderator'].includes(user.role)
  if (body.action === 'claim') {
    const token = verifyClaimToken(body.claimToken)
    if (!token || token.id !== String(submission.id) || submission.claimTokenUsedAt) return NextResponse.json({ error: 'This secure draft link has expired or was already used.' }, { status: 403 })
    if (normaliseWhatsAppPhone(submission.fromPhone) !== normaliseWhatsAppPhone(user.phone) && !isStaff) return NextResponse.json({ error: 'This WhatsApp number does not match your account' }, { status: 403 })
    const updated = await (payload as any).update({ collection: 'whatsapp-submissions', id: body.id, data: { claimedBy: user.id, status: 'claimed', claimTokenUsedAt: new Date().toISOString() }, overrideAccess: true })
    return NextResponse.json(updated)
  }
  if (body.action === 'convert') {
    const claimedBy = typeof submission.claimedBy === 'object' ? submission.claimedBy?.id : submission.claimedBy
    if (claimedBy !== user.id && !isStaff) return NextResponse.json({ error: 'Claim this draft first' }, { status: 403 })
    const updated = await (payload as any).update({ collection: 'whatsapp-submissions', id: body.id, data: { status: 'under-review', listing: body.listingId || undefined }, overrideAccess: true })
    await sendWhatsAppText(submission.fromPhone, 'Your Magariyetu listing has been submitted for review. We will update you here once it is approved or if more details are needed.', String(submission.id)).catch(() => undefined)
    return NextResponse.json(updated)
  }
  await requireRole('admin', 'moderator')
  const allowed = ['received', 'needs-details', 'claimed', 'under-review', 'approved', 'rejected', 'converted']
  if (!allowed.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  const updated = await (payload as any).update({ collection: 'whatsapp-submissions', id: body.id, data: { status: body.status, assignedTo: body.assignedTo || user.id, onboardingStatus: body.onboardingStatus, followUpAt: body.followUpAt, staffNotes: body.staffNotes }, overrideAccess: true })
  await writeAudit(payload, { actor: String(user.id), action: `whatsapp-submission.${body.status}`, targetType: 'whatsapp-submission', targetId: String(submission.id), previous: { status: submission.status }, next: { status: body.status }, note: body.staffNotes })
  const updates: Record<string, string> = { 'needs-details': 'Magariyetu needs a few more details before your listing can be reviewed. Please reply with the requested information.', approved: 'Your Magariyetu listing was approved and is now live.', rejected: 'Your Magariyetu listing could not be approved. Our team will share the reason or next steps.', 'under-review': 'Your Magariyetu listing is under review.' }
  if (updates[body.status]) await sendWhatsAppText(submission.fromPhone, updates[body.status], String(submission.id)).catch(() => undefined)
  return NextResponse.json(updated)
}
