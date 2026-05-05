# 01. Get My Notifications

```http
GET /notifications
Auth: Bearer {{accessToken}}
```

**Business Logic (`getNotificationsForUserFromDB`):**
- **Single-Query Aggregation**: Efficiency-er jonno `$facet` use kore notifications list, total count, ebong **unreadCount** ekshathe fetch kora hoy.
- **Index Optimization**: `{ userId: 1, read: 1, createdAt: -1 }` compound index use kora hoy query performance fast korar jonno.
- **Visibility**: Shudhu `isDeleted: false` records return kora hoy (Soft Delete implementation).
- **Unread Count**: `meta.unreadCount` is computed as `count({ userId, read: false, isDeleted: false })` — the user's total unread notifications across all pages, not just this page. The mobile bell-icon red dot is rendered from this single field (`meta.unreadCount > 0`).

## Responses

### Scenario: Success (200)
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
