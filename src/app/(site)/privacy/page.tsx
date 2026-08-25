import type { Metadata } from 'next'
import { LegalDocument, LegalSection } from '@/components/legal/LegalDocument'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Magariyetu collects, uses, and protects personal data.',
}

// PLACEHOLDERS — same note as terms/page.tsx: search for "[" before
// publishing. This policy was written to match exactly what the current
// codebase collects and where it sends that data (cross-checked against
// every collection in src/collections/ and every third-party API call in
// src/lib/), not generic boilerplate — but the registration status with the
// ODPC, the company's registered details, and the Data Protection Officer
// contact are business facts, not something derivable from code, and are
// left as placeholders rather than invented.

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      lastUpdated="[Effective date — insert on publish]"
      intro={
        <>
          This Policy is a draft prepared as a starting point, written to accurately reflect what the Magariyetu
          platform actually collects and where it sends that data as of this version. It has not been reviewed by a
          Kenyan-qualified advocate and does not yet confirm Magariyetu&apos;s registration status with the Office of
          the Data Protection Commissioner (ODPC) — that registration (required under Section 18 of the Data
          Protection Act, 2019, for controllers/processors above the thresholds set in the 2021 Registration
          Regulations) should be confirmed before this page is relied upon as accurate.
        </>
      }
    >
      <LegalSection number="1" title="Who we are">
        <p>
          This Policy is issued by [Company Legal Name] (&ldquo;Magariyetu&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;), registered in Kenya at [Registered Address], acting as the data controller for personal
          data processed through the Magariyetu platform. Our Data Protection Officer / privacy contact can be reached
          at [DPO Contact Email].
        </p>
      </LegalSection>

      <LegalSection number="2" title="Scope">
        <p>
          This Policy explains how we handle personal data of Buyers, Sellers, Dealers, and site visitors under the
          Data Protection Act, 2019 (Kenya) and its implementing regulations. It should be read alongside our{' '}
          <a href="/terms">Terms of Service</a>.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Personal data we collect">
        <p>We collect the following categories of personal data, listed here as they actually exist in our systems:</p>
        <ul>
          <li><strong>Account data:</strong> name, phone number, email address (a placeholder address is generated automatically for accounts created via phone-only sign-in), and a securely hashed password. We never store your password in readable form.</li>
          <li><strong>Identity and business verification documents:</strong> where you apply for ID verification or a Dealer account, the documents you upload for that purpose (for example, national ID or KRA PIN certificate), reviewed by staff and then retained for audit purposes.</li>
          <li><strong>Listing content:</strong> vehicle or item details, description, price, location, and photographs you upload. Uploaded photographs are watermarked before storage.</li>
          <li><strong>Transaction and payment metadata:</strong> records of Featured Placement or subscription payments, including amount, plan, and status. We do not receive or store your M-Pesa PIN or full card number — those are handled directly by our payment processor.</li>
          <li><strong>Enquiry data:</strong> when you contact a Seller through the Platform (WhatsApp click, phone reveal, or contact form), we record that this occurred, together with any message and contact details you choose to provide, so the Seller can follow up and so we can show Sellers basic performance analytics.</li>
          <li><strong>Login codes:</strong> if you sign in by phone, a short-lived, hashed one-time code and its expiry time — deleted from active use once verified or expired, subject to routine database retention described in Section 8.</li>
          <li><strong>Technical data:</strong> the session cookie that keeps you signed in, and standard web server logs. We do not currently use separate marketing or analytics cookies — if that changes, this Policy will be updated first.</li>
        </ul>
      </LegalSection>

      <LegalSection number="4" title="How we collect it">
        <p>
          Most data is provided directly by you — at registration, when posting a Listing, or when contacting a
          Seller. Some is generated automatically by the Platform (listing views, enquiry records). Payment status is
          received from our payment processor once a payment succeeds or fails; it does not include your underlying
          M-Pesa or card credentials.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Why we process your data">
        <p>We rely on the following lawful bases, matched to the Data Protection Act, 2019:</p>
        <ul>
          <li><strong>Performance of a contract</strong> — creating your account, publishing your Listings, processing Featured Placement and subscription payments, and enabling Buyer–Seller contact.</li>
          <li><strong>Legitimate interests</strong> — fraud and price-outlier checks, platform security, and seller-facing analytics, balanced against your rights and always limited to what is necessary for those purposes.</li>
          <li><strong>Consent</strong> — marketing communications, which you may withdraw at any time.</li>
          <li><strong>Legal obligation</strong> — retaining verification documents and transaction records where required by applicable law or regulator request.</li>
        </ul>
      </LegalSection>

      <LegalSection number="6" title="Who we share data with">
        <ul>
          <li><strong>Other users:</strong> your name, and phone or WhatsApp number if you have chosen to display it, are shown on your own Listings so interested Buyers can contact you. Dealer verification status is shown publicly; the documents behind it are not.</li>
          <li><strong>Payment processor:</strong> your phone number and payment amount are shared with our M-Pesa payment processor (IntaSend) solely to process Featured Placement and subscription payments.</li>
          <li><strong>SMS provider:</strong> your phone number is shared with our SMS provider (Africa&apos;s Talking) to deliver OTP codes and lead notifications.</li>
          <li><strong>Email provider:</strong> your email address is shared with our transactional email provider (Resend) to deliver account and lead-notification emails.</li>
          <li><strong>Hosting and storage providers:</strong> uploaded photographs and platform data are stored with our cloud hosting and file storage providers, who process it only on our instructions.</li>
          <li><strong>Regulators and law enforcement:</strong> where we are legally required to disclose data, including to the ODPC or law enforcement under a lawful request.</li>
        </ul>
        <p>We do not sell your personal data.</p>
      </LegalSection>

      <LegalSection number="7" title="International data transfers">
        <p>
          Some of the service providers listed in Section 6 may process or store data outside Kenya. Where this
          occurs, we take steps intended to meet the Data Protection Act&apos;s cross-border transfer requirements —
          such as relying on a provider&apos;s adequate safeguards or contractual protections. [Confirm and list each
          provider&apos;s actual data-hosting region here, and the specific safeguard relied on for each, before
          publishing — this cannot be accurately completed without checking each vendor&apos;s current hosting
          location.]
        </p>
      </LegalSection>

      <LegalSection number="8" title="How long we keep your data">
        <ul>
          <li>Account data is retained while your account is active, and for a limited period after closure for legal, tax, and dispute-resolution purposes.</li>
          <li>Identity and business verification documents are retained for as long as your verified status is active, and for a defined period afterward for audit purposes.</li>
          <li>One-time login codes are short-lived by design and are not retained beyond routine database backups once expired or used.</li>
          <li>Listing content is retained for as long as the Listing is active and for a limited period after removal, for dispute and record-keeping purposes.</li>
        </ul>
        <p>[Insert specific retention periods for each category once decided — a Policy that says data is kept &ldquo;as long as necessary&rdquo; without a defined period is weaker evidence of compliance than one with actual numbers.]</p>
      </LegalSection>

      <LegalSection number="9" title="How we protect your data">
        <p>
          Passwords are stored using one-way hashing, never in plain text. One-time login codes are hashed before
          storage. Access to identity verification documents is restricted to staff performing verification. Data in
          transit between your device and our servers is encrypted (HTTPS). No system is completely secure, and we
          cannot guarantee absolute security of information transmitted over the internet.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Your rights">
        <p>Under the Data Protection Act, 2019, you have the right to:</p>
        <ul>
          <li>be informed of how your data is used (this Policy is part of that);</li>
          <li>access the personal data we hold about you;</li>
          <li>request correction of inaccurate or outdated data;</li>
          <li>request deletion of your data, subject to legal retention requirements;</li>
          <li>object to processing based on legitimate interests;</li>
          <li>request a portable copy of data you provided to us; and</li>
          <li>lodge a complaint with the Office of the Data Protection Commissioner (Britam Tower, Upper Hill, Nairobi; <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer">www.odpc.go.ke</a>) if you believe we have mishandled your data.</li>
        </ul>
        <p>To exercise any of these rights, contact us at [DPO Contact Email].</p>
      </LegalSection>

      <LegalSection number="11" title="Children">
        <p>
          The Platform is not directed at, and is not intended for use by, anyone under 18. We do not knowingly
          collect personal data from children. If you believe a child has provided us with personal data, contact us
          so we can remove it.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Cookies">
        <p>
          We use a single essential cookie to keep you signed in. We do not currently use advertising or analytics
          cookies. If that changes, we will update this Policy and, where required, seek your consent first.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Third-party links">
        <p>
          The Platform may link to third-party sites, including WhatsApp and payment provider pages. We are not
          responsible for the privacy practices of sites we do not operate.
        </p>
      </LegalSection>

      <LegalSection number="14" title="Changes to this Policy">
        <p>
          We may update this Policy from time to time. Material changes will be notified through the Platform or by
          email before they take effect.
        </p>
      </LegalSection>

      <LegalSection number="15" title="Contact us">
        <p>
          For any question about this Policy or your data, contact [DPO Contact Email] or write to us at [Registered
          Address].
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
