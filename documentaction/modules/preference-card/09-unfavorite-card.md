# 09. Unfavorite a Card

```http
DELETE /preference-cards/favorites/cards/:cardId
Auth: Bearer {{accessToken}}
```

> Removes from the favorites list. Follows idempotent behavior (returns 200 OK even if already unfavorited).

## Implementation
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `unfavoriteCard`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `unfavoritePreferenceCardInDB`

### Business Logic (`unfavoritePreferenceCardInDB`)
- Checks for card existence.
- Removes the matching record for the specific `userId` and `cardId` from the favorites collection.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card unfavorited",
  "data": { "favorited": false, "deletedCount": 1 }
}
```
