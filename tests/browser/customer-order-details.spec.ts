import { test, expect } from "./helpers/mocked-ui";
import { build } from "esbuild";
test("customer tabs display recorded prices and never assume a cancelled order was paid", async ({
  page,
}) => {
  page.on("pageerror", (error) => console.log(error.message));
  const bundle = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {AccountOrderDetails} from './src/components/account-order-details';createRoot(document.getElementById('root')).render(<AccountOrderDetails orderId="fixture"/>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    outdir: "out",
    write: false,
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "stub-link",
        setup(b) {
          b.onResolve({ filter: /^\.\/store-provider$/ }, () => ({
            path: "request",
            namespace: "request",
          }));
          b.onLoad({ filter: /.*/, namespace: "request" }, () => ({
            contents: `export async function request(path,method="GET",data){const res=await fetch("/api/v1/"+path,{method,headers:{"Content-Type":"application/json"},body:data?JSON.stringify(data):undefined});const json=await res.json();if(!res.ok)throw new Error("Request failed");return json.data}`,
            loader: "js",
          }));
          b.onResolve({ filter: /^next\/link$/ }, () => ({
            path: "link",
            namespace: "stub",
          }));
          b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
            contents:
              'import React from "react";export default function Link(props){return React.createElement("a",props)}',
            loader: "jsx",
            resolveDir: process.cwd(),
          }));
        },
      },
    ],
  });
  await page.route("**/customer-order-test", (route) =>
    route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' }),
  );
  await page.route("**/api/v1/orders/fixture", (route) =>
    route.fulfill({
      json: {
        data: {
          id: "fixture",
          orderNumber: "ACTUAL-ORDER",
          status: "cancelled",
          provider: "razorpay",
          total: 198,
          createdAt: "2026-10-01T00:00:00Z",
          address: { name: "Customer", city: "Mumbai" },
          lines: [
            {
              sku: "actual",
              name: "Original Cabin",
              color: "Silver",
              price: 198,
              quantity: 1,
              image: "",
            },
          ],
        },
      },
    }),
  );
  await page.route("**/api/v1/orders/fixture/refresh", (route) =>
    route.fulfill({ json: { data: { results: [] } } }),
  );
  await page.route("**/api/v1/care/tickets", async (route) => {
    const input = route.request().postDataJSON();
    expect(input.orderId).toBe("fixture");
    expect(input.message).toBe("Please help with my cancelled order.");
    await route.fulfill({
      json: { data: { id: "support-reference", status: "Open" } },
    });
  });
  await page.goto("/customer-order-test");
  await page.addStyleTag({
    content: bundle.outputFiles.find((file) => file.path.endsWith(".css"))!
      .text,
  });
  await page.addScriptTag({
    content:
      bundle.outputFiles.find((file) => file.path.endsWith(".js"))?.text ||
      bundle.outputFiles[0].text,
  });
  await expect(
    page.getByRole("heading", { name: "Your order was cancelled." }),
  ).toBeVisible();
  await expect(page.getByText("₹1.98").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Payment & Refund", exact: true })
    .click();
  await expect(page.getByText("Payment not confirmed").last()).toBeVisible();
  await expect(page.getByText("No refund recorded")).toBeVisible();
  await expect(page.getByText("Total paid")).toHaveCount(0);
  await page.getByRole("button", { name: "Delivery", exact: true }).click();
  await expect(
    page.getByText("Not confirmed by courier", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancel Order", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Need Help", exact: true }).click();
  await page
    .getByLabel("Describe the issue")
    .fill("Please help with my cancelled order.");
  await page
    .getByRole("button", { name: "Submit Request", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("support-reference");
  await page.route("**/api/v1/orders/fixture", (route) =>
    route.fulfill({
      json: {
        data: {
          id: "fixture",
          orderNumber: "DELIVERED-ORDER",
          status: "paid",
          provider: "razorpay",
          total: 198,
          paidAt: "2026-10-01T00:00:00Z",
          createdAt: "2026-10-01T00:00:00Z",
          address: {
            name: "Customer",
            line1: "Actual delivery address",
            city: "Mumbai",
            postalCode: "400001",
            phone: "9999999999",
          },
          lines: [
            {
              sku: "owned-product",
              name: "Original Cabin",
              color: "Silver",
              price: 198,
              quantity: 1,
              image: "",
              slug: "original-cabin",
            },
          ],
          shipping: {
            provider: "delhivery",
            environment: "production",
            verified: true,
            awb: "123456789012",
            status: "DELIVERED",
            events: [],
          },
        },
      },
    }),
  );
  await page.route("**/api/v1/orders/fixture/return", async (route) => {
    const input = route.request().postDataJSON();
    expect(input.items).toEqual([{ sku: "owned-product", quantity: 1 }]);
    expect(input.pickupAddress).toContain("Actual delivery address");
    expect(input.pickupPhone).toBe("9999999999");
    expect(input.exchange).toBe(false);
    await route.fulfill({
      json: { data: { id: "return-reference", status: "Open" } },
    });
  });
  await page.reload();
  await page.addScriptTag({
    content: bundle.outputFiles.find((file) => file.path.endsWith(".js"))!.text,
  });
  await page
    .getByRole("button", { name: "Return or Exchange →", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Submit Request", exact: true }),
  ).toBeDisabled();
  await page.getByRole("spinbutton").fill("1");
  await page
    .getByRole("button", { name: "Submit Request", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("return-reference");
  await expect(page.getByRole("status")).toContainText(
    "No refund or exchange has been confirmed",
  );
});
