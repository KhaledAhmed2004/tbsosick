# 04. Update Event

```http
PATCH /events/:eventId
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Updates an existing event. Reminders are automatically rescheduled if time-related fields are changed.

## Request Body

*(Partial Update supported)*

```json
{
  "title": "Updated Surgery Title",
  "time": "10:00",
  "durationHours": 4,
  "location": "Operating Room 1 - Main Wing",
  "eventType": "SURGERY",
  "notes": "Updated case notes for the surgical team.",
  "personnel": {
    "leadSurgeon": "Dr. House",
    "surgicalTeam": ["Dr. Wilson", "Dr. Chase"]
  }
}
```

## Implementation

- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `updateEvent`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `updateEventInDB`

### Business Logic (`updateEventInDB`)
1. **Access Control**: Validates event existence and user ownership (or `SUPER_ADMIN` status).
2. **Time Update Detection (`touchesTime`)**:
    - Checks if the payload contains `startsAt`, `endsAt`, `date`, `time`, or `durationHours`.
    - If detected, it merges current event values with the update payload and runs `resolveTimeRange`.
    - Updates `startsAt` and `endsAt` fields accordingly.
3. **Data Merging**: Uses `Object.assign()` to merge the normalized payload into the existing Mongoose document.
4. **Validation Hooks**: Triggers `event.save()` which runs Mongoose validation and updates the `updatedAt` timestamp.

## Responses

### Scenario: Success (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Event updated successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "title": "Updated Surgery Title",
    "startsAt": "2026-04-15T10:00:00.000Z",
    "endsAt": "2026-04-15T14:00:00.000Z",
    "location": "Operating Room 1 - Main Wing",
    "eventType": "SURGERY",
    "notes": "Updated case notes for the surgical team.",
    "personnel": {
      "leadSurgeon": "Dr. House",
      "surgicalTeam": ["Dr. Wilson", "Dr. Chase"]
    },
    "updatedAt": "2026-04-09T14:30:00.000Z"
  }
}
```
