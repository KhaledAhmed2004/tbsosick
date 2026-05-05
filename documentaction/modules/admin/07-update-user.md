# 07. Update User & Status (Admin)

```http
PATCH /admin/users/:userId
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Update any user field, including their account status (ACTIVE, RESTRICTED, etc.).

## Request Body
```json
{
  "name": "Updated Name",
  "status": "RESTRICTED",
  "role": "USER"
}
```

## Implementation
- **Route**: [admin.route.ts](file:///src/app/modules/admin/admin.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `adminUpdateUser`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `updateUserByAdminInDB`

### Business Logic (`updateUserByAdminInDB`)
1. **Validation**: Uses `adminUpdateUserZodSchema` to validate the input body.
2. **Merging Logic**: This is a **Unified Update** endpoint. It can handle partial updates of profile data (name, phone) and state transitions (status, role) in a single request.
3. **Database Update**: Performs a `findByIdAndUpdate` to persist changes.

## Field Reference (Admin Specific)
| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | `string` | `ACTIVE`, `INACTIVE`, `RESTRICTED`, `DELETED` |
| `role` | `string` | `SUPER_ADMIN`, `USER` |
| `specialty` | `string` | Professional specialty |

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User updated",
  "data": {
    "id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "Updated Name",
    "status": "RESTRICTED",
    "updatedAt": "2026-05-05T10:00:00.000Z"
  }
}
```
