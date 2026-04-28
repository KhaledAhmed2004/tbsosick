# Screen 1: Auth (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Profile](./06-profile.md) (change password, logout)

---

## UX Flow

### Registration Flow

1. User taps "Create Account"
2. Enters name, email, and password
3. Submits the form → calls [POST /users](../modules/user.md#21-create-user-registration--admin-create)
4. On success → navigates to the **OTP Verification screen** with message: _"Check your email for a verification code"_
5. If email not received → user taps **"Resend"** → calls [POST /auth/resend-verify-email](../modules/auth.md#17-resend-otp-resend-verify-email)
6. User enters OTP and submits → calls [POST /auth/verify-otp](../modules/auth.md#12-verify-otp)
7. On success:
   - User is auto-logged in (tokens received, no separate login step needed)
   - First-time user → navigate to **Onboarding screen**
   - Returning user → navigate to **Home screen**

**Loading states:**

- Submit button shows spinner and is disabled while API call is in progress
- Resend button is disabled for 60 seconds after tapping (show countdown timer)

---

### Login Flow

1. User enters email + password and taps **Login**
2. On submit → calls [POST /auth/login](../modules/auth.md#11-login) — optionally includes `deviceToken` for push notifications
3. Login button shows spinner and is disabled while request is pending
4. On success:
   - Tokens are received
   - Refresh token is set as httpOnly cookie
   - Navigate to **Home screen**
5. On failure → show inline error below the form (see Edge Cases)
6. If user taps **"Forgot Password?"** → start Forgot Password flow

---

### Social Login Flow (Google / Apple)

1. User taps **"Sign in with Google"** or **"Sign in with Apple"**
2. The Flutter SDK (`google_sign_in` / `sign_in_with_apple`) displays the native login UI
3. After successful SDK auth, an `idToken` is returned
4. App sends token to server → calls [POST /auth/social-login](../modules/auth.md#18-social-login-google--apple)
5. On success:
   - Tokens received
   - Navigate to **Home screen**
6. On `409 Conflict` → show error toast:
   > _"This email already has an account. Please log in with your email and password."_

---

### Forgot Password Flow

1. User taps **"Forgot Password?"**
2. Enters their email and taps **Send OTP** → calls [POST /auth/forgot-password](../modules/auth.md#13-forgot-password)
3. Always show success message regardless of whether the email exists:
   > _"If this email is registered, you'll receive a verification code shortly."_
4. Navigate to **OTP Verification screen**
5. User enters OTP and submits → calls [POST /auth/verify-otp](../modules/auth.md#12-verify-otp)
6. On success → receive `resetToken` → navigate to **New Password screen**
7. User enters and confirms new password → calls [POST /auth/reset-password](../modules/auth.md#14-reset-password)
8. On success → show toast _"Password reset successfully"_ → navigate to **Login screen**

---

### Token Refresh (Background)

1. Any API call returns `401 Unauthorized`
2. App silently calls [POST /auth/refresh-token](../modules/auth.md#15-refresh-token) in the background
3. On success → original request is retried automatically with the new token — user sees no interruption
4. On failure (token invalid/reused) → app force-logs out the user and navigates to the **Login screen** with message:
   > _"Your session has expired. Please log in again."_

---

## Edge Cases

### Email Already Registered (Registration)

- **Trigger**: User tries to register with an email that already exists
- **UI response**: Show inline error below the email field
- **Message**: _"An account with this email already exists. Please log in."_
- **Action**: Optionally show a **"Log in instead"** link

### Wrong Email or Password (Login)

- **Trigger**: API returns `401`
- **UI response**: Show inline error below the form
- **Message**: _"Incorrect email or password. Please try again."_
- **Action**: Clear the password field, keep the email field populated

### Account Restricted or Inactive (Login)

- **Trigger**: API returns `403`
- **UI response**: Show error toast or modal
- **Message**: _"Your account has been restricted. Please contact support."_

### Invalid or Expired OTP

- **Trigger**: API returns `400` on OTP submit
- **UI response**: Show inline error below the OTP input
- **Message**: _"Invalid or expired code. Please try again or request a new one."_
- **Action**: Clear the OTP input field

### Resend OTP Rate Limiting

- **Trigger**: User taps "Resend"
- **UI response**: Disable the Resend button immediately after tap; show a 60-second countdown
- **Message during cooldown**: _"Resend in 0:42"_ (countdown)
- **After cooldown**: Re-enable the Resend button

### Session Expired (Token Reuse Detected)

- **Trigger**: Background token refresh fails with `401`
- **UI response**: Force logout, navigate to Login screen
- **Message**: _"Your session has expired. Please log in again."_
- **Note**: This can happen if the user is logged in on multiple devices and one session is invalidated

### Social Login — Email Already Has a Password Account (409)

- **Trigger**: User tries Google/Apple login but their email is already registered with email + password
- **UI response**: Show error toast
- **Message**: _"This email already has an account. Please log in with your email and password."_
- **Action**: Do NOT auto-link accounts. User must log in manually.

### Apple Login — Email Not Shared

- **Trigger**: API returns `400` (Apple did not provide an email)
- **UI response**: Show error toast
- **Message**: _"Please allow email sharing to create an account with Apple."_
- **Note**: Apple only provides the email on the very first login. Subsequent logins are matched by Apple's user ID automatically — no action needed from the user.

### Social Login — Invalid or Expired Token (401)

- **Trigger**: The `idToken` from the SDK is rejected by the server
- **UI response**: Show error toast
- **Message**: _"Sign-in failed. Please try again."_
- **Action**: Allow user to retry the social login flow

---

## Endpoints Used

| #   | Method | Endpoint                    | Module Spec                                                                |
| --- | ------ | --------------------------- | -------------------------------------------------------------------------- |
| 1   | POST   | `/users`                    | [Module 2.1](../modules/user.md#21-create-user-registration--admin-create) |
| 2   | POST   | `/auth/login`               | [Module 1.1](../modules/auth.md#11-login)                                  |
| 3   | POST   | `/auth/verify-otp`          | [Module 1.2](../modules/auth.md#12-verify-otp)                             |
| 4   | POST   | `/auth/forgot-password`     | [Module 1.3](../modules/auth.md#13-forgot-password)                        |
| 5   | POST   | `/auth/reset-password`      | [Module 1.4](../modules/auth.md#14-reset-password)                         |
| 6   | POST   | `/auth/refresh-token`       | [Module 1.5](../modules/auth.md#15-refresh-token)                          |
| 7   | POST   | `/auth/resend-verify-email` | [Module 1.7](../modules/auth.md#17-resend-otp-resend-verify-email)         |
| 8   | POST   | `/auth/social-login`        | [Module 1.8](../modules/auth.md#18-social-login-google--apple)             |
