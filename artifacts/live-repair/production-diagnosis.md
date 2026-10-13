# OVIA production diagnosis — 13 October 2026

Target: `carracis-projects/ovias-shop-irem`, project `prj_BUKxg1nIIUPKs9A2QXMy1qZpa5UU`. Active production deployment: `dpl_B8JwRibhA8jnridAxG8oHK7rdFY4`, linked to the user-provided main commit `bb1caa4`. Canonical domain: https://www.ovias.shop/.

## Verified responses

| Check | Result |
|---|---|
| Homepage | HTTP 200 |
| Apex domain | Redirects to www |
| Catalog API | HTTP 200, 249 products |
| Cart read | HTTP 200 |
| Account read while signed out | HTTP 200, user null |
| Invalid cart mutation from www | HTTP 400 validation error; origin accepted |
| Invalid cart mutation from apex | HTTP 403 origin rejected, consistent with canonical www configuration |
| Nonexistent-user login | HTTP 401 incorrect credentials; no email/account created |
| Search API | HTTP 200 |
| Delivery availability, PIN 400001 | HTTP 200, serviceable true |
| Three imported product photos | HTTP 200, valid WebP responses |
| Production Razorpay configuration | ready=false |
| Local Razorpay credentials | Read-only provider request HTTP 200, live mode |
| Confirmed catalog stock | 40 products with positive stock; 209 with zero stock |

No actual charge, refund, courier booking or email was initiated by these diagnostics.

## Prepared repair

1. Set the production `PAYMENT_PROVIDER` to `razorpay` and synchronize production `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` with the validated local configuration. Secret values stay in the environment management channel. Existing production secrets cannot be read back; do not print them or copy sensitive placeholders into production.
2. Release the tested local UI repairs: `store-provider.tsx` applies authentication independently of a slow cart response; `checkout/page.tsx` unwraps the API delivery response and avoids inventing availability on request failure.
3. Keep actual stock quantities as recorded. New inventory must come from owner-confirmed quantities; enabling payments does not turn zero-stock items into sellable items.
4. Verify production `RAZORPAY_WEBHOOK_SECRET` against the merchant's configured webhook before asserting the full payment/refund lifecycle. Presence alone cannot verify a hidden secret.

Current focused browser verification: 11/11 payment/support UI checks passed. Current TypeScript verification passed. Full-suite completeness is not claimed.

## Additional deployment constraints

- The admin upload endpoint writes files into `public/media/uploads`; it needs durable production storage for uploaded media.
- Production has no `SUPPORT_REALTIME_URL`. Live support event delivery and the local worker's background Gmail synchronization need a configured production worker.
- A production release and restoration of live checkout require the user's confirmation because the current request asked to identify what information/actions are needed.

The Vercel connector cannot inspect this linked project, but the locally authenticated Vercel CLI can. All cloud inspection commands used the explicitly verified team/project/deployment.
