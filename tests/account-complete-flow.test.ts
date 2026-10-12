import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { installMongoFixture } from "./helpers/mongo-fixture";
import { transaction } from "../src/server/db";
import { currentUser, passwordHash, signIn, currentSessionId } from "../src/server/auth";
import * as addresses from "../src/app/api/v1/account/addresses/[[...id]]/route";
import * as wishlist from "../src/app/api/v1/account/wishlist/route";
import * as activity from "../src/app/api/v1/account/activity/route";
import * as care from "../src/app/api/v1/care/[[...path]]/route";
import { saveReply } from "../src/server/support-inbox";
import { updateConversation } from "../src/server/support-conversations";
import type { User, Session } from "../src/lib/types";
import type { AccountActivity } from "../src/lib/account-activity";
import type { Product } from "../src/lib/catalog";

test("isolated customer account, support and device security flow", async (t) => {
  const environment = { ...process.env };
  const database = installMongoFixture([]);
  const originalFetch = globalThis.fetch;
  const headers = createRequire(import.meta.url)("next/headers");
  const originalCookies = headers.cookies;
  const values = new Map<string, string>();
  headers.cookies = async () => ({
    get: (name: string) => values.has(name) ? { name, value: values.get(name)! } : undefined,
    set: (name: string, value: string) => values.set(name, value),
    delete: (name: string) => values.delete(name),
  });
  Object.assign(process.env, { NODE_ENV: "test", JWT_SECRET: "isolated-account-fixture-key-at-least-32-characters", APP_ORIGIN: "http://localhost:3000", EMAIL_API_KEY: "test-only-provider-key", EMAIL_FROM: "OVIA <test@example.test>" });
  const providerMessages: unknown[] = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "https://api.resend.com/emails", "All provider calls are intercepted.");
    providerMessages.push(JSON.parse(String(options?.body)));
    return Response.json({ id: "mock-message-" + providerMessages.length });
  };
  const user: User = { id: "fixture-customer", name: "Demo Traveler", email: "customer@example.test", passwordHash: passwordHash("Fixture1!password"), role: "CUSTOMER", verifiedAt: "2026-10-01T00:00:00Z", createdAt: "2026-10-01T00:00:00Z" };
  const other: User = { ...user, id: "fixture-other", email: "other@example.test" };
  const address = { name: user.name, email: user.email, line1: "10 Example Road", city: "Mumbai", region: "Maharashtra", postalCode: "400001", country: "IN" };
  const product: Product = { id: "fixture-shoulder", slug: "fixture-shoulder-bag", name: "Fixture Shoulder Bag", collection: "OVIA", department: "bags", category: "Shoulder Bags", material: "Leather", description: "Test fixture", dimensions: "", capacity: "", weight: "", tags: [], image: "/media/uploads/fixture-shoulder.webp", imageKind: "photograph", featured: false, status: "Published", storefrontPublished: true, variants: [{ sku: "FIXTURE-SHOULDER-BLACK", color: "Black", hex: "#000000", price: 499900, stock: 5 }] };
  const request = (url: string, method: string, data?: unknown, origin = "http://localhost:3000") => new NextRequest("http://localhost:3000" + url, { method, headers: { origin, "content-type": "application/json", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0", "x-forwarded-for": "127.0.0.1" }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  const context = (value: string) => ({ params: Promise.resolve({ path: value.split("/") }) });
  const careGet = (path: string) => care.GET(request("/api/v1/care/" + path, "GET"), context(path));
  const carePost = (path: string, data: unknown) => care.POST(request("/api/v1/care/" + path, "POST", data), context(path));
  let addressId = "";
  let ticketId = "";
  try {
    await transaction(async (repo) => { await repo.put("users", user); await repo.put("users", other); await repo.put("products", product); await repo.put("inventory", { id: product.variants[0].sku, available: 5 }); });
    await t.test("anonymous callers cannot read account addresses, wishlist, activity or security", async () => {
      for (const response of [await addresses.GET(), await wishlist.GET(), await activity.GET(), await careGet("security")]) assert.equal(response.status, 401);
    });
    await signIn(user, { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0", ip: "127.0.0.1" });
    await t.test("verified sign-in creates a revocable session and one security notification", async () => {
      assert.equal((await currentUser())?.id, user.id);
      const id = await currentSessionId();
      assert.ok(id);
      const sessions = await transaction((repo) => repo.find<Session>("sessions", { userId: user.id }));
      assert.equal(sessions.length, 1);
      const notifications = (await (await activity.GET()).json()).data;
      assert.equal(notifications.filter((item: AccountActivity) => item.title === "New account sign-in").length, 1);
    });
    await t.test("saved addresses persist, update and remain assigned to the authenticated customer", async () => {
      const created = await addresses.POST(request("/api/v1/account/addresses", "POST", { ...address, userId: other.id }));
      assert.equal(created.status, 201);
      const saved = (await created.json()).data;
      addressId = saved.id;
      assert.equal(saved.userId, user.id);
      const update = await addresses.PATCH(request("/api/v1/account/addresses/" + addressId, "PATCH", { ...address, line1: "20 Updated Road" }), { params: Promise.resolve({ id: [addressId] }) });
      assert.equal(update.status, 200);
      assert.equal((await (await addresses.GET()).json()).data[0].line1, "20 Updated Road");
    });
    await t.test("foreign address mutation returns not found and preserves its record", async () => {
      await transaction((repo) => repo.put("addresses", { ...address, id: "foreign-address", userId: other.id }));
      const ctx = { params: Promise.resolve({ id: ["foreign-address"] }) };
      assert.equal((await addresses.PATCH(request("/api/v1/account/addresses/foreign-address", "PATCH", address), ctx)).status, 404);
      assert.equal((await addresses.DELETE(request("/api/v1/account/addresses/foreign-address", "DELETE"), ctx)).status, 404);
      assert.ok(await transaction((repo) => repo.get("addresses", "foreign-address")));
    });
    await t.test("address validation rejects invalid PIN codes and cross-origin writes", async () => {
      assert.equal((await addresses.POST(request("/api/v1/account/addresses", "POST", { ...address, postalCode: "000000" }))).status, 400);
      assert.equal((await addresses.POST(request("/api/v1/account/addresses", "POST", address, "https://other.example"))).status, 403);
    });
    await t.test("address removal persists without removing another customer's addresses", async () => {
      assert.equal((await addresses.DELETE(request("/api/v1/account/addresses/" + addressId, "DELETE"), { params: Promise.resolve({ id: [addressId] }) })).status, 200);
      assert.deepEqual((await (await addresses.GET()).json()).data, []);
      assert.ok(await transaction((repo) => repo.get("addresses", "foreign-address")));
    });
    await t.test("wishlist saves a product slug as its actual SKU and deduplicates retries", async () => {
      for (let attempt = 0; attempt < 2; attempt++) assert.equal((await wishlist.POST(request("/api/v1/account/wishlist", "POST", { sku: product.slug }))).status, 200);
      const saved = (await (await wishlist.GET()).json()).data;
      assert.equal(saved.length, 1);
      assert.equal(saved[0].sku, product.variants[0].sku);
      assert.equal(saved[0].available, true);
      assert.equal(saved[0].image, product.image);
      assert.equal(saved[0].price, 499900);
      assert.equal((await transaction((repo) => repo.get<any>("users", other.id))).accountWishlist, undefined);
    });
    await t.test("wishlist rejects missing products and unexpected identity fields", async () => {
      assert.equal((await wishlist.POST(request("/api/v1/account/wishlist", "POST", { sku: "not-a-product" }))).status, 404);
      assert.equal((await wishlist.POST(request("/api/v1/account/wishlist", "POST", { sku: product.slug, userId: other.id }))).status, 400);
    });
    await t.test("wishlist removal persists on a fresh read", async () => {
      assert.equal((await wishlist.DELETE(request("/api/v1/account/wishlist", "DELETE", { sku: product.variants[0].sku }))).status, 200);
      assert.deepEqual((await (await wishlist.GET()).json()).data, []);
    });
    await t.test("support request creation persists one conversation and queues one owner update", async () => {
      ticketId = randomUUID();
      const input = { category: "Product question", subject: "Fixture shoulder bag question", message: "Please confirm the shoulder strap dimensions.", idempotencyKey: ticketId };
      for (let attempt = 0; attempt < 2; attempt++) {
        const created = await carePost("tickets", input);
        assert.equal(created.status, 200);
        assert.equal((await created.json()).data.id, ticketId);
      }
      assert.equal((await (await careGet("tickets")).json()).data.length, 1);
      assert.equal(providerMessages.length, 1, "Provider is mocked and repeated creation cannot send twice.");
    });
    await t.test("support details enforce customer ownership", async () => {
      const foreign = randomUUID();
      const ticket = await transaction((repo) => repo.get<any>("tickets", ticketId));
      await transaction((repo) => repo.put("tickets", { ...ticket, id: foreign, userId: other.id }));
      assert.equal((await careGet("tickets/" + foreign)).status, 404);
      assert.equal((await careGet("tickets/" + ticketId)).status, 200);
    });
    await t.test("agent replies appear in the exact customer conversation and activity feed", async () => {
      await transaction((repo) => saveReply(repo, { ticketId: "tickets:" + ticketId, requestId: randomUUID(), replyText: "We are checking your strap measurement.", status: "Waiting" }));
      const ticket = (await (await careGet("tickets/" + ticketId)).json()).data;
      assert.equal(ticket.messages.at(-1).author, "support");
      assert.equal(ticket.messages.at(-1).text, "We are checking your strap measurement.");
      const replies = (await (await activity.GET()).json()).data.filter((item: AccountActivity) => item.title === "New support reply");
      assert.ok(replies.some((item: AccountActivity) => item.href === "/account/support?request=" + encodeURIComponent("tickets:" + ticketId)));
    });
    await t.test("customer replies reopen a waiting conversation and repeated submission is idempotent", async () => {
      const input = { ticketId, idempotencyKey: randomUUID(), message: "Thank you; please confirm the exact width." };
      for (let attempt = 0; attempt < 2; attempt++) assert.equal((await carePost("reply", input)).status, 200);
      const ticket = (await (await careGet("tickets/" + ticketId)).json()).data;
      assert.equal(ticket.messages.filter((message: any) => message.id === input.idempotencyKey).length, 1);
      assert.equal(ticket.status, "Open");
      assert.equal(providerMessages.length, 2);
    });
    await t.test("customer accounts cannot read or update the support administration endpoint", async () => {
      assert.equal((await careGet("admin")).status, 403);
      assert.equal((await carePost("admin", { id: ticketId, kind: "ticket", status: "Resolved" })).status, 403);
    });
    await t.test("OWNER accounts can resolve support requests through the administration API", async () => {
      const owner: User = { ...user, id: "fixture-owner", email: "owner@example.test", role: "OWNER" };
      await transaction((repo) => repo.put("users", owner));
      await signIn(owner);
      assert.equal((await careGet("admin")).status, 200);
      assert.equal((await carePost("admin", { id: ticketId, kind: "ticket", status: "Resolved" })).status, 200);
      await signIn(user);
      assert.equal((await (await careGet("tickets/" + ticketId)).json()).data.status, "Resolved");
    });
    await t.test("trusted support staff can manage tickets but cannot access or edit privacy requests", async () => {
      const staff: User = { ...user, id: "fixture-support", email: "support@example.test", role: "SUPPORT" };
      const privacyId = randomUUID();
      await transaction(async (repo) => { await repo.put("users", staff); await repo.put("privacyRequests", { id: privacyId, userId: user.id, requestType: "Access", message: "Private fixture", status: "Submitted", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); });
      await signIn(staff);
      const response = await careGet("admin");
      assert.equal(response.status, 200);
      assert.deepEqual((await response.json()).data.privacy, []);
      assert.equal((await carePost("admin", { id: privacyId, kind: "privacy", status: "Completed" })).status, 403);
      assert.equal((await transaction((repo) => repo.get<any>("privacyRequests", privacyId))).status, "Submitted");
      await signIn(user);
    });
    await t.test("closed support conversations reject customer replies", async () => {
      await transaction((repo) => updateConversation(repo, { ticketId: "tickets:" + ticketId, action: "status", status: "Closed" }, { id: "fixture-owner", email: "owner@example.test" }));
      assert.equal((await carePost("reply", { ticketId, idempotencyKey: randomUUID(), message: "A late reply should be rejected." })).status, 409);
    });
    await t.test("read notifications stay read and unauthorized bulk mutation rolls back", async () => {
      const rows: AccountActivity[] = (await (await activity.GET()).json()).data;
      const own = rows[0];
      const foreign = "f".repeat(64);
      await transaction((repo) => repo.put("account_notifications", { ...own, id: foreign, userId: other.id }));
      assert.equal((await activity.PATCH(request("/api/v1/account/activity", "PATCH", { ids: [own.id, foreign] }))).status, 404);
      assert.equal((await transaction((repo) => repo.get<AccountActivity>("account_notifications", own.id)))?.readAt, undefined);
      assert.equal((await activity.PATCH(request("/api/v1/account/activity", "PATCH", { ids: rows.map(item => item.id) }))).status, 200);
      const read: AccountActivity[] = (await (await activity.GET()).json()).data;
      assert.ok(read.every(item => item.readAt));
      assert.ok(read.every(item => item.userId === user.id));
    });
    await t.test("device security returns current device details without exposing session credentials", async () => {
      const response = await careGet("security");
      assert.equal(response.status, 200);
      const data = (await response.json()).data;
      assert.equal(data.activeSessions, 1);
      assert.equal(data.sessions[0].isCurrent, true);
      assert.equal(data.sessions[0].browser, "Google Chrome 130");
      assert.doesNotMatch(JSON.stringify(data), /passwordHash|ovia_session/);
    });
    await t.test("revoking other devices keeps the current and foreign customer's sessions", async () => {
      const expiresAt = new Date(Date.now() + 60_000).toISOString();
      await transaction(async (repo) => { await repo.put("sessions", { id: "other-device", userId: user.id, expiresAt, device: "Phone" }); await repo.put("sessions", { id: "foreign-device", userId: other.id, expiresAt }); });
      assert.equal((await carePost("revoke-session", { sessionId: "foreign-device" })).status, 200);
      assert.ok(await transaction((repo) => repo.get("sessions", "foreign-device")));
      const response = await carePost("revoke-other-sessions", {});
      assert.equal(response.status, 200);
      assert.equal((await response.json()).data.revokedCount, 1);
      assert.ok(await currentUser());
    });
    await t.test("malformed and expired database sessions cannot authenticate a signed token", async () => {
      const sessionId = await currentSessionId();
      const session = (await transaction((repo) => repo.get<Session>("sessions", sessionId!)))!;
      for (const expiresAt of ["invalid-date", new Date(Date.now() - 1000).toISOString()]) {
        await transaction((repo) => repo.put("sessions", { ...session, expiresAt }));
        assert.equal(await currentUser(), null);
      }
      await transaction((repo) => repo.put("sessions", session));
      assert.ok(await currentUser());
    });
    await t.test("signing out all devices requires password confirmation and revokes a captured session token", async () => {
      assert.equal((await carePost("revoke-sessions", { password: "wrong-password" })).status, 401);
      assert.ok(await currentUser());
      const captured = values.get("ovia_session")!;
      assert.equal((await carePost("revoke-sessions", { password: "Fixture1!password" })).status, 200);
      values.set("ovia_session", captured);
      assert.equal(await currentUser(), null);
      assert.equal((await addresses.GET()).status, 401);
      assert.ok(await transaction((repo) => repo.get("sessions", "foreign-device")));
    });
  } finally {
    headers.cookies = originalCookies;
    globalThis.fetch = originalFetch;
    database.restore();
    for (const key of Object.keys(process.env)) if (!(key in environment)) delete process.env[key];
    Object.assign(process.env, environment);
  }
});
