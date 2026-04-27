# Supply Module APIs

> **Section**: Backend API specifications for the supply module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Card Details](../app-screens/03-preference-card-details.md) — Catalog dropdown for card create/edit form
> - [Dashboard Supplies Management](../dashboard-screens/06-supplies-management.md) — Admin master catalog CRUD

---

## Endpoints Index

| # | Method | Endpoint | Auth | Used By |
|---|---|---|---|---|
| 7.1 | GET | `/supplies` | Bearer / SUPER_ADMIN | [App Card Details](../app-screens/03-preference-card-details.md), [Dashboard Supplies Mgmt](../dashboard-screens/06-supplies-management.md) |
| 7.2 | POST | `/supplies` | SUPER_ADMIN | [Dashboard Supplies Mgmt](../dashboard-screens/06-supplies-management.md) |
| 7.3 | POST | `/supplies/bulk` | SUPER_ADMIN | [Dashboard Supplies Mgmt](../dashboard-screens/06-supplies-management.md) |
| 7.4 | PATCH | `/supplies/:supplyId` | SUPER_ADMIN | [Dashboard Supplies Mgmt](../dashboard-screens/06-supplies-management.md) |
| 7.5 | DELETE | `/supplies/:supplyId` | SUPER_ADMIN | [Dashboard Supplies Mgmt](../dashboard-screens/06-supplies-management.md) |

---

### 7.1 List Supplies

```
GET /supplies
Auth: Bearer {{accessToken}} (USER for catalog read, SUPER_ADMIN for management view)
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

- **Scenario: Success — Admin Management View (200)**
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

- **Scenario: Success — App Catalog View (200)**
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
        "name": "Sterile Gauze"
      },
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0f",
        "name": "Surgical Drape"
      }
    ]
  }
  ```

---

### 7.2 Create Supply

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

### 7.3 Bulk Create Supplies

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

### 7.4 Update Supply

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

### 7.5 Delete Supply

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

## Edge Cases

- **Duplicate Name**: Create e jodi same name already exist kore, backend error throw korbe.
- **Bulk Duplicates**: Bulk create e duplicate names skip kore — response e `duplicates` array te kon gula skip hoyeche dekhay.
- **Not Found**: Update/Delete e invalid ID hole 404 return korbe.
- **Auto-create from Card**: Preference card create/update e supplies e plain `name` (ObjectId nay) pathale backend automatically catalog e add kore dey.

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 7.1 | `/supplies` | `GET` | Bearer | Done | Paginated list with search; reused for card-form catalog |
| 7.2 | `/supplies` | `POST` | SUPER_ADMIN | Done | Single supply create |
| 7.3 | `/supplies/bulk` | `POST` | SUPER_ADMIN | Done | Bulk create with duplicate skip |
| 7.4 | `/supplies/:supplyId` | `PATCH` | SUPER_ADMIN | Done | Update name |
| 7.5 | `/supplies/:supplyId` | `DELETE` | SUPER_ADMIN | Done | Hard delete |
