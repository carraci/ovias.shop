TASK: FIX ALL OVIA PLAYWRIGHT TEST FAILURES

Project: OVIA Next.js e-commerce website
Current results: 23 passed, 81 failed, 2 skipped/not run.
Playwright: 106 discovered tests in 26 files.

FIRST PRIORITY — FIX THE CONFIRMED ERRORS

1. tests/browser/account-orders-returns.spec.ts:249
   Playwright cannot locate "Orders & Returns" within
   the navigation named "Account navigation".

   Expected href: /account/returns
   Expected heading: Orders & Returns
   Expected aria-current: page

2. tests/browser/account-orders-returns.spec.ts:270
   Playwright cannot locate "Track order" within the
   order article named "Order OVIA-READY".

   Expected href: /account/orders/ready/tracking

REQUIRED ACTIONS

- Inspect the existing account navigation, routes, components and Playwright tests.
- Determine whether the application or tests are outdated.
- Fix broken navigation, missing accessible names, links and rendering.
- Preserve the existing OVIA premium minimalist design.
- Inspect all existing Playwright traces and fix common root causes.
- Check cart, checkout, authentication, orders, refunds, returns, exchanges, admin, support and shipping.
- Do not add fake buttons, mock production features or bypass failing assertions.
- Do not change real Razorpay credentials, production MongoDB or customer records.
- Never execute real payments, refunds or courier bookings during testing.
- Use isolated test data and mocked external services.
- Run TypeScript checks and the production build.
- Run all 106 Playwright tests only after confirming an isolated test environment.
- Repeat fixes until tests pass or report specific unresolved blockers.
- Do not automatically deploy to Vercel or push GitHub.

FINAL OUTPUT

Report:
1. Root causes found.
2. Files modified.
3. TypeScript/build results.
4. Playwright passed/failed/skipped counts.
5. Remaining issues, if any.

START NOW. Inspect the actual source code and implement fixes, not just recommendations.
