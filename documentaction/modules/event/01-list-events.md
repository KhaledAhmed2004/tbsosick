# 01. List My Events

```http
GET /events?date=2026-04-10
GET /events?from=2026-04-01&to=2026-04-30
Auth: Bearer {{accessToken}}
```

> **Dual Pattern Endpoint**: Used for both single-day views (Home screen) and monthly calendar views (Calendar screen).

## Usage Patterns

### 1. Daily View (Home / Details)
Pass the `date` parameter to get events for a specific day.
- **Query**: `/events?date=2026-04-10`

### 2. Monthly Dots (Calendar Highlights)
Pass `from` and `to` to get all events for a month. The frontend can then map these to the calendar dots.
- **Query**: `/events?from=2026-04-01&to=2026-04-30`

## Query Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `date` | `string` | Specific date (ISO YYYY-MM-DD). If provided, `from` and `to` are ignored. |
| `from` | `string` | Start range (ISO YYYY-MM-DD). |
| `to` | `string` | End range (ISO YYYY-MM-DD). |

## Implementation

- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `getMyEvents`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `listEventsForUserFromDB`

### Business Logic (`listEventsForUserFromDB`)
1. **Parameter Resolution**:
    - If `date` is provided, it acts as both the start and end of the range.
    - Otherwise, it uses the `from` and `to` range.
2. **User Filtering**: Strictly filters events where `userId` matches the authenticated requester.
3. **Date Range Search**:
    - Start: Sets `$gte` to `00:00:00.000Z` of the resolved start date.
    - End: Sets `$lte` to `23:59:59.999Z` of the resolved end date.
4. **Status Tagging**: Dynamically adds a `tag` field for each event (`Upcoming` vs `Past`).
5. **Sorting**: Sorts results by `startsAt` ascending.
6. **Projection**: Returns minimal fields (`title`, `tag`, `date`, `time`, `durationInHours`, `eventType`) to keep the payload light for calendar dots.
7. **Performance**: Uses `.lean()`.

## Responses

### Scenario: Success (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Events fetched successfully",
  "data": [
    {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "title": "Knee Arthroscopy Surgery",
      "tag": "Past",
      "date": "2026-04-10",
      "time": "08:00 AM",
      "durationInHours": 1.5,
      "eventType": "SURGERY"
    }
  ]
}
```
