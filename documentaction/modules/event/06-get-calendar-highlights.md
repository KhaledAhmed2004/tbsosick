# 06. Get Calendar Highlights

```http
GET /events/calendar-highlights?from=2026-05-01&to=2026-05-31
Auth: Bearer {{accessToken}}
```

> **Performance Optimized**: This endpoint is designed specifically for the Monthly Calendar view. It returns ONLY the unique dates that have events, making the response extremely lightweight for high-speed calendar dot rendering.

## Query Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `from` | `string` | Start range (ISO YYYY-MM-DD) |
| `to` | `string` | End range (ISO YYYY-MM-DD) |

## Implementation

- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `getCalendarHighlights`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `getCalendarHighlightsFromDB`

### Business Logic (`getCalendarHighlightsFromDB`)
1. **High Performance**: Uses a MongoDB **Aggregation Pipeline** instead of standard `find()`.
2. **Data Minimization**:
    - `$match`: Filters by user and range.
    - `$group`: Groups by the date part of `startsAt`.
    - `$sort`: Returns dates in chronological order.
3. **Payload**: Instead of returning a full list of events, it returns a map of date strings to the **count of events** on that day. This allows the UI to show dot counts or just a dot based on truthiness.

## Responses

### Scenario: Success (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Calendar highlights fetched successfully",
  "data": {
    "2026-05-02": 1,
    "2026-05-06": 2,
    "2026-05-15": 1
  }
}
```
