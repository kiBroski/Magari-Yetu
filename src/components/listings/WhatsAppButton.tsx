'use client'

// A plain wa.me link would work, but it would also throw away the one thing
// that makes Magariyetu's dashboard analytics possible: knowing a lead
// happened at all. This fires a fire-and-forget POST to /api/listings on
// click (logging an Inquiry with channel="whatsapp"), then opens WhatsApp —
// the click is never blocked or delayed waiting for that request.

export function WhatsAppButton({
  listingId,
  phoneNumber,
  listingTitle,
}: {
  listingId: string
  phoneNumber: string
  listingTitle: string
}) {
  function handleClick() {
    fetch('/api/listings/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing: listingId, channel: 'whatsapp' }),
      keepalive: true,
    }).catch(() => {
      /* logging the lead is best-effort — never block the buyer's WhatsApp click on it */
    })
  }

  const message = encodeURIComponent(`Hi, I'm interested in your listing "${listingTitle}" on Magariyetu.`)
  const href = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${message}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 rounded bg-matatu px-5 py-3 font-display text-sm uppercase tracking-wide text-white transition hover:opacity-90"
    >
      Chat on WhatsApp
    </a>
  )
}
