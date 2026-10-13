import { test, expect } from "./helpers/mocked-ui";
import { build } from "esbuild";
import path from "node:path";
let html = "",
  javascript = "",
  css = "";
test.beforeAll(async () => {
  const result = await build({
    stdin: {
      contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Payments from './src/app/admin/(control-center)/payments/page'; createRoot(document.getElementById('root')).render(<Payments/>);`,
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
  css = result.outputFiles!.find((f) => f.path.endsWith(".css"))?.text || "";
  html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><style>body{margin:24px;background:#f7f7f5;font-family:Arial,sans-serif}*{box-sizing:border-box}</style><link rel="stylesheet" href="/fixture.css"/></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`;
});
async function mount(
  page: any,
  mode: "success" | "failed" | "lost" = "success",
) {
  let current: any = undefined;
  const requests: any[] = [];
  const row = {
    id: "pay_fixture1",
    trackingNumber: "PAYMENT-FIXTURE",
    localOrderId: "a1056fc7-1103-4c1f-93c0-c5d4cf6bce25",
    orderId: "OVIA-REFUND-FIXTURE",
    customer: "Test Customer",
    provider: "razorpay",
    method: "Original Razorpay payment method",
    amount: 1000,
    refundablePaise: 100000,
    canRefund: true,
    canVerify: true,
    status: "Paid",
    date: "2026-10-04T10:00:00.000Z",
  };
  await page.route("**/api/admin/payments", async (route: any) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: {
          success: true,
          webhookConfigured: true,
          payments: [
            {
              ...row,
              refund: current,
              status: current?.status || "Paid",
              canRefund: !current || current.status === "Failed",
              refundablePaise:
                current?.status === "Refunded"
                  ? 100000 - current.amount
                  : 100000,
            },
          ],
        },
      });
      return;
    }
    const body = route.request().postDataJSON();
    if (body.action === "verify") {
      expect(Object.keys(body).sort()).toEqual(["action", "orderId"]);
      await route.fulfill({
        json: {
          success: true,
          verified: true,
          message: "Captured payment and refund history verified.",
        },
      });
      return;
    }
    requests.push(body);
    expect(body.confirmed).toBe(true);
    expect(Object.keys(body).sort()).toEqual([
      "amountPaise",
      "confirmed",
      "idempotencyKey",
      "orderId",
      "reason",
    ]);
    current = {
      id: body.idempotencyKey,
      paymentId: row.id,
      amount: body.amountPaise,
      reason: body.reason,
      actor: "Fixture owner",
      status: mode === "failed" ? "Failed" : "Processing",
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(mode === "lost" && requests.length === 1
        ? {}
        : { remoteId: "rfnd_fixture1" }),
    };
    if (mode === "lost" && requests.length === 1) {
      await route.abort("failed");
      return;
    }
    await route.fulfill({ json: { success: true, refund: current } });
  });
  await page.route("**/fixture.js", (route: any) =>
    route.fulfill({ contentType: "application/javascript", body: javascript }),
  );
  await page.route("**/fixture.css", (route: any) =>
    route.fulfill({ contentType: "text/css", body: css }),
  );
  await page.route("**/refund-ui-fixture", (route: any) =>
    route.fulfill({ contentType: "text/html", body: html }),
  );
  await page.goto("http://localhost:3000/refund-ui-fixture");
  await expect(
    page.getByRole("button", { name: "PAYMENT-FIXTURE", exact: true }),
  ).toBeVisible();
  return {
    requests,
    getCurrent: () => current,
    processed: () => {
      current = {
        ...current,
        status: "Refunded",
        updatedAt: new Date().toISOString(),
      };
    },
  };
}

test("refund requires confirmation and stays processing until provider confirmation", async ({page}) => {
  const fixture = await mount(page);
  await page.getByRole("button",{name:"PAYMENT-FIXTURE",exact:true}).click();
  const submit = page.getByRole("button",{name:"Disburse Refund",exact:true});
  await expect(submit).toBeDisabled();
  expect(fixture.requests).toHaveLength(0);
  await page.getByRole("checkbox",{name:/I confirm this amount/}).check();
  await submit.click();
  await expect(page.getByText(/Refund processing. Money is not confirmed/)).toBeVisible();
  expect(fixture.requests).toHaveLength(1);
  expect(fixture.requests[0].amountPaise).toBe(100000);
  await expect(page.getByText("Refund processed successfully!")).toHaveCount(0);
  fixture.processed();
  await page.getByRole("button",{name:"Close",exact:true}).click();
  await expect(page.getByText("Refunded",{exact:true}).last()).toBeVisible({timeout:10000});
});
test("lost refund response retries the original request identity", async ({page}) => {
  const fixture = await mount(page,"lost");
  await page.getByRole("button",{name:"PAYMENT-FIXTURE",exact:true}).click();
  await page.getByRole("checkbox",{name:/I confirm this amount/}).check();
  await page.getByRole("button",{name:"Disburse Refund",exact:true}).click();
  await expect(page.getByText(/Failed to fetch/)).toBeVisible();
  await page.getByRole("button",{name:"Disburse Refund",exact:true}).click();
  await expect(page.getByText(/Refund processing. Money is not confirmed/)).toBeVisible();
  expect(fixture.requests).toHaveLength(2);
  expect(fixture.requests[1]).toEqual(fixture.requests[0]);
});
