# 02. Mark as Read

```http
PATCH /notifications/:notificationId/read
Auth: Bearer {{accessToken}}
```

> Single notification ke read mark kore. Tap-er shathe shathe (optimistic) call hoy background e.

## Implementation
- **Route**: [notification.route.ts](file:///src/app/modules/notification/notification.route.ts)
- **Controller**: [notification.controller.ts](file:///src/app/modules/notification/notification.controller.ts) — `markAsRead`
- **Service**: [notification.service.ts](file:///src/app/modules/notification/notification.service.ts) — `markNotificationReadInDB`

**Business Logic (`markNotificationReadInDB`):**
- **Ownership Check**: Shudhu notification-er real owner-i eiti read mark korte pare.
- **Validation**: Notification existence check kora hoy.
- **Idempotency**: Notification jodi aggei `read: true` thake, tobeo server success response return korbe without error.
