# Screen 8: Notifications (Mobile)

> **Section**: System-Wide Notifications
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Common UI Rules**: see [system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules)
> **Doc version**: `v2` — last reviewed `2026-04-30`

## Overview

Users can receive notifications through three channels: Push (FCM), Socket (real-time), and Database (persistent storage). Trigger types and content templates are documented in the [`modules/notification.md` Overview](../modules/notification.md#overview).

---

## UX Flow

### Bell Icon & Unread Indicator

1. The home screen header includes a **bell icon** (related: [Home](./02-home.md)).
2. When the app comes to the foreground or on pull-to-refresh, it calls: [GET /notifications](../modules/notification.md#51-get-my-notifications).
3. Frontend reads `meta.unreadCount` from the response. If `meta.unreadCount > 0`, render the red dot; otherwise hide it.
4. Unread count is computed server-side across all unread notifications for the user, not just the current page.

### Real-time Updates (Socket)

1. After login, the app establishes a **Socket.IO** connection.
2. When the server creates a new notification, it emits a socket event: `notification:new`.
3. The client listens for the event and updates the in-memory notification list, as well as toggles the red dot indicator.
4. When the app is in the background, **FCM push notifications** are shown (only for event reminders).

### Socket + DB Sync (Conflict Handling)

1. **Server as Source of Truth:** Even if the client updates its local state based on socket events, the final state is always revalidated from the backend.
2. The socket acts only as a **trigger**. When the client receives a socket event, it may re-fetch or revalidate the notification list in the background to keep the state in sync.
3. When switching from background to foreground, the app fetches the latest notifications to ensure the state is fully synchronized.

### Idempotency & Safety

1. **Idempotent Updates:** The request `PATCH /notifications/:id/read` can be called multiple times without causing issues; if the notification is already marked as read, the server still maintains a consistent state and does not throw an error.
2. **Duplicate Protection:** When receiving socket events, the client checks for duplicate `notificationId` values to prevent duplicate entries in the in-memory list.
3. The delete action is also idempotent; if the notification is already deleted, the server responds gracefully with `200` or `204` without errors.

### Open Notification List

1. When the user taps the bell icon, they are navigated to the **Notifications** screen.
2. On page load, the API is called: [GET /notifications?page=1&limit=20](../modules/notification.md#51-get-my-notifications).
3. While loading, a **skeleton loader** is shown with 5–6 placeholder rows.
4. Once the response is received, the list is rendered:

   * Each row includes an icon (based on `type`), `title`, `subtitle`, and a relative timestamp (e.g., "2h ago").
   * **Unread notifications** (`read: false`) are visually highlighted with a different background or a left-side indicator bar.
   * **Read notifications** appear in a muted or dimmed style.
5. A **"Mark all as read"** button is shown in the top-right corner if there are any unread notifications.
6. Empty state: displays **"You're all caught up"** along with a bell illustration.

### Tap on Notification → Deep Link

1. When the user taps on a notification row.
2. The frontend determines the target screen based on `notification.type` and related metadata:

   * **`REMINDER`** (event reminder) → navigates to event detail screen (`/events/:eventId`).
   * **Preference Card** type → navigates to card details screen (`/preference-cards/:cardId`).
   * **Event scheduled** confirmation → navigates to the Calendar screen on the specific date.
3. On tap (optimistically), it triggers a background call: [PATCH /notifications/:notificationId/read](../modules/notification.md#52-mark-as-read).
4. The local state is updated immediately by marking the notification as `read: true`, and the red dot indicator is recalculated accordingly.

### Mark All as Read

1. The user taps the **"Mark all as read"** button in the top-right.
2. The client calls [PATCH /notifications/read-all](../modules/notification.md#53-mark-all-as-read).
3. On success, all notifications in local state are set to `read: true` and the red dot disappears.
4. The button is disabled / hidden until a new unread notification arrives.

### Swipe-to-Delete

1. The user swipes a notification row left or right.
2. A red **"Delete"** action button is revealed.
3. On tap, it calls: [DELETE /notifications/:notificationId](../modules/notification.md#54-delete-notification).
4. **Optimistic UI:** the row is immediately removed from the list.
5. If the request fails, the row is restored and an error toast is shown.
6. A long-press menu can be provided as an alternative option, with actions like **"Delete"** and **"Mark as read"**.


### Pagination (Infinite Scroll)

1. When the user reaches near the bottom of the list, the next page request is triggered: `GET /notifications?page=2&limit=20`.
2. A small spinner is shown at the bottom while loading.
3. When `meta.hasNext: false`, show a footer message: **"You've reached the end"**.


---

## Edge Cases

- **No Notifications**: Empty state placeholder dekhabe ("You're all caught up").
- **Stale Red Dot**: Background e thakar somoy state stale hote pare. Foreground asar shathe shathe list re-fetch kore reconcile kora hoy.
- **Optimistic Failure**: Mark-read ba delete API fail hole local state revert hoy + error toast.
- **Deep Link Target Deleted**: Notification reference kora resource (event/card) delete hoye gele 404 dekhabe — graceful fallback: list e back navigate + toast "This item is no longer available."
- **Push Permission Denied**: User push permission off rakhle FCM channel skip hoy — Socket + DB notifications kaj kore.
- **Rate Limit on Mark-Read**: Bulk mark-read ba dhara dhara delete e backend rate-limit trigger hoye 429 dile UI throttle kore.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/notifications` | [Module 5.1](../modules/notification.md#51-get-my-notifications) |
| 2 | PATCH | `/notifications/:notificationId/read` | [Module 5.2](../modules/notification.md#52-mark-as-read) |
| 3 | PATCH | `/notifications/read-all` | [Module 5.3](../modules/notification.md#53-mark-all-as-read) |
| 4 | DELETE | `/notifications/:notificationId` | [Module 5.4](../modules/notification.md#54-delete-notification) |
