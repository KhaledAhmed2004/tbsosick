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

**Business Logic:**
1. **User Lookup**: Finds user by email, selecting `password` and `tokenVersion` (hidden by default).
2. **Account Checks**:
   - Throws `401 Unauthorized` if user not found.
   - Throws `403 Forbidden` if status is `DELETED`, `RESTRICTED`, or `INACTIVE`.
   - Throws `401 Unauthorized` if email is not `verified`.
3. **Password Validation**: Compares input password with hashed password using `bcrypt`.
4. **Token Generation**:
   - Issues **Access Token** (short-lived).
   - Issues **Refresh Token** (long-lived).
   - Both tokens include `id`, `role`, `email`, and `tokenVersion`.
5. **Session Management**:
   - Updates `isFirstLogin` to `false` on successful first login.
   - Registers/updates `deviceToken` for push notifications if provided.
   - Sets `refreshToken` in a secure `httpOnly` cookie.

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

**Business Logic:**
1. **Validation**: Atomic lookup for user with matching `email`, `otp`, and `expireAt > now`.
2. **Scenario A: New User / Registration**:
   - If user is not yet `verified`:
     - Sets `verified: true` and clears OTP fields.
     - **Auto-login**: Issues Access and Refresh tokens immediately so the user doesn't have to login manually after verification.
3. **Scenario B: Forgot Password Flow**:
   - If user is already `verified`:
     - Sets `isResetPassword: true` flag on the user document (acts as a one-time permission for the reset endpoint).
     - Clears OTP fields.
     - Generates a cryptographically secure `resetToken` (via `cryptoToken()` helper).
     - Saves this token in the `ResetToken` collection with a short TTL.
     - Returns the `resetToken` to the client.

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

**Business Logic:**
1. **User Check**: Checks if user exists.
2. **Silent Success**: If user doesn't exist, returns a success message anyway. This prevents "Account Enumeration" attacks where hackers check which emails are registered.
3. **Cleanup**: Deletes any previously issued reset tokens for this user to ensure only the latest request is valid.
4. **OTP Generation**: Generates a 6-digit random OTP.
5. **Email Delivery**: Sends an email with the OTP using the `resetPassword` template.
6. **Storage**: Saves the OTP and a TTL-based expiry (e.g., 3-5 minutes) to the user's `authentication` field in the database.

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

**Business Logic:**
1. **Token Validation**: Verifies the `resetToken` exists in the database and has not expired.
2. **Permission Check**: Verifies the user has the `isResetPassword: true` flag (set during OTP verification).
3. **Password Update**: 
   - Hashes the `newPassword` using `bcrypt`.
   - Updates the user's password.
   - Sets `isResetPassword: false` to prevent token reuse.
4. **Session Invalidation**: **Increments `tokenVersion` by 1**. This immediately invalidates all currently active Access and Refresh tokens for this user across all devices (Global Logout).
5. **Cleanup**: Deletes the used `resetToken` and any other pending reset tokens for this user.

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

**Business Logic:**
1. **Extraction**: Reads `refreshToken` from `httpOnly` cookie (preferred) or request body.
2. **Verification**: Verifies the JWT signature and expiration.
3. **User Status**: Checks if the user still exists and is not `DELETED`.
4. **Reuse Detection**:
   - Compares the `tokenVersion` inside the JWT with the current `tokenVersion` in the database.
   - If they don't match, it means the token has already been rotated or the user's sessions were invalidated (e.g., via password reset).
   - Throws `401 Unauthorized` and forces a fresh login.
5. **Token Rotation**:
   - **Increments `tokenVersion` by 1** in the database.
   - Issues a brand new **Access Token** and **Refresh Token** containing the updated `tokenVersion`.
   - Updates the `httpOnly` cookie with the new refresh token.

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

**Business Logic:**
1. **Device Cleanup**: Removes the provided `deviceToken` from the user's document in the database. This stops push notifications for this specific device.
2. **Cookie Clearance**: Instructs the browser to clear the `refreshToken` `httpOnly` cookie.
3. **Stateless Invalidation**: Since JWTs are stateless, the server doesn't "delete" the access token, but by clearing the refresh token and device token, the session is effectively terminated on the client side.

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

**Business Logic:**
1. **User Lookup**: Checks if the user exists and is not `DELETED`.
2. **OTP Generation**: Generates a new 6-digit OTP.
3. **Database Update**: Overwrites the existing `authentication` OTP and expiry.
4. **Email Delivery**: Sends the new OTP via email.
5. **Rate Limiting**: (Handled by middleware) Prevents users from spamming the resend button.

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

**Business Logic:**
1. **Token Verification**:
   - **Google**: Verifies the `idToken` against multiple Client IDs (iOS, Android, Web). Checks `email_verified` flag.
   - **Apple**: Requires a `nonce` for replay protection. Verifies the `idToken` signature.
2. **Identity Matching**:
   - Finds user strictly by `googleId` or `appleId` (provider's `sub` field).
   - *Security Note*: Does not match by email to prevent "Account Hijacking" (where an attacker controls a provider account with the same email as a local account).
3. **Scenario: Existing User**:
   - Checks account status (`DELETED`, `RESTRICTED`).
   - Updates `deviceToken` and `isFirstLogin` if needed.
4. **Scenario: New User**:
   - Checks if the email already belongs to a password-based account. If yes, throws `409 Conflict` (no auto-linking for security).
   - Creates a new user document with `verified: true` and the provider ID.
5. **Token Issuance**: Issues Access and Refresh tokens and sets the `httpOnly` cookie.

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

**Business Logic:**
1. **Verification**: Validates that the `currentPassword` provided by the user matches the one stored in the database.
2. **New Password Check**: Ensures the `newPassword` is different from the `currentPassword`.
3. **Storage**: Hashes the `newPassword` using `bcrypt` and updates the user's record.
4. **Auth Required**: This endpoint requires a valid `accessToken` and the user's ID is extracted from the JWT payload.

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
