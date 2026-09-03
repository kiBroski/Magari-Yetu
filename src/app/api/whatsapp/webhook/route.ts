import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getPayload } from '@/lib/payload'
import { clientKey, rateLimit, rateLimitedResponse } from '@/lib/security'
import { createClaimToken, downloadWhatsAppMedia, normaliseWhatsAppPhone, sendWhatsAppText } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  if (q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN) return new NextResponse(q.get('hub.challenge') || '', { status: 200 })
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(clientKey(req, 'whatsapp-webhook'), 300, 60 * 1000)
  if (!limited.allowed) return rateLimitedResponse(limited.retryAfter)
  const raw = await req.text()
  const signature = req.headers.get('x-hub-signature-256')
  if (process.env.WHATSAPP_APP_SECRET) {
    const expected = `sha256=${createHmac('sha256', process.env.WHATSAPP_APP_SECRET).update(raw).digest('hex')}`
    if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  const body = JSON.parse(raw || '{}')
  const changes = body?.entry?.flatMap((entry: any) => entry.changes || []) || []
  const payload = await getPayload()
  for (const change of changes) {
    const value = change.value || {}
    for (const status of value.statuses || []) await updateDelivery(payload, status)
    for (const message of value.messages || []) await receiveMessage(payload, message)
  }
  return NextResponse.json({ received: true })
}

async function receiveMessage(payload: any, message: any) {
  const fromPhone = normaliseWhatsAppPhone(message.from)
  const text = message.text?.body || message.caption || ''
  const parsed = parseListingText(text)
  const submission: any = await payload.create({ collection: 'whatsapp-submissions', data: { fromPhone, rawText: text, parsed, status: missingRequired(parsed) ? 'needs-details' : 'received', slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }, overrideAccess: true })
  await payload.create({ collection: 'whatsapp-messages', data: { direction: 'inbound', fromPhone, body: text, submission: submission.id, providerMessageId: message.id, status: 'delivered', deliveredAt: new Date().toISOString() }, overrideAccess: true })
  const media = message.image || message.video
  if (media?.id) await captureMedia(payload, submission.id, media, message.type).catch(() => undefined)
  const claimToken = createClaimToken(String(submission.id))
  await payload.update({ collection: 'whatsapp-submissions', id: submission.id, data: { claimExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }, overrideAccess: true })
  const link = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/sell?waClaim=${encodeURIComponent(claimToken)}`
  const instructions = missingRequired(parsed) ? 'We saved your draft, but need a few more vehicle details.' : 'We saved your vehicle draft.'
  await sendWhatsAppText(fromPhone, `${instructions} Open this secure link within 24 hours to sign in, review details and submit it: ${link}`, String(submission.id)).catch(() => undefined)
}

async function captureMedia(payload: any, submissionId: string, media: any, type: string) {
  const file = await downloadWhatsAppMedia(media.id)
  const extension = type === 'video' ? 'mp4' : 'jpg'
  await payload.create({ collection: 'whatsapp-media', data: { submission: submissionId, providerMediaId: media.id }, file: { data: file.data, mimetype: file.mimeType, name: `whatsapp-${media.id}.${extension}`, size: file.data.length }, overrideAccess: true })
}

async function updateDelivery(payload: any, status: any) {
  const result: any = await payload.find({ collection: 'whatsapp-messages', where: { providerMessageId: { equals: status.id } }, limit: 1, overrideAccess: true })
  const message = result.docs[0]
  if (!message) return
  const data: any = { status: status.status }
  if (status.status === 'delivered') data.deliveredAt = new Date().toISOString()
  if (status.status === 'read') data.readAt = new Date().toISOString()
  if (status.status === 'failed') data.lastError = status.errors?.[0]?.title || 'Provider delivery failed'
  await payload.update({ collection: 'whatsapp-messages', id: message.id, data, overrideAccess: true })
}

function parseListingText(text: string) {
  const field = (name: string) => new RegExp(`${name}\\s*[:=-]\\s*([^\\n]+)`, 'i').exec(text)?.[1]?.trim()
  const location = field('location')
  return { make: field('make'), model: field('model'), yearOfManufacture: Number(field('year')) || undefined, price: Number((field('price') || '').replace(/[^0-9]/g, '')) || undefined, mileageKm: Number((field('mileage') || '').replace(/[^0-9]/g, '')) || undefined, county: field('county') || location, town: field('town'), condition: field('condition'), description: field('description') || text }
}

function missingRequired(parsed: any) { return !parsed.make || !parsed.model || !parsed.yearOfManufacture || !parsed.price }
