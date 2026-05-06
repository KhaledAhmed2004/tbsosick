# 04. Update Own Profile

```http
PATCH /users/profile
Content-Type: multipart/form-data
Auth: Bearer {{accessToken}}
```

> Supports text fields and a `profilePicture` file upload.

## Implementation
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `updateProfile`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `updateProfileToDB`

### Business Logic (`updateProfileToDB`)
1. **Validation**: Checks if the user exists.
2. **File Cleanup**: If a new `profilePicture` is uploaded, the old file is automatically unlinked (deleted) from the server using `unlinkFile`.
3. **Atomic Update**: Uses `findOneAndUpdate` to apply changes and returns the updated document.

## Request Body (Multipart Form-Data)

| Key | Value Type | Description |
| :--- | :--- | :--- |
| `name` | `text` | e.g., "John Updated" |
| `phone` | `text` | e.g., "+123456789" |
| `country` | `text` | e.g., "USA" |
| `profilePicture` | `file` | Select binary image file |

> **Note for Postman**: Since the request uses `multipart/form-data`, use the **form-data** body type in Postman and pass these keys individually.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Updated",
    "email": "john@example.com",
    "phone": "+123456789",
    "country": "USA",
    "profilePicture": "uploads/profiles/new-pic.png",
    "updatedAt": "2026-05-05T13:00:00.000Z"
  }
}
```
