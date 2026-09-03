import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth'
export async function POST(req: NextRequest) { const user = await getCurrentUser(); const body = await req.json().catch(() => null); if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 }); if (!body?.targetType || !body?.targetId || !body?.rating || !body?.title || !body?.body) return NextResponse.json({ error: 'Complete all review fields' }, { status: 400 }); const review = await (await getPayload()).create({ collection: 'reviews', data: { ...body, author: user.id, status: 'pending' } as any, overrideAccess: true }); return NextResponse.json({ id: review.id }, { status: 201 }) }
