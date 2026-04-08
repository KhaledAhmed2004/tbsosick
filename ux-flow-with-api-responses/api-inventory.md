# API Inventory & Implementation Tracker

Ei file ta `ux-flow-with-api-responses/` folder er sob API er ekta central track rakhe. Proti ti screen e kon API use hocche ebong tader backend implementation (Route, Controller, Service) kothay ache ta eikhane pawa jabe.

---

## Dashboard APIs (Admin-Facing)

| Module | Screen | ID | Endpoint | Method | Roles/Access | Implementation Doc | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.1 | `/auth/login` | `POST` | Public | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.2 | `/auth/forgot-password` | `POST` | Public | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.3 | `/auth/verify-otp` | `POST` | Public | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.4 | `/auth/reset-password` | `POST` | Reset Token | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.5 | `/auth/refresh-token` | `POST` | Refresh Token | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.6 | `/auth/logout` | `POST` | All Auth | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.7 | `/auth/change-password` | `POST` | All Auth | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.8 | `/auth/resend-verify-email` | `POST` | Public | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| **Admin** | [Overview](./dashboard-screens/02-overview.md) | 2.1 | `/admin/growth-metrics` | `GET` | SUPER_ADMIN | [02-overview.md](./dashboard-screens/02-overview.md) | ✅ |
| **Admin** | [Overview](./dashboard-screens/02-overview.md) | 2.2 | `/admin/preference-cards/monthly` | `GET` | SUPER_ADMIN | [02-overview.md](./dashboard-screens/02-overview.md) | ✅ |
| **Admin** | [Overview](./dashboard-screens/02-overview.md) | 2.3 | `/admin/subscriptions/active/monthly` | `GET` | SUPER_ADMIN | [02-overview.md](./dashboard-screens/02-overview.md) | ✅ |
| **Admin** | [Doctor](./dashboard-screens/03-doctor.md) | 3.1 | `/doctors` | `GET` | SUPER_ADMIN | [03-doctor.md](./dashboard-screens/03-doctor.md) | ✅ |
| **Admin** | [Doctor](./dashboard-screens/03-doctor.md) | 3.2 | `/doctors` | `POST` | SUPER_ADMIN | [03-doctor.md](./dashboard-screens/03-doctor.md) | ✅ |
| **Admin** | [Doctor](./dashboard-screens/03-doctor.md) | 3.3 | `/doctors/:id` | `PATCH` | SUPER_ADMIN | [03-doctor.md](./dashboard-screens/03-doctor.md) | ✅ |
| **Admin** | [Doctor](./dashboard-screens/03-doctor.md) | 3.4 | `/doctors/:id/block` | `PATCH` | SUPER_ADMIN | [03-doctor.md](./dashboard-screens/03-doctor.md) | ✅ |
| **Admin** | [Doctor](./dashboard-screens/03-doctor.md) | 3.5 | `/doctors/:id/unblock` | `PATCH` | SUPER_ADMIN | [03-doctor.md](./dashboard-screens/03-doctor.md) | ✅ |
| **Admin** | [Doctor](./dashboard-screens/03-doctor.md) | 3.6 | `/doctors/:id` | `DELETE` | SUPER_ADMIN | [03-doctor.md](./dashboard-screens/03-doctor.md) | ✅ |

---

## App APIs (Student-Facing)

| Module | Screen | ID | Endpoint | Method | Roles/Access | Implementation Doc | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **User** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.1 | `/users` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.2 | `/auth/login` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.3 | `/auth/verify-otp` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.4 | `/auth/forgot-password` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.5 | `/auth/reset-password` | `POST` | Reset Token | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.6 | `/auth/refresh-token` | `POST` | Refresh Token | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.7 | `/auth/logout` | `POST` | User | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.8 | `/auth/resend-verify-email` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.9 | `/auth/google` | `GET` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.10 | `/auth/google/callback` | `GET` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| **PreferenceCard** | [Home (Mobile)](./app-screens/02-home.md) | 2.1 | `/preference-cards` | `GET` | User | [02-home.md](./app-screens/02-home.md) | ✅ |
| **PreferenceCard** | [Home (Mobile)](./app-screens/02-home.md) | 2.2 | `/preference-cards/stats` | `GET` | User | [02-home.md](./app-screens/02-home.md) | ✅ |
| **User** | [Home (Mobile)](./app-screens/02-home.md) | 2.3 | `/users/me/favorites` | `GET` | User | [02-home.md](./app-screens/02-home.md) | ✅ |
| **PreferenceCard** | [Home (Mobile)](./app-screens/02-home.md) | 2.4 | `/preference-cards/:cardId/favorite` | `POST` | User | [02-home.md](./app-screens/02-home.md) | ✅ |
| **PreferenceCard** | [Home (Mobile)](./app-screens/02-home.md) | 2.5 | `/preference-cards/:cardId/favorite` | `DELETE` | User | [02-home.md](./app-screens/02-home.md) | ✅ |
| **PreferenceCard** | [Home (Mobile)](./app-screens/02-home.md) | 2.6 | `/preference-cards/:cardId/download` | `POST` | User | [02-home.md](./app-screens/02-home.md) | ✅ |
| **PreferenceCard** | [Details (Mobile)](./app-screens/03-preference-card-details.md) | 3.1 | `/preference-cards/:cardId` | `GET` | User | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| **PreferenceCard** | [Library (Mobile)](./app-screens/04-library.md) | 4.1 | `/preference-cards/specialties` | `GET` | User | [04-library.md](./app-screens/04-library.md) | ✅ |
| **PreferenceCard** | [Library (Mobile)](./app-screens/04-library.md) | 4.2 | `/preference-cards/private` | `GET` | User | [04-library.md](./app-screens/04-library.md) | ✅ |
| **Event** | [Calendar (Mobile)](./app-screens/05-calendar.md) | 5.1 | `/events` | `GET` | User | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| **Event** | [Calendar (Mobile)](./app-screens/05-calendar.md) | 5.2 | `/events` | `POST` | User | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| **Event** | [Calendar (Mobile)](./app-screens/05-calendar.md) | 5.3 | `/events/:eventId` | `GET` | User | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| **Event** | [Calendar (Mobile)](./app-screens/05-calendar.md) | 5.4 | `/events/:eventId` | `PATCH` | User | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| **Event** | [Calendar (Mobile)](./app-screens/05-calendar.md) | 5.5 | `/events/:eventId` | `DELETE` | User | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| **User** | [Profile (Mobile)](./app-screens/06-profile.md) | 6.1 | `/users/profile` | `GET` | User | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| **User** | [Profile (Mobile)](./app-screens/06-profile.md) | 6.2 | `/users/profile` | `PATCH` | User | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| **Subscription** | [Profile (Mobile)](./app-screens/06-profile.md) | 6.3 | `/subscriptions/me` | `GET` | User | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| **Legal** | [Profile (Mobile)](./app-screens/06-profile.md) | 6.4 | `/legal` | `GET` | Public | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| **Legal** | [Profile (Mobile)](./app-screens/06-profile.md) | 6.5 | `/legal/:slug` | `GET` | Public | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| **Notification** | [Notifications (Mobile)](./app-screens/07-notifications.md) | 7.1 | `/notifications` | `GET` | User | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |
| **Notification** | [Notifications (Mobile)](./app-screens/07-notifications.md) | 7.2 | `/notifications/:notificationId/read` | `PATCH` | User | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |
| **Notification** | [Notifications (Mobile)](./app-screens/07-notifications.md) | 7.3 | `/notifications/read-all` | `PATCH` | User | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |
| **Notification** | [Notifications (Mobile)](./app-screens/07-notifications.md) | 7.4 | `/notifications/:notificationId` | `DELETE` | User | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |

---

## Missing Implementation / To-Do

| Module | Endpoint | Method | Reason | Priority |
| :--- | :--- | :---: | :--- | :---: |
| **Subscription** | `/subscriptions/iap/verify` | `POST` | Doc missing screen context but route exists | Medium |
| **Subscription** | `/subscriptions/choose/free` | `POST` | Doc missing screen context but route exists | Medium |
| **Payment** | `/payments/history` | `GET` | No screen documentation yet | Low |
| **Payment** | `/payments/stripe/account` | `POST` | No screen documentation yet | Low |
| **User** | `/users/:userId/status` | `PATCH` | Admin screen needed | Medium |
| **User** | `/users/:userId/block` | `PATCH` | Admin screen needed | Medium |
| **PreferenceCard** | `/preference-cards/:cardId` | `PATCH` | Edit Card flow doc missing | High |
| **PreferenceCard** | `/preference-cards/:cardId` | `DELETE` | Delete Card flow doc missing | High |
