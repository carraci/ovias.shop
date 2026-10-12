# Activate Google and Apple sign-in for OVIA

The integration is implemented in the existing app. Real authentication remains disabled per provider until its server credentials are configured. No provider secrets go to the browser. No production auth deployment was performed.

## Google

1. In Google Cloud Console, create/select your project. Configure Google Auth Platform branding, audience, and contact details. Use an External audience for public customers. Follow Google testing requirements for your requested scopes; this integration requests only OpenID identity scopes.
2. Create an OAuth client with application type **Web application**.
3. Add the exact authorized redirect URI for each environment you use:
   - Local: `http://localhost:3000/api/auth/social/google/callback`
   - Production: `https://www.ovias.shop/api/auth/social/google/callback`
4. Open the existing Web application client matching your client ID. Use its saved client secret; if it was not saved, choose **Add Secret** and save the new secret immediately. Google shows the complete secret only when it is created. Put the client ID and secret in `.env.local` using the names below. Do not paste the secret into chat, commit it, or prefix it with `NEXT_PUBLIC_`.
5. Restart the local dev server. The Google button enables when configuration is available. Test with a Google account permitted by your configured audience. Publish the consent app when ready for your intended audience; complete any verification Google requires.

Official guide: https://developers.google.com/identity/openid-connect/openid-connect
Client credential management: https://support.google.com/cloud/answer/15549257

## Apple

Apple web sign-in requires Apple Developer configuration, a primary App ID enabled for Sign in with Apple, and a Services ID. A local HTTP URL or IP address cannot be an Apple callback. Use a registered public HTTPS development/staging domain for testing.

1. In Apple Developer Certificates, Identifiers & Profiles, enable Sign in with Apple on your primary App ID.
2. Create a **Services ID** for the website, enable Sign in with Apple, and associate it with the primary App ID.
3. Configure the domain `www.ovias.shop` and return URL `https://www.ovias.shop/api/auth/social/apple/callback`. Register your HTTPS staging domain and its equivalent callback separately if testing there. Use the exact host in `APP_ORIGIN`.
4. Create a Sign in with Apple key associated with that primary App ID. Download its `.p8` private key and record the Key ID and Team ID. Apple only allows downloading that key once; store it privately.
5. Set the server variables below. `APPLE_CLIENT_ID` is the **Services ID**, not the native app bundle ID. The app creates short-lived signed client secrets server-side; you do not need to paste a generated JWT into the environment.
6. For Vercel, enter these values in project Settings → Environment Variables for the intended environment. Set `APP_ORIGIN` to the exact public HTTPS origin, configure the existing MongoDB and a stable `JWT_SECRET` of at least 32 characters, then redeploy after review.

Official guide: https://developer.apple.com/documentation/signinwithapple/configuring-your-webpage-for-sign-in-with-apple

## Server environment variables

```dotenv
APP_ORIGIN=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

For the Apple key, use a quoted multiline PKCS8 PEM in the local env file, or a string containing literal `\n` separators. In Vercel, paste the complete PEM as the private environment variable value. Never share or commit it. Preserve existing MongoDB/JWT/email/payment variables.

## Behavior and verification

- Both providers use full-page redirects, suitable for mobile browsers; no popup dependency or third-party JS SDK.
- Callbacks verify signed ID tokens, issuer, audience, expiry, nonce, browser-bound state, and one-time state consumption. Google also uses PKCE. Apple uses HTTPS `form_post` with a Secure, HttpOnly, SameSite=None flow cookie.
- Accounts and sessions use the existing OVIA database and session cookie. Guest carts merge into the account, including the Apple cross-site callback.
- Provider access/refresh tokens and private keys are not stored in account records. Provider subject IDs are hashed in permanent social-identity records in the existing `tokens` collection. Short-lived flow records use its existing cleanup TTL.
- Existing verified OVIA accounts with an exact matching Gmail address can sign in directly after Google verifies the signed token and Gmail ownership. The verified provider subject is then bound atomically to that account, and subsequent logins use that subject. Google is authoritative for Gmail addresses: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token. External-domain Google emails, Workspace, Apple, unverified OVIA accounts, and mapping conflicts continue to require the existing secure linking flow. Sign in to OVIA, open **Account → Personal details → Account security & connected sign-in**, then connect the provider. Explicit linking requires the initiating OVIA session to remain valid.
- Apple Hide My Email is supported. A new account uses the verified relay address; returning login uses the provider subject even if Apple omits the email/name later. If sending OVIA mail to relay addresses, configure Apple's permitted email sources for your sending domain.
- Cancellation, expired callbacks, missing configuration, and provider failures display recoverable feedback. Social-only users can use existing password recovery to set an OVIA password.

After entering real credentials, manually test consent success, cancellation, repeat login, existing-account linking, cart retention, logout, and recovery on Chrome/Edge, Safari/iOS, and Android. Automated tests verify cryptography, state/replay protections, linking rules, and responsive button flows with simulated providers. They do not establish a successful live Google/Apple login without your provider setup.
