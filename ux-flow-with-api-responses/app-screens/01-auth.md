# Screen 1: Auth (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Profile](./06-profile.md) (change password, logout)

## UX Flow     

### Registration Flow
1. User taps "Create Account"
2. Enters name, email, and password
3. Submits the form → calls [POST /users](../modules/user.md#21-create-user-registration--admin-create)
4. On success → navigates to the `OTP verification screen` and is asked to check their email
5. If the email is not received → taps "Resend" → calls [POST /auth/resend-verify-email](../modules/auth.md#17-resend-otp-resend-verify-email)
6. OTP input kore submit → [POST /auth/verify-otp](../modules/auth.md#12-verify-otp)
7. If verification successful:

   * User is auto-logged in
   * Receives access + refresh tokens
   * Navigates to **Onboarding screen (only first-time users)**
   * Otherwise → directly goes to **Home screen**

 
### Login Flow
1. User enters email + password and taps **Login**
2. On submit → [POST /auth/login](../modules/auth.md#11-login) — optionally includes `deviceToken` for push notifications
3. On success:

   * Tokens are received
   * Refresh token is set as httpOnly cookie
   * User navigates to **Home screen**
4. If user taps **"Forgot Password?"** → starts forgot password flow

### Social Login Flow (Google / Apple)
1. User taps **"Sign in with Google / Apple"**
2. The Flutter SDK (google_sign_in / sign_in_with_apple) displays the login UI
3. After successful authentication, the SDK returns an `idToken`
4. The app sends the token to the server → calls [POST /auth/social-login](../modules/auth.md#18-social-login-google--apple)
5. On success:

   * Tokens returned
   * User navigates to **Home screen**
6. If **409 Conflict**:

   * Show message:
     **"This email already has an account. Please login with email and password."**

### Forgot Password Flow
1. User taps **"Forgot Password?"**
2. Enters their email and requests an OTP → calls [POST /auth/forgot-password](../modules/auth.md#13-forgot-password)
3. A success message is shown → navigates to the OTP verification screen
4. The user enters the OTP and verifies → calls [POST /auth/verify-otp](../modules/auth.md#12-verify-otp)
5. On success → receives a `resetToken` → navigates to the New Password screen
6. The user enters and confirms the new password → calls [POST /auth/reset-password](../modules/auth.md#14-reset-password)
7. On success → navigates to the Login screen

### Token Refresh (Background)
1. When the `access token expires`, the app receives a `401 Unauthorized` response
2. In the background, the client automatically retries → calls [POST /auth/refresh-token](../modules/auth.md#15-refresh-token)
3. A new token pair is received, and the original request is retried automatically

---

## Edge Cases

- **Email Already Exists**: Register korar somoy email already thakle error message dekhay.
- **Silent Success (Forgot Password)**: Security-r jonno email thakuk ba na thakuk, response identical thake.
- **Token Rotation Violation**: Refresh token reuse detect hole system auto-logout force kore security-r jonno.
- **OAuth without Password**: Social login (Google/Apple) kora users der profile update e password proyojon hoy na.
- **409 Conflict (Social Login)**: Email already exists with password — social login e auto-link hoy na, user-ke email/password diye login korte hobe.
- **Apple Email — First Time Only**: Apple shudhu prothombar email dey. Porer login-e `sub` (Apple user ID) diye match hoy.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | POST | `/users` | [Module 2.1](../modules/user.md#21-create-user-registration--admin-create) |
| 2 | POST | `/auth/login` | [Module 1.1](../modules/auth.md#11-login) |
| 3 | POST | `/auth/verify-otp` | [Module 1.2](../modules/auth.md#12-verify-otp) |
| 4 | POST | `/auth/forgot-password` | [Module 1.3](../modules/auth.md#13-forgot-password) |
| 5 | POST | `/auth/reset-password` | [Module 1.4](../modules/auth.md#14-reset-password) |
| 6 | POST | `/auth/refresh-token` | [Module 1.5](../modules/auth.md#15-refresh-token) |
| 7 | POST | `/auth/resend-verify-email` | [Module 1.7](../modules/auth.md#17-resend-otp-resend-verify-email) |
| 8 | POST | `/auth/social-login` | [Module 1.8](../modules/auth.md#18-social-login-google--apple) |
