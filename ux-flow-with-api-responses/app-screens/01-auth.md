# Screen 1: Auth (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Profile](./06-profile.md) (change password, logout)

## UX Flow     

### Registration Flow
1. User "Create Account" e tap kore
2. Name, email, password, phone, country input kore
3. Submit → `POST /users` (→ 1.1)
4. Success → OTP verify screen e navigate + email check korte bole
5. Email na pele → "Resend" button → `POST /auth/resend-verify-email` (→ 1.8)
6. OTP input kore submit → `POST /auth/verify-otp` (→ 1.3)
7. Verification success hole → auto-login hoy → tokens receive kore → Welcome/Onboarding screen e navigate kore
 
### Login Flow
1. User email + password input kore submit e tap kore
2. Submit → `POST /auth/login` (→ 1.2) — optionally `deviceToken` for push notifications
3. Success → tokens receive kore + `refreshToken` httpOnly cookie auto-set hoy → Home/Dashboard screen e navigate kore
4. "Forgot Password?" link e tap korle → forgot password flow start hoy

### Social Login Flow (Google / Apple)
1. User "Sign in with Google" ba "Sign in with Apple" button e tap kore
2. Flutter SDK (google_sign_in / sign_in_with_apple) login UI dekhay
3. User authenticate korle SDK theke `idToken` pawa jay
4. App server-e pathay → `POST /auth/social-login` (→ 1.9)
5. Server token verify kore → tokens return kore → Home screen e navigate kore
6. **409 Conflict** asle → "This email already has an account. Please login with email and password." dekhay

### Forgot Password Flow
1. User "Forgot Password?" e tap kore
2. Email input kore OTP request pathay → `POST /auth/forgot-password` (→ 1.4)
3. Success message ashe (enumeration-safe) → OTP verify screen e navigate kore
4. OTP input kore verify kore → `POST /auth/verify-otp` (→ 1.3)
5. Success hole `resetToken` ashe → New password screen e navigate kore
6. New password input kore confirm kore → `POST /auth/reset-password` (→ 1.5)
7. Success → Login screen e navigate kore

### Token Refresh (Background)
1. App e thaka accessToken expire hoye 401 return korle
2. Background e client auto-retry kore → `POST /auth/refresh-token` (→ 1.6)
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

<!-- ══════════════════════════════════════ -->
<!--          REGISTRATION FLOW             -->
<!-- ══════════════════════════════════════ -->

### 1.1 Register

```
POST /users
Content-Type: application/json
Auth: None
```

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `createUser`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `createUserToDB`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phone": "+123456789",
  "country": "USA",
  "gender": "male",
  "dateOfBirth": "1995-05-15"
}
```

#### Responses

- **Scenario: Success (201)**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "User created successfully",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "verified": false,
      "status": "ACTIVE"
    }
  }
  ```
- **Scenario: Email Already Exists (400)**
  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "Email already exist!"
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--              AUTH FLOW                     -->
<!-- ══════════════════════════════════════ -->

### 1.2 Login

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
  "email": "john@example.com",
  "password": "Password123!",
  "deviceToken": "fcm-token-xyz" // optional
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

---

### 1.3 Verify OTP

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
    "message": "Verification Successful",
    "data": {
      "resetToken": "reset-token-for-password"
    }
  }
  ```
- **Scenario: Success (200) - Registration Auto-login**
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

### 1.4 Forgot Password

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
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Please check your email. We have sent you a one-time passcode (OTP)."
  }
  ```

---

### 1.5 Reset Password

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

### 1.6 Refresh Token

```
POST /auth/refresh-token
Content-Type: application/json
Auth: None
```

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `refreshToken`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `refreshTokenToDB`

#### Responses

- **Scenario: Success (200)**
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

---

### 1.7 Logout

```
POST /auth/logout
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

**Implementation:**
- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `logoutUser`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `logoutUserFromDB`

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

### 1.9 Social Login (Google / Apple)

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

## API Status

| # | Endpoint | Status | Roles | Notes |
|---|----------|:------:|:-----:|-------|
| 1.1 | `POST /users` | ✅ Done | Public | User registration |
| 1.2 | `POST /auth/login` | ✅ Done | Public | User login with deviceToken |
| 1.3 | `POST /auth/verify-otp` | ✅ Done | Public | OTP verification for registration/reset |
| 1.4 | `POST /auth/forgot-password` | ✅ Done | Public | Silent success enumeration protection |
| 1.5 | `POST /auth/reset-password` | ✅ Done | Reset Token | Set new password |
| 1.6 | `POST /auth/refresh-token` | ✅ Done | Refresh Token | Token rotation enabled |
| 1.7 | `POST /auth/logout` | ✅ Done | User | Invalidate session |
| 1.8 | `POST /auth/resend-verify-email` | ✅ Done | Public | Resend OTP code |
| 1.9 | `POST /auth/social-login` | ✅ Done | Public | Google + Apple ID token verification |
