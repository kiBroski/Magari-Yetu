// Direct Safaricom Daraja integration — no third-party payment aggregator,
// no per-transaction markup on top of Safaricom's own fees. Two mechanical
// differences from the IntaSend version this replaced, worth internalizing
// before touching this file again:
//
// 1. Two separate API calls, not one. Daraja requires a short-lived OAuth
//    token (fetched via HTTP Basic Auth on ConsumerKey:ConsumerSecret)
//    before it will accept an STK push request — IntaSend needed only a
//    single static secret key.
// 2. No webhook-signing secret. Where IntaSend let you configure a shared
//    challenge value it echoed back on every callback, Daraja's callback
//    carries no equivalent — there is no header to check here. Authenticity
//    is instead established inside callback/route.ts itself, by matching
//    the CheckoutRequestID against a genuinely pending order in the
//    database and checking the reported amount matches. That check needs
//    database access this module deliberately doesn't have, which is why
//    there's no verifyMpesaWebhookSignature() replacement in this file —
//    it isn't an oversight, the check just moved to where it actually
//    needed to live.
//
// Written against Safaricom's publicly documented Daraja API (Lipa Na
// M-Pesa Online / STK Push). Not execution-tested against a live sandbox
// account in this environment — confirm against developer.safaricom.co.ke's
// own docs if anything here doesn't match on first run, particularly the
// exact CallbackMetadata item names, which Safaricom has adjusted before.

const MPESA_BASE_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke'

interface StkPushArgs {
  phoneNumber: string // 2547XXXXXXXX
  amountKes: number
  reference: string // your own order id — becomes Daraja's AccountReference
  narrative: string // becomes Daraja's TransactionDesc
}

interface StkPushResult {
  checkoutId: string // Daraja's CheckoutRequestID — same role providerCheckoutId played with IntaSend's invoice_id
  raw: unknown
}

// Cached in module scope, which works fine within one warm serverless
// instance but is not a distributed cache — a cold start (a fresh Vercel
// function invocation) means a fresh cache miss and one extra OAuth round
// trip. That's a minor efficiency cost, not a correctness problem: it just
// means don't expect this cache to reliably survive between requests
// serverless-side the way it would on a long-running server.
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value
  }
  const credentials = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64')
  const res = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Daraja OAuth token request failed (${res.status}): ${body}`)
  }
  const data = await res.json()
  // expires_in is in seconds (typically 3599) — refresh a minute early so a
  // request never lands right on the expiry boundary.
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000 }
  return cachedToken.value
}

function darajaTimestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export async function initiateMpesaStkPush({ phoneNumber, amountKes, reference, narrative }: StkPushArgs): Promise<StkPushResult> {
  const token = await getAccessToken()
  const timestamp = darajaTimestamp()
  // Password is Base64(Shortcode + Passkey + Timestamp) — regenerated every
  // call since it embeds the current timestamp. This has no IntaSend
  // equivalent; it's Daraja-specific.
  const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64')

  const res = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amountKes),
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      // Daraja requires this to be a real, publicly reachable HTTPS URL —
      // localhost will not work. Test against a deployed staging URL or a
      // tunnel (e.g. ngrok) during local development.
      CallBackURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payments/mpesa/callback`,
      AccountReference: reference,
      TransactionDesc: narrative,
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok || data?.ResponseCode !== '0') {
    throw new Error(`Daraja STK push failed: ${data?.errorMessage ?? data?.ResponseDescription ?? res.statusText}`)
  }

  return { checkoutId: data.CheckoutRequestID, raw: data }
}
