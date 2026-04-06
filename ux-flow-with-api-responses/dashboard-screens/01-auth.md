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
5. OTP na pele → "Resend OTP" button e click kore → `POST /auth/resend-verify-email` (→ 1.8)
6. Success hole → short-lived `resetToken` ashe (auto-login hoy na verified user-er jonno)
7. New password input kore confirm kore → `POST /auth/reset-password` (→ 1.4) — headers e `resetToken` pathay
8. Success hole → Login screen e redirect hoye jay

### Logout Flow
1. Admin sidebar ba profile dropdown theke "Logout" e click kore
2. Logout → `POST /auth/logout` (→ 1.6) — `deviceToken` pathay push notifications clean korar jonno
3. Success → Local state clear hoy ebong Login screen e navigate kore

### Token Refresh (Background / Silent)
1. Kono API call 401 (access token expired) return korle
2. Client auto-retry kore → `POST /auth/refresh-token` (→ 1.5) — cookie ba body theke pathay
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
  "password": "StrongPassword123!",
  "deviceToken": "fcm-token-xyz"  // optional
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

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `forgetPassword`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `forgetPasswordToDB`

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

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `verifyEmail`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `verifyEmailToDB`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

#### Responses

- **Scenario: Success (200) - Forgot Password Flow**
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

- **Scenario: Success (200) - New User Auto-login**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Email verify successfully",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
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

### 1.4 Reset Password

```
POST /auth/reset-password
Content-Type: application/json
Auth: Bearer {{resetToken}}
```

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `resetPassword`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `resetPasswordToDB`

**Request Body:**
```json
{
  "newPassword": "StrongPassword123!"
}
```

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Your password has been successfully reset."
  }
  ```

---

### 1.5 Refresh Token

```
POST /auth/refresh-token
Content-Type: application/json
Auth: None (Uses refreshToken from cookie or body)
```

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `refreshToken`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `refreshTokenToDB`

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

### 1.6 Logout

```
POST /auth/logout
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `logoutUser`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `logoutUserFromDB`

**Request Body:**
```json
{
  "deviceToken": "fcm-token-xyz"
}
```

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "User logged out successfully."
  }
  ```

---

### 1.7 Change Password

```
POST /auth/change-password
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `changePassword`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `changePasswordToDB`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewStrongPassword123!"
}
```

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Your password has been successfully changed"
  }
  ```

---

### 1.8 Resend OTP

```
POST /auth/resend-verify-email
Content-Type: application/json
Auth: None
```

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `resendVerifyEmail`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `resendVerifyEmailToDB`

**Request Body:**
```json
{
  "email": "admin@example.com"
}
```

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Verification code has been resent to your email."
  }
  ```

---

## API Status

| # | Endpoint | Status | Notes |
|---|----------|:------:|-------|
| 1.1 | `POST /auth/login` | ✅ Done | Status checks (RESTRICTED, INACTIVE) added |
| 1.2 | `POST /auth/forgot-password` | ✅ Done | Silent success for enumeration prevention |
| 1.3 | `POST /auth/verify-otp` | ✅ Done | Auto-login vs Reset Token logic included |
| 1.4 | `POST /auth/reset-password` | ✅ Done | tokenVersion incremented to invalidate all sessions |
| 1.5 | `POST /auth/refresh-token` | ✅ Done | Token rotation with reuse detection |
| 1.6 | `POST /auth/logout` | ✅ Done | Device token removal included |
| 1.7 | `POST /auth/change-password` | ✅ Done | Auth required, current password validation |
| 1.8 | `POST /auth/resend-verify-email` | ✅ Done | Standard OTP resend logic |
