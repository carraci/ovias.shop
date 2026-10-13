# OVIA Luxury Travelware & E-Commerce

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?logo=mongodb)](https://www.mongodb.com/)
[![CI Validation](https://github.com/carraci/ovias-shop/actions/workflows/ci.yml/badge.svg)](https://github.com/carraci/ovias-shop/actions)

An enterprise-grade luxury e-commerce platform built with **Next.js App Router, React 19, TypeScript, Vanilla CSS, MongoDB, JWT authentication, Delhivery logistics, Razorpay/PayPal express payments, and real-time Socket.IO customer support**.

---

## 🏛️ Repository Architecture

```
ovias-shop/
├── .github/workflows/          # GitHub Actions CI/CD workflows
├── docs/                       # Structured technical & engineering documentation
│   ├── architecture/           # System design, PRD, CX, and PDP specifications
│   ├── features/               # Real-time support, mailbox & customer care
│   ├── integrations/           # Logistics (Delhivery), Payments (Razorpay), Resend
│   ├── security/               # JWT authentication, social login & security audit
│   ├── testing/                # Verification runbooks & Playwright guides
│   └── development/            # Coding standards, memory & task backlog
├── data/                       # Product catalog CSVs, source extractions & reports
├── public/                     # Static media, custom typography & assets
├── scripts/                    # Database seeds, imports, dev server & tools
│   └── fixtures/               # Test fixtures and scraped HTML schemas
├── src/
│   ├── app/                    # Next.js App Router (Storefront, Admin & API routes)
│   ├── components/             # Reusable UI components & CSS modules
│   ├── lib/                    # Shared domain helpers, models & shipping logic
│   └── server/                 # Node.js backend services, MongoDB, Auth & Payments
├── tests/                      # Automated unit, integration & browser tests
│   └── browser/                # Playwright E2E browser test suites
├── AGENTS.md                   # Agent system rules & conventions
├── package.json                # Project dependencies & npm scripts
└── tsconfig.json               # TypeScript compiler configuration
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js `22.0.0` or newer
- npm `10.0.0` or newer

### Installation

```bash
# Clone the repository
git clone https://github.com/carraci/ovias-shop.git
cd ovias-shop

# Install dependencies deterministically
npm ci

# Configure environment variables
cp .env.example .env.local
```

### Development Server

```bash
npm run dev
```

Launches the storefront at [http://localhost:3000](http://localhost:3000) along with the background real-time support worker.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with real-time support worker |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Starts production server |
| `npm run typecheck` | Validates TypeScript types across the entire project |
| `npm test` | Runs the automated Node.js test suite |
| `npm run test:e2e` | Runs Playwright end-to-end browser tests |
| `npm run seed` | Seeds MongoDB with catalog taxonomy, products & initial inventory |
| `npm run db:check` | Verifies database connectivity and credential sanitization |
| `npm run import-products` | Executes catalog ingestion pipeline |
| `npm run algolia:sync` | Synchronizes catalog index with Algolia Search |
| `npm run support:realtime` | Runs standalone Socket.IO customer support server |

---

## 🔒 Security & Payments

- **Session Security:** Cryptographically signed JWT tokens stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies with revocable server sessions.
- **Payment Providers:**
  - **Razorpay:** Multi-currency checkout, webhook HMAC SHA256 signature verification, and automated refund reconciliation.
  - **PayPal Express:** Capture workflow, currency settlement, and idempotent execution locks.
- **Logistics Integration:** Delhivery Surface & Air Express dispatch with real-time shipment milestone polling.

---

## 📚 Technical Documentation

Complete documentation is organized in the [`docs/`](docs/) directory:

- [Documentation Hub](docs/README.md)
- [System Architecture](docs/architecture/overview.md)
- [Design System & Tokens](docs/architecture/design-system.md)
- [Product Requirements](docs/architecture/product-requirements.md)
- [Authentication & Security](docs/security/auth-integration.md)
- [Testing & Verification Guide](docs/testing/verification-guide.md)

---

## 📄 License & Attribution

Private repository. All rights reserved by **OVIA Luxury Travelware**.
Editorial photography and brand asset provenance documented in [`assets/provenance/README.md`](assets/provenance/README.md).
