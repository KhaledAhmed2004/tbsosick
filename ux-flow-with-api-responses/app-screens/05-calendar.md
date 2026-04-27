# Screen 5: Calendar

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Home](./02-home.md) (Quick access)

## UX Flow

### Calendar Initial Load
1. User bottom navigation bar theke "Calendar" icon-e tap kore.
2. Page load-e current month-er shob events fetch hoy → [GET /events?from=2026-04-01&to=2026-04-30](../modules/event.md#41-list-my-events).
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
3. Submit → [POST /events](../modules/event.md#42-create-event).
4. Success hole list update hoy ebong success message dekhay.

### Event Management (View, Update & Delete)
1. User "Upcoming Events" list theke kono event-e tap kore.
2. Event details fetch hoy → [GET /events/:eventId](../modules/event.md#43-get-event-details).
3. Details modal-e user data dekhte pare ebong "Edit" icon-e tap kore update korte pare → [PATCH /events/:eventId](../modules/event.md#44-update-event).
4. User chaile event delete-o korte pare "Delete" button-e tap kore → [DELETE /events/:eventId](../modules/event.md#45-delete-event).
5. Success hole calendar refresh hoy.

---

## Edge Cases

- **No Events**: Selected date-e kono event na thakle "No events for this day" placeholder dekhabe.
- **Overlapping Events**: Multiple events thakle list-e serial-e dekhabe.
- **Past Events**: Past dates-er events view-only thakte pare (frontend logic).

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/events` | [Module 4.1](../modules/event.md#41-list-my-events) |
| 2 | POST | `/events` | [Module 4.2](../modules/event.md#42-create-event) |
| 3 | GET | `/events/:eventId` | [Module 4.3](../modules/event.md#43-get-event-details) |
| 4 | PATCH | `/events/:eventId` | [Module 4.4](../modules/event.md#44-update-event) |
| 5 | DELETE | `/events/:eventId` | [Module 4.5](../modules/event.md#45-delete-event) |
