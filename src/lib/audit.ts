import type { Payload } from 'payload'

export async function writeAudit(payload: Payload, input: { actor?: string; action: string; targetType: string; targetId: string; previous?: unknown; next?: unknown; note?: string; ip?: string }) {
  return (payload as any).create({ collection: 'audit-logs', data: { actor: input.actor, action: input.action, targetType: input.targetType, targetId: input.targetId, previous: input.previous, next: input.next, note: input.note, ip: input.ip }, overrideAccess: true })
}
