# 05. Delete Event

```http
DELETE /events/:eventId
Auth: Bearer {{accessToken}}
```

> Permanently removes an event from the system.

## Implementation

- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `deleteEvent`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `deleteEventFromDB`

### Business Logic (`deleteEventFromDB`)
1. **Existence Check**: Verifies the event exists via `findById`.
2. **Authorization**: Ensures the requester owns the event or is a `SUPER_ADMIN`.
3. **Atomic Deletion**: Performs `findByIdAndDelete` to remove the record permanently.
4. **Cleanup Note**: Currently, scheduled reminders for deleted events remain in the scheduler but will fail silently when triggered if the resource is missing (Resource lookup check).

## Responses

### Scenario: Success (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Event deleted successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "title": "Updated Surgery Title"
  }
}
```
