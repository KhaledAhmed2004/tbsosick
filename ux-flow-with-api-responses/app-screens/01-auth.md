# Screen 1: Auth (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Profile](./06-profile.md) (change password, logout)
> **Doc version**: `v3` — last reviewed `2026-04-29` (Q1-Q5 resolved; see [Resolved Decisions](#resolved-decisions))

---

## Common UI Rules

These apply to every flow on this screen — don't repeat them in each section.

- **Submit-button protection**: Every submit button (Login, Create Account, Verify OTP, Send OTP, Reset Password, Sign in with Google/Apple) is **disabled the moment it's tapped** and shows a spinner until the request settles. Re-enable on `200`, `4xx`, `5xx`, or network-failure. _Reason_: prevents double-submit on slow networks (a top-3 production-incident class for auth).
- **Network offline**: Before any submit, check connectivity. If offline → show inline message: _"You're offline. Check your connection and try again."_ Don't fire the request.
- **Generic 5xx**: For any unexpected `500`/`502`/`503` → show toast: _"Something went wrong. Please try again."_ Log to crash reporter with request context.
- **Validation errors (`422`)**: Map server field errors to the corresponding form field inline. Never show a generic toast for validation failures.
- **Rate-limit (`429`)**: If the server returns `429`, read the `Retry-After` header. Show inline: _"Too many attempts. Try again in {N}s."_ Disable submit until the timer expires.
- **Status code mapping (auth-shaped)**:
  - `400` → invalid request shape / OTP malformed → inline error
  - `401` → bad credentials / OTP wrong / token rejected → inline error (see flow-specific copy)
  - `403` → account state issue (RESTRICTED / INACTIVE / DELETED) → toast/modal
  - `409` → conflict (email already exists, social-vs-password collision) → inline + CTA to log in
  - `422` → validation → field-level inline
  - `429` → rate-limit → inline countdown
  - `5xx` → generic toast

---

## UX Flow

### Registration Flow

1. User taps **"Create Account"** on the entry screen (entry screen = first launch lands on Login; "Create Account" is below the form).
2. Enters `name`, `email`, `password` → see [Validation Rules](#validation-rules).
3. Submits the form → calls [POST /users](../modules/user.md#21-create-user-registration--admin-create) (this endpoint lives in the user module; auth flow consumes it).
4. On `201 Created` → navigate to **OTP Verification screen** with local context `{ purpose: "REGISTRATION", email }`. Banner: _"Check your email for a 6-digit verification code. It expires in 5 minutes."_
5. If email not received → user taps **"Resend"** → calls [POST /auth/resend-verify-email](../modules/auth.md#17-resend-otp-resend-verify-email). See [Resend cooldown](#resend-otp-rate-limiting--cooldown).
6. User enters the 6-digit OTP and submits → calls [POST /auth/verify-otp](../modules/auth.md#12-verify-otp) — the screen interprets the response per [OTP Screen Routing](#otp-screen-routing).
7. On success (registration variant returns `accessToken` + `refreshToken`):
   - Tokens are persisted via [Storage & Session](#storage--session) rules — user is auto-logged-in (no separate login call).
   - Navigate to **Onboarding screen**.

> **Banglish — WHY auto-login after OTP?** Verify-otp er moddhe `verified: true` set hoye token issue hoye jay jate user notun account banano-r por abar manually login na korte hoy — ek-step kom = drop-off rate kom.

**Edge — Re-registration before OTP verified**: If the user re-submits `POST /users` with the same email before verifying, the server returns `409` (see [Email Already Registered](#email-already-registered-registration)). To trigger a *new* OTP, use **Resend** on the OTP screen — re-creating the account is not the path.

**Edge — App killed mid-OTP (state persistence)**: The OTP screen state **does** survive a cold-start within a TTL window (industry pattern: WhatsApp, Signal, Firebase Phone Auth). On reaching the OTP screen, persist `{ purpose, email, sentAt }` to encrypted local storage. On cold-start:
- If a non-expired OTP context exists (`now - sentAt < 5 min`) → deep-link directly to OTP screen with email pre-filled and a banner: _"Continue verification — code sent X min ago. Resend if needed."_ User finishes verification without restarting the flow.
- If TTL expired → clear the persisted context and route to Login.
- On successful verification, "Cancel", or explicit Login navigation → clear immediately.

_Rationale_: ~15-20% drop-off reduction at the OTP step (industry benchmark). Security posture is unchanged — the OTP itself is the auth gate; persisting only the email and `sentAt` exposes nothing sensitive.

---

### Login Flow

1. User enters `email` + `password`, optionally with `deviceToken` (FCM) attached automatically — see [deviceToken lifecycle](#devicetoken-lifecycle).
2. Taps **Login** → calls [POST /auth/login](../modules/auth.md#11-login).
3. On `200`:
   - Tokens received → persisted via [Storage & Session](#storage--session).
   - Navigate to **Home screen**.
4. On `401 EMAIL_NOT_VERIFIED` (the user registered but never verified) → silently call [POST /auth/resend-verify-email](../modules/auth.md#17-resend-otp-resend-verify-email), then navigate to **OTP Verification screen** with `{ purpose: "REGISTRATION", email }` and toast: _"Please verify your email first. We've sent you a new code."_
5. On `401 INVALID_CREDENTIALS` → see [Wrong Email or Password](#wrong-email-or-password-login).
6. On `403` → see [Account Restricted](#account-restricted-or-inactive-login).
7. On `429` → see [Common UI Rules → Rate-limit](#common-ui-rules).
8. If user taps **"Forgot Password?"** → start [Forgot Password Flow](#forgot-password-flow).

> **Banglish — WHY does login return tokens in body and the server also sets a cookie?** Backend ekta endpoint diye web + mobile dui jaiga support kore. Mobile body theke token nay (cookies mobile-e proper-vabe kaaj kore na), web cookie use kore. Eta intentional, na bug — see [Storage & Session](#storage--session).

---

### Social Login Flow (Google / Apple)

1. User taps **"Sign in with Google"** or **"Sign in with Apple"**.
2. The Flutter SDK (`google_sign_in` / `sign_in_with_apple`) shows the native sheet.
3. After successful SDK auth, an `idToken` (and `nonce` for Apple) is returned.
4. App sends payload to server → calls [POST /auth/social-login](../modules/auth.md#18-social-login-google--apple) with `{ provider, idToken, nonce?, deviceToken?, platform, appVersion }`.
5. On `200`:
   - Tokens received → persisted via [Storage & Session](#storage--session).
   - Navigate to **Home screen**.
6. On `409 Conflict` → see [Social Login — Email Already Has a Password Account](#social-login--email-already-has-a-password-account-409).
7. On `401` → see [Social Login — Invalid Token](#social-login--invalid-or-expired-token-401).
8. On `400` (Apple email not shared) → see [Apple Login — Email Not Shared](#apple-login--email-not-shared).

---

### Forgot Password Flow

1. User taps **"Forgot Password?"**.
2. Enters email and taps **Send OTP** → calls [POST /auth/forgot-password](../modules/auth.md#13-forgot-password).
3. **Always** show success message regardless of whether the email exists (server uses silent-success to prevent account enumeration):
   > _"If this email is registered, you'll receive a verification code shortly."_
4. Navigate to **OTP Verification screen** with local context `{ purpose: "FORGOT_PASSWORD", email }`.
5. User enters OTP → calls [POST /auth/verify-otp](../modules/auth.md#12-verify-otp). Response in this purpose returns `{ resetToken }` only — see [OTP Screen Routing](#otp-screen-routing).
6. On success → store `resetToken` in memory only (not SecureStorage — short-lived, single-use), navigate to **New Password screen**.
7. User enters and confirms new password → calls [POST /auth/reset-password](../modules/auth.md#14-reset-password) with `Authorization: Bearer {resetToken}`.
8. On `200` → toast _"Password reset successfully"_ → clear all stored sessions (server-side `tokenVersion` was bumped, so any stale tokens are now dead anyway) → navigate to **Login screen**.

> **Banglish — WHY tokenVersion bump in reset-password?** Password reset er por sob device theke logout korano-r jonno — chuirir paswword chinta korle attacker-er kache je access token chilo, oita auto-invalid hoye jay. Otherwise ekta phone harano-r por password reset koreo old phone-er attacker logged-in thakto.

---

### Token Refresh (Background)

1. Any API call returns `401 Unauthorized` → enter the refresh queue (see single-flight rule below).
2. The app calls [POST /auth/refresh-token](../modules/auth.md#15-refresh-token) sending the stored refresh token in the body.
3. **Single-flight rule (MANDATORY)**: Only **one** refresh-token request may be in-flight at a time. If 5 parallel API calls all return `401`:
   - First 401 starts the refresh and creates a "pending refresh" promise.
   - Calls 2–5 await the same promise.
   - When refresh succeeds, all 5 retry with the new access token.
   - When refresh fails, all 5 fail and the app force-logs-out once.
4. On success → original requests retry automatically with the new token. User sees no interruption.
5. On failure (`401` — token reused or `tokenVersion` mismatched):
   - Clear all storage (access token, refresh token, deviceToken cache).
   - Best-effort fire-and-forget call to [POST /auth/logout](../modules/auth.md#16-logout) is **skipped** here — the access token is already invalid, so the call would `401` anyway. The orphaned `deviceToken` server-side is acceptable; it'll get cleaned on next login.
   - Navigate to **Login screen** with toast: _"Your session has expired. Please log in again."_

> **Banglish — WHY single-flight?** Backend e refresh-token rotate hoy + reuse detection ase (`tokenVersion`). Concurrently 5 ta refresh fire korle 1st-tar baire baki 4-tay puran token reuse hobe → server force-logout fire korbe. Single-flight queue mast — eta ekta classic mobile bug, prothom production incident-er top-3 e thake.

---

## OTP Screen Routing

The OTP screen is the most ambiguous artifact in this flow because [POST /auth/verify-otp](../modules/auth.md#12-verify-otp) returns **two different response shapes** depending on the user's `verified` state. The screen disambiguates with a **local `purpose` flag** that the entry-flow attaches when navigating.

| Entry flow | Local `purpose` | Server response shape | Next screen on success |
| --- | --- | --- | --- |
| Registration | `REGISTRATION` | `{ accessToken, refreshToken }` | Onboarding |
| Login (unverified email) | `REGISTRATION` (same; user was registered but never verified) | `{ accessToken, refreshToken }` | Home |
| Forgot Password | `FORGOT_PASSWORD` | `{ resetToken }` | New Password |

**Implementation note**: `purpose` is **client-only** — it does NOT go in the request body. The server figures out the variant by checking the user's `verified` flag (see [auth.md §1.2 Business Logic](../modules/auth.md#12-verify-otp)). The client only uses `purpose` to know which key to read off the response and where to navigate next.

If the response shape doesn't match the expected `purpose` (e.g., `purpose: "FORGOT_PASSWORD"` but response has `accessToken`) → log a contract-drift error to the crash reporter and show a generic _"Something went wrong, please try again"_ toast. Never silently use the wrong key.

---

## Storage & Session

Mobile apps don't use browser cookies. The server's `httpOnly` cookie behaviour from `auth.service.ts` is for web clients (dashboard); mobile reads tokens from the response **body**.

| Token | Storage on mobile | Lifetime | Cleared when |
| --- | --- | --- | --- |
| Access token | SecureStorage (so it survives cold-start; refresh-on-401 still works seamlessly) | **15 minutes** | App logout OR token-refresh failure |
| Refresh token | **SecureStorage** (iOS Keychain / Android EncryptedSharedPreferences) | **30 days** | Logout OR refresh failure OR password reset (server bumps `tokenVersion`) |
| `resetToken` (forgot password) | **In-memory only** | Single use, ~10 min | Used OR navigate away from New Password screen |
| `deviceId` | App preferences (UUID v4 generated on first install) | Persistent | App uninstall OR explicit device unregister |
| FCM `token` | App preferences (cached for change-detection) | Until rotated by FCM | App uninstall OR device reset OR FCM rotation |

> **Proactive refresh**: With access-token TTL = 15 min, schedule a refresh at `TTL - 60s` (i.e., ~14 min after issuance) rather than waiting for `401`. Reduces user-visible latency on the next request.

**Never** store tokens in plain `SharedPreferences` / `UserDefaults` / Hive without encryption. **Never** log tokens.

> **Banglish — WHY SecureStorage?** Plain shared prefs root-er kache exposed. Keychain / EncryptedSharedPreferences hardware-backed (mostly) — physical device chuir pelo o token bar korte parbe na. Eta non-negotiable.

### Device & FCM token lifecycle

A device is now a **first-class resource**, separate from the auth flow. The auth endpoints (`/auth/login`, `/auth/social-login`, `/auth/verify-otp`) no longer need a `deviceToken` in their bodies — the app makes a dedicated call to `/devices/register` immediately after auth success.

> **Note**: This is a docs-side decision. Code currently still accepts `deviceToken` in auth bodies; transition pending — see [Open Decisions](#resolved-decisions) at the bottom of this file.

#### `POST /devices/register`

Idempotent upsert. Called after every authenticated session start AND on FCM token rotation.

**Request:**
```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "ios",
  "token": "fcm-token-abc123..."
}
```

| Field | Required | Type | Notes |
|---|---|---|---|
| `deviceId` | Yes | string (UUID v4) | Generated by the app on first install; persisted locally; stable for the install lifetime. |
| `platform` | Yes | string | `"ios"` \| `"android"` \| `"web"` |
| `token` | Yes | string | Current FCM registration token. |

**Idempotency**:
- Same `deviceId` + same `userId` → upserts the row (updates `token` if changed; no-op if identical).
- Same `token` re-submission → no-op (200 OK, same shape).
- The server enforces a unique index on `(userId, deviceId)`.

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Device registered",
  "data": { "deviceId": "550e8400-...", "registeredAt": "2026-04-29T08:00:00Z" }
}
```

#### `DELETE /devices/:deviceId`

Called on **explicit logout** (before clearing local session). Removes the device row + cancels FCM push subscription server-side.

**Response (200 OK)**:
```json
{ "success": true, "message": "Device unregistered" }
```

#### When the app calls these

| Trigger | Call |
|---|---|
| After `POST /auth/login` 200 | `POST /devices/register` |
| After `POST /auth/social-login` 200 | `POST /devices/register` |
| After `POST /auth/verify-otp` 200 (registration variant) | `POST /devices/register` |
| FCM `onTokenRefresh` event fires | `POST /devices/register` (same `deviceId`, new `token`) |
| User taps **Logout** | `DELETE /devices/:deviceId` THEN `POST /auth/logout` |
| Force-logout (refresh failure) | Skip device call (access token already invalid). Stale row gets cleaned on next login by the server's idempotent upsert (different `deviceId` rows from re-installs are handled by TTL cleanup). |

> **Not yet documented in `modules/`**: this introduces a new `device` module. Action items:
> - Add `modules/device.md` with the two endpoints above.
> - Add `/devices/*` rows to `api-inventory.md` (as 🟡 Spec Done · Code Pending).
> - Mark `deviceToken` field in `auth.md` request bodies (1.1, 1.8, 1.2) as deprecated.

---

## Validation Rules

Cross-checked against `src/app/modules/user/user.validation.ts` (source of truth — if these diverge, fix the screen, not the schema).

| Field | Rule | Inline error message |
| --- | --- | --- |
| `email` | RFC-5322-ish (Zod `.email()`); lowercase normalized client-side before submit | _"Enter a valid email address."_ |
| `password` (registration, reset) | Min 8 chars · ≥1 lowercase · ≥1 uppercase · ≥1 digit · ≥1 special char from `! @ # $ % ^ & * ( ) _ + - = { } [ ] \| ; : ' " , . < > / ?` | _"Password must include upper, lower, number, special and be 8+ chars"_ (server message verbatim) |
| `name` (registration) | Min 1 char (no upper bound enforced server-side; trim whitespace client-side and recommend ≤100 chars in UI) | _"Name is required."_ |
| `phone` (registration) | 7–15 digits, optional `+` prefix (regex: `/^\+?[0-9]{7,15}$/`) | _"Phone must be 7-15 digits, optional +"_ |
| `country` (registration) | Min 1 char | _"Country is required."_ |
| `otp` | Exactly 6 digits, numeric only — keyboard `oneTimeCode` (iOS), `numberPassword` (Android) | _"Enter the 6-digit code."_ |
| `nonce` (Apple) | Generated client-side (UUID v4 hashed); server verifies against `idToken` claim | (transparent to user) |

**Client-side password strength meter** (recommended): show a real-time strength bar as the user types — Weak (missing 2+ classes), Medium (missing 1), Strong (all 4 classes + ≥12 chars). Doesn't change server validation; just helps users hit the regex on the first try.

---

## Edge Cases

### Email Already Registered (Registration)

- **Trigger**: `POST /users` returns `409` for an email that already exists.
- **UI response**: Inline error below the email field.
- **Message**: _"An account with this email already exists. Please log in."_
- **Action**: Show **"Log in instead"** link that pre-fills the email on the Login screen.

### Wrong Email or Password (Login)

- **Trigger**: `401 INVALID_CREDENTIALS`.
- **UI response**: Inline error below the form (do NOT distinguish "wrong email" vs "wrong password" — security).
- **Message**: _"Incorrect email or password. Please try again."_
- **Action**: Clear the password field, keep the email field populated.

### Account Restricted or Inactive (Login)

- **Trigger**: `403`.
- **UI response**: Toast or modal.
- **Message** (server-driven; pass through unless empty): _"Your account is restricted. Contact support."_
- **Action**: No retry CTA — user must contact support.

### Email Not Yet Verified (Login)

- **Trigger**: `401` with `code: "EMAIL_NOT_VERIFIED"` (server distinguishes via the `verified: false` check before password compare — see [auth.md §1.1 step 2c](../modules/auth.md#11-login)).
- **UI response**: Silent — no error shown to user. Auto-resend OTP and route them.
- **Action**: Call [POST /auth/resend-verify-email](../modules/auth.md#17-resend-otp-resend-verify-email), navigate to OTP screen with `purpose: "REGISTRATION"`, show toast: _"Please verify your email first. We've sent you a new code."_

### Invalid or Expired OTP

- **Trigger**: `400` on OTP submit.
- **UI response**: Inline error below the OTP input.
- **Message**: _"Invalid or expired code. Please try again or request a new one."_
- **Action**: Clear the OTP input field; keep "Resend" available (subject to cooldown).

### Resend OTP Rate Limiting / Cooldown

- **Trigger**: User taps "Resend".
- **UI response**: Disable Resend button immediately; show 60-second countdown.
- **Cooldown source-of-truth**: Server-driven. The 60s number is the client's cached default. The server enforces real rate-limit via middleware and returns `429` with `Retry-After: <seconds>` if the user bypasses the client timer (e.g., kills the app to reset). On `429`, use `Retry-After` instead of the local 60s.
- **Cold-start behaviour**: Local cooldown does **not** persist across app-kill. The client timer is purely a UX guard — the server's `429 + Retry-After` is the real rate-limit control. If a user kills the app to reset, the next "Resend" tap fires the request and the server enforces the actual quota. Don't overengineer this client-side.
- **Message during cooldown**: _"Resend in 0:42"_.

### Login Rate-Limited (Brute Force Lockout)

- **Trigger**: `429` on `POST /auth/login` (server enforces N-failures-per-minute lockout).
- **UI response**: Inline error below the form, submit disabled until `Retry-After` expires.
- **Message**: _"Too many attempts. Try again in {N}s."_

### Network Offline

- **Trigger**: No network or request times out.
- **UI response**: Inline message below the active form (or toast for OTP screen).
- **Message**: _"You're offline. Check your connection and try again."_
- **Action**: Re-enable submit so user can retry once back online.

### Validation Error (422)

- **Trigger**: Server Zod fails (e.g., password complexity).
- **UI response**: Map each `error.path` to its form field; show inline.
- **Message**: Use server's per-field message verbatim if user-facing.

### Session Expired (Token Reuse Detected)

- **Trigger**: Background token refresh fails with `401`.
- **UI response**: Force logout (clear all storage), navigate to Login.
- **Message**: _"Your session has expired. Please log in again."_
- **Note**: This fires when (a) refresh token TTL elapsed, (b) user reset password from another device, (c) refresh token was already rotated (concurrent refresh — should be impossible if [single-flight rule](#token-refresh-background) is honored).

### Social Login — Email Already Has a Password Account (409)

- **Trigger**: User tries Google/Apple login but their email is already registered with email + password.
- **UI response**: Toast.
- **Message**: _"This email already has an account. Please log in with your email and password."_
- **Action**: Do NOT auto-link accounts. User must log in manually with the password.

> **Banglish — WHY no auto-link?** Attacker je email-er password account ase, sei email diye Google account-o banate pare. Auto-link korle attacker Google route diye victim-er account-e dhuke jabe — "Account Hijacking" attack. Manual password require kora ekmatra safe path.

### Apple Login — Email Not Shared

- **Trigger**: `400` (Apple did not provide an email — user chose "Hide My Email" first time but provider couldn't deliver, OR user revoked email sharing).
- **UI response**: Toast.
- **Message**: _"Please allow email sharing to create an account with Apple."_
- **Note**: Apple only provides the email on the very first login. Subsequent logins are matched by `appleId` (the provider's `sub`) — no email needed. If the user originally signed up with "Hide My Email", we get Apple's relay address (`xyz@privaterelay.appleid.com`) — that's fine, the relay forwards to the real inbox.

### Social Login — Invalid or Expired Token (401)

- **Trigger**: The `idToken` from the SDK is rejected by the server (network drift, clock skew, or wrong client ID).
- **UI response**: Toast.
- **Message**: _"Sign-in failed. Please try again."_
- **Action**: Allow user to retry the social login flow.

---

## Analytics & Accessibility

### Analytics events to emit

| Event | When | Properties |
| --- | --- | --- |
| `auth_register_started` | User taps "Create Account" | — |
| `auth_register_submitted` | User submits registration form | `email_domain` (no PII) |
| `auth_register_succeeded` | OTP verified for new user | `time_to_verify_seconds` |
| `auth_register_failed` | Registration error | `error_code`, `status` |
| `auth_login_submitted` | Login form submitted | — |
| `auth_login_succeeded` | Tokens stored | `method` ∈ `email \| google \| apple` |
| `auth_login_failed` | Login error | `error_code`, `status` |
| `auth_otp_resend` | User taps Resend | `purpose` |
| `auth_otp_failed` | OTP wrong/expired | `purpose`, `attempt_number` |
| `auth_forgot_started` | User taps "Forgot Password?" | — |
| `auth_forgot_succeeded` | Password reset complete | — |
| `auth_session_expired` | Force-logout fired | `cause` ∈ `refresh_failed \| reuse_detected \| password_reset` |

### Accessibility checklist

- All form fields have `Semantics` labels matching the visible label.
- OTP input is a single accessible group with label _"Enter the 6-digit code"_; individual digit boxes don't get focus-trapped — backspace moves to previous box; submit fires automatically when 6 digits filled.
- Error messages use `liveRegion: assertive` so screen readers announce them immediately.
- Loading states announce _"Submitting"_ when the spinner activates.
- Focus moves to the first error field on validation failure.
- Color contrast ≥ 4.5:1 for all text including error states.

---

## Endpoints Used

| #   | Method | Endpoint                    | Module Spec                                                                | Used in flow |
| --- | ------ | --------------------------- | -------------------------------------------------------------------------- | --- |
| 1   | POST   | `/users`                    | [User Module 2.1](../modules/user.md#21-create-user-registration--admin-create) | Registration step 3 |
| 2   | POST   | `/auth/login`               | [Auth Module 1.1](../modules/auth.md#11-login)                             | Login step 2 |
| 3   | POST   | `/auth/verify-otp`          | [Auth Module 1.2](../modules/auth.md#12-verify-otp)                        | Registration step 6, Forgot Password step 5 |
| 4   | POST   | `/auth/forgot-password`     | [Auth Module 1.3](../modules/auth.md#13-forgot-password)                   | Forgot Password step 2 |
| 5   | POST   | `/auth/reset-password`      | [Auth Module 1.4](../modules/auth.md#14-reset-password)                    | Forgot Password step 7 |
| 6   | POST   | `/auth/refresh-token`       | [Auth Module 1.5](../modules/auth.md#15-refresh-token)                     | Token Refresh background |
| 7   | POST   | `/auth/logout`              | [Auth Module 1.6](../modules/auth.md#16-logout)                            | Force-logout (cross-link to [Profile](./06-profile.md#logout-flow) for explicit logout) |
| 8   | POST   | `/auth/resend-verify-email` | [Auth Module 1.7](../modules/auth.md#17-resend-otp-resend-verify-email)    | Registration step 5, Login step 4, Forgot Password (resend) |
| 9   | POST   | `/auth/social-login`        | [Auth Module 1.8](../modules/auth.md#18-social-login-google--apple)        | Social Login step 4 |

> Note: `POST /users` belongs to the user module; auth flow consumes it for registration. `POST /auth/change-password` is **not** on this screen — see [Profile](./06-profile.md).

---

## Resolved Decisions

All previously-open questions have been resolved. Each is summarized here for traceability.

| # | Topic | Decision | Reflected in |
|---|---|---|---|
| **Q1** | OTP screen state across app cold-start | **State persistence with TTL.** Persist `{ purpose, email, sentAt }` to encrypted local storage; on cold-start, deep-link to OTP if `now - sentAt < 5 min`, else clear and route to Login. Industry pattern (WhatsApp / Signal / Firebase Phone Auth); ~15-20% drop-off reduction. | [Registration Flow → Edge — App killed mid-OTP](#registration-flow) |
| **Q2** | `deviceToken` lifecycle | **Promote device to a first-class resource.** New endpoints: `POST /devices/register` (idempotent upsert) called after every auth success + on FCM token rotation; `DELETE /devices/:deviceId` called on explicit logout. Auth bodies stop accepting `deviceToken` (transitional — code refactor pending). | [Device & FCM token lifecycle](#device--fcm-token-lifecycle) |
| **Q3** | Resend cooldown persistence | **Client-only timer (60s default).** Does NOT persist across app-kill. The server's `429 + Retry-After` is the authoritative rate-limit. Client cooldown is purely a UX guard. | [Resend OTP Rate Limiting / Cooldown](#resend-otp-rate-limiting--cooldown) |
| **Q4** | Password regex source of truth | **Confirmed against `user.validation.ts`.** Min 8 chars · upper · lower · digit · special. Phone regex: `/^\+?[0-9]{7,15}$/`. | [Validation Rules](#validation-rules) |
| **Q5** | Access / refresh token TTLs | **Access: 15 minutes. Refresh: 30 days.** Client uses proactive refresh at `TTL - 60s` instead of waiting for `401`. | [Storage & Session](#storage--session) |

---

## Follow-up actions (out of scope of this screen doc)

These come from the resolved decisions above and need to land in adjacent docs / code:

- **From Q2** — Add a new `modules/device.md` covering `POST /devices/register` and `DELETE /devices/:deviceId`. Add rows in `api-inventory.md` (status: 🟡 Spec Done · Code Pending). Mark `deviceToken` field in `modules/auth.md` request bodies (1.1, 1.2, 1.8) as `// deprecated — use POST /devices/register after auth success`. Reflect new device lifecycle in `overview.md` §8 (Cross-Cutting Concerns).
- **From Q5** — Confirm the actual JWT expiry constants in `src/config/index.ts` match 15m / 30d, or update them to match this spec. Document them in `modules/auth.md` §1.5 (refresh-token).
- **From Q1** — When `app-screens/01-auth.md` is implemented in Flutter, add a unit test for the OTP-context TTL expiry path.