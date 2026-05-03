# Screen 3: Preference Card Details (Mobile)

> **Section**: App Screens — UX Flow + API Reference
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) (card entry point) · [Create Preference Card](./04-create-preference-card.md) (edit mode) · [Library](./05-library.md) (alternate entry point)
> **Base URL**: `{{baseUrl}}/api/v1/preference-cards`
> **API conventions**: see [_shared/api-conventions.md](../_shared/api-conventions.md) — response envelope, error shape, status codes, headers, pagination.

---

> **No UI flow mismatches detected — screen flow is clean and ready for backend analysis.** Every step in the UX Flow below is unambiguous and consistent with related screens.

---

## Details-Specific Constants

| Item | Value |
|---|---|
| Auth | All endpoints require `Authorization: Bearer {{accessToken}}` |
| Access errors | `403` = private card (caller not owner / not `SUPER_ADMIN`), `404` = missing card |

---

## 1. View Card Details

**Trigger** — user opens a card from [Home](./02-home.md) or [Library](./05-library.md) → [`GET /preference-cards/:cardId`](#get-api-v1-preference-cards-cardid).

**Use case**
- Access rule — `PUBLIC` → any authenticated user; `PRIVATE` → owner only. Non-owner on private → `403`.
- Set `isOwner` in the response — client uses it to gate Edit/Delete actions (server-driven, not client-guessed).
- Read-only — no view counter, no `lastViewedAt` write unless explicitly added as a field.

**Business rules**
- Draft + visibility interaction — `// TBD`: confirm whether `published: false` cards are hidden from non-owners even when `visibility: PUBLIC`. Recommendation: yes, drafts are always owner-only regardless of visibility.

**Status** — `Implemented`

**Implementation**
- Route: [`preference-card.route.ts`](src/app/modules/preference-card/preference-card.route.ts)
- Controller: [`PreferenceCardController.getById`](src/app/modules/preference-card/preference-card.controller.ts)
- Service: [`PreferenceCardService.getPreferenceCardByIdFromDB`](src/app/modules/preference-card/preference-card.service.ts)
- Validation: [`paramIdSchema`](src/app/modules/preference-card/preference-card.validation.ts)
- Reads: `PreferenceCard`
- Writes: —

### API Reference

#### `GET /api/v1/preference-cards/:cardId`

Fetches the full preference card document for the details screen. Resolves catalog references (supplies, sutures) so the client can render lists without secondary calls.

**Path params** — `cardId` (Mongo ObjectId)

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `fields` | string | Optional projection, e.g. `title,surgeon,sections` |

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "665f...",
    "title": "Laparoscopic Cholecystectomy",
    "ownerId": "664a...",
    "ownerName": "Dr. Sara Ahmed",
    "isOwner": true,
    "isFavorited": true,
    "published": true,
    "visibility": "PUBLIC",
    "surgeon": {
      "name": "Dr. Sara Ahmed",
      "specialty": "General Surgery",
      "handPreference": "RIGHT",
      "contactNumber": "+8801XXXXXXXXX",
      "musicPreference": "Classical"
    },
    "sections": {
      "medication": [{ "name": "Cefazolin 1g IV", "notes": "30 min pre-op" }],
      "supplies": [{ "supplyId": "...", "name": "10mm Trocar", "qty": 4 }],
      "sutures": [{ "sutureId": "...", "name": "Vicryl 2-0", "qty": 2 }],
      "instruments": ["Laparoscopic grasper", "Hook cautery"],
      "positioningEquipment": ["Reverse Trendelenburg"],
      "prepping": ["Chlorhexidine", "Sterile drapes"],
      "workflow": ["Port placement", "Calot's triangle dissection", "Closure"],
      "keyNotes": "Confirm CBD anatomy before clipping."
    },
    "photos": [
      { "url": "https://cdn.../1.jpg", "caption": "Port layout" }
    ],
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-05-01T12:30:00.000Z"
  }
}
```

**Errors**

| Code | `message` |
|---|---|
| 401 | `Unauthorized` |
| 403 | `Private card. You do not have access.` |
| 404 | `Card not found` |

---

## 2. Favorite / Unfavorite

**Trigger** — user taps the favorite icon:
- Add to favorites → [`PUT /preference-cards/:cardId/favorite`](./02-home.md#put-api-v1-preference-cards-cardid-favorite)
- Remove from favorites → [`DELETE /preference-cards/:cardId/favorite`](./02-home.md#delete-api-v1-preference-cards-cardid-favorite)

(Full spec in [02-home.md](./02-home.md). Old `/favorites/cards/:cardId` paths are still served as deprecated aliases for backward compat.)

**Use case**
- Two endpoints (PUT add / DELETE remove), not a single toggle — client decides which to call based on current `isFavorited` state.
- PUT is idempotent — adding an already-favorited card returns `200 OK` without duplicating.
- DELETE is idempotent — removing a non-favorited card returns `200 OK` (or `204`) without `404`.

**Business rules**
- Max favorites per user — `// TBD`. Recommendation: cap at 100 to bound storage and the favorites-carousel query. When the cap is hit, server returns `409 Favorites limit reached` on PUT (DELETE always succeeds).

**Behavior note** — client may flip UI optimistically; revert on `4xx/5xx`.

**Status** — `Implemented` (full spec / Implementation block in [02-home.md](./02-home.md))

---

## 3. Share

**Trigger** — user taps Share. Native OS share sheet handles delivery.

**Use case** — none. No backend interaction.

---

## 4. Download

**Trigger** — user taps Download → [`POST /preference-cards/:cardId/download`](#post-api-v1-preference-cards-cardid-download).

**Use case**
- Analytics-only event. Server records `(userId, cardId, downloadedAt)` for usage metrics.
- Server still logs `401` / `404` for telemetry; client silently ignores them.

**Business rules**
- Owner-facing analytics — `// TBD`: confirm whether download count is surfaced to the card owner ("X downloads this month") or kept internal. Decision drives whether `cardId` needs an aggregate counter or only raw events.
- Rate limit per user — `// TBD`. Recommendation: 30 downloads/min/user. Prevents analytics-pollution from abuse without affecting normal use.

**Behavior note** — fire-and-forget on the client. PDF is generated locally from already-loaded card data; the call has no impact on the user-visible flow.

**Status** — `Implemented`

**Implementation**
- Route: [`preference-card.route.ts`](src/app/modules/preference-card/preference-card.route.ts)
- Controller: [`PreferenceCardController.downloadCard`](src/app/modules/preference-card/preference-card.controller.ts)
- Service: [`PreferenceCardService.downloadPreferenceCardInDB`](src/app/modules/preference-card/preference-card.service.ts)
- Validation: [`downloadPreferenceCardSchema`](src/app/modules/preference-card/preference-card.validation.ts)
- Reads: `PreferenceCard`
- Writes: `PreferenceCardDownloadModel` (raw event), `PreferenceCard` (aggregate counter)

### API Reference

#### `POST /api/v1/preference-cards/:cardId/download`

Records a download analytics event. Fire-and-forget — the client must not block PDF generation on this call.

**Path params** — `cardId` (Mongo ObjectId)

**Request body** — none.

**Success — `204 No Content`**

**Errors** — silently ignored on client; server still logs `401`, `404` for telemetry.

---

## 5. Edit / Delete (Owner or `SUPER_ADMIN`)

**Trigger**
- **Edit** → opens [Create / Edit Preference Card](./04-create-preference-card.md) in edit mode → [`PATCH /preference-cards/:cardId`](./04-create-preference-card.md#patch-api-v1-preference-cards-cardid) (full spec in [04](./04-create-preference-card.md)).
- **Delete** → confirmation, then [`DELETE /preference-cards/:cardId`](#delete-api-v1-preference-cards-cardid).

**Use case**
- Both operations require ownership; `SUPER_ADMIN` role bypasses the ownership check.
- Delete is **hard-delete** — no soft-delete, no trash, no restore window.

**Business rules**
- Calendar events linked via `linkedCardId === cardId` on delete — `// TBD`: unlink (set `linkedCardId = null`), cascade-delete the events, or block delete until events are unlinked manually. Recommendation: **unlink**. Events carry their own value (date, personnel, notes) and should not disappear with the card.
- Favorite records pointing to this card — server auto-cleans on delete (a deleted card cannot remain in any user's favorites list or carousel).
- PDFs already saved on user devices — no action. Local files remain until the user removes them; server has no recall mechanism.

**Behavior note** — server does not push a delete event; clients must refetch list endpoints (`GET /preference-cards`, `GET /users/me/favorites`, `GET /preference-cards/private`) and `GET /preference-cards/stats` after a successful delete to reconcile counters.

**Status — `DELETE /preference-cards/:cardId`** — `Implemented`

**Implementation**
- Route: [`preference-card.route.ts`](src/app/modules/preference-card/preference-card.route.ts) — `DELETE /:cardId`
- Controller: [`PreferenceCardController.deleteCard`](src/app/modules/preference-card/preference-card.controller.ts)
- Service: [`PreferenceCardService.deletePreferenceCardFromDB`](src/app/modules/preference-card/preference-card.service.ts)
- Validation: [`paramIdSchema`](src/app/modules/preference-card/preference-card.validation.ts)
- Reads: `PreferenceCard`
- Writes: `PreferenceCard` (hard delete via `findByIdAndDelete`)

> *(`PATCH /preference-cards/:cardId` Implementation block lives in [04-create-preference-card.md](./04-create-preference-card.md#patch-api-v1-preference-cards-cardid).)*

### API Reference

#### `DELETE /api/v1/preference-cards/:cardId`

Hard-deletes a preference card owned by the logged-in user (or any card if caller is `SUPER_ADMIN`).

**Path params** — `cardId` (Mongo ObjectId)

**Success — `200 OK`**

```json
{ "success": true, "statusCode": 200, "message": "Card deleted", "data": null }
```

**Errors**

| Code | `message` |
|---|---|
| 403 | `Not allowed. You can delete only your own cards.` |
| 404 | `Card not found` |

---

## 6. Access Control Behavior

**Use case**
- `404 Card not found` — card does not exist or has been deleted.
- `403 Private card. You do not have access.` — card exists but `visibility = PRIVATE` and caller is not the owner / not `SUPER_ADMIN`.
- Errors are **deliberately differentiated** so the UI can show distinct messages. Do not collapse to a generic `404`.

---

## Endpoint Index

| # | Method | Path | Status | Auth | Purpose |
|---|---|---|---|---|---|
| 1 | GET | `/api/v1/preference-cards/:cardId` | `Implemented` | Bearer | Fetch full card detail |
| 2 | POST | `/api/v1/preference-cards/:cardId/download` | `Implemented` | Bearer | Record download analytics event |
| 3 | DELETE | `/api/v1/preference-cards/:cardId` | `Implemented` | Bearer (owner / `SUPER_ADMIN`) | Hard-delete a card |

> Endpoints used on this screen but documented in their owning screens (not duplicated):
> - `PUT` / `DELETE /api/v1/preference-cards/:cardId/favorite` — see [02-home.md](./02-home.md#put-api-v1-preference-cards-cardid-favorite)
> - `PATCH /api/v1/preference-cards/:cardId` — see [04-create-preference-card.md](./04-create-preference-card.md#patch-api-v1-preference-cards-cardid)
