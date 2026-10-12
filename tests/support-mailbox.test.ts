import { hydrateCareTicket } from "../src/server/support-conversations";
import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET, POST, PATCH } from "../src/app/api/admin/support/route";
import type { Repository } from "../src/server/db";
import {
  mailboxData,
  updateMailbox,
  saveDraft,
  queueComposition,
  composeSchema,
} from "../src/server/support-mailbox";
import { saveReply, listInbox } from "../src/server/support-inbox";
function fixture() {
  const data = new Map<string, Map<string, any>>();
  const col = (c: string) => {
    if (!data.has(c)) data.set(c, new Map());
    return data.get(c)!;
  };
  const repo: Repository = {
    async get(c, id) {
      return col(c).get(id);
    },
    async find(c, q = {}) {
      return [...col(c).values()].filter((v) =>
        Object.entries(q).every(([k, x]) => v[k] === x),
      );
    },
    async put(c, v) {
      col(c).set(v.id, v);
    },
    async remove(c, id) {
      col(c).delete(id);
    },
  };
  return repo;
}
async function seed() {
  const repo = fixture();
  await repo.put("support_tickets", {
    id: "a",
    customerName: "Customer",
    customerEmail: "customer@example.com",
    subject: "Order help",
    message: "Please help with my order",
    createdAt: "2026-10-01T10:00:00Z",
  });
  return repo;
}
test("stars, importance, folder changes and read state survive fresh inbox reads", async () => {
  const repo = await seed();
  const ids = ["support_tickets:a"];
  await updateMailbox(repo, { ids, action: "star", value: true });
  await updateMailbox(repo, { ids, action: "important", value: true });
  await updateMailbox(repo, { ids, action: "read", value: true });
  await updateMailbox(repo, { ids, action: "folder", folder: "Archive" });
  const row = (await mailboxData(repo)).tickets[0];
  assert.equal(row.folder, "Archive");
  assert.equal(row.starred, true);
  assert.equal(row.important, true);
  assert.equal(row.read, true);
  await updateMailbox(repo, { ids, action: "folder", folder: "Trash" });
  assert.equal((await listInbox(repo)).length, 1);
  await updateMailbox(repo, { ids, action: "folder", folder: "Inbox" });
  assert.equal((await mailboxData(repo)).tickets[0].folder, "Inbox");
});
test("invalid bulk IDs do not partially change saved folders", async () => {
  const repo = await seed();
  await assert.rejects(
    updateMailbox(repo, {
      ids: ["support_tickets:a", "support_tickets:missing"],
      action: "folder",
      folder: "Trash",
    }),
  );
  assert.equal((await repo.find("support_mailbox")).length, 0);
});
test("drafts persist without sending and compose queues once with truthful delivery", async () => {
  const repo = fixture();
  const id = "a36e6a84-d41e-4c50-bd03-c1ee9d4c1684";
  await saveDraft(repo, {
    action: "draft",
    requestId: id,
    to: "customer@example.com",
    subject: "Order update",
    text: "Your request is being reviewed.",
  });
  assert.equal((await repo.find("outbox")).length, 0);
  const input = composeSchema.parse({
    action: "compose",
    requestId: id,
    draftId: id,
    to: "customer@example.com",
    subject: "Order update",
    text: "Your request is being reviewed.",
  });
  const mailId = await queueComposition(repo, input);
  await queueComposition(repo, input);
  assert.equal((await repo.find("outbox")).length, 1);
  assert.equal((await repo.find("support_drafts")).length, 0);
  let data = await mailboxData(repo);
  assert.equal(data.tickets[0].status, "Queued");
  const mail = await repo.get<any>("outbox", mailId);
  await repo.put("outbox", { ...mail, status: "sent", text: "[delivered]" });
  data = await mailboxData(repo);
  assert.equal(data.tickets[0].status, "Sent");
  assert.equal(data.tickets[0].messages[0].text, input.text);
  await assert.rejects(
    queueComposition(repo, { ...input, text: "A different email" }),
  );
});
test("composition rejects missing subject, invalid recipient and unrecognized fields", () => {
  const base = {
    action: "compose",
    requestId: "a36e6a84-d41e-4c50-bd03-c1ee9d4c1684",
    to: "customer@example.com",
    subject: "Order update",
    text: "Message",
  };
  assert.equal(
    composeSchema.safeParse({ ...base, to: "not-email" }).success,
    false,
  );
  assert.equal(
    composeSchema.safeParse({ ...base, subject: " " }).success,
    false,
  );
  assert.equal(
    composeSchema.safeParse({ ...base, from: "spoofed@example.com" }).success,
    false,
  );
});
test("care tickets appear in admin inbox and replies preserve the customer conversation schema", async () => {
  const repo = fixture();
  await repo.put("tickets", {
    id: "care",
    userId: "user",
    name: "Customer",
    email: "customer@example.com",
    subject: "Delivery question",
    category: "Delivery issue",
    status: "Open",
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-01T10:00:00Z",
    messages: [
      {
        id: "original",
        author: "customer",
        text: "Where is my order?",
        createdAt: "2026-10-01T10:00:00Z",
      },
    ],
  });
  assert.equal((await listInbox(repo))[0].id, "tickets:care");
  await saveReply(repo, {
    ticketId: "tickets:care",
    replyText: "We are checking the courier.",
    requestId: "a36e6a84-d41e-4c50-bd03-c1ee9d4c1684",
    status: "Waiting",
  });
  const rawTicket = await repo.get<any>("tickets", "care");
  assert.equal(rawTicket.messages.length, 1);
  const ticket = await hydrateCareTicket(repo, rawTicket);
  assert.equal(ticket.messages[1].author, "support");
  assert.equal(ticket.status, "Waiting");
  assert.equal(
    (await mailboxData(repo)).tickets.find((t) => t.id === "tickets:care")!
      .messages[1].delivery,
    "Queued",
  );
});
test("Sent groups ticket replies and includes both sides of the conversation", async () => {
  const repo = await seed();
  await saveReply(repo, { ticketId: "support_tickets:a", replyText: "First reply", requestId: "a36e6a84-d41e-4c50-bd03-c1ee9d4c1684", status: "Waiting" });
  await saveReply(repo, { ticketId: "support_tickets:a", replyText: "Second reply", requestId: "b36e6a84-d41e-4c50-bd03-c1ee9d4c1684", status: "Waiting" });
  const rows = (await mailboxData(repo)).tickets.filter(t => t.folder === "Sent");
  assert.equal(rows.length, 1);
  assert.ok("conversationId" in rows[0]);
  assert.equal(rows[0].conversationId, "support_tickets:a");
  assert.ok(rows[0].messages.some(m => m.sender === "customer"));
  assert.ok(rows[0].messages.some(m => m.text === "First reply"));
  assert.ok(rows[0].messages.some(m => m.text === "Second reply"));
});
test("new customer messages turn a previously read conversation unread", async () => {
  const repo = await seed();
  await updateMailbox(repo, {
    ids: ["support_tickets:a"],
    action: "read",
    value: true,
  });
  const ticket = await repo.get<any>("support_tickets", "a");
  await repo.put("support_tickets", {
    ...ticket,
    messages: [
      {
        sender: "customer",
        text: "A new message",
        time: new Date(Date.now() + 1000).toISOString(),
      },
    ],
  });
  assert.equal((await mailboxData(repo)).tickets[0].read, false);
});
test("anonymous callers cannot read, compose or mutate the owner mailbox", async () => {
  for (const [method, handler] of [
    ["GET", GET],
    ["POST", POST],
    ["PATCH", PATCH],
  ] as const) {
    const response = await handler(
      new NextRequest("http://localhost:3000/api/admin/support", { method }),
    );
    assert.equal(response.status, 401);
  }
});
