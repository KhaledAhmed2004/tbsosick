# Screen 5: Notifications

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Home](./03-home.md) (Access via bell icon), [Preference Card Details](./04-preference-card-details.md) (Navigation from notification)

## UX Flow

### Notification List Load
1. User app-er header-e thaka notification (bell) icon-e tap kore.
2. Page load-e user-er shob notifications fetch hoy → `GET /notifications` (→ 5.1).
3. Screen render hoy:
   - Notification cards (Title, Subtitle/Text, Icon, Time).
   - Unread notifications highlight hoye thake.
   - List khali thakle "No notifications yet" message dekhay.

### Notification Interactions
1. **Mark as Read**: User kono notification-e tap korle details-e navigate korar age oita read mark hoy → `PATCH /notifications/:id/read` (→ 5.2).
2. **Mark All Read**: User "Mark All as Read" button-e tap korle shob notification ekshathe read mark hoy → `PATCH /notifications/read-all` (→ 5.3).
3. **Delete**: Notification swipe korle ba delete icon-e tap korle oita remove hoy → `DELETE /notifications/:id` (→ 5.4).
4. **Navigation**: 
   - Notification card-e tap korle corresponding resource-e (e.g., Preference Card details) navigate kore based on `resourceType` and `resourceId`.

---

## Edge Cases

- **Real-time Update**: App open thaka obosthay socket-er maddhome naya notification asle list-e auto add hoy.
- **Empty List**: Kono notification na thakle empty state illustration dekhano hoy.
- **Expired Notifications**: Kono notification-er `expiresAt` periye gele oita list-e dekhabe na.

---

<!-- ══════════════════════════════════════ -->
<!--           NOTIFICATION LIST              -->
<!-- ══════════════════════════════════════ -->

### 5.1 List My Notifications

```
GET /notifications
Auth: Bearer {{accessToken}}
```

> User-er shob notification (read/unread) fetch korar jonno. Latest gulo age thake.

**Implementation:**
- **Route**: [notification.routes.ts](file:///src/app/modules/notification/notification.routes.ts)
- **Controller**: [notification.controller.ts](file:///src/app/modules/notification/notification.controller.ts) — `listMyNotifications`
- **Service**: [notification.service.ts](file:///src/app/modules/notification/notification.service.ts) — `listForUser`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Notifications fetched",
    "data": [
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0e",
        "title": "New Card Added",
        "subtitle": "Dr. Smith — Knee Arthroscopy",
        "type": "PREFERENCE_CARD_CREATED",
        "read": false,
        "resourceType": "PreferenceCard",
        "resourceId": "664a1b2c3d4e5f6a7b8c9d0f",
        "icon": "card",
        "createdAt": "2026-04-07T10:30:00.000Z"
      }
    ]
  }
  ```

---

### 5.2 Mark Notification as Read

```
PATCH /notifications/:id/read
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Specific ekta notification read mark korar jonno. `read` body field-e `true` ba `false` pathano jay.

**Request Body:**
```json
{
  "read": true
}
```

**Implementation:**
- **Route**: [notification.routes.ts](file:///src/app/modules/notification/notification.routes.ts)
- **Controller**: [notification.controller.ts](file:///src/app/modules/notification/notification.controller.ts) — `markRead`
- **Service**: [notification.service.ts](file:///src/app/modules/notification/notification.service.ts) — `markRead`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Notification marked read",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "read": true
    }
  }
  ```

---

### 5.3 Mark All Notifications as Read

```
PATCH /notifications/read-all
Auth: Bearer {{accessToken}}
```

> User-er shob unread notification ekshathe read mark korar jonno.

**Implementation:**
- **Route**: [notification.routes.ts](file:///src/app/modules/notification/notification.routes.ts)
- **Controller**: [notification.controller.ts](file:///src/app/modules/notification/notification.controller.ts) — `markAllRead`
- **Service**: [notification.service.ts](file:///src/app/modules/notification/notification.service.ts) — `markAllRead`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "All notifications marked read",
    "data": {
      "updated": true
    }
  }
  ```

---

### 5.4 Delete Notification

```
DELETE /notifications/:id
Auth: Bearer {{accessToken}}
```

> Kono notification list theke permanently remove korar jonno.

**Implementation:**
- **Route**: [notification.routes.ts](file:///src/app/modules/notification/notification.routes.ts)
- **Controller**: [notification.controller.ts](file:///src/app/modules/notification/notification.controller.ts) — `deleteNotification`
- **Service**: [notification.service.ts](file:///src/app/modules/notification/notification.service.ts) — `deleteById`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Notification deleted",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e"
    }
  }
  ```

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 5.1 | `/notifications` | `GET` | Bearer | ✅ Done | List all notifications |
| 5.2 | `/notifications/:id/read` | `PATCH` | Bearer | ✅ Done | Mark single notification as read |
| 5.3 | `/notifications/read-all` | `PATCH` | Bearer | ✅ Done | Mark all as read |
| 5.4 | `/notifications/:id` | `DELETE` | Bearer | ✅ Done | Delete notification |
