# Magariyetu — Trust & Kenya-fit patch

Addresses all 8 gaps from the comparison against the competitor-research document: per-vehicle inspection badge, duty/clearance status field, spare-parts & tuk-tuk categories, SEO/WhatsApp link previews, phone-OTP login, lead notifications (SMS + email), image watermarking, and price-outlier moderation.

**No new npm dependencies.** SMS (Africa's Talking) and email (Resend) both go through plain `fetch` against their REST APIs rather than SDKs — one call site each, not worth a dependency. `sharp` (for watermarking) was already in `package.json` from the original build.

## How to merge this into your existing project folder

Every file below is a **complete, final version** — not a diff. Drop each one into your project at the exact same relative path, overwriting the file if it already exists there. There's no manual patching to do; just copy-and-overwrite.

**8 new files** (didn't exist before):
```
src/collections/Inspections.ts
src/collections/PhoneOtps.ts
src/components/badges/InspectedBadge.tsx
src/lib/sms.ts
src/lib/email.ts
src/app/api/auth/otp/request/route.ts
src/app/api/auth/otp/verify/route.ts
src/components/auth/PhoneOtpLogin.tsx
```

**12 modified files** (overwrite the ones already in your project):
```
payload.config.ts
.env.example
src/collections/Users.ts
src/collections/Listings.ts
src/collections/Inquiries.ts
src/collections/Media.ts
src/app/layout.tsx
src/app/(site)/login/page.tsx
src/app/(site)/cars/page.tsx
src/app/(site)/cars/[slug]/page.tsx
src/components/listings/SearchFilters.tsx
src/components/listings/SellWizard.tsx
```

This zip's internal folder structure already mirrors your project root exactly, so the simplest way to apply it:

```bash
cd magariyetu                    # your existing project root
unzip -o /path/to/magariyetu-updates.zip -d .
```

The `-o` flag overwrites without prompting. If you'd rather review each change first, extract to a scratch folder and diff against your existing files instead.

## New environment variables

Add these to your `.env` (already appended to `.env.example` in this patch — merge that file too, or just copy the new block manually):

```
AT_USERNAME=sandbox
AT_API_KEY=
AT_SENDER_ID=
AT_ENV=sandbox
OTP_HASH_SECRET=
```

`AT_*` are Africa's Talking credentials (SMS — phone-OTP login and seller lead notifications). Sandbox mode needs no real API key to start testing; production does. `OTP_HASH_SECRET` should be a real random string (`openssl rand -base64 32`) before this touches real users — it peppers the OTP hash so a database leak alone doesn't expose valid codes.

`RESEND_API_KEY` and `EMAIL_FROM` were already in your `.env.example` from the original build — reused here for lead-notification emails, no new variable needed there.

## After merging: schema changes to run

Two collections are new (`Inspections`, `PhoneOtps`) and `Listings`/`Users` both gained fields. If you've already run this against a real Postgres database, Payload's `push: true` dev mode will auto-sync the schema on next `npm run dev`; for a production database, review the generated migration before applying it rather than trusting auto-push.

## Two things flagged honestly, not glossed over

Both are called out in code comments at the relevant spot, repeating here so they're not missed:

1. **`src/collections/Media.ts`'s watermark hook** reads the raw upload off `req.file.data` inside a `beforeOperation` hook — this matches documented Payload 3 upload-hook behaviour, but it hasn't been run against a live instance in this environment (no Postgres available here to actually test a file upload). If it doesn't fire, that property name is the first thing to check against your installed Payload version.
2. **`src/app/api/auth/otp/verify/route.ts`'s Payload-login handoff** (generate a random password → `payload.login()` → manually set the `payload-token` cookie) is a standard, documented workaround for the fact that Payload's auth is password-based and doesn't have native passwordless support — but same caveat: written correctly per the docs, not execution-tested here. Confirm the cookie name matches what a normal REST `/login` sets in your running instance if it doesn't log people in on the first try.

Neither is exotic — both are the kind of thing that either works immediately or takes one small correction once you can actually run `npm run dev` against a real database, which this sandbox can't do.

## What's still open (unchanged from the original README)

Escrow/buyer-protection and AI-based fraud detection are still unbuilt — flagged as roadmap in the original README and not addressed in this patch. Also unbuilt: wiring `PhoneOtpLogin` into the `/sell` wizard's inline auth step (currently only on `/login`) — mechanical, same component, just not done yet.
