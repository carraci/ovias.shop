import { test } from "node:test";
import assert from "node:assert/strict";
import {
  listInbox,
  saveReply,
  receiveEmail,
  verifyInboxAuthorization,
  replySchema,
} from "../src/server/support-inbox";
import { gmailText } from "../src/server/support-gmail";
import type { Repository } from "../src/server/db";
function fixture() {
  const db = new Map<string, Map<string, any>>();
  const collection = (c: string) => {
    if (!db.has(c)) db.set(c, new Map());
    return db.get(c)!;
  };
  const repo: Repository = {
    async get(c, id) {
      return collection(c).get(id);
    },
    async find(c, q = {}) {
      return [...collection(c).values()].filter((x) =>
        Object.entries(q).every(([k, v]) => x[k] === v),
      );
    },
    async put(c, v) {
      collection(c).set(v.id, v);
    },
    async remove(c, id) {
      collection(c).delete(id);
    },
  };
  return repo;
}
test("admin inbox includes both contact messages and customer support tickets", async () => {
  const repo = fixture();
  await repo.put("contact", {
    id: "a",
    name: "A",
    email: "a@example.com",
    message: "Contact body",
    createdAt: "2026-10-01",
  });
  await repo.put("support_tickets", {
    id: "a",
    customerName: "B",
    customerEmail: "b@example.com",
    subject: "Order help",
    message: "Support body",
    createdAt: "2026-10-02",
  });
  const rows = await listInbox(repo);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, "support_tickets:a");
  assert.equal(rows[1].messages[0].text, "Contact body");
});
test("replies persist and enqueue once without claiming delivery", async () => {
  const repo = fixture();
  await repo.put("support_tickets", {
    id: "a",
    customerEmail: "a@example.com",
    message: "Help",
    subject: "Order",
  });
  const data = replySchema.parse({
    ticketId: "support_tickets:a",
    replyText: "We are reviewing your order.",
    requestId: "a36e6a84-d41e-4c50-bd03-c1ee9d4c1684",
  });
  await saveReply(repo, data);
  const reply = await saveReply(repo, data);
  assert.equal(reply.messages.length, 2);
  assert.equal(reply.status, "Waiting");
  const outbox = await repo.find<any>("outbox");
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0].status, "pending");
  assert.equal(outbox[0].to, "a@example.com");
});
test("unknown conversations and invalid recipient addresses cannot queue replies", async () => {
  const repo = fixture();
  const input = replySchema.parse({
    ticketId: "support_tickets:missing",
    replyText: "Reply",
    requestId: "a36e6a84-d41e-4c50-bd03-c1ee9d4c1684",
  });
  await assert.rejects(saveReply(repo, input));
  await repo.put("support_tickets", {
    id: "missing",
    customerEmail: "invalid",
  });
  await assert.rejects(saveReply(repo, input));
  assert.equal((await repo.find("outbox")).length, 0);
});
test("inbound email authentication fails closed", () => {
  assert.throws(() => verifyInboxAuthorization(null, ""));
  assert.throws(() => verifyInboxAuthorization("Bearer wrong", "secret"));
  assert.doesNotThrow(() =>
    verifyInboxAuthorization("Bearer secret", "secret"),
  );
});
test("email webhook retries deduplicate and reject a different mailbox", async () => {
  const repo = fixture();
  const email = {
    messageId: "real-message-id",
    from: "customer@example.com",
    to: "company@example.com",
    subject: "Need help",
    text: "Please check my order.",
  };
  await receiveEmail(repo, email, "company@example.com");
  await receiveEmail(repo, email, "company@example.com");
  assert.equal((await repo.find("support_tickets")).length, 1);
  await assert.rejects(
    receiveEmail(
      repo,
      { ...email, to: "other@example.com" },
      "company@example.com",
    ),
  );
  await assert.rejects(
    receiveEmail(repo, { ...email, messageId: "wrong-domain", to: "company@attackerexample.com" }, "company@example.com"),
  );
  await assert.rejects(
    receiveEmail(repo, { ...email, messageId: "wrong-gmail", to: "unrelated@gmail.com" }, "support@gmail.com"),
  );
  assert.equal((await repo.find("support_tickets")).length, 1);
});
test("Gmail MIME parsing reads plain text and ignores executable HTML", () => {
  const text = "Customer message";
  assert.equal(
    gmailText({
      parts: [
        {
          mimeType: "text/html",
          body: {
            data: Buffer.from("<script>alert(1)</script>").toString(
              "base64url",
            ),
          },
        },
        {
          mimeType: "text/plain",
          body: { data: Buffer.from(text).toString("base64url") },
        },
      ],
    }),
    text,
  );
});

test("Gmail sync fails closed when Google connects a different mailbox", async () => {
  const { syncGmailInbox } = await import("../src/server/support-gmail");
  const keys = [
    "SUPPORT_GMAIL_CLIENT_ID",
    "SUPPORT_GMAIL_CLIENT_SECRET",
    "SUPPORT_GMAIL_REFRESH_TOKEN",
    "SUPPORT_INBOX_EMAIL",
  ];
  const previous = keys.map((key) => process.env[key]);
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  try {
    keys.forEach((key) => (process.env[key] = "test-only"));
    process.env.SUPPORT_INBOX_EMAIL = "company@example.com";
    globalThis.fetch = async (input) => {
      const url = String(input);
      calls.push(url);
      return new Response(
        JSON.stringify(
          url.includes("oauth2")
            ? { access_token: "test-token" }
            : { emailAddress: "other@example.com" },
        ),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };
    await assert.rejects(syncGmailInbox(), /does not match/);
    assert.equal(calls.length, 2);
    assert.equal(
      calls.some((url) => url.includes("messages")),
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    });
  }
});
