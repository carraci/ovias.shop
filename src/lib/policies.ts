export const TERMS_VERSION = "preview-2026-09-22";
export const policyUpdated = "22 September 2026";
export const policies: Record<
  string,
  { title: string; intro: string; smallNote?: string; sections: [string, string][] }
> = {
  privacy: {
    title: "OVIA — Privacy Policy",
    intro:
      "This Privacy Policy explains how OVIA collects, processes, uses, stores, shares, protects, and manages personal information through its website and related services.",
    smallNote:
      "Last Updated: 12 October 2026 · Website: https://www.ovias.shop · Brand: OVIA · Applicable Region: India",
    sections: [
      [
        "Introduction",
        `Welcome to OVIA.
We value the trust you place in us when browsing our collections, creating an account, purchasing products, or communicating with our customer support team.

This Privacy Policy explains how OVIA collects, processes, uses, stores, shares, protects, and manages personal information through its website and related services.

OVIA is committed to handling personal information responsibly, maintaining transparency, limiting unnecessary data collection, and protecting customer confidentiality.

By using OVIA, you acknowledge this Privacy Policy. Where applicable law requires consent, we will request it separately.`,
      ],
      [
        "1. Information We Collect",
        `### 1.1 Personal Information
Depending on your interactions with OVIA, we may collect:
• Full name
• Email address
• Mobile number
• Billing and shipping addresses
• Postal code, city and state
• Account preferences
• Customer support communications

We collect information for legitimate purposes associated with providing our services.

### 1.2 Account and Authentication Information
When registering or signing into an OVIA account, we may process:
• Registered email address
• Password authentication information
• Email verification codes
• Authentication session identifiers
• Account creation and login timestamps
• Security-related account activity
• Information received through supported Google sign-in

Authentication credentials must be appropriately secured. Verification codes must not be disclosed to unauthorized parties. Passwords should be stored using secure one-way hashing rather than plaintext.

### 1.3 Order and Transaction Information
For purchases, OVIA may collect and maintain:
• Order number and associated customer identifier
• Purchased products and selected variants
• Quantities and prices
• Discounts and applicable taxes
• Order confirmation and payment status
• Shipping and delivery information
• Cancellation and return records
• Exchange requests
• Refund details and status
• Invoice and transaction records

This information is used to administer the customer's purchase and related services.

### 1.4 Product Reviews and Customer Submissions
Where these features are available, OVIA may collect product ratings, reviews, support attachments, return photographs, exchange photographs, and written feedback.

Customers should upload only information relevant to their request and must not submit unnecessary sensitive personal information. Approved public reviews may display the customer's chosen display name and submitted review content.`,
      ],
      [
        "2. Payment Information and Financial Security",
        `OVIA may use Razorpay or other authorized payment providers to facilitate payments. Supported payment options may include UPI, debit cards, credit cards, net banking, and other methods offered during checkout.

OVIA may receive:
• Payment transaction identifier
• Payment status
• Payment method category
• Transaction amount
• Payment confirmation
• Refund reference and status
• Limited transaction metadata

### Payment Security Rules
• Complete card numbers, CVV values, UPI PINs, and banking passwords must not be collected or stored by OVIA's application.
• Customers must enter sensitive payment credentials only through authorized payment interfaces.
• Payment status must be verified using trusted server-side payment confirmation mechanisms.
• An order must not be marked as paid merely because the customer reaches a success page.
• Refunds must be processed through approved payment mechanisms with proper authorization.
• Payment records must be accessible only to authorized personnel for legitimate operational purposes.
• Payment providers may independently process customer information under their own privacy policies.`,
      ],
      [
        "3. How OVIA Uses Customer Information",
        `OVIA processes information for the following purposes:

### Shopping and Orders
• Managing shopping bags and checkout
• Confirming payments and purchases
• Generating invoices
• Maintaining order histories
• Processing applicable discounts
• Coordinating order fulfillment

### Shipping and Delivery
• Verifying delivery information
• Creating shipment requests
• Sharing necessary details with couriers
• Tracking shipment progress
• Managing failed delivery attempts and exceptions

### Customer Support
• Receiving customer inquiries
• Processing complaints
• Handling cancellation requests
• Evaluating return and exchange requests
• Managing eligible refunds
• Maintaining relevant communication records

### Security and Operations
• Detecting suspected fraud
• Preventing unauthorized account access
• Investigating suspicious activities
• Maintaining system reliability
• Troubleshooting technical problems
• Complying with applicable legal requirements

Personal information must not be used for unrelated purposes without an appropriate legal basis.`,
      ],
      [
        "4. Sharing Information With Service Providers",
        `OVIA shares only information reasonably necessary to operate its services.

### 4.1 Delivery and Logistics
When Delhivery or another authorized delivery partner handles an order, relevant information may include:
• Recipient name
• Shipping address
• Contact number
• Package and shipment details
• Delivery instructions
• Order reference

Delivery partners may process this information to fulfill shipments, provide tracking updates, resolve delivery exceptions, and meet their legal obligations.

### 4.2 Payment Providers
Relevant transaction information may be shared with Razorpay or another configured payment service for transaction processing, verification, fraud prevention, and refunds.

### 4.3 Hosting and Technical Infrastructure
OVIA may use third-party providers for website hosting, databases, cloud storage, authentication, email delivery, search, analytics, and security. Depending on the configuration, these may include Vercel, MongoDB Atlas, Resend, Algolia, and other providers. These providers may process information necessary to provide their respective services.

### 4.4 Restrictions on Information Sharing
OVIA's operational policy is to:
• Never sell customer personal information.
• Never provide customer passwords or OTPs to marketing partners.
• Never grant unrestricted access to customer records for unrelated purposes.
• Limit access to business-authorized systems and personnel.
• Disclose information in response to valid legal obligations when required.`,
      ],
      [
        "5. Customer Account Security",
        `Customer accounts must be protected with appropriate authentication and session-management controls.

Security protections should include:
• Secure password hashing
• Verification-code expiry
• One-time verification-code use
• Limits on verification attempts
• Resend controls and abuse prevention
• Secure authentication cookies
• Session invalidation when appropriate
• Authorization checks for protected pages
• Restricted administrative access

### Customer Responsibilities
• Customers must maintain the confidentiality of passwords, verification codes, and account access.
• Customers must promptly report suspected unauthorized access.
• OVIA support representatives must never ask customers to disclose passwords, UPI PINs, card security codes, or active login OTPs.`,
      ],
      [
        "6. Customer Communications",
        `OVIA may communicate with customers through registered email addresses, website notifications, account dashboards, and other enabled support channels.

### 6.1 Transactional Communications
These may include:
• Account verification
• Login and security notifications
• Order confirmation
• Payment confirmation or failure
• Invoice availability
• Shipment creation
• Tracking updates
• Delivery status changes
• Cancellation updates
• Return and exchange decisions
• Refund initiation and completion
• Important service notices

Transactional communications may be necessary to deliver the services requested by customers.

### 6.2 Promotional Communications
• Marketing messages must be sent only where permitted by law and in accordance with applicable consent requirements.
• Customers must be provided an appropriate way to opt out of promotional communications.
• Opting out of promotional messages will not necessarily stop essential order-related or security communications.

### 6.3 Communication Conduct
All OVIA customer communications must follow professional standards:
• Messages must be respectful, accurate, and relevant.
• Communications must not contain misleading payment or shipping claims.
• Customers must not be asked for confidential authentication credentials.
• Order and refund references must be verified before disclosing account-specific information.
• Sensitive personal information must not be unnecessarily included in messages.
• Staff must not threaten, harass, or discriminate against customers.
• Customers must be given an appropriate way to raise unresolved complaints.

OVIA may retain relevant communications for legitimate support, dispute resolution, and security purposes.`,
      ],
      [
        "7. Order, Cancellation, Return, Exchange and Refund Information",
        `### 7.1 Order Processing
Customer and transaction information may be processed from checkout through order confirmation, packing, dispatch, delivery, and post-delivery support.

### 7.2 Cancellations
Where permitted by OVIA's published cancellation policy and applicable law, customers may request cancellation. OVIA may record cancellation reasons, timestamps, request status, and associated refund information.

### 7.3 Returns and Exchanges
Customers may be asked for information reasonably necessary to evaluate a request, including:
• Order number
• Product details
• Reason for return or exchange
• Relevant photographs
• Requested resolution
• Pickup address, where applicable

Photographs and attachments must be used for legitimate verification and support purposes.

### 7.4 Refunds
OVIA may process and store refund transaction references, approval statuses, payment-provider responses, and related communications.

Refund approval, processing, and settlement are separate stages. A refund must not be described as completed until confirmation has been received from the appropriate payment or financial system. Actual eligibility and timelines are governed by OVIA's published policies, applicable law, and payment-provider processes.`,
      ],
      [
        "8. Administrative Access and Confidentiality",
        `OVIA's administrative systems may contain confidential customer and business information. Administrative access must be limited to properly authenticated and authorized personnel.

Security rules include:
• Customer account data must not be publicly exposed.
• Admin privileges must be enforced on the server, not merely hidden in the interface.
• Unauthorized users must not view order addresses, payment details, or support records.
• Administrative actions involving sensitive information should be logged.
• Payment credentials, API secrets, and database passwords must not be exposed in frontend code.
• Personal information must not be exported for unrelated use.
• Access must be revoked when no longer required.
• Sensitive operations should require appropriate authorization and verification.

OVIA must investigate suspected misuse of administrative access and take appropriate corrective measures.`,
      ],
      [
        "9. Cookies and Tracking Technologies",
        `OVIA may use cookies or similar mechanisms to support:
• Login sessions
• Shopping bag functionality
• Checkout continuity
• Website security
• Customer preferences
• Performance measurement
• Search and product discovery
• Analytics and permitted marketing

Essential cookies may be required for core website features. Where legally required, non-essential cookies must not be activated before valid consent.

Customers may manage available cookie preferences through website controls or browser settings. Disabling certain cookies may affect website functionality.`,
      ],
      [
        "10. Data Security Measures",
        `OVIA aims to apply safeguards appropriate to the type and sensitivity of information processed.

Such safeguards may include:
• HTTPS encryption for transmitted information
• Secured database access
• Restricted infrastructure permissions
• Protection of application secrets
• Server-side authorization
• Secure session management
• Input validation
• Monitoring of suspicious activities
• Software security updates
• Backup protection
• Incident investigation procedures

No online system can guarantee complete protection against every security risk. Security arrangements must be reviewed as OVIA's infrastructure and services evolve.`,
      ],
      [
        "11. Data Retention",
        `OVIA retains personal information only as long as reasonably necessary for disclosed business purposes and applicable legal obligations.

Retention needs may differ for:
• Customer accounts
• Order and payment records
• Invoices and tax records
• Shipment information
• Returns and refunds
• Customer support requests
• Authentication and security logs
• Marketing preferences

Information that is no longer required should be securely deleted or anonymized where appropriate. Certain transaction information may be retained where necessary for legal compliance, financial records, fraud prevention, or dispute resolution. Backup copies may remain temporarily until their applicable retention and deletion cycles are completed.`,
      ],
      [
        "12. Customer Privacy Rights",
        `Depending on applicable law, customers may be entitled to:
• Request information about their personal data
• Access eligible personal information
• Request correction of inaccurate details
• Request deletion of eligible information
• Withdraw consent where applicable
• Raise privacy-related grievances
• Exercise other rights available under applicable law

Requests may require reasonable identity verification to prevent unauthorized disclosure. Some information cannot immediately be deleted where retention is required under applicable law. OVIA must respond to valid privacy requests according to applicable legal requirements.`,
      ],
      [
        "13. Children's Privacy",
        `OVIA does not knowingly process children's personal information in violation of applicable law. Where age-based consent or other protections are required, OVIA must implement the necessary safeguards.

Parents or legal guardians may contact OVIA regarding concerns about a child's personal information.`,
      ],
      [
        "14. Security Incidents and Data Breaches",
        `When OVIA becomes aware of a suspected personal data breach, the matter must be assessed promptly.

The response process should include:
• Identifying and containing the incident.
• Restricting further unauthorized access.
• Assessing affected systems and information.
• Preserving necessary evidence.
• Investigating the cause.
• Taking appropriate corrective measures.
• Informing affected individuals and authorities where required by law.
• Reviewing security controls to reduce recurrence.

Notifications must not knowingly misrepresent the scope or seriousness of an incident.`,
      ],
      [
        "15. Legal Compliance in India",
        `OVIA will seek to handle personal information in accordance with the laws of India applicable to its activities. Relevant legal frameworks may include the Digital Personal Data Protection Act, 2023, the Digital Personal Data Protection Rules, 2025, and applicable consumer protection requirements, subject to their respective commencement provisions and applicability.

Where consent is required, OVIA must provide appropriate notices and obtain valid consent. Where applicable law requires a grievance redressal mechanism, OVIA must provide an accessible method for submitting and resolving grievances.

Nothing in this Privacy Policy limits mandatory rights available to consumers under applicable law.`,
      ],
      [
        "16. International Data Processing",
        `Some technology service providers may operate infrastructure outside India. Where OVIA uses such services, personal information may be processed in other jurisdictions to the extent reasonably necessary.

Any international processing or transfer must comply with applicable legal restrictions and safeguards.`,
      ],
      [
        "17. Third-Party Websites and Services",
        `OVIA may provide links to payment interfaces, courier tracking pages, or other third-party services. These services may maintain independent privacy policies and security practices.

Customers should review the applicable privacy information when interacting directly with a third-party service.`,
      ],
      [
        "18. Changes to This Policy",
        `OVIA may update this Privacy Policy to reflect operational changes, new services, security improvements, or legal requirements.

The most recent version will be published on the website with an updated revision date. Where applicable law requires additional notice or consent, OVIA will follow those requirements.`,
      ],
      [
        "19. Contact, Privacy Requests and Grievances",
        `Customers may contact OVIA for:
• Personal information inquiries
• Account privacy concerns
• Requests for correction or deletion
• Unauthorized account activity
• Payment-related privacy concerns
• Order information concerns
• Support complaints
• Privacy-related grievances

### Official Contact Information
• **Business Name:** OVIA
• **Website:** [https://www.ovias.shop](https://www.ovias.shop)
• **Privacy Email:** privacy@ovias.shop
• **Customer Support:** support@ovias.shop
• **Business Address:** OVIA Retail, Mumbai, Maharashtra, India
• **Grievance Officer:** Designated Grievance Officer
• **Grievance Contact:** grievance@ovias.shop

OVIA will acknowledge and resolve grievances within the timelines required by applicable law.`,
      ],
      [
        "Our Commitment to Customers",
        `OVIA believes that privacy, transparency, responsible communication, and security are essential to a trustworthy shopping experience.

We aim to protect customer information, respect applicable privacy rights, maintain appropriate security safeguards, and communicate clearly throughout the customer journey.

**OVIA — Crafted for the Journey.**`,
      ],
    ],
  },
  terms: {
    title: "Clear terms. A considered experience.",
    intro: "Preview terms · " + TERMS_VERSION,
    sections: [
      [
        "About this collection",
        "OVIA is a fictional commerce demonstration. Products, specifications, stock and prices are illustrative. Demo orders create sample records; no goods are shipped.",
      ],
      [
        "Your account",
        "Provide only test information in this preview. Keep credentials private and report unexpected account activity. Registration records the displayed terms version and acceptance time. Optional marketing consent is not required or collected.",
      ],
      [
        "Products and pricing",
        "Product images are original design illustrations. Converted currency values are approximate display estimates; checkout and stored orders use INR. Final amounts are recalculated by the server.",
      ],
      [
        "Orders and payments",
        "Demo checkout does not charge you. Connected Stripe and Razorpay flows accept sandbox credentials only. Never submit real card information to this test environment. An order record does not promise physical fulfillment.",
      ],
      [
        "Shipping, returns and refunds",
        "Commercial destinations, charges, return windows, warranty periods and refund rules have not been approved. Support requests do not automatically authorize a return or issue a refund.",
      ],
      [
        "Responsible use",
        "Do not misuse accounts, interfere with availability, attempt unauthorized access or submit sensitive credentials in support messages. You remain responsible for the content you submit.",
      ],
      [
        "Creative work and third parties",
        "OVIA branding and product concepts are original to this project. Licensed editorial images retain their attribution. External services and linked websites operate under their own terms.",
      ],
      [
        "Before commercial launch",
        "Legal business identity, governing jurisdiction, dispute process, consumer rights, warranty, liability terms, retention and an effective publication date require configuration and professional review. No unsupported compliance or limitation-of-liability claim is made here.",
      ],
    ],
  },
  security: {
    title: "OVIA — Data Protection & Security",
    intro:
      "This page explains the technical, organizational, and operational standards OVIA maintains to safeguard customer accounts, transactions, and personal information across our website and services.",
    smallNote:
      "Effective Date: 12 October 2026 · Website: https://www.ovias.shop · Brand: OVIA · Jurisdiction: India",
    sections: [
      [
        "Our Commitment to Your Security",
        `At OVIA, protecting your personal information is a fundamental part of providing a trustworthy shopping experience.

We are committed to responsible data handling, confidentiality, secure transactions, appropriate access controls, and transparency about how customer information is protected.

This page explains the standards we aim to maintain when processing information relating to customer accounts, orders, payments, shipping, returns, refunds, and customer communications.

Our security practices must be supported by appropriate technical and organizational safeguards. No digital service can guarantee absolute protection from every security risk.`,
      ],
      [
        "01. Collection and Protection of Customer Data",
        `OVIA collects and processes personal information only for specified, lawful business purposes and in accordance with its Privacy Policy.

Depending on the services used, such information may include:
• Customer names and contact information
• Billing and delivery addresses
• Account and authentication information
• Order history and transaction references
• Shipping and tracking information
• Return, exchange, cancellation and refund records
• Support requests, messages and relevant attachments
• Technical and security information

**Our Standard:** We seek to minimize unnecessary personal information, restrict its use to legitimate purposes, and protect it against unauthorized disclosure, alteration, misuse, or loss.

Information must not be collected solely because it may be useful for an unspecified future purpose.`,
      ],
      [
        "02. Secure Account Authentication",
        `OVIA supports customer authentication through available account access methods, which may include password-based sign-in, email verification codes, and supported third-party sign-in.

Authentication systems are designed to help prevent unauthorized account access.

### Our Security Requirements Include:
• Appropriate protection of passwords
• Time-limited verification codes
• Restrictions on repeated verification attempts
• Secure session handling
• Access controls for protected account information
• Mechanisms for account recovery and security-related support

Customers must keep their passwords and verification codes confidential.

OVIA representatives will never request your password, UPI PIN, complete payment card security information, or active authentication code through ordinary support messages.

If you suspect unauthorized account activity, contact OVIA through its verified support channel.`,
      ],
      [
        "03. Payment and Transaction Protection",
        `Payments on OVIA may be facilitated by Razorpay or another authorized payment service provider.

Depending on the available payment options, customers may complete transactions through UPI, cards, net banking, or supported alternatives.

### OVIA's Application Must Not Request or Store:
• UPI PINs
• Card verification values (CVV/CVC)
• Internet banking passwords
• Complete payment card credentials
• Confidential payment authentication codes

Sensitive payment information entered into an authorized provider's payment interface is handled according to that provider's applicable security standards and privacy policy.

OVIA may retain limited payment-related information such as transaction references, payment status, amounts, payment method categories and refund records.

A transaction should be treated as paid only after appropriate verification through trusted payment systems.`,
      ],
      [
        "04. Customer Order and Delivery Information",
        `When you place an order, OVIA processes the information needed to confirm the purchase, prepare the shipment, coordinate delivery and provide customer support.

Relevant details may be shared with Delhivery or another authorized logistics provider, including:
• Recipient name
• Delivery address
• Contact telephone number
• Shipment contents or descriptions where necessary
• Package information
• Tracking and shipment references
• Relevant delivery instructions

This sharing is limited to legitimate delivery and fulfillment requirements.

Courier partners may independently process necessary shipment information in accordance with their own applicable policies and legal obligations.`,
      ],
      [
        "05. Returns, Exchanges and Refund Security",
        `For eligible after-sales requests, OVIA may process order references, return reasons, delivery information, product photographs, transaction details and relevant support communications.

We seek to limit this processing to the information necessary to assess and resolve the request.

When photographs or supporting files are required, customers should avoid including unrelated personal information, identity documents, banking credentials, or confidential details.

Refund decisions and statuses must be based on authorized order and payment records.

OVIA will not request a customer's UPI PIN or card security code to issue an eligible refund.`,
      ],
      [
        "06. Data Access and Confidentiality",
        `Customer information must be accessible only to authorized persons or service providers with a legitimate need.

Access to customer data should be proportionate to the responsibilities being performed.

### OVIA's Internal Data-Handling Rules Prohibit:
• Unauthorized viewing of customer records
• Disclosure of personal information for unrelated purposes
• Sharing account credentials with unauthorized persons
• Improper downloading or exporting of customer databases
• Use of customer information for personal purposes
• Unauthorized modification of orders or transaction records
• Disclosure of confidential information through public systems

Appropriate monitoring and access reviews should support these restrictions.`,
      ],
      [
        "07. Administrative System Security",
        `OVIA operates administrative functions for managing products, customers, orders, payments, inventory, fulfillment, returns, and support.

These systems require stronger access controls because they may process confidential customer and business information.

Administrative access must be limited to properly authorized individuals.

Administrative systems should use secure authentication, server-enforced permissions, protected credentials and appropriate security logging.

An administrative page being hidden from public navigation does not itself establish adequate security. Customer records must not become accessible merely through knowledge of an administrative URL.`,
      ],
      [
        "08. Website and Infrastructure Protection",
        `OVIA aims to maintain appropriate technical measures to reduce the risk of unauthorized access and system compromise.

Such measures may include:
• HTTPS/TLS protection for information in transit
• Secure database connections
• Restricted infrastructure permissions
• Server-side input validation
• Appropriate session and cookie protections
• Protection of API keys and application secrets
• Software updates and vulnerability remediation
• Security logging and monitoring
• Protected backups and recovery procedures

Security safeguards may evolve as OVIA introduces additional technologies or services.`,
      ],
      [
        "09. Cookies and Session Security",
        `OVIA may use necessary cookies to maintain customer sessions, support shopping functionality, remember permitted preferences, and protect account access.

Authentication cookies should be configured using appropriate security attributes and session-management practices.

Non-essential analytics or advertising technologies must be managed in accordance with applicable consent requirements.

For further information, please refer to OVIA's Cookie Policy and Cookie Preferences.`,
      ],
      [
        "10. Third-Party Service Providers",
        `OVIA relies on service providers for certain operational functions.

These may include payment processing, delivery services, cloud infrastructure, database hosting, email delivery, search and website performance.

We seek to work with service providers that offer safeguards appropriate to their role and the information they process.

Where required, contractual arrangements must address confidentiality, data protection responsibilities, security safeguards and incident cooperation.

Providing information to a service provider does not eliminate OVIA's applicable legal responsibilities.`,
      ],
      [
        "11. Retention and Secure Deletion",
        `OVIA retains information for legitimate business purposes and applicable legal obligations.

Different information categories may require different retention periods, including:
• Customer account records
• Payment and invoice records
• Order history
• Shipping information
• Return and refund records
• Customer support communications
• Technical and security logs

When information is no longer necessary and no applicable retention obligation requires its preservation, OVIA should delete or anonymize it using appropriate procedures.

Deletion requests may not result in the immediate removal of records that must be preserved for accounting, fraud prevention, legal compliance or dispute resolution.`,
      ],
      [
        "12. Your Data Protection Rights",
        `Customers may have rights under applicable law concerning their personal information.

These may include rights to:
• Request information about personal data processing
• Request correction of inaccurate information
• Request eligible erasure of personal data
• Withdraw consent where applicable
• Raise privacy-related grievances
• Exercise other rights provided by applicable law

Certain requests may require identity verification before processing. Request procedures, eligibility and applicable timelines are governed by relevant legal requirements.

OVIA will not intentionally disclose another customer's information in response to an unverified request.`,
      ],
      [
        "13. Security Incident and Data Breach Response",
        `OVIA treats suspected unauthorized access, disclosure, alteration, loss or misuse of personal information as a security concern.

When a potential incident is identified, appropriate steps may include:
• Investigating the reported incident.
• Restricting unauthorized access.
• Preserving relevant evidence.
• Assessing affected information and systems.
• Taking steps to contain and remediate the incident.
• Identifying measures to reduce the risk of recurrence.
• Providing notifications to affected individuals or authorities when legally required.

OVIA must not knowingly provide misleading information about a confirmed security incident. Notifications will be made according to the laws and obligations applicable at the time of the incident.`,
      ],
      [
        "14. Customer Responsibilities",
        `Customers can help protect their own accounts by:
• Using strong, unique passwords
• Keeping verification codes private
• Avoiding suspicious payment or login links
• Signing out on shared devices
• Checking the website address before entering sensitive information
• Reporting suspicious account activity promptly
• Avoiding unnecessary sensitive attachments in support requests

Customers should contact OVIA directly through verified website channels when uncertain about the authenticity of a communication.`,
      ],
      [
        "15. Prohibited Activities",
        `The following activities are prohibited when using OVIA's services without authorization:
• Attempting to access another customer's account
• Obtaining or disclosing another person's confidential information
• Circumventing authentication or access controls
• Interfering with website security or availability
• Attempting payment or refund fraud
• Uploading malicious files or code
• Misusing customer support features to harass or impersonate others

OVIA may take proportionate measures to restrict abusive activity, investigate incidents and comply with applicable law.

Nothing in this section is intended to prohibit lawful activities or invalidate mandatory consumer rights.`,
      ],
      [
        "16. Legal and Regulatory Obligations",
        `OVIA intends to comply with Indian data protection, cybersecurity and consumer protection requirements applicable to its activities.

These may include obligations arising under the Information Technology Act, 2000, applicable CERT-In directions, the Digital Personal Data Protection Act, 2023, and the Digital Personal Data Protection Rules, 2025, according to their respective applicability and commencement provisions.

OVIA will review its policies and safeguards when relevant legal requirements or operational arrangements change.`,
      ],
      [
        "17. Reporting a Security Concern",
        `Customers can report suspected account compromise, phishing, unauthorized disclosure, suspicious payment requests or other security-related concerns through OVIA's official support channels.

### Official Security & Grievance Contacts
• **Website:** [https://www.ovias.shop](https://www.ovias.shop)
• **Security & Privacy Contact:** privacy@ovias.shop
• **Customer Support:** support@ovias.shop
• **Grievance Contact:** grievance@ovias.shop

Please include a description of the issue and relevant order reference, where appropriate.
Do not include passwords, active OTPs, UPI PINs, card CVVs or other confidential payment credentials.`,
      ],
      [
        "18. Changes to This Policy",
        `OVIA may update this policy to reflect changes in its systems, services, security practices, or legal obligations.

The revised policy and updated effective date will be published on the website.

Where applicable law requires additional notice or consent, OVIA will follow those requirements.`,
      ],
      [
        "Our Promise",
        `Your trust is important to OVIA.

We aim to handle customer information carefully, limit unnecessary collection, maintain appropriate safeguards, and communicate transparently about privacy and security.

**OVIA — Privacy, Security & Trust.**`,
      ],
    ],
  },
  accessibility: {
    title: "An open experience.",
    intro: "Accessibility features and ongoing work.",
    sections: [
      [
        "Navigation and forms",
        "The interface includes a skip link, keyboard-operable navigation, visible focus styles, explicit form labels and status announcements. FAQ uses native expandable disclosures.",
      ],
      [
        "Motion and reflow",
        "Animations respect reduced-motion settings. New service forms and legal content are designed to reflow on narrow screens. Images have descriptive alternative text or are decorative.",
      ],
      [
        "Limitations and feedback",
        "Screen-reader, browser zoom and assistive-technology verification is ongoing. This is not a WCAG conformance certification. Report barriers through support under Technical problem.",
      ],
    ],
  },
  cookies: {
    title: "Your cookie choices.",
    intro: "Essential storage and optional preferences.",
    sections: [
      [
        "Essential cookies",
        "ovia_session authenticates a session for up to seven days; ovia_cart identifies a guest bag for up to thirty days. They are HttpOnly and Secure in production. These are necessary for requested account and shopping functions.",
      ],
      [
        "Preference storage",
        "If enabled, ovia_preferences remembers your chosen country and display currency for 180 days. Your cookie choice is stored locally with a version and timestamp. Disabling preferences clears the saved preference cookie.",
      ],
      [
        "Analytics and advertising",
        "No optional analytics or advertising tools are installed. They remain unavailable in the controls. Any future integration must check the appropriate consent before loading.",
      ],
      [
        "Third-party services",
        "The store map loads OpenStreetMap tiles. Payments and external directions may open their respective providers. No precise location is requested merely to select a country.",
      ],
    ],
  },
};
