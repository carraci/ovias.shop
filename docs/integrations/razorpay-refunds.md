# Owner refunds

The owner payments screen supports **Refund → Confirm Refund → Yes, issue refund**.
The backend validates the stored Razorpay payment and captured amount, then calls
`POST /v1/payments/{paymentId}/refund`. Amounts are integer paise. Full refunds use
the remaining balance; partial refunds cannot exceed it. No bank, card or UPI
destination is collected: Razorpay refunds the original payment method.

## Configuration

Set these server environment variables:

```text
PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=<merchant key ID>
RAZORPAY_KEY_SECRET=<merchant API secret>
RAZORPAY_WEBHOOK_SECRET=<separate webhook secret>
MONGODB_URI=<database connection>
APP_ORIGIN=<public store origin>
```

In the Razorpay Dashboard, configure the public HTTPS endpoint
`https://<store-domain>/api/webhooks/razorpay` with the matching webhook secret.
Subscribe to `refund.created`, `refund.processed` and `refund.failed`, alongside
the existing checkout payment events. Configure test and live modes separately.
The local server cannot receive Razorpay delivery without a public endpoint.

Only orders with a verified Razorpay order ID and captured payment ID are eligible.
Legacy sample payments and pending/expired orders cannot be refunded from this UI.
The page displays a setup notice and blocks new refunds when the webhook secret is missing.

## Reliability and status

Refund requests and audit records are saved in a MongoDB transaction before calling
the gateway. The saved UUID is sent as `X-Refund-Idempotency`. Duplicate clicks
reuse that key and body. A different request is blocked while a refund is processing.
A lost response stays **Processing**, with a safe retry using the original request.
Only a definite failure allows a new confirmed attempt.

Webhooks verify the HMAC signature of the raw body before accessing refund records.
Refund/payment IDs, amount and currency must match. Duplicate and delayed events
cannot downgrade a completed refund. The payments page polls every five seconds
while visible, including an open refund status dialog.

## Checks without moving money

```powershell
npm run typecheck
npx tsx --test tests/razorpay-refunds.test.ts
npx playwright test tests/browser/refund-flow.spec.ts
```

The backend tests use a transactional in-memory repository and intercepted gateway
responses. Browser tests bundle the actual payments component and intercept all
payment API calls. They never submit a real Razorpay refund or create customer orders.

## Payment verification and dashboard refunds

Every row offers **View payment**. Orders with a valid Razorpay order ID also
offer **Verify payment**, which fetches captured payments and refund history
from Razorpay. This action never initiates a refund. A missing or mismatched
capture remains ineligible. Legacy UUIDs cannot be substituted for gateway IDs.

Signed refund events also import refunds issued directly from Razorpay. When
the local capture ID is missing, the signed payment must match the stored
Razorpay order, amount and currency before association. Duplicate events do
not create additional refunds. Late captures are marked for refund review;
verification does not trigger fulfilment or change inventory.
