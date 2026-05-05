# 01. Login

```http
POST /auth/login
Content-Type: application/json
Auth: None
```

> Authenticates user and issues access/refresh tokens. Supports push notification registration.

## Request Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | User's registered email |
| `password` | `string` | User's password |
| `deviceToken` | `string` | (Optional) FCM token for push notifications |

```json
{
  "email": "admin@example.com",
  "password": "StrongPassword123!",
  "deviceToken": "fcm-token-xyz"  // optional
}
```

> `deviceToken` is optional and used for push notifications (FCM).

## Implementation

- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `loginUser`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `loginUserFromDB`

### Business Logic
1. **User Lookup**: Finds user by email, selecting `password` and `tokenVersion`.
2. **Account Checks**:
   - Throws `401 Unauthorized` if user not found.
   - Throws `403 Forbidden` if status is `DELETED`, `RESTRICTED`, or `INACTIVE`.
   - Throws `401 Unauthorized` if email is not `verified`.
3. **Password Validation**: Compares input password with hashed password using `bcrypt`.
4. **Token Generation**: Issues **Access Token** (short-lived) and **Refresh Token** (long-lived). Both tokens include `id`, `role`, `email`, and `tokenVersion`. `tokenVersion` defaults to `0` if not present in DB.
5. **Session Management**:
   - Updates `isFirstLogin` to `false` on successful first login.
   - Registers/updates `deviceToken` for push notifications if provided.
   - Sets `refreshToken` in a secure `httpOnly` cookie.

## Responses

### Scenario: Success (200)
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

### Scenario: Invalid Credentials (401)
<details>
<summary><strong>View Response JSON</strong></summary>

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password"
}
```
</details>
