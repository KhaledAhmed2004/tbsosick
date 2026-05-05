# 08. Favorite a Card

```http
PUT /preference-cards/favorites/cards/:cardId
Auth: Bearer {{accessToken}}
```

> Adds a card to the favorites list. Follows idempotent behavior (returns 200 OK if already favorited).

## Implementation
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `favoriteCard`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `favoritePreferenceCardInDB`

### Business Logic (`favoritePreferenceCardInDB`)
- Checks for card existence; throws a `NOT_FOUND` error if it doesn't exist.
- If the card is soft-deleted (`isDeleted: true`), a `GONE` (410) error is returned.
- Visibility check: If it's a private card, only the creator can favorite it.
- Idempotency is ensured using a unique index on `(userId, cardId)`. Returns success silently if already favorited.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card favorited",
  "data": { "favorited": true }
}
```
