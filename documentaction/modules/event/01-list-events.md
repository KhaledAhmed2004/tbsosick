# 01. List My Events

```http
GET /events?from=2026-04-01&to=2026-04-30
Auth: Bearer {{accessToken}}
```

> Fetches user-specific events. Date range filtering is supported for calendar views.

## Query Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `from` | `string` | Start date (ISO YYYY-MM-DD) |
| `to` | `string` | End date (ISO YYYY-MM-DD) |

## Implementation

- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `getMyEvents`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `listEventsForUserFromDB`

### Business Logic (`listEventsForUserFromDB`)
1. **User Filtering**: Strictly filters events where `userId` matches the authenticated requester.
2. **Date Range Search**:
    - If `from` is provided: Sets `$gte` to `00:00:00.000Z` of that date.
    - If `to` is provided: Sets `$lte` to `23:59:59.999Z` of that date.
3. **Status Tagging**: Dynamically adds a `tag` field for each event:
    - **Upcoming**: For events in the future.
    - **Past**: For events that have already happened.
4. **Sorting**: Sorts results by `startsAt` in ascending order (1).
5. **Projection**: Only returns essential fields (`title`, `tag`, `date`, `time`, `durationInHours`, `eventType`) for the list view to minimize payload size.
6. **Performance**: Uses `.lean()` for faster query execution.

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
