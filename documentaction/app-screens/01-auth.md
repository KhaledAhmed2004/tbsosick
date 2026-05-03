# Screen 1: Auth (Mobile)

> **Section**: App Screens — UX Flow + API Reference
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Profile](./07-profile.md) — password change, logout after session reset
> **Base URL**: `{{baseUrl}}/api/v1/auth`
> **API conventions**: see [_shared/api-conventions.md](../_shared/api-conventions.md) — response envelope, error shape, status codes, headers, pagination.

---

## Auth-Specific Constants

| Item | Value |
|---|---|
| OTP length | 6 digits, numeric |
| OTP TTL | 5 minutes |
| OTP resend cooldown | 60 seconds |
| OTP attempts | 5 wrong tries per code → invalidate |
| Access token TTL | 15 minutes |
| Refresh token TTL | 30 days |
| Reset token TTL | 10 minutes (single-use) |
| Login rate limit | 5 attempts / 15 min / IP+email |
| Device header | `X-Device-Id: <uuid>` — required on `login`, `refresh-token`, `logout` |

---

## 1. Registration

**Trigger** — user submits **Create Account** form (`name`, `email`, `password`) → server creates an unverified account and dispatches an OTP.

**Use case**
- Email is the unique identity. If email already exists and is verified → `409 Email already registered`. If exists but unverified → block re-creation; return `409` and prompt resend OTP instead.
- OTP is generated server-side and emailed; stored on the User document with `otpExpiresAt`.
- Password is bcrypt-hashed before storage (`patchBcrypt` is loaded at boot).

**Business rules**
- Email change after registration — `// TBD`. Recommendation: separate verified flow (`POST /auth/change-email` + new OTP), not via profile edit.
- Self-service vs admin-created accounts share the same endpoint today (see Implementation note). Decision: split into `POST /auth/register` (self-service) and `POST /users/` (admin-only) — `// TBD`.

**Status** — `Partial`

> The doc proposes `POST /auth/register` as the user-facing self-service endpoint. **In code, registration is wired via `POST /users/` in the user module** (`UserController.createUser`). This works but mixes self-service and admin user creation. **Recommendation**: add a dedicated `POST /auth/register` route that delegates to the same service, so the spec and the public API surface align with the auth flow it belongs to.

**Implementation** *(current — wired via user module)*
- Route: [`user.route.ts`](src/app/modules/user/user.route.ts) — `POST /`
- Controller: [`UserController.createUser`](src/app/modules/user/user.controller.ts)
- Service: [`UserService.createUserToDB`](src/app/modules/user/user.service.ts)
- Validation: [`createUserZodSchema`](src/app/modules/user/user.validation.ts)
- Reads: —
- Writes: `User`

### API Reference

#### `POST /api/v1/auth/register` *(proposed)*

> **Note**: until this route is added, the equivalent call is `POST /api/v1/users/` (same body, same response).

**Request body**

```json
{
  "name": "Sara Ahmed",
  "email": "sara@example.com",
  "password": "Str0ng!Pass"
}
```

**Validation (Zod — `createUserZodSchema`)**
- `name`: 2–60 chars
- `email`: RFC 5322, lowercased server-side
- `password`: ≥ 8 chars, ≥ 1 letter, ≥ 1 number

**Success — `201 Created`**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "OTP sent to email. Verify within 5 minutes.",
  "data": {
    "email": "sara@example.com",
    "otpExpiresAt": "2026-05-03T10:35:00.000Z",
    "purpose": "REGISTRATION"
  }
}
```

**Errors**

| Code | When | `message` |
|---|---|---|
| 400 | Validation fails | `Invalid input` |
| 409 | Email already verified | `Email already registered` |
| 409 | Email exists but unverified | `Account exists. Please verify via OTP.` |
| 429 | Too many register attempts from IP | `Too many requests` |

---

## 2. OTP Verification

**Trigger** — user submits the 6-digit code → [`POST /auth/verify-otp`](#post-api-v1-auth-verify-otp). Branch on `purpose`:
- `REGISTRATION` → server issues access + refresh tokens.
- `FORGOT_PASSWORD` → server issues a single-use reset token.

**Use case**
- OTP is verified against the User document's stored hash + `otpExpiresAt`. After 5 wrong attempts the OTP is invalidated (`423 OTP locked`).
- On success the OTP is consumed (cleared from the User doc) so it cannot be replayed.

**Behavior note** — the response shape branches on `purpose`. Client must inspect `purpose` (or the presence of `accessToken` vs `resetToken`) to decide routing.

**Status** — `Implemented`

**Implementation**
- Route: [`auth.route.ts`](src/app/modules/auth/auth.route.ts)
- Controller: [`AuthController.verifyEmail`](src/app/modules/auth/auth.controller.ts)
- Service: [`AuthService.verifyEmailToDB`](src/app/modules/auth/auth.service.ts)
- Validation: [`createVerifyEmailZodSchema`](src/app/modules/auth/auth.validation.ts)
- Reads: `User`, `ResetToken`
- Writes: `User` (`isEmailVerified`, clear OTP), `ResetToken` (issue on `FORGOT_PASSWORD`)

### API Reference

#### `POST /api/v1/auth/verify-otp`

**Request body**

```json
{
  "email": "sara@example.com",
  "otp": "483920",
  "purpose": "REGISTRATION"
}
```

**Success (REGISTRATION) — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Email verified",
  "data": {
    "user": { "_id": "665f...", "name": "Sara Ahmed", "email": "sara@example.com", "role": "USER", "isEmailVerified": true },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

**Success (FORGOT_PASSWORD) — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP verified",
  "data": { "resetToken": "eyJhbGciOi...", "expiresInSec": 600 }
}
```

**Errors**

| Code | `message` |
|---|---|
| 400 | `Invalid OTP` |
| 410 | `OTP expired` |
| 423 | `OTP locked. Request a new code.` (after 5 wrong tries) |

---

## 3. Resend OTP / Verify Email

**Trigger** — user taps **Resend** on the OTP screen → [`POST /auth/resend-verify-email`](#post-api-v1-auth-resend-verify-email).

> **Path note**: doc previously proposed `POST /auth/resend-otp`. **The actual route in code is `POST /auth/resend-verify-email`** — same purpose, kept under that name for now.

**Use case**
- Cooldown enforced server-side: 60 s per email. Within cooldown → `429 Please wait before requesting a new code`.
- Generates a fresh OTP and resets `otpExpiresAt`. Old OTP is invalidated even if not yet expired.

**Status** — `Implemented`

**Implementation**
- Route: [`auth.route.ts`](src/app/modules/auth/auth.route.ts)
- Controller: [`AuthController.resendVerifyEmail`](src/app/modules/auth/auth.controller.ts)
- Service: [`AuthService.resendVerifyEmailToDB`](src/app/modules/auth/auth.service.ts)
- Validation: — (email read from request body, no Zod schema currently)
- Reads: `User`
- Writes: `User` (refresh OTP fields)

### API Reference

#### `POST /api/v1/auth/resend-verify-email`

**Request body**

```json
{ "email": "sara@example.com", "purpose": "REGISTRATION" }
```

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "A new OTP has been sent.",
  "data": { "otpExpiresAt": "2026-05-03T10:40:00.000Z" }
}
```

**Errors** — `429 Too Many Requests` (`Please wait before requesting a new code`).

---

## 4. Login

**Trigger** — user submits email + password → [`POST /auth/login`](#post-api-v1-auth-login) with `X-Device-Id` header.

**Use case**
- Credentials checked against User doc; on mismatch → generic `401 Invalid email or password` (no field-level hint to avoid enumeration).
- Unverified email triggers a fresh OTP in-line (`AuthService` re-issues) and returns `403 Email not verified` so the client routes back to OTP.
- `tokenVersion` on the User doc is bumped only by password reset / logout-all; login does **not** bump it.
- Server records the device via `DeviceToken` (per-device session binding).

**Business rules**
- Single-device-per-user — `// TBD`. Recommendation: **no** (allow multi-device); each device has its own `DeviceToken`. Logout-all is the escape hatch.
- Failed-login lockout — `// TBD`. Recommendation: throttle via existing rate limit (5/15min/IP+email); no per-account lockout.

**Status** — `Implemented`

**Implementation**
- Route: [`auth.route.ts`](src/app/modules/auth/auth.route.ts)
- Controller: [`AuthController.loginUser`](src/app/modules/auth/auth.controller.ts)
- Service: [`AuthService.loginUserFromDB`](src/app/modules/auth/auth.service.ts)
- Validation: [`createLoginZodSchema`](src/app/modules/auth/auth.validation.ts)
- Reads: `User`
- Writes: `DeviceToken`

### API Reference

#### `POST /api/v1/auth/login`

**Headers** — `X-Device-Id: <uuid>`

**Request body**

```json
{ "email": "sara@example.com", "password": "Str0ng!Pass" }
```

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { "_id": "665f...", "name": "Sara Ahmed", "email": "sara@example.com", "role": "USER", "isEmailVerified": true },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

**Errors**

| Code | `message` |
|---|---|
| 401 | `Invalid email or password` |
| 403 | `Email not verified. A new OTP has been sent.` |
| 429 | `Too many login attempts. Try again in 15 minutes.` |

---

## 5. Social Login (Google / Apple)

**Trigger** — user completes native Google/Apple sign-in → app sends provider token + platform → [`POST /auth/social-login`](#post-api-v1-auth-social-login).

> **Path note**: doc previously proposed split routes `/auth/social/google` and `/auth/social/apple`. **The actual route in code is unified — `POST /auth/social-login`** with `provider` (`GOOGLE` / `APPLE`) in the body.

**Use case**
- Server verifies the provider token against Google / Apple servers (server-side verification is mandatory).
- If the provider email matches an existing **password** account → `409 Email already registered with password. Use password login.` (collision blocked).
- New social user → server creates the account (no OTP step) and returns access + refresh tokens.

**Business rules**
- Account linking (one user, multiple providers) — `// TBD`. Recommendation: no for v1; require single sign-in method per email. Add linking later if users complain.
- First-time Apple name handling — `// TBD`: Apple returns the name only on the first authorization. Confirm whether `fullName` is captured on first social-login and persisted.

**Status** — `Implemented`

**Implementation**
- Route: [`auth.route.ts`](src/app/modules/auth/auth.route.ts)
- Controller: [`AuthController.socialLogin`](src/app/modules/auth/auth.controller.ts)
- Service: [`AuthService.socialLoginToDB`](src/app/modules/auth/auth.service.ts)
- Validation: [`createSocialLoginZodSchema`](src/app/modules/auth/auth.validation.ts)
- Reads: `User`
- Writes: `User` (on first social login), `DeviceToken`

### API Reference

#### `POST /api/v1/auth/social-login`

**Request body (Google)**

```json
{ "provider": "GOOGLE", "idToken": "<google-id-token>" }
```

**Request body (Apple)**

```json
{
  "provider": "APPLE",
  "identityToken": "<apple-identity-token>",
  "authorizationCode": "<apple-auth-code>",
  "fullName": { "givenName": "Sara", "familyName": "Ahmed" }
}
```

**Success — `200 OK`** (same shape as login, plus `isNewUser`)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { "_id": "665f...", "email": "sara@example.com", "role": "USER" },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "isNewUser": true
  }
}
```

**Errors**

| Code | `message` |
|---|---|
| 401 | `Invalid social token` |
| 409 | `Email already registered with password. Use password login.` |

---

## 6. Forgot Password / Reset Password

**Trigger**
- User submits email → [`POST /auth/forgot-password`](#post-api-v1-auth-forgot-password). Server always responds `200` (no enumeration).
- After OTP verify (purpose `FORGOT_PASSWORD`) → [`POST /auth/reset-password`](#post-api-v1-auth-reset-password) with the issued reset token.

**Use case**
- Forgot-password issues a `ResetToken` (separate collection) tied to the user. Single-use, 10-minute TTL.
- Reset-password consumes the token, hashes the new password, and **bumps `tokenVersion` on the User doc** — this invalidates every existing session/device, forcing other devices to re-login.
- Generic success response on forgot-password regardless of whether the email exists (anti-enumeration).

**Business rules**
- New password reuse policy — `// TBD`. Recommendation: block reusing the previous 3 hashes (server stores a small `passwordHistory[]` array).

**Status — `POST /auth/forgot-password`** — `Implemented`

**Implementation**
- Route: [`auth.route.ts`](src/app/modules/auth/auth.route.ts)
- Controller: [`AuthController.forgetPassword`](src/app/modules/auth/auth.controller.ts)
- Service: [`AuthService.forgetPasswordToDB`](src/app/modules/auth/auth.service.ts)
- Validation: [`createForgetPasswordZodSchema`](src/app/modules/auth/auth.validation.ts)
- Reads: `User`
- Writes: `User` (issue OTP), `ResetToken`

**Status — `POST /auth/reset-password`** — `Implemented`

**Implementation**
- Route: [`auth.route.ts`](src/app/modules/auth/auth.route.ts)
- Controller: [`AuthController.resetPassword`](src/app/modules/auth/auth.controller.ts)
- Service: [`AuthService.resetPasswordToDB`](src/app/modules/auth/auth.service.ts)
- Validation: [`createResetPasswordZodSchema`](src/app/modules/auth/auth.validation.ts)
- Reads: `User`, `ResetToken`
- Writes: `User` (`password`, bump `tokenVersion`), `ResetToken` (consume)

### API Reference

#### `POST /api/v1/auth/forgot-password`

**Request body**

```json
{ "email": "sara@example.com" }
```

**Success — `200 OK`** (always returned, even if email does not exist)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "If the email exists, an OTP has been sent.",
  "data": { "purpose": "FORGOT_PASSWORD" }
}
```

#### `POST /api/v1/auth/reset-password`

**Request body**

```json
{ "resetToken": "eyJhbGciOi...", "newPassword": "N3w!Stronger" }
```

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successful. Please log in.",
  "data": null
}
```

> Side effects: `tokenVersion` bumped → all existing sessions for this user are invalidated; refresh-token rotation will fail on every other device.

**Errors**

| Code | `message` |
|---|---|
| 400 | `Password does not meet policy` |
| 401 | `Invalid or expired reset token` |

---

## 7. Session Refresh

**Trigger** — access token expires; client issues a single-flight [`POST /auth/refresh-token`](#post-api-v1-auth-refresh-token).

**Use case**
- Refresh tokens are **rotated**: old token invalidated on every successful refresh.
- Reuse of an old refresh token = the entire session family is revoked (server bumps `tokenVersion`).
- Server validates `tokenVersion` on the User doc — if the token's `tokenVersion` is stale, `401 Refresh token reuse detected. All sessions revoked.`

**Behavior note** — single-flight on the client (Dio interceptor or equivalent): when one request triggers a 401, queue subsequent requests until refresh completes, then replay them.

**Status** — `Implemented`

**Implementation**
- Route: [`auth.route.ts`](src/app/modules/auth/auth.route.ts)
- Controller: [`AuthController.refreshToken`](src/app/modules/auth/auth.controller.ts)
- Service: [`AuthService.refreshTokenToDB`](src/app/modules/auth/auth.service.ts)
- Validation: [`createRefreshTokenZodSchema`](src/app/modules/auth/auth.validation.ts)
- Reads: `User`
- Writes: `User` (bump `tokenVersion` on reuse detection)

### API Reference

#### `POST /api/v1/auth/refresh-token`

**Headers** — `X-Device-Id: <uuid>`

**Request body**

```json
{ "refreshToken": "eyJhbGciOi..." }
```

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token refreshed",
  "data": { "accessToken": "eyJhbGciOi...", "refreshToken": "eyJhbGciOi..." }
}
```

**Errors**

| Code | `message` |
|---|---|
| 401 | `Invalid refresh token` |
| 401 | `Refresh token reuse detected. All sessions revoked.` |

---

## 8. Logout

**Trigger** — user taps **Logout** in [Profile](./07-profile.md) → confirmation, then [`POST /auth/logout`](#post-api-v1-auth-logout).

**Use case**
- Revokes the current device's `DeviceToken` only — other devices remain logged in.
- Access token is allowed to expire naturally; server does not maintain a JWT blocklist (rotation + `tokenVersion` cover the security need).

**Status — `POST /auth/logout`** — `Implemented`

**Implementation**
- Route: [`auth.route.ts`](src/app/modules/auth/auth.route.ts)
- Controller: [`AuthController.logoutUser`](src/app/modules/auth/auth.controller.ts)
- Service: [`AuthService.logoutUserFromDB`](src/app/modules/auth/auth.service.ts)
- Validation: —
- Reads: `User`
- Writes: `DeviceToken` (delete current device)

**Status — `POST /auth/logout-all`** — `Not implemented` (Planned)

> Currently, "log out from all devices" must be triggered indirectly via password reset (which bumps `tokenVersion`). A dedicated `POST /auth/logout-all` endpoint that bumps `tokenVersion` without requiring a password reset is recommended for the Profile → Security area.

### API Reference

#### `POST /api/v1/auth/logout`

**Headers** — `Authorization: Bearer {{accessToken}}`, `X-Device-Id: <uuid>`

**Request body**

```json
{ "refreshToken": "eyJhbGciOi..." }
```

**Success — `200 OK`**

```json
{ "success": true, "statusCode": 200, "message": "Logged out", "data": null }
```

#### `POST /api/v1/auth/logout-all` *(Planned)*

> Proposed endpoint — bumps `tokenVersion` on the User doc, invalidating every device. No request body. Returns the same envelope as `/logout`.

---

## 9. Change Password *(documented for completeness — invoked from Profile, not Auth flow)*

**Trigger** — user submits old + new password from Profile → Security → [`POST /auth/change-password`](#post-api-v1-auth-change-password).

**Use case**
- Verifies `oldPassword` matches the stored hash; `403 Wrong password` on mismatch.
- Updates the stored hash with the new password. Does **not** bump `tokenVersion` (other devices keep working) — `// TBD`: confirm this is intended; alternative is to bump version on change-password as well.

**Status** — `Implemented`

**Implementation**
- Route: [`auth.route.ts`](src/app/modules/auth/auth.route.ts)
- Controller: [`AuthController.changePassword`](src/app/modules/auth/auth.controller.ts)
- Service: [`AuthService.changePasswordToDB`](src/app/modules/auth/auth.service.ts)
- Validation: [`createChangePasswordZodSchema`](src/app/modules/auth/auth.validation.ts)
- Reads: `User`
- Writes: `User` (`password`)

### API Reference

#### `POST /api/v1/auth/change-password`

**Request body**

```json
{ "oldPassword": "Str0ng!Pass", "newPassword": "N3w!Stronger" }
```

**Success — `200 OK`** — `{ "success": true, "statusCode": 200, "message": "Password changed", "data": null }`

**Errors** — `400 Password does not meet policy`, `403 Wrong password`.

---

## Endpoint Index

| # | Method | Path | Status | Auth | Purpose |
|---|---|---|---|---|---|
| 1 | POST | `/api/v1/auth/register` | `Partial` *(currently wired via `POST /api/v1/users/`)* | Public | Self-service registration |
| 2 | POST | `/api/v1/auth/verify-otp` | `Implemented` | Public | Verify OTP (REGISTRATION / FORGOT_PASSWORD) |
| 3 | POST | `/api/v1/auth/resend-verify-email` | `Implemented` | Public | Re-issue OTP |
| 4 | POST | `/api/v1/auth/login` | `Implemented` | Public | Email/password login |
| 5 | POST | `/api/v1/auth/social-login` | `Implemented` | Public | Unified Google / Apple sign-in |
| 6 | POST | `/api/v1/auth/forgot-password` | `Implemented` | Public | Trigger reset OTP |
| 7 | POST | `/api/v1/auth/reset-password` | `Implemented` | Reset token | Set new password (bumps `tokenVersion`) |
| 8 | POST | `/api/v1/auth/refresh-token` | `Implemented` | Refresh token | Rotate access token |
| 9 | POST | `/api/v1/auth/logout` | `Implemented` | Bearer | Revoke current device session |
| 10 | POST | `/api/v1/auth/logout-all` | `Not implemented` | Bearer | Revoke all sessions (Planned) |
| 11 | POST | `/api/v1/auth/change-password` | `Implemented` | Bearer | Change password from Profile |
