# Screen 1: Auth

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Overview](./02-overview.md) (Dashboard main stats), Profile (change password, logout)

## UX Flow

### Login Flow
1. Admin email ebong password input kore submit button e tap kore
2. Submit → `POST /auth/login` (→ 1.1)
3. Success hole → JWT access token ebong refresh token receive kore; `refreshToken` auto-set hoye jay as httpOnly cookie.
4. Dashboard Overview screen e navigate kore
5. Error hole (wrong credentials) → Generic error message dekhay (enumeration prevent korar jonno)

### Forgot Password Flow
1. Admin "Forgot Password?" link e click kore
2. Email input kore OTP request pathay → `POST /auth/forgot-password` (→ 1.2)
3. Success message ashe (even if email exists na — enumeration prevention) → OTP verify screen e navigate kore
4. Email e jawa OTP input kore submit kore → `POST /auth/verify-otp` (→ 1.3)
5. Success hole → short-lived `resetToken` ashe (auto-login hoy na)
6. New password input kore confirm kore → `POST /auth/reset-password` (→ 1.4) — reset token pathay
7. Success hole → Login screen e redirect hoye jay

### Token Refresh (Background / Silent)
1. Kono API call 401 (access token expired) return korle
2. Client auto-retry kore → `POST /auth/refresh-token` (→ 1.5) — cookie ba body theke pathay
3. New accessToken + refreshToken pair receive kore (Rotation logic applied) → original request retry kore
4. Refresh token expire hole ba reuse detect hole (Rotation violation) → Login screen e navigate kore

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Non-existent email (forgot-password)** | Silent success — identity reveal kore na. |
| **Double-submit OTP** | Atomic update logic use kora hoyeche, tai shudhu prothom request ta valid hobe. |
| **Parallel Password Reset** | Sob tokens invalidated hoye jay ekbar reset successful hole. |
| **Simultaneous Refresh** | Token Versioning (Rotation) logic use kora hoyeche — reuse hole immediate logout force kore. |
| **Deleted / Inactive Account** | Generic 403 Forbidden error message ashe. |

---

<!-- ════════════════════════════════════════════ -->
<!--              AUTH FLOW                     -->
<!-- ════════════════════════════════════════════ -->

### 1.1 Login

```
POST /auth/login
Content-Type: application/json
Auth: None
```

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `loginUser`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `loginUserFromDB`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "StrongPassword123!"
}
```

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "User logged in successfully.",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
  ```
- **Scenario: Invalid Credentials (401)**
  ```json
  {
    "success": false,
    "statusCode": 401,
    "message": "Invalid email or password"
  }
  ```
- **Scenario: Account Restricted (403)**
  ```json
  {
    "success": false,
    "statusCode": 403,
    "message": "Your account is restricted. Contact support."
  }
  ```

---

### 1.2 Forget Password

```
POST /auth/forgot-password
Content-Type: application/json
Auth: None
```

**Request Body:**
```json
{
  "email": "admin@example.com"
}
```

#### Responses

- **Scenario: Silent Success (200)**
  > Email thakuk ba na thakuk, response identical thake security-r jonno.
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Please check your email. We have sent you a one-time passcode (OTP)."
  }
  ```

---

### 1.3 Verify OTP

```
POST /auth/verify-otp
Content-Type: application/json
Auth: None
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Verification Successful: Please securely store and utilize this code for reset password",
    "data": {
      "resetToken": "a3f8c2e1b4d7..."
    }
  }
  ```
- **Scenario: Invalid/Expired OTP (400)**
  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "Invalid or expired verification code"
  }
  ```

---

### 1.5 Refresh Token

```
POST /auth/refresh-token
Content-Type: application/json
Auth: None (Uses refreshToken from cookie or body)
```

#### Responses

- **Scenario: Success (200 - Rotation Applied)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Token refreshed successfully.",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
  ```
- **Scenario: Token Reuse Detected (401)**
  > Jodi puran refresh token abar use kora hoy (attacker stole it), tokenVersion mismatch hobe and logout force hobe.
  ```json
  {
    "success": false,
    "statusCode": 401,
    "message": "Refresh token expired or already used. Please login again."
  }
  ```

---

## API Status

| # | Endpoint | Status | Notes |
|---|----------|:------:|-------|
| 1.1 | `POST /auth/login` | ✅ Done | Generic errors + status checks added |
| 1.2 | `POST /forgot-password` | ✅ Done | Silent success added |
| 1.3 | `POST /verify-otp` | ✅ Done | Atomic update for double-submit fix |
| 1.4 | `POST /reset-password` | ✅ Done | Token rotation (tokenVersion) added |
| 1.5 | `POST /refresh-token` | ✅ Done | Rotation with reuse detection implemented |
