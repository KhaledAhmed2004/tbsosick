# 02. Create Event

```http
POST /events
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Creates a new event and automatically schedules reminders (24h and 1h before).

## Request Body

| Field | Required | Type | Notes |
| :--- | :--- | :--- | :--- |
| `title` | Yes | `string` | Event title |
| `date` | Yes | `string` | ISO date `YYYY-MM-DD` |
| `time` | Yes | `string` | 24-hour clock `HH:mm` or `HH:mm AM/PM` |
| `durationInHours` | Yes | `number` | Duration in hours (e.g., 1.5) |
| `location` | Yes | `string` | Free text location |
| `eventType` | Yes | `enum` | `SURGERY`, `MEETING`, `CONSULTATION`, `OTHER` |
| `preferenceCard` | No | `string` | ObjectId of a Preference Card |
| `personnel` | No | `object` | `{ leadSurgeon, surgicalTeamMembers }` |
| `keyNotes` | No | `string` | Additional case notes |

```json
{
  "title": "Knee Replacement Surgery",
  "date": "2026-05-10",
  "time": "10:30 AM",
  "location": "City Hospital, Operating Room 2",
  "preferenceCard": "6817f8b92e4a8c1d44a91f20",
  "durationInHours": 3,
  "eventType": "SURGERY",
  "personnel": {
    "leadSurgeon": "Dr. John Doe",
    "surgicalTeamMembers": [
      "Dr. Sarah Smith",
      "Nurse Alex",
      "Technician Robert"
    ]
  },
  "keyNotes": "Patient requires special orthopedic instruments."
}
```

## Implementation

- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `createEvent`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `createEventInDB`

### Business Logic (`createEventInDB`)
1. **Time Range Resolution (`resolveTimeRange`)**:
    - **Flexible Input**: Supports both new format (`startsAt`, `endsAt`) and legacy format (`date`, `time`, `durationInHours`).
    - **Validation**: Ensures `endsAt` is strictly after `startsAt`. Throws `400 Bad Request` on invalid strings or logical errors.
2. **Payload Sanitization**: Strips temporary fields like `date`, `time` before database insertion.
3. **Status Tagging**: Dynamically calculates a `tag` field for the response:
    - **Upcoming**: If the event `startsAt` is in the future.
    - **Past**: If the event date and time have already passed.
4. **Database Creation**: Creates the event document linked to the user's ID.
5. **Auto-Reminder Scheduling**:
    - Automatically schedules two **Push Notifications** via `NotificationBuilder`:
    - **24 Hours Before**: A reminder sent exactly one day before the event.
    - **1 Hour Before**: A final reminder sent 60 minutes before the start time.
    - Note: If the event is created too close to the start time (e.g., in 30 minutes), the relevant reminders are skipped.

## Responses

### Scenario: Success (201)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Event created successfully",
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
    "linkedPreferenceCard": "6817f8b92e4a8c1d44a91f20",
    "keyNotes": "Patient requires special orthopedic instruments.",
    "createdBy": "6817f7c12e4a8c1d44a91e11",
    "createdAt": "2026-05-05T18:30:00.000Z",
    "updatedAt": "2026-05-05T18:30:00.000Z"
  }
}
```
