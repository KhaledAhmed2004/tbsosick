# Screen 6: Calendar

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Home](./03-home.md) (Quick access)

## UX Flow

### Calendar Initial Load
1. User bottom navigation bar theke "Calendar" icon-e tap kore.
2. Page load-e current month-er events fetch hoy → `GET /events` (→ 6.1).
3. Screen render hoy:
   - Top-e ekta Interactive Calendar thake.
   - Kono date-e event thakle dot ba indicator dekhay.
   - Calendar-er niche "Upcoming Events" list thake.
   - "Create Event" button (+) thake.

### Create Event Flow
1. User "Create Event" button-e tap kore.
2. Ekta modal/bottom-sheet open hoy jekhane title, date, time, ebong description input deya jay.
3. Submit → `POST /events` (→ 6.2).
4. Success hole list update hoy ebong success message dekhay.

### Event Management (View & Update)
1. User "Upcoming Events" list theke kono event-e tap kore.
2. Event details fetch hoy → `GET /events/:id` (→ 6.3).
3. Details modal-e user data dekhte pare ebong "Edit" icon-e tap kore update korte pare → `PATCH /events/:id` (→ 6.4).
4. Success hole calendar refresh hoy.

---

## Edge Cases

- **No Events**: Selected date-e kono event na thakle "No events for this day" placeholder dekhabe.
- **Overlapping Events**: Multiple events thakle list-e serial-e dekhabe.
- **Past Events**: Past dates-er events view-only thakte pare (frontend logic).

---

<!-- ══════════════════════════════════════ -->
<!--              EVENT LIST                  -->
<!-- ══════════════════════════════════════ -->

### 6.1 List My Events

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
        "description": "Prepare all preference cards",
        "date": "2026-04-10T00:00:00.000Z",
        "time": "08:00",
        "createdAt": "2026-04-07T10:30:00.000Z"
      }
    ]
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--             CREATE EVENT                 -->
<!-- ══════════════════════════════════════ -->

### 6.2 Create Event

```
POST /events
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Naya event toiri korar jonno. Auto reminder set hoy (24h ebong 1h age).

**Request Body:**
```json
{
  "title": "Surgery with Dr. Smith",
  "description": "Hip Replacement case",
  "date": "2026-04-15",
  "time": "09:30"
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
    "description": "Hip Replacement case",
    "date": "2026-04-15T00:00:00.000Z",
    "time": "09:30"
  }
}
```

---

<!-- ══════════════════════════════════════ -->
<!--             EVENT DETAILS                -->
<!-- ══════════════════════════════════════ -->

### 6.3 Get Event Details

```
GET /events/:id
Auth: Bearer {{accessToken}}
```

> Specific event-er full details fetch korar jonno.

**Implementation:**
- **Route**: [event.route.ts](file:///src/app/modules/event/event.route.ts)
- **Controller**: [event.controller.ts](file:///src/app/modules/event/event.controller.ts) — `getEventById`
- **Service**: [event.service.ts](file:///src/app/modules/event/event.service.ts) — `getEventByIdFromDB`

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
      "description": "Hip Replacement case",
      "date": "2026-04-15T00:00:00.000Z",
      "time": "09:30"
    }
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--             UPDATE EVENT                 -->
<!-- ══════════════════════════════════════ -->

### 6.4 Update Event

```
PATCH /events/:id
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Event-er title, date, ba time change korar jonno. Reminders automatically reschedule hoy.

**Request Body:**
```json
{
  "title": "Updated Surgery Title",
  "time": "10:00"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Event updated successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "title": "Updated Surgery Title",
    "time": "10:00"
  }
}
```

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 6.1 | `/events` | `GET` | Bearer | ✅ Done | List own events with date range |
| 6.2 | `/events` | `POST` | Bearer | ✅ Done | Create event with auto reminders |
| 6.3 | `/events/:id` | `GET` | Bearer | ✅ Done | Get specific event details |
| 6.4 | `/events/:id` | `PATCH` | Bearer | ✅ Done | Update event info |
| 6.5 | `/events/:id` | `DELETE` | Bearer | ✅ Done | Remove event |
