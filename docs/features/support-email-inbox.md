# Company email in the Support inbox

The inbox now reads both website contact messages and customer account support requests. No starter tickets are inserted. Customers can see only their own account requests. Admin replies are saved and queued in the existing email outbox; queued does not mean delivered.

Mailbox selected by the owner: `shuklaadarshcs232447@gmail.com`.

## Gmail connection still required

Set these server-only environment variables locally and in the deployment:

- `SUPPORT_INBOX_EMAIL=shuklaadarshcs232447@gmail.com`
- `SUPPORT_GMAIL_CLIENT_ID`
- `SUPPORT_GMAIL_CLIENT_SECRET`
- `SUPPORT_GMAIL_REFRESH_TOKEN`

Create a Google Cloud OAuth web client with Gmail API enabled. Authorize the selected Gmail account with `https://www.googleapis.com/auth/gmail.readonly` and offline access to obtain a refresh token. Store that token only in the server environment, never in chat or the browser. Customer Google sign-in permissions do not grant Gmail access. Follow [Google's Gmail server authorization guide](https://developers.google.com/workspace/gmail/api/auth/web-server).

Once configured, the authenticated admin inbox syncs at most once a minute while open, imports the latest 50 inbox emails, and refreshes the visible list every five seconds. It verifies the connected Google account matches the selected mailbox. Repeated imports use stable provider message IDs. Each incoming email appears as a conversation; this initial integration does not group replies into Gmail threads or import older messages beyond the latest 50. HTML-only emails display an instruction to open Gmail; attachments remain in Gmail. The integration never changes Gmail labels, marks emails read, deletes messages, or sends Gmail email.

Replies use the existing configured business email sender and durable delivery worker, not the Gmail address. Run the existing mail cron to deliver pending messages; configuration or provider failure keeps them queued.

## Optional forwarding bridge

A trusted server-side mail bridge can POST normalized JSON to `/api/webhooks/support-email`, using `Authorization: Bearer <SUPPORT_INBOUND_SECRET>`. Set a strong server secret. Payload fields: `messageId`, `from`, `to`, `subject`, `text`, optional `name`. The recipient must match `SUPPORT_INBOX_EMAIL`. This is a custom bridge endpoint, not a native Gmail or Resend webhook format. Do not forward raw provider webhooks without verification and normalization.

No real Gmail message was imported or customer reply sent during implementation tests. Actual Gmail authorization and deployment remain required.

## Website message notifications

New contact-form and account support submissions queue an email to `adarshshukla4639@gmail.com`, then immediately attempt delivery through the configured business email sender (`EMAIL_API_KEY`, `EMAIL_FROM`). No Gmail authorization is needed to receive these notifications. Both the website request and its notification are saved atomically before the provider call. Failed delivery remains pending in the existing outbox for the mail cron to retry. Provider acceptance means sent, not proof that Gmail has placed it in the inbox; check Spam as well. Previously saved requests are not automatically resent. Direct Gmail inbox import above is a separate optional feature.

## Redesigned mailbox

The admin inbox combines `contact`, `support_tickets`, and authenticated customer `tickets` records. It polls saved data every five seconds while visible. The customer `/contact` conversation also polls its owned tickets every five seconds. There is no WebSocket/push subscription; background Gmail import remains a separate configured integration.

Mailbox folders (Inbox, Archive, Spam and recoverable Trash), stars, importance and read timestamps are stored separately in `support_mailbox`; moving a request does not delete its customer conversation. New customer messages make a previously read conversation unread again. Search covers real names, emails, subjects and message text. Categories and counts derive from saved requests.

Compose drafts persist in `support_drafts`. Reply and compose sends use stable request IDs and durable outbox records, with unique ID indexes ensured before mutations. Provider failure stays Queued for the existing retry worker. Sent means the email provider accepted the message, not confirmation of Gmail placement or customer reading. Raw customer HTML is never rendered. Attachments are shown only when stored, with executable/data URLs excluded. Compose and mailbox writes require owner authentication, same-origin requests and validated bounded payloads. Sending is rate limited.

The screenshot reference's placeholder mail rows are not seeded. Reply-all is not shown because the existing records do not store verified CC recipients. Folder changes affect the OVIA inbox only; they do not modify a remote Gmail mailbox.
