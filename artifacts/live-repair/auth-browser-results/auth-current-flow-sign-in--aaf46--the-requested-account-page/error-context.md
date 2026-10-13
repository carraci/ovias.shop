# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-current-flow.spec.ts >> sign-in updates account state before a delayed cart and then opens the requested account page
- Location: tests\browser\auth-current-flow.spec.ts:26:5

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByRole('link', { name: 'My account', exact: true })
Expected: "/account"
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByRole('link', { name: 'My account', exact: true }) with timeout 10000ms
  - waiting for getByRole('link', { name: 'My account', exact: true })

```

```yaml
- link "Skip to content":
  - /url: "#main"
- main:
  - link "OVIA Home":
    - /url: /
    - text: OVIA
  - heading "Sign in to your account" [level=1]
  - paragraph: Access your OVIA account to manage your orders, wishlist and personal details.
  - text: Email address
  - textbox "Email address":
    - /placeholder: you@example.com
  - text: Password
  - textbox "Password":
    - /placeholder: ••••••••
    - text: Original-password-123
  - button "Show password":
    - img
  - button "Forgot your password?"
  - button "SIGN IN →"
  - text: or
  - group "Social sign-in":
    - button "Sign in with Google"
  - paragraph: Continue securely with Google.
  - paragraph:
    - text: By continuing, you agree to our
    - link "Terms":
      - /url: /terms
    - text: and
    - link "Privacy Policy":
      - /url: /privacy
    - text: .
  - heading "Don't have an account?" [level=2]
  - paragraph: Join OVIA for a seamless shopping experience.
  - list:
    - listitem:
      - img
      - text: View and track your orders
    - listitem:
      - img
      - text: Save your delivery addresses
    - listitem:
      - img
      - text: Personalise your experience
    - listitem:
      - img
      - text: Get exclusive updates
  - button "CREATE ACCOUNT"
- button "Connect with OVIA Client Service on WhatsApp (7410724158)"
- status
- alert
```

# Test source

```ts
  1   | import { test, expect, type Page, type Route } from "@playwright/test";
  2   | 
  3   | const fixtureUser = { id: "auth-browser-fixture", name: "Browser Fixture", email: "auth-browser@example.test", role: "CUSTOMER" };
  4   | const cart = { lines: [], total: 0, version: 0 };
  5   | 
  6   | // Every browser API request is intercepted. These scenarios never write to MongoDB or send email.
  7   | async function mockApis(page: Page, handler: (route: Route, path: string) => Promise<boolean>, signedIn: () => boolean = () => false) {
  8   |   await page.route("**/api/**", async route => {
  9   |     const path = new URL(route.request().url()).pathname;
  10  |     if (await handler(route, path)) return;
  11  |     if (path === "/api/v1/account") return route.fulfill({ json: { data: { user: signedIn() ? fixtureUser : null } } });
  12  |     if (path === "/api/v1/cart") return route.fulfill({ json: { data: cart } });
  13  |     if (path === "/api/auth/social") return route.fulfill({ json: { data: { google: true, apple: false } } });
  14  |     if (path === "/api/support/realtime") return route.fulfill({ status: 401, json: { error: { message: "Fixture realtime disabled" } } });
  15  |     if (route.request().method() !== "GET" && !/analytics|heartbeat|wishlist/.test(path)) {
  16  |       throw new Error(`Unexpected mutation blocked: ${route.request().method()} ${path}`);
  17  |     }
  18  |     await route.fulfill({ json: { data: [] } });
  19  |   });
  20  | }
  21  | 
  22  | async function fillCode(page: Page, code: string) {
  23  |   for (let index = 0; index < code.length; index++) await page.getByLabel(`Digit ${index + 1}`, { exact: true }).fill(code[index]);
  24  | }
  25  | 
  26  | test("sign-in updates account state before a delayed cart and then opens the requested account page", async ({ page }) => {
  27  |   let signedIn = false;
  28  |   let delayedCart: Route | undefined;
  29  |   await mockApis(page, async (route, path) => {
  30  |     if (path === "/api/v1/auth/login") {
  31  |       expect(route.request().postDataJSON()).toEqual({ email: fixtureUser.email, password: "Original-password-123" });
  32  |       signedIn = true;
  33  |       await route.fulfill({ json: { data: { user: fixtureUser } } });
  34  |       return true;
  35  |     }
  36  |     if (path === "/api/v1/cart" && signedIn && !delayedCart) {
  37  |       delayedCart = route;
  38  |       return true;
  39  |     }
  40  |     return false;
  41  |   }, () => signedIn);
  42  |   await page.goto("/account/sign-in?next=/account/notifications");
  43  |   await page.getByLabel("Email address", { exact: true }).fill(fixtureUser.email);
  44  |   await page.getByLabel("Password", { exact: true }).fill("Original-password-123");
  45  |   await page.getByRole("button", { name: "SIGN IN →", exact: true }).click();
> 46  |   await expect(page.getByRole("link", { name: "My account", exact: true })).toHaveAttribute("href", "/account");
      |                                                                             ^ Error: expect(locator).toHaveAttribute(expected) failed
  47  |   await expect.poll(() => Boolean(delayedCart)).toBe(true);
  48  |   await delayedCart!.fulfill({ json: { data: cart } });
  49  |   await expect(page).toHaveURL(/\/account\/notifications$/);
  50  |   await expect(page.getByRole("heading", { name: "Account activity.", exact: true })).toBeVisible();
  51  | });
  52  | 
  53  | test("registration shows email-provider failure and a retry advances to six-digit verification", async ({ page }) => {
  54  |   let attempts = 0;
  55  |   await mockApis(page, async (route, path) => {
  56  |     if (path !== "/api/v1/auth/register") return false;
  57  |     const body = route.request().postDataJSON();
  58  |     expect(body.email).toBe(fixtureUser.email);
  59  |     expect(body.terms).toBe("on");
  60  |     attempts++;
  61  |     await route.fulfill(attempts === 1
  62  |       ? { status: 502, json: { error: { message: "Verification email could not be sent. Please try again." } } }
  63  |       : { json: { data: { verificationRequired: true, email: fixtureUser.email } } });
  64  |     return true;
  65  |   });
  66  |   await page.goto("/account/register");
  67  |   await page.getByLabel(/^First name/).fill("Browser");
  68  |   await page.getByLabel(/^Last name/).fill("Fixture");
  69  |   await page.getByLabel(/^Email address/).fill(fixtureUser.email);
  70  |   await page.getByLabel(/^Password/).fill("Original-password-123");
  71  |   await page.getByLabel(/^Confirm password/).fill("Original-password-123");
  72  |   await page.getByRole("checkbox", { name: /I accept/ }).check();
  73  |   await page.getByRole("button", { name: "CREATE ACCOUNT →", exact: true }).click();
  74  |   await expect(page.getByRole("alert")).toContainText("Verification email could not be sent");
  75  |   await expect(page.getByRole("heading", { name: "Create your OVIA account" })).toBeVisible();
  76  |   await page.getByRole("button", { name: "CREATE ACCOUNT →", exact: true }).click();
  77  |   await expect(page.getByRole("heading", { name: "Enter verification code" })).toBeVisible();
  78  |   await expect(page.getByRole("group", { name: "6-digit verification code" }).getByRole("textbox")).toHaveCount(6);
  79  |   await expect(page.getByRole("button", { name: "VERIFY CODE →", exact: true })).toBeDisabled();
  80  |   expect(attempts).toBe(2);
  81  | });
  82  | 
  83  | test("recovery rejects a wrong code, accepts the correct code and keeps reset authorization in memory", async ({ page }) => {
  84  |   let attempts = 0;
  85  |   let resetRequests = 0;
  86  |   const resetToken = "browser-fixture-reset-authorization";
  87  |   await mockApis(page, async (route, path) => {
  88  |     if (path === "/api/v1/auth/forgot-password") {
  89  |       expect(route.request().postDataJSON()).toEqual({ email: fixtureUser.email });
  90  |       await route.fulfill({ json: { data: { message: "If the account exists, a code was sent." } } });
  91  |       return true;
  92  |     }
  93  |     if (path === "/api/v1/auth/verify-otp") {
  94  |       attempts++;
  95  |       expect(route.request().postDataJSON().otp).toBe(attempts === 1 ? "123456" : "654321");
  96  |       await route.fulfill(attempts === 1
  97  |         ? { status: 400, json: { error: { message: "Invalid or expired code. 4 of 5 attempts remaining." } } }
  98  |         : { json: { data: { resetToken } } });
  99  |       return true;
  100 |     }
  101 |     if (path === "/api/v1/auth/reset-password") {
  102 |       resetRequests++;
  103 |       expect(route.request().postDataJSON()).toEqual({ resetToken, newPassword: "Replacement-password-456" });
  104 |       await route.fulfill({ json: { data: { message: "Password updated. Sign in with your new password." } } });
  105 |       return true;
  106 |     }
  107 |     return false;
  108 |   });
  109 |   await page.goto("/account/forgot-password");
  110 |   await page.getByLabel("Email address", { exact: true }).fill(fixtureUser.email);
  111 |   await page.getByRole("button", { name: "SEND VERIFICATION CODE →", exact: true }).click();
  112 |   await expect(page.getByRole("heading", { name: "Enter verification code" })).toBeVisible();
  113 |   await fillCode(page, "123456");
  114 |   await page.getByRole("button", { name: "VERIFY CODE →", exact: true }).click();
  115 |   await expect(page.getByRole("alert")).toContainText("4 of 5 attempts remaining");
  116 |   await fillCode(page, "654321");
  117 |   await page.getByRole("button", { name: "VERIFY CODE →", exact: true }).click();
  118 |   await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  119 |   expect(await page.evaluate(() => JSON.stringify({ url: location.href, local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain(resetToken);
  120 |   await page.getByLabel("New password", { exact: true }).fill("Replacement-password-456");
  121 |   await page.getByLabel("Confirm new password", { exact: true }).fill("Different-password-789");
  122 |   await page.getByRole("button", { name: "RESET PASSWORD →", exact: true }).click();
  123 |   await expect(page.getByRole("alert")).toContainText("Passwords must match.");
  124 |   expect(resetRequests).toBe(0);
  125 |   await page.getByLabel("Confirm new password", { exact: true }).fill("Replacement-password-456");
  126 |   await page.getByRole("button", { name: "RESET PASSWORD →", exact: true }).click();
  127 |   await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();
  128 |   await expect(page.getByText("Your password has been reset. Please sign in.", { exact: true })).toBeVisible();
  129 |   expect(resetRequests).toBe(1);
  130 | });
  131 | 
  132 | test("Google provider errors remain visible and allow a retry instead of silently navigating", async ({ page }) => {
  133 |   let attempts = 0;
  134 |   await mockApis(page, async (route, path) => {
  135 |     if (path !== "/api/auth/social/google/start") return false;
  136 |     attempts++;
  137 |     expect(route.request().postDataJSON()).toEqual({ intent: "signin", terms: "on" });
  138 |     await route.fulfill({ status: 503, json: { error: { message: "Google sign-in is unavailable. Please try email and password." } } });
  139 |     return true;
  140 |   });
  141 |   await page.goto("/account/sign-in");
  142 |   const google = page.getByRole("button", { name: "Sign in with Google", exact: true });
  143 |   await expect(google).toBeEnabled();
  144 |   await google.click();
  145 |   await expect(page.getByRole("alert")).toContainText("Google sign-in is unavailable");
  146 |   await expect(google).toBeEnabled();
```