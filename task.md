# OVIA — Implementation and verification tasks

Status date: 2026-09-21. Local implementation now exists. The backlog below remains the complete launch plan; implemented portions and verified results are summarized here and in [VERIFICATION.md](VERIFICATION.md). Dependencies refer to task IDs below.

## Current implementation

- [x] Next.js/React/TypeScript/CSS application, locked npm dependencies and production build.
- [x] 76 original demo products, category coverage, variants and local illustrative assets.
- [x] Home, menus, departments/categories, collection edits, filtering, search, product pages and size guide.
- [x] JWT login/registration/logout, one-use verification/reset flows and owner-scoped address management.
- [x] Persistent local demo cart, account cart merge, server pricing, demo checkout and protected order history.
- [x] MongoDB repository/transaction/index code and non-destructive seed script.
- [x] Stripe and Razorpay sandbox adapter code, signed webhook handlers and reservation expiry endpoint.
- [x] GSAP/Framer Motion interactions with reduced-motion handling; local hero photograph provenance and Cloudinary URL support.
- [x] Domain and Chromium/API validation; see the verification report for exact coverage.
- [ ] Verify MongoDB Atlas, sandbox provider callbacks, Cloudinary and email delivery with actual credentials.
- [ ] Complete price/capacity/availability filters, variant-specific approved photography and accessory compatibility matching.
- [ ] Complete full production audit, operational recovery, business policies and commercial launch.

## Documentation

- [x] DOC-01 Read the attached audit brief and inspect the initial workspace.
- [x] DOC-02 Review representative reference pages and identify asset-permission constraints.
- [x] DOC-03 Create prd.md, architecture.md, rules.md, design.md, task.md and memory.md.

## Delivery backlog

| ID | Priority | Dependencies | Work | Completion evidence |
|---|---|---|---|---|
| T01 | P0 | DOC-03 | Select supported package versions, scaffold TypeScript app, configure package manager, lint/types and environment validation | Clean locked install, dev startup, production build |
| T02 | P0 | T01 | Implement schema, constraints, migrations and isolated test database | Migrations succeed on empty/test DB; constraint tests pass |
| T03 | P0 | T02 | Seed 76 original products with variants, specifications, compatibility and category coverage | Deterministic seed; 26/25/25 allocation and all required fields validated |
| T04 | P0 | DOC-03 | Obtain approved asset manifests; implement bounded import and original placeholders | Dry-run, permission rejection, local output and provenance checks; no unapproved files |
| T05 | P0 | T01 | Build tokens, wordmark, accessible primitives, header, footer and mobile navigation | Keyboard and responsive checks; original identity assets |
| T06 | P0 | T02,T03 | Build catalog/search services and API contracts | Filter/sort/page/search/error integration tests |
| T07 | P0 | T04,T05,T06 | Build home, department/category listings, collection pages and search | FR-01–04 journeys pass, URL state and back/forward verified |
| T08 | P0 | T04,T05,T06 | Build product page, gallery, variants, specifications and compatible accessories | FR-05/09, invalid variant and unavailable-stock checks |
| T09 | P0 | T02,T05 | Configure authentication, email adapter, account and address flows | Session/reset tests, ownership tests, accessible forms |
| T10 | P0 | T06,T08,T09 | Implement guest/account carts, persistence and merging | FR-06 including quantity cap, concurrent change and refresh tests |
| T11 | P0 | T02,T10 | Implement quotes, stock reservations, order snapshots and fake payment adapter | Totals/concurrency/idempotency tests with deterministic failures |
| T12 | P0 | T11 | Choose provider; connect sandbox checkout, signature-verified webhooks and reconciliation | Verified success/failure/cancel/duplicate/out-of-order/late-payment cases |
| T13 | P0 | T09,T12 | Build checkout, confirmation, order history and guest order access | Complete sandbox purchase and cross-user denial evidence |
| T14 | P1 | T05 | Write original discovery, journal, size guide and service pages; implement contact outbox | All published links resolve; contact acceptance/delivery failure tested |
| T15 | P0 | T07,T08,T13,T14 | Execute functional/API/database/security audit from rules.md | Traceable findings, fixes and regression results |
| T16 | P0 | T15 | Execute viewport/browser/accessibility/performance/SEO audit | Recorded matrix, screenshots, metrics and remaining gaps |
| T17 | P0 | T01,T02 | Configure CI, secret/dependency checks and isolated staging | Pipeline gates pass; secrets absent from artifacts |
| T18 | P0 | T12,T17 | Configure jobs, monitoring, backups and recovery | Alert delivery, reservation expiry, outbox retry and restore drill evidence |
| T19 | P0 | T13,T14,T16,T18 | Complete business and asset launch inputs | Approved policies, support, licensed accurate catalog assets, tax/shipping/merchant setup |
| T20 | P0 | T19 | Deploy approved production configuration and smoke test | HTTPS, real provider verification within authorized scope, release report and rollback plan |

## Critical verification scenarios

- [ ] Discover a Cabin product through both navigation and search; filter and sort; reload and navigate back without losing state.
- [ ] Select two variants, confirm image/price/SKU consistency and reject nonexistent variant IDs.
- [ ] Add duplicate SKU/configuration, adjust quantity, remove line, reload, sign in and verify cart merge adjustments.
- [ ] Attempt invalid, negative, fractional, excessive and out-of-stock quantities.
- [ ] Race two checkouts for the final stock unit; only the valid reservation succeeds.
- [ ] Tamper with client price, shipping amount and user/order identifiers; server rejects or recomputes safely.
- [ ] Complete sandbox payment; refresh confirmation and replay webhook without another order or inventory deduction.
- [ ] Handle failure, cancellation, provider timeout, expired reservations and late payment reconciliation.
- [ ] Verify User A cannot read or change User B's order/address/cart; verify expired/revoked sessions fail.
- [ ] Test keyboard-only navigation, overlay focus, form errors, screen-reader essentials and reduced motion.
- [ ] Verify all public routes, metadata, assets, missing pages and offline/network-error states.
- [ ] Restore a backup to isolated staging and exercise account/catalog/order read consistency.

## Inputs needed before dependent work

These do not block local scaffolding or a clearly labeled demo: image permissions and accurate product photos; business support details; tax/shipping/returns/warranty decisions; merchant/provider account; production hosting/domain; transactional email credentials; brand clearance; retention and recovery approval. Never substitute a reference retailer's details.

## Done definition

A task is done when its acceptance criteria are met and evidence is linked. Update memory.md with actual outcomes and blockers. A production release is done only after T20 and the complete audit report; documentation, a successful build or sandbox payment alone cannot establish readiness.


- [x] Add New menu and six internal collection destinations.
- [x] Add homepage journey tiles, journal carousel, journal index and five articles.
- [x] Add store banner and searchable Nalasopara locator with directions and approximate map.

- [x] Add account password visibility, confirmation, terms evidence and security controls.
- [x] Add support-ticket conversations, ownership checks and role-protected staff review.
- [x] Add privacy requests, reauthenticated account data export and cookie preferences.
- [x] Add original OVIA Our Approach/heritage, help and structured policy pages.
- [x] Add centralized browse-market configuration and estimated display currencies.
- [ ] Obtain international shipping, tax, payment, language and legal configuration from the user before enabling those capabilities.
- [ ] Configure private attachments, carrier tracking, automated returns/refunds, multilingual content, notification delivery and production operations; these are not represented as active features.
