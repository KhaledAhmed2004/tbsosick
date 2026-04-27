# Screen 4: Preference Card Management

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Overview](./02-overview.md) (Card metrics)

## UX Flow

### Card Moderation & Management Flow

1. Admin sidebar theke "Preference Card Management" module e click kore.
2. Page load e shob public preference card fetch hoy → `GET /preference-cards?visibility=public` (→ 4.1)
3. Admin search bar use kore card title ba surgeon name search kore → `GET /preference-cards?searchTerm=Cardiology` (→ 4.1)
4. Admin filters use kore verified ba unverified card dekhte pare.
5. Card table render hoy: Card Title, Surgeon Name, Specialty, Verification Status, Creation Date dekhay.
6. Admin kono card review kore verification status change korte pare (Approve hole status "VERIFIED" hoy, Reject hole "UNVERIFIED") → `PATCH /preference-cards/:cardId` body `{ "verificationStatus": "VERIFIED" | "UNVERIFIED" }` (→ 4.2)
7. Admin chaile kono card favorite list e add korte pare → `PUT /preference-cards/favorites/cards/:cardId` (→ 4.4)
8. Admin chaile favorite list theke remove korte pare → `DELETE /preference-cards/favorites/cards/:cardId` (→ 4.4)
9. Status update hole system notification trigger hoy ebong front-end list sync hoy.
10. Card delete korar proyojon hole delete action click kore → `DELETE /preference-cards/:cardId` (→ 4.3)

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Approve Draft** | Draft card (published: false) approve korte chaile route allow kore kintu business logic completeness (medication, etc.) check kore check kore service layer e 400 error return korbe. |
| **Invalid Card ID** | PATCH/DELETE request e non-existent ID dile 404 Not Found ashe. |
| **Unauthorized Access** | USER role theke approve/reject attempt korle 403 Forbidden return kore. |
| **Already Favorited** | Card already favorite thaka obosthay `PUT` request pathale idempotency maintained thake (200 OK return kore). |
| **Not Favorited** | Card favorite list e na thaka obosthay `DELETE` request pathale 200 OK return kore. |

---

### 4.1 List/Search Preference Cards (Admin View)
```http
GET /preference-cards
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Admin dashboard theke shob preference card list ebong search handle kore.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listPublicPreferenceCardsFromDB`

**Query Parameters:**

| Parameter | Description | Default |
| :--- | :--- | :--- |
| `searchTerm` | Card title, medication, ba surgeon name search | — |
| `specialty` | Filter by specialty | — |
| `page` | Pagination page | `1` |
| `limit` | Pagination limit | `10` |

#### Responses

- **Scenario: Success (200)**
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

---

### 4.2 Update Verification Status (Approve/Reject)
```http
PATCH /preference-cards/:cardId
Content-Type: application/json
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Verification update is a **partial card update** with `verificationStatus` in the body — same endpoint that owners use to edit their card, role-gated to `SUPER_ADMIN` when `verificationStatus` is present (per [D8](../overview.md#appendix-a--decisions-log-v1)). `VERIFIED` (Approve) apply korar somoy completeness logic apply hoy. `UNVERIFIED` (Reject) korlay card record delete hoy na.

> **Code state**: Currently implemented at `PATCH /:cardId/status`. Refactor to the unified `PATCH /:cardId` contract is pending — clients should target the canonical contract documented here.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `updateCard` (post-refactor) / `updateVerificationStatus` (current)
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `updatePreferenceCardInDB` / `updateVerificationStatusInDB`

**Request Body:**
```json
{
  "verificationStatus": "VERIFIED"  // Enum: "VERIFIED" | "UNVERIFIED"
}
```

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
- **Scenario: Forbidden — non-admin sets `verificationStatus` (403)**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Only SUPER_ADMIN can change verification status."
}
```

---

### 4.3 Delete Preference Card (Admin)
```http
DELETE /preference-cards/:cardId
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Admin manually kono card permanent-ly delete korte pare.

---

### 4.4 Favorite/Unfavorite Card (Admin)
```http
PUT/DELETE /preference-cards/favorites/cards/:cardId
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Admin chaile kono card nijer list e favorite kore rakhte pare. Operations gulo idempotent (multiple calls same result dibe).

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `favoriteCard` / `unfavoriteCard`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `favoritePreferenceCardInDB` / `unfavoritePreferenceCardInDB`

---

## API Status

| # | Endpoint | Status | Notes |
| :--- | :--- | :---: | :--- |
| 4.1 | `GET /preference-cards` | ✅ Done | Aggregated list for moderation |
| 4.2 | `PATCH /preference-cards/:cardId` (`{ verificationStatus }` body) | Contract Done · Code Pending | Unified verify/reject per D8. Code currently uses `/:cardId/status` — refactor pending. |
| 4.3 | `DELETE /preference-cards/:cardId` | ✅ Done | Hard delete by Admin |
| 4.4 | `PUT/DELETE /favorites/cards/:cardId` | ✅ Done | Idempotent favorite actions |
