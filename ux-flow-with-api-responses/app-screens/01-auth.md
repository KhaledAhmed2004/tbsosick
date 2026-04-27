# Screen 1: Auth (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Profile](./06-profile.md) (change password, logout)

## UX Flow     

### Registration Flow
1. User "Create Account" e tap kore
2. Name, email, password, phone, country input kore
3. Submit → [POST /users](../modules/user.md#21-create-user-registration--admin-create)
4. Success → OTP verify screen e navigate + email check korte bole
5. Email na pele → "Resend" button → [POST /auth/resend-verify-email](../modules/auth.md#17-resend-otp-resend-verify-email)
6. OTP input kore submit → [POST /auth/verify-otp](../modules/auth.md#12-verify-otp)
7. Verification success hole → auto-login hoy → tokens receive kore → Welcome/Onboarding screen e navigate kore
 
### Login Flow
1. User email + password input kore submit e tap kore
2. Submit → [POST /auth/login](../modules/auth.md#11-login) — optionally `deviceToken` for push notifications
3. Success → tokens receive kore + `refreshToken` httpOnly cookie auto-set hoy → Home/Dashboard screen e navigate kore
4. "Forgot Password?" link e tap korle → forgot password flow start hoy

### Social Login Flow (Google / Apple)
1. User "Sign in with Google" ba "Sign in with Apple" button e tap kore
2. Flutter SDK (google_sign_in / sign_in_with_apple) login UI dekhay
3. User authenticate korle SDK theke `idToken` pawa jay
4. App server-e pathay → [POST /auth/social-login](../modules/auth.md#18-social-login-google--apple)
5. Server token verify kore → tokens return kore → Home screen e navigate kore
6. **409 Conflict** asle → "This email already has an account. Please login with email and password." dekhay

### Forgot Password Flow
1. User "Forgot Password?" e tap kore
2. Email input kore OTP request pathay → [POST /auth/forgot-password](../modules/auth.md#13-forgot-password)
3. Success message ashe (enumeration-safe) → OTP verify screen e navigate kore
4. OTP input kore verify kore → [POST /auth/verify-otp](../modules/auth.md#12-verify-otp)
5. Success hole `resetToken` ashe → New password screen e navigate kore
6. New password input kore confirm kore → [POST /auth/reset-password](../modules/auth.md#14-reset-password)
7. Success → Login screen e navigate kore

### Token Refresh (Background)
1. App e thaka accessToken expire hoye 401 return korle
2. Background e client auto-retry kore → [POST /auth/refresh-token](../modules/auth.md#15-refresh-token)
3. New token pair receive kore original request retry kore

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
