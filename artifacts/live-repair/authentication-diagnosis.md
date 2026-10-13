# OVIA authentication repair — 13 October 2026

Production target: https://www.ovias.shop/, `carracis-projects/ovias-shop-irem`, project `prj_BUKxg1nIIUPKs9A2QXMy1qZpa5UU`, active deployment `dpl_B8JwRibhA8jnridAxG8oHK7rdFY4` from commit `bb1caa44a1ef60879ca1fe17499105a8febf779c`.

## Verified evidence

- Live `GET /api/auth/social` returns HTTP 200 with `google:false` and `apple:false`.
- Live `POST /api/auth/social/google/start` from the canonical www origin returns HTTP 503: "Google sign-in needs provider configuration." Login stops before contacting Google.
- The deployment contains the Google environment variable names. They were created before this deployment, so merely redeploying stale variables is not an established fix. Their sensitive values cannot be read back.
- The readiness gate requires HTTPS, MongoDB, a JWT secret of at least 32 characters, and Google client ID/secret. Production has an accepted HTTPS origin and working MongoDB reads; the hidden authentication values need checking.
- Local Google credentials pass a safe invalid-code token exchange (`invalid_grant`, rather than `invalid_client`). OAuth initialization with that client and the exact production callback reaches Google's `redirect_uri_mismatch` error. No Google account login or consent was performed.
- The live password recovery request succeeded at 2026-10-12 22:45:55 UTC. Resend records the corresponding OTP email as `delivered`, created at 22:45:58 UTC (13 October, 04:15:58 IST). This means the receiving mail server accepted it; it does not establish placement in the primary inbox. Check Spam, Promotions and All Mail for "Your OVIA Security Verification Code".
- The reported account already exists and is verified. Creating it again cannot create a second account. Use sign-in or password recovery. The password itself has not been requested, read or verified.
- This inspection did not send a new email or OTP, reset a password, charge a payment, change production configuration, or deploy code.

## Prepared local changes

- A pending registration can retry verification with its original password after an email provider failure, rather than being permanently rejected as a duplicate. The retry preserves the account ID, password and original profile. A different password or a verified account is still rejected.
- The verification screen explains where to look for a missing message and the ten-minute expiry, and avoids claiming delivery for an unknown address.
- The existing pending account refresh fix applies authentication independently of a delayed cart response.

Verification: 28/28 targeted registration, recovery, email delivery and password policy checks passed using isolated MongoDB/provider fixtures; TypeScript passed. These checks did not send real emails. Browser results are recorded separately.

## Exact production repair

1. In Google Auth Platform → Clients → the existing Web application client used by the working local configuration, add this authorized redirect URI and save:

   `https://www.ovias.shop/api/auth/social/google/callback`

2. Restore Production `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` using the verified local pair. Confirm Production `JWT_SECRET` is populated and at least 32 characters; preserve it if valid. Replacing a signing secret invalidates existing login cookies, so any replacement must be explicit.
3. Keep `APP_ORIGIN=https://www.ovias.shop`. Release the tested authentication changes to the verified project. Payment activation is a separate pending repair and is not part of this authentication release.
4. Confirm the live provider endpoint returns `google:true`, Google initiation opens the account chooser without a redirect mismatch, and the returning callback establishes an OVIA session. Full provider sign-in requires the owner to use their Google account; no credentials should be shared in chat.
5. Ask the owner to request a fresh OTP and complete recovery with the newest message. Expired or previously replaced codes must remain rejected.

References: [Google's exact redirect URI requirement](https://developers.google.com/identity/protocols/oauth2/web-server#redirect-uri_mismatch), [Resend delivery events](https://github.com/resend/resend-skills/blob/main/skills/email-best-practices/references/webhooks-events.md), [Vercel environment configuration](https://vercel.com/docs/environment-variables).

Production configuration changes and publishing remain pending the owner's go-ahead. No new credentials need to be pasted into chat; the validated local values are already available privately.
