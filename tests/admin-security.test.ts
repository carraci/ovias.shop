import { test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { isOwnerRole, authorizeAdminApi } from "../src/server/admin-auth";
import { authSigningKey } from "../src/server/auth";
import { transaction } from "../src/server/db";
import { hash } from "../src/server/http";
import type { User, Session } from "../src/lib/types";
import { 
  canTransitionOrder, 
  transitionOrderStatus, 
  adjustInventoryStock,
  queryAiCopilot 
} from "../src/server/admin-service";

test("RBAC - verifies owner and customer role identification", () => {
  // Positive owner cases
  assert.equal(isOwnerRole("OWNER"), true);
  assert.equal(isOwnerRole("owner"), true);
  assert.equal(isOwnerRole("admin"), true);
  assert.equal(isOwnerRole("ADMIN"), true);

  // Negative customer / unauthenticated cases
  assert.equal(isOwnerRole("CUSTOMER"), false);
  assert.equal(isOwnerRole("customer"), false);
  assert.equal(isOwnerRole("user"), false);
  assert.equal(isOwnerRole("guest"), false);
  assert.equal(isOwnerRole("support"), false);
  assert.equal(isOwnerRole(undefined), false);
  assert.equal(isOwnerRole(null as any), false);
  assert.equal(isOwnerRole(""), false);
});

test("Order State Machine - validates allowed and rejects illegal status transitions", () => {
  // Allowed happy path
  assert.equal(canTransitionOrder("Placed", "Payment Confirmed"), true);
  assert.equal(canTransitionOrder("Payment Confirmed", "Confirmed"), true);
  assert.equal(canTransitionOrder("Confirmed", "Processing"), true);
  assert.equal(canTransitionOrder("Processing", "Packed"), true);
  assert.equal(canTransitionOrder("Packed", "Shipped"), true);
  assert.equal(canTransitionOrder("Shipped", "Out for Delivery"), true);
  assert.equal(canTransitionOrder("Out for Delivery", "Delivered"), true);

  // Allowed cancellation and return paths
  assert.equal(canTransitionOrder("Placed", "Cancelled"), true);
  assert.equal(canTransitionOrder("Confirmed", "Cancelled"), true);
  assert.equal(canTransitionOrder("Delivered", "Return Requested"), true);
  assert.equal(canTransitionOrder("Return Requested", "Return Approved"), true);
  assert.equal(canTransitionOrder("Return Approved", "Return Received"), true);
  assert.equal(canTransitionOrder("Return Received", "Refunded"), true);

  // STRICTLY FORBIDDEN / IMPOSSIBLE transitions
  assert.equal(canTransitionOrder("Delivered", "Processing"), false);
  assert.equal(canTransitionOrder("Delivered", "Confirmed"), false);
  assert.equal(canTransitionOrder("Cancelled", "Shipped"), false);
  assert.equal(canTransitionOrder("Cancelled", "Delivered"), false);
  assert.equal(canTransitionOrder("Shipped", "Placed"), false);
  assert.equal(canTransitionOrder("Refunded", "Processing"), false);
});

test("Order State Machine - transitionOrderStatus throws on illegal status", async () => {
  await assert.rejects(
    async () => {
      // Attempting to revert a Delivered order back to Processing
      await transitionOrderStatus({
        orderId: "OV1234567890", // Delivered order
        nextStatus: "Processing" as any,
        actor: "Adarsh Shukla",
      });
    },
    (err: any) => {
      assert.match(err.message, /Invalid state transition/);
      return true;
    }
  );
});

test("Inventory Adjustments - records auditable movement reason", async () => {
  const result = await adjustInventoryStock({
    sku: "CB-001",
    adjustment: 20,
    reason: "RESTOCK",
    notes: "Batch PO-992 from workshop",
    actor: "adarshshukla4639@gmail.com",
  });

  assert.equal(result.success, true);
  assert.equal(result.sku, "CB-001");
  assert.equal(result.adjustedBy, 20);
  assert.equal(result.reason, "RESTOCK");
});

test("AI Admin Copilot - answers queries without exposing credentials or secrets", async () => {
  const inventoryQuery = await queryAiCopilot("Which products are low on stock?");
  assert.ok(inventoryQuery.answer.includes("Executive Check-in"));
  assert.ok(!inventoryQuery.answer.includes("secret"));
  assert.ok(!inventoryQuery.answer.includes("password"));

  const revenueQuery = await queryAiCopilot("Why did revenue increase this week?");
  assert.ok(revenueQuery.answer.includes("32,48,990"));
  assert.ok(revenueQuery.answer.includes("OVIA Pro Cabin"));

  const shippingQuery = await queryAiCopilot("Show delayed shipments");
  assert.ok(shippingQuery.answer.includes("Delhivery"));
});

test("API Security - authorizeAdminApi rejects unauthenticated requests with 401", async () => {
  const req = new Request("http://localhost:3000/api/admin/orders");
  const auth = await authorizeAdminApi(req);

  assert.equal(auth.authorized, false);
  if (!auth.authorized) {
    assert.equal(auth.response.status, 401);
    const body = await auth.response.json();
    assert.match(body.error, /Authentication required/);
  }
});

test("API Security - authorizeAdminApi rejects CUSTOMER with 403 Forbidden and zero order data", async () => {
  const customerId = "test-customer-uuid-999";
  const sessionJti = "cust-session-jti-888";

  // Create temporary customer in repository
  await transaction(async (repo) => {
    await repo.put<User>("users", {
      id: customerId,
      name: "Test Customer",
      email: "test.customer.999@example.com",
      role: "CUSTOMER",
      passwordHash: "hash-cust",
      createdAt: new Date().toISOString(),
    });
    await repo.put<Session>("sessions", {
      id: hash(sessionJti),
      userId: customerId,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
  });

  // Mint signed customer JWT
  const customerToken = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customerId)
    .setJti(sessionJti)
    .setIssuer("ovia")
    .setAudience("ovia-store")
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(authSigningKey());

  const req = new Request("http://localhost:3000/api/admin/orders", {
    headers: {
      Authorization: `Bearer ${customerToken}`,
    },
  });

  const auth = await authorizeAdminApi(req);

  // Verification: must be 403 Forbidden with zero data leaked!
  assert.equal(auth.authorized, false);
  if (!auth.authorized) {
    assert.equal(auth.response.status, 403);
    const body = await auth.response.json();
    assert.match(body.error, /Forbidden/);
    assert.equal((body as any).orders, undefined);
  }
});

test("API Security - authorizeAdminApi allows authenticated OWNER", async () => {
  const ownerId = "test-owner-uuid-111";
  const sessionJti = "owner-session-jti-222";

  // Create temporary owner in repository
  await transaction(async (repo) => {
    await repo.put<User>("users", {
      id: ownerId,
      name: "Test Owner",
      email: "owner.test.111@ovia.luxury",
      role: "OWNER",
      passwordHash: "hash-owner",
      createdAt: new Date().toISOString(),
    });
    await repo.put<Session>("sessions", {
      id: hash(sessionJti),
      userId: ownerId,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
  });

  // Mint signed owner JWT
  const ownerToken = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ownerId)
    .setJti(sessionJti)
    .setIssuer("ovia")
    .setAudience("ovia-store")
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(authSigningKey());

  const req = new Request("http://localhost:3000/api/admin/orders", {
    headers: {
      Authorization: `Bearer ${ownerToken}`,
    },
  });

  const auth = await authorizeAdminApi(req);

  assert.equal(auth.authorized, true);
  if (auth.authorized) {
    assert.equal(auth.user.role, "OWNER");
    assert.equal(auth.user.email, "owner.test.111@ovia.luxury");
  }
});
