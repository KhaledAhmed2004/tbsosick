# 02. Get Cards Stats

```http
GET /preference-cards/stats
Auth: Bearer {{accessToken}}
```

> Used to show stats on the Home screen. Returns counts for all public cards in the system and the user's own total cards.

## Implementation
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getStats`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `getPreferenceCardCountsFromDB`

### Business Logic (`getPreferenceCardCountsFromDB`)
- Database queries are run in parallel using `Promise.all`.
- `publicCards`: Total count of all cards with `visibility: 'PUBLIC'` across the entire system.
- `myCards`: Total count of cards (public + private) created by the current user.
- This ensures the user sees the global community size and their own contribution stats on the dashboard.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Card statistics retrieved successfully",
  "data": {
    "publicCards": 4,
    "myCards": 4
  }
}
```
