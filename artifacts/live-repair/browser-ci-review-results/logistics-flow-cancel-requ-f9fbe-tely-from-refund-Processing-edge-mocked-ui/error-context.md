# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: logistics-flow.spec.ts >> cancel requires one confirmation and reports inventory restoration separately from refund Processing
- Location: tests\browser\logistics-flow.spec.ts:194:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Cancel Order', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - heading "Shipping & Logistics" [level=1] [ref=e6]
      - paragraph [ref=e7]: Manage shipments, track courier confirmations and handle order fulfilment.
    - button "Refresh shipment data" [ref=e8] [cursor=pointer]:
      - generic [ref=e14]: Refresh
  - navigation "Shipping status tabs" [ref=e15]:
    - button "All Orders 1" [ref=e16] [cursor=pointer]:
      - generic [ref=e17]: All Orders
      - generic [ref=e18]: "1"
    - button "Awaiting Approval 1" [ref=e19] [cursor=pointer]:
      - generic [ref=e20]: Awaiting Approval
      - generic [ref=e21]: "1"
    - button "Pickup Scheduled 0" [ref=e22] [cursor=pointer]:
      - generic [ref=e23]: Pickup Scheduled
      - generic [ref=e24]: "0"
    - button "In Transit 0" [ref=e25] [cursor=pointer]:
      - generic [ref=e26]: In Transit
      - generic [ref=e27]: "0"
    - button "Delivered 0" [ref=e28] [cursor=pointer]:
      - generic [ref=e29]: Delivered
      - generic [ref=e30]: "0"
    - button "Cancelled 0" [ref=e31] [cursor=pointer]:
      - generic [ref=e32]: Cancelled
      - generic [ref=e33]: "0"
    - button "Needs Attention 0" [ref=e34] [cursor=pointer]:
      - generic [ref=e35]: Needs Attention
      - generic [ref=e36]: "0"
  - generic [ref=e37]:
    - textbox "Search by order ID, customer or AWB..." [ref=e39]
    - generic [ref=e40]:
      - button "Date" [ref=e42] [cursor=pointer]
      - button "Payment" [ref=e49] [cursor=pointer]
      - button "Courier" [ref=e54] [cursor=pointer]
      - button "Status" [ref=e59] [cursor=pointer]
  - table [ref=e64]:
    - rowgroup [ref=e65]:
      - row [ref=e66]:
        - columnheader [ref=e67]:
          - checkbox "Select all orders" [ref=e68] [cursor=pointer]
        - columnheader "ORDER" [ref=e69]
        - columnheader "CUSTOMER" [ref=e70]
        - columnheader "AMOUNT" [ref=e71]
        - columnheader "PAYMENT" [ref=e72]
        - columnheader "SHIPPING STATUS" [ref=e73]
        - columnheader "COURIER / AWB" [ref=e74]
        - columnheader "EST. DELIVERY" [ref=e75]
        - columnheader "ACTIONS" [ref=e76]
    - rowgroup [ref=e77]:
      - row [ref=e78]:
        - cell [ref=e79]:
          - checkbox "Select order OVIA-LOGISTICS-FIXTURE" [ref=e80] [cursor=pointer]
        - cell [ref=e81]:
          - link "OVIA-LOGISTICS-FIXTURE" [ref=e82] [cursor=pointer]:
            - /url: /admin/orders/a1056fc7-1103-4c1f-93c0-c5d4cf6bce25
        - cell "Test Customer" [ref=e83]
        - cell "₹1,000.00" [ref=e84]
        - cell "Paid" [ref=e85]
        - cell "Ready for approval Awaiting shipment" [ref=e89]:
          - generic [ref=e90]:
            - generic [ref=e91]: Ready for approval
            - generic [ref=e92]: Awaiting shipment
        - cell "Not assigned AWB not confirmed" [ref=e93]:
          - generic [ref=e94]:
            - generic [ref=e95]: Not assigned
            - generic [ref=e96]: AWB not confirmed
        - cell "—" [ref=e97]
        - cell [ref=e98]:
          - button "Actions for OVIA-LOGISTICS-FIXTURE" [ref=e99] [cursor=pointer]
  - contentinfo [ref=e104]:
    - generic [ref=e105]: Showing 1 of 1 orders
    - generic [ref=e106]:
      - button "Previous page" [disabled] [ref=e107]
      - button "1" [ref=e110] [cursor=pointer]
      - button "Next page" [disabled] [ref=e111]
```

# Test source

```ts
  98  |     else
  99  |       row = {
  100 |         ...row,
  101 |         status: "CANCELLED",
  102 |         fulfillmentStatus: "CANCELLED",
  103 |         paymentStatus: "cancelled",
  104 |         canCancel: false,
  105 |         canApprove: false,
  106 |         inventoryRestored: true,
  107 |         refund: {
  108 |           id: "fixture-refund",
  109 |           status: "Processing",
  110 |           remoteId: "rfnd_fixture1",
  111 |           amount: 100000,
  112 |         },
  113 |         operation: {
  114 |           id: "fixture-cancel",
  115 |           action: "cancel",
  116 |           status: "Confirmed",
  117 |           phase: "Complete",
  118 |           message: "Cancellation confirmed; refund Processing.",
  119 |           updatedAt: new Date().toISOString(),
  120 |         },
  121 |         notificationStatus: "Queued",
  122 |       };
  123 |     await route.fulfill({
  124 |       json: { success: true, operation: row.operation, order: row },
  125 |     });
  126 |   });
  127 |   await page.route("**/fixture.js", (route: any) =>
  128 |     route.fulfill({ contentType: "application/javascript", body: javascript }),
  129 |   );
  130 |   await page.route("**/fixture.css", (route: any) =>
  131 |     route.fulfill({ contentType: "text/css", body: css }),
  132 |   );
  133 |   await page.route("**/logistics-ui-fixture", (route: any) =>
  134 |     route.fulfill({ contentType: "text/html", body: html }),
  135 |   );
  136 |   await page.goto("/logistics-ui-fixture");
  137 |   return {
  138 |     requests,
  139 |     delivered: () => {
  140 |       row = {
  141 |         ...row,
  142 |         status: "DELIVERED",
  143 |         fulfillmentStatus: "DELIVERED",
  144 |         canCancel: false,
  145 |       };
  146 |     },
  147 |   };
  148 | }
  149 | async function fillPackage(page: any) {
  150 |   for (const [label, value] of [
  151 |     ["Packed weight (g)", "2500"],
  152 |     ["Length (cm)", "50"],
  153 |     ["Width (cm)", "30"],
  154 |     ["Height (cm)", "20"],
  155 |   ])
  156 |     await page.getByLabel(label).fill(value);
  157 | }
  158 | 
  159 | test("approval requires actual package details and one confirmation, then polls courier delivery", async ({
  160 |   page,
  161 | }) => {
  162 |   const fixture = await mount(page);
  163 |   await page
  164 |     .getByRole("button", { name: "Approve & Ship", exact: true })
  165 |     .click();
  166 |   expect(fixture.requests).toHaveLength(0);
  167 |   await page
  168 |     .getByRole("button", { name: "Confirm & Ship", exact: true })
  169 |     .click();
  170 |   await expect(page.getByRole("alert")).toContainText("actual packed weight");
  171 |   expect(fixture.requests).toHaveLength(0);
  172 |   await fillPackage(page);
  173 |   await page
  174 |     .getByRole("button", { name: "Confirm & Ship", exact: true })
  175 |     .click();
  176 |   await expect(
  177 |     page.getByText("AWB: 123456789012", { exact: true }),
  178 |   ).toBeVisible();
  179 |   expect(fixture.requests).toHaveLength(1);
  180 |   expect(fixture.requests[0].package.weightGrams).toBe(2500);
  181 |   await expect(
  182 |     page.getByText("Refund: Not initiated", { exact: true }),
  183 |   ).toBeVisible();
  184 |   await page.screenshot({
  185 |     path: "artifacts/logistics-confirmed-fixture.png",
  186 |     fullPage: true,
  187 |   });
  188 |   await page.getByRole("button", { name: "Done", exact: true }).click();
  189 |   fixture.delivered();
  190 |   await expect(
  191 |     page.getByRole("cell", { name: /^DELIVERED/ }),
  192 |   ).toBeVisible({ timeout: 12000 });
  193 | });
  194 | test("cancel requires one confirmation and reports inventory restoration separately from refund Processing", async ({
  195 |   page,
  196 | }) => {
  197 |   const fixture = await mount(page);
> 198 |   await page.getByRole("button", { name: "Cancel Order", exact: true }).click();
      |                                                                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
  199 |   expect(fixture.requests).toHaveLength(0);
  200 |   await page
  201 |     .getByRole("button", { name: "Confirm Cancel & Refund", exact: true })
  202 |     .click();
  203 |   await expect(
  204 |     page.getByRole("dialog").getByText("Refund: Processing", { exact: true }),
  205 |   ).toBeVisible();
  206 |   await expect(page.getByText(/Inventory: Restored/)).toBeVisible();
  207 |   expect(fixture.requests).toHaveLength(1);
  208 |   expect(fixture.requests[0].action).toBe("cancel");
  209 |   await expect(
  210 |     page.getByText("Refund: Refunded", { exact: true }),
  211 |   ).not.toBeVisible();
  212 | });
  213 | test("courier failure never displays cancellation success or restores inventory", async ({
  214 |   page,
  215 | }) => {
  216 |   const fixture = await mount(page, "rejected");
  217 |   await page.getByRole("button", { name: "Cancel Order", exact: true }).click();
  218 |   await page
  219 |     .getByRole("button", { name: "Confirm Cancel & Refund", exact: true })
  220 |     .click();
  221 |   await expect(page.getByRole("alert")).toContainText("Courier rejected");
  222 |   await expect(
  223 |     page.getByRole("heading", { name: "Cancel Order", exact: true }),
  224 |   ).toBeVisible();
  225 |   expect(fixture.requests).toHaveLength(1);
  226 |   await expect(
  227 |     page.getByRole("dialog").getByText("Refund: Processing", { exact: true }),
  228 |   ).not.toBeVisible();
  229 | });
  230 | test("unconfirmed courier response stays Processing without invented tracking or a duplicate approve action", async ({
  231 |   page,
  232 | }) => {
  233 |   const fixture = await mount(page, "ambiguous");
  234 |   await page
  235 |     .getByRole("button", { name: "Approve & Ship", exact: true })
  236 |     .click();
  237 |   await fillPackage(page);
  238 |   await page
  239 |     .getByRole("button", { name: "Confirm & Ship", exact: true })
  240 |     .click();
  241 |   await expect(
  242 |     page.getByText("AWB: Not confirmed", { exact: true }),
  243 |   ).toBeVisible();
  244 |   await expect(page.getByRole("status")).toContainText("Processing");
  245 |   await page.getByRole("button", { name: "Done", exact: true }).click();
  246 |   await expect(
  247 |     page.getByRole("button", { name: "Approve & Ship", exact: true }),
  248 |   ).not.toBeVisible();
  249 |   expect(fixture.requests).toHaveLength(1);
  250 | });
  251 | 
```