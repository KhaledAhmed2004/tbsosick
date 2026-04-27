# Notifications Flow

> **Section**: System-Wide Notifications
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Standard Envelope**: See [README.md](../README.md#standard-response-envelope)

## Overview

System-e bibhinno action-er upor vitti kore user-der notification pathano hoy. Ei notification gula main-ly 3-ti channel-e jete pare:
1. **Push Notification**: Firebase (FCM) er maddhome mobile device-e.
2. **Socket Notification**: Socket.io er maddhome real-time app-er bhitor.
3. **Database Notification**: MongoDB-te save thake jeta user pore "Notification List" theke dekhte pare.

---

## Notification Types & Triggers

Current system-e nicher dhoron-er notification gula trigger hoy:

### 1. Event Reminders (Calendar)
- **Trigger 1**: Event shuru hovar **24 ghonta age**.
- **Trigger 2**: Event shuru hovar **1 ghonta age**.
- **Channels**: Push, Database, Socket.
- **Content**: `Your event "{{title}}" is in 24 hours/1 hour`.
- **Logic**: `EventService` theke `scheduleEventReminders` call kora hoy.

### 2. Preference Card Notifications
- **Trigger**: Jokhon kono notun **Preference Card** create ba add kora hoy.
- **Channels**: Database, Socket.
- **Content**: `New Card Added: {{surgeonName}} — {{procedure}}`.
- **Logic**: `PreferenceCardService` theke `NotificationService.createForPreferenceCard` call kora hoy.

### 3. Event Scheduled Confirmation
- **Trigger**: Jokhon kono notun **Event** schedule kora hoy.
- **Channels**: Database, Socket.
- **Content**: `Event Scheduled: {{title}} on {{whenText}}`.
- **Logic**: `EventService` theke `NotificationService.createForEventScheduled` call kora hoy.

---

## UX Flow

### Bell Icon & Unread Indicator
1. Home screen header e ekta **bell icon** thake (related: [Home](./02-home.md)).
2. App e foreground asar shathe shathe ba pull-to-refresh e `GET /notifications` call hoy.
3. Frontend response theke unread count compute kore: `data.filter(n => !n.read).length`.
4. Jodi unread count `> 0` hoy → bell icon-er upore **red dot** dekhay (badge number nai, just dot)
5. Unread count `0` hole red dot dekhay na.

> **Note**: Kono dedicated unread-count API nai. Frontend list response theke compute kore (per [Decision D4](../overview.md#appendix-a--decisions-log-v1)).

### Real-time Updates (Socket)
1. App login-er por `Socket.IO` connection establish hoy.
2. Server new notification trigger korle Socket event emit kore (`notification:new`).
3. Client event receive kore in-memory list update kore + red dot toggle kore.
4. App background e thakle FCM push notification dekhay (Event reminders only).

### Open Notification List
1. User bell icon e tap kore → Notifications screen e navigate kore.
2. Page load e `GET /notifications?page=1&limit=20` call hoy (→ list endpoint below).
3. Skeleton loader dekhay (5–6 row placeholder) loading-er somoy.
4. Response ashle list render hoy:
   - Each row: icon (`type` based) + `title` + `subtitle` + relative time (e.g., "2h ago").
   - **Unread rows** (`read: false`) highlighted background ba left bar marker shoho dekhay.
   - **Read rows** muted/dimmed style.
5. Top-right corner e **"Mark all as read"** button thake (jodi kono unread thake).
6. Empty state: "You're all caught up" placeholder + bell illustration (200 OK with `data: []`).

### Tap on Notification → Deep Link
1. User kono notification row e tap kore.
2. Frontend tap-handler `notification.type` ebong related metadata theke target screen decide kore:
   - **`REMINDER`** (event reminder) → Calendar event detail e navigate (`/events/:eventId`).
   - **Preference Card** type → Card details screen e navigate (`/preference-cards/:cardId`).
   - **Event scheduled** confirmation → Calendar screen-er oi date-e navigate.
3. Tap-er shathe shathe (optimistic) → `PATCH /notifications/:notificationId/read` call hoy background e (→ Mark as Read endpoint below).
4. Local state update hoy: oi notification `read: true` mark hoy ebong red dot recompute hoy.

### Mark All as Read
1. User top-right "Mark all as read" button e tap kore.
2. → `PATCH /notifications/read-all` (→ Mark All as Read endpoint below).
3. Success hole: shob notifications `read: true` hoy ebong red dot disappear kore.
4. Button itself disable / hide hoye jay (jotokkhon na new unread ashe).

### Swipe-to-Delete
1. User kono notification row left/right swipe kore.
2. Red "Delete" action button reveal hoy.
3. Tap korle → `DELETE /notifications/:notificationId` (→ Delete endpoint below).
4. Optimistic UI: row immediately list theke remove hoy.
5. Failure hole: row restore hoy + error toast dekhay.
6. Long-press menu o ekta alternative path hote pare ("Delete" / "Mark as read" options).

### Pagination (Infinite Scroll)
1. List bottom-er kache pouchle next page request trigger hoy: `GET /notifications?page=2&limit=20`.
2. Bottom e small spinner loading-er somoy.
3. `meta.hasNext: false` hole "You've reached the end" footer dekhay.

---

## Edge Cases

- **No Notifications**: `200 OK` with `data: []` → empty state placeholder ("You're all caught up").
- **Stale Red Dot**: Background e thakar somoy state stale hote pare. Foreground asar shathe shathe `GET /notifications` re-fetch kore reconcile kora hoy.
- **Optimistic Failure**: Mark-read ba delete API fail hole local state revert hoy + error toast.
- **Deep Link Target Deleted**: Notification reference kora resource (event/card) delete hoye gele 404 dekhabe — graceful fallback: list e back navigate + toast "This item is no longer available."
- **Push Permission Denied**: User push permission off rakhle FCM channel skip hoy — Socket + DB notifications kaj kore.
- **Rate Limit on Mark-Read**: Bulk mark-read ba dhara dhara delete e backend rate-limit trigger hoye 429 dile UI throttle kore.

---

## Notification List API

### Get My Notifications
```
GET /notifications
Auth: Bearer {{accessToken}}
```

**Query Parameters:**
- `page`: Pagination-er jonno (default: 1).
- `limit`: Per page item count (default: 20).

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notifications fetched successfully",
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

---

## Notification Actions

### Mark as Read
```
PATCH /notifications/:notificationId/read
Auth: Bearer {{accessToken}}
```

### Mark All as Read
```
PATCH /notifications/read-all
Auth: Bearer {{accessToken}}
```

### Delete Notification
```
DELETE /notifications/:notificationId
Auth: Bearer {{accessToken}}
```


---

## Implementation Details

- **Service**: [notification.service.ts](file:///src/app/modules/notification/notification.service.ts) - Database logic and trigger helpers.
- **Model**: [notification.model.ts](file:///src/app/modules/notification/notification.model.ts) - Schema defining fields like `userId`, `type`, `title`, `subtitle`, etc.
- **Helper**: [notificationsHelper.ts](file:///src/app/modules/notification/notificationsHelper.ts) - Handles socket emission and push notification logic.
- **Builder**: [NotificationBuilder.ts](file:///src/app/builder/NotificationBuilder/NotificationBuilder.ts) - Unified API for complex multi-channel notifications.
