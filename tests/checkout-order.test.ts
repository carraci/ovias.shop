import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { products } from "../src/lib/catalog";
import {
  addressSchema,
  changeCart,
  createOrder,
  readCart,
} from "../src/server/commerce";
import { transaction } from "../src/server/db";
import type { Order } from "../src/lib/types";
import { installMongoFixture } from "./helpers/mongo-fixture";

test("checkout persists validated contact details, server totals, and one order per retry", async () => {
  const previousDirectory = process.cwd();
  const previousUri = process.env.MONGODB_URI;
  const previousAllow = process.env.ALLOW_DEMO_CHECKOUT;
  const directory = await mkdtemp(path.join(tmpdir(), "ovia-checkout-test-"));
  process.chdir(directory);
  const database = installMongoFixture();
  process.env.ALLOW_DEMO_CHECKOUT = "true";
  try {
    const address = addressSchema.parse({
      name: "Test Customer",
      email: "test@example.test",
      line1: "123 Test Street",
      line2: "Apartment 4",
      phone: "+91 9876543210",
      city: "Mumbai",
      region: "Maharashtra",
      postalCode: "400001",
      country: "IN",
    });
    assert.equal(
      addressSchema.safeParse({ ...address, phone: "123" }).success,
      false,
    );
    const sku = products[0].variants[0].sku;
    await changeCart("isolated-checkout-owner", sku, 1, "add");
    const cart = await readCart("isolated-checkout-owner");
    const key = randomUUID();
    const order = await createOrder(
      "isolated-checkout-owner",
      undefined,
      address,
      key,
      "demo",
    );
    assert.equal(order.total, cart.total);
    assert.equal(order.status, "demo");
    assert.equal(order.address.line2, "Apartment 4");
    assert.equal(order.address.phone, "+91 9876543210");
    assert.equal((await readCart("isolated-checkout-owner")).lines.length, 0);
    const retry = await createOrder(
      "isolated-checkout-owner",
      undefined,
      address,
      key,
      "demo",
    );
    assert.equal(retry.id, order.id);
    const saved = await transaction((repo) =>
      repo.find<Order>("orders", { owner: "isolated-checkout-owner" }),
    );
    assert.equal(saved.length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(saved[0])), JSON.parse(JSON.stringify(order)));
    assert.equal(database.snapshot().outbox?.length ?? 0, 0);
    await assert.rejects(
      createOrder(
        "isolated-checkout-owner",
        undefined,
        address,
        randomUUID(),
        "demo",
      ),
      /Your bag is empty/,
    );
  } finally {
    database.restore();
    process.chdir(previousDirectory);
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
    if (previousAllow === undefined) delete process.env.ALLOW_DEMO_CHECKOUT;
    else process.env.ALLOW_DEMO_CHECKOUT = previousAllow;
  }
});
