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
6. Admin kono card review kore verification status change korte pare (Approve hole status "VERIFIED" hoy, Reject hole "UNVERIFIED") → `PATCH /preference-cards/:cardId/status` (→ 4.2)
7. Status update hole system notification trigger hoy ebong front-end list sync hoy.
8. Card delete korar proyojon hole delete action click kore → `DELETE /preference-cards/:cardId` (→ 4.3)

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Approve Draft** | Draft card (published: false) approve korte chaile route allow kore kintu business logic completeness (medication, etc.) check kore check kore service layer e 400 error return korbe. |
| **Invalid Card ID** | PATCH/DELETE request e non-existent ID dile 404 Not Found ashe. |
| **Unauthorized Access** | USER role theke approve/reject attempt korle 403 Forbidden return kore. |

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
PATCH /preference-cards/:cardId/status
Content-Type: application/json
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Card review korar por admin status update kore. `VERIFIED` (Approve) korar somoy completeness logic apply hoy. `UNVERIFIED` (Reject) kora holeo card record delete hoy na.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `updateVerificationStatus`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `updateVerificationStatusInDB`

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

---

### 4.3 Delete Preference Card (Admin)
```http
DELETE /preference-cards/:cardId
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Admin manually kono card permanent-ly delete korte pare.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `deleteCard`

---

## API Status

| # | Endpoint | Status | Notes |
| :--- | :--- | :---: | :--- |
| 4.1 | `GET /preference-cards` | ✅ Done | Aggregated list for moderation |
| 4.2 | `PATCH /preference-cards/:cardId/status` | ✅ Done | Unified Approve/Reject endpoint |
| 4.3 | `DELETE /preference-cards/:cardId` | ✅ Done | Hard delete by Admin |
