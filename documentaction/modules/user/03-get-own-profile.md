# 03. Get Own Profile

```http
GET /users/profile
Auth: Bearer {{accessToken}}
```

### Business Logic (`getUserProfileFromDB`)
1. **Identification**: Uses the `id` from the decoded JWT token.
2. **Verification**: Checks if the user exists using `isExistUserById`.
3. **Retrieval**: Returns the full user document (Mongoose handles hidden fields like `password`).

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile data retrieved successfully",
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
    "isFirstLogin": false,
    "createdAt": "2026-03-15T10:30:00.000Z",
    "updatedAt": "2026-04-29T11:00:00.000Z"
  }
}
```
