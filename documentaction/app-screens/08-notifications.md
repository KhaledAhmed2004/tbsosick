# Screen 8: Notifications (Mobile)

> **Section**: App Screens — UX Flow + API Reference
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) (bell icon entry point) · [Calendar](./06-calendar.md) (event reminder deep link) · [Preference Card Details](./03-preference-card-details.md) (card-related notification deep link).
> **Base URL**: `{{baseUrl}}/api/v1/notifications`
> **API conventions**: see [_shared/api-conventions.md](../_shared/api-conventions.md) — response envelope, error shape, status codes, headers.

---

## Notifications-Specific Constants

| Item | Value |
|---|---|
| Pagination | Cursor-based, anchored on `(createdAt, _id)` |
| Page size | 20 items per fetch |
| Sort order | Strict newest-first by `createdAt` |
| Real-time channel | Socket.IO room `user::<userId>` (legacy alias `get-notification::<userId>` also supported) |
| Server-as-truth | Real-time events are triggers — full state always re-fetched on app foreground |
| Deduplication | By `_id` (in-memory + on insertion) |
| Delete semantics | **Soft-delete** (`deletedAt` set; not removed from DB) |
| Auth | All endpoints require `Authorization: Bearer {{accessToken}}` |

---

## 1. Bell Icon & Unread Indicator

**Trigger** — app foreground / pull-to-refresh on Notifications screen → [`GET /notifications`](#get-api-v1-notifications). The unread count comes back in `meta.unreadCount` of the same response (no separate endpoint).

**Use case**
- Server-computed `unreadCount` is total across the user's full notification set, not just the current page.
- Single round-trip: list page + count in one call. The client doesn't need a second request just for the badge.

---

## 2. Real-time Updates

**Trigger** — after login the app joins Socket.IO room `user::<userId>` and listens for new-notification events.

**Use case**
- Real-time events are **triggers**, not authoritative state. After receiving an event the client refetches `GET /notifications` to reconcile.
- Duplicate events are deduped by `_id`.
- Background = push (FCM) for event reminders only; foreground = Socket.IO for everything.

**Behavior note** — the event name is **not hardcoded** in the codebase. `NotificationBuilder` (in `src/app/builder/NotificationBuilder/`) accepts a `content.event` parameter and emits dynamically. Recommend standardizing on `notification:new` for the spec; backend must wire that name into the builder consistently.

**Status — Socket.IO infrastructure** — `Implemented`

**Implementation**
- Server bootstrap: [`src/server.ts`](src/server.ts)
- Connection handler: [`socketHelper`](src/helpers/socketHelper.ts)
- Emit channel: [`sendSocket`](src/app/builder/NotificationBuilder/channels/socket.channel.ts) (emits to `user::<userId>` via global `io`)
- Reads: — (no DB read on emit)
- Writes: — (DB write happens elsewhere; this channel only emits)

### Real-time Reference

#### Socket.IO event — `notification:new` *(recommended event name)*

**Auth handshake** — Socket.IO connect with `auth: { token: accessToken }`.

**Event payload**

```json
{
  "_id": "990z...",
  "type": "EVENT_REMINDER",
  "title": "Surgery in 30 minutes",
  "subtitle": "Lap Chole - OR 3",
  "iconUrl": "https://cdn.../bell.png",
  "data": { "eventId": "888a..." },
  "isRead": false,
  "createdAt": "2026-05-03T08:30:00.000Z"
}
```

> Notification types observed: `EVENT_REMINDER` · `EVENT_CONFIRMATION` · `PREFERENCE_CARD` · `SYSTEM`. Confirm the full enum with the team.

---

## 3. Notifications List

**Trigger** — user opens the Notifications screen → [`GET /notifications`](#get-api-v1-notifications). Infinite scroll near the bottom → same endpoint with `?cursor=`.

**Use case**
- Cursor-based pagination anchored on `(createdAt, _id)` — server decodes the opaque cursor and runs `(createdAt, _id) < cursor` for index scan.
- Strict newest-first sort by `createdAt`.
- Soft-deleted rows (`deletedAt: { $ne: null }`) are filtered out at the service level.
- `meta.unreadCount` always reflects the user's **total** unread, not just the page.

**Behavior note** — cursor is opaque (server encodes / decodes). Client passes whatever it received in `meta.nextCursor`. When `meta.hasMore === false`, stop scrolling.

**Status** — `Implemented`

**Implementation**
- Route: [`notification.route.ts`](src/app/modules/notification/notification.route.ts)
- Controller: [`NotificationController.listMyNotifications`](src/app/modules/notification/notification.controller.ts)
- Service: [`NotificationService.listForUser`](src/app/modules/notification/notification.service.ts)
- Validation: [`listNotificationsSchema`](src/app/modules/notification/notification.validation.ts)
- Reads: `Notification` (via `$aggregate`)
- Writes: —

### API Reference

#### `GET /api/v1/notifications`

Lists the user's notifications. Cursor-based pagination anchored on `(createdAt, _id)`.

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `cursor` | string | Opaque cursor returned as `meta.nextCursor`. Omit on first page. |
| `limit` | number | Default `20`, max `50` |
| `unread` | boolean | When `true`, return only unread notifications |

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "990z...",
      "type": "EVENT_REMINDER",
      "title": "Surgery in 30 minutes",
      "subtitle": "Lap Chole - OR 3",
      "iconUrl": "https://cdn.../bell.png",
      "data": { "eventId": "888a..." },
      "isRead": false,
      "createdAt": "2026-05-03T08:30:00.000Z"
    }
  ],
  "meta": {
    "limit": 20,
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA1LTAzVDA4OjMwOjAwLjAwMFoiLCJfaWQiOiI5OTB6In0",
    "hasMore": true,
    "unreadCount": 7
  }
}
```

> When `meta.hasMore === false`, stop scrolling.

---

## 4. Tap Notification (Deep Link)

**Trigger** — user taps a row → optimistic local mark-read → background [`PATCH /notifications/:notificationId/read`](#patch-api-v1-notifications-notificationid-read). Navigation is decided by `type` and `data` payload (handled in mobile router).

**Use case**
- Mark-read is idempotent — repeating the call returns `200` without re-incrementing anything.
- Server validates ownership: `notification.recipientId === currentUser._id`. Mismatch → `403`.

**Behavior note** — optimistic update on the client; revert on `4xx/5xx`.

**Status** — `Implemented`

**Implementation**
- Route: [`notification.route.ts`](src/app/modules/notification/notification.route.ts)
- Controller: [`NotificationController.markRead`](src/app/modules/notification/notification.controller.ts)
- Service: [`NotificationService.markRead`](src/app/modules/notification/notification.service.ts)
- Validation: [`markReadSchema`](src/app/modules/notification/notification.validation.ts)
- Reads: `Notification`
- Writes: `Notification` (`isRead = true`, `readAt = now`)

### API Reference

#### `PATCH /api/v1/notifications/:notificationId/read`

Marks a single notification as read. Idempotent.

**Path params** — `notificationId` (Mongo ObjectId)

**Request body** — none.

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification marked as read",
  "data": { "_id": "990z...", "isRead": true }
}
```

**Errors**

| Code | `message` |
|---|---|
| 403 | `Not allowed` |
| 404 | `Notification not found` |

---

## 5. Mark All as Read

**Trigger** — user taps **"Mark all as read"** → [`PATCH /notifications/read-all`](#patch-api-v1-notifications-read-all).

**Use case**
- Server flips `isRead = true` for every unread notification owned by the caller in a single update.
- Returns the count of rows updated so the client can verify.

**Behavior note** — optimistic flip on the client; revert on error.

**Status** — `Implemented`

**Implementation**
- Route: [`notification.route.ts`](src/app/modules/notification/notification.route.ts)
- Controller: [`NotificationController.markAllRead`](src/app/modules/notification/notification.controller.ts)
- Service: [`NotificationService.markAllRead`](src/app/modules/notification/notification.service.ts)
- Validation: —
- Reads: — (uses `$set` directly)
- Writes: `Notification` (bulk update)

### API Reference

#### `PATCH /api/v1/notifications/read-all`

Marks every unread notification for the logged-in user as read.

**Request body** — none.

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "All notifications marked as read",
  "data": { "updated": 7 }
}
```

---

## 6. Delete (Swipe / Long Press)

**Trigger** — user swipes a row → [`DELETE /notifications/:notificationId`](#delete-api-v1-notifications-notificationid).

**Use case**
- Delete is **soft** — server sets `deletedAt = now`; the row is filtered out of subsequent list queries.
- Idempotent — deleting an already-deleted notification returns `200` without `404`.
- Soft-delete leaves the row available for analytics / undo flows that don't yet exist on the client.

**Business rules**
- Soft-delete retention — `// TBD`: how long should soft-deleted rows be kept before hard-purge? Recommendation: 30 days, then a scheduled job hard-deletes.
- Undo window on the client — `// TBD`: show a toast with "Undo" for ~5 s after swipe? Requires no API change (call the same DELETE again with `undo: true`, or skip the original call until the window expires).

**Behavior note** — optimistic UI removal; restore the row on `4xx/5xx`.

**Status** — `Implemented`

**Implementation**
- Route: [`notification.route.ts`](src/app/modules/notification/notification.route.ts)
- Controller: [`NotificationController.deleteNotification`](src/app/modules/notification/notification.controller.ts)
- Service: [`NotificationService.deleteById`](src/app/modules/notification/notification.service.ts)
- Validation: [`paramIdSchema`](src/app/modules/notification/notification.validation.ts)
- Reads: `Notification`
- Writes: `Notification` (`deletedAt = now`)

### API Reference

#### `DELETE /api/v1/notifications/:notificationId`

Soft-deletes a notification (sets `deletedAt`).

**Path params** — `notificationId` (Mongo ObjectId)

**Success — `200 OK`**

```json
{ "success": true, "statusCode": 200, "message": "Notification deleted", "data": null }
```

**Errors**

| Code | `message` |
|---|---|
| 403 | `Not allowed` |
| 404 | `Notification not found` |

---

## Endpoint Index

| # | Method | Path | Status | Auth | Purpose |
|---|---|---|---|---|---|
| 1 | GET | `/api/v1/notifications` | `Implemented` | Bearer | List notifications + unread count in `meta` |
| 2 | PATCH | `/api/v1/notifications/:notificationId/read` | `Implemented` | Bearer (owner) | Mark single as read |
| 3 | PATCH | `/api/v1/notifications/read-all` | `Implemented` | Bearer | Mark every unread as read |
| 4 | DELETE | `/api/v1/notifications/:notificationId` | `Implemented` | Bearer (owner) | Soft-delete a notification |

### Real-time

| Channel | Event | Status | Payload |
|---|---|---|---|
| Socket.IO room `user::<userId>` | `notification:new` *(recommended)* | `Partial` — infrastructure exists, event name is dynamic via `NotificationBuilder` | Full notification document (see §2) |
