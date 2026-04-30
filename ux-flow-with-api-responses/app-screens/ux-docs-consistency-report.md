# UX Docs Consistency Report

> **Mode**: Bulk standardization
> **Scan date**: 2026-05-01
> **Source folder**: `D:\web projects\office-sta\re-fector\tbsosick\ux-flow-with-api-responses\app-screens\`
> **Files scanned**: 8
> **Drift counts**: 🔴 `2` critical · 🟡 `6` minor · 🟢 `0` aligned
> **Verdict**: Major drift

---

## A. Files Scanned

| #   | File                              | Purpose                                                                                          | Lines | Status      |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------ | ----- | ----------- |
| 1   | `01-auth.md`                      | Mobile auth — registration / OTP / login (email + Google + Apple) / forgot-reset / refresh / logout / device & FCM lifecycle | 373   | 🔴 critical |
| 2   | `02-home.md`                      | Home — stats counts, favorite-cards carousel, "All Cards / My Cards" tabs, search + create FAB   | 205   | 🟡 minor    |
| 3   | `03-preference-card-details.md`   | Card detail — read full record, favorite toggle, share (FE-only), download (counter + local PDF) | 119   | 🟡 minor    |
| 4   | `04-create-preference-card.md`    | Card creation form — supplies / sutures typeahead with custom-add, photo upload, draft / publish | 86    | 🟡 minor    |
| 5   | `05-library.md`                   | Global search over public cards — filter by specialty + verified-only (paid feature)             | 108   | 🟡 minor    |
| 6   | `06-calendar.md`                  | Calendar — month range fetch, event CRUD with structured fields, 24 h + 1 h reminders            | 98    | 🟡 minor    |
| 7   | `07-profile.md`                   | Profile — read / edit, subscription read state, IAP upgrade + restore, legal page reader, logout | 253   | 🔴 critical |
| 8   | `08-notifications.md`             | Notifications — bell + red-dot from `meta.unreadCount`, mark-read / mark-all / swipe-delete; FCM + Socket + DB | 112   | 🟡 minor    |

---

## B. Cross-File Inconsistencies

### B1. Terminology drift (same concept, different words)

| #  | Term variants                                  | Files affected                                                                                                                  | Canonical proposal                          | Why this matters                                                                                                                              |
| -- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| T1 | `Student-Facing` (6 files), `User-Facing` (1) | `01-auth.md`, `03-preference-card-details.md`, `04-create-preference-card.md`, `05-library.md`, `06-calendar.md`, `07-profile.md` use `Student-Facing`; `02-home.md` uses `User-Facing` | **`[NEEDS INFO]`** — see Q1 in §D          | Front-matter labels propagate into doc tooling, search, and downstream prompt outputs. Six-vs-one drift means external readers see two different audience descriptions for the same set of mobile screens. |

> **Note**: `08-notifications.md` uses `System-Wide Notifications` instead of `App APIs (...)` — semantically intentional (notification delivery spans channels, not just app APIs), so excluded from T1.

> **Why this matters**: every downstream prompt (Database Design, API Designer, API Module, Coder Spec) inherits whichever label is at the top of the file. A single canonical decision here prevents readers from mis-interpreting whether the audience is *medical students only* or the *broader user base*.

### B2. Heading-hierarchy / section-name drift

| #  | Section concept             | Variants                                                                                                                                                                                                                                                              | Files                                                                                                          | Canonical proposal                                                                                                       |
| -- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| H1 | `Common UI Rules` block     | **(a)** `## Common UI Rules` heading + cross-link quote to `system-concepts.md` (3 files: `01`, `05`, `06` — `01` adds auth-specific overrides). **(b)** `## Common UI Rules` heading + full inline list (4 files: `02`, `03`, `04`, `07`). **(c)** Front-matter quote-link only, no `##` section (1 file: `08`). | `02-home.md`, `03-preference-card-details.md`, `04-create-preference-card.md`, `07-profile.md` use pattern (b) | **Pattern (a)** — `## Common UI Rules` heading with one-line cross-link to `[system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules)`. Matches 3 files including the most-recently-revised (`05` v2, `06` v2). Pattern (c) on `08-notifications.md` is acceptable as a variant (not flagged). |
| H2 | `Endpoints Used` table cols | **5-col** (`#`, `Method`, `Endpoint`, `Module Spec`, `Used in flow`) in 5 files: `01`, `02`, `03`, `04`, `07`. **4-col** (no `Used in flow`) in 3 files: `05`, `06`, `08`.                                                                                              | `05-library.md`, `06-calendar.md`, `08-notifications.md`                                                       | **5-col schema** with `Used in flow` — majority pattern. The extra column makes endpoint-to-flow traceability explicit, which downstream API specs and Postman collection generators consume. |

> **Why this matters**: docs-reviewer, Project Overview Sync, and API-design generators all use heading text and table shapes as anchors. Drifted headings cause silently-missed cross-references; drifted table shapes break automated extraction. Aligning four files to pattern (a) and three files to the 5-col schema makes the corpus uniformly machine-readable.

### B4. Duplicate / near-duplicate sub-flows

| #  | Flow                          | Files                                                                                                                                              | Action                                                                                                                                                            | Notes                                                                                                                                            |
| -- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1 | `Storage & Session` table     | **`01-auth.md`** (5-row authoritative table: access token, refresh token, `resetToken`, `deviceId`, FCM `token`); **`07-profile.md`** (4-row table: access, refresh, *Cached IAP receipt*, *Push token (FCM/APNS)*) | Make `01-auth.md` the canonical home. In `07-profile.md`, replace the duplicate table with a cross-link to `01-auth.md § Storage & Session` plus a Profile-specific addendum table containing only the IAP-receipt row. | Lifetime values diverge (`01` says *"15 minutes / 30 days"*; `07` says *"Session lifetime (confirm in auth spec)"*) — exactly the drift this rule prevents. |
| D2 | Push / device token lifecycle | **`01-auth.md § Device & FCM token lifecycle`** (full spec + endpoints `POST /devices/register` / `DELETE /devices/:deviceId`); **`07-profile.md § Push token lifecycle`** (4-bullet abbreviated summary) | Drop the `Push token lifecycle` subsection from `07-profile.md` entirely; reader follows the cross-link from D1 to find the full canonical spec on `01-auth.md`.   | Currently the abbreviated version on `07-profile.md` doesn't reference `POST /devices/register` at all — readers using only Profile would miss the required call. |

> **Why this matters**: duplicate flows drift independently — the lifetime values already disagree between the two `Storage & Session` tables. One canonical home + cross-link from the other = single source of truth, no possibility of future drift.

### B5. Broken / stale cross-references

| #  | Source                                                          | Target                                                                | Issue                                                                                                                                                              |
| -- | --------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| X1 | `01-auth.md` line 6 (`> Related screens`)                       | `[Profile](./06-profile.md)`                                          | File `06-profile.md` does not exist. Profile is at `07-profile.md`. Same broken link appears again on the `Endpoints Used` table row 7 (logout flow) — `[Profile](./06-profile.md#logout-flow)`. |
| X2 | `07-profile.md` line 1 (title)                                  | `# Screen 6: Profile (Mobile)`                                        | File is named `07-profile.md` and is the 7th screen in the corpus, but the H1 title says *"Screen 6"*. `06-calendar.md` already has `# Screen 6: Calendar (Mobile)` — collision.    |

> **Why this matters**: broken cross-refs make the docs feel half-finished, force readers to grep, and break any tooling that follows links (link-checkers, docs-site builders, single-page-render tools). The `Screen 6` title collision specifically risks two files being treated as the same screen by automation.

---

## C. Per-File Standardized Content (paste-ready)

> **Note for pass 1**: T1 (`Student-Facing` vs `User-Facing`) is unresolved pending Q1. The `> Section:` line in each `§C` block reproduces the file's *current* value — once Q1 is answered, the canonical decision propagates corpus-wide and these blocks update in pass 2.

### `01-auth.md` (standardized)

```markdown
# Screen 1: Auth (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Profile](./07-profile.md) (change password, logout)
> **Doc version**: `v4` — last reviewed `2026-04-30` (Q1-Q5 resolved; see [Resolved Decisions](#resolved-decisions))

---

## Common UI Rules

> Common UI Rules + Status-Code Mapping: see [system-concepts.md](../system-concepts.md#common-ui-rules).

**Auth-specific status-code overrides** (apply on top of the canonical mapping):

- `401` → bad credentials / OTP wrong / token rejected → **inline error** (not redirect-Login — that's only for expired-token mid-session, see [Token Refresh](#token-refresh-background)).
- `403` → account state issue (RESTRICTED / INACTIVE / DELETED) → toast/modal with support copy.
- `409` → email already exists OR social-vs-password collision → inline + CTA to log in.

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

> **Why this design**
> `verify-otp` sets `verified: true` and issues tokens in the same response so the user is auto-logged-in after registering. Removing the second manual login step measurably reduces drop-off at sign-up.

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

> **Why this design**
> A single login endpoint serves both web and mobile. Mobile reads tokens from the response body (cookies don't work cleanly on mobile); web uses the httpOnly cookie. The dual delivery is intentional, not a bug — see [Storage & Session](#storage--session).

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

> **Why this design**
> Bumping `tokenVersion` on password reset force-logs-out every device. If a phone is lost or stolen and the user resets their password, any access tokens the attacker still holds become invalid immediately. Without this step the attacker would stay logged-in on the old device.

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

> **Why this design**
> The backend rotates refresh tokens and detects reuse via `tokenVersion`. Firing 5 concurrent refresh calls means 4 of them reuse the now-stale token, which triggers a server-side force-logout. A single-flight queue is mandatory — this is a classic mobile auth bug and a top-3 cause of production incidents.

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

> **Why this design**
> Plain SharedPreferences / UserDefaults are exposed to a rooted or jailbroken device. Keychain and EncryptedSharedPreferences are (mostly) hardware-backed — even with physical access an attacker can't extract the token. This is non-negotiable.

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

> **Why this design**
> An attacker can create a Google account using the same email as an existing password account. Auto-linking would let the attacker enter the victim's account through the Google route — a classic account-hijacking attack. Requiring the original password is the only safe path.

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

## Endpoints Used

| #   | Method | Endpoint                    | Module Spec                                                                | Used in flow |
| --- | ------ | --------------------------- | -------------------------------------------------------------------------- | --- |
| 1   | POST   | `/users`                    | [User Module 2.1](../modules/user.md#21-create-user-registration--admin-create) | Registration step 3 |
| 2   | POST   | `/auth/login`               | [Auth Module 1.1](../modules/auth.md#11-login)                             | Login step 2 |
| 3   | POST   | `/auth/verify-otp`          | [Auth Module 1.2](../modules/auth.md#12-verify-otp)                        | Registration step 6, Forgot Password step 5 |
| 4   | POST   | `/auth/forgot-password`     | [Auth Module 1.3](../modules/auth.md#13-forgot-password)                   | Forgot Password step 2 |
| 5   | POST   | `/auth/reset-password`      | [Auth Module 1.4](../modules/auth.md#14-reset-password)                    | Forgot Password step 7 |
| 6   | POST   | `/auth/refresh-token`       | [Auth Module 1.5](../modules/auth.md#15-refresh-token)                     | Token Refresh background |
| 7   | POST   | `/auth/logout`              | [Auth Module 1.6](../modules/auth.md#16-logout)                            | Force-logout (cross-link to [Profile](./07-profile.md#logout-flow) for explicit logout) |
| 8   | POST   | `/auth/resend-verify-email` | [Auth Module 1.7](../modules/auth.md#17-resend-otp-resend-verify-email)    | Registration step 5, Login step 4, Forgot Password (resend) |
| 9   | POST   | `/auth/social-login`        | [Auth Module 1.8](../modules/auth.md#18-social-login-google--apple)        | Social Login step 4 |

> Note: `POST /users` belongs to the user module; auth flow consumes it for registration. `POST /auth/change-password` is **not** on this screen — see [Profile](./07-profile.md).

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
```

### `02-home.md` (standardized)

```markdown
# Screen 2: Home (Mobile)

> **Section**: App APIs (User-Facing)  
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)  
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)  
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)  
> **Related screens**: [Auth](./01-auth.md) — login success kore user Home e land kore · [Preference Card Details](./03-preference-card-details.md) — card deep view navigation · [Create Preference Card](./04-create-preference-card.md) — card creation flow · [Notifications](./08-notifications.md) — bell icon entry point  
> **Doc version**: `v1` — last reviewed `2026-04-29`

---

## Common UI Rules

> Common UI Rules + Status-Code Mapping: see [system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules).

---

## UX Flow

### 1. Home Initial Load (App Entry)
1. User logs in successfully → lands on Home screen.
2. Home screen contains two main tabs: **All Cards** and **My Cards**.
3. When the screen mounts, **three API calls are triggered in parallel**:

* [`GET /preference-cards/stats`](../modules/preference-card.md#32-get-cards-stats) — fetches the "Total Available" and "My Created" counts.
* [`GET /users/me/favorites`](../modules/user.md#28-list-favorite-cards) — fetches the user's bookmarked (favorite) card list.
* [`GET /preference-cards?visibility=private`](../modules/preference-card.md#31-listsearch-preference-cards) — fetches cards created by the current user (for the My Cards tab).

4. While API calls are pending, a **skeleton loader** is displayed in the Stats section, Favorites list, and My Cards list.

5. When the Stats API returns `200`, the Stats section renders accurate counts for **"Total Available"** and **"My Created."**

6. When the Favorites API returns `200`, the bookmarked cards are displayed in a **horizontally scrollable list**. Each card shows a visible heart icon for direct toggling.

7. If the Favorites API returns `200` but the list is empty, refer to [No Favorites](#no-favorites).

8. If any API call returns `401`, the user is redirected to the Login screen (token expired).

9. If any API call returns a `5xx` error, a toast notification is shown and a **retry button** is displayed in place of the skeleton loader.

10. UI renders progressively:
    - Search bar (top, always interactive)
    - Notification bell (top-right entry)
    - Stats section (Total Available / My Created)
    - Favorite cards horizontal carousel (bottom section)
    - Floating "+" action button

> **Why this design**
> Parallel fetch reduces perceived latency. Waiting on a single combined request blocks the whole page; resolving independent endpoints in parallel lets each section render as soon as its data lands, so the UI feels significantly faster.

---

### 2. All Cards (Search & Discovery)
1. Default tab is **All Cards**.
2. User search bar-e keyword type kore (card title / surgeon / procedure).

3. A **300ms debounce** is applied on input changes, and the search is triggered after the user becomes idle. If a new keystroke occurs, the in-flight request is cancelled → [`GET /preference-cards?visibility=public&searchTerm=<keyword>`](../modules/preference-card.md#31-listsearch-preference-cards).

4. While the request is pending, a **skeleton/spinner** is shown in the results area — see [Search Latency](#search-latency).

5. On `200` with results, matching cards are rendered as a list directly below the search bar.

6. On `200` with an empty array, an empty state is shown with the message *"No cards found."*

7. On `429`, an inline countdown is displayed below the search bar: *"Try again in {N}s."* — see [Rate Limit Hit](#rate-limit-hit).

8. On `5xx`, a toast is shown; if previous results exist, they are faded (dimmed) and a retry icon is displayed in the search bar.

9. When the user clears the search bar or dismisses the keyboard, the default Home state is restored (Favorites list becomes visible).

> **Why this design**
> Firing an API call on every keystroke hits rate-limits and wastes backend cycles. Debouncing is essential to keep typing smooth and to cut the number of API requests to the few that actually represent the user's intent.

---

### 3. My Cards (Manage My Cards)
1. User **My Cards** tab-e tap kore.
2. User-er create kora card list show hoy (data from [`GET /preference-cards?visibility=private`](../modules/preference-card.md#31-listsearch-preference-cards)).
3. Each card item contains **Edit** and **Delete** actions (quick actions).

#### Edit Card
1. User card item-er **Edit** icon-e tap kore.
2. Edit form open hoy, current card data diye pre-filled.
3. Parallel-e catalog re-fetch hoy ([`GET /supplies`](../modules/supply.md#71-list-supplies) & [`GET /sutures`](../modules/suture.md#81-list-sutures)).
4. User fields edit kore → tap **Publish** or **Save as Draft**.
5. [`PATCH /preference-cards/:cardId`](../modules/preference-card.md#36-update-preference-card) call hoy.
6. On success → Home-e back kora hoy + toast.

#### Delete Card
1. User card item-er **Delete** icon-e tap kore.
2. Confirmation modal show hoy.
3. User confirm korle → [`DELETE /preference-cards/:cardId`](../modules/preference-card.md#37-delete-preference-card) call hoy.
4. On success → item list theke remove hoy + toast.

---

### 4. Quick Action (Create Card)
1. The user taps the **"Create Preference Card +"** button.
2. Navigates to [Create Preference Card](./04-create-preference-card.md).
3. Success-er por Stats re-fetch hoy.

---

### 5. Favorite Interaction Flow
1. User taps the favorite (heart) icon on a card header.
2. **Optimistic update**: heart icon flips state immediately; the icon is locked (in-flight tap ignored — see [Double Tap on Favorite Toggle](#double-tap-on-favorite-toggle)).
3. Toggle call fires:
   - Add → [PUT `/preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#38-favorite-a-card)
   - Remove → [DELETE `/preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#39-unfavorite-a-card)
4. On success → optimistic state is confirmed; the favorites list silently refreshes in the background.
5. Tap on a card body → navigate to [Preference Card Details](./03-preference-card-details.md).
6. Errors:
   - `404` → see [Card No Longer Exists](#card-no-longer-exists).
   - `5xx` → optimistic state reverts; toast: *"Could not update favorite. Try again."*

> **Why this design**
> Optimistic update keeps the UI feeling instant and lag-free. The backend round-trip then confirms (or reverts) the change so the final state stays consistent.

---

## Edge Cases

### No Favorites

- **Trigger**: [`GET /users/me/favorites`](../modules/user.md#28-list-favorite-cards) returns `200` with empty `data` array.
- **UI response**: Inline placeholder in favorites section; "View All" button hidden.
- **Message**: *"No favorite cards yet."*
- **Action**: No CTA required; user can browse/search to discover cards.

### Search No Results
- **Trigger**: empty API result
- **UI response**: empty state illustration + text
- **Message**: *"No cards found"*
- **Action**: clear search / retry
- **Note**: avoids user confusion (Jakob's Law — consistent feedback expected)

### Double Tap on Favorite Toggle

- **Trigger**: User rapidly taps heart icon multiple times before first call settles.
- **UI response**: Second tap ignore kore jotokkhon first call in-flight thake (button locked during flight).
- **Message**: None.
- **Action**: First call settle-er por button re-enable; state accurate thake.
- **Note**: PUT/DELETE idempotent by design — server-side safe, kintu unnecessary calls avoid korar jonno client-side lock rakha better.

---

### Search Latency

- **Trigger**: [`GET /preference-cards?...`](../modules/preference-card.md#31-listsearch-preference-cards) call in-flight (>200ms).
- **UI response**: Results area-te skeleton rows ba spinner dekhay.
- **Message**: None (skeleton is the affordance).
- **Action**: Auto-resolves on response.
- **Note**: 300ms debounce + request cancellation implement kora thakle 60 req/min limit-e normal typing hit korbe na.

---

### Card No Longer Exists

- **Trigger**: Favorite toggle call returns `404` (card deleted by owner after list loaded).
- **UI response**: Toast + remove stale card from local favorites list.
- **Message**: *"This card is no longer available."*
- **Action**: Card silently removed from favorites list without requiring full re-fetch.

---
### Search Rate Limit
- **Trigger**: 429 response
- **UI response**: inline error + countdown
- **Message**: *"Too many requests. Try again in {N}s."*
- **Action**: auto retry allowed after cooldown
- **Note**: protects backend stability

---

## UX Audit

**Minor**
- Search triggers may fire too frequently without explicit debounce control.  
  **Why**: can overload API under fast typing (Doherty Threshold violation).  
  **Fix**: enforce 300–500ms debounce at client level.

- Favorites refresh after toggle is not clearly defined as real-time or background sync.  
  **Why**: can cause temporary UI mismatch.  
  **Fix**: optimistic UI + silent revalidation pattern.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec | Used in flow |
| --- | --- | --- | --- | --- |
| 1 | GET | `/preference-cards?visibility=public&searchTerm=…` | [Module 3.1](../modules/preference-card.md#31-listsearch-preference-cards) | Search & Discovery |
| 2 | GET | `/preference-cards?visibility=private` | [Module 3.1](../modules/preference-card.md#31-listsearch-preference-cards) | Initial Load (My Cards tab) |
| 3 | GET | `/preference-cards/stats` | [Module 3.2](../modules/preference-card.md#32-get-cards-stats) | Initial Load |
| 4 | PUT | `/preference-cards/favorites/cards/:cardId` | [Module 3.8](../modules/preference-card.md#38-favorite-a-card) | Favorite Toggle |
| 5 | DELETE | `/preference-cards/favorites/cards/:cardId` | [Module 3.9](../modules/preference-card.md#39-unfavorite-a-card) | Favorite Toggle |
| 6 | GET | `/users/me/favorites` | [Module 2.8](../modules/user.md#28-list-favorite-cards) | Initial Load |


> Note: stats + favorites are independent modules; failure of one must not block rendering of the other.
```

### `03-preference-card-details.md` (standardized)

```markdown
# Screen 3: Preference Card Details (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) — favorite list / search results theke card-e navigate kora hoy; [Create Preference Card](./04-create-preference-card.md) — card creation flow; [Supplies Management](../dashboard-screens/06-supplies-management.md) — catalog source for supply dropdown; [Sutures Management](../dashboard-screens/07-sutures-management.md) — catalog source for suture dropdown
> **Doc version**: `v1` — last reviewed `2026-04-30`

---

## Common UI Rules

> Common UI Rules + Status-Code Mapping: see [system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules).

---

## UX Flow

### View Card Details

1. User Home screen-er favorite list ba search results theke kono card-e tap kore.
2. Screen mount hoy → [`GET /preference-cards/:cardId`](../modules/preference-card.md#35-get-card-details) call hoy.
3. Loading state-e skeleton UI show hoy (title, surgeon block, section placeholders).
4. On `200` → card render hoy:
   - **Header**: card title, Published/Draft status badge (owner-only), favorite icon (filled/outline based on current state), Share icon, Download button, Edit icon (owner / `SUPER_ADMIN` hole), Delete button (owner / `SUPER_ADMIN` hole).
   - **Surgeon Info**: fullName, specialty, handPreference, contactNumber, musicPreference.
   - **Clinical Sections**: Medication, Supplies (name + quantity list), Sutures (name + quantity list), Instruments, Positioning Equipment, Prepping, Workflow.
   - **Key Notes** (free-text block).
   - **Photo Library** (horizontally scrollable image strip; jodi kono photo na thake → *"No photos added."* placeholder show hoy).
5. On `403` → see [Private Card Access](#private-card-access).
6. On `404` → see [Card Not Found](#card-not-found).

> **Why this design**
> A card has multiple distinct sections (surgeon info, supplies, sutures, photos). A skeleton previews where each section will land, which removes layout shift on render. A spinner instead leaves the screen blank, which inflates perceived load time and breaks the Doherty Threshold (400 ms rule).

---

### Favorite Toggle

1. User header-er favorite icon-e tap kore.
2. **Optimistic update**: icon immediately filled/outline toggle hoy; icon `pointerEvents: none` set hoy (in-flight-e double-tap block).
3. Jodi currently un-favorited → [`PUT /preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#38-favorite-a-card) call hoy.
4. Jodi currently favorited → [`DELETE /preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#39-unfavorite-a-card) call hoy.
5. On `200` → optimistic state confirmed; `pointerEvents` restored.
6. On any error → optimistic update rollback hoy (icon previous state-e fire jay); `pointerEvents` restored; toast: *"Could not update favorite. Try again."*

> **Why this design**
> Favoriting is a low-stakes action — the user expects instant feedback on tap. Waiting for the round-trip makes the icon feel laggy and broken. Locking the icon while in-flight prevents a race: a rapid double-tap could otherwise queue PUT + DELETE simultaneously and leave server state inconsistent.

---

### Share

1. User Share icon-e tap kore.
2. Native OS share sheet open hoy with `{ message: cardTitle + " — " + deepLink }`.
3. Ei action purely frontend — kono API call nai.

---

### Download

1. User Download button-e tap kore.
2. Offline check: offline thakle → see [Download Offline](#download-offline).
3. Button disabled + spinner shown.
4. [`POST /preference-cards/:cardId/download`](../modules/preference-card.md#310-increment-download-count) call hoy (download count increment; fire-and-forget — response body used nai).
5. Client-side PDF generation shuru hoy (e.g. `react-native-html-to-pdf`): card data already in-memory from step 2 of View Card Details — no second API call needed.
6. PDF generated file device-er local storage-e save hoy.
7. On success → toast: *"Card saved successfully."*; button re-enabled.
8. On PDF generation failure → toast: *"Download failed. Please try again."*; button re-enabled.
9. On `POST /download` error → silently log (count increment non-critical); PDF save still attempted.

> **Why this design**
> The download count is an analytics metric, not part of the user-facing experience. Blocking the user when the counter call fails is the wrong trade-off: they already got the PDF, mission accomplished. Log the error, but don't surface it.

---

## Edge Cases

### Private Card Access

- **Trigger**: `GET /preference-cards/:cardId` returns `403` — card is private and requesting user is not the owner.
- **UI response**: Full-screen error state.
- **Message**: *"This card is private and can't be viewed."*
- **Action**: Back button → previous screen.

---

### Card Not Found

- **Trigger**: `GET /preference-cards/:cardId` returns `404` — card deleted or invalid ID.
- **UI response**: Full-screen error state.
- **Message**: *"This card doesn't exist or has been removed."*
- **Action**: Back button → Home screen.

---

### Download Offline

- **Trigger**: User taps Download while `navigator.onLine === false`.
- **UI response**: Inline error below Download button.
- **Message**: *"You're offline. Connect to the internet and try again."*

---

## Endpoints Used

| # | Method | Endpoint | Module Spec | Used in flow |
|---|---|---|---|---|
| 1 | `GET` | `/preference-cards/:cardId` | [Module 3.5](../modules/preference-card.md#35-get-card-details) | View Card Details, step 2 |
| 2 | `PUT` | `/preference-cards/favorites/cards/:cardId` | [Module 3.8](../modules/preference-card.md#38-favorite-a-card) | Favorite Toggle, step 3 |
| 3 | `DELETE` | `/preference-cards/favorites/cards/:cardId` | [Module 3.9](../modules/preference-card.md#39-unfavorite-a-card) | Favorite Toggle, step 4 |
| 4 | `POST` | `/preference-cards/:cardId/download` | [Module 3.10](../modules/preference-card.md#310-increment-download-count) | Download, step 4 |

> Note: Clinical data (supplies, sutures) is returned in the `GET /preference-cards/:cardId` response.
```

### `04-create-preference-card.md` (standardized)

```markdown
# Screen 4: Create Preference Card (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) — floating action button theke navigation; [Supplies Management](../dashboard-screens/06-supplies-management.md) — catalog source for supply dropdown; [Sutures Management](../dashboard-screens/07-sutures-management.md) — catalog source for suture dropdown
> **Doc version**: `v1` — last reviewed `2026-04-30`

---

## Common UI Rules

> Common UI Rules + Status-Code Mapping: see [system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules).

---

## UX Flow

### Create Card

1. User Home screen-er "+" floating button-e tap kore.
2. Create Card screen mount hoy.
3. Parallel-e two catalog calls fire hoy:
   - [`GET /supplies`](../modules/supply.md#71-list-supplies)
   - [`GET /sutures`](../modules/suture.md#81-list-sutures)
4. Catalog loading state-e supply/suture search fields disabled with loading indicator.
5. On catalog `200` → search fields enabled, results ready.
6. On catalog error → per-field error shown independently: *"Failed to load options. Tap to retry."* with retry CTA.
7. User required fields fill kore: `cardTitle`, surgeon info (`fullName`, `specialty`, `handPreference`, `contactNumber`, `musicPreference`).
8. User optional fields fill kore (jodi chay): `medication`, `instruments`, `positioningEquipment`, `prepping`, `workflow`, `keyNotes`.
9. **Supplies section**: user search field-e type kore.
   - Database-e match thakle → up to 3–4 results show hoy as selectable rows.
   - Exact match na thakle (ba partial match-er sathe) → list-er shesh-e একটা row show hoy: `+ Add "X" as custom` — user ei row-e tap korle `X` directly selected hoy.
   - Selected supply-er sathe quantity field appear hoy; positive integer required.
10. **Sutures section**: same interaction pattern as Supplies (step 9).
11. Photo upload: user photo picker open kore, max 5 photos select kore.
12. Form bottom-e two CTAs: **Save as Draft** (secondary) and **Publish** (primary).
13. User **Save as Draft** ba **Publish** tap kore — selected action `published: false` ba `published: true` set kore.
14. Submit button (whichever tapped) disabled + spinner.
15. [`POST /preference-cards`](../modules/preference-card.md#34-create-preference-card) call hoy with `multipart/form-data`.
16. On `201` → Card Details screen-e navigate kora hoy (new card-er `id` diye).
17. On `400` (published + missing required fields) → see [Publish Validation Error](#publish-validation-error).
18. On `422` → field-level inline errors show hoy.

> **Why this design**
> Supplies and Sutures live on independent endpoints. Calling them sequentially would double the form's load time; firing them in parallel halves the wait before the dropdowns become interactive.

---

## Validation Rules

| Field | Rule | Inline error |
|---|---|---|
| `cardTitle` | Required, non-empty string | *"Card title is required."* |
| `fullName` | Required, non-empty string | *"Surgeon name is required."* |
| `specialty` | Required, non-empty string | *"Specialty is required."* |
| `handPreference` | Required; accepted values per API enum | *"Hand preference is required."* |
| `contactNumber` | Optional; if provided, valid phone format | *"Enter a valid contact number."* |
| `supplies[].quantity` | Required if supply selected; positive integer | *"Quantity must be a positive number."* |
| `sutures[].quantity` | Required if suture selected; positive integer | *"Quantity must be a positive number."* |
| `photos` | Max 5 files; max 5 MB per file; accepted types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif` | *"You can upload up to 5 photos."* |
| `published` | If `true`: `medication`, `instruments`, `positioningEquipment`, `prepping`, `workflow`, `keyNotes`, ≥1 supply, ≥1 suture — all required | *"All required sections must be filled before publishing."* |

---

## Edge Cases

### Publish Validation Error

- **Trigger**: `POST /preference-cards` returns `400` — `published: true` but one or more required clinical fields missing.
- **UI response**: Inline banner at top of form + individual section highlighting.
- **Message**: *"All required sections must be filled before publishing."*

---

## Endpoints Used

| # | Method | Endpoint | Module Spec | Used in flow |
|---|---|---|---|---|
| 1 | `POST` | `/preference-cards` | [Module 3.4](../modules/preference-card.md#34-create-preference-card) | Create Card |
| 2 | `GET` | `/supplies` | [Module 7.1](../modules/supply.md#71-list-supplies) | Create Card step 3 |
| 3 | `GET` | `/sutures` | [Module 8.1](../modules/suture.md#81-list-sutures) | Create Card step 3 |
```

### `05-library.md` (standardized)

```markdown
# Screen 5: Library (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) (quick access), [Preference Card Details](./03-preference-card-details.md) (navigation from list)
> **Doc version**: `v2` — last reviewed `2026-04-30`

---

## Common UI Rules

See [system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules) for the canonical list (submit protection, offline pre-flight, 5xx toast, 422 field-level inline, 429 `Retry-After` countdown, 401 redirect / auto-refresh).

---

## Scope

Library is a global search surface over **public preference cards only**. It is the discovery experience for paid users — a single search bar with filters, no tabs. Private cards are managed from [Home → My Cards](./02-home.md), not here.

---

## UX Flow

### Library Initial Load

1. User taps the **Library** icon in the bottom navigation bar.
2. Screen mounts and immediately shows a skeleton (3–4 card placeholders).
3. [`GET /preference-cards?visibility=public`](../modules/preference-card.md#31-listsearch-preference-cards) call fires.
   - Success → skeleton replaced with the card list.
   - Error → *"Couldn't load cards. Check your connection."* + Retry button.
4. Screen render:
   - Sticky search bar at the top (placeholder: *"Search cards, surgeons, medications..."*).
   - Filter button (with active-filter badge: *"Filter (2)"*) and Sort dropdown sit immediately below the search bar.
   - Card list fills the body.

---

### Search

1. User types into the search bar.
2. After a **350ms debounce** the call fires: [`GET /preference-cards?visibility=public&searchTerm=…&page=1`](../modules/preference-card.md#31-listsearch-preference-cards).
3. While typing or fetching, a skeleton overlay covers the results.
4. Empty array → *"No cards found"* illustration.
5. Clearing the search bar reloads the default `visibility=public` list.

> **Why this design**
> Industry standard: when the search term changes, pagination resets to page 1. Otherwise the user lands in the middle of a fresh result set, which is confusing UX.

---

### Filtering

1. User taps the Filter button → bottom sheet opens.
2. On open (or pre-loaded earlier), [`GET /preference-cards/specialties`](../modules/preference-card.md#33-fetch-distinct-specialties) fires to load the specialty options dynamically.
3. Bottom sheet contains:
   - Specialty picker (single-select from the dynamic list).
   - **Verified Only** toggle — when enabled, only `verificationStatus=VERIFIED` cards are shown.
   - Cancel (discard) and Apply (trigger fetch) buttons.
4. Apply tap → bottom sheet closes → skeleton → results.
5. The Filter icon shows an active-count badge.
6. Active filter pills can render under the search bar (swipeable; tap the X to remove an individual filter).

> **Why this design**
> Hardcoded specialty lists raise maintenance cost. Fetching dynamically from the backend means new specialties show up in the UI as soon as cards using them are published, with no client deploy required.

---

### Card Actions (List View)

1. Tap the favorite icon on a card row:
   - Not favorited → [`PUT /preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#38-favorite-a-card).
   - Already favorited → [`DELETE /preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#39-unfavorite-a-card).
2. Tap the download icon on a card row:
   - Backend counter increments via [`POST /preference-cards/:cardId/download`](../modules/preference-card.md#310-increment-download-count).
   - Client renders the PDF locally and saves it to device storage.

---

### Error States

- **Network failure**: *"Couldn't load cards. Check your connection."* + Retry.
- **Server error**: *"Something went wrong. Please try again."* + Retry.
- **Timeout (>10s)**: same as network error.

---

## Edge Cases

- **No Cards Found**: Search or filter query returning an empty list shows the *"No cards match your filter"* illustration.
- **Session Expired**: Access token invalid or expired → standardized `401` problem-details response → client logout flow triggers.
- **BOLA Protection**: Trying to access another user's private card via direct ID surfaces a `403` Forbidden state. (Library never lists private cards, so this only fires on direct deep-links.)
- **Validation Error**: Invalid query params (e.g., `limit > 50`, negative `page`, field length `> 100`) return a Zod validation message with the field path.
- **Rate Limit**: More than 60 search requests per minute trigger `429`; UI shows the throttling / backoff countdown.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec | Used in flow |
|---|---|---|---|---|
| 1 | GET | `/preference-cards?visibility=public&searchTerm=…` | [Module 3.1](../modules/preference-card.md#31-listsearch-preference-cards) | Library Initial Load + Search |
| 2 | GET | `/preference-cards/specialties` | [Module 3.3](../modules/preference-card.md#33-fetch-distinct-specialties) | Filtering step 2 |
| 3 | GET | `/preference-cards/:cardId` | [Module 3.5](../modules/preference-card.md#35-get-card-details) | Card detail navigation (deep-link to `03-preference-card-details.md`) |
| 4 | PUT | `/preference-cards/favorites/cards/:cardId` | [Module 3.8](../modules/preference-card.md#38-favorite-a-card) | Card Actions — favorite |
| 5 | DELETE | `/preference-cards/favorites/cards/:cardId` | [Module 3.9](../modules/preference-card.md#39-unfavorite-a-card) | Card Actions — unfavorite |
| 6 | POST | `/preference-cards/:cardId/download` | [Module 3.10](../modules/preference-card.md#310-increment-download-count) | Card Actions — download |
```

### `06-calendar.md` (standardized)

```markdown
# Screen 6: Calendar (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) (quick access)
> **Doc version**: `v2` — last reviewed `2026-04-30`

---

## Common UI Rules

See [system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules) for the canonical list (submit protection, offline pre-flight, 5xx toast, 422 field-level inline, 429 `Retry-After` countdown, 401 redirect / auto-refresh).

---

## UX Flow

### Calendar Initial Load
1. User bottom navigation bar theke "Calendar" icon-e tap kore.
2. Page load-e current month-er shob events fetch hoy → [GET /events?from=2026-04-01&to=2026-04-30](../modules/event.md#41-list-my-events).
3. Screen render hoy:
   - Top-e ekta **Interactive Calendar View** thake.
   - Jey shob date-e event ache, sheygula **highlighted** (e.g., colored dot ba background circle) thake jate user shohojei identify korte pare.
   - Calendar-er niche "Events for [Selected Date]" list thake.
   - Default-vabe current date-er events dekhay.
   - User kono specific date-e tap korle niche oi diner related events update hoy.
   - "Create Event" button (+) thake.

### Date Selection Flow
1. User calendar-er kono highlighted date-e click kore.
2. Frontend filtered data theke oi date-er events niche list-e show kore (ba proyojone naya kore fetch korte pare).
3. User oi list theke event-e click kore details dekhte pare.

### Create Event Flow
1. User "Create Event" button-e tap kore.
2. A modal / bottom-sheet opens with the following structured form:

   ```
   Form fields:
   - title (required, string)
   - date (required, ISO date)
   - time (required, HH:mm)
   - duration (required, minutes — integer)
   - location (required, string)
   - eventType (required, enum: "surgery" | "meeting" | "consultation" | "other")
   - linkedPreferenceCard (optional, cardId — typeahead picker over user's own cards via GET /preference-cards?visibility=private)
   - personnel (optional, array of { name: string, role: string }; common roles: "Lead Surgeon", "Surgical Team", "Assistant", "Anesthesiologist")
   - notes (optional, multiline string)
   ```

3. Submit → [POST /events](../modules/event.md#42-create-event).
4. Success hole list update hoy ebong success message dekhay.

### Event Management (View, Update & Delete)
1. User "Upcoming Events" list theke kono event-e tap kore.
2. Event details fetch hoy → [GET /events/:eventId](../modules/event.md#43-get-event-details).
3. Details modal-e user data dekhte pare ebong "Edit" icon-e tap kore update korte pare → [PATCH /events/:eventId](../modules/event.md#44-update-event).
4. User chaile event delete-o korte pare "Delete" button-e tap kore → [DELETE /events/:eventId](../modules/event.md#45-delete-event).
5. Success hole calendar refresh hoy.

---

## Validation Rules

| Field | Rule | Inline error |
|---|---|---|
| `title` | Required, non-empty string | *"Event title is required."* |
| `date` | Required, valid ISO date (`YYYY-MM-DD`) | *"Pick a valid date."* |
| `time` | Required, `HH:mm` 24-hour format | *"Pick a valid time."* |
| `duration` | Required, positive integer (minutes) | *"Duration must be a positive number of minutes."* |
| `location` | Required, non-empty string | *"Location is required."* |
| `eventType` | Required; one of `surgery`, `meeting`, `consultation`, `other` | *"Pick an event type."* |
| `linkedPreferenceCard` | Optional; if provided must be a valid `cardId` owned by the requesting user | *"Pick one of your own cards."* |
| `personnel` | Optional array of `{ name, role }`; each entry needs both fields when present | *"Each person needs a name and role."* |
| `notes` | Optional, multiline string | — |

---

## Edge Cases

- **No Events**: Selected date-e kono event na thakle "No events for this day" placeholder dekhabe.
- **Overlapping Events**: Multiple events thakle list-e serial-e dekhabe.
- **Past Events**: Past dates-er events view-only thakte pare (frontend logic).

---

## Endpoints Used

| # | Method | Endpoint | Module Spec | Used in flow |
|---|---|---|---|---|
| 1 | GET | `/events` | [Module 4.1](../modules/event.md#41-list-my-events) | Calendar Initial Load step 2 |
| 2 | POST | `/events` | [Module 4.2](../modules/event.md#42-create-event) | Create Event Flow step 3 |
| 3 | GET | `/events/:eventId` | [Module 4.3](../modules/event.md#43-get-event-details) | Event Management — View step 2 |
| 4 | PATCH | `/events/:eventId` | [Module 4.4](../modules/event.md#44-update-event) | Event Management — Update step 3 |
| 5 | DELETE | `/events/:eventId` | [Module 4.5](../modules/event.md#45-delete-event) | Event Management — Delete step 4 |
| 6 | GET | `/preference-cards?visibility=private` | [Module 3.1](../modules/preference-card.md#31-listsearch-preference-cards) | Create Event Flow — `linkedPreferenceCard` typeahead |
```

### `07-profile.md` (standardized)

```markdown
# Screen 7: Profile (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Screen 1: Auth](./01-auth.md) — login/session expire/logout flow share kore
> **Doc version**: `v1` — last reviewed `2026-04-30`

---

## Common UI Rules

> Common UI Rules + Status-Code Mapping: see [system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules).

---

## UX Flow

### Profile Load & View

1. User bottom navigation theke `Profile` tab-e tap kore.
2. Screen skeleton state render hoy — avatar, text rows, subscription card placeholder.
3. Parallel-vabe calls:

   * [`GET /users/profile`](../modules/user.md#26-get-profile)
   * [`GET /subscriptions/me`](../modules/subscription.md#91-get-my-subscription)
4. Profile info load hole profile picture, name, email, hospital, specialty render hoy.
5. Subscription data load hole separate card update hoy without full-screen reload.
6. Jodi subscription request fail kore but profile success hoy, tahole profile usable thake ebong subscription card retry state dekhay.
7. On `401` → see [Session Expired](#session-expired).

> **Why this design**
> Profile and subscription are independent payloads. Calling them serially adds avoidable wait time. Parallel fetch reaches first-contentful-state faster, which matters most on weak mobile networks.

---

### Profile Edit Flow

1. User `Edit Profile` button-e tap kore.
2. Editable bottom-sheet ba dedicated screen open hoy with pre-filled values.
3. User hospital, specialty, profile picture update kore.
4. Dirty-state detect hoy — unchanged form hole submit disabled thake.
5. User submit kore → calls [`PATCH /users/profile`](../modules/user.md#27-update-profile).
6. Request `multipart/form-data` hishebe send hoy including image file.
7. Submit-er time form locked + inline loading state dekhay.
8. Upload progress indicator dekhano uchit jodi image size noticeable hoy.
9. On `200` → profile cache update hoy + screen instantly refresh hoy.
10. Success toast dekhay: *"Profile updated successfully."*
11. On `422` → invalid field-er niche inline validation show hoy.
12. On failed image upload → see [Profile Photo Upload Failed](#profile-photo-upload-failed).

> **Why this design**
> A dirty-state check stops empty PATCH spam from reaching the backend and avoids accidental double-submits. It also gives the user clear feedback that nothing has changed since they opened the form.

> **Why this design**
> A single multipart request is simpler on mobile. Skipping a separate pre-signed upload step keeps retry and optimistic-refresh logic easy to maintain.

---

### Subscription Read State

1. Profile screen load-er shathe [`GET /subscriptions/me`](../modules/subscription.md#91-get-my-subscription) call hoy.
2. Card-e current plan, interval, renewal status, expiry date show hoy.
3. `FREE` user hole `Upgrade to Premium` ebong `Upgrade to Enterprise` CTA show hoy.
4. Paid user hole `Manage Subscription` CTA show hoy.
5. `Manage Subscription` tap korle native store subscription management deep-link open hoy.
6. Expired subscription hole downgraded state badge show hoy.
7. Renewal pending/cancelled hole warning label show hoy without blocking access immediately.

> **Why this design**
> Payment-related state changes often, driven by webhooks. Forcing a full profile reload every time the subscription card updates causes unnecessary flicker and layout jumps; section-scoped refresh keeps the rest of the screen stable.

---

### Upgrade Flow (IAP)

1. User upgrade CTA-te tap kore.
2. Plan picker bottom-sheet open hoy with monthly/yearly options.
3. User ekta plan + interval select kore.
4. App native IAP SDK trigger kore selected `productId` diye.
5. Native payment sheet open hoy.
6. User payment confirm kore.
7. SDK purchase receipt return kore.
8. App calls [`POST /subscriptions/verify-receipt`](../modules/subscription.md#92-verify-receipt-iap) with `{ platform, productId, receipt }`.
9. Verification pending state-e blocking loader show hoy.
10. Receipt verification success hole backend immediately subscription DB update kore.
11. App instantly [`GET /subscriptions/me`](../modules/subscription.md#91-get-my-subscription) re-fetch kore updated state ney.
12. Updated subscription card render hoy without polling delay.
13. Success toast show hoy: *"Welcome to Premium!"*
14. On receipt verification fail → see [Receipt Verification Failed](#receipt-verification-failed).
15. User cancel payment sheet korle silent dismiss hoy — no error toast.

> **Why this design**
> The backend guarantees immediate consistency after receipt verification. Additional polling would add network load and produce a duplicate loading state for no benefit.

> **Why this design**
> The user intentionally backed out. Treating a deliberate cancel as a failure produces unnecessary anxiety and makes the app feel buggy.

---

### Restore Purchases

1. User `Restore Purchases` option-e tap kore.
2. Native SDK previous purchases fetch kore.
3. App latest receipt diye [`POST /subscriptions/verify-receipt`](../modules/subscription.md#92-verify-receipt-iap) call kore.
4. Existing valid subscription thakle server idempotent response return kore.
5. Backend immediate subscription sync kore.
6. Updated subscription state locally refresh hoy without delayed polling.
7. Restore success hole toast dekhay: *"Purchases restored."*
8. No previous purchase hole empty informational modal dekhay.

---

### Legal Pages

1. User `Terms and Conditions` ba `Privacy Policy` menu-te tap kore.
2. App calls [`GET /legal`](../modules/legal.md#61-list-legal-pages).
3. Legal page list render hoy.
4. User specific page select kore.
5. App calls [`GET /legal/:slug`](../modules/legal.md#62-get-legal-page-by-slug).
6. Full legal content dedicated reader screen-e render hoy.
7. Long content-er jonno sticky title bar + scroll position maintain hoy.
8. Empty legal state hole → see [Legal Content Missing](#legal-content-missing).

---

### Logout Flow

1. User `Logout` button-e tap kore.
2. Confirmation modal open hoy.
3. User confirm kore → calls [`POST /auth/logout`](../modules/auth.md#16-logout).
4. Logout request pending hole modal actions disabled thake.
5. Current device-er access token + refresh token clear hoy.
6. On success → user-ke login screen-e redirect kora hoy.
7. Other logged-in devices unaffected thakbe.
8. Back navigation disabled hoy.
9. On network fail during logout → local session clear korar confirmation prompt dekhano uchit.

> **Why this design**
> If the user has multiple phones / tablets, signing out on one device should not invalidate the others. Otherwise the user gets unexpected forced logouts on devices they never touched.

> **Why this design**
> An Android gesture / back navigation that lands on a protected screen post-logout is a common auth-leak path. Resetting the navigation stack on logout is non-negotiable.

---

## Storage & Session

See [01-auth.md → Storage & Session](./01-auth.md#storage--session) for the canonical token storage table (access token, refresh token, `resetToken`, `deviceId`, FCM `token`) and [01-auth.md → Device & FCM token lifecycle](./01-auth.md#device--fcm-token-lifecycle) for FCM rotation rules.

**Profile-specific additions** (replay-sensitive data not covered by the canonical table):

| Token / data        | Storage                        | Lifetime                        | Cleared when                |
| ------------------- | ------------------------------ | ------------------------------- | --------------------------- |
| Cached IAP receipt  | Secure encrypted local storage | Until verification success      | Successful verify / logout  |

**Never** plain `SharedPreferences` / `UserDefaults` / Hive. **Never** log tokens or receipts.

> **Why this design**
> Purchase receipts are replay-sensitive. If they leak from plain local storage, an attacker can attempt fake restores against the verification endpoint.

---

## Validation Rules

| Field            | Rule                                                         | Inline error                   |
| ---------------- | ------------------------------------------------------------ | ------------------------------ |
| `hospital`       | Required, trimmed, max length backend-defined                | *"Enter your hospital name."*  |
| `specialty`      | Required, trimmed                                            | *"Enter your specialty."*      |
| `profilePicture` | Image only (`image/jpeg`, `image/png`, confirm WebP support) | *"Upload a valid image file."* |

---

## Edge Cases

### Session Expired

* **Trigger**: `401` from profile/subscription endpoints
* **UI response**: blocking modal + redirect
* **Message**: *"Your session has expired. Please log in again."*
* **Action**: redirect to Login screen
* **Note**: redirect-er age local sensitive cache clear korte hobe

---

### Receipt Verification Failed

* **Trigger**: `POST /subscriptions/verify-receipt` fail / timeout
* **UI response**: inline error inside subscription card
* **Message**: *"We couldn't verify your purchase right now."*
* **Action**: `Retry` CTA + background retry allowed
* **Note**: duplicate charge panic avoid korte clear copy dorkar je payment already complete hoite pare

---

### Profile Photo Upload Failed

* **Trigger**: upload interrupted / unsupported image
* **UI response**: inline image picker error
* **Message**: *"Photo upload failed. Try another image."*
* **Action**: reselect image
* **Note**: previous profile picture untouched thakbe

---

### Legal Content Missing

* **Trigger**: [`GET /legal`](../modules/legal.md#61-list-legal-pages) returns empty list or `404`
* **UI response**: empty-state illustration + retry CTA
* **Message**: *"No legal documents available right now."*
* **Action**: retry fetch
* **Note**: empty screen without explanation trust damage kore

---

## UX Audit

**Minor** — worth fixing this sprint:

* Subscription card-e monthly/yearly pricing ek sathe dense text-e deya hole scan difficult hoy. **Why**: Hick's Law — beshi compact choices decision slow kore. **Fix**: yearly plan-e "Save X%" badge add kore visual hierarchy clear koro.

* Profile screen-e legal links, restore purchase, logout ek sathe plain list hole destructive action miss-tap risk ache. **Why**: Fitts's Law — dense tap targets accidental press baray. **Fix**: Logout-ke isolated danger section-e move koro with spacing.

* Profile skeleton jodi full-page shimmer hoy, user subscription-only refresh-er time unnecessary flashing dekhe. **Why**: perceived instability. **Fix**: section-level skeleton use koro, full-page loader na.

---

## Endpoints Used

| # | Method | Endpoint                        | Module Spec                                                     | Used in flow                   |
| - | ------ | ------------------------------- | --------------------------------------------------------------- | ------------------------------ |
| 1 | GET    | `/users/profile`                | [Module 2.6](../modules/user.md#26-get-profile)                 | Profile Load & View step 3     |
| 2 | PATCH  | `/users/profile`                | [Module 2.7](../modules/user.md#27-update-profile)              | Profile Edit Flow step 5       |
| 3 | GET    | `/subscriptions/me`             | [Module 9.1](../modules/subscription.md#91-get-my-subscription) | Subscription Read State step 1 |
| 4 | POST   | `/subscriptions/verify-receipt` | [Module 9.2](../modules/subscription.md#92-verify-receipt-iap)  | Upgrade Flow step 8            |
| 5 | POST   | `/subscriptions/verify-receipt` | [Module 9.2](../modules/subscription.md#92-verify-receipt-iap)  | Restore Purchases step 3       |
| 6 | GET    | `/legal`                        | [Module 6.1](../modules/legal.md#61-list-legal-pages)           | Legal Pages step 2             |
| 7 | GET    | `/legal/:slug`                  | [Module 6.2](../modules/legal.md#62-get-legal-page-by-slug)     | Legal Pages step 5             |
| 8 | POST   | `/auth/logout`                  | [Module 1.6](../modules/auth.md#16-logout)                      | Logout Flow step 3             |

> Note: Subscription renewal/cancel synchronization webhook-driven. Client directly webhook consume kore na — latest state always `GET /subscriptions/me` diye fetch korte hobe.
```

### `08-notifications.md` (standardized)

```markdown
# Screen 8: Notifications (Mobile)

> **Section**: System-Wide Notifications
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Common UI Rules**: see [system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules)
> **Doc version**: `v2` — last reviewed `2026-04-30`

## Overview

Users can receive notifications through three channels: Push (FCM), Socket (real-time), and Database (persistent storage). Trigger types and content templates are documented in the [`modules/notification.md` Overview](../modules/notification.md#overview).

---

## UX Flow

### Bell Icon & Unread Indicator

1. The home screen header includes a **bell icon** (related: [Home](./02-home.md)).
2. When the app comes to the foreground or on pull-to-refresh, it calls: [GET /notifications](../modules/notification.md#51-get-my-notifications).
3. Frontend reads `meta.unreadCount` from the response. If `meta.unreadCount > 0`, render the red dot; otherwise hide it.
4. Unread count is computed server-side across all unread notifications for the user, not just the current page.

### Real-time Updates (Socket)

1. After login, the app establishes a **Socket.IO** connection.
2. When the server creates a new notification, it emits a socket event: `notification:new`.
3. The client listens for the event and updates the in-memory notification list, as well as toggles the red dot indicator.
4. When the app is in the background, **FCM push notifications** are shown (only for event reminders).

### Socket + DB Sync (Conflict Handling)

1. **Server as Source of Truth:** Even if the client updates its local state based on socket events, the final state is always revalidated from the backend.
2. The socket acts only as a **trigger**. When the client receives a socket event, it may re-fetch or revalidate the notification list in the background to keep the state in sync.
3. When switching from background to foreground, the app fetches the latest notifications to ensure the state is fully synchronized.

### Idempotency & Safety

1. **Idempotent Updates:** The request `PATCH /notifications/:id/read` can be called multiple times without causing issues; if the notification is already marked as read, the server still maintains a consistent state and does not throw an error.
2. **Duplicate Protection:** When receiving socket events, the client checks for duplicate `notificationId` values to prevent duplicate entries in the in-memory list.
3. The delete action is also idempotent; if the notification is already deleted, the server responds gracefully with `200` or `204` without errors.

### Open Notification List

1. When the user taps the bell icon, they are navigated to the **Notifications** screen.
2. On page load, the API is called: [GET /notifications?page=1&limit=20](../modules/notification.md#51-get-my-notifications).
3. While loading, a **skeleton loader** is shown with 5–6 placeholder rows.
4. Once the response is received, the list is rendered:

   * Each row includes an icon (based on `type`), `title`, `subtitle`, and a relative timestamp (e.g., "2h ago").
   * **Unread notifications** (`read: false`) are visually highlighted with a different background or a left-side indicator bar.
   * **Read notifications** appear in a muted or dimmed style.
5. A **"Mark all as read"** button is shown in the top-right corner if there are any unread notifications.
6. Empty state: displays **"You're all caught up"** along with a bell illustration.

### Tap on Notification → Deep Link

1. When the user taps on a notification row.
2. The frontend determines the target screen based on `notification.type` and related metadata:

   * **`REMINDER`** (event reminder) → navigates to event detail screen (`/events/:eventId`).
   * **Preference Card** type → navigates to card details screen (`/preference-cards/:cardId`).
   * **Event scheduled** confirmation → navigates to the Calendar screen on the specific date.
3. On tap (optimistically), it triggers a background call: [PATCH /notifications/:notificationId/read](../modules/notification.md#52-mark-as-read).
4. The local state is updated immediately by marking the notification as `read: true`, and the red dot indicator is recalculated accordingly.

### Mark All as Read

1. The user taps the **"Mark all as read"** button in the top-right.
2. The client calls [PATCH /notifications/read-all](../modules/notification.md#53-mark-all-as-read).
3. On success, all notifications in local state are set to `read: true` and the red dot disappears.
4. The button is disabled / hidden until a new unread notification arrives.

### Swipe-to-Delete

1. The user swipes a notification row left or right.
2. A red **"Delete"** action button is revealed.
3. On tap, it calls: [DELETE /notifications/:notificationId](../modules/notification.md#54-delete-notification).
4. **Optimistic UI:** the row is immediately removed from the list.
5. If the request fails, the row is restored and an error toast is shown.
6. A long-press menu can be provided as an alternative option, with actions like **"Delete"** and **"Mark as read"**.


### Pagination (Infinite Scroll)

1. When the user reaches near the bottom of the list, the next page request is triggered: `GET /notifications?page=2&limit=20`.
2. A small spinner is shown at the bottom while loading.
3. When `meta.hasNext: false`, show a footer message: **"You've reached the end"**.


---

## Edge Cases

- **No Notifications**: Empty state placeholder dekhabe ("You're all caught up").
- **Stale Red Dot**: Background e thakar somoy state stale hote pare. Foreground asar shathe shathe list re-fetch kore reconcile kora hoy.
- **Optimistic Failure**: Mark-read ba delete API fail hole local state revert hoy + error toast.
- **Deep Link Target Deleted**: Notification reference kora resource (event/card) delete hoye gele 404 dekhabe — graceful fallback: list e back navigate + toast "This item is no longer available."
- **Push Permission Denied**: User push permission off rakhle FCM channel skip hoy — Socket + DB notifications kaj kore.
- **Rate Limit on Mark-Read**: Bulk mark-read ba dhara dhara delete e backend rate-limit trigger hoye 429 dile UI throttle kore.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec | Used in flow |
|---|---|---|---|---|
| 1 | GET | `/notifications` | [Module 5.1](../modules/notification.md#51-get-my-notifications) | Bell Icon & Unread Indicator + Open Notification List + Pagination |
| 2 | PATCH | `/notifications/:notificationId/read` | [Module 5.2](../modules/notification.md#52-mark-as-read) | Tap on Notification → Deep Link step 3 |
| 3 | PATCH | `/notifications/read-all` | [Module 5.3](../modules/notification.md#53-mark-all-as-read) | Mark All as Read step 2 |
| 4 | DELETE | `/notifications/:notificationId` | [Module 5.4](../modules/notification.md#54-delete-notification) | Swipe-to-Delete step 3 |
```

---

## D. Open Questions

- **Q1 `[NEEDS INFO]`** — *(§B T1 — terminology)* — The corpus front-matter `Section` line uses `App APIs (Student-Facing)` in 6 files (`01`, `03`, `04`, `05`, `06`, `07`) and `App APIs (User-Facing)` in 1 file (`02-home.md`). The product is a medical preference-card platform whose canonical role term throughout `api-mentor.md`, `overview.md`, and `admin-dashboard-spec.md` is `USER` (not `STUDENT`). Confirm canonical: **(A) `User-Facing`** (matches the broader role-naming convention used elsewhere in the corpus; flips 6 files) — *recommended* / **(B) `Student-Facing`** (matches frequency-majority within `app-screens/` only; flips 1 file). **Blocks**: pass-2 standardization of all `Section` lines. **`[ANS: ]`**

---

## E. Suggested Next Steps

1. Review **§A** — confirm the file list and per-file severity (🔴 / 🟡 / 🟢) is accurate.
2. Walk **§B** category-by-category — each canonical proposal cites a justification. Push back if any justification feels wrong.
3. Answer **Q1** in **§D** for the `Student-Facing` vs `User-Facing` decision.
4. Re-paste this report with `[ANS: ]` filled in to iterate (the same Preserve→Process protocol as the rest of the library).
5. Once §D is resolved, copy each standardized block in **§C** over the corresponding screen-doc file in the folder. The blocks are paste-ready — full files with all non-drift content preserved verbatim.
6. Re-run **3rd - Project Overview Sync** so the project overview reflects the propagated terminology decision.
7. UX folder is now clean → safe to run **5th - Admin Dashboard Architect**, **6th/7th - API Designer**, **Database Design Generator**, **API Module Generator**, **Coder Spec** without inheriting drift.
