# UX Flow with API Responses

Screen-by-screen API flow — **Student App** ebong **Admin Dashboard** dutor jonno documentation. 
Each screen e APIs called, method/URL, auth requirement, ebong expected response shape ache.

> Base URL: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **[🗺️ User Journey & UX Flow Overview](./user-journey.md)** — Complete cross-screen user journeys with ASCII flow diagrams.
> **[API Inventory & Implementation Tracker](./api-inventory.md)** — All APIs at a glance.
> **[Database Design & Relationships](./database-design.md)** — Entity map ebong schema structure.

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
| 3 | [Doctor](./dashboard-screens/03-doctor.md) | Doctor management — search, filter, table actions |
