# Pre-GitHub and Launch Checklist

This document is the release runbook for Magariyetu. Complete the sections in order. A checked item means it has been verified in the target environment, not merely configured in a local file.

## 1. Current Readiness

- [ ] Do not call the project production-ready until the live deployment has passed the smoke tests in this document.
- [x] Root `.gitignore` excludes environment files, dependencies, build output, local uploads, and Excel source files.
- [x] Payload uses PostgreSQL through `DATABASE_URI`.
- [x] Payload collections define users, dealers, listings, inquiries, inspections, media, OTP records, featured orders, and CRSP schedule records.
- [x] Email/password authentication uses Payload auth.
- [x] Phone login uses an OTP request and verify flow.
- [x] Direct Safaricom Daraja STK Push is the payment integration currently implemented.
- [x] CRSP lookup supports server-side search by make, model, and variant.
- [ ] Complete and verify the CRSP import. The workbook is local source data and is intentionally ignored by Git.
- [ ] Run every production smoke test after deployment.

## 2. Before the First GitHub Push

### Repository hygiene

- [ ] Create a private GitHub repository first.
- [ ] Confirm `.gitignore` is present before `git add .`.
- [ ] Confirm `.env` is not staged.
- [ ] Confirm `.env.example` contains names and safe placeholders only.
- [ ] Keep `crsp.xlsx` outside Git unless redistribution rights for the source data are confirmed. The local importer accepts it from either the repository root or `scripts/`.
- [ ] Do not commit `node_modules/`, `.next/`, local uploads, database dumps, API exports, logs, or credentials.
- [ ] Search the staged diff for secrets before pushing:

```powershell
git diff --cached -- . ':!package-lock.json'
Select-String -Path .env.example -Pattern 'sk_|secret|password|token|key' -CaseSensitive:$false
```

- [ ] Enable branch protection and pull-request review once collaborators are added.
- [ ] Enable Dependabot or another dependency update process.
- [ ] Enable secret scanning and push protection in GitHub.
- [ ] Never paste `.env` values into issues, commits, screenshots, or chat.

### Local verification

```powershell
npm install --legacy-peer-deps
npx payload generate:importmap
npm run generate:types
npx tsc --noEmit
npm run build
```

- [ ] Review `npm audit` output. Do not blindly run `npm audit fix --force`; review breaking changes first.
- [ ] Start the app on a clean port and test the public pages.
- [ ] Remove or document all temporary test users and records.

## 3. Services and Accounts to Create

### GitHub

- Private repository initially.
- Enable secret scanning, push protection, Dependabot, and branch protection.
- Add deployment secrets only to the hosting provider, never to GitHub source files.

### PostgreSQL

Use one managed PostgreSQL provider for staging and another database for production, or at minimum separate databases:

- Supabase: create a project and database password.
- Neon: create a project and pooled or direct connection string.
- Railway: create a PostgreSQL service and copy its connection string.

Configure `DATABASE_URI`. Use SSL in production. Restrict database access and rotate the password if it was ever exposed.

### Hosting

Vercel is a suitable first deployment target for this Next.js application. Configure the project root, build command, and Node version. Add all production environment variables in the hosting dashboard, not in the repository.

Set:

```text
NEXT_PUBLIC_SERVER_URL=https://your-real-domain.co.ke
```

This must be the canonical HTTPS origin. It is used for metadata, OAuth-like callback construction, and the M-Pesa callback URL.

### Domain and DNS

- [ ] Register or connect the production domain.
- [ ] Configure DNS records at the registrar or DNS provider.
- [ ] Confirm HTTPS certificate issuance.
- [ ] Confirm both the apex and `www` behavior, then choose one canonical origin.
- [ ] Add the final origin to Payload `cors` and `csrf` settings if the deployment uses more than one frontend origin.

### Safaricom Daraja

Register at Safaricom Daraja and create an application for sandbox testing. For production:

- [ ] Obtain production consumer key and consumer secret.
- [ ] Obtain an approved PayBill or Till/shortcode and passkey.
- [ ] Confirm the business account is allowed to receive STK Push payments.
- [ ] Use a public HTTPS callback URL:
  `https://your-domain.co.ke/api/payments/mpesa/callback`
- [ ] Test successful, failed, cancelled, duplicate, unknown-checkout, and amount-mismatch callbacks.
- [ ] Confirm callback logs do not include credentials, passkeys, or customer PINs. The app must never receive or store the M-Pesa PIN.
- [ ] Confirm the code and amount in `FeaturedOrders` are server-derived and cannot be trusted from the browser.

The implemented code uses direct Daraja, not IntaSend. Sandbox and production use different base URLs and credentials.

### Africa's Talking

Register at Africa's Talking for phone OTP and seller lead notifications:

- [ ] Create a sandbox application.
- [ ] Test SMS delivery to approved sandbox numbers.
- [ ] Request production access.
- [ ] Obtain a production API key.
- [ ] Register or approve the sender ID if required.
- [ ] Confirm Kenyan number formatting and delivery costs.
- [ ] Set `AT_ENV=production` only after production credentials work.
- [ ] Add an IP and phone-based rate limiter. The current database check prevents one active OTP per phone, but it is not sufficient against distributed abuse.

### Resend

Register at Resend for lead and account email:

- [ ] Verify the sending domain.
- [ ] Add SPF and DKIM DNS records supplied by Resend.
- [ ] Configure `EMAIL_FROM` using the verified domain.
- [ ] Test delivery, bounce, spam, and reply behavior.
- [ ] Do not use `onboarding@resend.dev` for production mail.

### Image storage

For Vercel Blob:

- [ ] Create a Blob store.
- [ ] Configure `BLOB_READ_WRITE_TOKEN` only in the hosting environment.
- [ ] Test image upload, generated sizes, deletion permissions, and public URLs.
- [ ] Decide whether PDFs should be public. Inspection documents may need stricter access than listing photos.

## 4. Production Environment Variables

Configure these in staging and production separately:

```text
NEXT_PUBLIC_SERVER_URL=https://your-domain.co.ke
PAYLOAD_SECRET=<long random secret, unique per environment>
DATABASE_URI=<private PostgreSQL connection string>
OTP_HASH_SECRET=<long random secret, unique per environment>
BLOB_READ_WRITE_TOKEN=<storage token>
MPESA_CONSUMER_KEY=<Daraja credential>
MPESA_CONSUMER_SECRET=<Daraja credential>
MPESA_SHORTCODE=<approved shortcode>
MPESA_PASSKEY=<Daraja passkey>
MPESA_ENV=production
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER=2547XXXXXXXX
AT_USERNAME=<Africa's Talking username>
AT_API_KEY=<Africa's Talking API key>
AT_SENDER_ID=<approved sender ID, if used>
AT_ENV=production
RESEND_API_KEY=<Resend API key>
EMAIL_FROM=no-reply@your-domain.co.ke
```

- [ ] Use different `PAYLOAD_SECRET`, `OTP_HASH_SECRET`, database, and provider credentials in staging and production.
- [ ] Store secrets in Vercel/hosting secret storage.
- [ ] Rotate secrets after staff changes or suspected exposure.
- [ ] The OTP routes now return `503` when `OTP_HASH_SECRET` is absent. Do not restore a development fallback in production.

## 5. Users, Registration, and Roles

Current behavior:

- Payload requires an email and password for the normal user record.
- New public accounts are forced to `buyer` by the `Users` hook.
- `requestedRole` records whether signup intent was buyer, individual seller, or dealer.
- Admins must approve any role elevation.
- Phone OTP can find or create a user using a generated internal password and a placeholder email.

Before launch:

- [ ] Decide whether the placeholder email strategy is acceptable for support, exports, and account recovery.
- [ ] Add a profile flow for phone-only users to add and verify a real email.
- [ ] Build dealer application review: business name, permit, KRA PIN, owner ID, contact details, and verification decision.
- [ ] Ensure dealer approval changes the actual role only through an admin/moderator workflow.
- [ ] Add password confirmation and strength feedback to registration.
- [ ] Normalize `07...`, `+254...`, and `254...` to one canonical `2547XXXXXXXX` format before API submission.
- [ ] Add clear email-verification messaging and resend verification behavior.
- [ ] Confirm redirect URLs cannot be abused for open redirects. Allow only local paths beginning with `/`.
- [ ] Add account deletion/data export procedures for privacy requests.

## 6. OTP Security and Operations

- [ ] Use a high-entropy `OTP_HASH_SECRET`.
- [ ] Keep OTP codes hashed; never log the code.
- [ ] Keep the five-attempt verification limit.
- [ ] Add Redis/Upstash rate limits by IP, phone, and device/browser signal.
- [ ] Add a resend countdown in the UI.
- [ ] Expire and periodically delete old OTP records.
- [ ] Add monitoring for OTP spikes and SMS cost anomalies.
- [ ] Test wrong code, five wrong codes, expired code, replayed code, concurrent requests, and a missing SMS provider.
- [ ] Confirm cookies are `HttpOnly`, `Secure` in production, `SameSite=Lax`, and scoped to `/`.
- [ ] Confirm a successful OTP creates a normal Payload session and logout invalidates it.

## 7. Backend and Access-Control Review

- [ ] Keep `/admin` restricted to moderator/admin roles.
- [ ] Test every Payload REST collection as anonymous, buyer, individual seller, dealer, moderator, and admin.
- [ ] Confirm sellers can only update/delete their own listings.
- [ ] Confirm public users can only read active listings.
- [ ] Confirm inquiries are readable only by the listing seller or admin.
- [ ] Revisit media deletion. `Media` currently allows any authenticated user to delete media; add uploader/owner tracking or restrict deletion to the owning workflow, moderator, and admin.
- [ ] Restrict inspection reports and verification documents if they contain identity or business documents.
- [ ] Add file size limits and content validation for images and PDFs.
- [ ] Add request validation for all custom API routes, not only TypeScript casts.
- [ ] Add structured logging with request IDs. Never log passwords, OTPs, access tokens, passkeys, or full payment payloads.
- [ ] Add error monitoring such as Sentry, especially for payment callbacks, SMS, email, uploads, and database failures.
- [ ] Add database backups, restore testing, retention, and migration ownership.
- [ ] Add IP rate limits to anonymous inquiry creation to reduce spam.

## 8. CRSP Import and Search

The preferred source filename is:

```text
crsp.xlsx
```

Preferred location:

```text
<project-root>/crsp.xlsx
```

The importer also accepts:

```text
<project-root>/scripts/crsp.xlsx
```

The root file is checked first. The workbook currently contains a main motor-vehicle sheet and a motorcycle sheet. The importer detects the header row and maps `Make`, `Model`, `Model number`, `Fuel`, and `CRSP (KES.)`. Title/template sheets without those headers are skipped.

Run from the project root:

```powershell
npx tsx scripts/seedCrsp.ts
```

The importer is idempotent by make, model, and variant. It reads `.env` through `dotenv`, imports official workbook rows as `verified: true`, and uses the starter catalog only when no readable workbook rows are found. Confirm completion through:

```powershell
Invoke-WebRequest -UseBasicParsing 'http://localhost:3000/api/crsp-schedule?limit=1'
Invoke-WebRequest -UseBasicParsing 'http://localhost:3000/api/crsp-schedule?q=Toyota%20Vitz&limit=10'
```

The calculator uses server-side search and should not load 5,000 rows into a browser `<select>`. Test:

- [ ] Search by make.
- [ ] Search by model.
- [ ] Search by variant/model number.
- [ ] Search with no results.
- [ ] Clear search.
- [ ] Select a result and confirm CRSP/category update.
- [ ] Confirm estimates and verified records are visibly distinct.
- [ ] Confirm the API has a bounded result limit.
- [ ] Replace the simple CSV parser with a standards-compliant parser if CSV bulk import remains supported.

## 9. Payment and Featured Listings

- [ ] Test STK Push in Daraja sandbox.
- [ ] Verify the order is created as `pending` before the provider request.
- [ ] Verify only the callback can mark the order paid and feature the listing.
- [ ] Verify callback lookup requires a real pending checkout ID.
- [ ] Verify reported amount equals the server-side order amount.
- [ ] Make callback processing idempotent.
- [ ] Add an operational reconciliation screen for pending orders.
- [ ] Decide how to expire abandoned pending orders.
- [ ] Add a refund/manual adjustment procedure.
- [ ] Confirm plan prices, duration, taxes, receipts, and terms with a Kenyan accountant/legal adviser.

## 10. UI/UX Improvements Before Public Launch

The current interface is suitable for a functional staging release. Improve these before a serious public campaign:

- [ ] Add mobile navigation. Desktop links are hidden on small screens and need a clear menu trigger.
- [ ] Add loading, disabled, retry, and empty states to registration, login, OTP, CRSP search, listings, and uploads.
- [ ] Add OTP resend countdown and “change number” behavior.
- [ ] Show phone-format examples and normalize input automatically.
- [ ] Add password confirmation and password recovery messaging.
- [ ] Preserve redirect intent through email and phone login.
- [ ] Add dealer verification expectations before registration is submitted.
- [ ] Add a visible trust explanation distinguishing Verified, Inspected, and Featured badges.
- [ ] Add image upload previews, reorder controls, file-size guidance, and upload progress.
- [ ] Keep filters URL-driven and add a clear “reset filters” action.
- [ ] Make mobile cards and pricing readable without horizontal scrolling.
- [ ] Add accessible labels, focus styles, keyboard operation, sufficient contrast, and useful error text.
- [ ] Test at 320px, 375px, 768px, 1024px, and wide desktop widths.
- [ ] Add analytics for search, listing views, inquiry clicks, OTP conversion, registration conversion, and payment conversion without collecting unnecessary personal data.

## 11. Legal, Privacy, and Trust

- [ ] Replace every bracketed placeholder in `/terms` and `/privacy`.
- [ ] Have both documents reviewed by a Kenyan-qualified advocate.
- [ ] Confirm ODPC obligations for controller/processor registration and data handling.
- [ ] Document retention and deletion periods for phone numbers, OTPs, inquiries, identity documents, payment records, and uploaded media.
- [ ] Obtain appropriate consent for SMS and email notifications.
- [ ] Provide a way to opt out of non-essential notifications.
- [ ] Confirm WhatsApp usage and business-number ownership.
- [ ] Publish a fraud-reporting and dispute process.
- [ ] Decide whether escrow or buyer protection is required before launch.
- [ ] Do not imply that an estimate, verified seller, paid placement, and inspected vehicle are the same trust signal.

## 12. Deployment and Smoke Test

```powershell
npm install --legacy-peer-deps
npx payload generate:importmap
npm run generate:types
npx tsc --noEmit
npm run build
```

After deployment:

- [ ] Homepage returns `200`.
- [ ] Cars, trucks, motorbikes, tuktuks, heavy machinery, dealers, pricing, sell, login, register, terms, privacy, and calculator routes return `200`.
- [ ] `/admin` requires staff access.
- [ ] Registration creates a buyer and records `requestedRole`.
- [ ] Email login sets a session cookie.
- [ ] OTP request and verify work with a real test number.
- [ ] Seller can create a pending listing and upload permitted media.
- [ ] Public visitor can view only active listings.
- [ ] Inquiry creation increments the listing count and sends best-effort notifications.
- [ ] CRSP search returns matching records.
- [ ] M-Pesa sandbox flow creates and resolves an order correctly.
- [ ] Database reconnects and backup/restore procedures are documented.
- [ ] Logs and monitoring show no secrets or OTP values.

## 13. Go/No-Go Decision

Go live only when all of these are true:

- [ ] No secrets or restricted source files are in GitHub.
- [ ] Production environment variables are configured in the hosting provider.
- [ ] Database backups and restore have been tested.
- [ ] OTP and payment flows have passed real sandbox tests.
- [ ] Access-control tests pass for each role.
- [ ] Legal documents are reviewed and complete.
- [ ] CRSP import count is recorded and search is working.
- [ ] Monitoring and incident ownership are assigned.
- [ ] A rollback plan exists.
