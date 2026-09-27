import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Open navigation" }).click();
console.log(await page.locator("header").innerHTML());
console.log(
  await page.getByRole("button", { name: "Luggage", exact: true }).count(),
);
await page.screenshot({ path: "artifacts/mobile-menu.png" });
await browser.close();
