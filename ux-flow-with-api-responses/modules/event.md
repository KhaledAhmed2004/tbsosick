# Event Module APIs

> **Section**: Backend API specifications for the event module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Calendar](../app-screens/05-calendar.md) — Event list, create, view, update, delete
> - [App Notifications](../app-screens/07-notifications.md) — Event reminders triggered from event creation

---

## Endpoints Index

| # | Method | Endpoint | Auth | Used By |
|---|---|---|---|---|
| 4.1 | GET | `/events` | Bearer | [App Calendar](../app-screens/05-calendar.md) |
| 4.2 | POST | `/events` | Bearer | [App Calendar](../app-screens/05-calendar.md) |
| 4.3 | GET | `/events/:eventId` | Bearer | [App Calendar](../app-screens/05-calendar.md) |
| 4.4 | PATCH | `/events/:eventId` | Bearer | [App Calendar](../app-screens/05-calendar.md) |
| 4.5 | DELETE | `/events/:eventId` | Bearer | [App Calendar](../app-screens/05-calendar.md) |

---

### 4.1 List My Events

```
GET /events?from=2026-04-01&to=2026-04-30
Auth: Bearer {{accessToken}}
```

> User-er shob events fetch korar jonno. Calendar view-er jonno date range pathano jay.

**Query Parameters:**
- `from`: Start date (YYYY-MM-DD).
- `to`: End date (YYYY-MM-DD).

**Implementation:**
- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `getMyEvents`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `listEventsForUserFromDB`

**Business Logic (`listEventsForUserFromDB`):**
- `userId` ebong optional `from`/`to` date range diye event filter kora hoy.
- Date range thakle `startsAt` field-er opor `$gte` ebong `$lte` operator use kore search kora hoy.
- Shudhu matro proyojoniyo field gula (`title`, `eventType`, `startsAt`, `endsAt`, `location`, `notes`, `personnel`, `preferenceCard`) select kore return kora hoy.
- Performance optimization-er jonno `.lean()` use kora hoy.

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Events fetched successfully",
    "data": [
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0e",
        "title": "Knee Arthroscopy Surgery",
        "startsAt": "2026-04-10T08:00:00.000Z",
        "endsAt": "2026-04-10T10:00:00.000Z",
        "eventType": "SURGERY",
        "location": "Operating Room 4",
        "notes": "Prepare all preference cards",
        "createdAt": "2026-04-07T10:30:00.000Z"
      }
    ]
  }
  ```

---

### 4.2 Create Event

```
POST /events
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Naya event toiri korar jonno. Auto reminder set hoy (24h ebong 1h age).

**Implementation:**
- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `createEvent`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `createEventInDB`

**Business Logic (`createEventInDB`):**
- **Time Normalization (`resolveTimeRange`)**:
    - Input data theke `startsAt` ebong `endsAt` resolve kora hoy.
    - Legacy format (`date`, `time`, `durationHours`) support kore, jeta internal-y `startsAt` ebong `endsAt`-e convert hoy.
    - `endsAt` oboshshoi `startsAt`-er pore hote hobe, na hole `BAD_REQUEST` error throw kore.
- `userId` shoho event database-e create kora hoy → `EventModel.create()`.
- Legacy field gula (`date`, `time`, `durationHours`) database-e save kora hoy na.
- Event successfully toiri hole 2-ti reminder automatically schedule kora hoy:
    1. Event shuru hovar 24 ghonta age.
    2. Event shuru hovar 1 ghonta age.
- Reminders push notification ebong database notification hishebe schedule kora hoy via `NotificationBuilder`.
- Shob sheshe create hoyeche emon `event` object-ti return kora hoy.

**Request Body:**
```json
{
  "title": "Surgery with Dr. Smith",
  "date": "2026-04-15",
  "time": "09:30",
  "durationHours": 3,
  "eventType": "SURGERY",
  "location": "Main Hospital - OR 2",
  "preferenceCard": "664a1b2c3d4e5f6a7b8c9d0x",
  "notes": "Hip Replacement case",
  "personnel": {
    "leadSurgeon": "Dr. Smith",
    "surgicalTeam": ["Nurse Joy", "Anesthesiologist Bob"]
  }
}
```

#### Responses

- **Scenario: Success (201)**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Event created successfully",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0f",
      "title": "Surgery with Dr. Smith",
      "startsAt": "2026-04-15T09:30:00.000Z",
      "endsAt": "2026-04-15T12:30:00.000Z",
      "eventType": "SURGERY",
      "location": "Main Hospital - OR 2",
      "preferenceCard": "664a1b2c3d4e5f6a7b8c9d0x",
      "notes": "Hip Replacement case",
      "personnel": {
        "leadSurgeon": "Dr. Smith",
        "surgicalTeam": ["Nurse Joy", "Anesthesiologist Bob"]
      }
    }
  }
  ```

---

### 4.3 Get Event Details

```
GET /events/:eventId
Auth: Bearer {{accessToken}}
```

> Specific event-er full details fetch korar jonno (jekhane `:eventId` holo Event-er unique ID). Modal ba Details screen render korar age call kora hoy.

**Implementation:**
- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `getEventById`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `getEventByIdFromDB`

**Business Logic (`getEventByIdFromDB`):**
- Database theke `eventId` diye event search kora hoy.
- Jodi event na pauya jay → `null` return kore (controller setake handle kore).
- Authorization check: Event-ti jodi onno kono user-er hoy ebong requester `SUPER_ADMIN` na hoy → `FORBIDDEN` error throw kore.
- `preferenceCard` field-ti populate kora hoy (shudhu `cardTitle` select kora hoy).
- Performance optimization-er jonno `.lean()` use kora hoy.

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Event details fetched successfully",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0f",
      "title": "Surgery with Dr. Smith",
      "startsAt": "2026-04-15T09:30:00.000Z",
      "endsAt": "2026-04-15T12:30:00.000Z",
      "eventType": "SURGERY",
      "location": "Main Hospital - OR 2",
      "preferenceCard": {
        "_id": "664a1b2c3d4e5f6a7b8c9d0x",
        "cardTitle": "Hip Replacement Card"
      },
      "notes": "Hip Replacement case details and preparations.",
      "personnel": {
        "leadSurgeon": "Dr. Smith",
        "surgicalTeam": ["Nurse Joy", "Anesthesiologist Bob"]
      },
      "createdAt": "2026-04-01T10:00:00.000Z",
      "updatedAt": "2026-04-01T10:00:00.000Z"
    }
  }
  ```

---

### 4.4 Update Event

```
PATCH /events/:eventId
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Existing event-er (`:eventId`) title, date, time, location, notes, ba personnel update korar jonno. Reminders automatically reschedule hoy.

**Implementation:**
- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `updateEvent`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `updateEventInDB`

**Business Logic (`updateEventInDB`):**
- Database theke `eventId` diye event search kora hoy.
- Jodi event na pauya jay → `NOT_FOUND` error return kore.
- Authorization check: Event-ti jodi onno kono user-er hoy ebong requester `SUPER_ADMIN` na hoy → `FORBIDDEN` error throw kore.
- **Time Re-resolution**: Jodi payload-e time related field (`startsAt`, `endsAt`, `date`, `time`, `durationHours`) thake, tobe `resolveTimeRange` logic call kore notun `startsAt` ebong `endsAt` calculate kora hoy.
- Request body theke asha data `Object.assign()`-er maddhome existing event object-e merge kora hoy.
- Shob sheshe update hoyeche emon `updatedEvent` return kora hoy.

**Request Body (Partial Update supported):**
```json
{
  "title": "Updated Surgery Title",
  "time": "10:00",
  "durationHours": 4,
  "location": "Operating Room 1 - Main Wing",
  "notes": "Updated case notes for the surgical team.",
  "personnel": {
    "leadSurgeon": "Dr. House",
    "surgicalTeam": ["Nurse Joy", "Dr. Wilson", "Intern Foreman"]
  }
}
```

#### Responses

- **Scenario: Success (200)**
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
        "surgicalTeam": ["Nurse Joy", "Dr. Wilson", "Intern Foreman"]
      },
      "updatedAt": "2026-04-09T14:30:00.000Z"
    }
  }
  ```

---

### 4.5 Delete Event

```
DELETE /events/:eventId
Auth: Bearer {{accessToken}}
```

> Kono event permanent-ly remove korar jonno.

**Implementation:**
- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `deleteEvent`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `deleteEventFromDB`

**Business Logic (`deleteEventFromDB`):**
- Database theke `eventId` diye event search kora hoy.
- Jodi event na pauya jay → `NOT_FOUND` error return kore.
- Authorization check: Event-ti jodi onno kono user-er hoy ebong requester `SUPER_ADMIN` na hoy → `FORBIDDEN` error throw kore.
- `findByIdAndDelete` call kore event-ti permanent-ly remove kora hoy ebong deleted object-ti return kora hoy.

#### Responses

- **Scenario: Success (200)**
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

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 4.1 | `/events` | `GET` | Bearer | Done | List own events with date range |
| 4.2 | `/events` | `POST` | Bearer | Done | Create event with auto reminders |
| 4.3 | `/events/:eventId` | `GET` | Bearer | Done | Get specific event details |
| 4.4 | `/events/:eventId` | `PATCH` | Bearer | Done | Update event info |
| 4.5 | `/events/:eventId` | `DELETE` | Bearer | Done | Remove event |
