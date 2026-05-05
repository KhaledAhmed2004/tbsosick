# 01. Create User (Registration / Admin Create)

```http
POST /users
Content-Type: application/json
Auth: None (registration) | Bearer {{accessToken}} (SUPER_ADMIN admin create)
```

> Used both for public mobile registration and for admin-driven account creation from the dashboard. Admin-created accounts are auto-verified and assigned role `USER`.

## Implementation
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `createUser`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `createUserToDB`

### Business Logic (`createUserToDB`)
1. **Unverified State**: All new users start with `verified: false`.
2. **Database Creation**: User is created in the database using [User.create()](file:///src/app/modules/user/user.model.ts).
3. **Verification OTP**: Automatically sends a verification code to the user's email via `sendVerificationOTP`. This is "fire and forget" (non-blocking).
4. **Auto-Assignment**: Default role is `USER` and default status is `ACTIVE`.

## Request Body (Mobile Registration)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phone": "+123456789",
  "country": "USA",
  "gender": "male",
  "dateOfBirth": "1995-05-15"
}
```

## Responses

### Scenario: Success — Mobile Registration (201)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "phone": "+123456789",
    "country": "USA",
    "gender": "male",
    "dateOfBirth": "1995-05-15",
    "profilePicture": "https://i.ibb.co/z5YHLV9/profile.png",
    "status": "ACTIVE",
    "verified": false,
    "isFirstLogin": true,
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-04-29T10:00:00.000Z"
  }
}
```
