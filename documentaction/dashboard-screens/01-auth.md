# Screen 1: Auth (Mobile)

> **Section**: App Screens — UX Flow
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Profile](./07-profile.md) — password change, logout after session reset

---

> **No UI flow mismatches detected — screen flow is clean and ready for backend analysis.** Every step in the UX Flow above is unambiguous and consistent with related screens. Move to Step 2.

---

## UX Flow

### 2. Login

1. User enters `email` and `password`.

2. Device sends credentials along with a background device identifier.

3. On success:

   * User is routed to **Home**.

4. If email exists but is unverified:

   * System triggers a new verification email automatically.
   * User is redirected to **OTP Verification** screen
   * UI shows toast: *"Please verify your email. A new code has been sent."*

5. If credentials are invalid:

   * Inline error is shown without revealing which field is incorrect.

6. If login is rate-limited or restricted:

   * UI blocks retry temporarily and shows a cooldown message.

---

### 4. Forgot Password

1. User taps **Forgot Password**.
2. User submits email.
3. System always shows generic success message (no account enumeration).
4. User is redirected to **OTP Verification** with `{ purpose: "FORGOT_PASSWORD", email }`.
5. After OTP verification:

   * Temporary reset token is issued.
   * User is routed to **New Password** screen.
6. After password reset:

   * All sessions are invalidated.
   * User is sent back to **Login**.

---

### 5. OTP Verification

1. OTP screen is opened with a `purpose` context:

   * `REGISTRATION`
   * `FORGOT_PASSWORD`

2. User enters 6-digit code.

3. On success:

   * If `REGISTRATION` → session tokens are issued.
   * If `FORGOT_PASSWORD` → reset token is issued.

4. Client routes user based on OTP outcome and post-auth state.

---

### 6. Session Refresh (Background)

1. When access token expires, app attempts silent refresh.
2. Only one refresh request runs at a time (others wait for result).
3. On success:

   * New token replaces old one.
   * Failed requests retry automatically.
4. On failure:

   * All sessions are cleared.
   * User is redirected to Login.
