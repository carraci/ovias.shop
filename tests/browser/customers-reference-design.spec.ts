import { test, expect } from "@playwright/test";
import { build } from "esbuild";

let js = "", css = "";

const sampleCustomers = [
  {
    id: "cust-1",
    name: "Jessica Moore",
    email: "jessica-moore@example.com",
    phone: "+38 (094) 730-24-25",
    ordersCount: 7,
    totalSpent: 34980.34,
    registered: "June 26, 2021",
    country: "USA",
    group: "Default",
    status: "Active",
    avatar: "",
  },
  {
    id: "cust-2",
    name: "Adam Taylor",
    email: "taylor.adam@example.com",
    phone: "+1 555-0192",
    ordersCount: 3,
    totalSpent: 34392.1,
    registered: "May 15, 2021",
    country: "Russia",
    group: "Default",
    status: "Active",
    avatar: "",
  },
];

const sampleDetailCustomer = {
  id: "cust-1",
  name: "Jessica Moore",
  email: "jessica-moore@example.com",
  phone: "+38 (094) 730-24-25",
  totalSpent: 34980.34,
  ordersCount: 7,
  registered: "2 months ago",
  averageOrderValue: 574,
  emailMarketing: "Subscribed",
  latestNote: "VIP customer interested in luxury travel luggage.",
  lastOrder: {
    id: "#80294",
    date: "Today at 6:10 pm",
    relative: "7 days ago",
    amount: "₹320.00",
  },
  orders: [
    {
      id: "#80294",
      date: "Today at 6:10 pm",
      status: "Pending",
      items: 4,
      amount: "$320.00",
      rawAmount: 320,
    },
    {
      id: "#63736",
      date: "May 15, 2019",
      status: "Completed",
      items: 7,
      amount: "$2,574.31",
      rawAmount: 2574.31,
    },
  ],
  addresses: [
    {
      id: "addr-1",
      name: "Jessica Moore",
      address: "Random Federation 115302, Moscow ul. Varshavskaya, 15-2-178",
    },
  ],
};

test.beforeAll(async () => {
  const result = await build({
    stdin: {
      contents: `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdminShell } from './src/components/admin/admin-shell';
import CustomersPage from './src/app/admin/(control-center)/customers/page';
import CustomerDetailPage from './src/app/admin/(control-center)/customers/[id]/page';
import './src/app/admin/admin-typography.css';
import './src/app/admin/admin-reference.css';

const isDetail = location.search.includes('customer-detail');

createRoot(document.getElementById('root')).render(
  <AdminShell ownerName="Adarsh Shukla" ownerEmail="owner@example.test">
    {isDetail ? (
      <CustomerDetailPage params={Promise.resolve({ id: 'cust-1' })} />
    ) : (
      <CustomersPage />
    )}
  </AdminShell>
);
`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    outfile: "customer-fixture.js",
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "fixture-next",
        setup(b) {
          b.onResolve({ filter: /^next\/(navigation|link)$/ }, (a) => ({
            path: a.path,
            namespace: "fixture",
          }));
          b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
            resolveDir: process.cwd(),
            contents: a.path.endsWith("navigation")
              ? 'export const usePathname=()=>"/admin/customers";export const useRouter=()=>({push:()=>{}});'
              : `import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`,
          }));
        },
      },
    ],
  });

  js = result.outputFiles[0].text;
});

test("stroyka customer directory and profile pages match reference design", async ({ page }) => {
  await page.route("**/api/admin/customers", (route) => {
    if (route.request().method() === "POST") {
      route.fulfill({
        json: {
          success: true,
          customer: {
            id: "cust-new",
            name: "New Traveler",
            email: "new@example.com",
            phone: "+1 555-9999",
            country: "India",
            group: "Default",
            totalSpent: 0,
            ordersCount: 0,
            registered: "Today",
          },
        },
      });
    } else {
      route.fulfill({ json: { success: true, customers: sampleCustomers } });
    }
  });

  await page.route("**/api/admin/customers/cust-1", (route) => {
    route.fulfill({ json: { success: true, customer: sampleDetailCustomer } });
  });

  await page.route("**/customer-fixture.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: js })
  );

  await page.route("**/customer-fixture?*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><style>body{margin:0}*{box-sizing:border-box}</style><style>${css}</style><div id="root"></div><script src="/customer-fixture.js"></script></html>`,
    })
  );

  await page.setViewportSize({ width: 1440, height: 1000 });

  // 1. Test Customer List Page
  await page.goto("http://localhost:3000/customer-fixture?customers");

  // Verify Breadcrumb and Title
  await expect(page.locator(".admin-breadcrumb")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customers", exact: true })).toBeVisible();

  // Verify Yellow "New customer" button
  const newCustBtn = page.getByRole("button", { name: "New customer", exact: true });
  await expect(newCustBtn).toBeVisible();

  // Verify Search Bar inside Card
  const searchInput = page.getByPlaceholder("Start typing to search for customers");
  await expect(searchInput).toBeVisible();

  // Verify Table Headers
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Registered" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Country" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Group" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Spent" })).toBeVisible();

  // Verify Customer Rows
  await expect(page.getByRole("link", { name: "Jessica Moore" })).toBeVisible();
  await expect(page.getByText("jessica-moore@example.com")).toBeVisible();
  await expect(page.getByRole("link", { name: "Adam Taylor" })).toBeVisible();
  await expect(page.getByText("taylor.adam@example.com")).toBeVisible();

  // Test Search Filter
  await searchInput.fill("Adam");
  await expect(page.getByRole("link", { name: "Adam Taylor" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Jessica Moore" })).toHaveCount(0);
  await searchInput.fill("");

  // Test New Customer Modal
  await newCustBtn.click();
  await expect(page.getByRole("heading", { name: "New Customer", exact: true })).toBeVisible();
  await page.getByPlaceholder("e.g. Jessica Moore").fill("New Traveler");
  await page.getByPlaceholder("jessica-moore@example.com").fill("new@example.com");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "New Customer" })).toHaveCount(0);

  // 2. Test Customer Detail Page
  await page.goto("http://localhost:3000/customer-fixture?customer-detail");

  // Verify Customer Name Heading and Breadcrumb
  await expect(page.locator("h1", { hasText: "Jessica Moore" })).toBeVisible();
  await expect(page.locator("h2", { hasText: "Jessica Moore" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit", exact: true })).toBeVisible();

  // Verify Left Profile Card
  await expect(page.getByText("+38 (094) 730-24-25")).toBeVisible();
  await expect(page.getByText("Last Order")).toBeVisible();
  await expect(page.getByText("Average Order Value")).toBeVisible();
  await expect(page.getByText("Registered")).toBeVisible();
  await expect(page.getByText("Email Marketing")).toBeVisible();

  // Verify Right 3 Cards: Notes, Orders, Addresses
  await expect(page.getByText("Notes about customer")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Addresses", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "New address", exact: true })).toBeVisible();
  await expect(page.getByText("Random Federation 115302")).toBeVisible();
});
