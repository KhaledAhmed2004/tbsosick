# 06. Complete Onboarding

```http
PATCH /users/complete-onboarding
Content-Type: application/json
Auth: Bearer <token>
```

> Marks the user's onboarding process as completed.

## Request Body
None required.

## Implementation

- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `completeOnboarding`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `completeOnboardingToDB`

### Business Logic
1. **User Verification**: Validates the user from the JWT token.
2. **Update State**: Sets `isOnboardingCompleted: true` in the user's document.
3. **Response**: Returns the updated user object.

## Responses

### Scenario: Success (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Onboarding marked as completed",
  "data": {
    "id": "69fa332f3fc3858c40265420",
    "name": "Khaled Ahmed",
    "role": "USER",
    "email": "khaledahmednayeem2004@gmail.com",
    "country": "USA",
    "gender": "male",
    "dateOfBirth": "1995-05-15",
    "phone": "+123456789",
    "profilePicture": "https://i.ibb.co/z5YHLV9/profile.png",
    "isOnboardingCompleted": true,
    "status": "ACTIVE",
    "verified": true,
    "deviceTokens": [
      {
        "token": "fcm-token-xyz",
        "lastSeenAt": "2026-05-05T18:32:02.435Z"
      }
    ],
    "createdAt": "2026-05-05T18:13:03.393Z",
    "updatedAt": "2026-05-05T18:33:49.649Z",
    "_v": 0
  }
}
```