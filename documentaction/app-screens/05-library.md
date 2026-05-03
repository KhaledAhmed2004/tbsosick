# Screen 5: Library (Mobile)

> **Section**: App Screens — UX Flow + API Reference
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) · [Preference Card Details](./03-preference-card-details.md) — card opens from list view.
> **Base URL**: `{{baseUrl}}/api/v1/preference-cards`
> **API conventions**: see [_shared/api-conventions.md](../_shared/api-conventions.md) — response envelope, error shape, status codes, headers, pagination.

---

## Library-Specific Constants

| Item | Value |
|---|---|
| Visibility scope | Public cards only (`visibility: PUBLIC`) — same data source as Home's All Cards tab |
| Pagination *(current — code)* | Page-based via `QueryBuilder` (`page` / `limit`) |
| Pagination *(spec — Planned)* | Cursor-based, anchored on `(createdAt, _id)` — see Status note in §1 |
| Page size | 20 items per fetch |
| Search debounce (client) | 300 ms |
| Min search length | 2 characters |
| Auth | All endpoints require `Authorization: Bearer {{accessToken}}` |

---

## 1. Library Initial Load

**Trigger** — user taps the **Library** tab → [`GET /preference-cards`](./02-home.md#get-api-v1-preference-cards) (the public-feed endpoint owned by [02-home.md](./02-home.md), reused here).

**Use case**
- Library is a **public-only** discovery feed — same endpoint that powers Home's All Cards tab. No separate `/library` route exists in code.
- Search and filter compose with `AND` server-side — multiple criteria narrow the result set together.

**Status — Library feed endpoint** — `Implemented` (reuses `GET /preference-cards/`)

> Library re-uses the existing public listing endpoint. The doc previously proposed a dedicated `GET /preference-cards/library` route; in code, this is the same as `GET /preference-cards/`. **Recommendation**: do not add a separate route — keep one source of truth for public cards.

**Status — Cursor-based pagination** — `Not implemented` (Planned)

> Current code uses page-based pagination (`?page=N&limit=N`). The doc's design intent is cursor pagination anchored on `(createdAt, _id)` to prevent skips/duplicates during infinite scroll across users. **Recommendation**: implement cursor mode as an opt-in via `?paginationMode=cursor` on the same endpoint, so Home (page-based) and Library (cursor-based) can share the route.

---

## 2. Search

**Trigger** — user types in the search bar → debounced (~300 ms) [`GET /preference-cards?searchTerm=...`](./02-home.md#get-api-v1-preference-cards).

**Use case**
- `searchTerm` matches `title`, `description`, `tags` (and likely `surgeon.name`, `specialty` — confirm with team).
- Search composes with active filters (`specialty`, etc.) via `AND`.
- Every new search resets pagination — client omits `page` / `cursor` on the new query.

**Behavior note** — debounce 300 ms on the client; server should expect bursts when users type.

---

## 3. Filtering

**Trigger** — user opens the Filter panel → [`GET /preference-cards/specialties`](#get-api-v1-preference-cards-specialties) populates the specialty list. On Apply → re-fetch [`GET /preference-cards`](./02-home.md#get-api-v1-preference-cards) with `?specialty=...` (and other filter params).

**Use case**
- Specialties endpoint returns the **distinct list of specialties present in public cards** — populating the filter dynamically (no hardcoded list).
- "Verified Only" filter — `// TBD`: confirm whether `verified` is a field on `PreferenceCard`. If yes, `?verifiedOnly=true` is a server-side equality filter.

### API Reference

#### `GET /api/v1/preference-cards/specialties`

Returns the distinct list of specialties present in the public card pool. Used to populate the filter bottom sheet.

**Status** — `Implemented`

**Implementation**
- Route: [`preference-card.route.ts`](src/app/modules/preference-card/preference-card.route.ts) — `GET /specialties`
- Controller: [`PreferenceCardController.getSpecialties`](src/app/modules/preference-card/preference-card.controller.ts)
- Service: [`PreferenceCardService.getDistinctSpecialtiesFromDB`](src/app/modules/preference-card/preference-card.service.ts)
- Validation: —
- Reads: `PreferenceCard` (`distinct('specialty')`)
- Writes: —

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": [
    { "slug": "general-surgery", "name": "General Surgery", "count": 42 },
    { "slug": "orthopedics", "name": "Orthopedics", "count": 18 }
  ]
}
```

> If the current `distinct(...)` implementation only returns names without counts, populating `count` requires a small aggregation. **Status**: returns names; counts may be `// TBD`.

---

## 4. Card Actions (List View)

**Trigger**
- Tap favorite icon → [`PUT`](./02-home.md#put-api-v1-preference-cards-cardid-favorite) / [`DELETE /preference-cards/:cardId/favorite`](./02-home.md#delete-api-v1-preference-cards-cardid-favorite) (full spec in [02](./02-home.md)).
- Tap download → [`POST /preference-cards/:cardId/download`](./03-preference-card-details.md#post-api-v1-preference-cards-cardid-download) (full spec in [03](./03-preference-card-details.md)). PDF generated client-side from already-loaded card data.

**Status** — both endpoints `Implemented` (in their owning modules).

---

## 5. Open a Card

**Trigger** — user taps a row → navigate to [Preference Card Details](./03-preference-card-details.md) → [`GET /preference-cards/:cardId`](./03-preference-card-details.md#get-api-v1-preference-cards-cardid) (full spec in [03](./03-preference-card-details.md)).

---

## 6. Infinite Scroll

**Trigger** — scroll near the bottom → next page fetched.

**Use case** *(current — code)*
- Page-based: client increments `?page=N` on the same endpoint.

**Use case** *(spec — Planned)*
- Cursor-based: each request uses the last received item as a reference; server returns `meta.nextCursor`. Client passes it back as `?cursor=...`. Backend decodes and runs `(createdAt, _id) < cursor` for index scan. When `meta.hasMore === false` the client renders **"You've reached the end"**.

**Behavior note** — until cursor mode lands, the client uses `?page=N`. Migrating to cursor mode is a transparent change for the UI as long as the endpoint contract switches together.

---

## Endpoint Index

| # | Method | Path | Status | Auth | Purpose |
|---|---|---|---|---|---|
| 1 | GET | `/api/v1/preference-cards/specialties` | `Implemented` | Bearer | Distinct specialty list for filter |

> Endpoints used on this screen but documented in their owning screens (not duplicated):
> - `GET /api/v1/preference-cards` — see [02-home.md](./02-home.md#get-api-v1-preference-cards) *(public feed; reused here for the Library list)*
> - `GET /api/v1/preference-cards/:cardId` — see [03-preference-card-details.md](./03-preference-card-details.md#get-api-v1-preference-cards-cardid)
> - `PUT` / `DELETE /api/v1/preference-cards/:cardId/favorite` — see [02-home.md](./02-home.md#put-api-v1-preference-cards-cardid-favorite)
> - `POST /api/v1/preference-cards/:cardId/download` — see [03-preference-card-details.md](./03-preference-card-details.md#post-api-v1-preference-cards-cardid-download)

### Planned (no code yet)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/preference-cards?paginationMode=cursor` | Cursor-based pagination opt-in on the existing public-feed endpoint (anchor: `(createdAt, _id)`) |
