# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: support-inbox.spec.ts >> priority, status and private notes persist in message details
- Location: tests\browser\support-inbox.spec.ts:436:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /Test Customer Where is my order/ })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: /Test Customer Where is my order/ }) with timeout 5000ms
  - waiting for getByRole('button', { name: /Test Customer Where is my order/ })

```

```yaml
- main:
  - text: OVIA CONTROL CENTER
  - heading "Support & Concierge Mailbox" [level=1]
  - paragraph: Complete luxury-grade email management for customer complaints, orders, and concierge inquiries.
  - button "Connect Gmail (Inbound Sync)":
    - img
    - text: Connect Gmail (Inbound Sync)
  - text: Real-Time Live Active Updated 8:04:14 am
  - button "Settings":
    - img
    - text: Settings
  - complementary "Mailbox folders":
    - button "Compose":
      - img
      - text: Compose
    - paragraph: MAILBOX
    - navigation "Mailbox folders":
      - button "Inbox 1":
        - img
        - text: Inbox 1
      - button "Starred 0":
        - img
        - text: Starred 0
      - button "Important 0":
        - img
        - text: Important 0
      - button "Sent 0":
        - img
        - text: Sent 0
      - button "Scheduled 0":
        - img
        - text: Scheduled 0
      - button "Drafts 0":
        - img
        - text: Drafts 0
      - button "Archive 0":
        - img
        - text: Archive 0
      - button "Spam 0":
        - img
        - text: Spam 0
      - button "Trash 0":
        - img
        - text: Trash 0
    - paragraph: LABELS
    - navigation "Custom Labels":
      - button "New Label":
        - img
        - text: New Label
  - region "Support Mailbox":
    - checkbox "Select All"
    - text: Select All
    - button "Refresh inbox":
      - img
    - button "Move to Trash" [disabled]:
      - img
    - button "Move to Spam" [disabled]:
      - img
    - button "Move to Archive" [disabled]:
      - img
    - button "Mark as Unread" [disabled]:
      - img
    - button "Star selected" [disabled]:
      - img
    - combobox:
      - option "All Statuses" [selected]
      - option "Open"
      - option "Waiting"
      - option "Resolved"
      - option "Closed"
    - text: 1–1 of 1
    - button "Previous page" [disabled]:
      - img
    - button "Next page" [disabled]:
      - img
    - checkbox
    - button "Star":
      - img
    - text: TC Test Customer Shipping Open Where is my order? — Please check my order.
    - time: 4 Oct
```

# Test source

```ts
  112 |     expect(input.requestId).toMatch(/^[a-f0-9-]{36}$/);
  113 |     if (fail) {
  114 |       await route.fulfill({
  115 |         status: 503,
  116 |         json: { error: "Reply could not be saved." },
  117 |       });
  118 |       return;
  119 |     }
  120 |     if (input.action === "draft") {
  121 |       drafts = [
  122 |         {
  123 |           id: input.requestId,
  124 |           to: input.to,
  125 |           cc: input.cc || [],
  126 |           bcc: input.bcc || [],
  127 |           attachments: input.attachments || [],
  128 |           subject: input.subject,
  129 |           text: input.text,
  130 |           updatedAt: new Date().toISOString(),
  131 |         },
  132 |       ];
  133 |       await route.fulfill({ json: { success: true, message: "Draft saved." } });
  134 |       return;
  135 |     }
  136 |     if (input.action === "compose") {
  137 |       drafts = [];
  138 |       tickets = [
  139 |         ...tickets,
  140 |         {
  141 |           id: "outbox:fixture",
  142 |           customer: input.to,
  143 |           email: input.to,
  144 |           subject: input.subject,
  145 |           category: "Outgoing",
  146 |           folder: "Sent",
  147 |           status: "Queued",
  148 |           read: true,
  149 |           createdAt: new Date().toISOString(),
  150 |           messages: [
  151 |             {
  152 |               sender: "support",
  153 |               text: input.text,
  154 |               time: new Date().toISOString(),
  155 |               delivery: "Queued",
  156 |             },
  157 |           ],
  158 |         },
  159 |       ];
  160 |       await route.fulfill({
  161 |         json: {
  162 |           success: true,
  163 |           delivery: "Queued",
  164 |           message: "Email saved and queued for delivery.",
  165 |         },
  166 |       });
  167 |       return;
  168 |     }
  169 |     tickets = tickets.map((t) =>
  170 |       t.id !== input.ticketId
  171 |         ? t
  172 |         : {
  173 |             ...t,
  174 |             status: "Waiting",
  175 |             messages: [
  176 |               ...t.messages,
  177 |               {
  178 |                 sender: "support",
  179 |                 text: input.replyText,
  180 |                 time: new Date().toISOString(),
  181 |                 delivery: "Queued",
  182 |               },
  183 |             ],
  184 |           },
  185 |     );
  186 |     await route.fulfill({
  187 |       json: {
  188 |         success: true,
  189 |         ticket: tickets.find((t) => t.id === input.ticketId),
  190 |         delivery: "Queued",
  191 |         message: "Reply saved and queued for email delivery.",
  192 |       },
  193 |     });
  194 |   });
  195 |   await page.route("**/api/support/realtime", (route: any) =>
  196 |     route.fulfill({ json: { enabled: false } }),
  197 |   );
  198 |   await page.route("**/api/admin/support/gmail", (route: any) =>
  199 |     route.fulfill({
  200 |       json: { connected: false, message: "Google authorization is required." },
  201 |     }),
  202 |   );
  203 |   await page.route("**/support-fixture", (route: any) =>
  204 |     route.fulfill({
  205 |       contentType: "text/html",
  206 |       body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:24px;background:#f7f6f2}*{box-sizing:border-box}${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`,
  207 |     }),
  208 |   );
  209 |   await page.goto("/support-fixture");
  210 |   await expect(
  211 |     page.getByRole("button", { name: /Test Customer Where is my order/ }),
> 212 |   ).toBeVisible();
      |     ^ Error: expect(locator).toBeVisible() failed
  213 |   return {
  214 |     count: () => submissions,
  215 |     addMessage: () => {
  216 |       tickets = tickets.map((t) =>
  217 |         t.id === ticket.id
  218 |           ? {
  219 |               ...t,
  220 |               messages: [
  221 |                 ...t.messages,
  222 |                 {
  223 |                   sender: "customer",
  224 |                   text: "New live customer message",
  225 |                   time: new Date().toISOString(),
  226 |                 },
  227 |               ],
  228 |             }
  229 |           : t,
  230 |       );
  231 |     },
  232 |     addTicket: () => {
  233 |       tickets.push({
  234 |         ...ticket,
  235 |         id: "support_tickets:new",
  236 |         subject: "Payment help",
  237 |         customer: "Second Customer",
  238 |       });
  239 |     },
  240 |   };
  241 | }
  242 | const open = (page: any) =>
  243 |   page.getByRole("button", { name: /Test Customer Where is my order/ }).click();
  244 | test("inbox details display real messages and confirmed queued replies", async ({
  245 |   page,
  246 | }) => {
  247 |   const controls = await mount(page);
  248 |   await open(page);
  249 |   await expect(
  250 |     page.getByText("Please check my order.", { exact: true }),
  251 |   ).toBeVisible();
  252 |   await page
  253 |     .getByPlaceholder("Type response to client...")
  254 |     .fill("We are checking the shipment.");
  255 |   await page.getByRole("button", { name: "Send reply", exact: true }).click();
  256 |   await expect(
  257 |     page.getByText("Reply saved and queued for email delivery."),
  258 |   ).toBeVisible();
  259 |   await expect(
  260 |     page.getByText("We are checking the shipment.", { exact: true }),
  261 |   ).toBeVisible();
  262 |   await expect(page.getByText("Queued", { exact: true })).toBeVisible();
  263 |   expect(controls.count()).toBe(1);
  264 |   await page.screenshot({
  265 |     path: "artifacts/support-message-details-fixture.png",
  266 |     fullPage: true,
  267 |   });
  268 | });
  269 | test("failed replies keep the draft and do not claim delivery", async ({
  270 |   page,
  271 | }) => {
  272 |   await mount(page, true);
  273 |   await open(page);
  274 |   await page
  275 |     .getByPlaceholder("Type response to client...")
  276 |     .fill("Pending response");
  277 |   await page.getByRole("button", { name: "Send reply", exact: true }).click();
  278 |   await expect(page.getByRole("alert")).toHaveText("Reply could not be saved.");
  279 |   await expect(page.getByPlaceholder("Type response to client...")).toHaveValue(
  280 |     "Pending response",
  281 |   );
  282 |   await expect(
  283 |     page.locator("article").getByText("Pending response", { exact: true }),
  284 |   ).toHaveCount(0);
  285 | });
  286 | test("folder actions and stars persist across reload and trash can be restored", async ({
  287 |   page,
  288 | }) => {
  289 |   await mount(page);
  290 |   await page
  291 |     .getByRole("button", { name: "Star Where is my order?", exact: true })
  292 |     .click();
  293 |   await expect(
  294 |     page.getByRole("button", {
  295 |       name: "Unstar Where is my order?",
  296 |       exact: true,
  297 |     }),
  298 |   ).toBeVisible();
  299 |   await page.reload();
  300 |   await expect(
  301 |     page.getByRole("button", {
  302 |       name: "Unstar Where is my order?",
  303 |       exact: true,
  304 |     }),
  305 |   ).toBeVisible();
  306 |   await page
  307 |     .getByRole("checkbox", { name: "Select Where is my order?", exact: true })
  308 |     .check();
  309 |   await page
  310 |     .getByRole("button", { name: "Move to trash", exact: true })
  311 |     .click();
  312 |   await expect(
```