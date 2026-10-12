import { test } from "node:test";
import assert from "node:assert/strict";
import type { Repository } from "../src/server/db";
import {
  queueContactNotification,
  attemptContactNotification,
} from "../src/server/contact-notifications";
function fixture() {
  const rows = new Map<string, any>();
  const repo: Repository = {
    async get(c, id) {
      return rows.get(c + id);
    },
    async find(c, q = {}) {
      return [...rows.entries()]
        .filter(([k]) => k.startsWith(c))
        .map(([, v]) => v)
        .filter((v) => Object.entries(q).every(([k, x]) => v[k] === x));
    },
    async put(c, v) {
      rows.set(c + v.id, v);
    },
    async remove(c, id) {
      rows.delete(c + id);
    },
  };
  return repo;
}
const contact = {
  id: "fixture-message",
  name: "Test Customer",
  email: "customer@example.com",
  message: "Please help with my order.",
  subject: "Order help",
};
test("contact notifications target the owner's selected Gmail and deduplicate retries", async () => {
  const repo = fixture();
  const id = await queueContactNotification(repo, contact);
  await queueContactNotification(repo, contact);
  const rows = await repo.find<any>("outbox");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].to, "adarshshukla4639@gmail.com");
  assert.equal(rows[0].status, "pending");
  assert.match(rows[0].text, /customer@example.com/);
  assert.match(rows[0].text, /Please help/);
  assert.equal(id, "contact-notification-fixture-message");
});
test("confirmed provider delivery marks sent and repeated attempts do not send again", async () => {
  const repo = fixture();
  const id = await queueContactNotification(repo, contact);
  let sent = 0;
  const deps = {
    run: async <T>(fn: (r: Repository) => Promise<T>) => fn(repo),
    send: async (mail: any) => {
      assert.equal(mail.to, "adarshshukla4639@gmail.com");
      sent++;
    },
  };
  assert.equal(await attemptContactNotification(id, deps), "Sent");
  assert.equal(await attemptContactNotification(id, deps), "Sent");
  assert.equal(sent, 1);
  assert.equal((await repo.get<any>("outbox", id)).status, "sent");
});
test("provider failure leaves durable queued mail and retry confirms delivery", async () => {
  const repo = fixture();
  const id = await queueContactNotification(repo, contact);
  const run = async <T>(fn: (r: Repository) => Promise<T>) => fn(repo);
  assert.equal(
    await attemptContactNotification(id, {
      run,
      send: async () => {
        throw new Error("Provider unavailable");
      },
    }),
    "Queued",
  );
  const mail = await repo.get<any>("outbox", id);
  assert.equal(mail.status, "pending");
  assert.match(mail.text, /Please help/);
  assert.equal(
    await attemptContactNotification(id, { run, send: async () => {} }),
    "Sent",
  );
});
