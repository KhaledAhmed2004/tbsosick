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
| 1.1 | POST | `/auth/login` | Public | ✅ | [Module 1.1](./modules/auth.md#11-login) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.2 | POST | `/auth/verify-otp` | Public | ✅ | [Module 1.2](./modules/auth.md#12-verify-otp) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.3 | POST | `/auth/forgot-password` | Public | ✅ | [Module 1.3](./modules/auth.md#13-forgot-password) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.4 | POST | `/auth/reset-password` | Reset Token | ✅ | [Module 1.4](./modules/auth.md#14-reset-password) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.5 | POST | `/auth/refresh-token` | Refresh Token | ✅ | [Module 1.5](./modules/auth.md#15-refresh-token) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.6 | POST | `/auth/logout` | Bearer | ✅ | [Module 1.6](./modules/auth.md#16-logout) | [App Auth](./app-screens/01-auth.md), [App Profile](./app-screens/06-profile.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.7 | POST | `/auth/resend-verify-email` | Public | ✅ | [Module 1.7](./modules/auth.md#17-resend-otp-resend-verify-email) | [App Auth](./app-screens/01-auth.md), [Dashboard Auth](./dashboard-screens/01-auth.md) |
| 1.8 | POST | `/auth/social-login` | Public | ✅ | [Module 1.8](./modules/auth.md#18-social-login-google--apple) | [App Auth](./app-screens/01-auth.md) |
| 1.9 | POST | `/auth/change-password` | Bearer | ✅ | [Module 1.9](./modules/auth.md#19-change-password) | [Dashboard Auth](./dashboard-screens/01-auth.md) |

## User Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 2.1 | POST | `/users` | Public / SUPER_ADMIN | ✅ | [Module 2.1](./modules/user.md#21-create-user-registration--admin-create) | [App Auth](./app-screens/01-auth.md), [Dashboard User Mgmt](./dashboard-screens/03-user-management.md) |
| 2.2 | GET | `/users` | SUPER_ADMIN | ✅ | [Module 2.2](./modules/user.md#22-getsearch-users-doctors) | [Dashboard User Mgmt](./dashboard-screens/03-user-management.md) |
| 2.3 | GET | `/users/stats` | SUPER_ADMIN | ✅ | [Module 2.3](./modules/user.md#23-user-stats-overview-cards) | [Dashboard User Mgmt](./dashboard-screens/03-user-management.md) |
| 2.4 | PATCH | `/users/:userId` | SUPER_ADMIN | ✅ | [Module 2.4](./modules/user.md#24-update-user-admin) | [Dashboard User Mgmt](./dashboard-screens/03-user-management.md) |
| 2.5 | DELETE | `/users/:userId` | SUPER_ADMIN | ✅ | [Module 2.5](./modules/user.md#25-delete-user-admin) | [Dashboard User Mgmt](./dashboard-screens/03-user-management.md) |
| 2.6 | GET | `/users/profile` | Bearer | ✅ | [Module 2.6](./modules/user.md#26-get-profile) | [App Profile](./app-screens/06-profile.md) |
| 2.7 | PATCH | `/users/profile` | Bearer | ✅ | [Module 2.7](./modules/user.md#27-update-profile) | [App Profile](./app-screens/06-profile.md) |
| 2.8 | GET | `/users/me/favorites` | Bearer | ✅ | [Module 2.8](./modules/user.md#28-list-favorite-cards) | [App Home](./app-screens/02-home.md) |

## Preference Card Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 3.1 | GET | `/preference-cards` | Bearer | ✅ | [Module 3.1](./modules/preference-card.md#31-listsearch-preference-cards) | [App Home](./app-screens/02-home.md), [App Library](./app-screens/04-library.md), [Dashboard Card Mgmt](./dashboard-screens/04-preference-card-management.md) |
| 3.2 | GET | `/preference-cards/stats` | Bearer | ✅ | [Module 3.2](./modules/preference-card.md#32-get-cards-stats) | [App Home](./app-screens/02-home.md) |
| 3.3 | GET | `/preference-cards/specialties` | Bearer | ✅ | [Module 3.3](./modules/preference-card.md#33-fetch-distinct-specialties) | [App Library](./app-screens/04-library.md) |
| 3.4 | POST | `/preference-cards` | Bearer | ✅ | [Module 3.4](./modules/preference-card.md#34-create-preference-card) | [App Card Details](./app-screens/03-preference-card-details.md) |
| 3.5 | GET | `/preference-cards/:cardId` | Bearer | ✅ | [Module 3.5](./modules/preference-card.md#35-get-card-details) | [App Card Details](./app-screens/03-preference-card-details.md), [App Library](./app-screens/04-library.md) |
| 3.6 | PATCH | `/preference-cards/:cardId` | Bearer | ✅ | [Module 3.6](./modules/preference-card.md#36-update-preference-card) | [App Card Details](./app-screens/03-preference-card-details.md) |
| 3.7 | DELETE | `/preference-cards/:cardId` | Bearer | ✅ | [Module 3.7](./modules/preference-card.md#37-delete-preference-card) | [App Card Details](./app-screens/03-preference-card-details.md), [Dashboard Card Mgmt](./dashboard-screens/04-preference-card-management.md) |
| 3.8 | PUT | `/preference-cards/favorites/cards/:cardId` | Bearer | ✅ | [Module 3.8](./modules/preference-card.md#38-favorite-a-card) | [App Home](./app-screens/02-home.md), [App Card Details](./app-screens/03-preference-card-details.md), [App Library](./app-screens/04-library.md), [Dashboard Card Mgmt](./dashboard-screens/04-preference-card-management.md) |
| 3.9 | DELETE | `/preference-cards/favorites/cards/:cardId` | Bearer | ✅ | [Module 3.9](./modules/preference-card.md#39-unfavorite-a-card) | [App Home](./app-screens/02-home.md), [App Card Details](./app-screens/03-preference-card-details.md), [App Library](./app-screens/04-library.md), [Dashboard Card Mgmt](./dashboard-screens/04-preference-card-management.md) |
| 3.10 | POST | `/preference-cards/:cardId/download` | Bearer | ✅ | [Module 3.10](./modules/preference-card.md#310-increment-download-count) | [App Card Details](./app-screens/03-preference-card-details.md), [App Library](./app-screens/04-library.md) |
| 3.11 | PATCH | `/preference-cards/:cardId` (`{ verificationStatus }` body) | SUPER_ADMIN | 🟡 | [Module 3.11](./modules/preference-card.md#311-update-verification-status-approvereject--admin) | [Dashboard Card Mgmt](./dashboard-screens/04-preference-card-management.md) |

## Event Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 4.1 | GET | `/events` | Bearer | ✅ | [Module 4.1](./modules/event.md#41-list-my-events) | [App Calendar](./app-screens/05-calendar.md) |
| 4.2 | POST | `/events` | Bearer | ✅ | [Module 4.2](./modules/event.md#42-create-event) | [App Calendar](./app-screens/05-calendar.md) |
| 4.3 | GET | `/events/:eventId` | Bearer | ✅ | [Module 4.3](./modules/event.md#43-get-event-details) | [App Calendar](./app-screens/05-calendar.md) |
| 4.4 | PATCH | `/events/:eventId` | Bearer | ✅ | [Module 4.4](./modules/event.md#44-update-event) | [App Calendar](./app-screens/05-calendar.md) |
| 4.5 | DELETE | `/events/:eventId` | Bearer | ✅ | [Module 4.5](./modules/event.md#45-delete-event) | [App Calendar](./app-screens/05-calendar.md) |

## Notification Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 5.1 | GET | `/notifications` | Bearer | ✅ | [Module 5.1](./modules/notification.md#51-get-my-notifications) | [App Notifications](./app-screens/07-notifications.md) |
| 5.2 | PATCH | `/notifications/:notificationId/read` | Bearer | ✅ | [Module 5.2](./modules/notification.md#52-mark-as-read) | [App Notifications](./app-screens/07-notifications.md) |
| 5.3 | PATCH | `/notifications/read-all` | Bearer | ✅ | [Module 5.3](./modules/notification.md#53-mark-all-as-read) | [App Notifications](./app-screens/07-notifications.md) |
| 5.4 | DELETE | `/notifications/:notificationId` | Bearer | ✅ | [Module 5.4](./modules/notification.md#54-delete-notification) | [App Notifications](./app-screens/07-notifications.md) |

## Legal Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 6.1 | GET | `/legal` | Public | ✅ | [Module 6.1](./modules/legal.md#61-list-legal-pages) | [App Profile](./app-screens/06-profile.md), [Dashboard Legal Mgmt](./dashboard-screens/05-legal-management.md) |
| 6.2 | GET | `/legal/:slug` | Public | ✅ | [Module 6.2](./modules/legal.md#62-get-legal-page-by-slug) | [App Profile](./app-screens/06-profile.md), [Dashboard Legal Mgmt](./dashboard-screens/05-legal-management.md) |
| 6.3 | POST | `/legal` | SUPER_ADMIN | ✅ | [Module 6.3](./modules/legal.md#63-create-legal-page) | [Dashboard Legal Mgmt](./dashboard-screens/05-legal-management.md) |
| 6.4 | PATCH | `/legal/:slug` | SUPER_ADMIN | ✅ | [Module 6.4](./modules/legal.md#64-update-legal-page) | [Dashboard Legal Mgmt](./dashboard-screens/05-legal-management.md) |
| 6.5 | DELETE | `/legal/:slug` | SUPER_ADMIN | ✅ | [Module 6.5](./modules/legal.md#65-delete-legal-page) | [Dashboard Legal Mgmt](./dashboard-screens/05-legal-management.md) |

## Supply Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 7.1 | GET | `/supplies` | Bearer / SUPER_ADMIN | ✅ | [Module 7.1](./modules/supply.md#71-list-supplies) | [App Card Details](./app-screens/03-preference-card-details.md), [Dashboard Supplies Mgmt](./dashboard-screens/06-supplies-management.md) |
| 7.2 | POST | `/supplies` | SUPER_ADMIN | ✅ | [Module 7.2](./modules/supply.md#72-create-supply) | [Dashboard Supplies Mgmt](./dashboard-screens/06-supplies-management.md) |
| 7.3 | POST | `/supplies/bulk` | SUPER_ADMIN | ✅ | [Module 7.3](./modules/supply.md#73-bulk-create-supplies) | [Dashboard Supplies Mgmt](./dashboard-screens/06-supplies-management.md) |
| 7.4 | PATCH | `/supplies/:supplyId` | SUPER_ADMIN | ✅ | [Module 7.4](./modules/supply.md#74-update-supply) | [Dashboard Supplies Mgmt](./dashboard-screens/06-supplies-management.md) |
| 7.5 | DELETE | `/supplies/:supplyId` | SUPER_ADMIN | ✅ | [Module 7.5](./modules/supply.md#75-delete-supply) | [Dashboard Supplies Mgmt](./dashboard-screens/06-supplies-management.md) |

## Suture Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 8.1 | GET | `/sutures` | Bearer / SUPER_ADMIN | ✅ | [Module 8.1](./modules/suture.md#81-list-sutures) | [App Card Details](./app-screens/03-preference-card-details.md), [Dashboard Sutures Mgmt](./dashboard-screens/07-sutures-management.md) |
| 8.2 | POST | `/sutures` | SUPER_ADMIN | ✅ | [Module 8.2](./modules/suture.md#82-create-suture) | [Dashboard Sutures Mgmt](./dashboard-screens/07-sutures-management.md) |
| 8.3 | POST | `/sutures/bulk` | SUPER_ADMIN | ✅ | [Module 8.3](./modules/suture.md#83-bulk-create-sutures) | [Dashboard Sutures Mgmt](./dashboard-screens/07-sutures-management.md) |
| 8.4 | PATCH | `/sutures/:sutureId` | SUPER_ADMIN | ✅ | [Module 8.4](./modules/suture.md#84-update-suture) | [Dashboard Sutures Mgmt](./dashboard-screens/07-sutures-management.md) |
| 8.5 | DELETE | `/sutures/:sutureId` | SUPER_ADMIN | ✅ | [Module 8.5](./modules/suture.md#85-delete-suture) | [Dashboard Sutures Mgmt](./dashboard-screens/07-sutures-management.md) |

## Subscription Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 9.1 | GET | `/subscriptions/me` | Bearer | ✅ | [Module 9.1](./modules/subscription.md#91-get-my-subscription) | [App Profile](./app-screens/06-profile.md) |
| 9.2 | POST | `/subscriptions/verify-receipt` | Bearer | 🟡 | [Module 9.2](./modules/subscription.md#92-verify-receipt-iap) | [App Profile](./app-screens/06-profile.md) |

## Admin Module

| ID | Method | Endpoint | Roles | Status | Spec | On a screen? |
|---|---|---|---|:---:|---|---|
| 10.1 | GET | `/admin/growth-metrics` | SUPER_ADMIN | ✅ | [Module 10.1](./modules/admin.md#101-growth-metrics-stats) | [Dashboard Overview](./dashboard-screens/02-overview.md) |
| 10.2 | GET | `/admin/preference-cards/monthly` | SUPER_ADMIN | ✅ | [Module 10.2](./modules/admin.md#102-monthly-preference-cards-trend) | [Dashboard Overview](./dashboard-screens/02-overview.md) |
| 10.3 | GET | `/admin/subscriptions/active/monthly` | SUPER_ADMIN | ✅ | [Module 10.3](./modules/admin.md#103-monthly-active-subscriptions-trend) | [Dashboard Overview](./dashboard-screens/02-overview.md) |
