# 07. Delete Preference Card

```http
DELETE /preference-cards/:cardId
Auth: Bearer {{accessToken}} (USER or SUPER_ADMIN)
```

> Permanently deletes a card. Deletion is only possible for the owner or SUPER_ADMIN. This is a hard delete; restoration is not possible. Admins can also use this endpoint to manually delete cards.

## Implementation
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `deleteCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `deletePreferenceCardFromDB`

### Business Logic (`deletePreferenceCardFromDB`)
- **Authorization**: Checks for record existence and verifies the owner or SUPER_ADMIN.
- **Hard Delete**: The record is permanently deleted using `findByIdAndDelete`.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card deleted",
  "data": {
    "deleted": true
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
  "message": "Not authorized to delete this card"
}
```
