import { test, expect } from "./helpers/mocked-ui";
import { build } from "esbuild";
test("account centers show recorded refunds and requests without claiming bank credit", async ({
  page,
}) => {
  const bundle = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {CustomerAccountCenter} from './src/components/customer-account-center';createRoot(document.getElementById('root')).render(<><CustomerAccountCenter view="overview"/><CustomerAccountCenter view="refunds"/><CustomerAccountCenter view="returns"/><CustomerAccountCenter view="notifications"/></>);`,
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
        name: "fixtures",
        setup(builder) {
          builder.onResolve({ filter: /^\.\/store-provider$/ }, () => ({
            path: "store",
            namespace: "fixture",
          }));
          builder.onLoad({ filter: /store/, namespace: "fixture" }, () => ({
            contents: `export function useStore(){return {user:{id:'customer'}}}export async function request(path){return (await (await fetch('/api/v1/'+path)).json()).data}`,
            loader: "js",
          }));
          builder.onResolve({ filter: /^next\/link$/ }, () => ({
            path: "link",
            namespace: "fixture",
          }));
          builder.onLoad({ filter: /link/, namespace: "fixture" }, () => ({
            contents:
              'import React from "react";export default function Link(props){return React.createElement("a",props)}',
            loader: "jsx",
            resolveDir: process.cwd(),
          }));
        },
      },
    ],
  });
  const at = "2026-10-01T00:00:00Z";
  await page.route("**/account-center-test", (route) =>
    route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' }),
  );
  await page.route("**/api/v1/account/orders", (route) =>
    route.fulfill({
      json: {
        data: [
          {
            id: "recorded-order",
            orderNumber: "REAL-123",
            createdAt: at,
            status: "paid",
            total: 198,
            provider: "razorpay",
            lines: [],
            refunds: [
              {
                id: "refund-one",
                amount: 198,
                status: "Processing",
                requestedAt: at,
                updatedAt: at,
                remoteId: "provider-reference",
              },
            ],
          },
        ],
      },
    }),
  );
  await page.route("**/api/v1/care/tickets", (route) =>
    route.fulfill({
      json: {
        data: [
          {
            id: "request-one",
            subject: "Return request",
            category: "Return",
            status: "In Review",
            updatedAt: at,
            messages: [
              { id: "reply", author: "support", text: "Awaiting inspection" },
            ],
            orderAction: {
              type: "return",
              items: [{ sku: "owned-sku", quantity: 1 }],
            },
          },
        ],
      },
    }),
  );
  await page.goto("/account-center-test");
  await page.addStyleTag({
    content: bundle.outputFiles.find((file) => file.path.endsWith(".css"))!
      .text,
  });
  await page.addScriptTag({
    content: bundle.outputFiles.find((file) => file.path.endsWith(".js"))!.text,
  });
  await expect(
    page.getByRole("heading", { name: "Account overview" }),
  ).toBeVisible();
  await expect(
    page.getByText("Refund reference: provider-reference"),
  ).toBeVisible();
  await expect(page.getByText("₹1.98", { exact: true })).toBeVisible();
  await expect(page.getByText("Awaiting inspection")).toBeVisible();
  await expect(page.getByRole("link", { name: "View order details →", exact: true })).toHaveAttribute("href", "/account/orders/recorded-order");
  await expect(
    page.getByText("Processed by payment provider", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Money credited", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page
      .getByRole("link", { name: "Refunds", exact: false })
      .filter({ hasText: "01" })
      .first(),
  ).toContainText("01");
});
