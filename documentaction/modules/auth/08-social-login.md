# 08. Social Login (Google / Apple)

```http
POST /auth/social-login
Content-Type: application/json
Auth: None
```

> Authenticates user via Google or Apple ID tokens. Handles both signup and login.

## Request Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `provider` | `string` | `"google"` or `"apple"` |
| `idToken` | `string` | Provider-issued identity token |
| `nonce` | `string` | Replay protection token (Required for Apple) |
| `deviceToken` | `string` | (Optional) FCM token |
| `platform` | `string` | `"ios"`, `"android"`, or `"web"` |

```json
{
  "provider": "google",
  "idToken": "eyJhbGciOi...",
  "nonce": "aB3xK9mP2qR7...",
  "deviceToken": "fcm-token-xyz",
  "platform": "ios"
}
```

## Implementation

- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `socialLogin`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `socialLoginToDB`

### Business Logic
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

## Responses

### Scenario: Success — Login/Signup (200)
<details>
<summary><strong>View Response JSON</strong></summary>

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
</details>

### Scenario: Email Conflict (409)
<details>
<summary><strong>View Response JSON</strong></summary>

```json
{
  "success": false,
  "statusCode": 409,
  "message": "An account with this email already exists. Please login with your email and password."
}
```
</details>
