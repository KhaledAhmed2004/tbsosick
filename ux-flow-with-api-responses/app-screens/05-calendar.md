# Screen 5: Calendar

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Home](./02-home.md) (Quick access)

## UX Flow

### Calendar Initial Load
1. User bottom navigation bar theke "Calendar" icon-e tap kore.
2. Page load-e current month-er shob events fetch hoy → `GET /events?from=2026-04-01&to=2026-04-30` (→ 5.1).
3. Screen render hoy:
   - Top-e ekta **Interactive Calendar View** thake.
   - Jey shob date-e event ache, sheygula **highlighted** (e.g., colored dot ba background circle) thake jate user shohojei identify korte pare.
   - Calendar-er niche "Events for [Selected Date]" list thake.
   - Default-vabe current date-er events dekhay.
   - User kono specific date-e tap korle niche oi diner related events update hoy.
   - "Create Event" button (+) thake.

### Date Selection Flow
1. User calendar-er kono highlighted date-e click kore.
2. Frontend filtered data theke oi date-er events niche list-e show kore (ba proyojone naya kore fetch korte pare).
3. User oi list theke event-e click kore details dekhte pare.

### Create Event Flow
1. User "Create Event" button-e tap kore.
2. Ekta modal/bottom-sheet open hoy jekhane title, date, time, duration, location, notes, ebong personnel input deya jay.
3. Submit → `POST /events` (→ 5.2).
4. Success hole list update hoy ebong success message dekhay.

### Event Management (View, Update & Delete)
1. User "Upcoming Events" list theke kono event-e tap kore.
2. Event details fetch hoy → `GET /events/:eventId` (→ 5.3).
3. Details modal-e user data dekhte pare ebong "Edit" icon-e tap kore update korte pare → `PATCH /events/:eventId` (→ 5.4).
4. User chaile event delete-o korte pare "Delete" button-e tap kore → `DELETE /events/:eventId` (→ 5.5).
5. Success hole calendar refresh hoy.

---

## Edge Cases

- **No Events**: Selected date-e kono event na thakle "No events for this day" placeholder dekhabe.
- **Overlapping Events**: Multiple events thakle list-e serial-e dekhabe.
- **Past Events**: Past dates-er events view-only thakte pare (frontend logic).

---

### 5.1 List My Events

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
- Date range thakle `$gte` ebong `$lte` operator use kore search kora hoy.
- Shudhu matro proyojoniyo field gula (`title`, `eventType`, `date`, `time`, `durationHours`, `location`, `notes`, `personnel`, `preferenceCard`) select kore return kora hoy.

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
        "date": "2026-04-10T00:00:00.000Z",
        "time": "08:00",
        "durationHours": 2,
        "eventType": "SURGERY",
        "location": "Operating Room 4",
        "notes": "Prepare all preference cards",
        "createdAt": "2026-04-07T10:30:00.000Z"
      }
    ]
  }
  ```

---

### 5.2 Create Event

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
- Input `date` (YYYY-MM-DD) ebong `time` (HH:mm) format-e ache kina check kora hoy; na thakle `BAD_REQUEST` error throw kore.
- `userId` shoho event database-e create kora hoy → `EventModel.create()`.
- Event successfully toiri hole 2-ti kaj automatically hoy:
    1. Event shuru hovar 24 ghonta age ekta push reminder schedule kora hoy.
    2. Event shuru hovar 1 ghonta age aro ekta reminder schedule kora hoy.
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

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Event created successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "title": "Surgery with Dr. Smith",
    "date": "2026-04-15T00:00:00.000Z",
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
}
```

---

### 5.3 Get Event Details

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
- Jodi event na pauya jay → `NOT_FOUND` error return kore.
- Authorization check: Event-ti jodi onno kono user-er hoy ebong requester `SUPER_ADMIN` na hoy → `FORBIDDEN` error throw kore.
- `preferenceCard` field-ti populate kora hoy.
- Shob sheshe event-er details return kora hoy.

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
      "date": "2026-04-15T00:00:00.000Z",
      "time": "09:30",
      "durationHours": 3,
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

### 5.4 Update Event

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
- Request body theke asha notun data diye event object update kora hoy.
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

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Event updated successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "title": "Updated Surgery Title",
    "date": "2026-04-15T00:00:00.000Z",
    "time": "10:00",
    "durationHours": 4,
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

### 5.5 Delete Event

```
DELETE /events/:eventId
Auth: Bearer {{accessToken}}
```

> Kono event permanent-ly remove korার jonno.

**Implementation:**
- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `deleteEvent`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `deleteEventFromDB`

**Business Logic (`deleteEventFromDB`):**
- Database theke `eventId` diye event search kora hoy.
- Jodi event na pauya jay → `NOT_FOUND` error return kore.
- Authorization check: Event-ti jodi onno kono user-er hoy ebong requester `SUPER_ADMIN` na hoy → `FORBIDDEN` error throw kore.
- Shob sheshe event-ti delete kora hoy ebong deleted object-ti return kora hoy.

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
| 5.1 | `/events` | `GET` | Bearer | ✅ Done | List own events with date range |
| 5.2 | `/events` | `POST` | Bearer | ✅ Done | Create event with auto reminders |
| 5.3 | `/events/:eventId` | `GET` | Bearer | ✅ Done | Get specific event details |
| 5.4 | `/events/:eventId` | `PATCH` | Bearer | ✅ Done | Update event info |
| 5.5 | `/events/:eventId` | `DELETE` | Bearer | ✅ Done | Remove event |
