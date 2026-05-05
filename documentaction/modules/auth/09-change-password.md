# 09. Change Password

```http
POST /auth/change-password
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Allows authenticated users to change their password.

## Request Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `currentPassword` | `string` | User's current password |
| `newPassword` | `string` | User's new password |

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewStrongPassword123!"
}
```

## Implementation

- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `changePassword`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `changePasswordToDB`

### Business Logic
1. **Verification**: Validates `currentPassword` against stored hash.
2. **New Password Check**: Ensures `newPassword` is different.
3. **Storage**: Hashes and updates password.
4. **Auth Required**: This endpoint requires a valid `accessToken` and the user's ID is extracted from the JWT payload.

## Responses

### Scenario: Success (200)
<details>
<summary><strong>View Response JSON</strong></summary>

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Your password has been successfully changed"
}
```
</details>
