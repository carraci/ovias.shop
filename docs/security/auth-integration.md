# Authentication integration audit — 2026-09-22

Status: partial implementation; purchased-template integration and real email verification remain pending.

## Existing flow inspected before changes

- Framework: Next.js 16.3.5 App Router, React 19, MongoDB Node driver. This is not the Express/bcrypt stack assumed by the second attachment. Installed Next.js route-handler and cookie documentation was read.
- Login/signup UI: `src/app/account/[[...section]]/page.tsx`, at `/account/sign-in` and `/account/register`. Submit maps name/email/password/confirmPassword/terms to the existing API.
- Browser requests: `src/components/store-provider.tsx` uses relative `/api/v1/` URLs. No seller authentication host was found in the inspected application source.
- API: `src/app/api/v1/[[...path]]/route.ts`; login, register, logout, forgot-password, reset-password, verify-email and resend-verification. Existing origin checks, bounded JSON parsing and database-backed rate limits are reused.
- Database: `src/server/db.ts`; one cached MongoClient, database selected by MONGODB_DB, existing `users`, `sessions`, `tokens`, `limits`, and `outbox` collections. No new user database or connection was introduced. Development has an existing local JSON adapter.
- User fields: `src/lib/types.ts`; passwordHash, email, name, verifiedAt, terms acceptance and passwordChangedAt.
- Passwords: salted scrypt-v2, N=131072/r=8/p=1, with existing legacy password migration. Preserved; no bcrypt migration or extra hashing library.
- Sessions: `src/server/auth.ts`; HS256 JWT with issuer/audience, HttpOnly/SameSite=Lax cookie (Secure in production), hashed session identifier in MongoDB, server-side revocation on logout/reset.
- Email: existing server-side Resend integration using EMAIL_API_KEY and EMAIL_FROM. Verification links were queued in outbox; `/api/cron/mail` requires CRON_SECRET to deliver them.
- Recovery before changes: reset links, not OTPs. The database stored hashed tokens; outbox contained the mail body until delivery.
- External source scan: no Firebase, Supabase, Shopify, MailEditor, Formspree, or seller auth SDK found. Other integrations include commerce providers, exchange rates, maps and optional Cloudinary. These are not purchased-template audit evidence.
- Environment inspected by variable names/presence only. Atlas and JWT settings exist; EMAIL_API_KEY, EMAIL_FROM, CRON_SECRET and an explicitly designated test recipient were absent at the last check. No secrets printed or copied.

## Implemented changes

- Added OTP recovery through existing `/api/v1/auth/forgot-password` and new `/api/v1/auth/verify-otp`; reset-password remains the existing handler and accepts new resetToken/newPassword fields as well as existing token/password links.
- Six-digit cryptographic OTP, scrypt hash, 10-minute expiry, 60-second per-email cooldown for both known and unknown addresses, five attempts, existing API rate limits.
- Existing tokens collection stores one recovery code per email. New requests invalidate prior recovery authorizations. Invalid-attempt updates commit before errors are returned; MongoDB transaction retries preserve atomicity.
- Successful verification consumes the code and creates a 15-minute purpose/audience-restricted JWT backed by a single-use hashed token record. Password reset reuses existing scrypt hashing and revokes existing sessions.
- OTP plaintext is passed to the existing Resend endpoint in memory only; not written to outbox, tokens, URLs, browser storage, API responses or logs.
- Shared mail transport extracted from the existing worker. Missing configuration returns a service error regardless of account existence. Individual delivery failures remove the unusable OTP and preserve the generic response to avoid account enumeration; actual delivery still needs mailbox verification.
- Existing recovery component now transitions email → code → matching new/confirm passwords, shows cooldown/attempt errors, keeps reset authorization in component memory, and redirects to sign-in with a success notice. Refresh during this flow requires requesting another code.
- Added `cleanupAt` BSON Date TTL index on existing tokens; installed successfully in the existing Atlas database. Expiry is enforced explicitly regardless of asynchronous TTL cleanup.
- Login/signup UI, routing, signup verification-link behavior, login/session logic, user schema and password hashing remain unchanged. Signup does not yet require OTP before authentication. The latest requested signup/login OTP journey is NOT verified or complete.

## Template discovery limits

The supplied live MailEditor URLs returned no readable page content to web inspection. The browser automation runtime failed to initialize. Repeated workspace searches found only the existing OVIA account implementation, not an identifiable purchased MailEditor folder/ZIP or separate authentication template. The user says it is present; its exact file location remains unresolved. No design has been reconstructed, and no seller scripts have been imported. A source-level template endpoint/environment/script audit cannot be claimed yet.

## Evidence

- VERIFIED: `npm run db:check` connected to existing Atlas, 76 products. This supersedes the older TLS failure in memory.md.
- VERIFIED: `npm test`: 18 tests passed, including cooldown, unknown email, expiry, five-attempt lockout, atomic replay prevention, JWT tampering/purpose/expiry, reset single use, password change, session revocation, missing mail configuration, provider failure and request validation/rate limiting. Email was mocked and data stored in an isolated temporary directory; this is not mailbox or Atlas authentication evidence.
- VERIFIED: `npm run typecheck` passed after implementation and tests were added.
- VERIFIED: token TTL index creation in the existing database. No account records created or modified in Atlas by tests.
- VERIFIED: `node scripts/test-auth-isolated.mjs` with installed Edge: 2 browser tests passed (49.3s). Recovery UI requests were mocked; verified cooldown, invalid code feedback, matching passwords, state-only reset token, redirect and zero off-origin requests. Registration/login/logout/refresh/duplicate email/protected API checks used the actual application and isolated local storage. Initial missing-Chromium and hydration-timing failures were resolved.
- NOT VERIFIED: purchased template design/network behavior, real OTP receipt, full signup OTP activation, real-account MongoDB writes/password reset, production HTTPS cookies, production build until recorded below.

## Files changed

`src/server/auth.ts`, `src/server/mail.ts`, `src/server/db.ts`, `src/server/recovery.ts`, `src/app/api/v1/[[...path]]/route.ts`, `src/components/recovery-form.tsx`, `tests/recovery.test.ts`, `tests/browser/recovery.spec.ts`, `tests/browser/security.spec.ts`, `scripts/test-auth-isolated.mjs`, this report and `memory.md`.

The isolated browser runner copies source into a disposable OS temporary test fixture, excludes .env.local and production data, and uses the existing dependency installation. It is test infrastructure, not another application/database architecture. The live workspace and Atlas account records are not used for those tests.

## Inputs needed to finish

Identify the exact purchased template entry files or folder within the workspace. Configure EMAIL_API_KEY and EMAIL_FROM privately in .env.local and designate the real test-recipient email address. CRON_SECRET remains needed for the existing verification-link outbox worker. Then audit/integrate the source and verify actual delivery/account activation in the owned environment. Do not infer a test recipient from unrelated account data.

Final build evidence: VERIFIED — `node scripts/test-auth-isolated.mjs --build` completed successfully with Next.js 16.3.5 / webpack in the isolated Windows fixture. Compilation, TypeScript, generation of 18 static pages and build tracing succeeded. This checks buildability, not deployment or real email delivery.
