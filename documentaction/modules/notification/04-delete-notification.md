# 04. Delete Notification

```http
DELETE /notifications/:notificationId
Auth: Bearer {{accessToken}}
```

> Swipe-to-delete ba long-press menu theke notification delete korar jonno. Optimistic UI: row immediately list theke remove hoy. Failure hole row restore hoy + error toast dekhay.

**Business Logic (`deleteNotificationFromDB`):**
- **Soft Delete**: Data permanent-ly delete na kore `isDeleted: true` flag set kora hoy.
- **Authorization**: Owner validation mandatory.
- **Idempotency**: Jodi notification aggei delete kora hoye thake, server graceful success return korbe.
