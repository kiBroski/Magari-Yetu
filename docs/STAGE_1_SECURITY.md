# Stage 1 security and moderation controls

## Implemented in this repository

- Request rate limiting on OTP, inquiries, M-Pesa initiation, reports, contact,
  conversations, messages, provider applications and WhatsApp webhooks.
- Turnstile server verification for anonymous reports and contact messages when
  `TURNSTILE_SECRET_KEY` is configured.
- Account status controls: active, warned, suspended and banned.
- Listing risk fields, suspicious-content screening and duplicate VIN/chassis
  screening.
- Moderation routes for listings, users, reports and service-provider review.
- Immutable audit-log records for staff actions made through those routes.
- A distinct `verification-documents` collection, inaccessible publicly, with a
  non-public local fallback directory.
- Chat safety notice and advance-payment message guard.

## Required before production

1. Replace the in-memory limiter in `src/lib/security.ts` with a Redis/Upstash
   adapter using `RATE_LIMIT_REDIS_URL`; in-memory state is not shared across
   serverless instances or restarts.
2. Configure Turnstile site/secret keys and add its browser widget to public
   report/contact/sign-up forms. Do not treat server verification alone as a
   complete CAPTCHA user interface.
3. Configure private object storage. Payload's local `private-documents`
   fallback is suitable only for development; introduce signed URL generation
   before production.
4. Add MFA using an audited identity provider or a TOTP/WebAuthn integration.
   It is intentionally not faked by a database checkbox.
5. Add image perceptual hashing in an async worker with a dedicated database
   index. It is not safe or cost-effective to hash large files in the listing
   request lifecycle.
6. Add scheduled jobs for verification expiry, document retention/deletion and
   re-verification notices.
7. Test all moderation/access routes on staging with non-staff accounts.
