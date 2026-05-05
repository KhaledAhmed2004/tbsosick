# 01. List Sutures

```http
GET /sutures
Auth: Bearer {{accessToken}} (USER for catalog read, SUPER_ADMIN for management view)
```

> Shob sutures paginated list fetch kore. `searchTerm` diye name search kora jay. Preference card create/edit screen eo ei endpoint use hoy catalog load korar jonno.

## Implementation
- **Route**: [sutures.route.ts](file:///src/app/modules/sutures/sutures.route.ts)
- **Controller**: [sutures.controller.ts](file:///src/app/modules/sutures/sutures.controller.ts) — `listSutures`
- **Service**: [sutures.service.ts](file:///src/app/modules/sutures/sutures.service.ts) — `listSuturesFromDB`

### Business Logic (`listSuturesFromDB`)
- `QueryBuilder` use kore sutures fetch kora hoy.
- `name` field-er opor partial search (`searchTerm`) support kore.
- Pagination, sorting, ebong field selection logic automatic handle kora hoy.
- Performance optimization-er jonno `.lean()` use kora hoy.

## Query Params
- `searchTerm` — name diye search (optional)
- `page` — page number (default: 1)
- `limit` — items per page (default: 10, max: 50)
- `sort` — sort field (default: `-createdAt`)
- `fields` — comma-separated fields (optional)

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Sutures fetched",
  "meta": {
    "total": 18,
    "limit": 10,
    "page": 1,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "data": [
    {
      "id": "664b2c3d4e5f6a7b8c9d1a0e",
      "name": "3-0 Vicryl",
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-15T10:30:00.000Z"
    },
    {
      "id": "664b2c3d4e5f6a7b8c9d1a0f",
      "name": "4-0 Monocryl",
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-15T10:30:00.000Z"
    }
  ]
}
```
