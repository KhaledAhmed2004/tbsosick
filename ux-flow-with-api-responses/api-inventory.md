# API Inventory & Implementation Tracker

Ei file ta `ux-flow-with-api-responses/` folder er sob API er ekta central track rakhe. Proti ti screen e kon API use hocche ebong tader backend implementation (Route, Controller, Service) kothay ache ta eikhane pawa jabe.

> **Note**: Ei file ta manually update korte hobe jkhon e kono naya screen doc toiri ba update kora hobe.

---

## Dashboard APIs (Admin-Facing)

| Module | Screen | ID | Endpoint | Method | Roles/Access | Implementation Doc |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.1 | `/auth/login` | `POST` | Public | [01-auth.md:L98-101](./dashboard-screens/01-auth.md#L98-101) |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.2 | `/auth/forgot-password` | `POST` | Public | [01-auth.md:L135-138](./dashboard-screens/01-auth.md#L135-138) |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.3 | `/auth/verify-otp` | `POST` | Public | [01-auth.md:L163-166](./dashboard-screens/01-auth.md#L163-166) |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.4 | `/auth/reset-password` | `POST` | Reset Token | [01-auth.md:L212-215](./dashboard-screens/01-auth.md#L212-215) |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.5 | `/auth/refresh-token` | `POST` | Refresh Token | [01-auth.md:L241-244](./dashboard-screens/01-auth.md#L241-244) |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.6 | `/auth/logout` | `POST` | All Auth | [01-auth.md:L271-274](./dashboard-screens/01-auth.md#L271-274) |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.7 | `/auth/change-password` | `POST` | All Auth | [01-auth.md:L301-304](./dashboard-screens/01-auth.md#L301-304) |
| **Auth** | [Auth](./dashboard-screens/01-auth.md) | 1.8 | `/auth/resend-verify-email` | `POST` | Public | [01-auth.md:L331-334](./dashboard-screens/01-auth.md#L331-334) |
| **Admin** | [Overview](./dashboard-screens/02-overview.md) | 2.1 | `/admin/growth-metrics` | `GET` | SUPER_ADMIN | [02-overview.md:L76-79](./dashboard-screens/02-overview.md#L76-79) |
| **Admin** | [Overview](./dashboard-screens/02-overview.md) | 2.2 | `/admin/preference-cards/monthly` | `GET` | SUPER_ADMIN | [02-overview.md:L138-141](./dashboard-screens/02-overview.md#L138-141) |
| **Admin** | [Overview](./dashboard-screens/02-overview.md) | 2.3 | `/admin/subscriptions/active/monthly` | `GET` | SUPER_ADMIN | [02-overview.md:L288-291](./dashboard-screens/02-overview.md#L288-291) |
| **Admin** | [Doctor](./dashboard-screens/03-doctor.md) | 2.1 | `/admin/doctors/stats` | `GET` | SUPER_ADMIN | [03-doctor.md:L51-54](./dashboard-screens/03-doctor.md#L51-54) |
| **Doctor** | [Doctor](./dashboard-screens/03-doctor.md) | 3.1 | `/doctors` | `GET` | SUPER_ADMIN | [03-doctor.md:L111-114](./dashboard-screens/03-doctor.md#L111-114) |
| **Doctor** | [Doctor](./dashboard-screens/03-doctor.md) | 3.2 | `/doctors` | `POST` | SUPER_ADMIN | [03-doctor.md:L163-166](./dashboard-screens/03-doctor.md#L163-166) |
| **Doctor** | [Doctor](./dashboard-screens/03-doctor.md) | 3.3 | `/doctors/:id` | `PATCH` | SUPER_ADMIN | [03-doctor.md:L210-213](./dashboard-screens/03-doctor.md#L210-213) |
| **Doctor** | [Doctor](./dashboard-screens/03-doctor.md) | 3.4 | `/doctors/:id/block` | `PATCH` | SUPER_ADMIN | [03-doctor.md:L254-257](./dashboard-screens/03-doctor.md#L254-257) |
| **Doctor** | [Doctor](./dashboard-screens/03-doctor.md) | 3.5 | `/doctors/:id/unblock` | `PATCH` | SUPER_ADMIN | [03-doctor.md:L286-289](./dashboard-screens/03-doctor.md#L286-289) |
| **Doctor** | [Doctor](./dashboard-screens/03-doctor.md) | 3.6 | `/doctors/:id` | `DELETE` | SUPER_ADMIN | [03-doctor.md:L318-321](./dashboard-screens/03-doctor.md#L318-321) |

---

## App APIs (Student-Facing)

| Module | Screen | ID | Endpoint | Method | Roles/Access | Implementation Doc |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **User** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.1 | `/users` | `POST` | Public | [01-auth.md:L68-71](./app-screens/01-auth.md#L68-71) |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.2 | `/auth/login` | `POST` | Public | [01-auth.md:L127-130](./app-screens/01-auth.md#L127-130) |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.3 | `/auth/verify-otp` | `POST` | Public | [01-auth.md:L176-179](./app-screens/01-auth.md#L176-179) |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.4 | `/auth/forgot-password` | `POST` | Public | [01-auth.md:L233-236](./app-screens/01-auth.md#L233-236) |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.5 | `/auth/reset-password` | `POST` | Reset Token | [01-auth.md:L266-269](./app-screens/01-auth.md#L266-269) |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.6 | `/auth/refresh-token` | `POST` | Refresh Token | [01-auth.md:L299-302](./app-screens/01-auth.md#L299-302) |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.7 | `/auth/logout` | `POST` | User | [01-auth.md:L329-332](./app-screens/01-auth.md#L329-332) |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.8 | `/auth/resend-verify-email` | `POST` | Public | [01-auth.md:L355-358](./app-screens/01-auth.md#L355-358) |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.9 | `/auth/google` | `GET` | Public | [01-auth.md:L389-391](./app-screens/01-auth.md#L389-391) |
| **Auth** | [Auth (Mobile)](./app-screens/01-auth.md) | 1.10 | `/auth/google/callback` | `GET` | Public | [01-auth.md:L402-404](./app-screens/01-auth.md#L402-404) |
| **User** | [Profile (Mobile)](./app-screens/02-profile.md) | 2.1 | `/users/profile` | `GET` | User | [02-profile.md:L61-64](./app-screens/02-profile.md#L61-64) |
| **User** | [Profile (Mobile)](./app-screens/02-profile.md) | 2.2 | `/users/profile` | `PATCH` | User | [02-profile.md:L89-92](./app-screens/02-profile.md#L89-92) |
| **Subscription** | [Profile (Mobile)](./app-screens/02-profile.md) | 2.3 | `/subscriptions/me` | `GET` | User | [02-profile.md:L123-126](./app-screens/02-profile.md#L123-126) |
| **Legal** | [Profile (Mobile)](./app-screens/02-profile.md) | 2.4 | `/legal` | `GET` | Public | [02-profile.md:L178-181](./app-screens/02-profile.md#L178-181) |
| **Legal** | [Profile (Mobile)](./app-screens/02-profile.md) | 2.5 | `/legal/:slug` | `GET` | Public | [02-profile.md:L214-217](./app-screens/02-profile.md#L214-217) |
| **PreferenceCard** | [Home (Mobile)](./app-screens/03-home.md) | 3.1 | `/preference-cards/public` | `GET` | User | [03-home.md:L61-64](./app-screens/03-home.md#L61-64) |
| **PreferenceCard** | [Home (Mobile)](./app-screens/03-home.md) | 3.2 | `/preference-cards/count` | `GET` | User | [03-home.md:L91-94](./app-screens/03-home.md#L91-94) |
| **PreferenceCard** | [Home (Mobile)](./app-screens/03-home.md) | 3.3 | `/preference-cards/favorites` | `GET` | User | [03-home.md:L123-126](./app-screens/03-home.md#L123-126) |
| **PreferenceCard** | [Details (Mobile)](./app-screens/04-preference-card-details.md) | 4.1 | `/preference-cards/:id` | `GET` | User | [04-preference-card-details.md:L43-46](./app-screens/04-preference-card-details.md#L43-46) |
| **PreferenceCard** | [Details (Mobile)](./app-screens/04-preference-card-details.md) | 4.2 | `/preference-cards/:id/download` | `POST` | User | [04-preference-card-details.md:L101-104](./app-screens/04-preference-card-details.md#L101-104) |
| **Notification** | [Notifications (Mobile)](./app-screens/05-notifications.md) | 5.1 | `/notifications` | `GET` | User | [05-notifications.md:L44-47](./app-screens/05-notifications.md#L44-47) |
| **Notification** | [Notifications (Mobile)](./app-screens/05-notifications.md) | 5.2 | `/notifications/:id/read` | `PATCH` | User | [05-notifications.md:L78-81](./app-screens/05-notifications.md#L78-81) |
| **Notification** | [Notifications (Mobile)](./app-screens/05-notifications.md) | 5.3 | `/notifications/read-all` | `PATCH` | User | [05-notifications.md:L107-110](./app-screens/05-notifications.md#L107-110) |
| **Notification** | [Notifications (Mobile)](./app-screens/05-notifications.md) | 5.4 | `/notifications/:id` | `DELETE` | User | [05-notifications.md:L133-136](./app-screens/05-notifications.md#L133-136) |
| **Event** | [Calendar (Mobile)](./app-screens/06-calendar.md) | 6.1 | `/events` | `GET` | User | [06-calendar.md:L52-55](./app-screens/06-calendar.md#L52-55) |
| **Event** | [Calendar (Mobile)](./app-screens/06-calendar.md) | 6.2 | `/events` | `POST` | User | [06-calendar.md:L93-96](./app-screens/06-calendar.md#L93-96) |
| **Event** | [Calendar (Mobile)](./app-screens/06-calendar.md) | 6.3 | `/events/:id` | `GET` | User | [06-calendar.md:L132-135](./app-screens/06-calendar.md#L132-135) |
| **Event** | [Calendar (Mobile)](./app-screens/06-calendar.md) | 6.4 | `/events/:id` | `PATCH` | User | [06-calendar.md:L163-166](./app-screens/06-calendar.md#L163-166) |
| **PreferenceCard** | [Library (Mobile)](./app-screens/07-library.md) | 7.1 | `/preference-cards/public` | `GET` | User | [07-library.md:L44-47](./app-screens/07-library.md#L44-47) |
| **PreferenceCard** | [Library (Mobile)](./app-screens/07-library.md) | 7.2 | `/preference-cards/private` | `GET` | User | [07-library.md:L92-95](./app-screens/07-library.md#L92-95) |
