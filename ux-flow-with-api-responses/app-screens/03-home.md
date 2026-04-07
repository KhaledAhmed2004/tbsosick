# Screen 3: Home (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Auth](./01-auth.md) (Login check), [Profile](./02-profile.md) (User data)

## UX Flow

### Home Screen Initial Load
1. User App open kore Home screen-e ashe.
2. Page load-e parallel API calls chole:
   - Card stats (Total available vs User created) → `GET /preference-cards/count` (→ 3.2)
   - Favorite cards list → `GET /preference-cards/favorites` (→ 3.3)
3. Screen render hoy:
   - Top-e Search field dekhay.
   - Tar niche Stats section: "Total Available" ebong "My Created" cards er count.
   - Quick Action floating button ba menu thake.
   - Shobcheye niche "Favorite Preference Cards" er horizontal/vertical list.
   - Favorite section-er header-e "View All" button thake full list dekhar jonno.

### Search Flow
1. User top search bar-e keyword type kore (e.g., surgeon name, card title).
2. Input change hole ba search icon-e tap korle search trigger hoy → `GET /preference-cards/public?searchTerm=keyword` (→ 3.1)
3. Results list show kore. Results na thakle "No cards found" message dekhay.

### Quick Action Flow
1. User "Quick Action" (+) button-e tap kore.
2. Ekta menu/bottom-sheet open hoy jekhane options thake:
   - **Create New Preference Card**: Publicly available card toiri korar jonno navigation.
   - **Create Private Card**: Sudhu nijer dekhar jonno card toiri korar navigation.
3. Kono ekta select korle create screen-e navigate kore → `POST /preference-cards` (→ 3.4) logic trigger hobe create screen complete korle.

### Favorite Management
1. User favorite list theke "View All" button-e tap korle full favorite list screen-e jay.
2. Kono card-e tap korle details-e jay → [Details](./04-preference-card-details.md).
3. Details screen-e favorite icon toggle korle favorite/unfavorite hoy.
4. Success hole home screen-er favorite list update hoy.

---

## Edge Cases

- **No Favorites**: Jodi user-er kono favorite card na thake, tahole "No favorite cards yet" placeholder dekhabe.
- **Search Latency**: Search korar somoy loading skeleton ba spinner dekhano dorkar.
- **Empty Stats**: Jodi user naya hoy ebong kono card na thake, tahole stats-e 0 dekhabe.

---

<!-- ══════════════════════════════════════ -->
<!--              SEARCH & LIST               -->
<!-- ══════════════════════════════════════ -->

### 3.1 Search Preference Cards

```
GET /preference-cards/public?searchTerm=keyword
Auth: Bearer {{accessToken}}
```

> Top search field theke public cards search korar jonno.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `listPublicCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listPublicCards`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Public preference cards retrieved successfully",
    "pagination": { "page": 1, "limit": 10, "total": 50, "totalPage": 5 },
    "data": [
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0e",
        "cardTitle": "Knee Arthroscopy",
        "surgeon": { "name": "Dr. Smith", "specialty": "Orthopedics" },
        "verificationStatus": "VERIFIED"
      }
    ]
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--                STATS                     -->
<!-- ══════════════════════════════════════ -->

### 3.2 Get Cards Count

```
GET /preference-cards/count
Auth: Bearer {{accessToken}}
```

> Home screen-e stats dekhate use hoy. Total public cards ebong user-er nijer cards er count return kore.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `countCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `countCards`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Cards count retrieved successfully",
    "data": {
      "publicCards": 120,
      "myCards": 15
    }
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--              FAVORITES                   -->
<!-- ══════════════════════════════════════ -->

### 3.3 List Favorite Cards

```
GET /preference-cards/favorites
Auth: Bearer {{accessToken}}
```

> Home screen-er niche favorite list dekhate use hoy.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `listFavoriteCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listFavoriteCards`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Favorite preference cards retrieved successfully",
    "data": [
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0f",
        "cardTitle": "Hip Replacement",
        "surgeon": { "name": "Dr. Brown", "specialty": "Orthopedics" }
      }
    ]
  }
  ```

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 3.1 | `/preference-cards/public` | `GET` | Bearer | ✅ Done | Search with `searchTerm` |
| 3.2 | `/preference-cards/count` | `GET` | Bearer | ✅ Done | Stats for Home screen |
| 3.3 | `/preference-cards/favorites` | `GET` | Bearer | ✅ Done | User's favorite cards list |
