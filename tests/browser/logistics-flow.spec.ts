import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";
let html = "",
  javascript = "",
  css = "";
test.beforeAll(async () => {
  const result = await build({
    stdin: {
      contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Payments from './src/app/admin/(control-center)/shipping/page'; createRoot(document.getElementById('root')).render(<Payments/>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    outdir: path.join(process.cwd(), "artifacts", "refund-ui-test-bundle"),
    entryNames: "bundle",
    platform: "browser",
    jsx: "automatic",
    alias: { "@": path.join(process.cwd(), "src") },
    define: { "process.env.NODE_ENV": '"production"' },
  });
  javascript = result.outputFiles!.find((f) => f.path.endsWith(".js"))!.text;
  css = result.outputFiles!.find((f) => f.path.endsWith(".css"))!.text;
  html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><style>body{margin:24px;background:#f7f7f5;font-family:Arial,sans-serif}*{box-sizing:border-box}</style><link rel="stylesheet" href="/fixture.css"/></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`;
});

async function mount(
  page: any,
  mode: "success" | "rejected" | "ambiguous" = "success",
) {
  const requests: any[] = [];
  let row: any = {
    orderId: "a1056fc7-1103-4c1f-93c0-c5d4cf6bce25",
    orderNumber: "OVIA-LOGISTICS-FIXTURE",
    customer: "Test Customer",
    address: {
      line1: "Test street",
      city: "Mumbai",
      region: "Maharashtra",
      postalCode: "400072",
    },
    items: [{ name: "Test Bag", quantity: 1, image: "" }],
    amount: 1000,
    paymentStatus: "paid",
    status: "Awaiting approval",
    events: [],
    inventoryRestored: false,
    canApprove: true,
    canCancel: true,
    notificationStatus: "Not queued",
  };
  await page.route("**/api/admin/shipping", async (route: any) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: { success: true, configured: true, shipments: [row] },
      });
      return;
    }
    const body = route.request().postDataJSON();
    requests.push(body);
    expect(body.confirmed).toBe(true);
    expect(body.bankAccount).toBeUndefined();
    expect(body.upi).toBeUndefined();
    if (mode === "rejected") {
      await route.fulfill({
        status: 502,
        json: { success: false, error: "Courier rejected the operation." },
      });
      return;
    }
    if (body.action === "approve")
      row = {
        ...row,
        status: mode === "ambiguous" ? "Processing" : "PICKUP_SCHEDULED",
        fulfillmentStatus: mode === "ambiguous" ? undefined : "READY_TO_SHIP",
        awb: mode === "ambiguous" ? undefined : "123456789012",
        courier: mode === "ambiguous" ? undefined : "Delhivery",
        pickup:
          mode === "ambiguous"
            ? undefined
            : { pickupId: 77, status: "SCHEDULED", date: "2026-10-05" },
        canApprove: false,
        canCancel: mode !== "ambiguous",
        operation: {
          id: "fixture-operation",
          action: "approve",
          status: mode === "ambiguous" ? "Processing" : "Confirmed",
          phase: mode === "ambiguous" ? "Shipment" : "Complete",
          message:
            mode === "ambiguous"
              ? "Courier response is not confirmed."
              : "Shipment and pickup confirmed.",
          updatedAt: new Date().toISOString(),
        },
        notificationStatus: mode === "ambiguous" ? "Not queued" : "Queued",
      };
    else
      row = {
        ...row,
        status: "CANCELLED",
        fulfillmentStatus: "CANCELLED",
        paymentStatus: "cancelled",
        canCancel: false,
        canApprove: false,
        inventoryRestored: true,
        refund: {
          id: "fixture-refund",
          status: "Processing",
          remoteId: "rfnd_fixture1",
          amount: 100000,
        },
        operation: {
          id: "fixture-cancel",
          action: "cancel",
          status: "Confirmed",
          phase: "Complete",
          message: "Cancellation confirmed; refund Processing.",
          updatedAt: new Date().toISOString(),
        },
        notificationStatus: "Queued",
      };
    await route.fulfill({
      json: { success: true, operation: row.operation, order: row },
    });
  });
  await page.route("**/fixture.js", (route: any) =>
    route.fulfill({ contentType: "application/javascript", body: javascript }),
  );
  await page.route("**/fixture.css", (route: any) =>
    route.fulfill({ contentType: "text/css", body: css }),
  );
  await page.route("**/logistics-ui-fixture", (route: any) =>
    route.fulfill({ contentType: "text/html", body: html }),
  );
  await page.goto("/logistics-ui-fixture");
  return {
    requests,
    delivered: () => {
      row = {
        ...row,
        status: "DELIVERED",
        fulfillmentStatus: "DELIVERED",
        canCancel: false,
      };
    },
  };
}
async function fillPackage(page: any) {
  for (const [label, value] of [
    ["Packed weight (g)", "2500"],
    ["Length (cm)", "50"],
    ["Width (cm)", "30"],
    ["Height (cm)", "20"],
  ])
    await page.getByLabel(label).fill(value);
}

test("approval requires actual package details and one confirmation, then polls courier delivery", async ({
  page,
}) => {
  const fixture = await mount(page);
  await page
    .getByRole("button", { name: "Approve & Ship", exact: true })
    .click();
  expect(fixture.requests).toHaveLength(0);
  await page
    .getByRole("button", { name: "Confirm & Ship", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("actual packed weight");
  expect(fixture.requests).toHaveLength(0);
  await fillPackage(page);
  await page
    .getByRole("button", { name: "Confirm & Ship", exact: true })
    .click();
  await expect(
    page.getByText("AWB: 123456789012", { exact: true }),
  ).toBeVisible();
  expect(fixture.requests).toHaveLength(1);
  expect(fixture.requests[0].package.weightGrams).toBe(2500);
  await expect(
    page.getByText("Refund: Not initiated", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/logistics-confirmed-fixture.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  fixture.delivered();
  await expect(
    page.getByRole("cell", { name: /^DELIVERED/ }),
  ).toBeVisible({ timeout: 12000 });
});
test("cancel requires one confirmation and reports inventory restoration separately from refund Processing", async ({
  page,
}) => {
  const fixture = await mount(page);
  await page.getByRole("button", { name: "Cancel Order", exact: true }).click();
  expect(fixture.requests).toHaveLength(0);
  await page
    .getByRole("button", { name: "Confirm Cancel & Refund", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("Refund: Processing", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Inventory: Restored/)).toBeVisible();
  expect(fixture.requests).toHaveLength(1);
  expect(fixture.requests[0].action).toBe("cancel");
  await expect(
    page.getByText("Refund: Refunded", { exact: true }),
  ).not.toBeVisible();
});
test("courier failure never displays cancellation success or restores inventory", async ({
  page,
}) => {
  const fixture = await mount(page, "rejected");
  await page.getByRole("button", { name: "Cancel Order", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm Cancel & Refund", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Courier rejected");
  await expect(
    page.getByRole("heading", { name: "Cancel Order", exact: true }),
  ).toBeVisible();
  expect(fixture.requests).toHaveLength(1);
  await expect(
    page.getByRole("dialog").getByText("Refund: Processing", { exact: true }),
  ).not.toBeVisible();
});
test("unconfirmed courier response stays Processing without invented tracking or a duplicate approve action", async ({
  page,
}) => {
  const fixture = await mount(page, "ambiguous");
  await page
    .getByRole("button", { name: "Approve & Ship", exact: true })
    .click();
  await fillPackage(page);
  await page
    .getByRole("button", { name: "Confirm & Ship", exact: true })
    .click();
  await expect(
    page.getByText("AWB: Not confirmed", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Processing");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Approve & Ship", exact: true }),
  ).not.toBeVisible();
  expect(fixture.requests).toHaveLength(1);
});
