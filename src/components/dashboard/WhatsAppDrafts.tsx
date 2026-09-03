'use client'

import { useEffect, useState } from 'react'

export function WhatsAppDrafts() {
  const [docs, setDocs] = useState<any[]>([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const response = await fetch('/api/whatsapp/submissions')
      const data = await response.json()

      if (data.docs) {
        setDocs(data.docs)
        setError('')
      } else {
        setError(data.error || 'Could not load drafts')
      }
    } catch {
      setError('Could not load drafts')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function claim(id: string) {
    const response = await fetch('/api/whatsapp/submissions', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        action: 'claim',
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      setError(data.error || 'Could not claim draft')
      return
    }

    await load()
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-alert">
          {error}
        </p>
      )}

      {docs.length === 0 ? (
        <p className="rounded border border-dashed border-ink-100 p-6 text-sm text-ink-400">
          No WhatsApp submissions yet. Send your vehicle details to the
          verified Magariyetu WhatsApp number to start one.
        </p>
      ) : (
        docs.map((d: any) => (
          <article
            key={d.id}
            className="rounded border border-ink-100 bg-white p-4"
          >
            <div className="flex justify-between gap-3">
              <p className="font-medium text-ink">
                {d.parsed?.yearOfManufacture} {d.parsed?.make}{' '}
                {d.parsed?.model}
              </p>

              <span className="text-xs text-ink-400">
                {d.status}
              </span>
            </div>

            <p className="mt-2 text-sm text-ink-400">
              {d.rawText}
            </p>

            {d.status === 'received' && (
              <button
                onClick={() => claim(d.id)}
                className="mt-3 rounded bg-stamp px-3 py-2 text-sm text-white"
              >
                Claim this draft
              </button>
            )}

            {d.status === 'claimed' && (
              <a
                href={`/sell?whatsappSubmission=${d.id}`}
                className="mt-3 inline-block rounded bg-ink px-3 py-2 text-sm text-white"
              >
                Finish listing
              </a>
            )}
          </article>
        ))
      )}
    </div>
  )
}