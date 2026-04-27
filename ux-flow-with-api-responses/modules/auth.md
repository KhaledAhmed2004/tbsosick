# Auth Module APIs

> **Section**: Backend API specifications for the auth module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Auth](../app-screens/01-auth.md) — Mobile registration, login, OTP, social login, forgot/reset password
> - [Dashboard Auth](../dashboard-screens/01-auth.md) — Admin login, OTP, change password, logout
> - [App Profile](../app-screens/06-profile.md) — Logout flow

---

## Endpoints Index

| # | Method | Endpoint | Auth | Used By |
|---|---|---|---|---|
| 1.1 | POST | `/auth/login` | Public | [App Auth](../app-screens/01-auth.md), [Dashboard Auth](../dashboard-screens/01-auth.md) |
| 1.2 | POST | `/auth/verify-otp` | Public | [App Auth](../app-screens/01-auth.md), [Dashboard Auth](../dashboard-screens/01-auth.md) |
| 1.3 | POST | `/auth/forgot-password` | Public | [App Auth](../app-screens/01-auth.md), [Dashboard Auth](../dashboard-screens/01-auth.md) |
| 1.4 | POST | `/auth/reset-password` | Reset Token | [App Auth](../app-screens/01-auth.md), [Dashboard Auth](../dashboard-screens/01-auth.md) |
| 1.5 | POST | `/auth/refresh-token` | Refresh Token | [App Auth](../app-screens/01-auth.md), [Dashboard Auth](../dashboard-screens/01-auth.md) |
| 1.6 | POST | `/auth/logout` | Bearer | [App Auth](../app-screens/01-auth.md), [App Profile](../app-screens/06-profile.md), [Dashboard Auth](../dashboard-screens/01-auth.md) |
| 1.7 | POST | `/auth/resend-verify-email` | Public | [App Auth](../app-screens/01-auth.md), [Dashboard Auth](../dashboard-screens/01-auth.md) |
| 1.8 | POST | `/auth/social-login` | Public | [App Auth](../app-screens/01-auth.md) |
| 1.9 | POST | `/auth/change-password` | Bearer | [Dashboard Auth](../dashboard-screens/01-auth.md) |

---

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

> `deviceToken` is optional and used for push notifications (FCM).

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

### 1.2 Verify OTP

```
POST /auth/verify-otp
Content-Type: application/json
Auth: None
```

> Registration ba Forgot Password flow e OTP verify korar jonno use hoy.

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `verifyEmail`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `verifyEmailToDB`

**Request Body:**
```json
{
  "email": "john@example.com",
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
- **Scenario: Success (200) - Registration Auto-login / New User Auto-login**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Email verified successfully",
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

### 1.3 Forgot Password

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
  "email": "john@example.com"
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
  "newPassword": "NewStrongPassword123!"
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

> `deviceToken` is sent so push notifications can be cleaned up server-side.

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

### 1.7 Resend OTP (Resend Verify Email)

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
  "email": "john@example.com"
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

### 1.8 Social Login (Google / Apple)

```
POST /auth/social-login
Content-Type: application/json
Auth: None
```

> Mobile SDK (google_sign_in / sign_in_with_apple) theke paowa ID token server-e verify kore login/signup kore.

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `socialLogin`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `socialLoginToDB`

**Request Body:**
```json
{
  "provider": "google",
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "nonce": "aB3xK9mP2qR7...",
  "deviceToken": "fcm-token-xyz",
  "platform": "ios",
  "appVersion": "1.2.0"
}
```

| Field         | Required    | Type   | Notes                                           |
| ------------- | ----------- | ------ | ----------------------------------------------- |
| `provider`    | Yes         | string | `"google"` or `"apple"`                         |
| `idToken`     | Yes         | string | Provider SDK theke paowa ID token               |
| `nonce`       | Recommended | string | Replay attack prevention (Apple e must, Google e Flutter plugin support kore na) |
| `deviceToken` | No          | string | FCM push notification token                     |
| `platform`    | No          | string | `"ios"` / `"android"` / `"web"`                 |
| `appVersion`  | No          | string | App version tracking                            |

#### Responses

- **Scenario: Success — Login/Signup (200)**
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
- **Scenario: Invalid/Expired Token (401)**
  ```json
  {
    "success": false,
    "statusCode": 401,
    "message": "Invalid Google ID token"
  }
  ```
- **Scenario: Nonce Mismatch (401)**
  ```json
  {
    "success": false,
    "statusCode": 401,
    "message": "Nonce mismatch"
  }
  ```
- **Scenario: Email Already Exists with Password (409)**
  ```json
  {
    "success": false,
    "statusCode": 409,
    "message": "An account with this email already exists. Please login with your email and password."
  }
  ```
- **Scenario: Account Restricted/Deleted (403)**
  ```json
  {
    "success": false,
    "statusCode": 403,
    "message": "Your account has been deleted. Contact support."
  }
  ```
- **Scenario: Apple — No Email Shared (400)**
  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "Email is required to create an account. Please allow email sharing."
  }
  ```

---

### 1.9 Change Password

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

## API Status

| # | Endpoint | Status | Roles | Notes |
|---|----------|:------:|:-----:|-------|
| 1.1 | `POST /auth/login` | Done | Public | User login with deviceToken; status checks (RESTRICTED, INACTIVE) added |
| 1.2 | `POST /auth/verify-otp` | Done | Public | OTP verification — auto-login vs Reset Token logic included |
| 1.3 | `POST /auth/forgot-password` | Done | Public | Silent success enumeration protection |
| 1.4 | `POST /auth/reset-password` | Done | Reset Token | tokenVersion incremented to invalidate all sessions |
| 1.5 | `POST /auth/refresh-token` | Done | Refresh Token | Token rotation with reuse detection |
| 1.6 | `POST /auth/logout` | Done | User | Device token removal included |
| 1.7 | `POST /auth/resend-verify-email` | Done | Public | Standard OTP resend logic |
| 1.8 | `POST /auth/social-login` | Done | Public | Google + Apple ID token verification |
| 1.9 | `POST /auth/change-password` | Done | User | Auth required, current password validation |
