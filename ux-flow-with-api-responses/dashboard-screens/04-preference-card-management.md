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
6. Admin kono "UNVERIFIED" card review kore "Approve" button click kore → `PATCH /preference-cards/:cardId/approve` (→ 4.2)
7. Card-er status "VERIFIED" hoye jay ebong system notification trigger hoy.
8. Admin jodi card-ti reject korte chay, "Reject" button click kore → `PATCH /preference-cards/:cardId/reject` (→ 4.3)
9. Card delete korar proyojon hole delete action click kore → `DELETE /preference-cards/:cardId` (→ 4.4)

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

### 4.2 Approve Preference Card
```http
PATCH /preference-cards/:cardId/approve
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Card-er content review korar por admin card-ti verify (Approve) kore. Service layer e data completeness check kora hoy.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `approveCard`

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card approved",
  "data": {
    "verificationStatus": "VERIFIED"
  }
}
```

---

### 4.3 Reject Preference Card
```http
PATCH /preference-cards/:cardId/reject
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Card-er status "UNVERIFIED" set kore (Reject action).

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `rejectCard`

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card rejected",
  "data": {
    "verificationStatus": "UNVERIFIED"
  }
}
```

---

### 4.4 Delete Preference Card (Admin)
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
| 4.2 | `PATCH /preference-cards/:cardId/approve` | ✅ Done | Completeness logic applied |
| 4.3 | `PATCH /preference-cards/:cardId/reject` | ✅ Done | ID validation included |
| 4.4 | `DELETE /preference-cards/:cardId` | ✅ Done | Hard delete by Admin |
