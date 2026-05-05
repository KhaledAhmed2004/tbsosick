# API Inventory & Implementation Tracker

> **Tracker view** — every endpoint, its wiring status, and where it appears across screens. For full specs, follow the **Spec** column. For UX flows, follow the **On a screen?** column.

> **Mount prefixes** (see `src/routes/index.ts`): `/users`, `/auth`, `/notifications`, `/subscriptions`, `/events`, `/preference-cards`, `/admin`, `/supplies`, `/sutures`, `/legal`.
> **Base URL:** `/api/v1`
> **Documentation:** `/api/v1/docs` (Swagger UI)

**Status legend**: ✅ Done · 🟡 Spec done, code pending · ❌ Not implemented · — Orphan / not used

---

## Auth Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 1.1 | POST | `/auth/login` | Public | ✅ | [Module 1.1](./modules/auth/01-login.md) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.2 | POST | `/auth/verify-otp` | Public | ✅ | [Module 1.2](./modules/auth/02-verify-otp.md) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.3 | POST | `/auth/forgot-password` | Public | ✅ | [Module 1.3](./modules/auth/03-forgot-password.md) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.4 | POST | `/auth/reset-password` | Reset Token | ✅ | [Module 1.4](./modules/auth/04-reset-password.md) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.5 | POST | `/auth/refresh-token` | Refresh Token | ✅ | [Module 1.5](./modules/auth/05-refresh-token.md) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.6 | POST | `/auth/logout` | Bearer | ✅ | [Module 1.6](./modules/auth/06-logout.md) | [App Auth](./app-screens/01-auth.md), [App Profile](./app-screens/06-profile.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.7 | POST | `/auth/resend-otp` | Public | ✅ | [Module 1.7](./modules/auth/07-resend-otp.md) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.8 | POST | `/auth/social-login` | Public | ✅ | [Module 1.8](./modules/auth/08-social-login.md) | [App Auth](./app-screens/01-auth.md) |
| 1.9 | POST | `/auth/change-password` | Bearer | ✅ | [Module 1.9](./modules/auth/09-change-password.md) | [Dashboard Auth](./dashboard-screens/01-auth.md) |

## User Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 2.1 | POST | `/users` | Public / SUPER_ADMIN | ✅ | [Module 2.1](./modules/user/01-create-user.md) | [App Auth](./app-screens/01-auth.md), [Dashboard User Mgmt](./dashboard-screens/03-user-management.md) |
| 2.2 | GET | `/users/:userId/user` | User / Admin | ✅ | [Module 2.2](./modules/user/02-get-user-details-public.md) | — |
| 2.3 | GET | `/users/profile` | Bearer | ✅ | [Module 2.3](./modules/user/03-get-own-profile.md) | [App Profile](./app-screens/06-profile.md) |
| 2.4 | PATCH | `/users/profile` | Bearer | ✅ | [Module 2.4](./modules/user/04-update-own-profile.md) | [App Profile](./app-screens/06-profile.md) |
| 2.5 | GET | `/users/me/favorites` | Bearer | ✅ | [Module 2.5](./modules/user/05-list-favorite-cards.md) | [App Home](./app-screens/02-home.md) |

## Preference Card Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 3.1 | GET | `/preference-cards` | Bearer | ✅ | [Module 3.1](./modules/preference-card/01-list-search-cards.md) | [App Home](./app-screens/02-home.md), [App Library](./app-screens/04-library.md), [Dashboard Card Mgmt](./dashboard-screens/04-preference-card-management.md) |
| 3.2 | GET | `/preference-cards/stats` | Bearer | ✅ | [Module 3.2](./modules/preference-card/02-get-cards-stats.md) | [App Home](./app-screens/02-home.md) |
| 3.3 | GET | `/preference-cards/specialties` | Bearer | ✅ | [Module 3.3](./modules/preference-card/03-fetch-distinct-specialties.md) | [App Library](./app-screens/04-library.md) |
| 3.4 | POST | `/preference-cards` | Bearer | ✅ | [Module 3.4](./modules/preference-card/04-create-preference-card.md) | [App Card Details](./app-screens/03-preference-card-details.md) |
| 3.5 | GET | `/preference-cards/:cardId` | Bearer | ✅ | [Module 3.5](./modules/preference-card/05-get-card-details.md) | [App Card Details](./app-screens/03-preference-card-details.md), [App Library](./app-screens/04-library.md) |
| 3.6 | PATCH | `/preference-cards/:cardId` | Bearer | ✅ | [Module 3.6](./modules/preference-card/06-update-preference-card.md) | [App Card Details](./app-screens/03-preference-card-details.md) |
| 3.7 | DELETE | `/preference-cards/:cardId` | Bearer | ✅ | [Module 3.7](./modules/preference-card/07-delete-preference-card.md) | [App Card Details](./app-screens/03-preference-card-details.md), [Dashboard Card Mgmt](./dashboard-screens/04-preference-card-management.md) |
| 3.8 | PUT | `/preference-cards/favorites/cards/:cardId` | Bearer | ✅ | [Module 3.8](./modules/preference-card/08-favorite-card.md) | [App Home](./app-screens/02-home.md), [App Card Details](./app-screens/03-preference-card-details.md), [App Library](./app-screens/04-library.md), [Dashboard Card Mgmt](./dashboard-screens/04-preference-card-management.md) |
| 3.9 | DELETE | `/preference-cards/favorites/cards/:cardId` | Bearer | ✅ | [Module 3.9](./modules/preference-card/09-unfavorite-card.md) | [App Home](./app-screens/02-home.md), [App Card Details](./app-screens/03-preference-card-details.md), [App Library](./app-screens/04-library.md), [Dashboard Card Mgmt](./dashboard-screens/04-preference-card-management.md) |
| 3.10 | POST | `/preference-cards/:cardId/download` | Bearer | ✅ | [Module 3.10](./modules/preference-card/10-download-preference-card.md) | [App Card Details](./app-screens/03-preference-card-details.md), [App Library](./app-screens/04-library.md) |
| 3.11 | PATCH | `/preference-cards/:cardId` | SUPER_ADMIN | 🟡 | [Module 3.11](./modules/preference-card/11-admin-verification.md) | [Dashboard Card Mgmt](./dashboard-screens/04-preference-card-management.md) |

## Event Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 4.1 | GET | `/events` | Bearer | ✅ | [Module 4.1](./modules/event/01-list-events.md) | [App Calendar](./app-screens/05-calendar.md) |
| 4.2 | POST | `/events` | Bearer | ✅ | [Module 4.2](./modules/event/02-create-event.md) | [App Calendar](./app-screens/05-calendar.md) |
| 4.3 | GET | `/events/:eventId` | Bearer | ✅ | [Module 4.3](./modules/event/03-get-single-event-details.md) | [App Calendar](./app-screens/05-calendar.md) |
| 4.4 | PATCH | `/events/:eventId` | Bearer | ✅ | [Module 4.4](./modules/event/04-update-event.md) | [App Calendar](./app-screens/05-calendar.md) |
| 4.5 | DELETE | `/events/:eventId` | Bearer | ✅ | [Module 4.5](./modules/event/05-delete-event.md) | [App Calendar](./app-screens/05-calendar.md) |

## Notification Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 5.1 | GET | `/notifications` | Bearer | ✅ | [Module 5.1](./modules/notification/01-get-my-notifications.md) | [App Notifications](./app-screens/07-notifications.md) |
| 5.2 | PATCH | `/notifications/:notificationId/read` | Bearer | ✅ | [Module 5.2](./modules/notification/02-mark-as-read.md) | [App Notifications](./app-screens/07-notifications.md) |
| 5.3 | PATCH | `/notifications/read-all` | Bearer | ✅ | [Module 5.3](./modules/notification/03-mark-all-as-read.md) | [App Notifications](./app-screens/07-notifications.md) |
| 5.4 | DELETE | `/notifications/:notificationId` | Bearer | ✅ | [Module 5.4](./modules/notification/04-delete-notification.md) | [App Notifications](./app-screens/07-notifications.md) |

## Legal Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 6.1 | GET | `/legal` | Public | ✅ | [Module 6.1](./modules/legal/01-list-legal-pages.md) | [App Profile](./app-screens/06-profile.md), [Dashboard Legal Mgmt](./dashboard-screens/05-legal-management.md) |
| 6.2 | GET | `/legal/:slug` | Public | ✅ | [Module 6.2](./modules/legal/02-get-legal-page-by-slug.md) | [App Profile](./app-screens/06-profile.md), [Dashboard Legal Mgmt](./dashboard-screens/05-legal-management.md) |
| 6.3 | POST | `/legal` | SUPER_ADMIN | ✅ | [Module 6.3](./modules/legal/03-create-legal-page.md) | [Dashboard Legal Mgmt](./dashboard-screens/05-legal-management.md) |
| 6.4 | PATCH | `/legal/:slug` | SUPER_ADMIN | ✅ | [Module 6.4](./modules/legal/04-update-legal-page.md) | [Dashboard Legal Mgmt](./dashboard-screens/05-legal-management.md) |
| 6.5 | DELETE | `/legal/:slug` | SUPER_ADMIN | ✅ | [Module 6.5](./modules/legal/05-delete-legal-page.md) | [Dashboard Legal Mgmt](./dashboard-screens/05-legal-management.md) |

## Supply Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 7.1 | GET | `/supplies` | Bearer / SUPER_ADMIN | ✅ | [Module 7.1](./modules/supply/01-list-supplies.md) | [App Card Details](./app-screens/03-preference-card-details.md), [Dashboard Supplies Mgmt](./dashboard-screens/06-supplies-management.md) |
| 7.2 | POST | `/supplies` | SUPER_ADMIN | ✅ | [Module 7.2](./modules/supply/02-create-supply.md) | [Dashboard Supplies Mgmt](./dashboard-screens/06-supplies-management.md) |
| 7.3 | POST | `/supplies/bulk` | SUPER_ADMIN | ✅ | [Module 7.3](./modules/supply/03-bulk-create-supplies.md) | [Dashboard Supplies Mgmt](./dashboard-screens/06-supplies-management.md) |
| 7.4 | PATCH | `/supplies/:supplyId` | SUPER_ADMIN | ✅ | [Module 7.4](./modules/supply/04-update-supply.md) | [Dashboard Supplies Mgmt](./dashboard-screens/06-supplies-management.md) |
| 7.5 | DELETE | `/supplies/:supplyId` | SUPER_ADMIN | ✅ | [Module 7.5](./modules/supply/05-delete-supply.md) | [Dashboard Supplies Mgmt](./dashboard-screens/06-supplies-management.md) |

## Suture Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 8.1 | GET | `/sutures` | Bearer / SUPER_ADMIN | ✅ | [Module 8.1](./modules/suture/01-list-sutures.md) | [App Card Details](./app-screens/03-preference-card-details.md), [Dashboard Sutures Mgmt](./dashboard-screens/07-sutures-management.md) |
| 8.2 | POST | `/sutures` | SUPER_ADMIN | ✅ | [Module 8.2](./modules/suture/02-create-suture.md) | [Dashboard Sutures Mgmt](./dashboard-screens/07-sutures-management.md) |
| 8.3 | POST | `/sutures/bulk` | SUPER_ADMIN | ✅ | [Module 8.3](./modules/suture/03-bulk-create-sutures.md) | [Dashboard Sutures Mgmt](./dashboard-screens/07-sutures-management.md) |
| 8.4 | PATCH | `/sutures/:sutureId` | SUPER_ADMIN | ✅ | [Module 8.4](./modules/suture/04-update-suture.md) | [Dashboard Sutures Mgmt](./dashboard-screens/07-sutures-management.md) |
| 8.5 | DELETE | `/sutures/:sutureId` | SUPER_ADMIN | ✅ | [Module 8.5](./modules/suture/05-delete-suture.md) | [Dashboard Sutures Mgmt](./dashboard-screens/07-sutures-management.md) |

## Subscription Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 9.1 | GET | `/subscriptions/me` | Bearer | ✅ | [Module 9.1](./modules/subscription/01-get-my-subscription.md) | [App Profile](./app-screens/06-profile.md) |
| 9.2 | POST | `/subscriptions/apple/verify` | Bearer | ✅ | [Module 9.2](./modules/subscription/02-verify-apple-purchase.md) | [App Profile](./app-screens/06-profile.md) |
| 9.3 | POST | `/subscriptions/google/verify` | Bearer | ✅ | [Module 9.3](./modules/subscription/03-verify-google-purchase.md) | [App Profile](./app-screens/06-profile.md) |
| 9.4 | POST | `/subscriptions/choose/free` | Bearer | ✅ | [Module 9.4](./modules/subscription/04-set-free-plan.md) | [App Profile](./app-screens/06-profile.md) |
| 9.5 | POST | `/subscriptions/.../webhook` | Public | ✅ | [Module 9.5](./modules/subscription/05-platform-webhooks.md) | — |

## Admin Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 10.1 | GET | `/admin/growth-metrics` | SUPER_ADMIN | ✅ | [Module 10.1](./modules/admin/01-growth-metrics.md) | [Dashboard Overview](./dashboard-screens/02-overview.md) |
| 10.2 | GET | `/admin/preference-cards/trends/monthly` | SUPER_ADMIN | ✅ | [Module 10.2](./modules/admin/02-monthly-preference-cards-trend.md) | [Dashboard Overview](./dashboard-screens/02-overview.md) |
| 10.3 | GET | `/admin/subscriptions/trends/monthly` | SUPER_ADMIN | ✅ | [Module 10.3](./modules/admin/03-monthly-active-subscriptions-trend.md) | [Dashboard Overview](./dashboard-screens/02-overview.md) |
| 10.4 | GET | `/admin/users/stats` | SUPER_ADMIN | ✅ | [Module 10.4](./modules/admin/04-user-stats-dashboard.md) | [Dashboard User Mgmt](./dashboard-screens/03-user-management.md) |
| 10.5 | GET | `/admin/users` | SUPER_ADMIN | ✅ | [Module 10.5](./modules/admin/05-list-users.md) | [Dashboard User Mgmt](./dashboard-screens/03-user-management.md) |
| 10.6 | GET | `/admin/users/:userId` | SUPER_ADMIN | ✅ | [Module 10.6](./modules/admin/06-get-user-by-id.md) | [Dashboard User Mgmt](./dashboard-screens/03-user-management.md) |
| 10.7 | PATCH | `/admin/users/:userId` | SUPER_ADMIN | ✅ | [Module 10.7](./modules/admin/07-update-user.md) | [Dashboard User Mgmt](./dashboard-screens/03-user-management.md) |
| 10.8 | DELETE | `/admin/users/:userId` | SUPER_ADMIN | ✅ | [Module 10.8](./modules/admin/08-delete-user.md) | [Dashboard User Mgmt](./dashboard-screens/03-user-management.md) |
