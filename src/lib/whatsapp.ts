import crypto from 'crypto'
import { getPayload } from '@/lib/payload'

const apiVersion = 'v21.0'
const base = `https://graph.facebook.com/${apiVersion}`

function credentials() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneNumberId || !token) throw new Error('WhatsApp Cloud API is not configured')
  return { phoneNumberId, token }
}

export function normaliseWhatsAppPhone(phone = '') { return phone.replace(/\D/g, '').replace(/^0/, '254') }

export function createClaimToken(submissionId: string) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24
  const secret = process.env.WHATSAPP_CLAIM_SECRET || process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('WHATSAPP_CLAIM_SECRET is not configured')
  const sig = crypto.createHmac('sha256', secret).update(`${submissionId}.${exp}`).digest('base64url')
  return `${submissionId}.${exp}.${sig}`
}

export function verifyClaimToken(token?: string) {
  const [id, rawExp, signature] = String(token || '').split('.')
  const exp = Number(rawExp)
  const secret = process.env.WHATSAPP_CLAIM_SECRET || process.env.PAYLOAD_SECRET
  if (!id || !signature || !secret || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null
  const expected = crypto.createHmac('sha256', secret).update(`${id}.${exp}`).digest('base64url')
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  return { id, exp }
}

export async function sendWhatsAppText(to: string, body: string, submissionId?: string) {
  const { phoneNumberId, token } = credentials()
  const payload = await getPayload()
  const delivery: any = await (payload as any).create({ collection: 'whatsapp-messages', data: { direction: 'outbound', toPhone: normaliseWhatsAppPhone(to), body, submission: submissionId, status: 'queued', attempts: 1 }, overrideAccess: true })
  try {
    const response = await fetch(`${base}/${phoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: normaliseWhatsAppPhone(to), type: 'text', text: { preview_url: false, body } }) })
    const result = await response.json()
    if (!response.ok) throw new Error(result?.error?.message || 'WhatsApp request failed')
    return await (payload as any).update({ collection: 'whatsapp-messages', id: delivery.id, data: { providerMessageId: result.messages?.[0]?.id, status: 'sent', sentAt: new Date().toISOString() }, overrideAccess: true })
  } catch (error) {
    await (payload as any).update({ collection: 'whatsapp-messages', id: delivery.id, data: { status: 'failed', lastError: error instanceof Error ? error.message : 'Unknown send error' }, overrideAccess: true })
    throw error
  }
}

export async function downloadWhatsAppMedia(mediaId: string) {
  const { token } = credentials()
  const metadata = await fetch(`${base}/${mediaId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
  if (!metadata?.url) throw new Error('WhatsApp media URL unavailable')
  const response = await fetch(metadata.url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error('WhatsApp media download failed')
  return { data: Buffer.from(await response.arrayBuffer()), mimeType: metadata.mime_type || response.headers.get('content-type') || 'application/octet-stream' }
}
