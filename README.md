# OVIA

An original luxury travel concept store built with **Next.js, React, TypeScript, CSS, MongoDB, JWT, GSAP and Framer Motion**. Includes 76 fictional products, responsive navigation, searchable/filterable listings, product variants, accounts, cart persistence, demo checkout, Stripe/Razorpay sandbox adapters and local/Cloudinary image delivery.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000 . Without MongoDB configuration, local development uses an ignored `.data/store.json` file. This is a single-process demo adapter, not a production database. Product illustrations are clearly labeled design studies. The editorial photo has attribution in `assets/provenance/README.md`.

## MongoDB Atlas

Copy `.env.example` to `.env.local`, set `MONGODB_URI`, `MONGODB_DB`, `APP_ORIGIN`, and a strong `JWT_SECRET` of at least 32 characters. Use a replica set/Atlas cluster because mutations use transactions. Seed once:

```sh
node --env-file=.env.local --import tsx scripts/seed.ts
```

Seeding creates indexes and inserts only missing products/inventory. It does not overwrite live records. The application uses products, users, sessions, carts, orders, inventory, rate-limit and webhook-event collections. JWTs live in HttpOnly cookies and reference revocable server sessions. Local development generates an ephemeral signing key unless configured; restarting can invalidate those sessions.

## Payments

Default local checkout creates a **demo order** without charging a card or consuming real inventory. For Stripe, select `PAYMENT_PROVIDER=stripe`, supply a test secret and signing secret, and configure the endpoint `/api/webhooks/stripe`. For Razorpay, select `PAYMENT_PROVIDER=razorpay`, supply test credentials and a webhook signing secret, and subscribe `/api/webhooks/razorpay` to `order.paid`.

Only test credentials are accepted. A redirect cannot mark an order paid; signed provider webhooks confirm payment. Quotes use server catalog prices. MongoDB transactions reserve inventory; actual Atlas concurrency validation remains pending. Stripe requests use idempotency keys. Razorpay setup uses a claim to prevent duplicate remote creation; uncertain provider responses require merchant reconciliation before retry. Configure a scheduler to call `/api/cron/expire` with `Authorization: Bearer <CRON_SECRET>` to release expired reservations. Late payments move to `refund_required` for merchant review. Do not enable live commerce until shipping/tax rules, fulfillment, policies, monitoring, reconciliation and real-provider tests are completed. `COMMERCE_ENABLED` is reserved for a future reviewed live-commerce release; it does not bypass the current sandbox restrictions.

## Vercel

Import this directory as a Next.js project. Set the environment variables in Vercel and set `APP_ORIGIN` to the exact deployment origin; configure matching payment webhooks. Use MongoDB Atlas for all writes. Do not enable the local demo file adapter on Vercel: serverless filesystems are not durable. This task supplies deployment-ready project structure, not a published deployment or verified infrastructure.

## Approved imagery

Supply your owned/permission-cleared product images and update catalog records with a local image URL or an approved Cloudinary URL (`imageKind: "photograph"`). `src/lib/media.ts` builds Cloudinary delivery URLs. The importer accepts only approved manifest entries from explicitly allowed HTTPS image hosts:

```sh
npm run assets:import -- assets/provenance/example-manifest.json --dry-run
```

No retailer scraping or AI image generation is included. The importer validates URLs, types, signatures and size; production ingestion still needs full image decoding/dimension limits and derivative generation.

## Checks

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Tests cover catalog/quote validation, password hashing, browser shopping/checkout, accounts, viewport overflow, and API denial cases. See `VERIFICATION.md` for actual results, not just intended coverage.

## Remaining production work

Verification/reset tokens and address-book CRUD are implemented. Configure EMAIL_API_KEY (Resend), EMAIL_FROM and an authenticated scheduler for `/api/cron/mail` to deliver queued account mail. Development outbox records remain in `.data/store.json`; they are never exposed by public APIs. Actual mail delivery remains unverified. Contact messages are stored but not emailed.

Remaining work includes privileged catalog tooling, exact business shipping/tax policies, provider reconciliation, production observability, backup/restore drills, full accessibility/cross-browser audits, decoded-image ingestion limits and approved product photographs. The site is noindex until a reviewed launch. The demo catalog is fictional; this code does not make it a real merchant catalog.


## Customer service and privacy additions
See [CUSTOMER-EXPERIENCE.md](CUSTOMER-EXPERIENCE.md) for route/API coverage, market behavior, security changes and launch configuration. Run `npm run seed` after configuring Atlas to create support/privacy indexes. Staff roles are assigned only by a trusted database administrator; signup never accepts a role grant.

## Local Atlas setup
The local `.env.local` is ignored and contains the configured Atlas URI and database name. Never paste its contents into logs or documentation.

- `npm run db:check` loads the local environment and performs a sanitized connection check.
- `npm run seed` creates indexes and inserts missing catalog/inventory records, preserving existing records.
- A failed TLS handshake occurs before database credential verification. Check Cluster0 availability, the Network Access entry in the same project and outbound/TLS network restrictions. Certificate validation stays enabled.
