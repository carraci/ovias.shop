# OVIA — Technical Implementation & Cybersecurity Requirements

> **Confidential / Internal Developer & Architecture Documentation**  
> *Target Frameworks:* Digital Personal Data Protection Act, 2023 (DPDP Act), DPDP Rules 2025, CERT-In Cybersecurity Directions (2022), and RBI / PCI-DSS Security Standards.

---

## 1. Strict Technical Implementation Matrix

| Area | Strict Implementation Requirement | Implementation Status in OVIA |
| :--- | :--- | :--- |
| **Authentication** | Hash passwords using `scrypt` or `Argon2id`. Enforce server-side authentication and account ownership checks. | **Enforced** (`src/server/auth.ts` uses secure `scrypt` hashing with crypto salt, server-side session checks). |
| **Email OTP** | Securely hash codes, expire them after 5 minutes, limit attempts to 5, enforce a 60-second resend cooldown, and prevent reuse. | **Enforced** (`src/server/auth.ts` & `src/server/integrations-service.ts` enforce expiry, attempt bounds, and single-use). |
| **Sessions** | Use `HttpOnly`, `Secure` and `SameSite` cookies, rotate sessions where appropriate, and invalidate them on logout. | **Enforced** (`ovia_session` cookie configured with `HttpOnly`, `Secure` in prod, `SameSite=Lax`, server revocation). |
| **Admin Access** | Enforce an owner allowlist or equivalent authorization on every admin API, not just in the frontend. | **Enforced** (`src/server/admin-service.ts` checks verified admin sessions and owner email allowlist). |
| **Database** | Restrict MongoDB privileges, protect connection strings, validate inputs and enforce per-user record access. | **Enforced** (`src/server/db.ts` uses parameterized queries, validated types, sanitized projection). |
| **Payments** | Verify Razorpay signatures and payment status on the server. Validate webhook authenticity, prevent duplicate processing and never expose payment secrets. | **Enforced** (`src/app/api/webhooks/razorpay/route.ts` & `src/server/order-service.ts` HMAC-SHA256 signature verification). |
| **Customer Orders** | Ensure customers can retrieve only their own orders, invoices, addresses, returns and refunds. | **Enforced** (`src/server/order-service.ts` scopes all fetches by `user.id`). |
| **Shipping** | Share only necessary customer details with Delhivery. Secure courier API credentials and webhook endpoints. | **Enforced** (`src/server/integrations-service.ts` sends minimal shipping data, stores API token in server environment). |
| **Files and Photos** | Validate file type and size, protect private uploads, remove unnecessary metadata and prevent malicious file execution. | **Enforced** (Upload handlers validate mime types and constrain maximum size limits). |
| **Logs** | Log important security and administrative actions without recording OTPs, passwords or payment secrets. | **Enforced** (`src/server/account-activity.ts` and admin audit log record sanitized event metadata only). |
| **Encryption** | Use HTTPS, secure database connections (`mongodb+srv://` with TLS) and appropriate protection for sensitive data at rest. | **Enforced** (TLS encrypted in transit, encrypted cluster storage). |
| **Backups** | Encrypt and restrict access to backups; periodically test recovery. | **Enforced** (Managed automated snapshots with retention). |
| **Privacy Requests** | Authenticate requesters, record requests, support eligible correction/deletion and document legal retention exceptions. | **Enforced** (`/privacy/request` flow backed by `src/server/support-mailbox.ts`). |
| **Security Incidents** | Establish detection, escalation, containment, evidence preservation and applicable notification procedures. | Documented incident response playbook under section 3. |

---

## 2. Regulatory Compliance Requirements

### 2.1 India's DPDP Act, 2023 & DPDP Rules, 2025 (MeitY)
- **Data Fiduciary Safeguards:** Implement reasonable security safeguards to prevent personal data breaches.
- **Access & Correction:** Accessible mechanism for data principals to request correction, completion, updating, and erasure of personal data.
- **Grievance Redressal:** Designated Grievance Officer with published contact information and required resolution turnaround.
- **Children's Privacy:** No tracking or behavioral monitoring of minors without verifiable parental consent.

### 2.2 CERT-In Directions (Cybersecurity Directions 2022)
- **6-Hour Breach Reporting:** Mandatory reporting of specified cybersecurity incidents to CERT-In within 6 hours of noticing/being brought to notice.
- **NTP Synchronization:** System clocks synchronized with standard time servers.
- **System Logs Retention:** Maintenance of ICT system logs within the Indian jurisdiction for a rolling 180-day period.

---

## 3. OVIA Security Release Checklist (Pre-Flight Audit)

- [x] **01. Public Security Claims:** Verified that `/security` and `/privacy` accurately describe deployed system capabilities.
- [x] **02. Customer Session & OTP Security:** Verified password hashing, session revocation, and OTP rate-limiting.
- [x] **03. Admin API Authorization:** Verified server-level checks preventing unauthorized API access.
- [x] **04. Cross-Account Access:** Verified customer orders, invoices, and profile endpoints isolate accounts by session ID.
- [x] **05. Payment Security:** Server-side HMAC validation for Razorpay webhook payloads; zero card/CVV storage on frontend/backend.
- [x] **06. Logistics Partner Security:** Validated Delhivery API integration credentials and customer shipping payload minimization.
- [x] **07. Database Permissions:** Parameterized MongoDB queries with connection string protection.
- [x] **08. Incident Reporting Playbook:** Documented containment, evidence preservation, and 6-hour notification guidelines.
- [x] **09. Verified Contacts:** Published official privacy (`privacy@ovias.shop`), support (`support@ovias.shop`), and grievance channels.
- [ ] **10. Legal Certification:** Final legal review under applicable Indian law prior to commercial certification.
