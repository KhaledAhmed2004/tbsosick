# UX Flow with API Responses

Screen-by-screen API flow — **Student App** ebong **Admin Dashboard** dutor jonno documentation. 
Each screen e APIs called, method/URL, auth requirement, ebong expected response shape ache.

> Base URL: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **[🗺️ User Journey & UX Flow Overview](./user-journey.md)** — Complete cross-screen user journeys with ASCII flow diagrams.
> **[API Inventory & Implementation Tracker](./api-inventory.md)** — All APIs at a glance.
> **[Database Design & Relationships](./database-design.md)** — Entity map ebong schema structure.

---

## How this folder is organized

This folder has three layers, each with a single responsibility:

| Folder / file | Purpose | Read this when… |
|---|---|---|
| [`app-screens/`](./app-screens/), [`dashboard-screens/`](./dashboard-screens/) | **UX flow only** — user journeys, screen behaviour, edge cases. | Building or designing a screen. |
| [`modules/`](./modules/) | **Canonical API specs** — request/response shapes, business logic, implementation pointers. | Implementing or consuming an endpoint. |
| [`api-inventory.md`](./api-inventory.md) | **Tracker view** — every endpoint with wiring status (which screen, implementation done). | Auditing coverage or finding orphaned endpoints. |

**Source of truth rule**: contract changes go in `modules/` only. Journey changes go in `app-screens/` or `dashboard-screens/` only. Cross-link between layers via anchors so navigation stays one click.

---

## Standard Response Envelope

Shob API ei format follow kore:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "pagination": { "page": 1, "limit": 10, "total": 50, "totalPage": 5 },
  "data": "..."
}
```

`pagination` শুধু list endpoint e thake. `data` er shape endpoint bhede alada.

---

## Part 1: App APIs (Student-Facing)

| # | Screen | Description |
|---|--------|-------------|
| 1 | [Auth](./app-screens/01-auth.md) | Register, login, OTP verify, password reset, refresh token |
| 2 | [Home](./app-screens/02-home.md) | Search public cards, stats, favorite cards list |
| 3 | [Preference Card Details](./app-screens/03-preference-card-details.md) | Card details, share, download actions |
| 4 | [Library](./app-screens/04-library.md) | Public vs Private cards list with filtering and search |
| 5 | [Calendar](./app-screens/05-calendar.md) | Calendar view, create event, and upcoming events |
| 6 | [Profile](./app-screens/06-profile.md) | User data, edit profile, subscription, legal pages |
| 7 | [Notifications](./app-screens/07-notifications.md) | User's notifications list, mark as read, delete |

---

## Part 2: Dashboard APIs (Admin-Facing)

| # | Screen | Description |
|---|--------|-------------|
| 1 | [Auth](./dashboard-screens/01-auth.md) | Admin login, token management, forget password flow |
| 2 | [Overview](./dashboard-screens/02-overview.md) | Dashboard stats, counts, recent activity |
| 3 | [User Management](./dashboard-screens/03-user-management.md) | Doctor / user management — search, filter, CRUD, block/activate |
| 4 | [Preference Card Management](./dashboard-screens/04-preference-card-management.md) | Card moderation, verification (approve/reject), delete |
| 5 | [Legal Management](./dashboard-screens/05-legal-management.md) | Legal pages CMS (Terms, Privacy) |
| 6 | [Supplies Management](./dashboard-screens/06-supplies-management.md) | Supplies master catalog — single + bulk create, edit, delete |
| 7 | [Sutures Management](./dashboard-screens/07-sutures-management.md) | Sutures master catalog — single + bulk create, edit, delete |
