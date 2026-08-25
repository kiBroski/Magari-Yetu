// Africa's Talking SMS, used for two unrelated things: phone-OTP login
// (src/app/api/auth/otp/*) and seller lead notifications (Inquiries.ts's
// afterChange hook). Plain fetch against their REST API rather than their
// Node SDK — this is a two-endpoint integration, not worth a dependency.
// Sandbox vs. production is just a different base URL + credentials, same
// as the mpesa.ts IntaSend split.

const AT_BASE_URL = process.env.AT_ENV === 'production'
  ? 'https://api.africastalking.com/version1/messaging'
  : 'https://api.sandbox.africastalking.com/version1/messaging'

export async function sendSms(phone: string, message: string): Promise<void> {
  if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
    // Fail soft in dev if creds aren't configured yet — callers treat this
    // as best-effort (see Inquiries.ts), so don't throw and break the
    // calling flow just because SMS isn't wired up locally.
    console.warn('[sms] AT_API_KEY/AT_USERNAME not set — skipping SMS send:', message)
    return
  }

  const res = await fetch(AT_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      apiKey: process.env.AT_API_KEY,
    },
    body: new URLSearchParams({
      username: process.env.AT_USERNAME,
      to: phone.startsWith('+') ? phone : `+${phone}`,
      message,
      ...(process.env.AT_SENDER_ID ? { from: process.env.AT_SENDER_ID } : {}),
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Africa's Talking SMS failed (${res.status}): ${body}`)
  }
}
