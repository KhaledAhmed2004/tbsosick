# Notification Module APIs

> **Section**: Backend API specifications for the notification module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Notifications](../app-screens/07-notifications.md) — Bell, list, mark-read, delete

---

## Overview

System-e bibhinno action-er upor vitti kore user-der notification pathano hoy. Ei notification gula main-ly 3-ti channel-e jete pare:
1. **Push Notification**: Firebase (FCM) er maddhome mobile device-e.
2. **Socket Notification**: Socket.io er maddhome real-time app-er bhitor.
3. **Database Notification**: MongoDB-te save thake jeta user pore "Notification List" theke dekhte pare.

### Notification Types & Triggers

Current system-e nicher dhoron-er notification gula trigger hoy:

#### 1. Event Reminders (Calendar)
- **Trigger 1**: Event shuru hovar **24 ghonta age**.
- **Trigger 2**: Event shuru hovar **1 ghonta age**.
- **Channels**: Push, Database, Socket.
- **Content**: `Your event "{{title}}" is in 24 hours/1 hour`.
- **Logic**: `EventService` theke `scheduleEventReminders` call kora hoy.

#### 2. Preference Card Notifications
- **Trigger**: Jokhon kono notun **Preference Card** create ba add kora hoy.
- **Channels**: Database, Socket.
- **Content**: `New Card Added: {{surgeonName}} — {{procedure}}`.
- **Logic**: `PreferenceCardService` theke `NotificationService.createForPreferenceCard` call kora hoy.

#### 3. Event Scheduled Confirmation
- **Trigger**: Jokhon kono notun **Event** schedule kora hoy.
- **Channels**: Database, Socket.
- **Content**: `Event Scheduled: {{title}} on {{whenText}}`.
- **Logic**: `EventService` theke `NotificationService.createForEventScheduled` call kora hoy.

---

## Endpoints Index

| # | Method | Endpoint | Auth | Used By |
|---|---|---|---|---|
| 5.1 | GET | `/notifications` | Bearer | [App Notifications](../app-screens/07-notifications.md) |
| 5.2 | PATCH | `/notifications/:notificationId/read` | Bearer | [App Notifications](../app-screens/07-notifications.md) |
| 5.3 | PATCH | `/notifications/read-all` | Bearer | [App Notifications](../app-screens/07-notifications.md) |
| 5.4 | DELETE | `/notifications/:notificationId` | Bearer | [App Notifications](../app-screens/07-notifications.md) |

---

### 5.1 Get My Notifications

```
GET /notifications
Auth: Bearer {{accessToken}}
```

**Business Logic (`getNotificationsForUserFromDB`):**
- **Single-Query Aggregation**: Efficiency-er jonno `$facet` use kore notifications list, total count, ebong **unreadCount** ekshathe fetch kora hoy.
- **Index Optimization**: `{ userId: 1, read: 1, createdAt: -1 }` compound index use kora hoy query performance fast korar jonno.
- **Visibility**: Shudhu `isDeleted: false` records return kora hoy (Soft Delete implementation).
- **Unread Count**: `meta.unreadCount` is computed as `count({ userId, read: false, isDeleted: false })` — the user's total unread notifications across all pages, not just this page. The mobile bell-icon red dot is rendered from this single field (`meta.unreadCount > 0`).

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Notifications fetched successfully",
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false,
      "unreadCount": 7
    },
    "data": [
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d11",
        "title": "Event Reminder",
        "subtitle": "Surgery on 2026-04-10 at 08:00",
        "type": "REMINDER",
        "read": false,
        "icon": "calendar",
        "createdAt": "2026-04-09T08:00:00.000Z"
      }
    ]
  }
  ```

> `meta.unreadCount` returns the user's total unread notification count across all pages, not just this page.

---

### 5.2 Mark as Read

```
PATCH /notifications/:notificationId/read
Auth: Bearer {{accessToken}}
```

> Single notification ke read mark kore. Tap-er shathe shathe (optimistic) call hoy background e.

**Implementation:**
- **Route**: [notification.route.ts](file:///src/app/modules/notification/notification.route.ts)
- **Controller**: [notification.controller.ts](file:///src/app/modules/notification/notification.controller.ts) — `markAsRead`
- **Service**: [notification.service.ts](file:///src/app/modules/notification/notification.service.ts) — `markNotificationReadInDB`

**Business Logic (`markNotificationReadInDB`):**
- **Ownership Check**: Shudhu notification-er real owner-i eiti read mark korte pare.
- **Validation**: Notification existence check kora hoy.
- **Idempotency**: Notification jodi aggei `read: true` thake, tobeo server success response return korbe without error.

---

### 5.3 Mark All as Read

```
PATCH /notifications/read-all
Auth: Bearer {{accessToken}}
```

> User top-right "Mark all as read" button e tap korle shob notifications `read: true` hoy ebong red dot disappear kore.

**Business Logic (`markAllNotificationsReadInDB`):**
- **Bulk Update**: `updateMany` use kore ek-i call-e user-er shob unread notifications read mark kora hoy.
- **Idempotency**: Jodi kono unread notification na thake, tobeo request successful hobe (0 documents updated).

---

### 5.4 Delete Notification

```
DELETE /notifications/:notificationId
Auth: Bearer {{accessToken}}
```

> Swipe-to-delete ba long-press menu theke notification delete korar jonno. Optimistic UI: row immediately list theke remove hoy. Failure hole row restore hoy + error toast dekhay.

**Business Logic (`deleteNotificationFromDB`):**
- **Soft Delete**: Data permanent-ly delete na kore `isDeleted: true` flag set kora hoy.
- **Authorization**: Owner validation mandatory.
- **Idempotency**: Jodi notification aggei delete kora hoye thake, server graceful success return korbe.

---

## Fan-out & Infrastructure

Notification system-er backend logic multiple layers-e divided:

### 1. Multi-Channel Fan-out
Kono trigger hole `sendNotifications` helper use kora hoy:
- **Persistence**: MongoDB-te save hoy.
- **Real-time**: Socket.io-r maddhome user-er specific room-e event emit hoy (`get-notification::${userId}`).
- **Push**: User-er saved `deviceTokens` use kore Firebase (FCM) push notification pathano hoy.

### 2. Notification Builder
Complex logic ebong future scheduling-er jonno `NotificationBuilder` use kora hoy:
- **Chainable API**: `.to(user).useTemplate(name).viaAll().send()`.
- **Scheduling**: `scheduleAfter('2h')` use kore future notifications schedule kora jay.
- **Polymorphic Reference**: `resourceType` ebong `resourceId` use kore notification-ke Preference Card ba Event-er shathe link kora hoy.

### 3. Automatic Expiry
- **TTL Index**: Notification schema-te `expiresAt` field-er opor TTL index ache, jeta default-e **30 days** por notification auto-delete kore dei.

---

## Module-level helpers

Notifications use a multi-channel fan-out pattern that's shared across triggering services:

- **Model**: [notification.model.ts](file:///src/app/modules/notification/notification.model.ts) — Schema (`userId`, `type`, `title`, `subtitle`, `read`, `icon`).
- **Helper**: [notificationsHelper.ts](file:///src/app/modules/notification/notificationsHelper.ts) — Socket emission + FCM push.
- **Builder**: [NotificationBuilder.ts](file:///src/app/builder/NotificationBuilder/NotificationBuilder.ts) — Unified API for complex multi-channel notifications.

For cross-cutting error responses (401, 429, 400), see [Common Error Scenarios](./README.md#common-error-scenarios).

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 5.1 | `/notifications` | `GET` | Bearer | Done | Paginated list — backend returns `unreadCount` in `meta` |
| 5.2 | `/notifications/:notificationId/read` | `PATCH` | Bearer | Done | Mark single as read |
| 5.3 | `/notifications/read-all` | `PATCH` | Bearer | Done | Mark all as read |
| 5.4 | `/notifications/:notificationId` | `DELETE` | Bearer | Done | Hard delete |
