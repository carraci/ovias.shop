import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { GET, PATCH } from "../src/app/api/v1/account/profile/route";
import {
  accountProfileSchema,
  safeAccountProfile,
  type StoredAccountProfile,
} from "../src/server/account-profile";
import { signIn } from "../src/server/auth";
import { transaction } from "../src/server/db";
import { hash } from "../src/server/http";
import type { User } from "../src/lib/types";
import type { AccountProfileInput } from "../src/lib/account-profile";
import { installMongoFixture } from "./helpers/mongo-fixture";

const input: AccountProfileInput = {
  title: "Mx",
  firstName: "आर्या",
  lastName: "O’Connor",
  phoneType: "mobile",
  phoneCountryCode: "+91",
  phone: "9876543210",
  country: "IN",
  dateOfBirth: "1994-02-28",
  preferences: { email: true, phone: false, textMessage: false, postal: false },
};
test("display names remain separate from first and last names", () => {
  const saved = safeAccountProfile({ name: "Bunny", email: "customer@example.test", accountProfile: { ...input, displayName: "Bunny", updatedAt: "2026-10-11T00:00:00Z", preferencesConsent: { version: 1, updatedAt: "2026-10-11T00:00:00Z", preferences: input.preferences } } });
  assert.equal(saved.displayName, "Bunny");
  assert.equal(saved.firstName, input.firstName);
  assert.equal(saved.lastName, input.lastName);
  assert.equal(accountProfileSchema.safeParse({ ...input, displayName: "Bad\nName" }).success, false);
});

test("profile validation accepts Unicode names and protects identity fields", () => {
  assert.equal(accountProfileSchema.safeParse({...input, contactEmail:"customer@gmail.com"}).success, true);
  assert.equal(accountProfileSchema.safeParse({...input, contactEmail:"invalid-email"}).success, false);
  assert.equal(accountProfileSchema.safeParse(input).success, true);
  assert.equal(
    accountProfileSchema.safeParse({
      ...input,
      lastName: "",
      phone: "",
      dateOfBirth: "",
    }).success,
    true,
  );
  for (const invalid of [
    { email: "changed@example.test" },
    { userId: "other-user" },
    { role: "admin" },
    { firstName: "" },
    { firstName: "<script>" },
    { lastName: "Line\nBreak" },
    { dateOfBirth: "2020-02-30" },
    { dateOfBirth: "2999-01-01" },
    { dateOfBirth: "1899-01-01" },
    { phone: "123" },
    { phone: "123 456789" },
    { phoneCountryCode: "+91", phone: "12345678901234" },
    { country: "XX" },
    { preferences: { ...input.preferences, email: "true" } },
    { preferences: { ...input.preferences, unexpected: true } },
  ])
    assert.equal(
      accountProfileSchema.safeParse({ ...input, ...invalid }).success,
      false,
    );
});

test("account profile APIs authorize, persist preferences and preserve credentials", async (t) => {
  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();
  const directory = await mkdtemp(path.join(tmpdir(), "ovia-profile-test-"));
  const require = createRequire(import.meta.url);
  const headers = require("next/headers");
  const originalCookies = headers.cookies;
  const values = new Map<string, string>();
  headers.cookies = async () => ({
    get: (name: string) =>
      values.has(name) ? { name, value: values.get(name)! } : undefined,
    set: (name: string, value: string) => {
      values.set(name, value);
    },
    delete: (name: string) => {
      values.delete(name);
    },
  });
  process.chdir(directory);
  const database = installMongoFixture();
  delete process.env.VERCEL;
  Object.assign(process.env, {
    NODE_ENV: "test",
    APP_ORIGIN: "http://localhost:3000",
    JWT_SECRET: "profile-test-signing-secret-at-least-32-characters",
  });
  const original: User = {
    id: "profile-user",
    name: "Original Traveler",
    email: "profile@example.test",
    passwordHash: "stored-password-sentinel",
    role: "customer",
    verifiedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
    termsVersion: "2026-01",
    termsAcceptedAt: "2026-01-01T00:00:00.000Z",
  };
  const other: User = {
    ...original,
    id: "other-user",
    email: "other@example.test",
  };
  const request = (raw: unknown, origin = "http://localhost:3000") =>
    new NextRequest("http://localhost:3000/api/v1/account/profile", {
      method: "PATCH",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(raw),
    });
  try {
    await transaction(async (repo) => {
      await repo.put("users", original);
      await repo.put("users", other);
    });
    await t.test(
      "anonymous requests cannot read or update profiles",
      async () => {
        assert.equal((await GET()).status, 401);
        assert.equal((await PATCH(request(input))).status, 401);
      },
    );
    await signIn(original);
    await t.test(
      "initial profile uses authenticated user with no marketing consent",
      async () => {
        const response = await GET();
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("cache-control"), "no-store");
        const { data } = await response.json();
        assert.equal(data.email, original.email);
        assert.equal(data.firstName, "Original");
        assert.equal(data.lastName, "Traveler");
        assert.deepEqual(data.preferences, {
          email: false,
          phone: false,
          textMessage: false,
          postal: false,
        });
        assert.equal("passwordHash" in data, false);
        assert.equal("role" in data, false);
      },
    );
    await t.test(
      "cross-origin updates and unexpected fields are rejected",
      async () => {
        assert.equal(
          (await PATCH(request(input, "https://other.example"))).status,
          403,
        );
        assert.equal(
          (await PATCH(request({ ...input, email: "different@example.test" })))
            .status,
          400,
        );
        assert.equal(
          (await PATCH(request({ ...input, userId: other.id }))).status,
          400,
        );
      },
    );
    await t.test(
      "profile updates persist, return safe data and keep identity and other users intact",
      async () => {
        const response = await PATCH(request(input));
        assert.equal(response.status, 200);
        assert.deepEqual((await response.json()).data, {
          ...input,
          email: original.email,
        });
        assert.deepEqual((await (await GET()).json()).data, {
          ...input,
          email: original.email,
        });
        await transaction(async (repo) => {
          const updated = await repo.get<
            User & { accountProfile: StoredAccountProfile }
          >("users", original.id);
          const { name, accountProfile, ...unchanged } = updated!;
          const { name: previousName, ...expected } = original;
          assert.equal(name, `${input.firstName} ${input.lastName}`);
          assert.deepEqual(unchanged, expected);
          assert.deepEqual(
            accountProfile.preferencesConsent.preferences,
            input.preferences,
          );
          assert.equal(accountProfile.preferencesConsent.version, 1);
          assert.ok(
            Number.isFinite(
              Date.parse(accountProfile.preferencesConsent.updatedAt),
            ),
          );
          assert.deepEqual(await repo.get("users", other.id), other);
        });
      },
    );
    await t.test(
      "personal detail edits retain consent record and withdrawals update it",
      async () => {
        await transaction(async (repo) => {
          const user = await repo.get<
            User & { accountProfile: StoredAccountProfile }
          >("users", original.id);
          await repo.put("users", {
            ...user!,
            accountProfile: {
              ...user!.accountProfile,
              preferencesConsent: {
                ...user!.accountProfile.preferencesConsent,
                updatedAt: "2020-01-01T00:00:00.000Z",
              },
            },
          });
        });
        assert.equal(
          (await PATCH(request({ ...input, title: "Dr" }))).status,
          200,
        );
        await transaction(async (repo) =>
          assert.equal(
            (await repo.get<User & { accountProfile: StoredAccountProfile }>(
              "users",
              original.id,
            ))!.accountProfile.preferencesConsent.updatedAt,
            "2020-01-01T00:00:00.000Z",
          ),
        );
        const withdrawn = {
          ...input,
          preferences: { ...input.preferences, email: false },
        };
        assert.equal((await PATCH(request(withdrawn))).status, 200);
        await transaction(async (repo) => {
          const consent = (await repo.get<
            User & { accountProfile: StoredAccountProfile }
          >("users", original.id))!.accountProfile.preferencesConsent;
          assert.notEqual(consent.updatedAt, "2020-01-01T00:00:00.000Z");
          assert.equal(consent.preferences.email, false);
        });
      },
    );
    await t.test(
      "bounded payloads and excessive update attempts are rejected",
      async () => {
        assert.equal(
          (await PATCH(request({ ...input, firstName: "A".repeat(17_000) })))
            .status,
          413,
        );
        await transaction((repo) =>
          repo.remove("limits", hash(`account-profile-${original.id}:local`)),
        );
        for (let count = 0; count < 12; count++)
          assert.equal((await PATCH(request(input))).status, 200);
        assert.equal((await PATCH(request(input))).status, 429);
      },
    );
  } finally {
    database.restore();
    headers.cookies = originalCookies;
    process.chdir(originalCwd);
    for (const key of Object.keys(process.env))
      if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
    await rm(directory, { recursive: true, force: true });
  }
});
