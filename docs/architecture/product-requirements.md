# OVIA — Product requirements

Status: specification with local implementation in progress. Updated: 2026-09-21. The user's selected stack is Next.js/React/TypeScript/CSS, Node REST APIs, MongoDB, JWT, Stripe/Razorpay, Cloudinary/CDN, Vercel/Atlas, GSAP and Framer Motion. See [README](README.md) and [verification](VERIFICATION.md) for implemented behavior and remaining launch work.

## Purpose and scope

Build an original luxury travel commerce experience for OVIA, serving luggage, bags, and accessories. Use the supplied premium retail references to understand shopping needs, not to reproduce another brand's identity, copy, catalog, photography, campaigns, or product designs. Initial deliverable is this six-document specification set; building and publishing the application are subsequent work.

Related documents: [architecture](architecture.md), [design](design.md), [rules](rules.md), [tasks](task.md), [memory](memory.md).

## Product decisions

- Initial locale: English, India; currency: INR. This is a working assumption based on the supplied India links.
- Catalog: 76 original fictional products, excluding color/size variants from the product count.
- Brand: OVIA. Positioning: considered travel essentials. Proposed voice: calm, precise, warm.
- Images: locally stored, permission-cleared photographs or original non-AI placeholders. Do not use AI-generated imagery under the user's revised direction.
- Real checkout remains disabled until merchant, payment, tax, fulfillment, inventory, and policy configuration are approved and verified. Development uses clearly labeled sandbox transactions.
- No invented heritage, reviews, certifications, scarcity, sales figures, lifetime guarantees, or support contact details.

## Customers and journeys

1. Frequent traveler: browse Cabin, filter material and dimensions, compare specifications, select a variant, purchase.
2. Holiday traveler: use Long haul or Short trips, inspect capacity and weight, add coordinating accessories.
3. Professional: browse business bags, filter laptop compatibility, inspect carrying options.
4. Returning customer: sign in, view their orders and addresses, find product care and support.

## Information architecture

Top navigation: Luggage, Bags, Accessories, Services, Discover. Utilities: Search, Account, Cart. Every visible link must resolve to implemented content or be omitted until available; no dead or placeholder hash links.

| Section | Group | OVIA destinations |
|---|---|---|
| Luggage | Categories | Trunk, Check-In, Cabin, Signature pieces, All luggage |
| Luggage | Travel type | Long haul, Short trips, Business selection |
| Luggage | Favorites | Polycarbonate, Aluminium, Leather; Silver, Black, Blue |
| Luggage | Highlights | Made for the journey, Personalise, Gifts, Collection size guide |
| Bags | Categories | Backpacks, Duffle Bags, Briefcases, Crossbodies, Totes, Shoulder Bags, Hand Carry, All bags |
| Bags | Favorites | Business bags, Travel bags, Leather, Nylon, Aluminium |
| Bags | Highlights | In motion, Everyday mobility, Bag straps, Gifts, Signature pieces |
| Accessories | Lifestyle | Phone cases, Hats, Sunglasses, Belts, Card holders, All lifestyle |
| Accessories | Personalisation | Address tags, Wheels, Stickers, Bag straps, All personalisation |
| Accessories | Travel | Organisers, Pet carrier bag, Foldable bags, Garment bags, All travel accessories |
| Accessories | Highlights | Personalise, Everyday mobility, Care products |
| Services | Help | FAQ, Shipping & delivery, Returns, Lock instructions, Contact |
| Discover | Editorial | In motion campaign, Our approach, Journal and three original launch stories |

Scope material filters to the current department; a Bags/Leather destination must never silently show all luggage. Shared destinations such as Gifts and Bag straps have one canonical route. Reference campaign names and historical claims are replaced with original OVIA content.

## Route contract

| Route | Purpose |
|---|---|
| `/` | Hero, category entry points, selected products, editorial, service links |
| `/luggage`, `/bags`, `/accessories` | Department listings |
| `/luggage/[category]`, `/bags/[category]`, `/accessories/[category]` | Allowlisted category listings |
| `/collections/[slug]` | Travel edits, materials, colors, gifts, signature pieces, everyday mobility |
| `/products/[slug]` | Canonical product page; variant selected through `?variant=SKU` |
| `/search?q=` | Search with filters and shareable URL state |
| `/cart`, `/checkout`, `/orders/[id]/confirmation` | Purchase flow; confirmation access requires ownership or a scoped guest token |
| `/account/sign-in`, `/account/register`, `/account/forgot-password`, `/account/reset-password` | Authentication |
| `/account`, `/account/orders`, `/account/orders/[id]`, `/account/addresses` | Protected customer pages |
| `/services/[slug]` | FAQ, shipping, returns, locks, contact |
| `/discover`, `/discover/[slug]`, `/journal/[slug]` | Original editorial |
| `/personalise`, `/size-guide` | Compatible accessory selection and dimension comparison |
| `/privacy`, `/terms`, `/accessibility` | Approved policy and accessibility content |

## Functional acceptance criteria

| ID | Requirement and acceptance |
|---|---|
| FR-01 | Desktop menus support pointer, keyboard and Escape; mobile navigation supports nested disclosure, focus restoration and scrolling. |
| FR-02 | Listing exposes category, material, color, price, capacity and availability where relevant. Filters combine, clear individually/all, persist in URL and survive back/forward navigation. |
| FR-03 | Sort supports featured, price ascending/descending and newest. Pagination has stable ordering, item counts and accessible controls. Default page size 24. |
| FR-04 | Search covers original names, collections and descriptions; debounce requests, cancel stale requests, encode inputs and show loading/no-result/error states. |
| FR-05 | Product page shows gallery, description, INR price, variants, availability, dimensions, weight, capacity, materials, care and approved delivery/returns information. Invalid variants cannot be purchased. |
| FR-06 | Cart adds a specific SKU, combines identical SKU/configuration lines, validates quantity, removes items and persists across refresh. Server recalculates all totals and stock. |
| FR-07 | Guest and signed-in sandbox checkout validate addresses, show shipping/tax/total before payment, handle cancellation/failure/retry and create at most one paid order per successful payment. |
| FR-08 | Register, verify email, sign in, sign out and reset password. Order/address APIs enforce ownership; sign-out invalidates the session. |
| FR-09 | Personalisation initially selects compatible tags, wheels or straps as separate cart SKUs. No engraving, live 3D configurator or unsupported product modifications. |
| FR-10 | Contact validates fields and displays success only after durable acceptance. Support email/phone remain unset until supplied; never use the reference retailer's number. |
| FR-11 | All customer pages include usable loading, empty, validation, network-error and missing-content states as applicable. |
| FR-12 | Editorial, policies and size guide are original. Cabin compatibility includes actual dimensions and a reminder to check the chosen airline rather than a universal fit claim. |

## Catalog allocation and content contract

| Department | Product allocation | Total |
|---|---|---:|
| Luggage | Cabin 10; Check-In 8; Trunk 6 | 24 |
| Bags | Backpacks 4; Duffles 4; Briefcases 3; Crossbodies 4; Totes 4; Shoulder bags 3; Hand Carry 2 | 24 |
| Accessories | Phone cases 3; Hats 2; Sunglasses 2; Belts 1; Card holders 2; Address tags 2; Wheels 2; Stickers 2; Bag straps 2; Organisers 2; Pet carrier 1; Foldable bag 1; Garment bag 1; Care kit 1 | 24 |

Each product needs a unique ID/slug, original name and description, department/category, collection, material, travel tags, variants/SKUs, integer price in paise, currency, stock, applicable specifications, compatibility, image references, alt text, publication state and timestamps. Seed values are fictional demo data, never copied supplier claims. Suggested original collection names: Meridian, Interval, Forma and Passage, subject to brand clearance before commercial use.

## Quality and release criteria

- Accessibility target: WCAG 2.2 AA; verify keyboard, screen-reader essentials, contrast, zoom and reduced motion. Automated checks alone do not establish conformance.
- Responsive matrix: 320, 375, 390, 414, 768, 1024, 1280, 1440 and 1920 px; no horizontal overflow or clipped primary controls.
- Browsers: current stable Chrome, Edge, Firefox and Safari. Record versions and actual test coverage; WebKit automation does not replace real Safari verification.
- Performance targets: field p75 LCP <=2.5 s, INP <=200 ms, CLS <=0.1 when sufficient field data exists. Before release, record repeatable lab results and their limitations.
- Initial operational targets: catalog/search API p95 <500 ms under 20 concurrent read users against the 76-product fixture; record environment and test duration. These are targets, not measured results.
- No unresolved critical/high security or purchase-flow defects; no exposed credentials; successful production build and critical end-to-end tests.
- SEO: unique metadata, canonical product URLs, sitemap, robots rules, accurate product structured data and social previews. Staging and demo stores are noindex.
- Production requires verified payments, approved policy/support content, licensed imagery, monitoring, backup restoration and deployment smoke tests.

## Deferred scope

Multi-currency, international fulfillment, loyalty, reviews, wishlist, repair booking, subscriptions, complex promotions, live carrier integrations, visual CMS/admin UI and 3D customisation. Initial catalog operations use validated internal scripts with restricted credentials.

## Reference provenance

User-supplied category links define the requested taxonomy. Representative pages were inspected on 2026-09-21, not every supplied URL.

- [RIMOWA luggage](https://www.rimowa.com/in/en/all-luggage/) and [product reference](https://www.rimowa.com/in/en/luggage/colour/silver/cabin/97353004.html): shopping structure only.
- [Bagline](https://www.bagline.com/): candidate source proposed by user; no asset reuse permission established.
- [eBags](https://www.ebags.com/): redirected during inspection to [Samsonite Mother Lode](https://shop.samsonite.com/collections/mother-lode/); no asset reuse permission established.

No product data or images were downloaded. An accessible page is not an asset license. See the import contract in architecture.md.


## Additional requirements delivered, 2026-09-22
Account confirmation/terms acceptance, account-security controls, owned support conversations, safe export and privacy request intake, FAQ/help search, original brand-story chapters, legal/cookie pages and regional display preferences are implemented. International commercial checkout, multilingual publication and policy values remain disabled pending the user's configuration. See CUSTOMER-EXPERIENCE.md for the detailed launch gaps.
