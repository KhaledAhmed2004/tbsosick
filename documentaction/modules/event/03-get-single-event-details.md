# 03. Get Single Event Details

```http
GET /events/:eventId
Auth: Bearer {{accessToken}}
```
> Fetches full details for a specific event.

## Implementation

- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `getEventById`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `getEventByIdFromDB`

### Business Logic (`getEventByIdFromDB`)
1. **Ownership Validation**:
    - Fetches event by ID. Throws `404 Not Found` if missing.
    - Verifies `event.userId` matches `user.id` unless the requester is a `SUPER_ADMIN`.
2. **Status Tagging**: Dynamically adds a `tag` field based on current server time:
    - **Upcoming**: For events in the future.
    - **Past**: For events where the date and time have already passed.
3. **Data Population**: Automatically populates the `preferenceCard` reference.
4. **Read Optimization**: Uses `.lean()` for performance.

## Responses

### Scenario: Success (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Event details fetched successfully",
  "data": {
    "_id": "6818a2b12e4a8c1d44a92001",
    "title": "Knee Replacement Surgery",
    "tag": "Upcoming",
    "date": "2026-05-10",
    "time": "10:30 AM",
    "durationInHours": 3,
    "location": "City Hospital, Operating Room 2",
    "eventType": "SURGERY",
    "personnel": {
      "leadSurgeon": "Dr. John Doe",
      "surgicalTeamMembers": [
        "Dr. Sarah Smith",
        "Nurse Alex",
        "Technician Robert"
      ]
    },
    "linkedPreferenceCard": {
      "_id": "6817f8b92e4a8c1d44a91f20",
      "title": "Orthopedic Preference Card"
    },
    "keyNotes": "Patient requires special orthopedic instruments.",
    "createdBy": "6817f7c12e4a8c1d44a91e11",
    "createdAt": "2026-05-05T18:30:00.000Z",
    "updatedAt": "2026-05-05T18:30:00.000Z"
  }
}
```
