import { test } from "node:test";
import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import { NextRequest } from "next/server";
import { authenticateOwnerLogin } from "../src/server/admin-auth";
import { transaction } from "../src/server/db";
import { POST } from "../src/app/api/admin/auth/login/route";
import { installMongoFixture } from "./helpers/mongo-fixture";

test("owner service rejects missing credentials before looking up or creating a session", async () => {
  await assert.rejects(authenticateOwnerLogin("owner@example.test"), /Invalid owner credentials/);
  await assert.rejects(authenticateOwnerLogin("owner@example.test", ""), /Invalid owner credentials/);
  await assert.rejects(authenticateOwnerLogin("", "password"), /Invalid owner credentials/);
});

test("owner login route has no anonymous, known-email or directOwner password bypass", async () => {
  for (const payload of [{}, { directOwner: true }, { email: "owner@example.test" }, { email: "owner@example.test", directOwner: true }, { email: "owner@example.test", password: "" }]) {
    const response = await POST(new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("set-cookie"), null);
  }
});

test("wrong passwords remain rejected even when an owner record and directOwner flag exist", async () => {
  const fixture = installMongoFixture([]);
  try {
    const salt = "test-fixture-salt";
    await transaction(repo => repo.put("users", {
      id: "isolated-owner", name: "Isolated Owner", email: "owner@example.test", role: "OWNER",
      passwordHash: `${salt}:${scryptSync("correct-fixture-password", salt, 64).toString("hex")}`,
      verifiedAt: "2026-01-01T00:00:00Z", createdAt: "2026-01-01T00:00:00Z",
    }));
    await assert.rejects(authenticateOwnerLogin("owner@example.test", "wrong-password"), /Invalid owner credentials/);
    const response = await POST(new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@example.test", password: "wrong-password", directOwner: true }),
    }));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal((fixture.snapshot().sessions || []).length, 0);
  } finally { fixture.restore(); }
});
