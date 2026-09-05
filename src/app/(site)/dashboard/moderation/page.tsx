import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayload } from '@/lib/payload'
import { ModerationProviderActions } from '@/components/dashboard/ModerationProviderActions'
import { WhatsAppOnboardingActions } from '@/components/dashboard/WhatsAppOnboardingActions'

export const dynamic = 'force-dynamic'

export default async function ModerationPage() {
  const user = await getCurrentUser()
  if (!user || !['admin', 'moderator'].includes(user.role)) redirect('/dashboard')
  const payload = await getPayload()
  const [providers, reports, submissions] = await Promise.all([
    payload.find({ collection: 'service-providers', where: { verificationStatus: { equals: 'pending' } }, limit: 50 }),
    payload.find({ collection: 'reports', where: { status: { in: ['open', 'triaged', 'under-review'] } }, limit: 50, sort: '-createdAt', overrideAccess: true }),
    payload.find({ collection: 'whatsapp-submissions', where: { status: { not_equals: 'converted' } }, limit: 50, sort: '-createdAt', overrideAccess: true }),
  ])
  return <div className="space-y-8"><section><h2 className="font-display text-xl font-bold text-ink">Provider verification</h2><div className="mt-3 space-y-2">{providers.docs.map((p: any) => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-ink-100 bg-white p-4"><span><strong>{p.businessName}</strong> · {p.county} · {p.services?.join(', ')}</span><ModerationProviderActions id={p.id} /></div>)}</div></section><section><h2 className="font-display text-xl font-bold text-ink">Open reports</h2>{reports.docs.map((r: any) => <div key={r.id} className="mt-2 rounded border border-ink-100 bg-white p-4 text-sm"><strong>{r.reason}</strong> · {r.targetType} #{r.targetId}<p className="mt-1 text-ink-400">{r.details}</p></div>)}</section><section><h2 className="font-display text-xl font-bold text-ink">WhatsApp onboarding queue</h2><p className="mt-1 text-sm text-ink-400">Assign an owner, request missing details, and move every draft through review. Staff can create dealer/storefront records in the protected admin area once documents are ready.</p>{submissions.docs.map((s: any) => <div key={s.id} className="mt-2 rounded border border-ink-100 bg-white p-4 text-sm"><div className="flex flex-wrap justify-between gap-3"><span><strong>{s.fromPhone}</strong> · {s.status}</span><WhatsAppOnboardingActions id={s.id} status={s.status} /></div><p className="mt-1 text-ink-400">{s.rawText}</p><p className="mt-1 text-xs text-ink-400">SLA: {s.slaDueAt ? new Date(s.slaDueAt).toLocaleString() : 'not set'}</p></div>)}</section></div>
}
