# Notifications Flow

> **Section**: System-Wide Notifications
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Standard Envelope**: See [README.md](../README.md#standard-response-envelope)

## Overview

User-der notification 3-ti channel-e jete pare: Push (FCM), Socket (real-time), and Database (persistent list). Trigger types ebong content templates documented in [`modules/notification.md` Overview](../modules/notification.md#overview).

---

## UX Flow

### Bell Icon & Unread Indicator
1. Home screen header e ekta **bell icon** thake (related: [Home](./02-home.md)).
2. App e foreground asar shathe shathe ba pull-to-refresh e [GET /notifications](../modules/notification.md#51-get-my-notifications) call hoy.
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
2. Page load e [GET /notifications?page=1&limit=20](../modules/notification.md#51-get-my-notifications) call hoy.
3. Skeleton loader dekhay (5–6 row placeholder) loading-er somoy.
4. Response ashle list render hoy:
   - Each row: icon (`type` based) + `title` + `subtitle` + relative time (e.g., "2h ago").
   - **Unread rows** (`read: false`) highlighted background ba left bar marker shoho dekhay.
   - **Read rows** muted/dimmed style.
5. Top-right corner e **"Mark all as read"** button thake (jodi kono unread thake).
6. Empty state: "You're all caught up" placeholder + bell illustration.

### Tap on Notification → Deep Link
1. User kono notification row e tap kore.
2. Frontend tap-handler `notification.type` ebong related metadata theke target screen decide kore:
   - **`REMINDER`** (event reminder) → Calendar event detail e navigate (`/events/:eventId`).
   - **Preference Card** type → Card details screen e navigate (`/preference-cards/:cardId`).
   - **Event scheduled** confirmation → Calendar screen-er oi date-e navigate.
3. Tap-er shathe shathe (optimistic) → [PATCH /notifications/:notificationId/read](../modules/notification.md#52-mark-as-read) call hoy background e.
4. Local state update hoy: oi notification `read: true` mark hoy ebong red dot recompute hoy.

### Mark All as Read
1. User top-right "Mark all as read" button e tap kore.
2. → [PATCH /notifications/read-all](../modules/notification.md#53-mark-all-as-read).
3. Success hole: shob notifications `read: true` hoy ebong red dot disappear kore.
4. Button itself disable / hide hoye jay (jotokkhon na new unread ashe).

### Swipe-to-Delete
1. User kono notification row left/right swipe kore.
2. Red "Delete" action button reveal hoy.
3. Tap korle → [DELETE /notifications/:notificationId](../modules/notification.md#54-delete-notification).
4. Optimistic UI: row immediately list theke remove hoy.
5. Failure hole: row restore hoy + error toast dekhay.
6. Long-press menu o ekta alternative path hote pare ("Delete" / "Mark as read" options).

### Pagination (Infinite Scroll)
1. List bottom-er kache pouchle next page request trigger hoy: `GET /notifications?page=2&limit=20`.
2. Bottom e small spinner loading-er somoy.
3. `meta.hasNext: false` hole "You've reached the end" footer dekhay.

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
