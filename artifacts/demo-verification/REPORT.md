# OVIA verification — 13 October 2026

50 distinct implemented demo scenarios passed using the actual application and a disposable MongoDB database. Payment, refund and email providers used a local simulation; no real money moved and no customer messages were sent.

The focused Playwright rerun passed 11/11 payment and support browser tests. TypeScript checks passed. Critical regression checks passed 46/46. The wider unit suite passed 277/299; 22 legacy catalog, authentication and administration checks still fail. The original 106-test browser report was not replaced with a fabricated all-green report.

## Fixes verified

- Owner login requires a password; anonymous/default-owner/directOwner bypasses are rejected.
- Demo orders do not become paid; verified payment completion owns confirmation email.
- Refund and payment retries keep the original identity and avoid duplicate effects.
- Free-shipping coupons waive shipping, discount units are consistent, and paid settlement alone consumes coupons.
- Registered-customer coupons require authenticated customer context.
- OTP delivery failures are reported; codes are purpose-specific, expire and invalidate on resend.
- Support inbox secrets, exact recipient matching and connected mailbox identity are enforced.
- Malformed/expired sessions fail closed; owner/support/customer permissions are checked.
- Checkout reads the delivery-availability envelope correctly and does not invent availability on errors.
- Account UI applies authentication independently of slow cart responses.
- Shared browser fixtures match the current support form and harmless background requests.

## Limits and remaining work

Real payment settlement, bank refund credit, external email inbox delivery and live courier bookings were not exercised. Reverse-courier pickup/inspection and automatic replacement shipment are not an implemented complete exchange lifecycle; request forms and existing approval/refund authority were tested. The remaining full-suite failures and outdated account/product/layout browser expectations still need migration and verification against the current design.

## 50 distinct demo checks

| # | Scenario | Result |
|---|---|---|
| 1 | Public catalog loads verified stocked product and its image | PASS |
| 2 | Category filtering excludes unrelated categories | PASS |
| 3 | Guest cart add persists after a fresh HTTP read | PASS |
| 4 | Cart quantity changes use the current version | PASS |
| 5 | Concurrent stale cart updates are rejected | PASS |
| 6 | Invalid cart quantities are rejected without mutation | PASS |
| 7 | An out-of-stock variant cannot be added | PASS |
| 8 | Untrusted origins cannot mutate the cart | PASS |
| 9 | An incorrect password creates no customer session | PASS |
| 10 | Verified customer login and session persist | PASS |
| 11 | Wishlist save is persisted and idempotent | PASS |
| 12 | Wishlist removal persists | PASS |
| 13 | Create a saved address with validated delivery details | PASS |
| 14 | Edit a saved address without losing ownership | PASS |
| 15 | Another account cannot edit the saved address | PASS |
| 16 | Delete a saved address and verify the database removal | PASS |
| 17 | Profile changes save and reload with consent preferences | PASS |
| 18 | Customer roles cannot access admin payments | PASS |
| 19 | Authenticated owner access loads real isolated order data | PASS |
| 20 | Checkout quote is computed from server prices and shipping | PASS |
| 21 | Payment session starts pending and reserves stock exactly once | PASS |
| 22 | Retry payment creation reuses the original provider order | PASS |
| 23 | An invalid gateway signature cannot mark an order paid | PASS |
| 24 | Verified captured payment completes order and clears cart | PASS |
| 25 | Repeated payment callback does not duplicate confirmation email | PASS |
| 26 | Paid order confirmation mail reaches the demo email sink | PASS |
| 27 | Customer order detail opens the exact owned record | PASS |
| 28 | An unrelated guest cannot read the customer's order | PASS |
| 29 | Cancellation request is saved against the paid order | PASS |
| 30 | Manual return status cannot falsely disburse a refund | PASS |
| 31 | A confirmed owner refund reconciles with provider status | PASS |
| 32 | Repeating a refund reuses its identity without extra money movement | PASS |
| 33 | Support conversation and customer response persist | PASS |
| 34 | Account activity uses authorized exact links and chronological events | PASS |
| 35 | Marking activity read persists across reload | PASS |
| 36 | Customer profile and activity render from real isolated account APIs | PASS |
| 37 | Logout invalidates the actual saved session | PASS |
| 38 | Anonymous admin login cannot select a default owner | PASS |
| 39 | Owner email alone cannot obtain an owner session | PASS |
| 40 | directOwner flag cannot bypass an absent password | PASS |
| 41 | directOwner flag cannot bypass a wrong password | PASS |
| 42 | Unauthorized admin product requests cannot read the store catalog | PASS |
| 43 | Verified owner signs in using the actual password endpoint | PASS |
| 44 | Admin creates an active product with actual SKU, price and stock | PASS |
| 45 | Admin product search returns the created stored product | PASS |
| 46 | Owner restocks the new product and inventory history records its reason | PASS |
| 47 | Inventory rejects a decrease beyond available stock without changing its balance | PASS |
| 48 | Inventory rejects fractional adjustments | PASS |
| 49 | Owner creates a stored category with its SEO fields | PASS |
| 50 | Owner edits category details and reads the stored result | PASS |

Evidence: customer-scenarios.json, admin-scenarios.json, 50-scenarios.json, ../focused-browser-report/index.html, ../all-unit-verification.tap and ../final-critical-regressions.tap.
