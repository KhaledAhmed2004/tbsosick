# 05. Update User Status (Admin)

```http
PATCH /users/:userId/status
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

### Business Logic (`updateUserStatusInDB`)
1. **Existence Check**: Verifies the user exists using `isExistUserById`.
2. **Direct Update**: Uses `findByIdAndUpdate` to update the `status` field.
3. **Allowed Statuses**: Typically toggles between `ACTIVE` and `RESTRICTED`.

## Implementation
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `updateUserStatus`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `updateUserStatusInDB`

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User status updated",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "RESTRICTED",
    "createdAt": "2026-03-15T10:30:00.000Z",
    "updatedAt": "2026-05-05T12:30:00.000Z"
  }
}
```
