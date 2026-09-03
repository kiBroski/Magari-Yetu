'use client'
import { useState } from 'react'
export function ReportButton({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [done, setDone] = useState(false)
  async function report() { await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetType, targetId, reason: 'suspected-fraud' }) }); setDone(true) }
  return <button type="button" onClick={report} disabled={done} className="text-xs text-alert underline disabled:no-underline">{done ? 'Report received' : 'Report fraud or abuse'}</button>
}
