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
| Page size | Default 20, max 50 |
| Sort order | Strict newest-first by `(createdAt, _id)` desc |
| Real-time channel | Socket.IO room `user::<userId>` (legacy alias `get-notification::<userId>` also emitted) |
| Server-as-truth | Real-time events are triggers — full state always re-fetched on app foreground |
| Deduplication | By `_id` (in-memory + on insertion) |
| Ownership field | `userId` (Mongo ObjectId, ref `User`) |
| Read state | `isRead` (boolean) + `readAt` (timestamp set when flipped to true; cleared when flipped back to false) |
| Delete semantics | **Soft-delete** (`deletedAt` set; row stays in DB) |
| Auto-expiry | TTL index on `expiresAt` (Mongo deletes expired rows automatically; default 30 days from creation in `notificationsHelper`) |
| Auth | All endpoints require `Authorization: Bearer {{accessToken}}`, role `SUPER_ADMIN` or `USER` |

---

## 1. Bell Icon & Unread Indicator

**Trigger** — app foreground / pull-to-refresh on Notifications screen → [`GET /notifications`](#get-api-v1-notifications). The unread count comes back in `meta.unreadCount` of the same response (no separate endpoint).

**Use case**
- Server-computed `unreadCount` is total across the user's full undeleted notification set, not just the current page or filtered slice.
- Single round-trip: list page + count in one call. The client doesn't need a second request just for the badge.

**Behavior note** — `unreadCount` is computed against `{ userId, deletedAt: null, isRead: false }` regardless of whether the request used `?unread=true`. The badge stays accurate when the user is filtering.

---

## 2. Real-time Updates

**Trigger** — after login the app joins Socket.IO room `user::<userId>` and listens for new-notification events.

**Use case**
- Real-time events are **triggers**, not authoritative state. After receiving an event the client refetches `GET /notifications` to reconcile.
- Duplicate events are deduped by `_id` (the legacy alias and the room emit are both fired for the same notification — clients must dedupe).
- Background = push (FCM) for event reminders only; foreground = Socket.IO for everything.

**Behavior note** — emitter sends two events for every notification:
1. To room `user::<userId>` with event name `notification:new` (preferred channel for new clients).
2. Globally on event `get-notification::<userId>` (legacy alias for older mobile builds).

Both payloads carry the same notification document (see §[Real-time Reference](#real-time-reference)). The mobile client should subscribe to `notification:new` only on the `user::<userId>` room and ignore the legacy event once migrated.

**Status — Socket.IO infrastructure** — `Implemented`

**Implementation**
- Server bootstrap: [src/server.ts](src/server.ts)
- Connection handler: [socketHelper](src/helpers/socketHelper.ts)
- Emit (helper path): [notificationsHelper.ts](src/app/modules/notification/notificationsHelper.ts) — emits `notification:new` to `user::<userId>` and the legacy alias.
- Emit (builder path): [sendSocket](src/app/builder/NotificationBuilder/channels/socket.channel.ts) — emits via `NotificationBuilder` with a dynamic event name (defaults to whatever the caller passes in `content.event`).

### Real-time Reference

#### Socket.IO event — `notification:new`

**Auth handshake** — Socket.IO connect with `auth: { token: accessToken }`.

**Event payload**

```json
{
  "_id": "990z...",
  "type": "EVENT_SCHEDULED",
  "title": "Surgery in 30 minutes",
  "subtitle": "Lap Chole - OR 3",
  "icon": "bell",
  "link": { "label": "View Event", "url": "/events/888a..." },
  "resourceType": "Event",
  "resourceId": "888a...",
  "isRead": false,
  "createdAt": "2026-05-03T08:30:00.000Z"
}
```

> Notification types (`NOTIFICATION_TYPES` in [notification.interface.ts](src/app/modules/notification/notification.interface.ts)): `PREFERENCE_CARD_CREATED` · `EVENT_SCHEDULED` · `GENERAL` · `ADMIN` · `SYSTEM` · `MESSAGE` · `REMINDER`.

**Business rules**
- Recommended event name unification — `// TBD`: should the `NotificationBuilder` socket channel be locked to `notification:new` so every emission path uses the same event name? Today the helper path uses `notification:new` but the builder path takes whatever `content.event` the caller passes.

---

## 3. Notifications List

**Trigger** — user opens the Notifications screen → [`GET /notifications`](#get-api-v1-notifications). Infinite scroll near the bottom → same endpoint with `?cursor=`.

**Use case**
- Cursor-based pagination anchored on `(createdAt, _id)` — server decodes the opaque cursor and runs `(createdAt < cursor.createdAt) OR (createdAt = cursor.createdAt AND _id < cursor._id)` for a stable, index-friendly scan that tolerates ties on `createdAt`.
- Strict newest-first sort by `(createdAt, _id)` descending.
- Soft-deleted rows (`deletedAt != null`) are filtered out at the service level.
- `meta.unreadCount` always reflects the user's **total** unread (never the page or filter).
- Optional `?unread=true` returns only unread notifications. The badge count is unaffected by this filter.

**Behavior note** — cursor is opaque (server encodes / decodes as base64url-encoded JSON of `{createdAt, _id}`). Client passes whatever it received in `meta.nextCursor`. When `meta.hasMore === false`, `meta.nextCursor` is `null` and the client should stop scrolling.

**Business rules**
- Cursor staleness — `// TBD`: when the row a cursor points to is soft-deleted between requests, the next page silently skips it (the comparison still works on `createdAt/_id`). No error, no resync. Confirm this is acceptable UX.

**Status** — `Implemented`

**Implementation**
- Route: [notification.routes.ts](src/app/modules/notification/notification.routes.ts)
- Controller: [NotificationController.listMyNotifications](src/app/modules/notification/notification.controller.ts)
- Service: [NotificationService.listForUser](src/app/modules/notification/notification.service.ts)
- Validation: [listNotificationsSchema](src/app/modules/notification/notification.validation.ts)
- Reads: `Notification` (`find` + `countDocuments` for unread)
- Writes: —

### API Reference

#### `GET /api/v1/notifications`

Lists the user's notifications. Cursor-based pagination anchored on `(createdAt, _id)`.

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `cursor` | string | Opaque cursor returned as `meta.nextCursor`. Omit on first page. Invalid cursor → `400 Invalid cursor`. |
| `limit` | number (string) | Default `20`, max `50`. Values outside `[1, 50]` are clamped. |
| `unread` | `"true"` \| `"false"` | When `"true"`, return only unread notifications. Does not affect `unreadCount`. |

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "meta": {
    "limit": 20,
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA1LTAzVDA4OjMwOjAwLjAwMFoiLCJfaWQiOiI5OTB6In0",
    "hasMore": true,
    "unreadCount": 7
  },
  "data": [
    {
      "id": "990z...",
      "userId": "111u...",
      "type": "EVENT_SCHEDULED",
      "title": "Surgery in 30 minutes",
      "subtitle": "Lap Chole - OR 3",
      "icon": "bell",
      "link": { "label": "View Event", "url": "/events/888a..." },
      "resourceType": "Event",
      "resourceId": "888a...",
      "isRead": false,
      "readAt": null,
      "deletedAt": null,
      "createdAt": "2026-05-03T08:30:00.000Z",
      "updatedAt": "2026-05-03T08:30:00.000Z"
    }
  ]
}
```

> When `meta.hasMore === false`, `meta.nextCursor` is `null` — stop scrolling.
> `_id` is aliased to `id` by the response formatter ([sendResponse.ts](src/shared/sendResponse.ts)).

**Errors**

| Code | `message` |
|---|---|
| 400 | `Invalid cursor` |
| 401 | (standard auth envelope) |

---

## 4. Tap Notification (Deep Link)

**Trigger** — user taps a row → optimistic local mark-read → background [`PATCH /notifications/:notificationId/read`](#patch-api-v1-notifications-notificationid-read). Navigation is decided by `type` and `link`/`resourceType`+`resourceId` (handled in mobile router).

**Use case**
- Endpoint can also flip a notification back to **unread** by sending `{ "read": false }`. Default body / empty body is treated as `read = true`.
- Mark-read is idempotent — repeating the call returns `200` and writes a fresh `readAt`. Repeating mark-as-read on an already-read row does not re-increment any counter (the badge derives from a `countDocuments`).
- Server validates ownership: `notification.userId === currentUser.id`. Mismatch → `403 Not allowed`.
- Soft-deleted notifications return `404 Notification not found` (cannot be re-read).

**Behavior note** — optimistic update on the client; revert on `4xx/5xx`.

**Status** — `Implemented`

**Implementation**
- Route: [notification.routes.ts](src/app/modules/notification/notification.routes.ts)
- Controller: [NotificationController.markRead](src/app/modules/notification/notification.controller.ts)
- Service: [NotificationService.markRead](src/app/modules/notification/notification.service.ts)
- Validation: [markReadSchema](src/app/modules/notification/notification.validation.ts)
- Reads: `Notification` (`findById`)
- Writes: `Notification` (`isRead`, `readAt`)

### API Reference

#### `PATCH /api/v1/notifications/:notificationId/read`

Marks a single notification as read (or unread). Idempotent.

**Path params** — `notificationId` (Mongo ObjectId)

**Request body** — optional.

```json
{ "read": true }
```

| Field | Type | Default | Notes |
|---|---|---|---|
| `read` | boolean | `true` | When `false`, flips the row back to unread and clears `readAt`. |

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification marked as read",
  "data": { "id": "990z...", "isRead": true, "readAt": "2026-05-03T08:31:00.000Z" }
}
```

When `read=false`, `message` becomes `Notification marked as unread` and `readAt` is `null`.

**Errors**

| Code | `message` |
|---|---|
| 403 | `Not allowed` |
| 404 | `Notification not found` |

---

## 5. Mark All as Read

**Trigger** — user taps **"Mark all as read"** → [`PATCH /notifications/read-all`](#patch-api-v1-notifications-read-all).

**Use case**
- Server flips `isRead = true` and stamps `readAt = now` for every unread, undeleted notification owned by the caller in one bulk update.
- Returns the count of rows actually updated (`modifiedCount`) so the client can verify or display feedback.

**Behavior note** — optimistic flip on the client; revert on error. Re-calling when nothing is unread returns `{ updated: 0 }` — still `200`.

**Status** — `Implemented`

**Implementation**
- Route: [notification.routes.ts](src/app/modules/notification/notification.routes.ts)
- Controller: [NotificationController.markAllRead](src/app/modules/notification/notification.controller.ts)
- Service: [NotificationService.markAllRead](src/app/modules/notification/notification.service.ts)
- Validation: —
- Reads: — (single `updateMany`)
- Writes: `Notification` (bulk update)

### API Reference

#### `PATCH /api/v1/notifications/read-all`

Marks every unread, undeleted notification for the logged-in user as read.

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
- Delete is **soft** — server sets `deletedAt = now`; the row is filtered out of subsequent list queries and from `unreadCount`.
- Idempotent — deleting an already-soft-deleted notification returns `200` (no-op) instead of `404`. Hard-deleting (i.e. row missing entirely) still returns `404`.
- Soft-delete leaves the row available for analytics / undo flows that don't yet exist on the client.

**Business rules**
- Soft-delete retention — `// TBD`: how long should soft-deleted rows be kept before hard-purge? Current automatic purge is the existing `expiresAt` TTL (default 30 days from creation), which is independent of `deletedAt`. A scheduled job that hard-deletes rows where `deletedAt < now - 30d` is recommended.
- Undo window on the client — `// TBD`: show a toast with "Undo" for ~5 s after swipe? No API change needed; the client can simply delay the DELETE call until the window expires.

**Behavior note** — optimistic UI removal; restore the row on `4xx/5xx`.

**Status** — `Implemented`

**Implementation**
- Route: [notification.routes.ts](src/app/modules/notification/notification.routes.ts)
- Controller: [NotificationController.deleteNotification](src/app/modules/notification/notification.controller.ts)
- Service: [NotificationService.deleteById](src/app/modules/notification/notification.service.ts)
- Validation: [paramIdSchema](src/app/modules/notification/notification.validation.ts)
- Reads: `Notification` (`findById`)
- Writes: `Notification` (`deletedAt = now`, only if not already deleted)

### API Reference

#### `DELETE /api/v1/notifications/:notificationId`

Soft-deletes a notification (sets `deletedAt`). Idempotent.

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
| 1 | GET | `/api/v1/notifications` | `Implemented` | Bearer (`USER` / `SUPER_ADMIN`) | List notifications + unread count in `meta` |
| 2 | PATCH | `/api/v1/notifications/:notificationId/read` | `Implemented` | Bearer (owner) | Mark single as read / unread |
| 3 | PATCH | `/api/v1/notifications/read-all` | `Implemented` | Bearer (`USER` / `SUPER_ADMIN`) | Mark every unread as read; returns count |
| 4 | DELETE | `/api/v1/notifications/:notificationId` | `Implemented` | Bearer (owner) | Soft-delete a notification (idempotent) |

### Real-time

| Channel | Event | Status | Payload |
|---|---|---|---|
| Socket.IO room `user::<userId>` | `notification:new` | `Implemented` (helper path) / `Partial` (builder path uses `content.event`) | Full notification document (see §2) |
| Global emit `get-notification::<userId>` | (event name doubles as the address) | `Implemented` (legacy) | Same payload as above — kept for older mobile clients |
