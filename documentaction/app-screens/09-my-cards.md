# Screen 9: My Cards (Mobile)

> **Section**: App Screens — UX Flow + API Reference
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) (entry — tap **My Cards** counter tile) · [Preference Card Details](./03-preference-card-details.md) (open / delete) · [Create Preference Card](./04-create-preference-card.md) (edit)
> **Base URL**: `{{baseUrl}}/api/v1`
> **API conventions**: see [_shared/api-conventions.md](../_shared/api-conventions.md) — response envelope, error shape, status codes, headers, pagination.

---

## My-Cards-Specific Constants

| Item | Value |
|---|---|
| Scope | Cards owned by the logged-in user — **all visibilities** (`PUBLIC` + `PRIVATE`) and **all states** (draft + published) |
| Default sort | `-createdAt` (newest first) |
| Default page size | 20 |
| Auth | All endpoints require `Authorization: Bearer {{accessToken}}` |

---

## 1. Open My Cards

**Trigger** — user taps the **My Cards** counter tile on [Home](./02-home.md) → [`GET /users/me/preference-cards`](#get-api-v1-users-me-preference-cards).

**Use case**
- Server enforces `ownerId === currentUser._id`. Non-owner attempts to widen scope via query params are ignored.
- Returns owner's cards regardless of `visibility` (`PUBLIC` and `PRIVATE`) and regardless of `published` (drafts and published).
- Each row carries enough metadata for the list view (title, status, visibility, thumbnail, `updatedAt`) — no second fetch needed for the list.

**Business rules**
- Server-side default sort when no `?sort=` is passed — `-createdAt` (newest first).
- Per-row response fields include `published: boolean` + `visibility: "PUBLIC" | "PRIVATE"` for status indicators.

### API Reference

#### `GET /api/v1/users/me/preference-cards`

Lists preference cards owned by the logged-in user — all visibilities, all states.

**Status** — `Implemented`

**Implementation**
- Route: [`user.route.ts`](src/app/modules/user/user.route.ts) — `GET /me/preference-cards`
- Controller: [`UserController.getMyPreferenceCards`](src/app/modules/user/user.controller.ts)
- Service: [`PreferenceCardService.listPrivatePreferenceCardsForUserFromDB`](src/app/modules/preference-card/preference-card.service.ts) (reused from preference-card module)
- Validation: —
- Reads: `PreferenceCard.find({ createdBy: currentUser._id })`
- Writes: —

**Query parameters** — same as `GET /preference-cards` (pagination, search, sort).

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "My preference cards retrieved successfully",
  "data": [
    {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "title": "Laparoscopic Cholecystectomy",
      "visibility": "PUBLIC",
      "published": true,
      "isFavorited": false,
      "thumbnail": "https://cdn.example.com/uploads/cards/thumb_123.jpg",
      "createdAt": "2026-04-29T10:00:00.000Z",
      "updatedAt": "2026-05-01T12:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 20,
    "page": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Errors**

| Code | Message |
|---|---|
| 401 | Unauthorized (Invalid or missing token) |
| 404 | Card not found |
| 409 | Favorites limit reached (cap = 100 per user) |

---

## 2. Card Row Actions

**Trigger** — each card row supports:
- **Open** → navigate to [Preference Card Details](./03-preference-card-details.md) → [`GET /preference-cards/:cardId`](./03-preference-card-details.md#get-api-v1-preference-cards-cardid).
- **Edit** → navigate to [Create / Edit Preference Card](./04-create-preference-card.md) in edit mode → `PATCH /preference-cards/:cardId` (full spec in [04](./04-create-preference-card.md)).
- **Delete** → confirmation, then [`DELETE /preference-cards/:cardId`](./03-preference-card-details.md#delete-api-v1-preference-cards-cardid) (full spec in [03](./03-preference-card-details.md)). On success, refresh this list and the Home counters.
- **Favorite / Unfavorite** → [`PUT`](./02-home.md#put-api-v1-preference-cards-cardid-favorite) / [`DELETE /preference-cards/:cardId/favorite`](./02-home.md#delete-api-v1-preference-cards-cardid-favorite) (full spec in [02-home.md](./02-home.md)).

**Use case**
- All actions are **owner-only** by definition (this list only contains the caller's own cards).
- Delete and favorite operations affect both this list and `GET /preference-cards/stats` — server must keep those endpoints in sync without pushing events to clients.

**Behavior note** — server does **not** emit delete / favorite events; clients reconcile by re-fetching the list and `/stats` after a mutation.

---

## Endpoint Index

| # | Method | Path | Status | Auth | Purpose |
|---|---|---|---|---|---|
| 1 | GET | `/api/v1/users/me/preference-cards` | `Implemented` | Bearer | List owner's cards (all visibilities + states) |

> Endpoints used on this screen but documented in their owning screens (not duplicated):
> - `GET /api/v1/preference-cards/:cardId` — see [03-preference-card-details.md](./03-preference-card-details.md#get-api-v1-preference-cards-cardid)
> - `DELETE /api/v1/preference-cards/:cardId` — see [03-preference-card-details.md](./03-preference-card-details.md#delete-api-v1-preference-cards-cardid)
> - `PATCH /api/v1/preference-cards/:cardId` — see [04-create-preference-card.md](./04-create-preference-card.md#patch-api-v1-preference-cards-cardid)
> - `PUT` / `DELETE /api/v1/preference-cards/:cardId/favorite` — see [02-home.md](./02-home.md#put-api-v1-preference-cards-cardid-favorite)
