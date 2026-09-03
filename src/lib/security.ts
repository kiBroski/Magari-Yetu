import { NextRequest, NextResponse } from 'next/server'

type Window = { count: number; resetAt: number }
const windows = new Map<string, Window>()

export function clientKey(req: NextRequest, scope: string) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return `${scope}:${forwarded || req.headers.get('x-real-ip') || 'local'}`
}

// Development fallback. In production this must be replaced by a shared
// store (Redis/Upstash) so limits work across server instances.
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = windows.get(key)
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }
  current.count += 1
  return { allowed: current.count <= limit, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
}

export function rateLimitedResponse(retryAfter: number) {
  return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } })
}

export async function verifyTurnstile(token: unknown, req: NextRequest) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // local/staging may omit it; production startup must require it.
  if (typeof token !== 'string' || !token) return false
  const data = new FormData()
  data.set('secret', secret)
  data.set('response', token)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (ip) data.set('remoteip', ip)
  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: data }).then((r) => r.json()).catch(() => null)
  return result?.success === true
}

const suspiciousPatterns = [/\b(telegram|signal)\b/i, /\b(pay|send|deposit|advance).{0,20}\b(before|prior).{0,20}\b(view|inspect)/i, /https?:\/\//i, /\bbitco(in|ins)\b/i]
export function safetySignals(input: string) {
  const matches = suspiciousPatterns.filter((pattern) => pattern.test(input)).map((pattern) => pattern.source)
  const phones = input.match(/(?:\+?254|0)7\d{8}/g) ?? []
  return { matches, phones, score: Math.min(100, matches.length * 20 + Math.max(0, phones.length - 1) * 10) }
}
