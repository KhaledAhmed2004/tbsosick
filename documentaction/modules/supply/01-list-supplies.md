# 01. List Supplies

```http
GET /supplies
Auth: Bearer {{accessToken}} (USER for catalog read, SUPER_ADMIN for management view)
```

> Shob supplies paginated list fetch kore. `searchTerm` diye name search kora jay. Preference card create/edit screen eo ei endpoint use hoy catalog load korar jonno.

## Implementation
- **Route**: `src/app/modules/supplies/supplies.route.ts`
- **Controller**: `src/app/modules/supplies/supplies.controller.ts` — `listSupplies`
- **Service**: `src/app/modules/supplies/supplies.service.ts` — `listSuppliesFromDB`

### Business Logic (`listSuppliesFromDB`)
- `QueryBuilder` use kore supplies fetch kora hoy.
- `name` field-er opor full-text search (`searchTerm`) support kore.
- Pagination, sorting, ebong field selection logic automatic handle kora hoy.
- Performance optimization-er jonno `.lean()` use kora hoy plain JS object return korte.

## Query Params
- `searchTerm` — name diye search (optional)
- `page` — page number (default: 1)
- `limit` — items per page (default: 10)
- `sortBy` — sort field (optional)
- `sortOrder` — `asc` | `desc` (optional)

## Responses

### Scenario: Success — Admin Management View (200)
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

### Scenario: Success — App Catalog View (200)
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
