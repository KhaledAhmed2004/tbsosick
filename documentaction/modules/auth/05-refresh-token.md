# 05. Refresh Token

```http
POST /auth/refresh-token
Content-Type: application/json
Auth: None (Uses refreshToken from cookie or body)
```

> Rotates refresh token and issues a new access token. Implements reuse detection.

## Request Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `refreshToken` | `string` | (Optional) Refresh token if not using cookies |

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

## Implementation

- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `refreshToken`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `refreshTokenToDB`

### Business Logic
1. **Extraction**: Reads `refreshToken` from `httpOnly` cookie or request body.
2. **Verification**: Verifies JWT signature and expiration.
3. **Reuse Detection**: Compares `tokenVersion` in JWT with database. Mismatch forces logout.
   - **Note**: If `tokenVersion` is missing in the database (lean object), it defaults to `0` for comparison.
4. **Token Rotation**: Increments `tokenVersion`, issues new Access/Refresh tokens, and updates cookie.
5. If someone tries to use an old refresh token again (for example, a stolen token), the backend will detect that it is no longer valid because the tokenVersion does not match. As a result, the user will be forced to log out for security.

## Responses

### Scenario: Success (200 - Rotation Applied)
<details>
<summary><strong>View Response JSON</strong></summary>

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
</details>

### Scenario: Token Reuse Detected (401)
<details>
<summary><strong>View Response JSON</strong></summary>

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Refresh token expired or already used. Please login again."
}
```
</details>
