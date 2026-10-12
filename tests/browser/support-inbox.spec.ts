import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";
let js = "",
  css = "";
test.beforeAll(async () => {
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Inbox from './src/app/admin/(control-center)/support/page';createRoot(document.getElementById('root')).render(<Inbox/>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    outdir: path.join(process.cwd(), "artifacts", "support-fixture"),
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  js = result.outputFiles!.find((f) => f.path.endsWith(".js"))!.text;
  css = result.outputFiles!.find((f) => f.path.endsWith(".css"))!.text;
});
async function mount(page: any, fail = false) {
  const ticket: any = {
    id: "support_tickets:fixture",
    customer: "Test Customer",
    email: "customer@example.com",
    subject: "Where is my order?",
    category: "Shipping",
    status: "Open",
    folder: "Inbox",
    read: false,
    starred: false,
    important: false,
    createdAt: "2026-10-04T12:00:00Z",
    messages: [
      {
        sender: "customer",
        text: "Please check my order.",
        time: "2026-10-04T12:00:00Z",
      },
    ],
  };
  let tickets = [ticket];
  let drafts: any[] = [];
  let submissions = 0;
  await page.route("**/api/admin/support", async (route: any) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        json: {
          success: true,
          tickets,
          drafts,
          updatedAt: new Date().toISOString(),
          emailConnection: {
            connected: false,
            message: "Gmail import is optional.",
          },
        },
      });
      return;
    }
    const input = route.request().postDataJSON();
    if (method === "PATCH") {
      if (input.ticketId) {
        tickets = tickets.map((t) =>
          t.id !== input.ticketId
            ? t
            : {
                ...t,
                ...(input.action === "status" ? { status: input.status } : {}),
                ...(input.action === "priority"
                  ? { priority: input.priority }
                  : {}),
                ...(input.action === "note"
                  ? {
                      notes: [
                        ...(t.notes || []),
                        {
                          id: input.requestId,
                          text: input.text,
                          actor: "owner@example.com",
                          createdAt: new Date().toISOString(),
                        },
                      ],
                    }
                  : {}),
              },
        );
        await route.fulfill({ json: { success: true } });
        return;
      }
      tickets = tickets.map((t) =>
        !input.ids.includes(t.id)
          ? t
          : {
              ...t,
              ...(input.action === "folder"
                ? { folder: input.folder }
                : input.action === "star"
                  ? { starred: input.value }
                  : input.action === "read"
                    ? { read: input.value }
                    : { important: input.value }),
            },
      );
      await route.fulfill({ json: { success: true } });
      return;
    }
    submissions++;
    expect(input.requestId).toMatch(/^[a-f0-9-]{36}$/);
    if (fail) {
      await route.fulfill({
        status: 503,
        json: { error: "Reply could not be saved." },
      });
      return;
    }
    if (input.action === "draft") {
      drafts = [
        {
          id: input.requestId,
          to: input.to,
          cc: input.cc || [],
          bcc: input.bcc || [],
          attachments: input.attachments || [],
          subject: input.subject,
          text: input.text,
          updatedAt: new Date().toISOString(),
        },
      ];
      await route.fulfill({ json: { success: true, message: "Draft saved." } });
      return;
    }
    if (input.action === "compose") {
      drafts = [];
      tickets = [
        ...tickets,
        {
          id: "outbox:fixture",
          customer: input.to,
          email: input.to,
          subject: input.subject,
          category: "Outgoing",
          folder: "Sent",
          status: "Queued",
          read: true,
          createdAt: new Date().toISOString(),
          messages: [
            {
              sender: "support",
              text: input.text,
              time: new Date().toISOString(),
              delivery: "Queued",
            },
          ],
        },
      ];
      await route.fulfill({
        json: {
          success: true,
          delivery: "Queued",
          message: "Email saved and queued for delivery.",
        },
      });
      return;
    }
    tickets = tickets.map((t) =>
      t.id !== input.ticketId
        ? t
        : {
            ...t,
            status: "Waiting",
            messages: [
              ...t.messages,
              {
                sender: "support",
                text: input.replyText,
                time: new Date().toISOString(),
                delivery: "Queued",
              },
            ],
          },
    );
    await route.fulfill({
      json: {
        success: true,
        ticket: tickets.find((t) => t.id === input.ticketId),
        delivery: "Queued",
        message: "Reply saved and queued for email delivery.",
      },
    });
  });
  await page.route("**/api/support/realtime", (route: any) =>
    route.fulfill({ json: { enabled: false } }),
  );
  await page.route("**/api/admin/support/gmail", (route: any) =>
    route.fulfill({
      json: { connected: false, message: "Google authorization is required." },
    }),
  );
  await page.route("**/support-fixture", (route: any) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:24px;background:#f7f6f2}*{box-sizing:border-box}${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`,
    }),
  );
  await page.goto("/support-fixture");
  await expect(
    page.getByRole("button", { name: /Test Customer Where is my order/ }),
  ).toBeVisible();
  return {
    count: () => submissions,
    addMessage: () => {
      tickets = tickets.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              messages: [
                ...t.messages,
                {
                  sender: "customer",
                  text: "New live customer message",
                  time: new Date().toISOString(),
                },
              ],
            }
          : t,
      );
    },
    addTicket: () => {
      tickets.push({
        ...ticket,
        id: "support_tickets:new",
        subject: "Payment help",
        customer: "Second Customer",
      });
    },
  };
}
const open = (page: any) =>
  page.getByRole("button", { name: /Test Customer Where is my order/ }).click();
test("inbox details display real messages and confirmed queued replies", async ({
  page,
}) => {
  const controls = await mount(page);
  await open(page);
  await expect(
    page.getByText("Please check my order.", { exact: true }),
  ).toBeVisible();
  await page
    .getByPlaceholder("Type response to client...")
    .fill("We are checking the shipment.");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText("Reply saved and queued for email delivery."),
  ).toBeVisible();
  await expect(
    page.getByText("We are checking the shipment.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Queued", { exact: true })).toBeVisible();
  expect(controls.count()).toBe(1);
  await page.screenshot({
    path: "artifacts/support-message-details-fixture.png",
    fullPage: true,
  });
});
test("failed replies keep the draft and do not claim delivery", async ({
  page,
}) => {
  await mount(page, true);
  await open(page);
  await page
    .getByPlaceholder("Type response to client...")
    .fill("Pending response");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Reply could not be saved.");
  await expect(page.getByPlaceholder("Type response to client...")).toHaveValue(
    "Pending response",
  );
  await expect(
    page.locator("article").getByText("Pending response", { exact: true }),
  ).toHaveCount(0);
});
test("folder actions and stars persist across reload and trash can be restored", async ({
  page,
}) => {
  await mount(page);
  await page
    .getByRole("button", { name: "Star Where is my order?", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Unstar Where is my order?",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Unstar Where is my order?",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Select Where is my order?", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Move to trash", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your inbox is clear" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Trash/ }).click();
  await page
    .getByRole("checkbox", { name: "Select Where is my order?", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Restore to Inbox", exact: true })
    .click();
  await page.getByRole("button", { name: /^Inbox/ }).click();
  await expect(
    page.getByRole("button", { name: /Test Customer Where is my order/ }),
  ).toBeVisible();
});
test("compose saves and reopens a real draft then shows queued outgoing mail", async ({
  page,
}) => {
  await mount(page);
  await page.getByRole("button", { name: "Compose", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Recipient email", exact: true })
    .fill("customer@example.com");
  await page
    .getByRole("textbox", { name: "Subject", exact: true })
    .fill("Personal order update");
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Your request is being reviewed.");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: /Personal order update customer@example.com/,
    }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /^Drafts/ }).click();
  await page
    .getByRole("button", { name: /Personal order update customer@example.com/ })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Message", exact: true }),
  ).toHaveValue("Your request is being reviewed.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByText("Email saved and queued for delivery."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /customer@example.com Personal order update/,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /customer@example.com Personal order update/ })
    .click();
  await expect(page.getByPlaceholder("Type response to client...")).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Focus reply", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Recipient email", exact: true }),
  ).toHaveValue("customer@example.com");
  await expect(
    page.getByRole("textbox", { name: "Subject", exact: true }),
  ).toHaveValue("Re: Personal order update");
  await expect(
    page.getByRole("textbox", { name: "Message", exact: true }),
  ).toHaveValue("");
});
test("polling adds new customer messages without overwriting an unsent reply", async ({
  page,
}) => {
  const controls = await mount(page);
  await open(page);
  await page
    .getByPlaceholder("Type response to client...")
    .fill("My unfinished reply");
  controls.addMessage();
  await expect(
    page.getByText("New live customer message", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByPlaceholder("Type response to client...")).toHaveValue(
    "My unfinished reply",
  );
});
test("search and mobile layout work without fake rows or overflow", async ({
  page,
}) => {
  const controls = await mount(page);
  controls.addTicket();
  await page
    .getByRole("button", { name: "Refresh inbox", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search messages", exact: true })
    .fill("Payment help");
  await expect(
    page.getByRole("button", { name: /Second Customer Payment help/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Test Customer Where is my order/ }),
  ).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Search messages", exact: true })
    .fill("");
  await page.screenshot({
    path: "artifacts/support-inbox-fixture.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Compose", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/support-inbox-mobile-fixture.png",
    fullPage: true,
  });
});

test("priority, status and private notes persist in message details", async ({
  page,
}) => {
  await mount(page);
  await open(page);
  await page
    .getByLabel("Conversation priority", { exact: true })
    .selectOption("Urgent");
  await expect(
    page.getByLabel("Conversation priority", { exact: true }),
  ).toHaveValue("Urgent");
  await page
    .getByLabel("Conversation status", { exact: true })
    .selectOption("In Progress");
  await expect(
    page.getByLabel("Conversation status", { exact: true }),
  ).toHaveValue("In Progress");
  await page
    .getByLabel("Internal admin note", { exact: true })
    .fill("Private payment investigation.");
  await page
    .getByRole("button", { name: "Save internal note", exact: true })
    .click();
  await expect(
    page.getByText("Private payment investigation.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await open(page);
  await expect(
    page.getByText("Private payment investigation.", { exact: true }),
  ).toBeVisible();
});
test("compose preserves CC/BCC in a saved draft", async ({ page }) => {
  await mount(page);
  await page.getByRole("button", { name: "Compose", exact: true }).click();
  await page
    .getByLabel("Recipient email", { exact: true })
    .fill("customer@example.com");
  await page
    .getByLabel("Cc recipients", { exact: true })
    .fill("team@example.com");
  await page
    .getByLabel("Bcc recipients", { exact: true })
    .fill("archive@example.com");
  await page
    .getByRole("textbox", { name: "Subject", exact: true })
    .fill("Team update");
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Your request is being reviewed.");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("button", { name: /Team update customer@example.com/ })
    .click();
  await expect(page.getByLabel("Cc recipients", { exact: true })).toHaveValue(
    "team@example.com",
  );
  await expect(page.getByLabel("Bcc recipients", { exact: true })).toHaveValue(
    "archive@example.com",
  );
  await page.screenshot({
    path: "artifacts/support-compose-fixture.png",
    fullPage: true,
  });
});
