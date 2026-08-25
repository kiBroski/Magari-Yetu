# Magariyetu Beginner Deployment Guide

This guide explains what is already on GitHub, what is intentionally kept private, and what to do next to run Magariyetu online.

You do not need to be an experienced developer to follow the order below. Complete one stage at a time.

## The Big Picture

Magariyetu is made of five important parts:

1. **GitHub** stores the application code.
2. **A hosting service** runs the website, for example Vercel.
3. **A PostgreSQL database** stores users, listings, inquiries, payments, and CRSP records.
4. **External services** send SMS, send email, process M-Pesa, and store images.
5. **Environment variables** connect the deployed application to those services.

GitHub stores the recipe for the application. The hosting service cooks and runs that recipe. The database stores the changing information.

## What Was Pushed to GitHub?

The first commit contains the application source and configuration needed to build it:

- Next.js pages and layouts
- Payload CMS collections
- User registration and login code
- Phone OTP code
- M-Pesa API routes
- CRSP API and calculator
- Listing, dealer, dashboard, and payment pages
- Shared category listing routes
- `package.json` and `package-lock.json`
- `.env.example`, which contains safe variable names and placeholders
- Documentation and launch checklists

The local GitHub branches are synchronized. There are currently no commits waiting to be pushed.

## Why Some Files Were Not Pushed

These files are intentionally excluded by `.gitignore`:

### `.env`

This contains passwords, private database URLs, API keys, and other secrets. If this file were placed on GitHub, another person could access your database or services.

The deployed website still needs these values. You will enter them securely in the hosting provider's Environment Variables section instead of putting them in GitHub.

### `node_modules/`

This is a folder containing downloaded packages. It is very large and can always be recreated from `package.json` and `package-lock.json`.

The hosting provider runs:

```powershell
npm install --legacy-peer-deps
```

### `.next/`

This is generated Next.js build output. It is recreated when the project runs or builds.

### `tsconfig.tsbuildinfo`

This is a TypeScript speed-up cache. It is recreated automatically.

### `crsp.xlsx` and `scripts/crsp.xlsx`

This is the source Excel workbook. It is not application code, and it may be official or restricted source data. It is safer to keep it private unless you have permission to redistribute it.

The application does not need the Excel file every time a visitor opens the website. The file is used to import CRSP rows into PostgreSQL. After import, the calculator reads CRSP records from the database.

## Step 1: Prepare Your Computer

Open PowerShell in the project folder:

```text
C:\Users\RONNY\Downloads\files\magariyetu\magariyetu
```

Check that Node.js is installed:

```powershell
node --version
npm --version
```

The project expects Node.js 18.20 or newer.

Install the project packages:

```powershell
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` option is currently needed because the project has a GraphQL peer-dependency version conflict.

## Step 2: Keep Your Local Environment File Private

The project already has `.env.example`. Copy it to a local `.env` file if you have not done so:

```powershell
Copy-Item .env.example .env
```

Open `.env` and fill in your local database and secret values. Never paste the real values into GitHub.

Generate two random secrets. Use a password manager or a secure random generator. PowerShell example:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Use different random values for:

```text
PAYLOAD_SECRET
OTP_HASH_SECRET
```

`PAYLOAD_SECRET` protects Payload sessions. `OTP_HASH_SECRET` protects stored OTP hashes. Do not use the same value for both.

## Step 3: Create a PostgreSQL Database

Choose one managed PostgreSQL provider:

- Supabase
- Neon
- Railway

Create a project and a database. Copy its connection string into `.env`:

```text
DATABASE_URI=postgresql://username:password@host:5432/database
```

Use a separate database for development/staging and production. Do not use the same database for both.

When the application first starts, Payload creates or updates the database schema based on the collections.

## Step 4: Check the Application Locally

Generate Payload's admin import map and TypeScript types:

```powershell
npx payload generate:importmap
npm run generate:types
```

Check TypeScript:

```powershell
npx tsc --noEmit
```

Build the application:

```powershell
npm run build
```

Start the development server on port 3000:

```powershell
npm run dev -- -p 3000
```

Open:

```text
http://localhost:3000
```

Important pages to check:

- `/`
- `/cars`
- `/trucks`
- `/motorbikes`
- `/tuktuks`
- `/heavy-machinery`
- `/tools/import-duty-calculator`
- `/login`
- `/register`
- `/sell`

## Step 5: Import the CRSP Workbook

The preferred filename is:

```text
crsp.xlsx
```

The importer checks these locations:

```text
<project-root>\crsp.xlsx
<project-root>\scripts\crsp.xlsx
```

The root file is checked first. You only need one copy. Keeping the workbook at the project root is simplest.

Run the importer from the project root:

```powershell
npm run seed:crsp
```

The importer:

- Loads values from `.env`
- Opens the workbook
- Finds the real header row instead of assuming row one is the header
- Reads the main vehicle and motorcycle sheets
- Skips title/template sheets without vehicle headers
- Converts sheet names into categories
- Marks workbook records as verified with a source note
- Avoids inserting the same make/model/variant more than once
- Reports progress during import

The workbook is imported into the Payload collection named `crsp-schedule`.

Check the imported records through the API:

```powershell
Invoke-WebRequest -UseBasicParsing 'http://localhost:3000/api/crsp-schedule?limit=1'
```

Search for a known vehicle:

```powershell
Invoke-WebRequest -UseBasicParsing 'http://localhost:3000/api/crsp-schedule?q=Toyota%20Vitz&limit=10'
```

The calculator uses server-side search. It does not load all 5,000-plus records into the browser. A visitor searches by make, model, or variant and receives only a small set of matching records.

## Step 6: Understand User Registration

There are two login methods:

### Email and password

A user registers with:

- Full name
- Phone number
- Email
- Password

Payload handles the normal email/password account. New public accounts begin as buyers. The registration form also records the user's requested path as `requestedRole`:

- Buyer
- Individual seller
- Dealer

A user cannot make themselves an admin or moderator. A staff member must approve role changes.

### Phone OTP

The user enters a Kenyan phone number, receives an SMS code, and enters the six-digit code.

The OTP system:

- Stores a hash, not the original code
- Expires codes after five minutes
- Allows a maximum of five verification attempts
- Creates or finds a Payload user after successful verification
- Creates a normal Payload session cookie

Africa's Talking must be configured for SMS OTP to work. If `OTP_HASH_SECRET` is missing, the API now returns a controlled unavailable response rather than using a weak fallback secret.

## Step 7: Register the External Services

You can run the basic site without every service, but production features need these accounts.

### Hosting: Vercel

Recommended first hosting option for this Next.js project:

1. Create a Vercel account.
2. Import the GitHub repository.
3. Select the project root.
4. Add production environment variables.
5. Deploy.

Vercel automatically installs packages and runs the build command. Keep the build command as the project default unless Vercel asks for one explicitly.

### Database: Supabase, Neon, or Railway

Create a production PostgreSQL database and add its connection string as `DATABASE_URI` in the hosting provider.

### Safaricom Daraja

The current code uses direct Safaricom Daraja, not IntaSend.

Create an account at the Safaricom Daraja developer portal and create an application. Start with sandbox credentials.

For real payments you need:

- Production consumer key
- Production consumer secret
- Approved PayBill or Till/shortcode
- Production passkey
- Business approval from Safaricom
- Public HTTPS callback URL

The callback URL is:

```text
https://your-domain.co.ke/api/payments/mpesa/callback
```

`localhost` cannot receive Safaricom callbacks. Test with a deployed staging domain or an HTTPS tunnel.

### Africa's Talking

Create an Africa's Talking application for SMS.

You need:

- Username
- API key
- Sender ID, if required
- Production approval for real Kenyan numbers

Configure:

```text
AT_ENV=production
AT_USERNAME=your-username
AT_API_KEY=your-api-key
AT_SENDER_ID=your-sender-id
```

### Resend

Create a Resend account for email notifications.

Verify your sending domain and add the SPF/DKIM DNS records Resend provides. Then configure:

```text
RESEND_API_KEY=your-resend-key
EMAIL_FROM=no-reply@your-domain.co.ke
```

Do not use a development sender address in production.

### Vercel Blob

Create a Vercel Blob store and configure:

```text
BLOB_READ_WRITE_TOKEN=your-blob-token
```

Test listing photo uploads, generated image sizes, and deletion permissions.

### WhatsApp

No WhatsApp API account is required for the current click-to-chat feature. Configure the business phone number:

```text
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER=2547XXXXXXXX
```

## Step 8: Add Production Environment Variables

Add the following in the hosting provider's environment settings, not in GitHub:

```text
NEXT_PUBLIC_SERVER_URL=https://your-domain.co.ke
PAYLOAD_SECRET=unique-production-secret
DATABASE_URI=production-postgres-connection-string
OTP_HASH_SECRET=unique-production-otp-secret
BLOB_READ_WRITE_TOKEN=production-blob-token
MPESA_CONSUMER_KEY=production-daraja-key
MPESA_CONSUMER_SECRET=production-daraja-secret
MPESA_SHORTCODE=production-shortcode
MPESA_PASSKEY=production-passkey
MPESA_ENV=production
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER=2547XXXXXXXX
AT_USERNAME=production-africas-talking-username
AT_API_KEY=production-africas-talking-key
AT_SENDER_ID=approved-sender-id
AT_ENV=production
RESEND_API_KEY=production-resend-key
EMAIL_FROM=no-reply@your-domain.co.ke
```

Use separate values for staging and production. Never reuse a production database password in local development.

## Step 9: Deploy to Production

After the hosting provider has the environment variables:

1. Deploy from the `main` branch.
2. Open the deployed homepage.
3. Confirm the URL uses HTTPS.
4. Check `/admin` and create the first admin account if necessary.
5. Run the CRSP importer against the production database from a secure machine or use the protected import endpoint.
6. Confirm CRSP search returns records.
7. Test registration and login.
8. Test image upload.
9. Test M-Pesa only in sandbox until the business account is approved.

Do not run the seed script against production until you have confirmed that `DATABASE_URI` points to the intended production database.

## Step 10: Test the Important User Journeys

### Visitor

- [ ] Can open the homepage.
- [ ] Can browse cars, trucks, motorbikes, tuktuks, and heavy machinery.
- [ ] Can filter listings.
- [ ] Can search the CRSP database.
- [ ] Can open a listing detail page.
- [ ] Can use WhatsApp or inquiry contact.

### New account

- [ ] Can register with valid details.
- [ ] Cannot register as admin or moderator.
- [ ] Requested buyer/seller/dealer path is recorded.
- [ ] Email/password login works.
- [ ] Phone OTP request works.
- [ ] Wrong OTP is rejected.
- [ ] Expired OTP is rejected.
- [ ] OTP cannot be reused.
- [ ] Logout works.

### Seller

- [ ] Can create a listing.
- [ ] Listing begins in moderation status.
- [ ] Can upload photos.
- [ ] Cannot edit another seller's listing.
- [ ] Can view own inquiries in the dashboard.
- [ ] Can request a paid boost.

### Staff

- [ ] Admin can access `/admin`.
- [ ] Normal users cannot access staff functions.
- [ ] Moderator can review listings and verification documents.
- [ ] Admin can approve role changes.
- [ ] Admin can review failed or pending payments.

## Common Problems

### “Missing PAYLOAD_SECRET”

Your shell or hosting provider does not have `PAYLOAD_SECRET`. Add it to `.env` locally or the hosting provider's environment settings.

### OTP does not send

Check:

- `AT_USERNAME`
- `AT_API_KEY`
- `AT_ENV`
- Kenyan phone format: `2547XXXXXXXX`
- Africa's Talking sandbox restrictions
- SMS account balance and sender ID approval

### M-Pesa callback does not arrive

Check:

- `NEXT_PUBLIC_SERVER_URL` is a real HTTPS URL
- Daraja has the correct callback URL
- You are using the correct sandbox or production credentials
- The shortcode and passkey belong to the same environment
- The deployed route is reachable publicly

### CRSP dropdown is empty

Check:

1. `crsp.xlsx` is a real workbook, not a tiny placeholder file.
2. Run `npm run seed:crsp`.
3. Confirm the command uses the correct `DATABASE_URI`.
4. Query `/api/crsp-schedule?limit=1`.
5. Search `/api/crsp-schedule?q=Toyota%20Vitz&limit=10`.
6. Refresh the calculator page.

### Build fails after dependency changes

Run:

```powershell
npm install --legacy-peer-deps
npx payload generate:importmap
npm run generate:types
npx tsc --noEmit
npm run build
```

## Final Safety Rules

- Never commit `.env`.
- Never publish API keys or database passwords.
- Never use a production database for casual local testing.
- Never trust a role sent from the browser.
- Never mark a payment successful from the browser alone.
- Never log OTP codes, passwords, tokens, or M-Pesa PINs.
- Keep the CRSP workbook private unless redistribution rights are clear.
- Review the privacy policy and terms with a Kenyan-qualified advocate before launch.
- Keep backups and test restoring one.

For the full technical checklist, see [PRE_GITHUB_LAUNCH_CHECKLIST.md](PRE_GITHUB_LAUNCH_CHECKLIST.md).
