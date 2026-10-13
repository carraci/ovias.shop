# OVIA Documentation Hub

Welcome to the technical and operational documentation for the **OVIA Luxury E-Commerce Platform**.

---

## 📁 Documentation Map

### 1. 🏗️ [Architecture](architecture/)
- [Overview & System Architecture](architecture/overview.md) — Comprehensive Next.js App Router, Node backend services, and MongoDB schema architecture.
- [Design System & Typography](architecture/design-system.md) — Brand guidelines, responsive layout tokens, color palette, and micro-interactions.
- [Product Requirements (PRD)](architecture/product-requirements.md) — Core functional requirements, catalog taxonomy, and platform features.
- [Customer Experience (CX)](architecture/customer-experience.md) — End-to-end shopping journeys, order tracking, and account center flows.
- [Product Detail Page Specs](architecture/product-detail-specs.md) — High-fidelity PDP technical design, gallery layout, and media roles.

### 2. 🔒 [Security & Authentication](security/)
- [Auth Integration Architecture](security/auth-integration.md) — Cookie-based JWT sessions, password policies, and security headers.
- [Security Implementation Requirements](security/security-implementation.md) — Penetration testing criteria, rate limiting, and role-based access.
- [Social Sign-In Setup](security/social-sign-in-setup.md) — Google OAuth 2.0 configuration, scopes, and callback flows.

### 3. 🔌 [Third-Party Integrations](integrations/)
- [Delhivery Logistics Integration](integrations/live-logistics.md) — Surface/Air express fulfillment, AWB generation, and tracking webhooks.
- [Razorpay Payments & Refunds](integrations/razorpay-refunds.md) — Orders API, signature verification, and automated refund settlement.
- [Resend Email & DNS Setup](integrations/resend-dns-setup.md) — DKIM, SPF, domain verification, and transactional notification templates.

### 4. 💬 [Features & Customer Care](features/)
- [Full Support System](features/full-support-system.md) — Real-time Socket.IO support desk, customer chat widget, and admin inbox.
- [Support Email Mailbox](features/support-email-inbox.md) — Inbound ticket parsing, attachment handling, and draft responses.

### 5. 🧪 [Testing & Quality Assurance](testing/)
- [Verification Guide & Runbooks](testing/verification-guide.md) — Unit, integration, and E2E regression test protocols.
- [Playwright Troubleshooting](testing/playwright-troubleshooting.md) — Headless browser setup, mobile emulation, and CI fixes.
- [Performance & Core Web Vitals Audit](testing/performance-audit.md) — 90+ Lighthouse benchmarks, LCP tuning, and asset optimization.

### 6. 🛠️ [Engineering & Development](development/)
- [Coding Standards & Rules](development/coding-standards.md) — Architectural principles, Next.js conventions, and PR guidelines.
- [Project Memory & Decisions](development/project-memory.md) — Chronological architectural decisions and verified bug fixes.
- [Task Backlog](development/task-backlog.md) — Historical development logs and milestone tracking.
