# Screen 4: Library

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Home](./02-home.md) (Quick access), [Preference Card Details](./03-preference-card-details.md) (Navigation from list)

## UX Flow

### Library Initial Load
1. User "Library" icon tap kore.
2. Screen immediately skeleton UI dekhay (3–4 card placeholder).
3. `GET /preference-cards?visibility=public` API call hoy (→ 4.1).
   - Success → skeleton replace hoy real cards diye.
   - Error → "Couldn't load cards. Check your connection." + Retry button.
4. Screen render:
   - Sticky top-e Search bar (placeholder: "Search cards, surgeons, medications...").
   - Search bar-er niche Filter button (active filter thakle badge: "Filter (2)") + Sort dropdown.
   - Tab switcher: Preference Cards | Private Cards (count badge).
   - Card list.

### Search
1. User search bar-e type kore.
2. 350ms debounce → API call with `searchTerm`.
3. Type korar somoy skeleton dekhay.
4. Result ashle replace. Empty hole "No cards found" illustration.
5. Search clear korle original list restore hoy.

### Filtering
1. User Filter button tap kore → Bottom sheet opens.
2. Bottom sheet open hobar shathe shathe (ba aagei load kora) `GET /preference-cards/specialties` API call trigger hoy dynamic options load korar jonno (→ 4.2a).
3. Bottom sheet-e:
   - Specialty picker (single select dynamic list).
   - Verified Only toggle.
   - Cancel (discard) | Apply (trigger API) buttons.
4. Apply tap → Bottom sheet close → skeleton → results.
5. Filter icon-e active count badge dekhay.
6. Active filter pill(s) search bar-er niche dekhate paro (swipeable, X tap kore individual filter remove).

### Tab Switching
1. Public → Private tap korle:
   - Public tab-er filter+search state PRESERVE hoy.
   - Private tab-er last state restore hoy (fresh load first time).
   - Skeleton dekhay → `GET /preference-cards?visibility=private` (→ 4.2).
   - Empty hole (no cards yet): "You haven't created any cards yet" + "Create Card" CTA.
   - Empty search result: "No matching private cards".
2. Private → Public: Public-er preserved state restore hoy.

### Card Actions (List View)
1. User kono card-er favorite icon toggle korle:
   - Jodi favorite kora na thake: `PUT /preference-cards/favorites/cards/:cardId` (→ 4.3)
   - Jodi already favorite thake: `DELETE /preference-cards/favorites/cards/:cardId` (→ 4.4)
2. User card theke download icon tap korle:
   - Backend-e count update hoy: `POST /preference-cards/:cardId/download` (→ 4.5).
   - Local device-e card PDF/image save hoy.

### Error States (all tabs)
- Network failure: "Couldn't load cards. Check your connection." + Retry.
- Server error: "Something went wrong. Please try again." + Retry.
- Timeout (>10s): Same as network error.

## Edge Cases & Scenarios

### 1. Happy Path (Success)
- **Public List**: `200 OK` with `data: [...]` and standard `meta`.
- **Search Result**: Keyword match hole accuracy-r shathe list dekhay.
- **Filtering**: Specialty ba verified filter apply hole filtered data ashe.

### 2. No Data (Empty States)
- **No Cards Found**: Jodi search ba filter query-r shathe kisu match na kore, tahole `200 OK` return hobe kintu `data: []` ebong `meta.total: 0` thakbe. (Frontend-e "No cards match your filter" illustration dekhabe).
- **Empty Library**: User-er jodi kono nijer card (Private) na thake, tab switch korle empty array asbe.

### 3. Authentication & Security (Hardened)
- **Session Expired (401)**: Access token invalid ba expire hole standardized 401 problem details response asbe.
- **BOLA Protection (403)**: User jodi query-te onno karow private card access korar cheshta kore (e.g., specific ID lookup in library context), tahole Forbidden asbe.

### 4. Technical Constraints
- **Validation Error (400)**: Jodi input query-te error thake (e.g., `limit > 50`, `page` negative, field length `> 100`), tahole Zod validation error message pathabe path shoho.
- **Rate Limit (429)**: Public cards search-e jodi user 1 minute-e 60 bar-er beshi request pathay, tahole rate limit trigger hobe.

---

<!-- ══════════════════════════════════════ -->
<!--           PUBLIC CARDS LIST              -->
<!-- ══════════════════════════════════════ -->

### 4.1 List Public Preference Cards

```
GET /preference-cards?visibility=public&searchTerm=keyword&surgeonSpecialty=Orthopedics&verificationStatus=VERIFIED
Auth: Bearer {{accessToken}}
```

> Library-r "Preference Cards" tab-e shob public cards search ebong filter korar jonno.

**Query Parameters:**
- `searchTerm`: Search by card title, surgeon name, or medication.
- `surgeonSpecialty`: Filter by surgeon's specialty.
- `verificationStatus`: Filter by `VERIFIED` or `UNVERIFIED`.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listPublicPreferenceCardsFromDB`

#### Responses

- **Scenario: Success (200)**
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

<!-- ══════════════════════════════════════ -->
<!--           PRIVATE CARDS LIST             -->
<!-- ══════════════════════════════════════ -->

### 4.2 List Private Preference Cards

```
GET /preference-cards?visibility=private&searchTerm=keyword&surgeonSpecialty=General
Auth: Bearer {{accessToken}}
```

> Library-r "Private Cards" tab-e user-er nijer create kora private cards search ebong filter korar jonno.

**Query Parameters:**
- `visibility=private`: Required to get private cards.
- `searchTerm`: Search by card title, surgeon name, or medication.
- `surgeonSpecialty`: Filter by surgeon's specialty.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listPrivatePreferenceCardsForUserFromDB`

#### Responses

- **Scenario: Success (200)**
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

---

<!-- ══════════════════════════════════════ -->
<!--         SPECIALTIES DROPDOWN             -->
<!-- ══════════════════════════════════════ -->

### 4.2a Fetch Distinct Specialties

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

<!-- ══════════════════════════════════════ -->
<!--           CARD ACTIONS                   -->
<!-- ══════════════════════════════════════ -->

### 4.3 Favorite a Card

```
PUT /preference-cards/favorites/cards/:cardId
Auth: Bearer {{accessToken}}
```

> Card favorite list-e add korar jonno. Idempotent behaviour follow kore (already favorite thakle 200 OK return kore).

#### Responses
- **Scenario: Success (200)**: `{ "success": true, "message": "Preference card favorited", "data": { "favorited": true } }`

---

### 4.4 Unfavorite a Card

```
DELETE /preference-cards/favorites/cards/:cardId
Auth: Bearer {{accessToken}}
```

> Favorite list theke remove korar jonno. Idempotent behaviour follow kore (already unfavorited thakle-o 200 OK return kore).

#### Responses
- **Scenario: Success (200)**: `{ "success": true, "message": "Preference card unfavorited", "data": { "favorited": false, "deletedCount": 1 } }`

---

### 4.5 Download a Card

```
POST /preference-cards/:cardId/download
Auth: Bearer {{accessToken}}
```

> Card download-er sonkhya (Download Count) 1 baranor jonno.

#### Responses
- **Scenario: Success (200)**: `{ "success": true, "message": "Download count incremented", "data": { "downloadCount": 16 } }`

---

<!-- ══════════════════════════════════════ -->
<!--           ERROR SCENARIOS               -->
<!-- ══════════════════════════════════════ -->

### 4.6 Standard Error Scenarios (Shared)

#### Scenario: Unauthorized (401)
```json
{
  "type": "https://api.tbsosick.com/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Your session has expired. Please log in again to continue.",
  "code": "UNAUTHORIZED",
  "request_id": "req-xyz789"
}
```

#### Scenario: Rate Limit (429)
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## API Status

| # | Method | Endpoint | Description | Auth | Role | Status |
|---|:---:|---|---|:---:|:---:|:---:|
| 4.1 | `GET` | `/preference-cards` | List cards (public or private via `visibility` param) | Bearer | student | ✅ Done |
| 4.2 | `GET` | `/preference-cards/specialties` | Fetch all distinct specialties for filter dropdown | Bearer | student | ✅ Done |
| 4.3 | `GET` | `/preference-cards/:cardId` | Single card detail (Refer to Screen 3) | Bearer | student | ✅ Done |
| 4.4 | `PUT` | `/preference-cards/favorites/cards/:cardId` | Add card to favorites | Bearer | student | ✅ Done |
| 4.5 | `DELETE` | `/preference-cards/favorites/cards/:cardId` | Remove card from favorites | Bearer | student | ✅ Done |
| 4.6 | `POST` | `/preference-cards/:cardId/download` | Increment download count | Bearer | student | ✅ Done |
| 4.7 | `Shared Errors` | `401, 400, 429` | Handled across all requests | - | - | ✅ Done |
