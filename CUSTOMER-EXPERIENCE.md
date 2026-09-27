# OVIA customer experience upgrade — 22 September 2026

Implemented in the existing Next.js application; no rebuild or framework replacement.

## Customer-facing routes
- `/account/sign-in`, `/account/register`: show/hide password, strength guidance, matching confirmation and required versioned terms acceptance.
- `/account/security`: email verification status/resend and password-confirmed session revocation across devices.
- `/help`, `/faq`: categorized searchable native disclosure FAQs and direct question links.
- `/contact`: authenticated support requests, owned-order selection, idempotent creation/replies, private conversation history.
- `/shipping`, `/returns`, `/track-order`: accurate preview policies and real stored order status. Return/refund enquiries link to support; no fabricated tracking or refund execution.
- `/discover`, `/heritage`: original OVIA story, with chapter navigation and licensed photography. No invented manufacturing history or copied brand assets.
- `/legal`, `/privacy`, `/terms`, `/security`, `/cookies`, `/cookie-preferences`, `/accessibility`: readable policies, tables of contents and working preference controls.
- `/privacy/request`: password-confirmed data export and reviewable correction/deletion/access requests. Exports are generated on authenticated POST, no-store, without public download URLs or secrets.
- `/preferences`: remembered or session-only country/currency preferences. Nine configured browsing countries: IN, US, GB, FR, DE, JP, AE, CA, AU. English is the only published language. Additional translations await configuration and review; no fake language switcher.
- `/admin/support`: database-role-protected ticket reply/status and privacy request status management. Support role cannot read or update privacy requests. Staff status changes are audited. No user can self-assign staff roles through signup.

## Data and APIs
New collections: `tickets`, `privacyRequests`, `audit`; unique ID indexes plus user lookup indexes. Run `npm run seed` against the configured Atlas database to create indexes. Signup records termsVersion/termsAcceptedAt. Password reset records passwordChangedAt. Existing hashes remain compatible and are upgraded after successful login.

`/api/v1/care/*`: tickets, reply, privacy, export, security, revoke-sessions and admin endpoints. `/api/v1/preferences`: validated HttpOnly preference cookie. `/api/v1/rates`: cached dated Frankfurter reference rates. All private responses use no-store. Writes require exact origin and account ownership; request bodies have a 16KB streamed byte limit. Rate policies separate ticket creation and account actions.

## Markets and money
Central configuration: `src/lib/markets.ts`. Product cards, product details and bag use approximate converted display prices. Checkout and historical orders stay authoritative INR. Server rejects non-IN market checkout and non-IN shipping addresses. Market changes preserve the bag and explain checkout restrictions. Reference rates are fetched server-side, cached for one hour and rejected when older than seven days; provider failure falls back explicitly to original INR. JPY uses its zero-decimal formatting. Rates are never accepted from the customer for payment calculation.

## Security findings and remediation
| Severity | Finding | Remediation / status |
| --- | --- | --- |
| Medium | Previous default scrypt work factor was below the current OWASP recommended profile | New versioned hashes use N=131072,r=8,p=1,128MiB; legacy hashes migrate on successful login. Existing password verification remains compatible. |
| Medium | Nonexistent accounts skipped password hashing, creating an obvious timing discrepancy | Dummy hash verification added for missing accounts; not a claim of perfect constant response time. |
| Medium | Signup lacked password confirmation and terms evidence | Both required server-side; version/time stored. Duplicate-key failures have safe responses. |
| Medium | Login did not revoke the browser's previous session | Previous cookie-backed session revoked before issuing a fresh one. |
| Medium | Request size was checked only after reading the body | Streamed byte cap now stops oversized bodies. |
| Low | Privacy and service pages lacked usable account controls | Ownership-checked support, privacy requests, exports and session controls implemented. |
| Low | FAQ deep links did not expand a closed answer | Matching disclosure opens on hash navigation. |

Existing protections retained: signed JWT algorithm/issuer/audience checks, HttpOnly/Secure production cookies, server-side revocable sessions, hashed single-use expiring verification/reset tokens, strict origin checks, validated primitive MongoDB queries, safe React text rendering, independent order/address ownership checks, payment-provider webhook verification and server-side pricing. Scrypt is retained rather than adding a new native hashing dependency. Source guidance: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html . Currency API: https://frankfurter.dev/ .

## Business and operational configuration still required
The user selected India plus international markets and will supply configuration. Pending: legal operator name, registered address, support contact, approved policy dates/retention rules, shipping zones and rates, taxes, returns eligibility/window, refund operations, language translations, international payment currencies and provider agreements. No country is advertised as commercially served.

Atlas, JWT secret, Resend, Stripe/Razorpay sandbox settings continue to use existing `.env.example` names. Production account writes require Atlas; external-service credentials were not supplied or exercised. Grant staff roles through a controlled database migration; never expose a public role-grant endpoint. No staff accounts were created or elevated by this task.

Not enabled: private object-storage attachments, automated return/refund processing, live carrier tracking, market/translation/policy publishing dashboards, complete multilingual content or RTL, external notification delivery without credentials, automated deletion/retention jobs. These are explicitly disclosed rather than simulated. Privacy request status is an operational record, not proof that deletion occurred. Staff must perform and verify the action before completion.

Residual risks: synchronous password hashing needs load/capacity testing; seven-day sessions lack MFA; signup duplicate responses can still reveal probable existing registration; pending email outbox messages contain delivery links and require restricted database access and retention; CSP retains inline-script allowances required by the existing app; rate limiting trusts only Vercel’s platform IP header in deployment. Full accessibility, legal and penetration audits are not claimed. FAQ content is currently version-controlled rather than editable in an admin CMS. Large support histories are bounded in responses but repository queries need database pagination before scale.
