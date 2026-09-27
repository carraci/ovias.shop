# OVIA — Engineering and audit rules

These rules adapt the user's attached 24-phase audit brief to OVIA. A local Next.js application now exists. See [task.md](task.md) for work, [memory.md](memory.md) for decisions, and [VERIFICATION.md](VERIFICATION.md) for actual checks. The complete production audit is not yet established by local demo validation.

## Working agreement

1. Inspect existing files and applicable repository instructions before editing. Preserve user changes. For this task, initial workspace inspection found no project files.
2. Make focused changes; do not rewrite working code or redesign established behavior without a technical reason. New files may be complete; updates should use targeted patches where practical.
3. Keep requirements, routes, models and implementation consistent. Record substantive decisions and unresolved constraints in memory.md.
4. Never claim a build, test, payment, deployment, backup or security check passed without evidence. Distinguish proposed targets from measurements.
5. Prefer direct implementation over unnecessary narration, but retain validation and inspection needed for correctness.
6. Do not install or upgrade dependencies blindly. Verify compatibility, record why an upgrade is needed, rebuild and run relevant regressions.
7. Never commit secrets, private certificates, customer data or production environment files. Do not expose them in logs or reports.
8. Test only OVIA systems and authorized environments. Do not attack reference sites, modify production data for tests or scrape around restrictions.

## Brand, catalog and asset rules

Use original OVIA names, copy, catalog and visual identity. Reference navigation may inform information architecture. Do not copy reference retailer contact details, guarantees, editorial stories, reviews or historical claims. Catalog data is fictional until replaced by verified merchant data. Imported imagery needs documented permission, appropriate attribution and truthful product mapping; public accessibility or a user-provided URL is not permission evidence. No AI-generated product images under the current brief.

## Implementation rules

- TypeScript strict mode; validate API input and external responses. Allowlist filters, sorting, redirect targets and mutable fields.
- Money uses integer minor units; calculate prices, discounts, shipping and tax on the server. Never trust browser totals or stock.
- Every resource operation enforces ownership/role server-side. Hiding UI does not provide authorization.
- Use secure password hashing through maintained implementations, revocable sessions, secure HttpOnly cookies, suitable SameSite settings and rate-limited authentication flows.
- Enforce CSRF protection for session mutations, parameterized database queries, safe content rendering, CSP/security headers and exact CORS origins where cross-origin access is needed.
- Do not render untrusted raw HTML. Restrict media import and uploads by source, size, MIME and decoded content. No public upload feature is required for v1.
- Bound request sizes, pagination, retries and timeouts. One request failure must not crash the service.
- Use idempotent checkout, webhook processing, reservation release and background delivery. Preserve immutable order snapshots.
- Respect reduced motion, keyboard navigation, semantics and accessible form errors from the start.
- Keep public catalog caching separate from private customer responses. Avoid logging personal data.

## Audit coverage required before release

| Phase | Required work and evidence |
|---|---|
| 01 Discovery | Map files, stack, routes, APIs, database, auth, assets, environment and third parties before changing existing code. |
| 02 Environment/build | Locked dependency install, development startup and production build; record actual commands/results. |
| 03 Code quality | Run existing lint/type tools; address verified duplication, dead code, unsafe patterns and error handling without unnecessary refactoring. |
| 04 Frontend | Exercise all published routes and interactions, forms, overlays, loading/empty/error states; capture console failures. |
| 05 API/network | Test applicable 200/201/204/400/401/403/404/409/429/500 responses, validation, malformed IDs, expiry, timeout and network failure. Do not force inapplicable codes onto every endpoint. |
| 06 Backend | Inspect services, middleware, async handling, logs, provider timeouts and failure isolation. |
| 07 Database | Verify CRUD, constraints, indexes, migrations, consistency and concurrency against an isolated database. |
| 08 Identity | Register, verify, login, logout, reset, expire sessions and reject cross-user access; audit any privileged tooling. |
| 09 Commerce | Home → listing/search/filter → product → cart → login or guest → checkout → payment → order/history; include stock and failure paths. |
| 10 Security | Inspect secrets, authorization, injection/XSS/CSRF, cookies, headers, rate limits, upload/import boundaries and production debug settings. |
| 11 Dependencies | Scan, triage exploitability and update safely with regression evidence. |
| 12 Responsive | Check every viewport in prd.md for overflow, clipping, menus, forms and overlays. |
| 13 Browsers | Record browser/OS versions and results; explicitly mark unavailable Safari/other coverage. |
| 14 Performance | Measure load, bundles, images, fonts, API/database timings and web vitals; fix verified bottlenecks. |
| 15 Accessibility | Automated checks plus keyboard, focus, screen-reader essentials, contrast and zoom verification. |
| 16 SEO | Titles, descriptions, canonicals, sitemap, robots, structured data, images and broken links; keep staging noindex. |
| 17 Automation | Repeatable domain, API/integration and end-to-end coverage focused on risk and critical journeys. |
| 18 Git | Review status/diff, ignore rules and secret/large-file exposure; preserve unrelated changes. |
| 19 CI/CD | Verify gated install, lint, types, tests, build, security checks and staging smoke tests. |
| 20 Environments | Confirm separation of data, URLs, credentials, CORS, callbacks and debug settings. |
| 21 Recovery | Rehearse backup restoration and migration recovery; record measured recovery objectives. |
| 22 Production | Test actual release configuration, HTTPS, routes, assets, auth, APIs and commerce; development success is insufficient. |
| 23 Monitoring | Verify errors, logs, latency, uptime and payment/job alerts without secret or personal-data leakage. |
| 24 Regression | For each fix reproduce before, apply smallest correction, verify after, test affected behavior and rerun relevant critical journeys. |

## Evidence and bug format

Use VERIFIED, NOT VERIFIED, FAILED or REQUIRES ATTENTION for reported checks. VERIFIED requires a recorded environment, timestamp, command or manual steps, expected/actual result and evidence location. Unsupported claims such as “Everything is fixed” or “production-ready” are prohibited.

```text
BUG:
SEVERITY: CRITICAL | HIGH | MEDIUM | LOW (with technical justification)
LOCATION:
REPRODUCTION STEPS:
EXPECTED RESULT:
ACTUAL RESULT:
ROOT CAUSE:
FIX:
TEST PERFORMED:
RESULT:
REGRESSION STATUS:
ENVIRONMENT / EVIDENCE:
```

The final production report must cover architecture; critical/high/medium/low findings; security; dependencies; performance; accessibility; SEO; responsive behavior; browser compatibility; database; APIs; identity; files modified; changes; automated/manual tests; passed/failed checks; remaining issues; deployment; monitoring; and backup/recovery. Mark unavailable checks explicitly and assign next actions. Do not invent test results to complete the report.
