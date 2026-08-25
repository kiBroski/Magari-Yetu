# Magariyetu — Architecture Reference

This is the detailed companion to `docs/PROJECT_TREE.md` and the root `README.md`. Where the README pitches *why* this is built the way it is and the tree shows *where* everything lives, this document is the *how it actually works* reference — every collection's real fields, every request flow traced end to end, and every external dependency accounted for. Written to match the codebase exactly as of this version, not aspirationally.

---

## 1. Architectural principles

Five decisions shape almost everything else in this codebase. Understanding these first makes the rest of this document — and the code itself — much faster to navigate.

**One app, not two.** Payload CMS 3 mounts directly inside the Next.js App Router project via `payload.config.ts` and the `withPayload()` wrapper in `next.config.mjs`. There is no separate backend service, no separate deploy, no separate repo. One `npm run dev` starts everything: the public site, the REST API, and the admin panel.

**Regular users never see the Payload admin panel.** `/admin` exists and is fully functional, but it's gated in `payload.config.ts` and in every collection's `access` block to `moderator`/`admin` roles only. Buyers, sellers, and dealers get purpose-built UI instead — the `/sell` wizard, `/dashboard` — that talks to the same backend through the ordinary REST API.

**One `Listings` collection, not one per category.** A `category` field (car, motorcycle, tuk-tuk, pickup-van, truck, bus, trailer, heavy-machinery, spare-parts) plus two conditionally-rendered field groups (`heavyMachineSpecs`, `sparePartDetails`) let a Toyota Vitz, an excavator, and a used alternator share one searchable table instead of needing separate schemas, separate search logic, and separate moderation queues.

**Payment provider logic lives in exactly one file.** `src/lib/mpesa.ts` is the only file in the entire codebase that constructs a request to Safaricom's Daraja API. Every route that needs to trigger or interpret a payment calls through this one module. This is why swapping from IntaSend to direct Daraja (a real change made mid-project) touched essentially one file plus the callback parser, and nothing about the `FeaturedOrders` schema, the dashboard UI, or the boost button had to change at all.

**Only a confirmed payment webhook can mark a listing featured.** `POST /api/payments/mpesa/callback` is the single place in the codebase that sets `listing.featured = true`. Not the button click, not the STK-push initiation route — only a callback that Safaricom actually sent, after actually validating it against a real pending order. This is deliberate: it's the difference between "can this be gamed" being a real question versus a closed one.

---

## 2. Data model — every collection, every field, every relationship

All eight collections are registered in `payload.config.ts`, which is what turns each one into a live database table plus an auto-generated REST API plus an admin screen.

### `Users` (`src/collections/Users.ts`)
The auth-enabled root of the whole system — every account, regardless of type, is one row here.

| Field | Purpose |
|---|---|
| `name` | Display name |
| `phone` | Unique, `2547XXXXXXXX` format. Keys M-Pesa STK push, WhatsApp contact, and phone-OTP login's find-or-create lookup |
| `whatsappOptIn` | Whether to show a WhatsApp contact button on this user's listings |
| `role` | `buyer` \| `individual_seller` \| `dealer` \| `moderator` \| `admin` — gates nearly everything downstream. Forced to `buyer` on self-registration regardless of what's submitted (see the collection's `beforeChange` hook) |
| `avatar` | → `Media` |
| `idVerified` | Set only by staff, drives the ID-verified `VerifiedBadge` |
| `savedListings` | → `Listings`, many |

**Relates to:** `Dealers` (via `Dealers.owner`), `Listings` (via `Listings.seller`), `FeaturedOrders` (via `.user`), `Inquiries` (via `.buyerUser`), `Inspections` (via `.requestedBy` / `.inspector`).

### `Dealers` (`src/collections/Dealers.ts`)
A business storefront, deliberately separate from `Users` so a dealership's public identity doesn't live on a login record.

| Field | Purpose |
|---|---|
| `owner` | → `Users`, the account that manages this storefront |
| `businessName`, `slug` | Public identity; slug auto-generated from name if omitted |
| `logo`, `coverImage` | → `Media` |
| `description`, `county`, `town`, `physicalAddress` | Storefront profile |
| `contactPhone`, `whatsappNumber` | Public contact |
| `dealsIn` | What categories this dealer sells |
| `verificationStatus` | `unverified` \| `pending` \| `verified` \| `rejected` — staff-only to change |
| `verificationDocs` | Array of `{ label, file }`, `file` → `Media` — business permit, KRA PIN cert, etc. |
| `subscriptionTier` | `free` \| `pro` \| `premium` — controls the listing cap enforced in `Listings.ts`'s `beforeChange` hook |
| `subscriptionRenewsAt` | Billing date |

**Relates to:** `Users` (owner), `Listings` (via `Listings.dealer`).

### `Listings` (`src/collections/Listings.ts`)
The largest and most important collection — one row per vehicle, machine, or part for sale.

| Field | Purpose |
|---|---|
| `title`, `slug` | Display and URL |
| `seller` | → `Users`, required |
| `dealer` | → `Dealers`, optional — links a listing to a storefront |
| `category` | Selects which conditional field group applies |
| `condition` | `brand-new` \| `locally-assembled` \| `foreign-used` \| `locally-used` |
| `make`, `model`, `trim`, `yearOfManufacture` | Standard vehicle identity |
| `transmission`, `fuelType`, `engineCc`, `mileageKm`, `bodyType`, `color` | Standard vehicle spec — hidden in the UI for heavy-machinery and spare-parts categories |
| `heavyMachineSpecs` (group) | `equipmentType`, `operatingHours`, `capacityOrTonnage`, `attachments` — shown only when `category === 'heavy-machinery'` |
| `sparePartDetails` (group) | `partType`, `compatibleModels`, `partCondition` — shown only when `category === 'spare-parts'` |
| `dutyStatus` | `duty-paid` \| `bonded-pre-clearance` — shown only when `condition === 'foreign-used'` |
| `vinOrChassis` | Internal only, never shown publicly — used for duplicate/fraud checks |
| `price`, `negotiable`, `currency` | |
| `description` | |
| `images` (array of `{ image }`) | → `Media`, min 1 |
| `videoUrl` | Optional external link |
| `county`, `town` | Location |
| `status` | `draft` \| `pending-review` \| `active` \| `sold` \| `expired` \| `rejected` — staff-only to change |
| `moderationFlag` | `none` \| `price-outlier-low` \| `duplicate-vin` — auto-set by the price-outlier `beforeChange` hook, which compares against the median price of same make/model listings within ±2 model years (needs ≥3 comparables to fire) |
| `featured`, `featuredUntil` | Set only by the M-Pesa callback route, never directly |
| `views`, `inquiryCount` | Read-only counters |

**Relates to:** `Users` (seller), `Dealers` (dealer), `Media` (images), `FeaturedOrders` (a listing can have many), `Inquiries` (a listing can have many), `Inspections` (a listing can have many).

### `FeaturedOrders` (`src/collections/FeaturedOrders.ts`)
The payment ledger. Also exports `PLANS` — the source of truth for boost pricing, read by `/pricing`, the dashboard, and the STK-push route.

| Field | Purpose |
|---|---|
| `listing` | → `Listings` |
| `user` | → `Users`, who paid |
| `plan` | Key into `PLANS` (`boost-3d`, `boost-7d`, `boost-30d`, `homepage-spotlight-7d`) |
| `amount`, `durationDays` | Snapshotted from `PLANS` at order creation, so a later price change never rewrites an existing order's terms |
| `paymentProvider` | Currently always `mpesa` (Safaricom Daraja) or `card` |
| `providerCheckoutId` | Daraja's `CheckoutRequestID` — how the callback route matches an incoming webhook back to this order |
| `status` | `pending` \| `paid` \| `failed` \| `expired` |
| `startDate`, `endDate` | Set by the callback route once payment clears |

### `Inquiries` (`src/collections/Inquiries.ts`)
One row per lead — a WhatsApp click, a phone reveal, or a contact-form submission.

| Field | Purpose |
|---|---|
| `listing` | → `Listings` |
| `buyerUser` | → `Users`, optional — null for anonymous enquirers |
| `buyerName`, `buyerPhone`, `buyerEmail`, `message` | Contact details, mostly relevant for the `form` channel |
| `channel` | `whatsapp` \| `phone` \| `form` |

Its `afterChange` hook does two things on every new inquiry: increments the parent listing's `inquiryCount`, and — best-effort, failures swallowed — sends an SMS (and email, if the seller has a real address) via `src/lib/sms.ts` / `email.ts` notifying the seller.

### `Media` (`src/collections/Media.ts`)
Standard Payload upload collection, extended with a `beforeOperation` hook that watermarks every image (via `sharp`) before it's stored. Storage backend is Vercel Blob (registered as a plugin in `payload.config.ts`), which self-disables and falls back to local disk automatically when `BLOB_READ_WRITE_TOKEN` isn't set.

| Field | Purpose |
|---|---|
| `alt` | Alt text |
| *(auto)* `thumbnail`, `card`, `full` | Generated image size variants |

### `Inspections` (`src/collections/Inspections.ts`)
One record per physical check of one specific vehicle — deliberately independent of the seller's own verification status.

| Field | Purpose |
|---|---|
| `listing` | → `Listings` |
| `requestedBy` | → `Users`, who asked for the inspection |
| `status` | `requested` \| `scheduled` \| `completed` \| `failed` |
| `inspector` | → `Users`, staff account that performed it |
| `inspectionDate` | |
| `checklist` (array) | `{ item, result: pass\|fail\|not-applicable, note }` |
| `overallResult` | `pass` \| `pass-with-notes` \| `fail` |
| `reportFile` | → `Media`, an optional PDF report |

A listing shows the `InspectedBadge` when a `completed` inspection with a `pass`/`pass-with-notes` result exists for it — computed at read time in `cars/[slug]/page.tsx`, not stored as a field on `Listings` itself.

### `PhoneOtps` (`src/collections/PhoneOtps.ts`)
A server-only bookkeeping table with `access` locked to `() => false` on every operation — invisible to the REST API and to any logged-in user, reachable only via the Local API from inside `api/auth/otp/*` route handlers.

| Field | Purpose |
|---|---|
| `phone` | |
| `codeHash` | SHA-256 hash of the OTP code, peppered with `OTP_HASH_SECRET` |
| `expiresAt` | 5 minutes from creation |
| `attempts` | Capped at 5 before a code is rejected outright |
| `consumed` | Set true once verified, preventing reuse |

---

## 3. Request flows, traced end to end

Reading the collections tells you the *shape* of the data. These trace what actually happens, file by file, for the flows that touch the most moving parts.

### Posting a listing
1. `src/app/(site)/sell/page.tsx` renders `SellWizard.tsx`, a five-step client component. No login is required for the first four steps.
2. On "Publish," `SellWizard` checks session state (`GET /api/users/me`). If none exists, it shows an inline register/login block *before* submitting — the draft is never lost to a redirect.
3. Each selected photo is uploaded individually to `POST /api/media` (passing through `Media.ts`'s watermark hook and the Blob storage plugin).
4. The listing itself is created via `POST /api/listings` with `status: 'pending-review'`. This passes through `Listings.ts`'s `beforeChange` hooks: the listing-cap check (against the seller's — or their dealer's — plan) and the price-outlier check.
5. A moderator reviews it in `/admin` and flips `status` to `active` (or `rejected`).

### Boosting a listing (payment)
1. `BoostButton.tsx` on `/dashboard/listings` posts to `POST /api/payments/mpesa/stk-push`.
2. That route verifies listing ownership, creates a `FeaturedOrders` row (`status: pending`), and calls `initiateMpesaStkPush()` in `lib/mpesa.ts`, which fetches a Daraja OAuth token and sends the actual STK push request. The returned `CheckoutRequestID` is saved as `providerCheckoutId`.
3. The seller enters their M-Pesa PIN on their phone — no part of this app is involved in that moment.
4. Safaricom calls `POST /api/payments/mpesa/callback` asynchronously. That route matches the order by `CheckoutRequestID`, verifies the reported amount matches what the order expects (Daraja has no signing-secret header the way the earlier IntaSend integration did, so this amount check is the substitute authenticity gate), and — only on success — sets the order `paid` and the listing `featured: true`.
5. Meanwhile `BoostButton` has been polling `GET /api/payments/mpesa/status?orderId=...` every few seconds, and flips its UI the moment it sees `paid`.

### Phone-OTP login
1. `PhoneOtpLogin.tsx` posts a phone number to `POST /api/auth/otp/request`, which generates a 6-digit code, hashes it into `PhoneOtps`, and sends it via `lib/sms.ts`.
2. The same component posts the entered code to `POST /api/auth/otp/verify`. On a match, that route finds-or-creates a `Users` record for the phone (email defaults to a `{phone}@phone.magariyetu.local` placeholder), generates a random password nobody ever sees, calls Payload's own `payload.login()` Local API method to get a real signed session token, and manually sets that as the `payload-token` cookie on the response — since a Local API call doesn't go through HTTP and so doesn't set cookies the way a REST endpoint normally would.

### A lead coming in
1. `WhatsAppButton.tsx` fires a fire-and-forget `POST /api/listings/inquiry` on click (never blocking the actual WhatsApp redirect on it), which creates an `Inquiries` row via the Local API.
2. `Inquiries.ts`'s `afterChange` hook increments the listing's `inquiryCount` and sends the seller an SMS/email notification, both best-effort.
3. `/dashboard`'s overview page aggregates `views`, `inquiryCount`, and inquiry records into the seller-facing conversion-rate analytics.

---

## 4. The trust system — three badges, three different claims

Deliberately kept visually and semantically separate, so none of them can be mistaken for another:

- **`VerifiedBadge`** (rotated stamp) — *is this seller who they say they are?* Driven by `Users.idVerified` or `Dealers.verificationStatus`, both staff-reviewed document checks.
- **`FeaturedBadge`** (amber rectangle) — *did this listing's seller pay for placement?* Driven purely by `Listings.featured`, set only by the M-Pesa callback. Carries no trust implication at all.
- **`InspectedBadge`** (checkmark pill) — *was this specific vehicle physically checked?* Driven by a `completed`, `pass`/`pass-with-notes` `Inspections` record tied to that exact listing — independent of the seller's own verification status.

---

## 5. External dependencies

| Service | Used for | Key files |
|---|---|---|
| Postgres (Supabase/Neon/Railway) | The only database | `payload.config.ts` (`DATABASE_URI`) |
| Safaricom Daraja | M-Pesa STK push for boosts and subscriptions | `lib/mpesa.ts`, `api/payments/mpesa/*` |
| Africa's Talking | SMS — OTP codes, lead notifications | `lib/sms.ts` |
| Resend | Email — lead notifications (best-effort secondary channel) | `lib/email.ts` |
| Vercel Blob | Image and document storage | `payload.config.ts` (plugin registration), `collections/Media.ts` |

Every credential these need is documented, with real setup notes (not just names), in `.env.example`.

---

## 6. Known gaps — stub vs. untested vs. genuinely missing

**Deliberately a stub:**
- `CRSP_SEED` in `dutyCalculator.ts` — ~10 illustrative models, not the real ~5,200-model KRA schedule.
- No escrow / buyer-protection flow — the single biggest remaining trust gap relative to Peach Cars and Carhoot.
- No AI/ML fraud detection beyond the rule-based price-outlier check.
- `PhoneOtpLogin` wired into `/login` but not yet into `SellWizard`'s inline auth step.

**Written correctly, not execution-tested** (no live Postgres was available in the environment this was originally built in):
- The watermark hook's exact `req.file` property access in `Media.ts`.
- The Daraja OAuth/STK-push/callback sequence in `lib/mpesa.ts` and its two routes — architecturally correct against Safaricom's published docs, not fired against a live sandbox account from this codebase.

**Flagged, not fixed:**
- OTP and inquiry endpoints rate-limit per-phone only, nothing per-IP yet.
- Vercel Blob only supports public file access — fine for listing photos, worth reconsidering for dealer verification documents (ID scans, KRA PIN certs) sharing the same `Media` collection.
- `/terms` and `/privacy` are accurate drafts, not lawyer-reviewed, and still contain bracketed placeholders for real business/legal facts.

---

## 7. Suggested next additions, roughly by value-for-effort

1. Wire `PhoneOtpLogin` into `SellWizard` — same component, small integration.
2. A real `CrspSchedule` collection to replace the seed table.
3. Escrow / buyer-protection design and build.
4. IP-based rate limiting on `auth/otp/*` and `listings/inquiry`.
5. A comparison tool and a financing/loan calculator — both were in the original competitive-differentiation plan, neither got built.
6. A separate, private storage path for verification documents specifically.
