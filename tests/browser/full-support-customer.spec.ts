import { test, expect } from "@playwright/test";
import { build } from "esbuild";
let bundle = "";
let css = "";
test.beforeAll(async () => {
  const result = await build({
    stdin: {
      contents:
        "import React from 'react';import {createRoot} from 'react-dom/client';import {StoreProvider} from './src/components/store-provider';import {FullSupportDesk} from './src/components/full-support-desk';createRoot(document.getElementById('root')).render(<StoreProvider><FullSupportDesk/></StoreProvider>);",
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    outdir: "artifacts/customer-support-fixture",
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  bundle = result.outputFiles!.find(file => file.path.endsWith(".js"))!.text;
  css = result.outputFiles!.find(file => file.path.endsWith(".css"))?.text || "";
});
async function mount(page: any) {
  const customer = {
    id: "customer",
    name: "Test Customer",
    email: "customer@example.com",
  };
  let conversations: any[] = [
    {
      id: "tickets:existing",
      ticketNumber: "OV-SUP-TEST-FIXTURE",
      subject: "Existing payment request",
      category: "Payment",
      status: "Open",
      updatedAt: "2026-10-07T10:00:00Z",
      messages: [
        {
          id: "first",
          sender: "customer",
          text: "Please check this payment.",
          time: "2026-10-07T10:00:00Z",
        },
        {
          id: "reply",
          sender: "support",
          text: "We are reviewing your payment.",
          time: "2026-10-07T10:01:00Z",
        },
      ],
    },
  ];
  let created: any, replyInput: any;
  await page.route("**/api/support/realtime", (r: any) =>
    r.fulfill({ json: { enabled: false } }),
  );
  await page.route("**/api/support/attachments", (r: any) =>
    r.fulfill({
      json: {
        success: true,
        attachment: {
          id: "cea0b11e-bc70-44b1-a094-4094f68357f1",
          name: "proof.txt",
          size: 10,
        },
      },
    }),
  );
  await page.route("**/api/v1/**", async (r: any) => {
    const path = new URL(r.request().url()).pathname,
      method = r.request().method();
    if (path.endsWith("/account"))
      return r.fulfill({ json: { data: { user: customer } } });
    if (path.endsWith("/cart"))
      return r.fulfill({ json: { data: { lines: [], total: 0, version: 0 } } });
    if (path.endsWith("/account/wishlist"))
      return r.fulfill({ json: { data: [] } });
    if (path.endsWith("/account/orders"))
      return r.fulfill({
        json: {
          data: [{ id: "order", orderNumber: "OV-TEST-ORDER", status: "paid" }],
        },
      });
    if (path.endsWith("/support/conversations")) {
      if (method === "POST") {
        replyInput = r.request().postDataJSON();
        conversations = conversations.map((t) =>
          t.id !== replyInput.ticketId
            ? t
            : {
                ...t,
                messages: [
                  ...t.messages,
                  {
                    id: replyInput.requestId,
                    sender: "customer",
                    text: replyInput.text,
                    time: new Date().toISOString(),
                    attachments: replyInput.attachments,
                  },
                ],
              },
        );
      }
      return r.fulfill({ json: { data: conversations } });
    }
    if (path.endsWith("/care/tickets") && method === "POST") {
      created = r.request().postDataJSON();
      const record = {
        id: "tickets:new",
        ticketNumber: "OV-SUP-NEW-FIXTURE",
        subject: created.subject,
        category: created.category,
        status: "New",
        messages: [
          {
            sender: "customer",
            text: created.message,
            time: new Date().toISOString(),
            attachments: created.attachments,
          },
        ],
      };
      conversations = [record, ...conversations];
      return r.fulfill({ json: { data: { id: "new" } } });
    }
    return r.fulfill({ json: { data: [] } });
  });
  await page.route("**/customer-support-fixture.js", (r: any) =>
    r.fulfill({ contentType: "application/javascript", body: bundle }),
  );
  const browserErrors: string[] = [];
  page.on("pageerror", (e: any) => browserErrors.push(e.message));
  await page.route("**/customer-support-fixture", (r: any) =>
    r.fulfill({
      contentType: "text/html",
      body: '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial;padding:24px}label{display:block;margin:12px 0}textarea,input,select{max-width:100%}.care-layout{display:flex;gap:32px}.ticket-row{display:block;padding:12px;width:100%}.ticket-row span,.ticket-row small{display:block}.conversation-message{border:1px solid #ddd;padding:12px;margin:12px 0}</style></head><body><div id="root"></div><script>window.process={env:{NODE_ENV:"production"}};</script><script src="/customer-support-fixture.js"></script></body></html>',
    }),
  );
  await page.goto("/customer-support-fixture");
  await page.addStyleTag({ content: css });
  await expect(
    page.getByRole("heading", { name: /How can we/ }),
    browserErrors.join("; "),
  ).toBeVisible({ timeout: 10000 });
  return {
    created: () => created,
    reply: () => replyInput,
    publish: () => {
      conversations = conversations.map((t) => ({
        ...t,
        messages: [
          ...t.messages,
          {
            id: "live",
            sender: "support",
            text: "A new confirmed admin reply.",
            time: new Date().toISOString(),
          },
        ],
      }));
    },
  };
}
test("Your Requests opens the complete conversation and website replies keep the ticket identity", async ({
  page,
}) => {
  const controls = await mount(page);
  await page.getByRole("button", { name: /View requests/ }).click();
  await page.getByRole("button", { name: /Existing payment request/ }).click();
  await expect(
    page.getByText("We are reviewing your payment.", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Reply to OVIA", { exact: true })
    .fill("Thank you. Please update me.");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText("Thank you. Please update me.", { exact: true }),
  ).toBeVisible();
  expect(controls.reply().ticketId).toBe("tickets:existing");
  expect(controls.reply().requestId).toMatch(/^[a-f0-9-]{36}$/);
  controls.publish();
  await expect(
    page.getByText("A new confirmed admin reply.", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
});
test("customer form uploads an attachment and creates one real request with its saved file identity", async ({
  page,
}) => {
  const controls = await mount(page);
  await page
    .getByLabel("Your message", { exact: true })
    .fill("Please review the attached payment proof.");
  await page.getByLabel("Category", { exact: true }).selectOption("Payment");
  await page.getByText("Related order and attachments (optional)", { exact: true }).click();
  await page.getByLabel("Related order", { exact: true }).selectOption("order");
  await page.getByLabel("Add attachments", { exact: true }).setInputFiles({
    name: "proof.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("test proof"),
  });
  await expect(
    page.getByRole("link", { name: "proof.txt", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Send request/ })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Payment",
      exact: true,
    }),
  ).toBeVisible();
  expect(controls.created().attachments).toEqual([
    "cea0b11e-bc70-44b1-a094-4094f68357f1",
  ]);
  expect(controls.created().orderId).toBe("order");
  expect(controls.created().subject).toBe("Payment");
});
