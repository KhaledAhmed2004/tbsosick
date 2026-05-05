# 04. Update User (Admin)

```http
PATCH /users/:userId
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Update any user field (whitelist approach).

## Implementation
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `adminUpdateUser`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `updateUserByAdminInDB`

### Business Logic (`updateUserByAdminInDB`)
1. **User Retrieval**: Fetches the user by ID, including the `password` field to ensure correct `user.save()` behavior if password-related hooks exist.
2. **Whitelisting**: Only allows updates to specific fields: `name`, `email`, `phone`, `country`, `specialty`, `hospital`, `location`, `gender`, `dateOfBirth`, `profilePicture`, `status`, and `role`.
3. **Save & Return**: Calls `user.save()` to trigger Mongoose middleware. Returns a plain object with sensitive fields (`password`, `authentication`) removed.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User updated",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "Updated Name",
    "email": "updated@example.com",
    "phone": "+123456789",
    "role": "USER",
    "status": "ACTIVE",
    "country": "USA",
    "specialty": "Cardiology",
    "hospital": "City Hospital",
    "gender": "male",
    "dateOfBirth": "1995-05-15",
    "profilePicture": "https://i.ibb.co/z5YHLV9/profile.png",
    "createdAt": "2026-03-15T10:30:00.000Z",
    "updatedAt": "2026-05-05T12:00:00.000Z"
  }
}
```
