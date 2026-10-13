import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: ["razorpay-checkout.spec.ts", "full-support-customer.spec.ts"],
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 2,
  use: { baseURL: "http://localhost:3000", channel: "msedge", trace: "retain-on-failure" },
  outputDir: "artifacts/focused-browser-results",
  reporter: [["line"], ["html", { outputFolder: "artifacts/focused-browser-report", open: "never" }]],
});
