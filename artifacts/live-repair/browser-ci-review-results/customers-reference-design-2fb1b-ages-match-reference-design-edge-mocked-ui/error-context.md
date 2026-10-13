# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customers-reference-design.spec.ts >> stroyka customer directory and profile pages match reference design
- Location: tests\browser\customers-reference-design.spec.ts:134:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'New customer', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'New customer', exact: true }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'New customer', exact: true })

```

```yaml
- complementary:
  - link "OVIA":
    - /url: /admin
  - text: APPLICATION
  - link "Dashboard":
    - /url: /admin
    - img
    - text: Dashboard
  - link "Orders":
    - /url: /admin/orders
    - img
    - text: Orders
    - img
  - button "Products":
    - img
    - text: Products
    - img
  - link "Customers":
    - /url: /admin/customers
    - img
    - text: Customers
  - link "Shipping & Logistics":
    - /url: /admin/shipping
    - img
    - text: Shipping & Logistics
  - link "Payments":
    - /url: /admin/payments
    - img
    - text: Payments
  - link "Returns & Refunds":
    - /url: /admin/returns
    - img
    - text: Returns & Refunds
  - link "Content":
    - /url: /admin/content
    - img
    - text: Content
    - img
  - link "Reports":
    - /url: /admin/reports
    - img
    - text: Reports
  - link "Support":
    - /url: /admin/support
    - img
    - text: Support
  - link "Inventory":
    - /url: /admin/inventory
    - img
    - text: Inventory
  - link "Coupons":
    - /url: /admin/coupons
    - img
    - text: Coupons
  - link "Switch to Public Shop":
    - /url: /
    - img
    - text: Switch to Public Shop
  - text: AS Adarsh Shukla Owner
  - button "Sign out of Admin Control Center":
    - img
- banner:
  - button "Toggle admin navigation" [expanded]:
    - img
  - img
  - textbox "Search orders, products, customers..."
  - button "Last 30 days":
    - img
    - text: Last 30 days
  - button:
    - img
  - text: AS Adarsh Shukla Owner
  - img
- main:
  - navigation:
    - link "Dashboard":
      - /url: /admin
    - text: /Customers
  - heading "Customers" [level=1]
  - img
  - textbox "Start typing to search for customers"
  - table:
    - rowgroup:
      - row "Name Registered Country Group Spent":
        - columnheader:
          - checkbox
        - columnheader "Name":
          - text: Name
          - img
        - columnheader "Registered":
          - text: Registered
          - img
        - columnheader "Country":
          - text: Country
          - img
        - columnheader "Group":
          - text: Group
          - img
        - columnheader "Spent":
          - text: Spent
          - img
        - columnheader
    - rowgroup:
      - row "A Adam Taylortaylor.adam@example.com May 15, 2021 Russia Default ₹34,392.10 Actions for Adam Taylor":
        - cell:
          - checkbox
        - cell "A Adam Taylortaylor.adam@example.com":
          - text: A
          - link "Adam Taylor":
            - /url: /admin/customers/cust-2
          - text: taylor.adam@example.com
        - cell "May 15, 2021"
        - cell "Russia"
        - cell "Default"
        - cell "₹34,392.10"
        - cell "Actions for Adam Taylor":
          - button "Actions for Adam Taylor":
            - img
      - row "J Jessica Moorejessica-moore@example.com June 26, 2021 USA Default ₹34,980.34 Actions for Jessica Moore":
        - cell:
          - checkbox
        - cell "J Jessica Moorejessica-moore@example.com":
          - text: J
          - link "Jessica Moore":
            - /url: /admin/customers/cust-1
          - text: jessica-moore@example.com
        - cell "June 26, 2021"
        - cell "USA"
        - cell "Default"
        - cell "₹34,980.34"
        - cell "Actions for Jessica Moore":
          - button "Actions for Jessica Moore":
            - img
```

# Test source

```ts
  84  | import { createRoot } from 'react-dom/client';
  85  | import { AdminShell } from './src/components/admin/admin-shell';
  86  | import CustomersPage from './src/app/admin/(control-center)/customers/page';
  87  | import CustomerDetailPage from './src/app/admin/(control-center)/customers/[id]/page';
  88  | import './src/app/admin/admin-typography.css';
  89  | import './src/app/admin/admin-reference.css';
  90  | 
  91  | const isDetail = location.search.includes('customer-detail');
  92  | 
  93  | createRoot(document.getElementById('root')).render(
  94  |   <AdminShell ownerName="Adarsh Shukla" ownerEmail="owner@example.test">
  95  |     {isDetail ? (
  96  |       <CustomerDetailPage params={Promise.resolve({ id: 'cust-1' })} />
  97  |     ) : (
  98  |       <CustomersPage />
  99  |     )}
  100 |   </AdminShell>
  101 | );
  102 | `,
  103 |       resolveDir: process.cwd(),
  104 |       loader: "tsx",
  105 |     },
  106 |     bundle: true,
  107 |     write: false,
  108 |     outfile: "customer-fixture.js",
  109 |     platform: "browser",
  110 |     jsx: "automatic",
  111 |     define: { "process.env.NODE_ENV": '"production"' },
  112 |     plugins: [
  113 |       {
  114 |         name: "fixture-next",
  115 |         setup(b) {
  116 |           b.onResolve({ filter: /^next\/(navigation|link)$/ }, (a) => ({
  117 |             path: a.path,
  118 |             namespace: "fixture",
  119 |           }));
  120 |           b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
  121 |             resolveDir: process.cwd(),
  122 |             contents: a.path.endsWith("navigation")
  123 |               ? 'export const usePathname=()=>"/admin/customers";export const useRouter=()=>({push:()=>{}});'
  124 |               : `import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`,
  125 |           }));
  126 |         },
  127 |       },
  128 |     ],
  129 |   });
  130 | 
  131 |   js = result.outputFiles[0].text;
  132 | });
  133 | 
  134 | test("stroyka customer directory and profile pages match reference design", async ({ page }) => {
  135 |   await page.route("**/api/admin/customers", (route) => {
  136 |     if (route.request().method() === "POST") {
  137 |       route.fulfill({
  138 |         json: {
  139 |           success: true,
  140 |           customer: {
  141 |             id: "cust-new",
  142 |             name: "New Traveler",
  143 |             email: "new@example.com",
  144 |             phone: "+1 555-9999",
  145 |             country: "India",
  146 |             group: "Default",
  147 |             totalSpent: 0,
  148 |             ordersCount: 0,
  149 |             registered: "Today",
  150 |           },
  151 |         },
  152 |       });
  153 |     } else {
  154 |       route.fulfill({ json: { success: true, customers: sampleCustomers } });
  155 |     }
  156 |   });
  157 | 
  158 |   await page.route("**/api/admin/customers/cust-1", (route) => {
  159 |     route.fulfill({ json: { success: true, customer: sampleDetailCustomer } });
  160 |   });
  161 | 
  162 |   await page.route("**/customer-fixture.js", (route) =>
  163 |     route.fulfill({ contentType: "application/javascript", body: js })
  164 |   );
  165 | 
  166 |   await page.route("**/customer-fixture?*", (route) =>
  167 |     route.fulfill({
  168 |       contentType: "text/html",
  169 |       body: `<html><style>body{margin:0}*{box-sizing:border-box}</style><style>${css}</style><div id="root"></div><script src="/customer-fixture.js"></script></html>`,
  170 |     })
  171 |   );
  172 | 
  173 |   await page.setViewportSize({ width: 1440, height: 1000 });
  174 | 
  175 |   // 1. Test Customer List Page
  176 |   await page.goto("http://localhost:3000/customer-fixture?customers");
  177 | 
  178 |   // Verify Breadcrumb and Title
  179 |   await expect(page.locator(".admin-breadcrumb")).toBeVisible();
  180 |   await expect(page.getByRole("heading", { name: "Customers", exact: true })).toBeVisible();
  181 | 
  182 |   // Verify Yellow "New customer" button
  183 |   const newCustBtn = page.getByRole("button", { name: "New customer", exact: true });
> 184 |   await expect(newCustBtn).toBeVisible();
      |                            ^ Error: expect(locator).toBeVisible() failed
  185 | 
  186 |   // Verify Search Bar inside Card
  187 |   const searchInput = page.getByPlaceholder("Start typing to search for customers");
  188 |   await expect(searchInput).toBeVisible();
  189 | 
  190 |   // Verify Table Headers
  191 |   await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  192 |   await expect(page.getByRole("columnheader", { name: "Registered" })).toBeVisible();
  193 |   await expect(page.getByRole("columnheader", { name: "Country" })).toBeVisible();
  194 |   await expect(page.getByRole("columnheader", { name: "Group" })).toBeVisible();
  195 |   await expect(page.getByRole("columnheader", { name: "Spent" })).toBeVisible();
  196 | 
  197 |   // Verify Customer Rows
  198 |   await expect(page.getByRole("link", { name: "Jessica Moore" })).toBeVisible();
  199 |   await expect(page.getByText("jessica-moore@example.com")).toBeVisible();
  200 |   await expect(page.getByRole("link", { name: "Adam Taylor" })).toBeVisible();
  201 |   await expect(page.getByText("taylor.adam@example.com")).toBeVisible();
  202 | 
  203 |   // Test Search Filter
  204 |   await searchInput.fill("Adam");
  205 |   await expect(page.getByRole("link", { name: "Adam Taylor" })).toBeVisible();
  206 |   await expect(page.getByRole("link", { name: "Jessica Moore" })).toHaveCount(0);
  207 |   await searchInput.fill("");
  208 | 
  209 |   // Test New Customer Modal
  210 |   await newCustBtn.click();
  211 |   await expect(page.getByRole("heading", { name: "New Customer", exact: true })).toBeVisible();
  212 |   await page.getByPlaceholder("e.g. Jessica Moore").fill("New Traveler");
  213 |   await page.getByPlaceholder("jessica-moore@example.com").fill("new@example.com");
  214 |   await page.getByRole("button", { name: "Cancel", exact: true }).click();
  215 |   await expect(page.getByRole("heading", { name: "New Customer" })).toHaveCount(0);
  216 | 
  217 |   // 2. Test Customer Detail Page
  218 |   await page.goto("http://localhost:3000/customer-fixture?customer-detail");
  219 | 
  220 |   // Verify Customer Name Heading and Breadcrumb
  221 |   await expect(page.locator("h1", { hasText: "Jessica Moore" })).toBeVisible();
  222 |   await expect(page.locator("h2", { hasText: "Jessica Moore" })).toBeVisible();
  223 |   await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeVisible();
  224 |   await expect(page.getByRole("button", { name: "Edit", exact: true })).toBeVisible();
  225 | 
  226 |   // Verify Left Profile Card
  227 |   await expect(page.getByText("+38 (094) 730-24-25")).toBeVisible();
  228 |   await expect(page.getByText("Last Order")).toBeVisible();
  229 |   await expect(page.getByText("Average Order Value")).toBeVisible();
  230 |   await expect(page.getByText("Registered")).toBeVisible();
  231 |   await expect(page.getByText("Email Marketing")).toBeVisible();
  232 | 
  233 |   // Verify Right 3 Cards: Notes, Orders, Addresses
  234 |   await expect(page.getByText("Notes about customer")).toBeVisible();
  235 |   await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
  236 |   await expect(page.getByRole("heading", { name: "Addresses", exact: true })).toBeVisible();
  237 |   await expect(page.getByRole("button", { name: "New address", exact: true })).toBeVisible();
  238 |   await expect(page.getByText("Random Federation 115302")).toBeVisible();
  239 | });
  240 | 
```