'use client'
import { useState } from 'react'
export function PlatformChatButton({ recipientId, listingId }: { recipientId: string; listingId?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  async function start() { setState('loading'); const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientId, listingId }) }); if (res.status === 401) { location.href = '/login'; return }; const data = await res.json(); if (!res.ok) { setState('error'); return }; location.href = `/messages/${data.id}` }
  return <button type="button" onClick={start} className="w-full rounded border border-ink-100 px-4 py-3 text-sm font-medium text-ink hover:bg-ink-50">{state === 'loading' ? 'Opening chat…' : state === 'error' ? 'Try again' : 'Message in Magariyetu'}</button>
}
