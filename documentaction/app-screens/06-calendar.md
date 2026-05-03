# Screen 6: Calendar (Mobile)

> **Section**: App Screens — UX Flow + API Reference
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) · [Preference Card Details](./03-preference-card-details.md) — opened from an event link inside details.
> **Base URL**: `{{baseUrl}}/api/v1/events`
> **API conventions**: see [_shared/api-conventions.md](../_shared/api-conventions.md) — response envelope, error shape, status codes, headers, dates.

---

## Calendar-Specific Constants

| Item | Value |
|---|---|
| Ownership scope | Logged-in user only — no cross-user visibility |
| Date range fetch | Full month — `from` = 1st 00:00 UTC, `to` = last day 23:59:59 UTC |
| Date format | ISO 8601 (`2026-05-03`, `2026-05-03T14:00:00.000Z`) |
| Event types | `SURGERY`, `MEETING`, `CONSULTATION`, `OTHER` |
| Auth | All endpoints require `Authorization: Bearer {{accessToken}}` |

---

## 1. Calendar Initial Load

**Trigger** — user taps the **Calendar** tab → [`GET /events?from&to`](#get-api-v1-events) for the visible month.

**Use case**
- Owner-scoped read — server filters by `ownerId === currentUser._id`. Cross-user visibility is not allowed on this screen.
- `from`/`to` are **inclusive** ISO dates; server is responsible for the timezone window choice (UTC by default).
- Today's events are filtered client-side from the loaded month dataset — single network call per month.

**Status** — `Implemented`

**Implementation**
- Route: [`event.route.ts`](src/app/modules/event/event.route.ts)
- Controller: [`EventController.getMyEvents`](src/app/modules/event/event.controller.ts)
- Service: [`EventService.listEventsForUserFromDB`](src/app/modules/event/event.service.ts)
- Validation: — (query params parsed in service)
- Reads: `Event`
- Writes: —

### API Reference

#### `GET /api/v1/events`

Lists events owned by the logged-in user within an inclusive date range. Used both for month load and (with `from` == `to`) single-day fetch.

**Query parameters**

| Param | Type | Required | Notes |
|---|---|---|---|
| `from` | string (ISO date) | yes | Range start, inclusive (`YYYY-MM-DD`) |
| `to` | string (ISO date) | yes | Range end, inclusive |
| `type` | string | no | Filter by event type |
| `linkedCardId` | string | no | Filter to events linked to a specific preference card |

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "888a...",
      "title": "Lap Chole - Patient #4421",
      "type": "SURGERY",
      "startsAt": "2026-05-03T09:00:00.000Z",
      "durationMin": 90,
      "location": "OR 3",
      "linkedCardId": "665f...",
      "linkedCardTitle": "Laparoscopic Cholecystectomy",
      "personnel": ["Dr. Khan", "Nurse Lia"],
      "notes": "Confirm fasting 6h pre-op",
      "ownerId": "664a...",
      "createdAt": "2026-04-30T08:00:00.000Z"
    }
  ],
  "meta": { "from": "2026-05-01", "to": "2026-05-31", "total": 12 }
}
```

> Range responses are **not paginated** — a month is bounded enough to return in full. Use `linkedCardId` or `type` to narrow if a user has > 500 events in a month.

---

## 2. Date Selection

**Trigger** — user taps a date on the calendar grid.

**Use case**
- If the date is within the loaded month → no network call (client filters in-memory).
- If the date is outside the loaded month → re-fetch the new month → [`GET /events?from&to`](#get-api-v1-events).
- Tap on an event in the list → opens details. Server detail call is **only** issued if the in-memory list lacks fields the modal needs → [`GET /events/:eventId`](#get-api-v1-events-eventid).

---

## 3. Create Event

**Trigger** — user taps **Create Event (+)** and submits the form → [`POST /events`](#post-api-v1-events).

**Use case**
- `linkedCardId` (when present) must be a card owned by the caller — validated server-side. Linking to another user's card → `403`.
- `startsAt` is stored in UTC; client sends ISO 8601 with timezone.
- On success the server may emit a notification (event reminder) via `NotificationBuilder` — this is what surfaces in [08-notifications.md](./08-notifications.md).

**Business rules**
- Conflict with another event in the same time slot — `// TBD`: allow (clinicians may want overlapping reminders) or warn? Recommendation: **allow but flag in response** (`hasOverlap: true`) so the client can show a non-blocking warning.
- Past dates — `// TBD`: allow back-dating events for record-keeping, or block? Recommendation: **allow**, since users may log surgeries after the fact.

**Status** — `Implemented`

**Implementation**
- Route: [`event.route.ts`](src/app/modules/event/event.route.ts)
- Controller: [`EventController.createEvent`](src/app/modules/event/event.controller.ts)
- Service: [`EventService.createEventInDB`](src/app/modules/event/event.service.ts)
- Validation: [`EventValidation.createEventZodSchema`](src/app/modules/event/event.validation.ts)
- Reads: `PreferenceCard` (validate `linkedCardId` ownership)
- Writes: `Event`, `Notification` (via `NotificationBuilder`)

### API Reference

#### `POST /api/v1/events`

Creates a calendar event owned by the logged-in user.

**Request body**

```json
{
  "title": "Lap Chole - Patient #4421",
  "type": "SURGERY",
  "startsAt": "2026-05-03T09:00:00.000Z",
  "durationMin": 90,
  "location": "OR 3",
  "linkedCardId": "665f...",
  "personnel": ["Dr. Khan", "Nurse Lia"],
  "notes": "Confirm fasting 6h pre-op"
}
```

**Validation**
- `title`: 2–120 chars
- `type`: enum `SURGERY` | `MEETING` | `CONSULTATION` | `OTHER`
- `startsAt`: ISO 8601, must be a valid date
- `durationMin`: 5–1440
- `linkedCardId`: optional, must be owned by the user

**Success — `201 Created`** — full event document (same shape as list item).

**Errors**

| Code | `message` |
|---|---|
| 400 | `Invalid input` (with `errorSources[]`) |
| 403 | `Linked card does not belong to you` |

---

## 4. Event Details, Update & Delete

**Trigger**
- Tap event → [`GET /events/:eventId`](#get-api-v1-events-eventid) (skipped if data already in memory).
- Edit → [`PATCH /events/:eventId`](#patch-api-v1-events-eventid).
- Delete → confirmation, then [`DELETE /events/:eventId`](#delete-api-v1-events-eventid).

**Use case**
- All three are owner-only — server enforces `ownerId === currentUser._id`. `403` on mismatch (same status code regardless of operation).
- `PATCH` accepts partial updates; only provided keys are written.
- `DELETE` is hard-delete. No soft-delete or trash.

**Behavior note** — an edit that moves the event out of the currently loaded month should trigger a refetch on the new month rather than appending to the in-memory list.

**Status** — `Implemented` (all three)

**Implementation**
- Route: [`event.route.ts`](src/app/modules/event/event.route.ts)
- Controller: [`EventController.getEventById`](src/app/modules/event/event.controller.ts) · [`EventController.updateEvent`](src/app/modules/event/event.controller.ts) · [`EventController.deleteEvent`](src/app/modules/event/event.controller.ts)
- Service: [`EventService.getEventByIdFromDB`](src/app/modules/event/event.service.ts) · [`EventService.updateEventInDB`](src/app/modules/event/event.service.ts) · [`EventService.deleteEventFromDB`](src/app/modules/event/event.service.ts)
- Validation: [`EventValidation.updateEventZodSchema`](src/app/modules/event/event.validation.ts) (PATCH only)
- Reads: `Event`, `PreferenceCard` (resolve `linkedCardTitle` on get)
- Writes: `Event`

### API Reference

#### `GET /api/v1/events/:eventId`

Returns a single event by ID. Owner-only.

**Path params** — `eventId` (Mongo ObjectId)

**Success — `200 OK`** — same shape as list item.

**Errors**

| Code | `message` |
|---|---|
| 403 | `Not allowed` |
| 404 | `Event not found` |

#### `PATCH /api/v1/events/:eventId`

Updates an event. All fields optional; partial updates supported.

**Path params** — `eventId` (Mongo ObjectId)

**Request body** — same shape as `POST /events`, all fields optional.

**Success — `200 OK`** — full updated event.

**Errors**

| Code | `message` |
|---|---|
| 403 | `Not allowed. You can edit only your own events.` |
| 404 | `Event not found` |

#### `DELETE /api/v1/events/:eventId`

Deletes the event.

**Path params** — `eventId` (Mongo ObjectId)

**Success — `200 OK`**

```json
{ "success": true, "statusCode": 200, "message": "Event deleted", "data": null }
```

**Errors** — `403`, `404` (same as above).

---

## 5. Ownership Scope

**Use case**
- All events are filtered by `ownerId === currentUser._id` on every endpoint — no cross-user visibility on this screen.
- Server-side enforcement happens in `EventService.*` — never trust client-supplied filters that could widen scope.
- Calendar is a **single-user schedule view**, not a shared / team-wide calendar. Team-level scheduling would require a new module.

---

## Endpoint Index

| # | Method | Path | Status | Auth | Purpose |
|---|---|---|---|---|---|
| 1 | GET | `/api/v1/events?from&to` | `Implemented` | Bearer | List events in date range |
| 2 | POST | `/api/v1/events` | `Implemented` | Bearer | Create event |
| 3 | GET | `/api/v1/events/:eventId` | `Implemented` | Bearer (owner) | Fetch single event |
| 4 | PATCH | `/api/v1/events/:eventId` | `Implemented` | Bearer (owner) | Update event |
| 5 | DELETE | `/api/v1/events/:eventId` | `Implemented` | Bearer (owner) | Delete event |
