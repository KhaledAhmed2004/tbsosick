# Screen 1: Auth

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Overview](./02-overview.md) (Dashboard main stats), Profile (change password, logout)

## UX Flow

### Login Flow
1. Admin email ebong password input kore submit button e tap kore
2. Submit → [POST /auth/login](../modules/auth.md#11-login)
3. Success hole → JWT access token ebong refresh token receive kore; `refreshToken` auto-set hoye jay as httpOnly cookie.
4. Dashboard Overview screen e navigate kore
5. Error hole (wrong credentials) → Generic error message dekhay (enumeration prevent korar jonno)

### Forgot Password Flow
1. Admin "Forgot Password?" link e click kore
2. Email input kore OTP request pathay → [POST /auth/forgot-password](../modules/auth.md#13-forgot-password)
3. Success message ashe (even if email exists na — enumeration prevention) → OTP verify screen e navigate kore
4. Email e jawa OTP input kore submit kore → [POST /auth/verify-otp](../modules/auth.md#12-verify-otp)
5. OTP na pele → "Resend OTP" button e click kore → [POST /auth/resend-verify-email](../modules/auth.md#17-resend-otp-resend-verify-email)
6. Success hole → short-lived `resetToken` ashe (auto-login hoy na verified user-er jonno)
7. New password input kore confirm kore → [POST /auth/reset-password](../modules/auth.md#14-reset-password) — headers e `resetToken` pathay
8. Success hole → Login screen e redirect hoye jay

### Change Password Flow
1. Admin profile menu theke "Change Password" select kore
2. Current password ebong new password input kore submit kore → [POST /auth/change-password](../modules/auth.md#19-change-password)
3. Success hole → toast dekhay ebong session intact thake

### Logout Flow
1. Admin sidebar ba profile dropdown theke "Logout" e click kore
2. Logout → [POST /auth/logout](../modules/auth.md#16-logout) — `deviceToken` pathay push notifications clean korar jonno
3. Success → Local state clear hoy ebong Login screen e navigate kore

### Token Refresh (Background / Silent)
1. Kono API call 401 (access token expired) return korle
2. Client auto-retry kore → [POST /auth/refresh-token](../modules/auth.md#15-refresh-token) — cookie ba body theke pathay
3. New accessToken + refreshToken pair receive kore (Rotation logic applied) → original request retry kore
4. Refresh token expire hole ba reuse detect hole (Rotation violation) → Login screen e navigate kore

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Non-existent email (forgot-password)** | Silent success — identity reveal kore na (Enumeration prevention). |
| **Double-submit OTP** | Atomic update logic use kora hoyeche, tai shudhu prothom request ta valid hobe. |
| **Parallel Password Reset** | Sob tokens invalidated hoye jay ekbar reset successful hole (tokenVersion increment). |
| **Simultaneous Refresh** | Token Versioning (Rotation) logic use kora hoyeche — reuse hole immediate logout force kore. |
| **Deleted / Inactive Account** | Generic 403 Forbidden error message ashe login attempt korle. |
| **New User Verification** | Verification successful hole auto-login hoy ebong tokens return kore (Dashboard-e kom use hoy). |

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | POST | `/auth/login` | [Module 1.1](../modules/auth.md#11-login) |
| 2 | POST | `/auth/verify-otp` | [Module 1.2](../modules/auth.md#12-verify-otp) |
| 3 | POST | `/auth/forgot-password` | [Module 1.3](../modules/auth.md#13-forgot-password) |
| 4 | POST | `/auth/reset-password` | [Module 1.4](../modules/auth.md#14-reset-password) |
| 5 | POST | `/auth/refresh-token` | [Module 1.5](../modules/auth.md#15-refresh-token) |
| 6 | POST | `/auth/logout` | [Module 1.6](../modules/auth.md#16-logout) |
| 7 | POST | `/auth/resend-verify-email` | [Module 1.7](../modules/auth.md#17-resend-otp-resend-verify-email) |
| 8 | POST | `/auth/change-password` | [Module 1.9](../modules/auth.md#19-change-password) |
