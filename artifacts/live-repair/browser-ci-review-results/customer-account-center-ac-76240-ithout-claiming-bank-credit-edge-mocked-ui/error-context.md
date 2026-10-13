# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer-account-center.spec.ts >> account centers show recorded refunds and requests without claiming bank credit
- Location: tests\browser\customer-account-center.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Refund reference: provider-reference')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Refund reference: provider-reference') with timeout 5000ms
  - waiting for getByText('Refund reference: provider-reference')

```

```yaml
- link "OVIA":
  - /url: /account
- link "Account activity":
  - /url: /account/notifications
  - img
- link "Account profile":
  - /url: /account/details
  - img
- navigation "Account":
  - link "Overview":
    - /url: /account
    - img
    - text: Overview
  - link "My Orders":
    - /url: /account/orders/list
    - img
    - text: My Orders
  - link "Returns & Exchanges":
    - /url: /account/returns
    - img
    - text: Returns & Exchanges
  - link "Refunds & Payments":
    - /url: /account/refunds
    - img
    - text: Refunds & Payments
  - link "Help & Support":
    - /url: /account/support
    - img
    - text: Help & Support
- paragraph: MY ACCOUNT / OVERVIEW
- heading "Account overview" [level=1]
- link "Active orders 01":
  - /url: /account/orders/list
  - text: Active orders
  - strong: "01"
- link "Delivered orders 00":
  - /url: /account/orders/list
  - text: Delivered orders
  - strong: "00"
- link "Refunds 01":
  - /url: /account/refunds
  - text: Refunds
  - strong: "01"
- link "Support tickets 01":
  - /url: /account/support
  - text: Support tickets
  - strong: "01"
- heading "Recent order" [level=2]
- article:
  - strong: "#REAL-123"
  - text: processing
  - paragraph: · ₹1.98
  - link "View order details →":
    - /url: /account/orders/recorded-order
- text: OVIA CUSTOMER ACCOUNT
- link "Help & Support":
  - /url: /account/support
- paragraph: MY ACCOUNT / REFUNDS
- heading "Refunds" [level=1]
- heading "E-Commerce Refund Form" [level=2]
- paragraph: Please fill out this form to request a refund for your purchase.
- group "Purchase details":
  - text: Purchase details First name
  - textbox "First name"
  - text: Last name
  - textbox "Last name"
  - text: Email address
  - textbox "Email address":
    - /placeholder: example@example.com
  - text: Order number
  - combobox "Order number"
  - text: Product name
  - textbox "Product name"
  - text: Reason for refund
  - textbox "Reason for refund"
  - text: Date of purchase
  - textbox "Date of purchase"
  - paragraph: Upload proof of purchase (optional)
  - text: Product images / documents (JPG, PNG, WebP, PDF or TXT; up to 5 files, 4 MB each)
  - button "Add attachments"
- paragraph: Requests are reviewed before any refund is approved.
- button "Submit request"
- paragraph: MY ACCOUNT / RETURNS
- heading "Returns & Exchanges" [level=1]
- heading "Material Return Form" [level=2]
- group "Return request details":
  - text: Return request details
  - heading "Customer Information" [level=3]
  - text: First name
  - textbox "First name"
  - text: Last name
  - textbox "Last name"
  - text: Phone number
  - textbox "Phone number"
  - text: Email address
  - textbox "Email address"
  - heading "Order Information" [level=3]
  - text: Order number
  - combobox "Order number"
  - text: Bill number (optional)
  - textbox "Bill number (optional)"
  - text: Date of purchase
  - textbox "Date of purchase"
  - heading "Material Information" [level=3]
  - text: Reference code (product SKU)
  - combobox "Reference code (product SKU)"
  - text: Quantity
  - spinbutton "Quantity"
  - text: Material name / description
  - textbox "Material name / description":
    - /placeholder: Type here…
  - paragraph: Reason for return
  - checkbox "Wrong delivery"
  - text: Wrong delivery
  - checkbox "Wrong quantity"
  - text: Wrong quantity
  - checkbox "Transport damage"
  - text: Transport damage
  - checkbox "For inspection"
  - text: For inspection
  - checkbox "Other"
  - text: Other
  - paragraph: Upload product images or related documents for material return
  - text: Product images / documents (JPG, PNG, WebP, PDF or TXT; up to 5 files, 4 MB each)
  - button "Add attachments"
  - text: Date
  - textbox "Date"
- button "Submit"
- heading "Product Exchange Consent Form" [level=2]
- paragraph: Please fill out this form to provide your consent for product exchange.
- group "Exchange consent details":
  - text: Exchange consent details First name
  - textbox "First name"
  - text: Last name
  - textbox "Last name"
  - text: Email address
  - textbox "Email address"
  - text: Phone number
  - textbox "Phone number"
  - text: Order number
  - combobox "Order number"
  - text: Product name
  - textbox "Product name"
  - text: Reason for exchange
  - textbox "Reason for exchange"
  - paragraph: Preferred resolution
  - radio "Exchange for same product"
  - text: Exchange for same product
  - radio "Exchange for different product"
  - text: Exchange for different product
  - radio "Refund"
  - text: Refund
  - radio "Store credit"
  - text: Store credit
  - paragraph: Upload product images or supporting documents (optional)
  - text: Product images / documents (JPG, PNG, WebP, PDF or TXT; up to 5 files, 4 MB each)
  - button "Add attachments"
  - checkbox "I consent to OVIA reviewing my exchange request. My preferred resolution is subject to eligibility and availability."
  - text: I consent to OVIA reviewing my exchange request. My preferred resolution is subject to eligibility and availability.
- button "Submit"
- paragraph: MY OVIA / ACCOUNT ACTIVITY
- heading "Account activity." [level=1]
- paragraph: Updates about your orders and account.
- text: 0 unread
- button "Mark all as read" [disabled]
- navigation "Activity filters":
  - button "All" [pressed]
  - button "Orders"
  - button "Returns & refunds"
  - button "Support"
  - button "Security"
- alert:
  - text: Failed to fetch
  - button "Try again"
- paragraph: No activity in this category.
```

# Test source

```ts
  10  |       loader: "tsx",
  11  |     },
  12  |     bundle: true,
  13  |     outdir: "out",
  14  |     write: false,
  15  |     platform: "browser",
  16  |     jsx: "automatic",
  17  |     define: { "process.env.NODE_ENV": '"production"' },
  18  |     plugins: [
  19  |       {
  20  |         name: "fixtures",
  21  |         setup(builder) {
  22  |           builder.onResolve({ filter: /^\.\/store-provider$/ }, () => ({
  23  |             path: "store",
  24  |             namespace: "fixture",
  25  |           }));
  26  |           builder.onLoad({ filter: /store/, namespace: "fixture" }, () => ({
  27  |             contents: `export function useStore(){return {user:{id:'customer'}}}export async function request(path){return (await (await fetch('/api/v1/'+path)).json()).data}`,
  28  |             loader: "js",
  29  |           }));
  30  |           builder.onResolve({ filter: /^next\/link$/ }, () => ({
  31  |             path: "link",
  32  |             namespace: "fixture",
  33  |           }));
  34  |           builder.onLoad({ filter: /link/, namespace: "fixture" }, () => ({
  35  |             contents:
  36  |               'import React from "react";export default function Link(props){return React.createElement("a",props)}',
  37  |             loader: "jsx",
  38  |             resolveDir: process.cwd(),
  39  |           }));
  40  |         },
  41  |       },
  42  |     ],
  43  |   });
  44  |   const at = "2026-10-01T00:00:00Z";
  45  |   await page.route("**/account-center-test", (route) =>
  46  |     route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' }),
  47  |   );
  48  |   await page.route("**/api/v1/account/orders", (route) =>
  49  |     route.fulfill({
  50  |       json: {
  51  |         data: [
  52  |           {
  53  |             id: "recorded-order",
  54  |             orderNumber: "REAL-123",
  55  |             createdAt: at,
  56  |             status: "paid",
  57  |             total: 198,
  58  |             provider: "razorpay",
  59  |             lines: [],
  60  |             refunds: [
  61  |               {
  62  |                 id: "refund-one",
  63  |                 amount: 198,
  64  |                 status: "Processing",
  65  |                 requestedAt: at,
  66  |                 updatedAt: at,
  67  |                 remoteId: "provider-reference",
  68  |               },
  69  |             ],
  70  |           },
  71  |         ],
  72  |       },
  73  |     }),
  74  |   );
  75  |   await page.route("**/api/v1/care/tickets", (route) =>
  76  |     route.fulfill({
  77  |       json: {
  78  |         data: [
  79  |           {
  80  |             id: "request-one",
  81  |             subject: "Return request",
  82  |             category: "Return",
  83  |             status: "In Review",
  84  |             updatedAt: at,
  85  |             messages: [
  86  |               { id: "reply", author: "support", text: "Awaiting inspection" },
  87  |             ],
  88  |             orderAction: {
  89  |               type: "return",
  90  |               items: [{ sku: "owned-sku", quantity: 1 }],
  91  |             },
  92  |           },
  93  |         ],
  94  |       },
  95  |     }),
  96  |   );
  97  |   await page.goto("/account-center-test");
  98  |   await page.addStyleTag({
  99  |     content: bundle.outputFiles.find((file) => file.path.endsWith(".css"))!
  100 |       .text,
  101 |   });
  102 |   await page.addScriptTag({
  103 |     content: bundle.outputFiles.find((file) => file.path.endsWith(".js"))!.text,
  104 |   });
  105 |   await expect(
  106 |     page.getByRole("heading", { name: "Account overview" }),
  107 |   ).toBeVisible();
  108 |   await expect(
  109 |     page.getByText("Refund reference: provider-reference"),
> 110 |   ).toBeVisible();
      |     ^ Error: expect(locator).toBeVisible() failed
  111 |   await expect(page.getByText("₹1.98", { exact: true })).toBeVisible();
  112 |   await expect(page.getByText("Awaiting inspection")).toBeVisible();
  113 |   await expect(page.getByRole("link", { name: "View order details →", exact: true })).toHaveAttribute("href", "/account/orders/recorded-order");
  114 |   await expect(
  115 |     page.getByText("Processed by payment provider", { exact: true }),
  116 |   ).toHaveCount(0);
  117 |   await expect(page.getByText("Money credited", { exact: true })).toHaveCount(
  118 |     0,
  119 |   );
  120 |   await expect(
  121 |     page
  122 |       .getByRole("link", { name: "Refunds", exact: false })
  123 |       .filter({ hasText: "01" })
  124 |       .first(),
  125 |   ).toContainText("01");
  126 | });
  127 | 
```