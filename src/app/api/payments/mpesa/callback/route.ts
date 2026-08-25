import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'

// Safaricom calls this when the customer's STK prompt is completed,
// cancelled, or times out. Unlike the IntaSend version this replaced, there
// is no shared-secret header to check — Daraja doesn't offer one.
// Authenticity instead rests on two checks against our own database: the
// CheckoutRequestID must match an order we actually created that is still
// 'pending', and the amount Safaricom reports must match what that order
// expects. Neither is as strong a guarantee as an HMAC signature, but a
// CheckoutRequestID is not realistically guessable, and requiring the
// amount to match closes off replaying a captured callback from a smaller
// order against a larger one.
//
// This — not the client, not the STK-push route — remains the only place
// that ever sets listing.featured = true.

function getMetadataValue(items: { Name: string; Value: string | number }[] | undefined, name: string) {
  return items?.find((item) => item.Name === name)?.Value
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const stkCallback = body?.Body?.stkCallback
  const checkoutId = stkCallback?.CheckoutRequestID
  if (!checkoutId) {
    return NextResponse.json({ error: 'Missing CheckoutRequestID' }, { status: 400 })
  }

  const payload = await getPayload()
  const { docs } = await payload.find({ collection: 'featured-orders', where: { providerCheckoutId: { equals: checkoutId } }, limit: 1 })
  const order = docs[0]
  if (!order || order.status !== 'pending') {
    // Unknown checkout id, or a callback arriving twice for an order
    // already resolved — nothing safe to do with either, so acknowledge
    // receipt and stop rather than error loudly.
    return NextResponse.json({ ok: true })
  }

  const resultCode = stkCallback?.ResultCode
  if (resultCode !== 0) {
    await payload.update({ collection: 'featured-orders', id: order.id, data: { status: 'failed' } })
    return NextResponse.json({ ok: true })
  }

  const items = stkCallback?.CallbackMetadata?.Item
  const paidAmount = Number(getMetadataValue(items, 'Amount'))
  if (paidAmount !== order.amount) {
    // Amount mismatch — do not trust this callback enough to mark the order
    // paid OR failed automatically. Left pending deliberately; this should
    // be rare enough to warrant a human look rather than an automatic call
    // either way.
    console.warn(`[mpesa] callback amount mismatch for order ${order.id}: expected ${order.amount}, got ${paidAmount}`)
    return NextResponse.json({ ok: true })
  }

  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + order.durationDays * 24 * 60 * 60 * 1000)

  await payload.update({
    collection: 'featured-orders',
    id: order.id,
    data: { status: 'paid', startDate: startDate.toISOString(), endDate: endDate.toISOString() },
  })

  const listingId = typeof order.listing === 'object' ? order.listing.id : order.listing
  await payload.update({
    collection: 'listings',
    id: listingId,
    data: { featured: true, featuredUntil: endDate.toISOString() },
  })

  return NextResponse.json({ ok: true })
}
