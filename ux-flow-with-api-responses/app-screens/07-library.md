# Screen 7: Library

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Home](./03-home.md) (Quick access), [Preference Card Details](./04-preference-card-details.md) (Navigation from list)

## UX Flow

### Library Initial Load
1. User bottom navigation bar theke "Library" icon-e tap kore.
2. Page load-e default "Preference Cards" (Public) tab-er cards fetch hoy → `GET /preference-cards/public` (→ 6.1).
3. Screen render hoy:
   - Top-e Search bar.
   - Niche Filter icon (Specialty, Verified Only toggle).
   - Tab switcher: **Preference Cards** (Publicly available) vs **Private Cards** (User-er nijer create kora).
   - Selected tab-er list items (Title, Surgeon info, Verified status).

### Search & Filtering
1. **Search**: User search bar-e keyword type korle query param pathano hoy (`searchTerm=keyword`).
2. **Filtering**: 
   - User filter icon-e tap kore specialty select kore (`specialty=Orthopedics`).
   - "Verified Only" toggle korle `verificationStatus=VERIFIED` pathano hoy.
3. Apply filter tap korle API trigger hoy.

### Tab Switching
1. **Preference Cards (Public)**: Default tab. Public cards list dekhay → `GET /preference-cards/public` (→ 6.1).
2. **Private Cards**: User ei tab-e tap korle tar nijer create kora cards list ashe → `GET /preference-cards/private` (→ 6.2).
3. Tab change hole search ebong filter reset hoye jay.

---

## Edge Cases

- **No Results**: Filter ba search-er por kono card na thakle "No cards found" illustration dekhabe.
- **Pagination**: List scrolling-er somoy naya data load hobe.

---

<!-- ══════════════════════════════════════ -->
<!--           PUBLIC CARDS LIST              -->
<!-- ══════════════════════════════════════ -->

### 6.1 List Public Preference Cards

```
GET /preference-cards/public?searchTerm=keyword&specialty=Orthopedics&verificationStatus=VERIFIED
Auth: Bearer {{accessToken}}
```

> Library-r "Preference Cards" tab-e shob public cards search ebong filter korar jonno.

**Query Parameters:**
- `searchTerm`: Search by card title, surgeon name, or medication.
- `specialty`: Filter by surgeon's specialty.
- `verificationStatus`: Filter by `VERIFIED` or `UNVERIFIED`.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `listPublicCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listPublicPreferenceCardsFromDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Public cards fetched successfully",
    "pagination": { "page": 1, "limit": 10, "total": 120, "totalPage": 12 },
    "data": [
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0e",
        "cardTitle": "Knee Arthroscopy",
        "surgeonName": "Dr. Smith",
        "surgeonSpecialty": "Orthopedics",
        "isVerified": true,
        "isFavorite": false,
        "totalDownloads": 15,
        "createdAt": "2026-03-15T10:30:00.000Z",
        "updatedAt": "2026-03-15T10:30:00.000Z"
      }
    ]
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--           PRIVATE CARDS LIST             -->
<!-- ══════════════════════════════════════ -->

### 6.2 List Private Preference Cards

```
GET /preference-cards/private?searchTerm=keyword&specialty=General
Auth: Bearer {{accessToken}}
```

> Library-r "Private Cards" tab-e user-er nijer create kora private cards search ebong filter korar jonno.

**Query Parameters:**
- `searchTerm`: Search by card title, surgeon name, or medication.
- `specialty`: Filter by surgeon's specialty.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `listPrivateCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listPrivatePreferenceCardsForUserFromDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Private cards fetched successfully",
    "pagination": { "page": 1, "limit": 10, "total": 5, "totalPage": 1 },
    "data": [
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0f",
        "cardTitle": "My Private Card",
        "surgeonName": "Dr. Own",
        "surgeonSpecialty": "General",
        "isVerified": false,
        "isFavorite": false,
        "totalDownloads": 0,
        "createdAt": "2026-04-01T10:30:00.000Z",
        "updatedAt": "2026-04-01T10:30:00.000Z"
      }
    ]
  }
  ```

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 6.1 | `/preference-cards/public` | `GET` | Bearer | ✅ Done | Filter by specialty and verified status |
| 6.2 | `/preference-cards/private` | `GET` | Bearer | ✅ Done | User's private cards with search/filter |
