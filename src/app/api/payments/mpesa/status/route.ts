import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth'

// Cheap polling endpoint the BoostButton component hits every few seconds
// while waiting for the buyer to enter their M-Pesa PIN. Deliberately reads
// only — the callback route above is the only writer of order status.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Log in first' }, { status: 401 })

  const orderId = req.nextUrl.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

  const payload = await getPayload()
  const order = await payload.findByID({ collection: 'featured-orders', id: orderId }).catch(() => null)
  if (!order || (order.user as any) !== user.id && (order.user as any)?.id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ status: order.status })
}
