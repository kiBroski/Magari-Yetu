import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from '@/lib/payload'

// Step 2. How the OTP-to-session handoff actually works, since Payload
// doesn't have a native passwordless flow:
//
//   1. Verify the submitted code against the stored hash (below).
//   2. Find-or-create a Users doc for that phone number, with a freshly
//      generated random password nobody will ever see or need — the user
//      never authenticates with a password, this exists only because
//      Payload's schema requires one.
//   3. Call Payload's own Local API `payload.login()` with that random
//      password to get back a real, correctly-signed session token — this
//      reuses Payload's actual auth machinery rather than hand-rolling JWT
//      signing, which is the part of this you really don't want hand-rolled.
//   4. Set that token as the `payload-token` cookie ourselves, since
//      Local API calls don't go through HTTP and so don't set cookies the
//      way REST endpoints normally do.
//
// NOTE — flagging honestly rather than pretending certainty: this was
// written against documented Payload 3 Local API behaviour but not run
// against a live instance in this environment (no Postgres available here).
// Two things worth double-checking the moment you run it for real: that
// `payload.login()`'s return shape matches what's used below, and that your
// project's cookie name is in fact `payload-token` (it is by default, but
// confirm against a normal REST /login response's Set-Cookie header if this
// doesn't log you in).

function hashCode(code: string) {
  const secret = process.env.OTP_HASH_SECRET
  if (!secret) throw new Error('OTP_HASH_SECRET is not configured')
  return crypto.createHash('sha256').update(`${code}:${secret}`).digest('hex')
}

export async function POST(req: NextRequest) {
  if (!process.env.OTP_HASH_SECRET) {
    return NextResponse.json({ error: 'Phone login is temporarily unavailable.' }, { status: 503 })
  }
  const { phone, code, name } = await req.json().catch(() => ({}))
  if (!phone || !/^2547\d{8}$/.test(phone) || !/^\d{6}$/.test(String(code))) {
    return NextResponse.json({ error: 'phone and code are required' }, { status: 400 })
  }

  const payload = await getPayload()

  const { docs } = await payload.find({
    collection: 'phone-otps',
    where: { and: [{ phone: { equals: phone } }, { consumed: { equals: false } }] },
    sort: '-createdAt',
    limit: 1,
  })
  const otpRecord = docs[0]

  if (!otpRecord || new Date(otpRecord.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'That code has expired — request a new one.' }, { status: 400 })
  }
  const attempts = otpRecord.attempts ?? 0
  if (attempts >= 5) {
    return NextResponse.json({ error: 'Too many attempts — request a new code.' }, { status: 429 })
  }
  if (hashCode(String(code)) !== otpRecord.codeHash) {
    await payload.update({ collection: 'phone-otps', id: otpRecord.id, data: { attempts: attempts + 1 } })
    return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 })
  }

  await payload.update({ collection: 'phone-otps', id: otpRecord.id, data: { consumed: true } })

  // Find or create the user. Phone-only signups get a placeholder email
  // (phone@phone.magariyetu.local) since Payload's Users collection
  // requires a unique email for its auth strategy — genuinely a Payload
  // constraint, not a design choice; a user who later adds a real email in
  // their profile settings can log in either way afterward.
  const randomPassword = crypto.randomBytes(24).toString('hex')
  let user
  const { docs: existingUsers } = await payload.find({ collection: 'users', where: { phone: { equals: phone } }, limit: 1 })

  if (existingUsers[0]) {
    user = existingUsers[0]
    await payload.update({ collection: 'users', id: user.id, data: { password: randomPassword } })
  } else {
    user = await payload.create({
      collection: 'users',
      data: {
        name: name || 'Magariyetu User',
        phone,
        email: `${phone}@phone.magariyetu.local`,
        password: randomPassword,
        role: 'buyer',
      },
    })
  }

  const { token } = await payload.login({
    collection: 'users',
    data: { email: user.email, password: randomPassword },
  })
  if (!token) return NextResponse.json({ error: 'Login failed after verification.' }, { status: 500 })

  const response = NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } })
  response.cookies.set('payload-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  })
  return response
}
