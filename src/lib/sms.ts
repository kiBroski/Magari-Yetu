const AT_BASE_URL =
  process.env.AT_ENV === 'production'
    ? 'https://api.africastalking.com/version1/messaging'
    : 'https://api.sandbox.africastalking.com/version1/messaging'

export async function sendSms(phone: string, message: string): Promise<void> {
  if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
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
    throw new Error(`Africa's Talking HTTP Error (${res.status}): ${body}`)
  }

  const data = await res.json().catch(() => null)
  
  // Validate inner recipient status (e.g., Success, InsufficientBalance, InvalidPhoneNumber)
  const recipient = data?.SMSMessageData?.Recipients?.[0]
  if (recipient && recipient.status !== 'Success') {
    throw new Error(`Africa's Talking Delivery Failed: ${recipient.status} (Cost: ${recipient.cost})`)
  }
}