import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "auth-current-flow.spec.ts",
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  use: { baseURL: "http://localhost:3000", channel: "msedge", trace: "retain-on-failure" },
  outputDir: "artifacts/live-repair/auth-browser-results",
  reporter: [["line"], ["html", { outputFolder: "artifacts/live-repair/auth-browser-report", open: "never" }], ["json", { outputFile: "artifacts/live-repair/auth-browser-results.json" }]],
});
