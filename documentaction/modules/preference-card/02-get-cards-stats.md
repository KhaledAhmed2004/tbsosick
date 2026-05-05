# 02. Get Cards Stats

```http
GET /preference-cards/stats
Auth: Bearer {{accessToken}}
```

> Used to show stats on the Home screen. Returns counts for total public cards and the user's own cards.

## Implementation
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getStats`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `getCountsForCards`

### Business Logic (`getCountsForCards`)
- Database queries are run in parallel using `Promise.all`.
- The count of total published cards (`AllCardsCount`) and the count of cards created by the current user (`myCardsCount`) are calculated.
- Accurate counts are returned to keep dashboard stats updated.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Card statistics retrieved successfully",
  "data": {
    "publicCards": 120,
    "myCards": 15
  }
}
```
