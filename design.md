# OVIA — Design specification

Status: original direction implemented in the local storefront. Desktop/mobile captures are in `artifacts/`; actual test coverage is recorded in [VERIFICATION.md](VERIFICATION.md). Requirements live in [prd.md](prd.md); implementation boundaries live in [architecture.md](architecture.md).

## Identity

OVIA is a fictional contemporary travel brand. Proposed line: “Space for the journey.” Use an original typographic OVIA wordmark with generous spacing and a simple open-circle motif, created as an owned vector asset during implementation. Do not copy another luggage brand's logo, signature surface patterns, campaigns or page composition. Brand-name and collection-name clearance remains a commercial launch dependency.

Voice: specific, restrained and useful. Prefer “38 L capacity” over unsubstantiated superlatives. Use original editorial subjects: Packing for a slower weekend, Objects in motion, and A considered carry. Never invent a founding year, partnership or customer testimonial.

## Visual tokens

| Token | Value | Use |
|---|---|---|
| Canvas | `#F7F4EE` | Warm page background |
| Surface | `#FFFFFF` | Forms and elevated surfaces |
| Ink | `#202820` | Main text, primary controls |
| Muted | `#596159` | Supporting text; verify contrast in context |
| Forest | `#334B3E` | Brand accents and selected controls |
| Sand | `#D9C8AD` | Decorative panels; not small text |
| Border | `#D6D8D1` | Quiet decorative separators; strengthen for input boundaries |
| Error | `#A62B2B` | Error text with icon and explanatory copy |

Typography: an appropriately licensed editorial serif for headings and a neutral sans serif for body/navigation. Initial candidates: locally hosted Source Serif 4 and Inter, with retained licenses and verified download provenance. System fallbacks remain usable if fonts fail. Body 16–18 px, line height 1.5; headings use responsive clamps rather than fixed oversized text. Avoid all-caps paragraphs.

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96 px. Maximum content width 1440 px; gutters 16 px mobile, 24 px tablet, 48 px desktop. Corners 2–6 px; restrained shadows for overlays. Motion 120–220 ms for state changes; respect reduced motion and avoid scroll hijacking.

## Page composition

### Header and navigation

Place the wordmark at left, department navigation centrally and utilities at right. Use a single clean header; a service announcement appears only when its claim is approved. Desktop mega menus organize category, material/use-case and editorial links. Hover may supplement click but must not be required. Escape closes menus; focus returns to the trigger. Mobile uses an accessible drawer with labeled nested disclosures and an always-visible close control.

### Home

Lead with a warm editorial hero, original travel imagery or a neutral composition, concise heading and “Explore luggage” CTA. Follow with three department cards, four selected products, a material story, travel edits and service links. Avoid autoplay video, rotating promotional carousels and fictional trust badges. Footer groups shopping, help, brand and approved policies.

### Product listing and search

Show breadcrumbs, heading, short original description and count. Desktop uses an inline filter bar or sidebar; mobile uses a filter sheet with Apply and Clear. Active filters remain visible as removable chips. Grids: two columns on ordinary phones, three on tablets and four on wide screens; collapse to one if content becomes cramped at narrow widths or zoom. Product cards use consistent 4:5 imagery, name, collection, price and labeled swatches. Do not require hover to reveal essential information.

### Product detail

Desktop: image gallery at left and purchase panel at right. Mobile: gallery followed immediately by name, price, variants and CTA. Include a zoomable gallery, selected variant label, availability, quantity, Add to cart, and specifications/care/delivery disclosures. Image zoom traps focus while open and restores it on close. A mobile sticky purchase control must not cover content or the on-screen keyboard. Failed add-to-cart retains the selected variant and provides retry feedback.

### Cart and checkout

Cart presents thumbnail, full variant, quantity, unit price and line total. Removing a line announces the result; empty cart links to shopping. Show a server-derived summary and distinguish estimated totals from final checkout totals. Checkout uses a readable address form, shipping choice, review and hosted payment handoff. Preserve safe form values after validation errors. Payment cancellation offers retry without duplicate orders. Sandbox labeling is persistent and unambiguous.

### Account and services

Account uses simple overview, orders and addresses navigation; show order status with text, not color alone. Forms have explicit labels, password-manager-compatible fields and specific field errors. FAQ uses semantic disclosures. Lock instructions must match OVIA's eventual hardware; do not present copied reference instructions as verified guidance. Contact information appears only when the business supplies it.

## Interaction and accessibility contract

- Aim for 44 × 44 px touch areas and visible focus indicators; meet the agreed accessibility target in actual testing.
- Use semantic landmarks, logical headings, skip navigation and meaningful link names.
- Swatches include color names and selected state; unavailable options explain why.
- Associate errors with inputs and focus the error summary after failed submission.
- Announce cart count changes and result updates politely; avoid excessive live announcements.
- Overlay focus is contained, background is inert, Escape closes where appropriate, and focus is restored.
- Preserve functionality at 200% zoom and test reflow at 400%; never disable browser zoom.
- Decorative imagery has empty alt text; product image alt describes item, color and view without keyword stuffing.
- Skeletons reserve final image/layout dimensions. Errors have contextual retry controls. Empty states explain a useful next action.

## Image direction

Use consistent studio angles, warm neutral backgrounds and believable variant matching. Editorial images may emphasize quiet travel moments. All downloaded media must pass the provenance/import contract. Placeholder silhouettes should be original simple SVG/CSS shapes labeled as illustrative where needed; never imply they are photos of real stock. Product images need primary and detail views where approved media exists; do not fabricate alternate angles by falsely relabeling the same image.

## Design acceptance

Review home, listing, product, cart, checkout and account at the widths in prd.md, including long names, long prices, no images, empty results, failed requests and out-of-stock items. Record screenshots, keyboard checks and contrast measurements. These checks have not yet been performed. Asset licensing, business policies and actual product specifications remain launch dependencies.

Homepage additions use tall collection illustration tiles, a manually controlled horizontal editorial rail, and a full-width licensed editorial interior image for the locator banner. New navigation has a Latest link column and two promotional cards on desktop; mobile retains all six destinations in a scrollable menu. Motion respects reduced-motion preferences.
