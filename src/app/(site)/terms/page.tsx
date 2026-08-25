import type { Metadata } from 'next'
import { LegalDocument, LegalSection } from '@/components/legal/LegalDocument'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing use of the Magariyetu marketplace.',
}

// PLACEHOLDERS — search for "[" in this file before publishing. Every
// bracketed value below (company legal name, registration number,
// registered address, governing courts, contact details) needs to be
// filled in with real, current information before this is relied on as a
// binding document. None of these were invented as fact; they are marked
// exactly because they should not be guessed at.

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      lastUpdated="[Effective date — insert on publish]"
      intro={
        <>
          These Terms are a draft prepared as a starting point for Magariyetu&apos;s legal terms. They have not been
          reviewed by a Kenyan-qualified advocate. Please have them reviewed before publishing this page live or relying
          on it to limit the company&apos;s liability — a document that has not been checked against current Kenyan
          consumer-protection and contract law is not a safe substitute for that review.
        </>
      }
    >
      <LegalSection number="1" title="Introduction and acceptance">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern access to and use of the Magariyetu website, mobile
          experience, and related services (together, the &ldquo;Platform&rdquo;), operated by [Company Legal Name], a
          company registered in Kenya under registration number [Registration Number], with its registered address at
          [Registered Address] (&ldquo;Magariyetu&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
        </p>
        <p>
          By creating an account, posting a listing, or otherwise using the Platform, you agree to be bound by these
          Terms and by our <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference.
          If you do not agree to these Terms, you must not use the Platform.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Definitions">
        <ul>
          <li><strong>Listing</strong> means any vehicle, machine, part, or accessory posted for sale on the Platform.</li>
          <li><strong>Seller</strong> means any user who posts a Listing, whether an individual or a Dealer.</li>
          <li><strong>Dealer</strong> means a Seller operating a registered storefront through the Platform&apos;s dealer accounts.</li>
          <li><strong>Buyer</strong> means any user who views, enquires about, or purchases an item advertised in a Listing.</li>
          <li><strong>Featured Placement</strong> means a paid, time-limited promotion of a Listing&apos;s position in search results, purchased through the Platform.</li>
        </ul>
      </LegalSection>

      <LegalSection number="3" title="Eligibility">
        <p>
          You must be at least 18 years old and capable of forming a binding contract under the laws of Kenya to
          register an account, post a Listing, or enter into any transaction facilitated through the Platform. By
          registering, you confirm that you meet these requirements and that the information you provide is accurate
          and current.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Accounts">
        <p>
          Accounts may be created using a phone number (verified by a one-time SMS code) or an email address and
          password. You are responsible for maintaining the confidentiality of your account credentials and for all
          activity carried out under your account. Notify us immediately at [Support Contact Email] if you suspect
          unauthorised access to your account.
        </p>
        <p>
          You may hold only one personal account. Dealer accounts must accurately represent the business they belong
          to; providing false business, identity, or verification information is grounds for immediate suspension.
        </p>
      </LegalSection>

      <LegalSection number="5" title="What Magariyetu is — and is not">
        <p>
          Magariyetu is an online venue that allows Sellers to advertise vehicles, machinery, and related items to
          Buyers, and allows Buyers to find and contact Sellers. <strong>Magariyetu is not a party to any sale,
          purchase, or exchange arranged between a Buyer and a Seller.</strong> We do not own, possess, inspect
          (except where an Inspection has been separately arranged and completed as described in Section 7), sell, or
          deliver any Listing.
        </p>
        <p>
          Every transaction concluded between a Buyer and a Seller is a contract solely between those two parties.
          Magariyetu is not responsible for the existence, quality, safety, legality, roadworthiness, or title of any
          Listing, nor for a Seller&apos;s or Buyer&apos;s ability to complete a transaction, make payment, or transfer
          ownership. You are strongly encouraged to independently verify a vehicle&apos;s logbook, ownership, service
          history, and condition — and, where relevant, to complete transfer through NTSA&apos;s official processes —
          before completing any purchase.
        </p>
        <p>
          <strong>Magariyetu does not currently hold, escrow, or otherwise take custody of funds exchanged between a
          Buyer and a Seller for the purchase of a vehicle or item.</strong> Payments you make through the Platform are
          limited to Featured Placement fees and Dealer subscription fees, described in Section 8. Any payment for the
          vehicle or item itself is arranged directly between Buyer and Seller, entirely outside the Platform, and at
          their own risk.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Listings">
        <p>
          Sellers are solely responsible for the accuracy, legality, and completeness of their Listings, including
          price, condition, specifications, ownership status, and photographs. Listings must not misrepresent the item,
          omit known material defects, or advertise a vehicle the Seller does not have the legal right to sell.
        </p>
        <p>Listings must not advertise:</p>
        <ul>
          <li>stolen, unregistered-with-intent-to-deceive, or otherwise unlawfully held vehicles or items;</li>
          <li>items whose sale is restricted or prohibited under Kenyan law;</li>
          <li>duplicate postings of the same item, or listings designed to manipulate search ranking; and</li>
          <li>content that is fraudulent, defamatory, or infringes another person&apos;s rights.</li>
        </ul>
        <p>
          We may review, edit the categorisation of, suspend, or remove any Listing at our discretion, including
          listings flagged by our automated price-comparison check or reported by other users, and we may decline to
          publish a Listing without being obliged to give reasons. Reviewing or approving a Listing for publication is
          a moderation step only and is not, and must not be represented as, Magariyetu&apos;s endorsement or
          verification of its contents.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Verification, inspection, and Featured badges — what each one actually means">
        <p>
          The Platform displays several distinct badges. Each reflects a specific, limited claim, described below, and
          none of them is a guarantee by Magariyetu of a Listing&apos;s condition or a Seller&apos;s conduct.
        </p>
        <ul>
          <li>
            <strong>Verified Dealer / Verified ID</strong> indicates that a staff member reviewed identity or business
            registration documents submitted by that user at a point in time. It confirms only that the documents
            reviewed appeared genuine and matched the account holder&apos;s stated identity or business — it is not an
            endorsement of that Seller&apos;s honesty, business practices, or the accuracy of any specific Listing they
            post.
          </li>
          <li>
            <strong>Featured</strong> indicates only that the Seller paid for temporary promoted placement in search
            results. It carries no implication about the Listing&apos;s quality, price fairness, or trustworthiness.
          </li>
          <li>
            <strong>Inspected</strong> indicates that the specific vehicle was physically checked against a defined
            checklist by [an inspector engaged by Magariyetu / a designated inspection partner — confirm the actual
            arrangement here] on the date shown in the linked report. It reflects only the items on that checklist, as
            observed on that date. It is not a warranty that the vehicle is free of defects outside the checklist&apos;s
            scope, nor that its condition has not changed since the inspection date.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="8" title="Fees and payments">
        <p>
          Browsing Listings and contacting Sellers is free. Magariyetu charges for two things only: Featured Placement
          and Dealer subscription plans, both described on the <a href="/pricing">Pricing</a> page and both processed
          via our third-party payment processor over M-Pesa. We do not receive, store, or have access to your M-Pesa
          PIN or full payment card details.
        </p>
        <p>
          Featured Placement and subscription fees are charged for the advertising service itself and are
          non-refundable once the placement has gone live or the subscription period has begun, except where required
          by Kenyan consumer-protection law or where we determine, at our discretion, that a payment failure or
          platform error prevented the service from being delivered.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Import duty calculator">
        <p>
          The import duty calculator provided on the Platform produces an estimate only, based on a simplified version
          of publicly available KRA duty, excise, VAT, IDF, and RDL formulas, using reference values that may not
          match the current official KRA CRSP schedule for a specific vehicle. It is provided for general guidance
          only, does not constitute tax, customs, or legal advice, and must not be relied upon as a substitute for an
          official KRA assessment or advice from a licensed clearing agent.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Communications">
        <p>
          By registering, you consent to receive account-related SMS and email messages, including OTP codes and
          notifications about enquiries on your Listings. You may opt out of non-essential marketing communications at
          any time through your account settings or by contacting us; you cannot opt out of essential service
          messages, such as OTP codes or payment confirmations, while continuing to use the affected feature.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Prohibited conduct">
        <p>You must not:</p>
        <ul>
          <li>scrape, mirror, or systematically extract Listings or other users&apos; data from the Platform;</li>
          <li>circumvent Featured Placement fees through manipulated or duplicate Listings;</li>
          <li>harass, threaten, or defraud another user;</li>
          <li>interfere with the Platform&apos;s operation, including through malware, denial-of-service activity, or unauthorised access attempts; or</li>
          <li>use the Platform for any purpose prohibited under Kenyan law.</li>
        </ul>
      </LegalSection>

      <LegalSection number="12" title="Intellectual property">
        <p>
          You retain ownership of the photographs, descriptions, and other content you upload (&ldquo;User
          Content&rdquo;), and you grant Magariyetu a non-exclusive, royalty-free, worldwide licence to host, display,
          reproduce, and adapt (including resizing and watermarking) that User Content for the purpose of operating and
          promoting the Platform. You confirm you hold the rights necessary to grant this licence for everything you
          upload.
        </p>
        <p>
          The Magariyetu name, logo, design, and underlying software are the property of [Company Legal Name] and may
          not be used without our prior written consent.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Disclaimers">
        <p>
          The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the fullest
          extent permitted by Kenyan law, we disclaim all warranties, express or implied, regarding the Platform&apos;s
          availability, accuracy, or fitness for a particular purpose, and regarding any Listing, Seller, Buyer, or
          transaction facilitated through it.
        </p>
      </LegalSection>

      <LegalSection number="14" title="Limitation of liability">
        <p>
          Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited under the
          laws of Kenya, including under the Consumer Protection Act, 2012. Subject to that, and to the fullest extent
          the law allows:
        </p>
        <ol>
          <li>
            Magariyetu is not liable for any loss arising from a transaction between a Buyer and a Seller, including
            loss relating to a vehicle&apos;s condition, title, legality, or the conduct of the other party;
          </li>
          <li>
            Magariyetu is not liable for indirect, incidental, or consequential loss, including lost profits or lost
            opportunity, arising from use of the Platform; and
          </li>
          <li>
            where liability cannot be excluded, our total liability to you arising from use of the Platform is limited
            to the total fees you paid to Magariyetu (for Featured Placement or subscriptions) in the twelve months
            preceding the event giving rise to the claim.
          </li>
        </ol>
      </LegalSection>

      <LegalSection number="15" title="Indemnification">
        <p>
          You agree to indemnify and hold Magariyetu harmless against any claim, loss, or expense (including
          reasonable legal costs) arising from your breach of these Terms, your Listings, or your conduct toward
          another user.
        </p>
      </LegalSection>

      <LegalSection number="16" title="Disputes between users">
        <p>
          Disputes arising from a transaction between a Buyer and a Seller are between those parties. Magariyetu may,
          at its discretion, provide information to assist in resolving a dispute (for example, records of an
          Inquiry), but is under no obligation to mediate, arbitrate, or otherwise resolve disputes between users.
        </p>
      </LegalSection>

      <LegalSection number="17" title="Suspension and termination">
        <p>
          We may suspend or terminate an account, with or without notice, for breach of these Terms, suspected fraud,
          or conduct that risks harm to other users or the Platform. You may close your account at any time by
          contacting us at [Support Contact Email].
        </p>
      </LegalSection>

      <LegalSection number="18" title="Governing law and disputes">
        <p>
          These Terms are governed by the laws of Kenya. Any dispute arising from these Terms or your use of the
          Platform is subject to the exclusive jurisdiction of the courts of [City — e.g. Nairobi], Kenya.
        </p>
      </LegalSection>

      <LegalSection number="19" title="Changes to these Terms">
        <p>
          We may update these Terms from time to time. Material changes will be notified through the Platform or by
          email before they take effect. Continued use of the Platform after changes take effect constitutes
          acceptance of the updated Terms.
        </p>
      </LegalSection>

      <LegalSection number="20" title="Contact">
        <p>
          Questions about these Terms can be sent to [Support Contact Email] or by post to [Registered Address].
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
