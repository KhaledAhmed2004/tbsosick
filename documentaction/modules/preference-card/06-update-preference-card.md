# 06. Update Preference Card / Admin Verification

```http
PATCH /preference-cards/:cardId
Content-Type: multipart/form-data
Auth: Bearer {{accessToken}} (USER or SUPER_ADMIN)
```

> **Unified Endpoint**: Updates an existing card. This single endpoint handles both regular user updates (title, surgeon, etc.) and Admin moderation (verification).

## Implementation
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `updateCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `updatePreferenceCardInDB`

### Business Logic (`updatePreferenceCardInDB`)
- **Authorization**: 
  - **Regular User**: Can only update their own cards.
  - **SUPER_ADMIN**: Can update any card and is the **only** role allowed to modify `verificationStatus`.
- **Verification Gate**: Setting `verificationStatus: 'VERIFIED'` requires the card to be complete (all mandatory fields filled).
- **Verification Reset**: If critical card fields are updated by a regular user, the status automatically reverts to `UNVERIFIED`.
- **Photo Management**: New photos are appended to the `photoLibrary` array.

**Middleware chain**: `auth(USER, SUPER_ADMIN) → fileHandler(photoLibrary max 5) → parseBody → validateRequest`

## Request Body (Multipart Form-Data)

| Key | Value Type | Description |
| :--- | :--- | :--- |
| `cardTitle` | `text` | e.g., "Updated Knee Arthroscopy" |
| `medication` | `text` | e.g., "Updated medication info" |
| `visibility` | `text` | "PRIVATE" or "PUBLIC" |
| `verificationStatus` | `text` | **Admin Only**: "VERIFIED" or "UNVERIFIED" |
| `photoLibrary` | `file` | Select new binary image files to append |

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card updated",
  "data": {
    "verificationStatus": "VERIFIED",
    "cardTitle": "Updated Knee Arthroscopy",
    "updatedAt": "2026-03-16T08:00:00.000Z"
  }
}
```

### Scenario: Unauthorized (403)
- Regular user trying to update someone else's card.
- Regular user trying to update `verificationStatus`.

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Not authorized to update this card"
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
