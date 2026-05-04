# Preference Card Module APIs

> **Section**: Backend API specifications for the preference-card module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)

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
GET /preference-cards?searchTerm=keyword
Auth: Bearer {{accessToken}}
```

> **Primary Search Endpoint**: This is the main API used to search cards.
> 
By default, it returns:
- All **public (published) cards**
- Your **own private cards**
- **Use `visibility=private`**  
  → You get: Only your own private cards 

**Query Parameters:**
- `searchTerm`: (Optional) Search by card title, surgeon name, or medication.
- `visibility`: `public` (Default) or `private` (Only your cards).
- `surgeonSpecialty` / `specialty`: Filter by surgeon's specialty.
- `verificationStatus`: Filter by `VERIFIED` or `UNVERIFIED`.
- `page` / `limit`: Standard pagination.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listPublicPreferenceCardsFromDB` / `listPrivatePreferenceCardsForUserFromDB`

**Business Logic (`listPublicPreferenceCardsFromDB`):**
- **Unified Visibility**: Uses an `$or` query to fetch cards that are either `visibility: 'PUBLIC'` OR `createdBy: authenticatedUser`.
- **Privacy Enforcement**: PRIVATE cards from other users are never returned, even to `SUPER_ADMIN`.
- **Aggregation Pipeline**: MongoDB aggregation is used for efficiency to apply search and filters.
- **Text Search**: Search is performed on `cardTitle`, `surgeon.fullName`, and `medication` fields using a full-text index (`$text`).
- **Specialty Filter**: Exact matching is applied to the `surgeon.specialty` field.
- **Data Flattening**: Supplies and sutures are populated to extract names for easier client-side rendering.
- **Deleted Filter**: Only cards with `isDeleted: false` are returned.

**Business Logic (`listPrivatePreferenceCardsForUserFromDB`):**
- `QueryBuilder` is used to fetch the user's own cards (both PUBLIC and PRIVATE).
- A `createdBy: userId` and `isDeleted: false` filter is applied to maintain privacy and exclude deleted items.
- Results are strictly scoped to the authenticated user.

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

> Used to show stats on the Home screen. Returns counts for total public cards and the user's own cards.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getStats`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `getCountsForCards`

**Business Logic (`getCountsForCards`):**
- Database queries are run in parallel using `Promise.all`.
- The count of total published cards (`AllCardsCount`) and the count of cards created by the current user (`myCardsCount`) are calculated.
- Accurate counts are returned to keep dashboard stats updated.

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

> use case: its used to populate the filter dropdown dynamically.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getSpecialties`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `getDistinctSpecialtiesFromDB`

**Business Logic (`getDistinctSpecialtiesFromDB`):**
- **Unified Discovery**: Fetches unique specialties from all cards that are either `published: true` or created by the current user. This ensures the filter dropdown shows relevant options for both public content and the user's private drafts.
- **Data Cleanup**: Filters out any null or empty values using `filter(Boolean)`.
- **User Experience**: Sorts the list alphabetically to ensure a consistent and predictable dropdown order in the UI.

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

> use case: User Creates a new preference card.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `createCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `createPreferenceCardInDB`

**Business Logic (`createPreferenceCardInDB`):**
- **Draft Support**: Long-form fields are optional at the schema level, allowing incomplete cards to be saved as `PRIVATE` drafts.
- **Publish Validation**: If `visibility: 'PUBLIC'` is sent, the system verifies whether required fields like `medication`, `instruments`, `workflow`, etc., are filled.
- **Auto-Cataloging**: If new names are found in the Supplies and Sutures fields, the backend automatically inserts them into their respective catalogs.
- **Ownership**: The current user's ID is set in the `createdBy` field.

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
  "visibility": "PRIVATE"
}
```

> Upload `photoLibrary` files using the form field name `photoLibrary`, max 5 files.
> Send `supplies` and `sutures` as JSON strings in the multipart form data.

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
      "visibility": "PRIVATE",
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

> Fetches all card details (surgeon, supplies, sutures, workflow, etc.).

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `getById`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `getPreferenceCardByIdFromDB`

**Business Logic (`getPreferenceCardByIdFromDB`):**
- **Authorization**: Private (unpublished) cards can only be accessed by the owner or SUPER_ADMIN.
- **Data Enrichment**: Returns details by populating Supplies and Sutures.
- **Flattening**: Data is flattened for easier mapping in the UI.

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

> Updates an existing card. Only the fields that need changing should be sent. Updates are only possible for the owner or SUPER_ADMIN.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `updateCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `updatePreferenceCardInDB`

**Business Logic (`updatePreferenceCardInDB`):**
- **Ownership Check**: Only the card owner or SUPER_ADMIN can update.
- **Verification Reset**: If critical card fields are updated, the verification status automatically reverts to `UNVERIFIED` (to maintain moderation).
- **Photo Management**: New photos are appended to the `photoLibrary` array upon upload.

**Middleware chain**: `auth(USER) → fileHandler(photoLibrary max 5) → parseBody → validateRequest`

**Request Body (partial):**
```json
{
  "cardTitle": "Updated Knee Arthroscopy",
  "medication": "Updated medication info",
  "visibility": "PUBLIC"
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
      "visibility": "PUBLIC",
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

> Permanently deletes a card. Deletion is only possible for the owner or SUPER_ADMIN. This is a hard delete; restoration is not possible. Admins can also use this endpoint to manually delete cards.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `deleteCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `deletePreferenceCardFromDB`

**Business Logic (`deletePreferenceCardFromDB`):**
- **Authorization**: Checks for record existence and verifies the owner or SUPER_ADMIN.
- **Hard Delete**: The record is permanently deleted using `findByIdAndDelete`.

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

> Adds a card to the favorites list. Follows idempotent behavior (returns 200 OK if already favorited).

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `favoriteCard`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `favoritePreferenceCardInDB`

**Business Logic (`favoritePreferenceCardInDB`):**
- Checks for card existence; throws a `NOT_FOUND` error if it doesn't exist.
- If the card is soft-deleted (`isDeleted: true`), a `GONE` (410) error is returned.
- Visibility check: If it's a private card, only the creator can favorite it.
- Idempotency is ensured using a unique index on `(userId, cardId)`. Returns success silently if already favorited.

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

> Removes from the favorites list. Follows idempotent behavior (returns 200 OK even if already unfavorited).

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `unfavoriteCard`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `unfavoritePreferenceCardInDB`

**Business Logic (`unfavoritePreferenceCardInDB`):**
- Checks for card existence.
- Removes the matching record for the specific `userId` and `cardId` from the favorites collection.

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

> use case: User increments the card download count and logs the download history.

**Business Logic (`downloadPreferenceCardInDB`):**
- **Idempotency**: If the same user downloads the same card multiple times in a single day, the download count is only incremented once (Spam control).
- **Atomic Increment**: The `$inc` operator is used to maintain atomicity upon successful logging.

---

### 3.11 Admin Verification

```
PATCH /preference-cards/:cardId
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
Body: { "verificationStatus": "VERIFIED" | "UNVERIFIED" }
```

> use case: Admin verify or unverify preference cards. 

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `updateVerificationStatus`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `updateVerificationStatusInDB`

**Business Logic (`updateVerificationStatusInDB`):**
- **Authorization**: Role-gated strictly to `SUPER_ADMIN`.
- **State Management**: Updating the status triggers any necessary background events (like notifying the card creator).

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Preference card status updated to VERIFIED",
    "data": {
      "verificationStatus": "VERIFIED"
    }
  }
  ```

- **Scenario: Unauthorized (403)**
  ```json
  {
    "success": false,
    "statusCode": 403,
    "message": "Not authorized to verify/reject this card"
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