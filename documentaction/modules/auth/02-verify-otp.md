# 02. Verify OTP

```http
POST /auth/verify-otp
Content-Type: application/json
Auth: None
```

> Registration or Forgot Password flow OTP verification.

## Request Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | User's email |
| `otp` | `string` | 6-digit verification code |

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

## Implementation

- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `verifyEmail`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `verifyEmailToDB`

### Business Logic
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

## Responses

### Scenario: Success (200) - Forgot Password Flow
<details>
<summary><strong>View Response JSON</strong></summary>

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
</details>

### Scenario: Success (200) - Registration Auto-login
<details>
<summary><strong>View Response JSON</strong></summary>

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
</details>
