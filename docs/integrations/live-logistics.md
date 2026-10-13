# Live shipping and cancellation

Shipping & Logistics reads MongoDB orders directly. Counts, customers, amounts,
AWBs and delivery dates are never seeded into this dashboard. Legacy shipments
without courier verification remain **Unverified shipment**. Demo records cannot
create live shipments, refunds or inventory changes.

## Owner workflow

Select **Approve & Ship**, enter the actual packed weight in grams and dimensions
in centimetres, then **Confirm & Ship**. The server verifies the captured,
unrefunded Razorpay payment and prepaid postcode serviceability. It saves an
operation before sending any courier mutation. Courier-confirmed shipment data
is saved with `fulfillmentStatus: READY_TO_SHIP`; a confirmed pickup request is
saved separately as `shipping.status: PICKUP_SCHEDULED`. Scheduling never claims
physical pickup. Real courier scans subsequently advance tracking.

Select **Cancel Order**, then **Confirm Cancel & Refund**. The courier must
confirm cancellation before stock is restored or the order is marked cancelled.
Stock restoration and `status: cancelled` / `fulfillmentStatus: CANCELLED` are
saved atomically, with an `inventoryReleased` guard. Eligible Razorpay payments
are refunded through the existing idempotent refund service, to their original
payment method. Refund status remains independently Processing, Refunded or Failed.
Cancellation can be confirmed while a refund is still Processing; the UI never
labels that refund completed. Missing gateway capture IDs require reconciliation.

Packages already picked up require a return/RTO flow. Their inventory is not
restored into sellable stock merely because someone requests cancellation.
Delhivery B2C pickup requests cover a warehouse and can include other packages.
Order cancellation withdraws the shipment from pickup; it does **not** claim that
the whole warehouse pickup request was cancelled. No undocumented pickup-cancel
endpoint is called.

## Required live configuration

- `MONGODB_URI` and `MONGODB_DB`
- `APP_ORIGIN` matching the deployed HTTPS shop URL
- `DELHIVERY_ENV=production`
- `DELHIVERY_API_TOKEN` for the same Delhivery account as the shipment
- `DELHIVERY_PICKUP_LOCATION`: exact registered warehouse name, not a sample address
- `DELHIVERY_WEBHOOK_SECRET`: a strong server-only shared secret
- Existing Razorpay keys and `RAZORPAY_WEBHOOK_SECRET`
- Working customer mail configuration and the authenticated existing mail outbox cron

Register `https://www.ovias.shop/api/webhooks/delhivery` with Delhivery's Scan Push
integration. Configure its HTTP header as `Authorization: Bearer <secret>`, with
the same secret stored as `DELHIVERY_WEBHOOK_SECRET` on the deployed server.
The receiver also supports an actual HMAC-SHA256 `x-delhivery-signature` over the
raw body if your sender is configured to generate that signature. Unsigned
requests and missing authentication configuration are rejected. This is a
separate secret from the outbound courier API token.

Keep Razorpay refund.created, refund.processed and refund.failed events enabled
at the existing Razorpay webhook endpoint. Customer mail is queued durably inside
the relevant transaction; the dashboard distinguishes Queued from Sent. Failed
delivery remains queued for the mail outbox retry job.

Local changes do not deploy themselves or register the courier webhook.
Shipment approval remains blocked when required configuration is absent.

## Recovery and tracking

Ambiguous creation or pickup responses remain Processing. Courier writes are not
blindly replayed. **Details → Check courier status** queries the exact stored order
reference to recover an existing AWB. A recovered creation can resume pickup;
an unconfirmed pickup request needs courier reconciliation before another request.
Definitive pickup rejection permits retrying pickup without recreating the shipment.
Concurrent approval and cancellation operations are locked against each other.

Authenticated scans require the exact verified AWB, valid timestamps and recognised
status. Duplicate, stale and regressive events cannot overwrite later progress;
Delivered, Cancelled and Returned are terminal. Return-direction delivery scans
map to Returned, never customer Delivered. NDR and RTO remain distinct. Both
customer and owner pages refresh saved states every five seconds while visible.
Payment confirmation no longer automatically creates shipments before owner approval.

## Verification without moving money

```powershell
npm run typecheck
npx tsx --test tests/logistics.test.ts tests/razorpay-refunds.test.ts tests/order-tracking.test.ts
npx playwright test tests/browser/logistics-flow.spec.ts tests/browser/refund-flow.spec.ts
```

Backend tests use a transactional memory repository and mocked courier/refund
gateways. Browser tests bundle the actual dashboard components and intercept API
calls. They do not manifest real parcels, schedule pickups, cancel live orders,
send customer emails or issue real refunds.

Official references: [Delhivery API FAQ](https://one.delhivery.com/developer-portal/document/b2c/detail/faq),
[pickup request API](https://delhivery-express-api-doc.readme.io/reference/pickup-request-creation-api),
[shipment cancellation API](https://delhivery-express-api-doc.readme.io/reference/cancel-order-api),
[refund idempotency](https://razorpay.com/docs/api/refunds/normal-refunds-idempotent/).
