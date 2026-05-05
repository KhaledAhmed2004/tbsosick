# Auth Module APIs

> **Section**: Backend API specifications for the auth module (registration, login, and password management).
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App - Auth Screen] — Mobile registration   , login, OTP, social login, forgot/reset password
> - [Dashboard - Auth Screen] — Admin login, OTP, change password, logout
> - [App - Profile Screen] — Logout flow

---

## Unified API Registry

| # | Method | Endpoint | Auth | Purpose & Status | Documentation |
|---|---|---|---|---|---|
| 01 | POST | `/auth/login` | Public | **Done**: Authenticates user, issues tokens, and updates deviceToken/first-login status. | [01-login.md](./01-login.md) |
| 02 | POST | `/auth/verify-otp` | Public | **Done**: Verifies OTP for signup (auto-login) or forgot-password (issues resetToken). | [02-verify-otp.md](./02-verify-otp.md) |
| 03 | POST | `/auth/forgot-password` | Public | **Done**: Silent success flow to send OTP for password recovery (enumeration protection). | [03-forgot-password.md](./03-forgot-password.md) |
| 04 | POST | `/auth/reset-password` | Reset Token | **Done**: Resets password and increments `tokenVersion` to invalidate all active sessions. | [04-reset-password.md](./04-reset-password.md) |
| 05 | POST | `/auth/refresh-token` | Refresh Token | **Done**: Implements token rotation and reuse detection for stateless session management. | [05-refresh-token.md](./05-refresh-token.md) |
| 06 | POST | `/auth/logout` | Bearer | **Done**: Clears refreshToken cookie and removes specific deviceToken to stop push notifications. | [06-logout.md](./06-logout.md) |
| 07 | POST | `/auth/resend-otp` | Public | **Done**: Resends 6-digit verification code with built-in rate-limiting protection. | [07-resend-otp.md](./07-resend-otp.md) |
| 08 | POST | `/auth/social-login` | Public | **Done**: Unified signup/login via Google or Apple ID tokens with email conflict checks. | [08-social-login.md](./08-social-login.md) |
| 09 | POST | `/auth/change-password` | Bearer | **Done**: Allows authenticated users to update their password after verifying current credentials. | [09-change-password.md](./09-change-password.md) |

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Token Expiration** | Access tokens are short-lived. Clients must handle `401 Unauthorized` by calling `/auth/refresh-token`. |
| **Account Restriction** | Users with `RESTRICTED` or `DELETED` status are blocked from logging in or refreshing tokens (`403 Forbidden`). |
| **Global Logout** | Resetting password increments `tokenVersion`, which immediately invalidates all active sessions globally. |
| **Social Login Conflict** | If an email exists as a password-based account, social login will fail with `409 Conflict` to prevent hijacking. |
| **OTP Expiry** | OTPs are valid for a limited window (e.g., 3-5 mins). Expired OTPs return `400 Bad Request`. |
