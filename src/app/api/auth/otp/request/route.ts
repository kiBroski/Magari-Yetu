import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from '@/lib/payload'
import { sendSms } from '@/lib/sms'
import { clientKey, rateLimit, rateLimitedResponse } from '@/lib/security'

// Step 1 of phone-first login. Kenya is overwhelmingly phone-first, and
// Payload's built-in auth is email+password only — this and ./verify are a
// standard, well-documented workaround pattern (OTP gate → Payload's own
// Local API login()) rather than reimplementing auth from scratch. See the
// longer note in ./verify/route.ts for exactly how the handoff works.
function hashCode(code: string) {
  const secret = process.env.OTP_HASH_SECRET
  if (!secret) throw new Error('OTP_HASH_SECRET is not configured')
  return crypto.createHash('sha256').update(`${code}:${secret}`).digest('hex')
}

const OTP_TTL_MS = 5 * 60 * 1000

export async function POST(req: NextRequest) {
  const limited = rateLimit(clientKey(req, 'otp-request'), 5, 60 * 60 * 1000)
  if (!limited.allowed) return rateLimitedResponse(limited.retryAfter)
  if (!process.env.OTP_HASH_SECRET) {
    return NextResponse.json({ error: 'Phone login is temporarily unavailable.' }, { status: 503 })
  }
  const { phone } = await req.json().catch(() => ({}))
  if (!phone || !/^2547\d{8}$/.test(phone)) {
    return NextResponse.json({ error: 'phone must be in 2547XXXXXXXX format' }, { status: 400 })
  }

  const payload = await getPayload()

  // Basic rate limit: no more than one active (unconsumed, unexpired) OTP
  // per phone at a time — stops someone spamming themselves an SMS every
  // second. A real deployment should add IP-based limiting on top of this.
  const { docs: existing } = await payload.find({
    collection: 'phone-otps',
    where: { and: [{ phone: { equals: phone } }, { consumed: { equals: false } }, { expiresAt: { greater_than: new Date().toISOString() } }] },
    limit: 1,
  })
  if (existing.length > 0) {
    return NextResponse.json({ error: 'An OTP was already sent recently — check your phone or wait a minute.' }, { status: 429 })
  }

  const code = String(crypto.randomInt(100000, 999999))
  await payload.create({
    collection: 'phone-otps',
    data: {
      phone,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    },
  })

  try {
    await sendSms(phone, `Your Magariyetu verification code is ${code}. It expires in 5 minutes.`)
  } catch (err) {
    return NextResponse.json({ error: 'Could not send the SMS — try again shortly.' }, { status: 502 })
  }

  return NextResponse.json({ sent: true })
}
