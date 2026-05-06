# Event Module APIs

> **Section**: Backend API specifications for the event module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - App - Calendar Screen — Event list, create, view, update, delete
> - App - Notifications Screen — Events notifications and reminders triggered from event creation

---

## Unified API Registry

| # | Method | Endpoint | Auth | Purpose & Status | Documentation |
|---|---|---|---|---|---|
| 01 | GET | `/events` | Bearer | **Done**: Fetches user-specific events with optional date range filtering for calendar views. | [01-list-events.md](./01-list-events.md) |
| 06 | GET | `/events/calendar-highlights` | Bearer | **Done**: Lightweight list of unique dates (YYYY-MM-DD) that have events. Optimized for calendar dots. | [06-get-calendar-highlights.md](./06-get-calendar-highlights.md) |
| 02 | POST | `/events` | Bearer | **Done**: Creates a new event with normalized time ranges and auto-schedules 24h/1h reminders. | [02-create-event.md](./02-create-event.md) |
| 03 | GET | `/events/:eventId` | Bearer | **Done**: Retrieves full event details, including linked preference card metadata and personnel. | [03-get-event.md](./03-get-event.md) |
| 04 | PATCH | `/events/:eventId` | Bearer | **Done**: Partially updates event data and re-resolves time ranges/reminders if needed. | [04-update-event.md](./04-update-event.md) |
| 05 | DELETE | `/events/:eventId` | Bearer | **Done**: Permanently removes an event and its associated data from the system. | [05-delete-event.md](./05-delete-event.md) |
