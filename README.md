# Magariyetu

Kenya's marketplace for new, locally assembled, imported, and locally used vehicles — plus trucks, trailers, heavy machinery, tuk-tuks, and spare parts — from individuals and dealers.

This is a working scaffold, not a finished product: the data model, auth, payment flow, trust/verification layer, and core pages are built and internally consistent (every local import in the project resolves to a real file — checked programmatically, not just by eye), but it has not been `npm install`'d or run against a live database in this environment. Follow **Getting started** below before you expect it to boot, and read **What's genuinely built vs. what's a stub** before you assume any specific feature works exactly as described.

## Why this architecture

**Payload CMS 3 running inside Next.js, not a separate CMS + separate app.** Payload 3 mounts directly into a Next.js App Router project — one repo, one deploy. Collections (`src/collections/`) define the entire backend: schema, auth, access control, and a full REST API, generated automatically. This is *the* "easier way for users to add cars" the brief asked for — but not by pointing users at the CMS admin panel.

**Users never see the Payload admin UI.** `/admin` is real, but gated to `moderator`/`admin` roles only (see `payload.config.ts` and every collection's `access` block). Everyone else gets purpose-built UI: the `/sell` wizard (`src/components/listings/SellWizard.tsx`) for posting a listing, and `/dashboard` for managing it afterward. Same backend, two very different front doors — one for staff, one for the public.

**One `Listings` collection, not one per vehicle type.** A `category` field (car, truck, heavy-machinery, tuk-tuk, spare-parts, …) plus conditionally-shown field groups (`heavyMachineSpecs`, `sparePartDetails`) means a Toyota Vitz, a wheel loader, and a used alternator all live in the same searchable index instead of separate tables each needing their own search/filter/feature logic.

**The featured/paid-placement flow is a three-step, server-verified handoff**, not a client-side toggle:
1. `POST /api/payments/mpesa/stk-push` creates a `FeaturedOrders` row (`status: pending`) and asks Safaricom Daraja to push an M-Pesa prompt to the seller's phone.
2. The seller enters their PIN on their phone. Nothing in this app is involved in that step.
3. Safaricom calls `POST /api/payments/mpesa/callback` once the payment completes or fails. **Only this route** ever sets `listing.featured = true`. If you're auditing this codebase for the "can someone get a free featured listing" question, this is the file to check.

**Direct Daraja now.** Safaricom Daraja requires consumer credentials, an approved shortcode/passkey, and a public HTTPS callback URL. `src/lib/mpesa.ts` is the *only* file that talks to the payment provider.

**Custom API routes wrap business logic; Payload's own REST API handles plain CRUD.** `/api/users`, `/api/listings`, `/api/dealers`, `/api/media`, `/api/inquiries`, `/api/inspections` are all generated automatically by mounting Payload's REST handler once (`src/app/(payload)/api/[...slug]/route.ts`). The handful of routes under `src/app/api/` (inquiry logging, M-Pesa, bulk upload, duty calculator, phone-OTP) exist because they need logic beyond "create a row."

## What makes this different from Jiji / PigiaMe / Peach Cars / Carhoot

- **Jiji** wins on raw scale but has a persistent, publicly visible scam-complaint problem.
- **PigiaMe** does tiered boosted listings well but gives sellers no analytics and treats heavy machinery as an afterthought.
- **Peach Cars** is the trust leader — inspections, fast payouts, financing — but is locally-used-only, no imports, no open multi-vendor listing.
- **Carhoot** owns the *import* journey end to end but isn't a general marketplace.

The wedge — nobody combines open multi-vendor breadth with real trust infrastructure *and* the specific things Kenyan buyers/sellers in this market actually need:

1. **Import duty calculator** built into the browse/listing flow (`src/lib/dutyCalculator.ts`) — CRSP × age-depreciation × KRA's duty/excise/VAT/IDF/RDL chain.
2. **Heavy machinery, tuk-tuks, and spare parts as first-class categories**, not filters buried inside "trucks."
3. **Seller-facing lead analytics** (views vs. inquiries vs. conversion) — `/dashboard`.
4. **Three deliberately distinct trust badges, not one blurred signal:** `VerifiedBadge` (rotated stamp — is this seller who they say they are, based on document review), `FeaturedBadge` (amber rectangle — did they pay to be seen, no trust implication), and `InspectedBadge` (circle-check pill — was *this specific vehicle* physically checked). Conflating any two of these is exactly the kind of trust-signal mush that lets bad listings hide behind an unrelated seller's good reputation — see `src/collections/Inspections.ts` for the reasoning.
5. **Duty/clearance status on import listings** (`dutyStatus` field) — "duty paid" vs. "bonded/pre-clearance" is something buyers ask about immediately and none of the four competitors surface as a filterable field.
6. **Dealer CSV bulk upload** — a dealer with an existing stock spreadsheet posts their whole inventory in one request.
7. **WhatsApp-first contact**, with every click logged as a lead, plus an actual SMS/email notification to the seller when one comes in — not just a `wa.me` link with no data behind it.
8. **Phone-first login** (`/api/auth/otp/*`) alongside email/password, because this market is phone-first, not email-first.

## Getting started

```bash
npm install
cp .env.example .env
# fill in DATABASE_URI (Postgres — Supabase, Neon, or Railway all work),
# PAYLOAD_SECRET and OTP_HASH_SECRET (openssl rand -base64 32 each),
# MPESA_* sandbox credentials,
# AT_USERNAME/AT_API_KEY (Africa's Talking, sandbox mode needs no real key to start)
npx payload generate:importmap   # regenerates src/app/(payload)/admin/importMap.js properly
npm run generate:types            # produces src/payload-types.ts from the live collections
npm run seed:crsp                 # imports crsp.xlsx from the project root or scripts/
npm run dev
```

Then visit `/admin` once to create your first `admin`-role user, and `/` for the public site.

**A note on dependency versions:** every `@payloadcms/*` package plus `payload` itself is pinned to the exact same version (checked against the live npm registry, not guessed) — Payload is strict about these matching across its ecosystem, and a mismatch here is a real, common source of install failures. `next`, `react`, `zod`, and `tailwindcss` are pinned with `^` ranges to the *major* version this code was actually written against. Newer majors exist for several of these (Tailwind v4 in particular replaced the JS config file this project uses with a CSS-based one) — adopting them would need real migration work, not just a version bump, so it's deliberately not done here.

### Image storage

Wired to Vercel Blob via `@payloadcms/storage-vercel-blob`, registered as a plugin in `payload.config.ts`. Set `BLOB_READ_WRITE_TOKEN` and uploads go straight there — verified against the plugin's own shipped type definitions, it falls back to local disk automatically if the token is unset, so bare local dev works with no extra setup. For Cloudflare R2 instead (cheaper at real scale, S3-compatible), swap `vercelBlobStorage` for `@payloadcms/storage-s3` pointed at R2's endpoint.

### Legal pages

`/terms` and `/privacy` are real, wired-up pages (linked from the footer), written to accurately reflect what the app's code actually collects and does — not generic template text. **Both are drafts that need a Kenyan-qualified advocate's review before going live**, and both contain bracketed placeholders (`[Company Legal Name]`, `[Registered Address]`, etc.) for business facts that cannot be derived from code. Search each file for `[` before publishing.

### What's genuinely built vs. what's a stub

**Fully wired:** the data model (9 collections), role-based access control, the sell wizard → moderation queue → active listing pipeline, price-outlier moderation, search/filter (URL-driven, shareable links), duty-status and spare-parts/tuk-tuk fields, the M-Pesa boost flow end to end, dealer storefronts, seller analytics, lead SMS/email notifications, image watermarking, phone-OTP login, the per-vehicle inspection badge system, SEO metadata + `Schema.org/Vehicle` structured data on listing pages, the duty calculator (client and API versions), server-side CRSP search, CSV bulk upload, and image storage via Vercel Blob.

**Deliberately a stub, called out in code comments where it matters:**
- The CRSP schedule is imported into the `crsp-schedule` collection from `crsp.xlsx`; the calculator searches it server-side so thousands of rows are not loaded into the browser.
- Daraja callbacks are matched to pending orders and verified against the expected amount; continue monitoring and reconciling payment callbacks before accepting real payments.
- No escrow/buyer-protection flow (Carhoot and Peach Cars both lean on something like this) — the single biggest remaining lever against the "Jiji has a scam problem" trust gap, and still unbuilt.
- No AI/ML-based fraud detection beyond the price-outlier rule already implemented.
- `PhoneOtpLogin` is wired into `/login` but not yet into the sell wizard's inline auth step — same component, small follow-up.

**Written correctly but not execution-tested** (no live Postgres available in the environment this was built in — confirm these the first time you run it for real):
- The watermark hook in `Media.ts` reads the raw upload off `req.file.data` in a `beforeOperation` hook.
- The phone-OTP login handoff in `api/auth/otp/verify/route.ts` (random password → Payload's own `login()` → manually-set `payload-token` cookie).

## Suggested next steps, roughly in order

1. Get it running locally against a real Postgres instance, confirming the two execution-untested pieces above actually work as written.
2. Have `/terms` and `/privacy` reviewed by a Kenyan-qualified advocate and fill in every bracketed placeholder — including confirming whether Magariyetu needs to register as a data controller with the ODPC under Section 18 of the Data Protection Act, 2019.
3. Move IntaSend and Africa's Talking from sandbox to production access (the latter requires an approval process before it'll send to real, non-test numbers).
4. Populate a real (even partial) CRSP reference table — the single feature most worth getting right before launch.
5. Decide on escrow/buyer-protection.
6. Add IP-based rate limiting on top of the per-phone OTP throttling already in place.
