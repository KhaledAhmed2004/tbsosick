# 06. Update Preference Card

```http
PATCH /preference-cards/:cardId
Content-Type: multipart/form-data
Auth: Bearer {{accessToken}} (USER)
```

> Updates an existing card. Only the fields that need changing should be sent. Updates are only possible for the owner or SUPER_ADMIN.

## Implementation
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `updateCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `updatePreferenceCardInDB`

### Business Logic (`updatePreferenceCardInDB`)
- **Ownership Check**: Only the card owner or SUPER_ADMIN can update.
- **Verification Reset**: If critical card fields are updated, the verification status automatically reverts to `UNVERIFIED` (to maintain moderation).
- **Photo Management**: New photos are appended to the `photoLibrary` array upon upload.

**Middleware chain**: `auth(USER) → fileHandler(photoLibrary max 5) → parseBody → validateRequest`

## Request Body (partial)
```json
{
  "cardTitle": "Updated Knee Arthroscopy",
  "medication": "Updated medication info",
  "visibility": "PUBLIC"
}
```

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card updated",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "cardTitle": "Updated Knee Arthroscopy",
    "visibility": "PUBLIC",
    "published": true,
    "verificationStatus": "UNVERIFIED",
    "updatedAt": "2026-03-16T08:00:00.000Z"
  }
}
```

### Scenario: Not Found (404)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Preference card not found"
}
```

### Scenario: Forbidden (403)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Not authorized to update this card"
}
```
