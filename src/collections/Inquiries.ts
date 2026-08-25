import type { CollectionConfig } from 'payload'

// Every "Chat on WhatsApp" click, phone reveal, or contact-form submit on a
// listing writes one row here. Neither Jiji nor PigiaMe show sellers *any*
// lead data beyond raw ad views — this collection is what powers the
// dashboard analytics widget (views vs. inquiries vs. conversion) that's one
// of Magariyetu's differentiators for dealers deciding where to spend their
// ad budget.

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['listing', 'channel', 'buyerName', 'createdAt'],
  },
  access: {
    // Anyone (including anonymous visitors) can create an inquiry — that's
    // the point, it's a lead-capture form. Only the listing's seller or an
    // admin can read the resulting leads.
    create: () => true,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { 'listing.seller': { equals: user.id } }
    },
    update: () => false,
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'listing', type: 'relationship', relationTo: 'listings', required: true },
    { name: 'buyerUser', type: 'relationship', relationTo: 'users', admin: { description: 'Set if the enquirer was logged in; null for anonymous browse-and-WhatsApp visitors.' } },
    { name: 'buyerName', type: 'text' },
    { name: 'buyerPhone', type: 'text' },
    { name: 'buyerEmail', type: 'text' },
    { name: 'message', type: 'textarea' },
    {
      name: 'channel',
      type: 'select',
      required: true,
      options: [
        { label: 'WhatsApp click', value: 'whatsapp' },
        { label: 'Phone reveal', value: 'phone' },
        { label: 'Contact form', value: 'form' },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return
        const listing = await req.payload.findByID({ collection: 'listings', id: doc.listing })
        await req.payload.update({
          collection: 'listings',
          id: doc.listing,
          data: { inquiryCount: (listing.inquiryCount || 0) + 1 },
        })

        // Notify the seller a lead just came in — the retention lever
        // neither Jiji nor PigiaMe currently offer (they leave sellers to
        // notice new leads on their own). Best-effort: a failed SMS/email
        // must never break inquiry creation, so both are wrapped and
        // swallowed rather than thrown.
        try {
          const seller = typeof listing.seller === 'object' ? listing.seller : await req.payload.findByID({ collection: 'users', id: listing.seller })
          const channelLabel = doc.channel === 'whatsapp' ? 'WhatsApp click' : doc.channel === 'phone' ? 'phone reveal' : 'message'
          if (seller?.phone) {
            const { sendSms } = await import('@/lib/sms')
            await sendSms(seller.phone, `Magariyetu: new lead on "${listing.title}" (${channelLabel}). Check your dashboard.`).catch(() => undefined)
          }
          if (seller?.email && !seller.email.endsWith('@phone.magariyetu.local')) {
            const { sendEmail } = await import('@/lib/email')
            await sendEmail(
              seller.email,
              `New lead on "${listing.title}"`,
              `<p>You've got a new ${channelLabel} on your listing <strong>${listing.title}</strong>.</p><p>${doc.message ? `Message: "${doc.message}"` : 'Check your Magariyetu dashboard for details.'}</p>`,
            ).catch(() => undefined)
          }
        } catch {
          // Notification failures are logged upstream by sendSms/sendEmail's own console.warn — never let this block the inquiry from being recorded.
        }
      },
    ],
  },
}
