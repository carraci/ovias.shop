import {
  gmailHeaderValue,
  gmailSenderAddress,
} from "../src/server/support-gmail";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Repository } from "../src/server/db";
import {
  listInbox,
  saveReply,
  receiveEmail,
} from "../src/server/support-inbox";
import {
  appendConversationMessage,
  ownConversations,
  ticketReference,
  updateConversation,
} from "../src/server/support-conversations";
import {
  canDownloadAttachment,
  checkSupportFile,
  saveSupportAttachment,
  validateAttachmentLinks,
  type SupportAttachment,
} from "../src/server/support-attachments";
import {
  sealSupportSecret,
  openSupportSecret,
  validOAuthState,
} from "../src/server/support-google-auth";
function fixture() {
  const db = new Map<string, Map<string, any>>();
  const c = (name: string) => {
    if (!db.has(name)) db.set(name, new Map());
    return db.get(name)!;
  };
  const repo: Repository = {
    async get(name, id) {
      return c(name).get(id);
    },
    async find(name, q = {}) {
      return [...c(name).values()].filter((v) =>
        Object.entries(q).every(([k, x]) => v[k] === x),
      );
    },
    async put(name, v) {
      c(name).set(v.id, v);
    },
    async remove(name, id) {
      c(name).delete(id);
    },
  };
  return repo;
}
async function seed() {
  const repo = fixture();
  await repo.put("tickets", {
    id: "request",
    userId: "customer",
    name: "Customer",
    email: "customer@example.com",
    subject: "Payment question",
    category: "Payment",
    status: "Open",
    messages: [
      {
        id: "first",
        author: "customer",
        text: "Please check my payment.",
        createdAt: "2026-10-01T10:00:00Z",
      },
    ],
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-01T10:00:00Z",
  });
  return repo;
}
test("more than 100 messages stay on one ticket without growing its BSON message array", async () => {
  const repo = await seed();
  for (let i = 0; i < 125; i++)
    await appendConversationMessage(repo, {
      id: "message-" + i,
      ticketId: "tickets:request",
      sender: i % 2 ? "support" : "customer",
      text: "Message " + i,
      time: new Date(Date.UTC(2026, 9, 7, 10, 0, i)).toISOString(),
    });
  const rows = await listInbox(repo);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].messages.length, 126);
  assert.equal((await repo.get<any>("tickets", "request")).messages.length, 1);
  assert.equal((await repo.find("support_messages")).length, 125);
});
test("Gmail reference and verified participant append to the same ticket, reopen it, and deduplicate", async () => {
  const repo = await seed();
  await updateConversation(
    repo,
    { ticketId: "tickets:request", action: "status", status: "Waiting" },
    { id: "owner", email: "owner@example.com" },
  );
  const input = {
    messageId: "gmail:reply",
    from: "customer@example.com",
    to: "support@example.com",
    subject:
      "Re: [" + ticketReference("tickets:request") + "] Payment question",
    text: "Thank you for the update.",
    threadId: "gmail-thread",
    verifiedSender: true,
  };
  await receiveEmail(repo, input, "support@example.com");
  await receiveEmail(repo, input, "support@example.com");
  const rows = await listInbox(repo);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].messages.length, 2);
  assert.equal(rows[0].status, "Open");
  assert.deepEqual(rows[0].gmailThreadIds, ["gmail-thread"]);
  await receiveEmail(
    repo,
    {
      ...input,
      messageId: "gmail:reply2",
      subject: "Re: Payment question",
      text: "Another update.",
    },
    "support@example.com",
  );
  assert.equal((await listInbox(repo))[0].messages.length, 3);
});
test("a wrong or unverified email sender cannot join a customer's existing ticket", async () => {
  const repo = await seed(),
    reference = ticketReference("tickets:request");
  await receiveEmail(
    repo,
    {
      messageId: "wrong",
      from: "stranger@example.com",
      to: "support@example.com",
      subject: reference,
      text: "Fake reply",
      threadId: "thread",
    },
    "support@example.com",
  );
  await receiveEmail(
    repo,
    {
      messageId: "unverified",
      from: "customer@example.com",
      to: "support@example.com",
      subject: reference,
      text: "Unverified reply",
      verifiedSender: false,
    },
    "support@example.com",
  );
  assert.equal(
    (await listInbox(repo)).find((t) => t.id === "tickets:request")!.messages
      .length,
    1,
  );
});
test("notes stay private and priority/status persist without producing customer email", async () => {
  const repo = await seed(),
    actor = { id: "owner", email: "owner@example.com" };
  const action = {
    ticketId: "tickets:request",
    action: "note" as const,
    text: "Private gateway investigation",
    requestId: randomUUID(),
  };
  await updateConversation(repo, action, actor);
  await updateConversation(repo, action, actor);
  await updateConversation(
    repo,
    { ticketId: action.ticketId, action: "priority", priority: "Urgent" },
    actor,
  );
  assert.equal((await repo.find("support_notes")).length, 1);
  assert.equal((await repo.find("outbox")).length, 0);
  const rows = await ownConversations(repo, {
    id: "customer",
    email: "customer@example.com",
    verifiedAt: "yes",
  });
  assert.equal(rows.length, 1);
  assert.ok(!JSON.stringify(rows).includes(action.text));
  assert.equal((await listInbox(repo))[0].priority, "Urgent");
});
test("customers only receive their own conversations and unverified email matching grants no access", async () => {
  const repo = await seed();
  assert.equal(
    (
      await ownConversations(repo, {
        id: "other",
        email: "other@example.com",
        verifiedAt: "yes",
      })
    ).length,
    0,
  );
  assert.equal(
    (
      await ownConversations(repo, {
        id: "other",
        email: "customer@example.com",
      })
    ).length,
    0,
  );
});
test("private attachment ownership is enforced before linking or downloading", async () => {
  const repo = await seed();
  const upload = await saveSupportAttachment(
    repo,
    "customer",
    "proof.txt",
    "text/plain",
    Buffer.from("Real test attachment"),
  );
  await assert.rejects(
    validateAttachmentLinks(repo, [upload.id], "tickets:request", "stranger"),
  );
  await validateAttachmentLinks(
    repo,
    [upload.id],
    "tickets:request",
    "customer",
  );
  const file = (await repo.get<SupportAttachment>(
    "support_attachments",
    upload.id,
  ))!;
  assert.equal(
    await canDownloadAttachment(repo, file, {
      id: "other",
      email: "other@example.com",
    }),
    false,
  );
  assert.equal(
    await canDownloadAttachment(repo, file, {
      id: "customer",
      email: "customer@example.com",
    }),
    true,
  );
  assert.equal(
    await canDownloadAttachment(repo, file, {
      id: "owner",
      email: "owner@example.com",
      role: "OWNER",
    }),
    true,
  );
  assert.throws(() =>
    checkSupportFile(
      "bad.html",
      "text/html",
      Buffer.from("<script>alert(1)</script>"),
    ),
  );
  assert.throws(() =>
    checkSupportFile("bad.pdf", "application/pdf", Buffer.from("not a PDF")),
  );
  assert.throws(() =>
    checkSupportFile(
      "large.txt",
      "text/plain",
      Buffer.alloc(4 * 1024 * 1024 + 1),
    ),
  );
});
test("Reply All only uses stored conversation participants and retries cannot change payload", async () => {
  const repo = await seed();
  await repo.put("support_conversations", {
    id: "tickets:request",
    participants: ["customer@example.com", "team@example.com"],
  });
  const input = {
    ticketId: "tickets:request",
    requestId: randomUUID(),
    replyText: "We are checking.",
    status: "Waiting" as const,
    replyAll: true,
  };
  await saveReply(repo, input);
  await saveReply(repo, input);
  const mails = await repo.find<any>("outbox");
  assert.equal(mails.length, 1);
  assert.deepEqual(mails[0].cc, ["team@example.com"]);
  assert.ok(mails[0].subject.includes(ticketReference(input.ticketId)));
  assert.equal(mails[0].replyTo, "adarshshukla4639@gmail.com");
  await assert.rejects(
    saveReply(repo, { ...input, replyText: "Changed retry text" }),
  );
});
test("closed conversations reject public replies until the owner reopens them", async () => {
  const repo = await seed();
  await updateConversation(
    repo,
    { ticketId: "tickets:request", action: "status", status: "Closed" },
    { id: "owner", email: "owner@example.com" },
  );
  await assert.rejects(
    saveReply(repo, {
      ticketId: "tickets:request",
      requestId: randomUUID(),
      replyText: "Reply",
      status: "Waiting",
    }),
  );
});
test("Google credentials are encrypted, tampering fails, and OAuth state comparison is exact", () => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-key-that-is-at-least-thirty-two-characters";
  try {
    const encrypted = sealSupportSecret("fixture-refresh-token");
    assert.ok(!encrypted.includes("fixture-refresh-token"));
    assert.equal(openSupportSecret(encrypted), "fixture-refresh-token");
    const data = Buffer.from(encrypted, "base64url");
    data[15] ^= 1;
    assert.throws(() => openSupportSecret(data.toString("base64url")));
    assert.equal(validOAuthState("same", "same"), true);
    assert.equal(validOAuthState("wrong", "same"), false);
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});

test("encoded Gmail subjects preserve ticket references and sender display names cannot impersonate participants", () => {
  const subject = "Re: [OV-SUP-123456] Payment — जानकारी";
  assert.equal(
    gmailHeaderValue(
      "=?UTF-8?B?" + Buffer.from(subject).toString("base64") + "?=",
    ),
    subject,
  );
  assert.equal(
    gmailSenderAddress('"customer@example.com" <attacker@example.net>'),
    "attacker@example.net",
  );
  assert.equal(
    gmailSenderAddress('"Fake <customer@example.com>" <attacker@example.net>'),
    "attacker@example.net",
  );
});
