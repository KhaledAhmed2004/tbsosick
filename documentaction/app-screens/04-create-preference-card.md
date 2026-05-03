# Screen 4: Create / Edit Preference Card (Mobile)

> **Section**: App Screens — UX Flow + API Reference
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) · [Preference Card Details](./03-preference-card-details.md) — entry from Home "+" and post-create destination, also used for edit mode entry.
> **Base URL**: `{{baseUrl}}/api/v1`
> **API conventions**: see [_shared/api-conventions.md](../_shared/api-conventions.md) — response envelope, error shape, status codes, headers, pagination, file uploads.

---

## Create / Edit-Specific Constants

| Item | Value |
|---|---|
| Mode | `create` (empty form) or `edit` (pre-filled from `GET /preference-cards/:cardId`) |
| Catalog typeahead debounce | 300 ms |
| Catalog typeahead match | Case-insensitive substring (`$regex`) on `name` |
| Photos per card | Max 5 |
| Photo size | Max 5 MB per file, JPEG / PNG / WEBP |
| Quantity field | Positive integer (≥ 1) |
| Publish prerequisites | All clinical sections + ≥1 supply + ≥1 suture |
| Auth | All endpoints require `Authorization: Bearer {{accessToken}}` |

---

## 1. Open Create Card

**Trigger** — user taps **Create Preference Card (+)** → screen opens and parallel-fetches catalogs:
- [`GET /supplies`](#get-api-v1-supplies)
- [`GET /sutures`](#get-api-v1-sutures)

In **edit mode**, the form is pre-filled from [`GET /preference-cards/:cardId`](./03-preference-card-details.md#get-api-v1-preference-cards-cardid) (full spec in 03).

**Use case**
- Catalogs are public to authenticated users — no per-user filtering.
- Catalogs are large enough to warrant typeahead with debounced server-side `$regex` matching, not client-side filtering.

**Status — `GET /supplies`** — `Implemented`

**Implementation**
- Route: [`supplies.route.ts`](src/app/modules/supplies/supplies.route.ts)
- Controller: [`SuppliesController.listSupplies`](src/app/modules/supplies/supplies.controller.ts)
- Service: [`SuppliesService.listSuppliesFromDB`](src/app/modules/supplies/supplies.service.ts)
- Validation: — (query parsed in service via `QueryBuilder`)
- Reads: `SupplyModel`
- Writes: —

**Status — `GET /sutures`** — `Implemented`

**Implementation**
- Route: [`sutures.route.ts`](src/app/modules/sutures/sutures.route.ts)
- Controller: [`SuturesController.listSutures`](src/app/modules/sutures/sutures.controller.ts)
- Service: [`SuturesService.listSuturesFromDB`](src/app/modules/sutures/sutures.service.ts)
- Validation: —
- Reads: `SutureModel`
- Writes: —

### API Reference

#### `GET /api/v1/supplies`

Lists supplies catalog entries. Used for initial load (small page) and typeahead search.

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `searchTerm` | string | Case-insensitive substring on `name` |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": [
    { "_id": "770a...", "name": "10mm Trocar", "category": "Trocars" }
  ],
  "meta": { "page": 1, "limit": 20, "total": 132, "totalPages": 7 }
}
```

#### `GET /api/v1/sutures`

Same shape as `GET /supplies`.

```json
{
  "data": [
    { "_id": "771b...", "name": "Vicryl 2-0", "size": "2-0", "type": "Absorbable" }
  ]
}
```

---

## 2. Fill Card Information

**Trigger** — user enters required + optional fields. Form state held client-side until **Save Draft** or **Publish**.

**Use case** — no per-section auto-save endpoint; all fields submitted in a single create/update call.

---

## 3. Add Supplies / Sutures (Typeahead)

**Trigger** — user types into supplies / sutures field → debounced (~300 ms) [`GET /supplies?searchTerm=...`](#get-api-v1-supplies) or [`GET /sutures?searchTerm=...`](#get-api-v1-sutures).

**Use case**
- Server-side `$regex` substring match on `name` — case-insensitive.
- Custom entry ("**+ Add 'X' as custom**") is a client-only construct — server accepts `{ name, qty, isCustom: true }` on submit; no API call here.

**Business rules**
- Custom entries do **not** automatically populate the global catalog — they live only on the parent card. Promotion to the catalog is a separate admin action (`POST /supplies` / `POST /sutures`).
- Quantity validation — server enforces positive integer (≥ 1) per supply/suture.

**Behavior note** — debounce on the client (300 ms). Server should expect bursts of requests when users type fast.

---

## 4. Add Photos

**Trigger** — user picks images via OS picker; selected files attach to the form, sent as multipart parts of the submit.

**Use case**
- Max 5 photos per card; each ≤ 5 MB; allowed mimes `image/jpeg`, `image/png`, `image/webp`.
- Photos travel **with** the create/update request — no separate upload endpoint. Server uses `fileHandler({ maxFileSizeMB: 5, maxFilesTotal: 5, mimeTypes: [...] })`.

**Business rules**
- Image storage backend — `// TBD`: confirm CDN provider (S3 / Cloudinary / disk). Drives URL format and retention policy.
- Photo retention on card deletion — `// TBD`: drop photo files when card is hard-deleted, or keep for orphan cleanup job? Recommendation: drop synchronously to avoid storage drift.

---

## 5. Save Draft or Publish

**Trigger**
- **Create mode** → [`POST /preference-cards`](#post-api-v1-preference-cards) (multipart).
- **Edit mode** → [`PATCH /preference-cards/:cardId`](#patch-api-v1-preference-cards-cardid) (multipart).
- Both branch on a `published` boolean: `false` → draft, `true` → publish.

**Use case**
- Publish requires all clinical sections + ≥1 supply + ≥1 suture — server-enforced, not client-only.
- Create returns the new card; client navigates to [Preference Card Details](./03-preference-card-details.md).
- Validation errors return `errorSources[]` so the client can render inline field errors.

**Business rules**
- Once `published: true`, can a card be reverted to draft? — `// TBD`. Recommendation: **no** — published cards stay public; users delete-and-recreate if they want to revert. Avoids confusing state for users who already favorited it.
- Edit on a published card — does it require re-verification by an admin (if verification flow exists)? — `// TBD`. Recommendation: edits to clinical sections re-trigger verification; edits to title / surgeon notes do not.

**Status — `POST /preference-cards`** — `Implemented`

**Implementation**
- Route: [`preference-card.route.ts`](src/app/modules/preference-card/preference-card.route.ts)
- Controller: [`PreferenceCardController.createCard`](src/app/modules/preference-card/preference-card.controller.ts)
- Service: [`PreferenceCardService.createPreferenceCardInDB`](src/app/modules/preference-card/preference-card.service.ts)
- Validation: [`createPreferenceCardSchema`](src/app/modules/preference-card/preference-card.validation.ts)
- Reads: `SupplyModel`, `SutureModel` (validate refs)
- Writes: `PreferenceCard`

**Status — `PATCH /preference-cards/:cardId`** — `Implemented`

**Implementation**
- Route: [`preference-card.route.ts`](src/app/modules/preference-card/preference-card.route.ts)
- Controller: [`PreferenceCardController.updateCard`](src/app/modules/preference-card/preference-card.controller.ts)
- Service: [`PreferenceCardService.updatePreferenceCardInDB`](src/app/modules/preference-card/preference-card.service.ts)
- Validation: [`updatePreferenceCardSchema`](src/app/modules/preference-card/preference-card.validation.ts)
- Reads: `SupplyModel`, `SutureModel`
- Writes: `PreferenceCard`

### API Reference

#### `POST /api/v1/preference-cards`

Creates a preference card. Accepts JSON or `multipart/form-data` (multipart required when sending photos).

**Headers** — `Content-Type: multipart/form-data` (when sending photos), else `application/json`.

**Form / body fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | 3–120 chars |
| `published` | boolean | yes | `false` for draft, `true` for publish |
| `visibility` | `"PUBLIC"` \| `"PRIVATE"` | yes | Defaults to `PRIVATE` |
| `surgeon` | object | yes | `{ name, specialty, handPreference, contactNumber, musicPreference }` |
| `sections` | object | partial for draft, full for publish | Clinical sections (see below) |
| `supplies[]` | array | ≥1 for publish | `[{ supplyId?, name?, qty, isCustom? }]` |
| `sutures[]` | array | ≥1 for publish | `[{ sutureId?, name?, qty, isCustom? }]` |
| `photos[]` | file | optional | Up to 5 images (JPEG/PNG/WEBP, ≤ 5 MB each) |

**Sections object**

```json
{
  "medication": [{ "name": "Cefazolin 1g IV", "notes": "30 min pre-op" }],
  "instruments": ["Laparoscopic grasper"],
  "positioningEquipment": ["Reverse Trendelenburg"],
  "prepping": ["Chlorhexidine"],
  "workflow": ["Port placement", "Closure"],
  "keyNotes": "Confirm CBD anatomy before clipping."
}
```

**Success — `201 Created`**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Card created",
  "data": { "_id": "665f...", "title": "Laparoscopic Cholecystectomy", "published": true }
}
```

**Errors**

| Code | When | `message` |
|---|---|---|
| 400 | Validation failure | `Invalid input` (with `errorSources[]`) |
| 400 | Publish without all required sections | `Cannot publish — missing required sections` |
| 413 | Photo too large | `File exceeds 5 MB` |
| 415 | Unsupported mime type | `Only JPEG, PNG, or WEBP allowed` |

#### `PATCH /api/v1/preference-cards/:cardId`

Updates an existing card (edit mode). Same body shape as `POST /preference-cards` but every field is optional. Server accepts partial updates and only persists provided keys.

**Path params** — `cardId` (Mongo ObjectId, must be owned by user)

**Photo handling**

* Existing photos kept by URL: send `keepPhotos[]` (array of URLs) — anything not listed is removed.
* New photos uploaded as `photos[]` multipart parts.
* To clear all photos: `keepPhotos[] = []` and no `photos[]` parts.

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Card updated",
  "data": { "_id": "665f...", "title": "Updated title", "updatedAt": "2026-05-03T11:00:00.000Z" }
}
```

**Errors**

| Code | `message` |
|---|---|
| 403 | `Not allowed. You can edit only your own cards.` |
| 404 | `Card not found` |

---

## Endpoint Index

| # | Method | Path | Status | Auth | Purpose |
|---|---|---|---|---|---|
| 1 | GET | `/api/v1/supplies` | `Implemented` | Bearer | List supplies catalog (typeahead source) |
| 2 | GET | `/api/v1/sutures` | `Implemented` | Bearer | List sutures catalog (typeahead source) |
| 3 | POST | `/api/v1/preference-cards` | `Implemented` | Bearer | Create card (multipart with photos) |
| 4 | PATCH | `/api/v1/preference-cards/:cardId` | `Implemented` | Bearer (owner) | Update card (edit mode, multipart) |

> Endpoints used on this screen but documented elsewhere:
> - `GET /api/v1/preference-cards/:cardId` (edit-mode pre-fill) — see [03-preference-card-details.md](./03-preference-card-details.md#get-api-v1-preference-cards-cardid)
