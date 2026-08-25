import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth'
import { initiateMpesaStkPush } from '@/lib/mpesa'
import { PLANS } from '@/collections/FeaturedOrders'

// Step 1 of the boost flow. Creates a FeaturedOrder row status='pending'
// *before* calling out to Safaricom, so even if the STK push call itself
// fails partway there's a record of the attempt. Money never moves here —
// this only sends the PIN prompt to the seller's phone. The listing is only
// ever marked featured by the webhook in ./callback/route.ts once Daraja
// confirms the M-Pesa payment actually cleared.
//
// This route's logic is unchanged from the IntaSend version it replaced —
// initiateMpesaStkPush() kept the same function signature deliberately, so
// swapping the payment provider only touched lib/mpesa.ts and the callback
// route. That isolation is the point of routing all provider calls through
// one module.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Log in first' }, { status: 401 })

  const { listingId, plan, phoneNumber } = await req.json().catch(() => ({}))
  const planDef = PLANS[plan as keyof typeof PLANS]
  if (!listingId || !planDef || !phoneNumber) {
    return NextResponse.json({ error: 'listingId, a valid plan, and phoneNumber are required' }, { status: 400 })
  }

  const payload = await getPayload()
  const listing = await payload.findByID({ collection: 'listings', id: listingId }).catch(() => null)
  if (!listing || (listing.seller as any) !== user.id && (listing.seller as any)?.id !== user.id) {
    return NextResponse.json({ error: 'You can only boost your own listings' }, { status: 403 })
  }

  const order = await payload.create({
    collection: 'featured-orders',
    data: {
      listing: listingId,
      user: user.id,
      plan,
      amount: planDef.price,
      durationDays: planDef.days,
      paymentProvider: 'mpesa',
      status: 'pending',
    },
  })

  try {
    const { checkoutId } = await initiateMpesaStkPush({
      phoneNumber,
      amountKes: planDef.price,
      reference: String(order.id),
      narrative: `Magariyetu ${planDef.label}`,
    })
    await payload.update({ collection: 'featured-orders', id: order.id, data: { providerCheckoutId: checkoutId } })
    return NextResponse.json({ orderId: order.id, checkoutId })
  } catch (err) {
    await payload.update({ collection: 'featured-orders', id: order.id, data: { status: 'failed' } })
    return NextResponse.json({ error: err instanceof Error ? err.message : 'STK push failed' }, { status: 502 })
  }
}
