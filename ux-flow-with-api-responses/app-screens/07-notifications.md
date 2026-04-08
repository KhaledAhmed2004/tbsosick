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
PUT /notifications/mark-all-read
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
