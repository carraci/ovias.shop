import { expect, type APIRequestContext } from "@playwright/test";
import { readFile } from "node:fs/promises";
type Fixture = { origin: string; database: string; providers: string; product: { slug: string; name: string; sku: string } };
export async function browserFixture(baseURL?: string): Promise<Fixture> {
  const fixture = JSON.parse(await readFile("artifacts/ci-browser/environment.json", "utf8")) as Fixture;
  if (!/^ovia_verification_\d+_[a-f0-9]{12}$/.test(fixture.database) || !["localhost", "127.0.0.1"].includes(new URL(fixture.providers).hostname) || (baseURL && fixture.origin !== baseURL)) throw new Error("An owned isolated browser fixture is required.");
  return fixture;
}
export async function resetFixtureLimits(baseURL?: string) {
  const fixture = await browserFixture(baseURL);
  const response = await fetch(`${fixture.providers}/control/reset-limits`, { method: "POST" });
  expect(response.ok).toBe(true);
}
export async function fixtureEmailOtp(email: string): Promise<string> {
  const fixture = await browserFixture();
  let code = "";
  await expect.poll(async () => {
    const ledger = await (await fetch(`${fixture.providers}/control/ledger`)).json();
    const messages = ledger.emails.filter((mail: { to: string[] }) => mail.to.some(value => value.toLowerCase() === email.toLowerCase()));
    code = messages.reverse().map((mail: { text: string }) => /\b\d{6}\b/.exec(mail.text)?.[0]).find(Boolean) || "";
    return code;
  }).toMatch(/^\d{6}$/);
  return code;
}
export async function registerVerified(request: APIRequestContext, email: string, password = "Browser!Travel2026", name = "Browser Traveler") {
  const registration = await request.post("/api/v1/auth/register", { data: { name, email, password, confirmPassword: password, terms: "on" } });
  expect(registration.status()).toBe(200);
  expect((await registration.json()).data.verificationRequired).toBe(true);
  const before = await request.get("/api/v1/account");
  expect((await before.json()).data.user).toBeNull();
  const otp = await fixtureEmailOtp(email);
  const verified = await request.post("/api/v1/auth/verify-email", { data: { email, otp } });
  expect(verified.status()).toBe(200);
  expect((await verified.json()).data.user.email).toBe(email.toLowerCase());
  return otp;
}
