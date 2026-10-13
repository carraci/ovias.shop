import { defineConfig, devices } from "@playwright/test";
const port = process.env.OVIA_TEST_PORT || "3128";
const baseURL = process.env.OVIA_TEST_BASE_URL || `http://localhost:${port}`;
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: process.env.PLAYWRIGHT_CHANNEL || undefined } }],
  webServer: {
    command: "node --env-file-if-exists=.env.local --import tsx scripts/start-ci-browser-fixture.mjs",
    url: baseURL,
    reuseExistingServer: false,
    env: { OVIA_TEST_PORT: port, OVIA_TEST_BASE_URL: baseURL },
    timeout: 120000,
  },
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "artifacts/ci-browser-report", open: "never" }]],
});
