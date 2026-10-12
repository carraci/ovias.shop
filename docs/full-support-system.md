# Full OVIA support system

The existing Next.js application now provides the customer form at /contact, /account/support, and /care-service/request-assistance. The owner inbox is /admin/support.

## Conversation storage and privacy

Existing contact, support_tickets, and tickets records remain readable. New replies are individual support_messages documents, keyed by a stable request UUID and canonical collection:ticket ID. Legacy messages stay in place and are merged into history. There is no fixed conversation message count. Individual bodies and file sizes are bounded.

support_conversations holds status, priority, verified email thread associations and assignment. support_notes is owner-only and never included in customer responses or outgoing email. Forward actions are recorded in support_forwards. Drafts and outbox delivery state remain durable.

Customers can read and reply to their own userId records, or email records only after their email is verified. Private downloads enforce the same ownership rules. PDF, JPEG, PNG, WebP and text files are limited to five files per message and 4 MB each, with file signature checks. Files are stored in private MongoDB documents and downloaded as attachments, never executable inline content.

## Email delivery

Outgoing mail uses the existing Resend service and verified EMAIL_FROM. Owner notifications go to adarshshukla4639@gmail.com. Support replies set Reply-To to that mailbox and include a stable OV-SUP reference in the subject. CC/BCC and file attachments are passed to the delivery provider. Reply All uses the stored conversation participants; BCC is not added to the public conversation.

Sent means the provider accepted the email. Queued means it is durably saved but not confirmed by the provider. The existing authenticated mail worker can retry pending outbox records. Configure that scheduled worker in production; its route is /api/cron/mail.

## Connect Gmail

The owner must authorize the receiving support mailbox. In /admin/support, choose Connect Gmail and select adarshshukla4639@gmail.com.

The app reuses GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET if dedicated SUPPORT_GMAIL_CLIENT_ID/SECRET values are absent. In that Google Cloud OAuth web client, add these authorized redirect URIs for the environments used:

- http://localhost:3000/api/admin/support/gmail/callback
- https://www.ovias.shop/api/admin/support/gmail/callback

Enable the Gmail API. If the OAuth consent app is in testing, add the support account as a test user. This connection requests gmail.readonly; email sending remains with Resend. The server checks the connected Google profile against SUPPORT_REPLY_TO (defaults to the address above). Tokens are encrypted with AES-GCM using a key derived from the stable server JWT_SECRET. Do not change that secret without reconnecting Google.

After authorization, select Sync Gmail. Initial import covers the latest 50 inbox messages; subsequent imports use Gmail history to discover new messages. A matching stable support reference or Gmail thread ID plus the expected sender attaches the reply to the same request and reopens it. Gmail sender authentication must pass for an imported email to join an existing customer conversation. Unmatched or unverified emails stay separate for review. HTML-only content is not rendered as HTML. Supported attachments are imported privately. Duplicate Gmail message receipts prevent repeat messages.

The legacy environment refresh-token mode is supported for server configuration. Remove SUPPORT_GMAIL_REFRESH_TOKEN if using the Connect/Disconnect UI so the environment token cannot keep authorization active after disconnect.

## Socket.IO

npm run dev starts the app and the support worker together. You can also run npm run support:realtime separately. The local worker listens on http://localhost:3001. Authenticated browser tokens are short-lived, bound to a real database session and verified user. Server-side stored roles decide rooms; client claims never grant owner access. Sessions are rechecked and expired/revoked connections disconnected.

MongoDB change streams notify the owner room and the affected customer's room without sending message contents over the socket. The browser reloads its authorized API view. The worker also requests Gmail synchronization every 30 seconds using signed internal tokens.

For production, deploy this worker on a persistent Node.js host that can maintain WebSockets and MongoDB change streams. Set SUPPORT_REALTIME_URL in the Next.js server to its public HTTPS URL, and set APP_ORIGIN on the worker to the storefront's exact origin. Configure reverse-proxy WebSocket upgrades and HTTPS. Next.js serverless hosting alone does not run this persistent worker. Polling every five seconds remains available when Socket.IO is disconnected.

Google authorization and production worker deployment have not been performed automatically. No test sends real customer email.

## Verification

Backend tests cover long conversations, idempotent replies, email/thread association, sender isolation, private notes/files, Reply All, encrypted authorization, mailbox actions and order-linked requests. Socket tests exercise real network connections with fixture sessions and roles. Browser fixtures exercise the actual admin/customer components with intercepted APIs, including request creation, private attachments, live replies, notes, priority/status and saved draft recipients.

Run:
- npx tsc --noEmit --incremental false
- npx tsx --test tests/support-system.test.ts tests/support-inbox.test.ts tests/support-mailbox.test.ts tests/contact-notifications.test.ts tests/care-order-requests.test.ts
- node --test tests/support-socket.test.mjs
- npx playwright test tests/browser/support-inbox.spec.ts tests/browser/full-support-customer.spec.ts --workers=1