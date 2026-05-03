# Preference Card Module APIs

> **Section**: Backend API specifications for the preference-card module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Home](../app-screens/02-home.md) — Stats, search, favorites, download
> - [App Card Details](../app-screens/03-preference-card-details.md) — Get/Create/Update/Delete card
> - [App Library](../app-screens/04-library.md) — Public/private listing, specialties filter
> - [Dashboard Preference Card Management](../dashboard-screens/04-preference-card-management.md) — Admin moderation, verification

> **Verification contract (per [D8](../overview.md#appendix-a--decisions-log-v1)):**
> Card verification (Approve / Reject) uses the **unified** `PATCH /preference-cards/:cardId` endpoint with `{ verificationStatus }` in the body, role-gated to `SUPER_ADMIN`. Mirrored verb routes (`/approve`, `/reject`) and the transitional `/:cardId/status` route are **deprecated**.
>
> **Code state**: Source still uses `PATCH /:cardId/status` (see `preference-card.route.ts`). Code refactor pending — clients should target the unified `PATCH /:cardId` contract documented here.

> **Canonical user's-own-cards endpoint (Q1):**
> User's own cards are fetched via `GET /preference-cards?visibility=private` — there is no separate `/my-cards` or `/private` endpoint in the canonical API surface. UX tab labels stay product-friendly (e.g. Home shows "All Cards / My Cards"); the underlying call is the same `?visibility=…` shape with different params.
>
> **Code state**: Source still exposes a transitional `/preference-cards/private` route (see `preference-card.route.ts`). It is **being deprecated** — clients should target `GET /preference-cards?visibility=private` documented here.

---

## Endpoints Index

| # | Method | Endpoint | Auth | Used By |
|---|---|---|---|---|
| 3.1 | GET | `/preference-cards` | Bearer | [App Home](../app-screens/02-home.md), [App Library](../app-screens/04-library.md), [Dashboard Card Mgmt](../dashboard-screens/04-preference-card-management.md) |
| 3.2 | GET | `/preference-cards/stats` | Bearer | [App Home](../app-screens/02-home.md) |
| 3.3 | GET | `/preference-cards/specialties` | Bearer | [App Library](../app-screens/04-library.md) |
| 3.4 | POST | `/preference-cards` | Bearer | [App Card Details](../app-screens/03-preference-card-details.md) |
| 3.5 | GET | `/preference-cards/:cardId` | Bearer | [App Card Details](../app-screens/03-preference-card-details.md), [App Library](../app-screens/04-library.md) |
| 3.6 | PATCH | `/preference-cards/:cardId` | Bearer | [App Card Details](../app-screens/03-preference-card-details.md) |
| 3.7 | DELETE | `/preference-cards/:cardId` | Bearer | [App Card Details](../app-screens/03-preference-card-details.md), [Dashboard Card Mgmt](../dashboard-screens/04-preference-card-management.md) |
| 3.8 | PUT | `/preference-cards/favorites/cards/:cardId` | Bearer | [App Home](../app-screens/02-home.md), [App Card Details](../app-screens/03-preference-card-details.md), [App Library](../app-screens/04-library.md), [Dashboard Card Mgmt](../dashboard-screens/04-preference-card-management.md) |
| 3.9 | DELETE | `/preference-cards/favorites/cards/:cardId` | Bearer | [App Home](../app-screens/02-home.md), [App Card Details](../app-screens/03-preference-card-details.md), [App Library](../app-screens/04-library.md), [Dashboard Card Mgmt](../dashboard-screens/04-preference-card-management.md) |
| 3.10 | POST | `/preference-cards/:cardId/download` | Bearer | [App Card Details](../app-screens/03-preference-card-details.md), [App Library](../app-screens/04-library.md) |
| 3.11 | PATCH | `/preference-cards/:cardId` (with `{ verificationStatus }` body) | SUPER_ADMIN | [Dashboard Card Mgmt](../dashboard-screens/04-preference-card-management.md) |

---

### 3.1 List/Search Preference Cards

```
GET /preference-cards?visibility=public&searchTerm=keyword&surgeonSpecialty=Orthopedics&verificationStatus=VERIFIED
Auth: Bearer {{accessToken}}
```

> Single endpoint for both public-tab and private-tab list views. Pass `visibility=public` for the public library/admin moderation list, or `visibility=private` for the user's own private cards.

**Query Parameters:**
- `visibility`: `public` (default for public library / admin) or `private` (user's own private cards).
- `searchTerm`: Search by card title, surgeon name, or medication.
- `surgeonSpecialty` / `specialty`: Filter by surgeon's specialty (regex match).
- `verificationStatus`: Filter by `VERIFIED` or `UNVERIFIED`.
- `page`: Pagination page (default `1`).
- `limit`: Pagination limit (default `10`).

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listPublicPreferenceCardsFromDB` / `listPrivatePreferenceCardsForUserFromDB`

**Business Logic (`listPublicPreferenceCardsFromDB`):**
- **Aggregation Pipeline**: Efficiency-er jonno MongoDB aggregation use kore search ebong filters apply kora hoy.
- **Text Search**: `cardTitle`, `surgeon.fullName`, ebong `medication` field-er opor full-text index (`$text`) use kore search kora hoy.
- **Specialty Filter**: `surgeon.specialty` field-er opor exact matching apply kora hoy.
- **Data Flattening**: `supplies` ebong `sutures` populate kore name extract kora hoy jate client-side rendering shohoj hoy.
- **Visibility Control**: Shudhu matro `published: true` ebong `isDeleted: false` cards return kora hoy.

**Business Logic (`listPrivatePreferenceCardsForUserFromDB`):**
- `QueryBuilder` use kore user-er nijer draft (unpublished) cards fetch kora hoy.
- Shudhu `createdBy: userId` filter apply kora hoy privacy maintain korte.
- When `visibility=private`, results are scoped to `creator === authenticatedUser` — the endpoint never returns another user's private cards, even to `SUPER_ADMIN`.

#### Responses

- **Scenario: Success — Public (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Public preference cards retrieved successfully",
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 120,
      "totalPages": 12,
      "hasNext": true,
      "hasPrev": false
    },
    "data": [
      {
        "id": "664a1b2c3d4e5f6a7b8c9d0e",
        "cardTitle": "Knee Arthroscopy",
        "surgeon": {
          "name": "Dr. Smith",
          "specialty": "Orthopedics"
        },
        "verificationStatus": "VERIFIED",
        "isFavorited": false,
        "downloadCount": 15,
        "createdAt": "2026-03-15T10:30:00.000Z",
        "updatedAt": "2026-03-15T10:30:00.000Z"
      }
    ]
  }
  ```

- **Scenario: Success — Admin View (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Public preference cards fetched successfully",
    "meta": { "total": 45, "limit": 10, "page": 1, "totalPages": 5 },
    "data": [
      {
        "id": "664c1b2c3d4e5f6a7b8c9d1a",
        "cardTitle": "Hip Replacement (Dr. Smith)",
        "surgeon": {
          "name": "Dr. John Smith",
          "specialty": "Orthopedics"
        },
        "verificationStatus": "UNVERIFIED",
        "downloadCount": 12,
        "createdAt": "2026-03-20T14:45:00.000Z"
      }
    ]
  }
  ```

- **Scenario: Success — Private (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Private preference cards retrieved successfully",
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "data": [
      {
        "id": "664a1b2c3d4e5f6a7b8c9d0f",
        "cardTitle": "My Private Card",
        "surgeon": {
          "name": "Dr. Own",
          "specialty": "General"
        },
        "verificationStatus": "UNVERIFIED",
        "isFavorited": false,
        "downloadCount": 0,
        "createdAt": "2026-04-01T10:30:00.000Z",
        "updatedAt": "2026-04-01T10:30:00.000Z"
      }
    ]
  }
  ```

- **Scenario: Validation Error (400)**
  ```json
  {
    "success": false,
    "message": "Validation Error",
    "errorMessages": [
      {
        "path": "limit",
        "message": "Number must be less than or equal to 50"
      }
    ]
  }
  ```

---

### 3.2 Get Cards Stats

```
GET /preference-cards/stats
Auth: Bearer {{accessToken}}
```

> Home screen-e stats dekhate use hoy. Total public cards ebong user-er nijer cards er count return kore.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getStats`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `getCountsForCards`

**Business Logic (`getCountsForCards`):**
- `Promise.all` use kore parallel-vabe database query run kora hoy.
- Total published cards-er count (`AllCardsCount`) ebong current user-er create kora cards-er count (`myCardsCount`) calculate kora hoy.
- Accurate counts return kora hoy jate dashboard stats update thake.

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Card statistics retrieved successfully",
    "data": {
      "publicCards": 120,
      "myCards": 15
    }
  }
  ```

---

### 3.3 Fetch Distinct Specialties

```
GET /preference-cards/specialties
Auth: Bearer {{accessToken}}
```

> Filter dropdown-e dynamic specialty options dekhate backend theke shob published card-er unique specialties fetch korar jonno. Eta json format-e ekta array of strings return kore.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getSpecialties`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `getDistinctSpecialtiesFromDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Specialties retrieved successfully",
    "data": [
      "Cardiology",
      "General",
      "Neurology",
      "Orthopedics",
      "Pediatrics"
    ]
  }
  ```

---

### 3.4 Create Preference Card

```
POST /preference-cards
Content-Type: multipart/form-data
Auth: Bearer {{accessToken}} (USER)
```

> Notun preference card create kore. `cardTitle` ar `surgeon` required — baki fields optional (draft save korar jonno). `published: true` set korle shob required fields thakte hobe. Supplies/Sutures e ObjectId ba plain name duita-i pathano jay — name dile backend auto-create kore catalog e.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `createCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `createPreferenceCardInDB`

**Business Logic (`createPreferenceCardInDB`):**
- **Draft Support**: Schema level-e long-form fields optional thakai incomplete card draft hisebe save kora jay.
- **Publish Validation**: Jodi `published: true` pathano hoy, tobe `medication`, `instruments`, `workflow` ityadi required fields fill-up kora ache kina ta verify kora hoy.
- **Auto-Cataloging**: Supplies ebong Sutures-er field-e jodi notun name pawa jay, tobe backend automatically segulo respective catalog-e insert kore.
- **Ownership**: `createdBy` field-e current user-er ID set kora hoy.

**Middleware chain**: `auth(USER) → fileHandler(photoLibrary max 5) → parseBody → validateRequest`

**Request Body:**
```json
{
  "cardTitle": "Knee Arthroscopy",
  "surgeon": {
    "fullName": "Dr. Smith",
    "handPreference": "Right",
    "specialty": "Orthopedics",
    "contactNumber": "+1234567890",
    "musicPreference": "Classical"
  },
  "medication": "Lidocaine with Epinephrine",
  "supplies": [
    { "name": "Sterile Gauze", "quantity": 10 },
    { "name": "Surgical Drape", "quantity": 2 }
  ],
  "sutures": [
    { "name": "3-0 Vicryl", "quantity": 1 }
  ],
  "instruments": "Standard arthroscopy set",
  "positioningEquipment": "Leg holder",
  "prepping": "Betadine",
  "workflow": "Incision, portal placement, joint inspection...",
  "keyNotes": "Be careful with the ACL",
  "published": false
}
```

> `photoLibrary` file upload e pathate hoy — form field name `photoLibrary`, max 5 files.
> `supplies` ar `sutures` JSON string hisebe pathate hoy multipart e.

#### Responses

- **Scenario: Success (201)**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Preference card created",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "cardTitle": "Knee Arthroscopy",
      "surgeon": {
        "fullName": "Dr. Smith",
        "handPreference": "Right",
        "specialty": "Orthopedics",
        "contactNumber": "+1234567890",
        "musicPreference": "Classical"
      },
      "medication": "Lidocaine with Epinephrine",
      "supplies": [
        { "supply": "664a1b2c3d4e5f6a7b8c9d10", "quantity": 10 },
        { "supply": "664a1b2c3d4e5f6a7b8c9d11", "quantity": 2 }
      ],
      "sutures": [
        { "suture": "664b2c3d4e5f6a7b8c9d1a0e", "quantity": 1 }
      ],
      "instruments": "Standard arthroscopy set",
      "positioningEquipment": "Leg holder",
      "prepping": "Betadine",
      "workflow": "Incision, portal placement, joint inspection...",
      "keyNotes": "Be careful with the ACL",
      "photoLibrary": [],
      "published": false,
      "verificationStatus": "UNVERIFIED",
      "downloadCount": 0,
      "createdBy": "664a1b2c3d4e5f6a7b8c0001",
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-15T10:30:00.000Z"
    }
  }
  ```

- **Scenario: Publish without required fields (400)**
  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "Cannot publish — missing required fields: medication, instruments, supplies"
  }
  ```

---

### 3.5 Get Card Details

```
GET /preference-cards/:cardId
Auth: Bearer {{accessToken}} (USER)
```

> Card-er shob details (surgeon, supplies, sutures, workflow, etc.) fetch korar jonno.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `getById`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `getPreferenceCardByIdFromDB`

**Business Logic (`getPreferenceCardByIdFromDB`):**
- **Authorization**: Private (unpublished) card shudhu owner ba SUPER_ADMIN access korte pare.
- **Data Enrichment**: Supplies ebong Sutures populate kore details return kora hoy.
- **Flattening**: Data-ke flatten kora hoy jate UI-te map kora shohoj hoy.

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Preference card details fetched",
    "data": {
      "id": "664a1b2c3d4e5f6a7b8c9d0e",
      "cardTitle": "Knee Arthroscopy",
      "surgeon": {
        "fullName": "Dr. Smith",
        "handPreference": "Right",
        "specialty": "Orthopedics",
        "contactNumber": "+1234567890",
        "musicPreference": "Classical"
      },
      "medication": "Lidocaine with Epinephrine",
      "supplies": [
        { "name": "Sterile Gauze", "quantity": 10 },
        { "name": "Suture Pack", "quantity": 2 }
      ],
      "sutures": [
        { "name": "3-0 Vicryl", "quantity": 1 }
      ],
      "instruments": "Standard arthroscopy set",
      "positioningEquipment": "Leg holder",
      "prepping": "Betadine",
      "workflow": "Incision, portal placement, joint inspection...",
      "keyNotes": "Be careful with the ACL",
      "photoLibrary": [
        "https://res.cloudinary.com/demo/image/upload/sample.jpg"
      ],
      "verificationStatus": "VERIFIED",
      "downloadCount": 15,
      "isFavorited": true
    }
  }
  ```

- **Scenario: Not Found (404)**
  ```json
  {
    "success": false,
    "statusCode": 404,
    "message": "Preference card not found"
  }
  ```

- **Scenario: Forbidden (403)**
  ```json
  {
    "success": false,
    "statusCode": 403,
    "message": "Not authorized to access this card"
  }
  ```

---

### 3.6 Update Preference Card

```
PATCH /preference-cards/:cardId
Content-Type: multipart/form-data
Auth: Bearer {{accessToken}} (USER)
```

> Existing card update kore. Shudhu je fields change korte chay segula pathale hobe. Owner ba SUPER_ADMIN chara update possible na.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `updateCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `updatePreferenceCardInDB`

**Business Logic (`updatePreferenceCardInDB`):**
- **Ownership Check**: Shudhu card owner ba SUPER_ADMIN update korte pare.
- **Verification Reset**: Jodi card-er critical fields update kora hoy, tobe verification status automatically `UNVERIFIED` state-e back kore (moderation maintain korar jonno).
- **Photo Management**: Notun photos upload hole `photoLibrary` array-te append kora hoy.

**Middleware chain**: `auth(USER) → fileHandler(photoLibrary max 5) → parseBody → validateRequest`

**Request Body (partial):**
```json
{
  "cardTitle": "Updated Knee Arthroscopy",
  "medication": "Updated medication info",
  "published": true
}
```

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Preference card updated",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "cardTitle": "Updated Knee Arthroscopy",
      "published": true,
      "verificationStatus": "UNVERIFIED",
      "updatedAt": "2026-03-16T08:00:00.000Z"
    }
  }
  ```

- **Scenario: Not Found (404)**
  ```json
  {
    "success": false,
    "statusCode": 404,
    "message": "Preference card not found"
  }
  ```

- **Scenario: Forbidden (403)**
  ```json
  {
    "success": false,
    "statusCode": 403,
    "message": "Not authorized to update this card"
  }
  ```

---

### 3.7 Delete Preference Card

```
DELETE /preference-cards/:cardId
Auth: Bearer {{accessToken}} (USER or SUPER_ADMIN)
```

> Card permanently delete kore. Owner ba SUPER_ADMIN chara delete possible na. Hard delete — restore possible na. Admin-o ei endpoint use kore manually card delete korte pare.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `deleteCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `deletePreferenceCardFromDB`

**Business Logic (`deletePreferenceCardFromDB`):**
- **Authorization**: Record existence check kora hoy ebong owner ba SUPER_ADMIN check kora hoy.
- **Hard Delete**: `findByIdAndDelete` use kore record permanent delete kora hoy.

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Preference card deleted",
    "data": {
      "deleted": true
    }
  }
  ```

- **Scenario: Not Found (404)**
  ```json
  {
    "success": false,
    "statusCode": 404,
    "message": "Preference card not found"
  }
  ```

- **Scenario: Forbidden (403)**
  ```json
  {
    "success": false,
    "statusCode": 403,
    "message": "Not authorized to delete this card"
  }
  ```

---

### 3.8 Favorite a Card

```
PUT /preference-cards/favorites/cards/:cardId
Auth: Bearer {{accessToken}}
```

> Card favorite list-e add korar jonno. Idempotent behaviour follow kore (already favorite thakle 200 OK return kore).

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `favoriteCard`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `favoritePreferenceCardInDB`

**Business Logic (`favoritePreferenceCardInDB`):**
- Card existence check kora hoy; na thakle `NOT_FOUND` error throw kore.
- Card-ti soft-deleted (`isDeleted: true`) hole `GONE` (410) ashe.
- Visibility check: Private card hole shudhu creator favorite korte pare.
- Unique index on `(userId, cardId)` use kore idempotency ensure kora hoy. Already favorited thakle silently success return kore.

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Preference card favorited",
    "data": { "favorited": true }
  }
  ```

---

### 3.9 Unfavorite a Card

```
DELETE /preference-cards/favorites/cards/:cardId
Auth: Bearer {{accessToken}}
```

> Favorite list theke remove korar jonno. Idempotent behaviour follow kore (already unfavorited thakle-o 200 OK return kore).

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `unfavoriteCard`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `unfavoritePreferenceCardInDB`

**Business Logic (`unfavoritePreferenceCardInDB`):**
- Card existence check kora hoy.
- Specific `userId` ebong `cardId` matching record favorite collection theke remove kora hoy.

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Preference card unfavorited",
    "data": { "favorited": false, "deletedCount": 1 }
  }
  ```

---

### 3.10 Download Preference Card

```
POST /preference-cards/:cardId/download
Auth: Bearer {{accessToken}}
```

> Card download count increment kore ebong download history log kore.

**Business Logic (`downloadPreferenceCardInDB`):**
- **Idempotency**: Same user same card ek-i dine bar bar download korle shudhu matro ekta download count increment kora hoy (Spam control).
- **Atomic Increment**: Log success hole `$inc` operator use kore atomicity maintain kora hoy.

---

### 3.11 Admin Verification

```
PATCH /preference-cards/:cardId
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
Body: { "verificationStatus": "VERIFIED" | "UNVERIFIED" }
```

**Business Logic (`updateVerificationStatusInDB`):**
- Card publishable state-e thaklei shudhu verify kora jay.
- Status change hole original owner notification pabe (implemented via Event/Notification logic).

---

## Common errors

For cross-cutting responses (401 Unauthorized, 402/403 Plan Required, 429 Rate Limit, 400 Validation), see [Common Error Scenarios in modules/README.md](./README.md#common-error-scenarios).

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 3.1 | `/preference-cards` | `GET` | Bearer | Done | List cards (public/private via `visibility` param) — also used for admin moderation |
| 3.2 | `/preference-cards/stats` | `GET` | Bearer | Done | Stats (BOLA safe) |
| 3.3 | `/preference-cards/specialties` | `GET` | Bearer | Done | Distinct specialties for filter dropdown |
| 3.4 | `/preference-cards` | `POST` | Bearer | Done | Create card (multipart, draft/publish) |
| 3.5 | `/preference-cards/:cardId` | `GET` | Bearer | Done | Get full details of a card |
| 3.6 | `/preference-cards/:cardId` | `PATCH` | Bearer | Done | Update card (partial, owner/admin) |
| 3.7 | `/preference-cards/:cardId` | `DELETE` | Bearer | Done | Hard delete (owner/admin) |
| 3.8 | `/preference-cards/favorites/cards/:cardId` | `PUT` | Bearer | Done | Add to favorites (Idempotent) |
| 3.9 | `/preference-cards/favorites/cards/:cardId` | `DELETE` | Bearer | Done | Remove from favorites (Idempotent) |
| 3.10 | `/preference-cards/:cardId/download` | `POST` | Bearer | Done | Increment downloads |
| 3.11 | `/preference-cards/:cardId` (`{ verificationStatus }` body) | `PATCH` | SUPER_ADMIN | Contract Done · Code Pending | Unified verify/reject per D8. Code currently uses `/:cardId/status` — refactor in progress. |
