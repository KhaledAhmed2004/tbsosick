# 02. Get User Details (Public/User)

```http
GET /users/:userId/user
Authorization: Bearer {{accessToken}}
```

## Implementation
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getUserDetailsById`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `getUserDetailsByIdFromDB`

### Business Logic (`getUserDetailsByIdFromDB`)
1. **Access Control**: Used for viewing profiles of other users.
2. **Retrieval**: Fetches user data excluding `password` and `authentication`.
3. **Rate Limiting**: This endpoint is protected by [rateLimitMiddleware](file:///src/app/middlewares/rateLimit.ts) (60 requests/minute).

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User details retrieved successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+123456789",
    "role": "USER",
    "status": "ACTIVE",
    "verified": true,
    "profilePicture": "https://i.ibb.co/z5YHLV9/profile.png",
    "country": "USA",
    "gender": "male",
    "dateOfBirth": "1995-05-15",
    "specialty": "Cardiology",
    "hospital": "City Hospital",
    "createdAt": "2026-03-15T10:30:00.000Z",
    "updatedAt": "2026-03-15T10:30:00.000Z"
  }
}
```
