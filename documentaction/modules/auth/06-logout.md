# 06. Logout

```http
POST /auth/logout
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Logs out user by clearing cookies and removing device tokens.

## Request Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `deviceToken` | `string` | FCM token to be removed |

```json
{
  "deviceToken": "fcm-token-xyz"
}
```

## Implementation

- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `logoutUser`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `logoutUserFromDB`

### Business Logic
1. **Device Cleanup**: Removes the provided `deviceToken` from the user's document in the database. This stops push notifications for this specific device.
2. **Cookie Clearance**: Instructs the browser to clear the `refreshToken` `httpOnly` cookie.
3. **Stateless Invalidation**: Since JWTs are stateless, the server doesn't "delete" the access token, but by clearing the refresh token and device token, the session is effectively terminated on the client side.

## Responses

### Scenario: Success (200)
<details>
<summary><strong>View Response JSON</strong></summary>

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged out successfully."
}
```
</details>
