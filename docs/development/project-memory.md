# OVIA — Project memory

Last updated: 2026-09-21. This file records continuity and evidence, not hidden reasoning.

## Request and current scope

The user initially requested six Markdown files for a luxury luggage/bags/accessories website named OVIA. Filenames were normalized to prd.md, architecture.md, rules.md, design.md, task.md and memory.md. They supplied navigation references, candidate image sources and a 24-phase audit brief. The subsequent request authorized code implementation with Next.js/React/TypeScript/CSS, MongoDB, JWT/Auth.js, Stripe/Razorpay, Cloudinary/CDN, Vercel/Atlas, GSAP and Framer Motion. The implementation uses JWT through jose; Auth.js was the alternative, not an additional identity layer.

The brief asks for original identity and fictional catalog data, approximately 50–80 products, responsive commerce, owned data models/APIs and permission-cleared locally saved images. Its revised image direction supersedes the earlier AI-image suggestion. The user favors direct action and focused edits; that does not remove the requirement to verify claims.

## Decisions

| Decision | Status / reason |
|---|---|
| Brand OVIA | User-specified |
| 76 distinct products | Proposed: 26 luggage, 25 bags, 25 accessories; variants counted separately |
| English/India/INR | Working assumption from reference locale; confirm before commerce launch |
| Original brand/copy/catalog | Required by brief; no copied campaigns, contact number or heritage |
| Permission-cleared local images | Required; no permissions yet established for candidate retailers |
| No AI imagery | Current revised brief; use owned neutral placeholders while sourcing |
| TypeScript/Next.js/MongoDB modular monolith | User replaced the initial relational proposal; implemented with the MongoDB driver |
| Sandbox-first checkout | Proposed implementation boundary; merchant/provider choice unresolved |
| Catalog operations through internal scripts | Proposed v1 simplification; no public admin UI |

## Verified activity

- Read the supplied attachment at `C:/Users/Adarsh/.codex/attachments/9e2084ae-7868-4574-8b3d-459bbf9c20de/Pasted text.txt`.
- Initial directory listing in `C:/Users/Adarsh/OneDrive/Pictures/dv` contained no project files.
- Opened [RIMOWA all luggage](https://www.rimowa.com/in/en/all-luggage/) and the [supplied cabin product](https://www.rimowa.com/in/en/luggage/colour/silver/cabin/97353004.html) to inspect reference shopping structure.
- Opened [Bagline](https://www.bagline.com/). It is a candidate source only; asset reuse permission was not established.
- Opened [eBags](https://www.ebags.com/); the tool redirected to [Samsonite Mother Lode](https://shop.samsonite.com/collections/mother-lode/). Do not assume an eBags import will still target a separate store.
- Created the six specifications, then implemented application source, a 76-item fictional catalog, original product illustration assets and a permitted local Unsplash editorial photograph. No remote infrastructure was created or deployed.

## Source navigation preservation

The full supplied menu is translated into the taxonomy in prd.md, including travel types, materials/colors, all bag shapes, lifestyle/customisation/travel accessories, help and editorial. Existing reference campaigns become original OVIA concepts; source stories and the retailer's phone number are not OVIA content. The supplied product page is a product-detail reference, not an item to resell or clone. Not every reference URL was opened or individually verified.

## Documents

- [prd.md](prd.md): scope, taxonomy, routes, acceptance criteria and catalog allocation.
- [architecture.md](architecture.md): proposed stack, entities, API contracts, checkout consistency, media import and operations.
- [design.md](design.md): original identity, tokens, layouts, interactions and visual QA criteria.
- [rules.md](rules.md): engineering constraints, all 24 audit phases and evidence/report format.
- [task.md](task.md): dependencies, completion evidence, critical journeys and launch inputs.
- [memory.md](memory.md): decisions, verified work, unresolved items and continuity.

## Verification status

| Area | Status |
|---|---|
| Brief and initial workspace inspection | VERIFIED |
| Representative reference access | VERIFIED; not exhaustive |
| Architecture and design | Implemented locally; target design and launch model include remaining work |
| Builds and local runtime tests | VERIFIED to the extent recorded in VERIFICATION.md |
| Full security/accessibility/production audit | NOT VERIFIED; targeted local tests do not establish full audit coverage |
| Image reuse licenses and truthful catalog imagery | REQUIRES ATTENTION before import/publication |
| Payment, merchant setup, shipping/tax and support policies | REQUIRES ATTENTION before real commerce |
| Deployment, monitoring and backup restoration | NOT VERIFIED |

## Next action and update policy

Latest verification: 6 domain tests and 7 Chromium/API tests passed; final production build passed; five production-mode routes and catalog API passed smoke checks with zero uncaught browser errors. One-use token recovery, cross-user address isolation and logout revocation were exercised locally. External provider tests remain pending. Full details are in VERIFICATION.md.

The local preview runs at http://localhost:3000 using `npm run dev`. Without MONGODB_URI, development data persists in ignored `.data/store.json`; never use that adapter as durable production storage. See README.md for Atlas, payments, mail and Vercel configuration. Next priorities are external-service validation, approved product imagery, remaining catalog filters/compatibility, and production operations. Never mark tasks complete based on intent. Append actual results and evidence paths as work progresses.


## September 22 additions
- New mega menu: six internal OVIA collection links, with original Studio Artist Case, In Motion, Forma Anthracite and Meridian Stone names.
- Catalog now contains 76 original products; four new concept products. Existing Atlas databases require `npm run seed` to add them.
- Store locator at `/storelocator` uses the user-provided Nalasopara East address, searchable by locality/postcode, and full-address Google Maps directions. No phone or opening hours invented. Map circle is approximate, not an exact storefront pin. Map errors preserve directions and the address.
- Homepage journey tiles, manual story carousel, store banner and five original journal stories. Licensed editorial photography has attribution in assets/provenance/README.md. Gallery banner is explicitly editorial, not an actual OVIA store photograph.
- User selected original OVIA pages rather than external RIMOWA destinations. No AI imagery or protected product photographs imported.

## Customer experience upgrade (2026-09-22)
Implemented account form/security upgrades, support tickets, privacy requests and data export, role-protected staff review, original Our Approach/heritage, expanded legal pages, working cookie preferences, country and estimated currency controls. See CUSTOMER-EXPERIENCE.md for files, security findings, architecture, configuration and limits. User chose international markets with configuration to follow. English only is published; checkout stays India/INR until commercial settings are provided. No fabricated policies, shipping promises, history or legal compliance claims.

Atlas configuration was added to the ignored .env.local using the user-provided database credentials. Database name: ovia. Connection not yet verified: DNS resolves, but Atlas TLS handshake returns alert 80 before authentication. Product/index seeding failed before a usable connection. User was asked to allow the current IP in Atlas Network Access. Credentials are deliberately omitted from documentation. npm run db:check and npm run seed now load .env.local automatically. Do not treat the previous local-adapter test results as Atlas integration evidence.

## Authentication recovery work (2026-09-22)
- Audited existing Next.js/scrypt/MongoDB authentication before edits; see AUTH-INTEGRATION.md for mapping and limitations.
- Added OTP password recovery using the existing tokens collection, password hashing, Resend transport, API family and recovery UI. No separate auth system or users database.
- Existing login/signup design and verification-link behavior preserved pending identification of the purchased template source. The user says template files are in the workspace; searches have not identified a separate MailEditor source folder/ZIP.
- Atlas connectivity now VERIFIED (76 products); added cleanupAt TTL index to existing tokens. Older TLS-failure note above is superseded.
- Unit/API service checks: 18 passed; TypeScript passed. Isolated mocked email tests are not evidence of real mailbox delivery or Atlas account flows.
- EMAIL_API_KEY and EMAIL_FROM were still absent when last checked; no real test recipient was specified. Never infer recipient or expose environment values.
- Latest user clarification expects signup/login OTP activation too; that behavior remains unfinished. Current implementation adds password recovery OTP only.

- Edge browser checks passed: 2 tests, including recovery UI/network behavior (mocked recovery responses) and real local-adapter login/signup/logout/session checks. Full details and limits in AUTH-INTEGRATION.md.
- Final isolated Next.js production build with webpack passed, including TypeScript and static generation. No deployment performed.

## Tannora account design (2026-09-22)
- User supplied https://theme-tannora.myshopify.com/ as the new login/signup visual reference. Inspected public demo using its displayed demo password. Both account routes redirect to one Shopify-hosted sign-in screen.
- Applied its white standalone layout, centered serif branding, narrow form, rounded inputs, purple buttons and minimal privacy footer to existing OVIA account pages. Retained OVIA branding, required password/name/confirmation/terms fields and existing same-origin API handlers. No Shopify scripts, account services or backend connections imported.
- Modified src/app/account/[[...section]]/page.tsx, src/app/globals.css and optional placeholder support in src/components/password-field.tsx. Cleared stale form errors on route changes. Existing OTP recovery is unchanged.
- VERIFIED: desktop 1440px and mobile 390px screenshots, no horizontal overflow, local login/register field mapping and API error rendering using mocked responses, zero external browser requests, npm run typecheck passed. Screenshots: artifacts/ovia-auth-{sign-in,register}-{1440,390}.png. No real account mutations were used for these design checks.
- Corrected a Windows encoding issue discovered in the visual check before final verification. This design update does not establish real OTP delivery or signup OTP activation; prior configuration limitations still apply.

## Screenshot-based account UI (2026-09-23)
- Latest user screenshots supersede the Tannora styling: split luggage image/form for login and signup, black rectangular account buttons, compact labeled inputs and eye visibility controls.
- Used the supplied image's left panel in a local SVG viewport. OVIA copy describes only existing capabilities; no copied warranty/wishlist claims. First/last name fields are combined into the existing name property. No database schema or authentication endpoints changed.
- Forgot-password now uses a bordered assistance card, yellow rounded action, email OTP entry, masked email, resend cooldown and help/change-email control, followed by password reset. It accurately says email; WhatsApp/SMS integrations were not added or implied.
- Updated relevant existing browser test selectors. TypeScript check passed before final browser checks. Real email delivery remains subject to existing configuration; design tests use mocks.
- Final validation: npm run typecheck passed; both isolated Edge browser tests passed (recovery UI/errors/state-only token and actual local registration/login/logout/refresh/protected API behavior). Initial selector and hydration failures were corrected; account form fields now remain disabled until client initialization. Password-eye accessible labels corrected.
- Desktop login/recovery and mobile signup/recovery/OTP screenshots reviewed. Mobile screens had no horizontal overflow; OTP-to-password transition passed with no uncaught browser errors. Screenshots are under artifacts/account-redesign-*.png. Real email delivery was mocked, not verified.

## Bags catalog import from CSVs (2026-09-25)
- Ingested 16 CSV files from `C:\Users\Adarsh\Downloads\bags` corresponding to all bag categories, journey collections, and material filters.
- Replaced/renamed all RIMOWA branding references with OVIA branding.
- Extracted 31 unique bag products in exact scraper order and downloaded 93 authentic colorway images into `public/media/bags/`.
- Integrated `src/lib/bags-collection.ts` with `src/lib/catalog.ts`, mapping products across all 7 bag categories (Backpacks, Duffle Bags, Briefcases, Crossbodies, Totes, Shoulder Bags, Hand Carry), journey tags, and materials (Aluminium, Polycarbonate, Leather, Nylon, Canvas).
- Enhanced `filterProducts` to support multi-category tagging so cross-category bags display in all associated sub-categories.
- Configured `next.config.ts` to allow `www.rimowa.com` in `remotePatterns` and CSP `img-src`.
- Updated product detail component to dynamically switch displayed images when selecting colorway variants.
- Seeded MongoDB Atlas with 83 total products and updated inventory variants (`npm run seed`).
- All 21 tests and TypeScript checks passed.

