# Suture Module APIs

> **Section**: Backend API specifications for the suture module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Card Details](../app-screens/03-preference-card-details.md) — Catalog dropdown for card create/edit form
> - [Dashboard Sutures Management](../dashboard-screens/07-sutures-management.md) — Admin master catalog CRUD

---

## Endpoints Index

| # | Method | Endpoint | Auth | Used By |
|---|---|---|---|---|
| 8.1 | GET | `/sutures` | Bearer / SUPER_ADMIN | [App Card Details](../app-screens/03-preference-card-details.md), [Dashboard Sutures Mgmt](../dashboard-screens/07-sutures-management.md) |
| 8.2 | POST | `/sutures` | SUPER_ADMIN | [Dashboard Sutures Mgmt](../dashboard-screens/07-sutures-management.md) |
| 8.3 | POST | `/sutures/bulk` | SUPER_ADMIN | [Dashboard Sutures Mgmt](../dashboard-screens/07-sutures-management.md) |
| 8.4 | PATCH | `/sutures/:sutureId` | SUPER_ADMIN | [Dashboard Sutures Mgmt](../dashboard-screens/07-sutures-management.md) |
| 8.5 | DELETE | `/sutures/:sutureId` | SUPER_ADMIN | [Dashboard Sutures Mgmt](../dashboard-screens/07-sutures-management.md) |

---

### 8.1 List Sutures

```
GET /sutures
Auth: Bearer {{accessToken}} (USER for catalog read, SUPER_ADMIN for management view)
```

> Shob sutures paginated list fetch kore. `searchTerm` diye name search kora jay. Preference card create/edit screen eo ei endpoint use hoy catalog load korar jonno.

**Implementation:**
- **Route**: `src/app/modules/sutures/sutures.route.ts`
- **Controller**: `src/app/modules/sutures/sutures.controller.ts` — `listSutures`
- **Service**: `src/app/modules/sutures/sutures.service.ts` — `listSuturesFromDB`

**Business Logic (`listSuturesFromDB`):**
- `QueryBuilder` use kore sutures fetch kora hoy.
- `name` field-er opor full-text search (`searchTerm`) support kore.
- Pagination, sorting, ebong field selection logic automatic handle kora hoy.
- Performance optimization-er jonno `.lean()` use kora hoy.

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

- **Scenario: Success — App Catalog View (200)**
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
        "name": "3-0 Vicryl"
      },
      {
        "_id": "664b2c3d4e5f6a7b8c9d1a0f",
        "name": "4-0 Monocryl"
      }
    ]
  }
  ```

---

### 8.2 Create Suture

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

**Business Logic (`bulkCreateSuturesToDB`):**
- Prothome input items-gulo theke `name` trim kora hoy ebong empty names filter kora hoy.
- Existing database-e same name-er sutures ache kina ta check kora hoy (`$in` query).
- Shudhu matro unique (non-existing) sutures-gulo `insertMany` diye ekbare insert kora hoy.
- Response-e `createdCount`, successfully created items, ebong skipped `duplicates` name list return kora hoy.

**Business Logic (`updateSutureInDB`):**
- `findById` call kore existing suture fetch kora hoy.
- Jodi suture na paoya jay, tobe `404 Not Found` error throw kora hoy.
- Mongoose model instances-er logic use kore field update ebong `save()` call kora hoy.

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

### 8.3 Bulk Create Sutures

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

### 8.4 Update Suture

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

### 8.5 Delete Suture

```
DELETE /sutures/:sutureId
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Suture permanently delete kore. Hard delete — restore possible na.

**Implementation:**
- **Route**: `src/app/modules/sutures/sutures.route.ts`
- **Controller**: `src/app/modules/sutures/sutures.controller.ts` — `deleteSuture`
- **Service**: `src/app/modules/sutures/sutures.service.ts` — `deleteSutureFromDB`

**Business Logic (`deleteSutureFromDB`):**
- Suture existence check kora hoy delete korar age.
- `findByIdAndDelete` use kore permanent (hard) delete kora hoy.

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

## Edge Cases

- **Duplicate Name**: Create e jodi same name already exist kore, backend error throw korbe.
- **Bulk Duplicates**: Bulk create e duplicate names skip kore — response e `duplicates` array te kon gula skip hoyeche dekhay.
- **Not Found**: Update/Delete e invalid ID hole 404 return korbe.
- **Auto-create from Card**: Preference card create/update e sutures e plain `name` (ObjectId nay) pathale backend automatically catalog e add kore dey.

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 8.1 | `/sutures` | `GET` | Bearer | Done | Paginated list with search; reused for card-form catalog |
| 8.2 | `/sutures` | `POST` | SUPER_ADMIN | Done | Single suture create |
| 8.3 | `/sutures/bulk` | `POST` | SUPER_ADMIN | Done | Bulk create with duplicate skip |
| 8.4 | `/sutures/:sutureId` | `PATCH` | SUPER_ADMIN | Done | Update name |
| 8.5 | `/sutures/:sutureId` | `DELETE` | SUPER_ADMIN | Done | Hard delete |
