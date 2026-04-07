# Screen 2: Home (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Auth](./01-auth.md) (Login check), [Profile](./06-profile.md) (User data), [Preference Card Details](./03-preference-card-details.md) (Card details)

## UX Flow

### Home Screen Initial Load
1. Login successful hole ba app open korle user Home screen-e land kore.
2. Screen load-er shathe shathe parallel API calls trigger hoy:
   - Dashboard stats (Public vs Personal card counts) → `GET /preference-cards/stats` (→ 2.2)
   - User-er curated favorite list → `GET /users/me/favorites` (→ 2.3)
3. UI render hoy:
   - Top section-e Search bar thake quick finding-er jonno.
   - Header-e notification bell icon thake (→ [Notifications](./07-notifications.md)).
   - Tar niche Stats section: "Total Available" ebong "My Created" cards-er accurate count dekhay.
   - Bottom-e Floating Quick Action (+) button thake creation flow trigger korar jonno.
   - Shobcheye niche "Favorite Preference Cards" horizontal list akare user-er bookmark kora cards gulo show kore.

### Search & Discovery Flow
1. User top search bar-e keyword type kore (e.g., surgeon name, card title, procedure).
2. Input change hole ba search icon-e tap korle search trigger hoy → `GET /preference-cards?visibility=public&searchTerm=keyword` (→ 2.1)
3. Matching results list akare niche render hoy. Results na thakle "No cards found" empty state dekhay.

### Quick Actions (Create Card)
1. User bottom-e thaka thaka Floating "+" button-e tap kore.
2. Ekta elegant menu/bottom-sheet pop-up hoy options shoho:
   - **Create Public Card**: Publicly available card toiri korar navigation flow.
   - **Create Private Card**: Sudhu nijer restricted access-er jonno card toiri korar navigation.
3. Kono ekta select korle corresponding creation screen-e navigate kore (Creation flow separate documented).

### Favorite Management
1. User favorite list theke "View All" button-e tap korle full favorite list screen-e navigate kore.
2. List ba details screen theke kono card favorite icon toggle korle:
   - Jodi favorite kora na thake: `POST /preference-cards/:cardId/favorite` (→ 2.4)
   - Jodi already favorite thake: `DELETE /preference-cards/:cardId/favorite` (→ 2.5)
3. Success hole backend update message pathay ebong Home screen-er favorite list refresh hoye naya data dekhay.
4. Kono card-e tap korle full view-te navigate kore → [Details](./03-preference-card-details.md).

---

## Edge Cases

- **No Favorites**: Jodi user-er kono favorite card na thake, tahole "No favorite cards yet" placeholder dekhabe (200 OK + `data: []`).
- **Search Latency**: Search korar somoy loading skeleton ba spinner dekhano dorkar (Rate limited to 60 req/min).
- **Double Tap**: User bishal druto tap korle idempotent endpoints (POST/DELETE) state correct rakhe.

---

<!-- ══════════════════════════════════════ -->
<!--              SEARCH & LIST               -->
<!-- ══════════════════════════════════════ -->

### 2.1 Search Preference Cards

```
GET /preference-cards?visibility=public&searchTerm=keyword
Auth: Bearer {{accessToken}}
```

> Top search field theke public cards search korar jonno.

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
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    },
    "data": [
      {
        "id": "664a1b2c3d4e5f6a7b8c9d0e",
        "cardTitle": "Knee Arthroscopy",
        "surgeon": { "name": "Dr. Smith", "specialty": "Orthopedics" },
        "verificationStatus": "VERIFIED",
        "isFavorited": true
      }
    ]
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--                STATS                     -->
<!-- ══════════════════════════════════════ -->

### 2.2 Get Cards Stats

```
GET /preference-cards/stats
Auth: Bearer {{accessToken}}
```

> Home screen-e stats dekhate use hoy. Total public cards ebong user-er nijer cards er count return kore.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getStats`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `getCountsForCards`

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

<!-- ══════════════════════════════════════ -->
<!--              FAVORITES                  -->
<!-- ══════════════════════════════════════ -->

### 2.3 List Favorite Cards

```
GET /users/me/favorites
Auth: Bearer {{accessToken}}
```

> Home screen-er niche favorite list dekhate use hoy.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getFavoriteCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listFavoritePreferenceCardsForUserFromDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Favorite preference cards retrieved successfully",
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
        "cardTitle": "Hip Replacement",
        "surgeon": { "name": "Dr. Brown", "specialty": "Orthopedics" },
        "isFavorited": true,
        "downloadCount": 12
      }
    ]
  }
  ```

---

### 2.4 Favorite a Card

```
POST /preference-cards/:cardId/favorite
Auth: Bearer {{accessToken}}
```

> Card favorite list-e add korar jonno.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `favoriteCard`

#### Responses
- **Scenario: Success (200)**: `{ "success": true, "message": "Preference card favorited" }`

---

### 2.5 Unfavorite a Card

```
DELETE /preference-cards/:cardId/favorite
Auth: Bearer {{accessToken}}
```

> Favorite list theke remove korar jonno.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `unfavoriteCard`

#### Responses
- **Scenario: Success (200)**: `{ "success": true, "message": "Preference card unfavorited" }`

---

### 2.6 Download a Card

```
POST /preference-cards/:cardId/download
Auth: Bearer {{accessToken}}
```

> Card download-er sonkhya (Download Count) 1 baranor jonno.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `incrementDownloadCount`

#### Responses
- **Scenario: Success (200)**: `{ "success": true, "message": "Download count incremented", "data": { "downloadCount": 13 } }`

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 2.1 | `/preference-cards` | `GET` | Bearer | ✅ Done | Use `visibility=public` query |
| 2.2 | `/preference-cards/stats` | `GET` | Bearer | ✅ Done | Stats (BOLA safe) |
| 2.3 | `/users/me/favorites` | `GET` | Bearer | ✅ Done | Migrated to `/users` module |
| 2.4 | `/preference-cards/:cardId/favorite` | `POST` | Bearer | ✅ Done | Add to favorites |
| 2.5 | `/preference-cards/:cardId/favorite` | `DELETE` | Bearer | ✅ Done | Remove from favorites |
| 2.6 | `/preference-cards/:cardId/download` | `POST` | Bearer | ✅ Done | Increment downloads |
