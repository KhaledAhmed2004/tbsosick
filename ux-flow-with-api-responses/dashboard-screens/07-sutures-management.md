# Screen 7: Sutures Management

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Preference Card Management](./04-preference-card-management.md) (card create/edit er somoy sutures select kora hoy)

## UX Flow

### Sutures List View
1. Admin sidebar theke "Sutures" e click kore
2. Page load e sutures list fetch hoy → `GET /sutures` (→ 7.1)
3. Screen render hoy: search bar + sutures table (name, actions)
4. Admin search bar e type korle name diye filter hoy (query param: `searchTerm`)
5. Pagination controls e page/limit change korle re-fetch hoy

### Create Single Suture
1. Admin "Add Suture" button e click kore
2. Modal/form open hoy — name input field
3. Submit → `POST /sutures` (→ 7.2)
4. Success → modal close + list re-fetch
5. Error (duplicate name ba validation fail) → error message dekhabe

### Bulk Create Sutures
1. Admin "Bulk Add" button e click kore
2. Multiple name input field show hoy (add more button shoho)
3. Submit → `POST /sutures/bulk` (→ 7.5)
4. Success → response e createdCount + duplicates list dekhabe
5. Duplicate thakle warning show korbe kon gula already exist kore

### Update Suture
1. Admin kono suture row-er edit icon e click kore
2. Edit modal open hoy current name shoho
3. Name change kore submit → `PATCH /sutures/:sutureId` (→ 7.3)
4. Success → modal close + list re-fetch

### Delete Suture
1. Admin kono suture row-er delete icon e click kore
2. Confirmation dialog show hoy
3. Confirm korle → `DELETE /sutures/:sutureId` (→ 7.4)
4. Success → list theke remove hoy

---

## Edge Cases

- **Duplicate Name**: Create e jodi same name already exist kore, backend error throw korbe.
- **Bulk Duplicates**: Bulk create e duplicate names skip kore — response e `duplicates` array te kon gula skip hoyeche dekhay.
- **Not Found**: Update/Delete e invalid ID hole 404 return korbe.

---

<!-- ══════════════════════════════════════ -->
<!--           SUTURES LIST                   -->
<!-- ══════════════════════════════════════ -->

### 7.1 List Sutures

```
GET /sutures
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Shob sutures paginated list fetch kore. `searchTerm` diye name search kora jay. Preference card create/edit screen eo ei endpoint use hoy catalog load korar jonno.

**Implementation:**
- **Route**: `src/app/modules/sutures/sutures.route.ts`
- **Controller**: `src/app/modules/sutures/sutures.controller.ts` — `listSutures`
- **Service**: `src/app/modules/sutures/sutures.service.ts` — `listSuturesFromDB`

**Query Params:**
- `searchTerm` — name diye search (optional)
- `page` — page number (default: 1)
- `limit` — items per page (default: 10)
- `sortBy` — sort field (optional)
- `sortOrder` — `asc` | `desc` (optional)

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Sutures fetched",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 18,
      "totalPage": 2
    },
    "data": [
      {
        "_id": "664b2c3d4e5f6a7b8c9d1a0e",
        "name": "3-0 Vicryl",
        "createdAt": "2026-03-15T10:30:00.000Z",
        "updatedAt": "2026-03-15T10:30:00.000Z"
      },
      {
        "_id": "664b2c3d4e5f6a7b8c9d1a0f",
        "name": "4-0 Monocryl",
        "createdAt": "2026-03-15T10:30:00.000Z",
        "updatedAt": "2026-03-15T10:30:00.000Z"
      }
    ]
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--           CREATE SUTURE                  -->
<!-- ══════════════════════════════════════ -->

### 7.2 Create Suture

```
POST /sutures
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Single suture create kore. Shudhu `name` field required.

**Implementation:**
- **Route**: `src/app/modules/sutures/sutures.route.ts`
- **Controller**: `src/app/modules/sutures/sutures.controller.ts` — `createSuture`
- **Service**: `src/app/modules/sutures/sutures.service.ts` — `createSutureToDB`

**Request Body:**
```json
{
  "name": "3-0 Vicryl"
}
```

#### Responses

- **Scenario: Success (201)**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Suture created",
    "data": {
      "_id": "664b2c3d4e5f6a7b8c9d1a0e",
      "name": "3-0 Vicryl",
      "isActive": true,
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-15T10:30:00.000Z"
    }
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--           UPDATE SUTURE                  -->
<!-- ══════════════════════════════════════ -->

### 7.3 Update Suture

```
PATCH /sutures/:sutureId
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Suture er name update kore. Shudhu `name` field changeable.

**Implementation:**
- **Route**: `src/app/modules/sutures/sutures.route.ts`
- **Controller**: `src/app/modules/sutures/sutures.controller.ts` — `updateSuture`
- **Service**: `src/app/modules/sutures/sutures.service.ts` — `updateSutureInDB`

**Request Body:**
```json
{
  "name": "4-0 Monocryl"
}
```

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Suture updated",
    "data": {
      "_id": "664b2c3d4e5f6a7b8c9d1a0e",
      "name": "4-0 Monocryl",
      "isActive": true,
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-16T08:00:00.000Z"
    }
  }
  ```

- **Scenario: Not Found (404)**
  ```json
  {
    "success": false,
    "statusCode": 404,
    "message": "Suture not found"
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--           DELETE SUTURE                  -->
<!-- ══════════════════════════════════════ -->

### 7.4 Delete Suture

```
DELETE /sutures/:sutureId
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Suture permanently delete kore. Hard delete — restore possible na.

**Implementation:**
- **Route**: `src/app/modules/sutures/sutures.route.ts`
- **Controller**: `src/app/modules/sutures/sutures.controller.ts` — `deleteSuture`
- **Service**: `src/app/modules/sutures/sutures.service.ts` — `deleteSutureFromDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Suture deleted",
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
    "message": "Suture not found"
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--           BULK CREATE                    -->
<!-- ══════════════════════════════════════ -->

### 7.5 Bulk Create Sutures

```
POST /sutures/bulk
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Multiple sutures ekbar e create kore. Duplicate name skip kore — response e kon gula skip hoyeche dekhay.

**Implementation:**
- **Route**: `src/app/modules/sutures/sutures.route.ts`
- **Controller**: `src/app/modules/sutures/sutures.controller.ts` — `bulkCreate`
- **Service**: `src/app/modules/sutures/sutures.service.ts` — `bulkCreateSuturesToDB`

**Request Body:**
```json
{
  "items": [
    { "name": "3-0 Vicryl" },
    { "name": "4-0 Monocryl" },
    { "name": "2-0 Silk" }
  ]
}
```

#### Responses

- **Scenario: Success — all new (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Sutures created",
    "data": {
      "createdCount": 3,
      "created": [
        { "_id": "664b2c3d4e5f6a7b8c9d1a0e", "name": "3-0 Vicryl" },
        { "_id": "664b2c3d4e5f6a7b8c9d1a0f", "name": "4-0 Monocryl" },
        { "_id": "664b2c3d4e5f6a7b8c9d1a10", "name": "2-0 Silk" }
      ],
      "duplicates": []
    }
  }
  ```

- **Scenario: Success — with duplicates (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Sutures created",
    "data": {
      "createdCount": 1,
      "created": [
        { "_id": "664b2c3d4e5f6a7b8c9d1a10", "name": "2-0 Silk" }
      ],
      "duplicates": ["3-0 Vicryl", "4-0 Monocryl"]
    }
  }
  ```

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 7.1 | `/sutures` | `GET` | SUPER_ADMIN | ✅ Done | Paginated list with search |
| 7.2 | `/sutures` | `POST` | SUPER_ADMIN | ✅ Done | Single suture create |
| 7.3 | `/sutures/:sutureId` | `PATCH` | SUPER_ADMIN | ✅ Done | Update name |
| 7.4 | `/sutures/:sutureId` | `DELETE` | SUPER_ADMIN | ✅ Done | Hard delete |
| 7.5 | `/sutures/bulk` | `POST` | SUPER_ADMIN | ✅ Done | Bulk create with duplicate skip |
