# Screen 2: Home (Mobile)

> **Section**: App Screens — UX Flow + API Reference
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Auth](./01-auth.md) · [Preference Card Details](./03-preference-card-details.md) · [Create Preference Card](./04-create-preference-card.md) · [Library](./05-library.md) (All Cards tile destination) · [My Cards](./09-my-cards.md) (My Cards tile destination) · [Notifications](./08-notifications.md)
> **Base URL**: `{{baseUrl}}/api/v1`
> **API conventions**: see [_shared/api-conventions.md](../_shared/api-conventions.md) — response envelope, error shape, status codes, headers, pagination.

---

## Home Layout

1. Search bar (top).
2. Two tapable counter cards — `All Cards (N)` and `My Cards (N)`.
3. Favorites section — carousel + per-card unfavorite + View All.

---

## Home-Specific Constants

| Item | Value |
|---|---|
| Auth | All endpoints require `Authorization: Bearer {{accessToken}}` |

---

## 1. Search Bar

**Trigger** — top search bar input → [`GET /preference-cards?searchTerm=...`](#get-api-v1-preference-cards) (public-card listing).

**Use case**
- Search scope is **public cards only** (`visibility: PUBLIC`). Same endpoint that powers [Library](./05-library.md).
- Server expects bursts (clients debounce locally before issuing) — handler should be cheap / cacheable.

### API Reference

#### `GET /api/v1/preference-cards`

Public preference card listing. Used by Home's search bar AND [Library's](./05-library.md) main feed.

**Status** — `Implemented`

**Implementation**
- Route: [`preference-card.route.ts`](src/app/modules/preference-card/preference-card.route.ts) — `GET /`
- Controller: [`PreferenceCardController.getCards`](src/app/modules/preference-card/preference-card.controller.ts)
- Service: [`PreferenceCardService.listPublicPreferenceCardsFromDB`](src/app/modules/preference-card/preference-card.service.ts)
- Validation: [`searchCardsSchema`](src/app/modules/preference-card/preference-card.validation.ts)
- Reads: `PreferenceCard` (aggregate), `Favorite` (to mark `isFavorited` per row)
- Writes: —

**How it works**
1. Service runs `QueryBuilder` over `PreferenceCardModel` filtered by `published: true`, applying text-search → field filter → sort → pagination from query params.
2. Controller fetches the caller's favorite cardIds (`getFavoriteCardIdsForUserFromDB`) in parallel, then folds them into each row as `isFavorited`.
3. Each row is **summarized** before sending — only the fields shown in the success example are returned (the full card document is not exposed on list).

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `page` | number | Default `1` |
| `limit` | number | Default `10`, capped at `50` (`QueryBuilder.paginate()`) |
| `searchTerm` | string | Text-index match on `cardTitle`, `medication`, `surgeon.fullName`, `surgeon.specialty` |
| `sort` | string | e.g. `-createdAt`, `cardTitle` |
| `fields` | string | Whitelisted projection |

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Public preference cards fetched successfully",
  "meta": {
    "total": 110,
    "limit": 10,
    "page": 1,
    "totalPages": 11,
    "hasNext": true,
    "hasPrev": false
  },
  "data": [
    {
      "id": "665f...",
      "cardTitle": "Laparoscopic Cholecystectomy",
      "surgeon": { "name": "Dr. Sara Ahmed", "specialty": "General Surgery" },
      "verificationStatus": "APPROVED",
      "isFavorited": true,
      "downloadCount": 4,
      "createdAt": "2026-04-29T10:00:00.000Z",
      "updatedAt": "2026-05-01T12:30:00.000Z"
    }
  ]
}
```

---

## 2. Counter Tiles (All Cards / My Cards)

**Trigger**
- Home renders → [`GET /preference-cards/stats`](#get-api-v1-preference-cards-stats).
- Tap **All Cards** tile → navigate to [Library](./05-library.md).
- Tap **My Cards** tile → navigate to [My Cards](./09-my-cards.md).

**Use case**
- `publicCards` — count of `published: true` cards (visible to everyone).
- `myCards` — count of cards where `createdBy === currentUser._id` (drafts + private included).
- Both are absolute totals, not paginated counts. Home and Library / My Cards must agree (sourced from the same model).

### API Reference

#### `GET /api/v1/preference-cards/stats`

Returns absolute counts for the counter tiles.

**Status** — `Implemented`

**Implementation**
- Route: [`preference-card.route.ts`](src/app/modules/preference-card/preference-card.route.ts) — `GET /stats`
- Controller: [`PreferenceCardController.getStats`](src/app/modules/preference-card/preference-card.controller.ts)
- Service: [`PreferenceCardService.getPreferenceCardCountsFromDB`](src/app/modules/preference-card/preference-card.service.ts)
- Validation: —
- Reads: `PreferenceCard` (`countDocuments`)
- Writes: —

**How it works**
1. Service runs two parallel `countDocuments` queries: `{ published: true }` for the public count, `{ createdBy: userId }` for the owner's count.
2. Controller renames service keys before responding (`AllCardsCount` → `publicCards`, `myCardsCount` → `myCards`) — the response surface uses cleaner names than the internal service.
3. `userId` is taken from the JWT, not query params (BOLA mitigation — clients cannot peek another user's count).

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Card statistics retrieved successfully",
  "data": { "publicCards": 110, "myCards": 10 }
}
```

---

## 3. Favorite Cards Section

**Trigger**
- Home renders → fetch carousel → [`GET /users/me/favorites?limit=10`](#get-api-v1-users-me-favorites).
- Tap a card → navigate to [Preference Card Details](./03-preference-card-details.md).
- Tap **unfavorite icon** on a card → [`DELETE /preference-cards/:cardId/favorite`](#delete-api-v1-preference-cards-cardid-favorite).
- Tap **View All** → navigate to a paginated favorites list (uses the same endpoint with default pagination, no `limit=10`).

**Use case**
- Server returns favorites sorted by `favoritedAt DESC` — clients render newest-first without re-sorting.
- "View All" hits the same endpoint with default pagination — no separate route needed.
- Server does **not** push unfavorite events; clients refetch to reconcile.
- Favorite *adds* don't fire from Home (only unfavorite, from the carousel). PUT is documented below because adds happen on Library / Details and use the same endpoint.

**Business rules**
- Max favorites per user — **100** (`MAX_FAVORITES_PER_USER` in `preference-card.service.ts`). On PUT past cap, server returns `409 Favorites limit reached`. The cap is skipped on idempotent re-adds (favoriting an already-favorited card stays a no-op). DELETE always succeeds regardless of count.

**Behavior note** — both PUT and DELETE must be **idempotent** — clients may retry on network failure; the same call must yield the same outcome.

### API Reference

#### `GET /api/v1/users/me/favorites`

Returns the logged-in user's favorited cards (paginated). Carousel calls with `?limit=10`; full-list "View All" uses default pagination.

**Status** — `Implemented`

**Implementation**
- Route: [`user.route.ts`](src/app/modules/user/user.route.ts) — `GET /me/favorites`
- Controller: [`UserController.getFavoriteCards`](src/app/modules/user/user.controller.ts)
- Service: [`PreferenceCardService.listFavoritePreferenceCardsForUserFromDB`](src/app/modules/preference-card/preference-card.service.ts) (cross-module call)
- Validation: —
- Reads: `Favorite`, `PreferenceCard`
- Writes: —

**How it works**
1. Service loads the user's `Favorite` documents and extracts `cardId`s.
2. **Empty short-circuit** — if the user has no favorites, the service returns empty `meta` + `data: []` immediately (no second query).
3. Otherwise: `PreferenceCardModel.find({ _id: { $in: cardIds } })` wrapped in `QueryBuilder` with text-search, filter, sort, and pagination.
4. Controller summarizes each row to the same shape as `GET /preference-cards`.
5. Message branches on result size — `"Favorite preference cards retrieved successfully"` when non-empty, `"No favorite cards found."` when empty.

**Query parameters** — same pagination / sort / `searchTerm` params as `GET /preference-cards`.

**Success — `200 OK`** *(non-empty)*

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Favorite preference cards retrieved successfully",
  "meta": {
    "total": 7,
    "limit": 10,
    "page": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "data": [
    {
      "id": "665f...",
      "cardTitle": "Laparoscopic Cholecystectomy",
      "surgeon": { "name": "Dr. Sara Ahmed", "specialty": "General Surgery" },
      "verificationStatus": "APPROVED",
      "isFavorited": true,
      "downloadCount": 4,
      "createdAt": "2026-04-29T10:00:00.000Z",
      "updatedAt": "2026-05-01T12:30:00.000Z"
    }
  ]
}
```

**Success — `200 OK`** *(empty)*

```json
{
  "success": true,
  "statusCode": 200,
  "message": "No favorite cards found.",
  "meta": { "total": 0, "limit": 10, "page": 1, "totalPages": 0, "hasNext": false, "hasPrev": false },
  "data": []
}
```

#### `PUT /api/v1/preference-cards/:cardId/favorite`

Marks the card as a favorite for the logged-in user. Idempotent.

**Status** — `Implemented`

**Implementation**
- Route: [`preference-card.route.ts`](src/app/modules/preference-card/preference-card.route.ts) — `PUT /:cardId/favorite`
- Controller: [`PreferenceCardController.favoriteCard`](src/app/modules/preference-card/preference-card.controller.ts)
- Service: [`PreferenceCardService.favoritePreferenceCardInDB`](src/app/modules/preference-card/preference-card.service.ts)
- Validation: [`paramIdSchema`](src/app/modules/preference-card/preference-card.validation.ts)
- Reads: `PreferenceCard` (existence + soft-delete + visibility check), `Favorite` (cap check)
- Writes: `Favorite` (create — no-op if already favorited)

**How it works**
1. Card existence check — `404` if not found, `410 Gone` if `isDeleted: true`.
2. Visibility check — non-owner / non-`SUPER_ADMIN` cannot favorite an unpublished card → `403 Not authorized to favorite this private card`.
3. Cap check — `findOne({ userId, cardId })` to detect re-adds. If not already favorited, `countDocuments({ userId })`. When count `≥ MAX_FAVORITES_PER_USER` (= 100) → `409 Favorites limit reached`.
4. `Favorite.create({ userId, cardId })` inside try/catch. MongoDB duplicate-key (`error.code === 11000`) is silently swallowed → idempotent re-add stays a `200`.

**Path params** — `cardId` (Mongo ObjectId)

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card favorited",
  "data": { "favorited": true }
}
```

**Errors**

| Code | `message` |
|---|---|
| 404 | `Card not found` |
| 409 | `Favorites limit reached` (cap = 100 per user) |

#### `DELETE /api/v1/preference-cards/:cardId/favorite`

Removes the card from the user's favorites. Idempotent.

**Status** — `Implemented`

**Implementation**
- Route: [`preference-card.route.ts`](src/app/modules/preference-card/preference-card.route.ts) — `DELETE /:cardId/favorite`
- Controller: [`PreferenceCardController.unfavoriteCard`](src/app/modules/preference-card/preference-card.controller.ts)
- Service: [`PreferenceCardService.unfavoritePreferenceCardInDB`](src/app/modules/preference-card/preference-card.service.ts)
- Validation: [`paramIdSchema`](src/app/modules/preference-card/preference-card.validation.ts)
- Reads: `PreferenceCard` (existence + soft-delete + visibility check)
- Writes: `Favorite` (delete one — no-op if not favorited)

**How it works**
1. Card existence check — `404` if not found, `410 Gone` if `isDeleted: true` (same as PUT).
2. Visibility check — non-owner / non-`SUPER_ADMIN` cannot unfavorite an unpublished card → `403 Not authorized to unfavorite this private card`.
3. `Favorite.deleteOne({ userId, cardId })`. No error if no match — `deletedCount` will simply be `0`.
4. Returns `{ favorited: false, deletedCount }` so the client can tell whether the call was a no-op (`deletedCount === 0`) or actually removed a row (`deletedCount === 1`).

**Path params** — `cardId` (Mongo ObjectId)

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card unfavorited",
  "data": { "favorited": false, "deletedCount": 1 }
}
```

#### Deprecated aliases

| Method | Path | Replaced by | Removal |
|---|---|---|---|
| PUT | `/api/v1/preference-cards/favorites/cards/:cardId` | `PUT /api/v1/preference-cards/:cardId/favorite` | After mobile clients migrate |
| DELETE | `/api/v1/preference-cards/favorites/cards/:cardId` | `DELETE /api/v1/preference-cards/:cardId/favorite` | After mobile clients migrate |

Both legacy paths are wired in [`preference-card.route.ts`](src/app/modules/preference-card/preference-card.route.ts) and call the same controller methods as the primary paths. Behavior is identical.

---

## Endpoint Index

| # | Method | Path | Status | Auth | Purpose |
|---|---|---|---|---|---|
| 1 | GET | `/api/v1/preference-cards` | `Implemented` | Bearer | Public card list — search bar uses with `?searchTerm=` |
| 2 | GET | `/api/v1/preference-cards/stats` | `Implemented` | Bearer | Counter-tile totals — `publicCards` + `myCards` |
| 3 | GET | `/api/v1/users/me/favorites` | `Implemented` | Bearer | Favorites carousel + View All list |
| 4 | PUT | `/api/v1/preference-cards/:cardId/favorite` | `Implemented` | Bearer | Favorite a card |
| 5 | DELETE | `/api/v1/preference-cards/:cardId/favorite` | `Implemented` | Bearer | Unfavorite a card |
| 6 | PUT | `/api/v1/preference-cards/favorites/cards/:cardId` | `Deprecated` | Bearer | Legacy favorite alias — use #4 |
| 7 | DELETE | `/api/v1/preference-cards/favorites/cards/:cardId` | `Deprecated` | Bearer | Legacy unfavorite alias — use #5 |

> Endpoints used on this screen but documented in their owning screens (not duplicated):
> - `GET /api/v1/preference-cards/:cardId` (open card from carousel) — see [03-preference-card-details.md](./03-preference-card-details.md#get-api-v1-preference-cards-cardid)
