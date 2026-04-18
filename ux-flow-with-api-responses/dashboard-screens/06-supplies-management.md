# Screen 6: Supplies Management

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Preference Card Management](./04-preference-card-management.md) (card create/edit er somoy supplies select kora hoy)

## UX Flow

### Supplies List View
1. Admin sidebar theke "Supplies" e click kore
2. Page load e supplies list fetch hoy → `GET /supplies` (→ 6.1)
3. Screen render hoy: search bar + supplies table (name, actions)
4. Admin search bar e type korle name diye filter hoy (query param: `searchTerm`)
5. Pagination controls e page/limit change korle re-fetch hoy

### Create Single Supply
1. Admin "Add Supply" button e click kore
2. Modal/form open hoy — name input field
3. Submit → `POST /supplies` (→ 6.2)
4. Success → modal close + list re-fetch
5. Error (duplicate name ba validation fail) → error message dekhabe

### Bulk Create Supplies
1. Admin "Bulk Add" button e click kore
2. Multiple name input field show hoy (add more button shoho)
3. Submit → `POST /supplies/bulk` (→ 6.5)
4. Success → response e createdCount + duplicates list dekhabe
5. Duplicate thakle warning show korbe kon gula already exist kore

### Update Supply
1. Admin kono supply row-er edit icon e click kore
2. Edit modal open hoy current name shoho
3. Name change kore submit → `PATCH /supplies/:supplyId` (→ 6.3)
4. Success → modal close + list re-fetch

### Delete Supply
1. Admin kono supply row-er delete icon e click kore
2. Confirmation dialog show hoy
3. Confirm korle → `DELETE /supplies/:supplyId` (→ 6.4)
4. Success → list theke remove hoy

---

## Edge Cases

- **Duplicate Name**: Create e jodi same name already exist kore, backend error throw korbe.
- **Bulk Duplicates**: Bulk create e duplicate names skip kore — response e `duplicates` array te kon gula skip hoyeche dekhay.
- **Not Found**: Update/Delete e invalid ID hole 404 return korbe.

---

<!-- ══════════════════════════════════════ -->
<!--           SUPPLIES LIST                  -->
<!-- ══════════════════════════════════════ -->

### 6.1 List Supplies

```
GET /supplies
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Shob supplies paginated list fetch kore. `searchTerm` diye name search kora jay. Preference card create/edit screen eo ei endpoint use hoy catalog load korar jonno.

**Implementation:**
- **Route**: `src/app/modules/supplies/supplies.route.ts`
- **Controller**: `src/app/modules/supplies/supplies.controller.ts` — `listSupplies`
- **Service**: `src/app/modules/supplies/supplies.service.ts` — `listSuppliesFromDB`

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
    "message": "Supplies fetched",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPage": 3
    },
    "data": [
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0e",
        "name": "Sterile Gauze",
        "createdAt": "2026-03-15T10:30:00.000Z",
        "updatedAt": "2026-03-15T10:30:00.000Z"
      },
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0f",
        "name": "Surgical Drape",
        "createdAt": "2026-03-15T10:30:00.000Z",
        "updatedAt": "2026-03-15T10:30:00.000Z"
      }
    ]
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--           CREATE SUPPLY                  -->
<!-- ══════════════════════════════════════ -->

### 6.2 Create Supply

```
POST /supplies
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Single supply create kore. Shudhu `name` field required.

**Implementation:**
- **Route**: `src/app/modules/supplies/supplies.route.ts`
- **Controller**: `src/app/modules/supplies/supplies.controller.ts` — `createSupply`
- **Service**: `src/app/modules/supplies/supplies.service.ts` — `createSupplyToDB`

**Request Body:**
```json
{
  "name": "Sterile Gauze"
}
```

#### Responses

- **Scenario: Success (201)**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Supply created",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "Sterile Gauze",
      "isActive": true,
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-15T10:30:00.000Z"
    }
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--           UPDATE SUPPLY                  -->
<!-- ══════════════════════════════════════ -->

### 6.3 Update Supply

```
PATCH /supplies/:supplyId
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Supply er name update kore. Shudhu `name` field changeable.

**Implementation:**
- **Route**: `src/app/modules/supplies/supplies.route.ts`
- **Controller**: `src/app/modules/supplies/supplies.controller.ts` — `updateSupply`
- **Service**: `src/app/modules/supplies/supplies.service.ts` — `updateSupplyInDB`

**Request Body:**
```json
{
  "name": "Updated Gauze Name"
}
```

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Supply updated",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "Updated Gauze Name",
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
    "message": "Supply not found"
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--           DELETE SUPPLY                  -->
<!-- ══════════════════════════════════════ -->

### 6.4 Delete Supply

```
DELETE /supplies/:supplyId
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Supply permanently delete kore. Hard delete — restore possible na.

**Implementation:**
- **Route**: `src/app/modules/supplies/supplies.route.ts`
- **Controller**: `src/app/modules/supplies/supplies.controller.ts` — `deleteSupply`
- **Service**: `src/app/modules/supplies/supplies.service.ts` — `deleteSupplyFromDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Supply deleted",
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
    "message": "Supply not found"
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--           BULK CREATE                    -->
<!-- ══════════════════════════════════════ -->

### 6.5 Bulk Create Supplies

```
POST /supplies/bulk
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Multiple supplies ekbar e create kore. Duplicate name skip kore — response e kon gula skip hoyeche dekhay.

**Implementation:**
- **Route**: `src/app/modules/supplies/supplies.route.ts`
- **Controller**: `src/app/modules/supplies/supplies.controller.ts` — `bulkCreate`
- **Service**: `src/app/modules/supplies/supplies.service.ts` — `bulkCreateSuppliesToDB`

**Request Body:**
```json
{
  "items": [
    { "name": "Sterile Gauze" },
    { "name": "Surgical Drape" },
    { "name": "Suction Tip" }
  ]
}
```

#### Responses

- **Scenario: Success — all new (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Supplies created",
    "data": {
      "createdCount": 3,
      "created": [
        { "_id": "664a1b2c3d4e5f6a7b8c9d0e", "name": "Sterile Gauze" },
        { "_id": "664a1b2c3d4e5f6a7b8c9d0f", "name": "Surgical Drape" },
        { "_id": "664a1b2c3d4e5f6a7b8c9d10", "name": "Suction Tip" }
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
    "message": "Supplies created",
    "data": {
      "createdCount": 1,
      "created": [
        { "_id": "664a1b2c3d4e5f6a7b8c9d10", "name": "Suction Tip" }
      ],
      "duplicates": ["Sterile Gauze", "Surgical Drape"]
    }
  }
  ```

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 6.1 | `/supplies` | `GET` | SUPER_ADMIN | ✅ Done | Paginated list with search |
| 6.2 | `/supplies` | `POST` | SUPER_ADMIN | ✅ Done | Single supply create |
| 6.3 | `/supplies/:supplyId` | `PATCH` | SUPER_ADMIN | ✅ Done | Update name |
| 6.4 | `/supplies/:supplyId` | `DELETE` | SUPER_ADMIN | ✅ Done | Hard delete |
| 6.5 | `/supplies/bulk` | `POST` | SUPER_ADMIN | ✅ Done | Bulk create with duplicate skip |
