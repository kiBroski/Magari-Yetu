# Project Tree

Repository-relative file map for Magariyetu. Generated files, dependencies, local secrets, and the CRSP source workbook are excluded.

```text
magariyetu/
|-- .env.example
|-- .gitignore
|-- next.config.mjs
|-- next-env.d.ts
|-- package-lock.json
|-- package.json
|-- PATCH_NOTES.md
|-- payload.config.ts
|-- postcss.config.mjs
|-- README.md
|-- tailwind.config.ts
|-- tsconfig.json
|-- docs/
|   |-- ARCHITECTURE.md
|   |-- PRE_GITHUB_LAUNCH_CHECKLIST.md
|   `-- PROJECT_TREE.md
|-- scripts/
|   `-- seedCrsp.ts
`-- src/
    |-- payload-types.ts
    |-- types/listing.ts
    |-- app/
    |   |-- globals.css
    |   |-- layout.tsx
    |   |-- (frontend)/ [removed]
    |   |-- (payload)/admin/{layout.tsx, importMap.js, [[...segments]]/page.tsx}
    |   |-- (payload)/api/[...slug]/route.ts
    |   |-- (site)/
    |   |   |-- layout.tsx, page.tsx
    |   |   |-- cars/page.tsx and cars/[slug]/page.tsx
    |   |   |-- dealers/[slug]/page.tsx
    |   |   |-- heavy-machinery/page.tsx
    |   |   |-- trucks/page.tsx
    |   |   |-- motorbikes/page.tsx
    |   |   |-- tuktuks/page.tsx
    |   |   |-- login/page.tsx, register/page.tsx, sell/page.tsx
    |   |   |-- pricing/page.tsx, terms/page.tsx, privacy/page.tsx
    |   |   `-- tools/import-duty-calculator/page.tsx
    |   |-- api/
    |   |   |-- auth/otp/{request,verify}/route.ts
    |   |   |-- crsp-schedule/route.ts
    |   |   |-- duty-calculator/route.ts
    |   |   |-- listings/{bulk-upload,inquiry}/route.ts
    |   |   `-- payments/mpesa/{callback,status,stk-push}/route.ts
    |   `-- dashboard/{layout.tsx,page.tsx,billing/page.tsx,listings/page.tsx,listings/new/page.tsx}
    |-- collections/
    |   `-- {CrspSchedule,Dealers,FeaturedOrders,Inquiries,Inspections,Listings,Media,PhoneOtps,Users}.ts
    |-- components/
    |   |-- auth/PhoneOtpLogin.tsx
    |   |-- badges/{FeaturedBadge,InspectedBadge,VerifiedBadge}.tsx
    |   |-- dashboard/BoostButton.tsx
    |   |-- legal/LegalDocument.tsx
    |   |-- listings/{CarCard,ListingsView,SearchFilters,SellWizard,WhatsAppButton}.tsx
    |   |-- site/{Footer,Navbar}.tsx
    |   `-- tools/ImportDutyCalculator.tsx
    `-- lib/{auth,dutyCalculator,email,mpesa,payload,sms}.ts
```

Excluded paths:

- `node_modules/`: installed dependencies
- `.next/`: generated Next.js output
- `.env`: local secrets
- `*.xlsx`: CRSP source data, which should remain outside Git unless redistribution rights are confirmed
