# 04. Reset Password

```http
POST /auth/reset-password
Content-Type: application/json
Auth: Bearer {{resetToken}}
```

> Resets user password using a valid reset token.

## Request Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `newPassword` | `string` | User's new password |

```json
{
  "newPassword": "NewStrongPassword123!"
}
```

## Implementation

- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `resetPassword`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `resetPasswordToDB`

### Business Logic
1. **Token Validation**: Verifies `resetToken` exists and is not expired.
2. **Permission Check**: Verifies `isResetPassword: true` flag on user.
3. **Password Update**: Hashes `newPassword`, updates user, and sets `isResetPassword: false`.
4. **Session Invalidation**: Increments `tokenVersion` (Global Logout).
5. **Cleanup**: Deletes used and pending reset tokens.

## Responses

### Scenario: Success (200)
<details>
<summary><strong>View Response JSON</strong></summary>

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Your password has been successfully reset."
}
```
</details>
