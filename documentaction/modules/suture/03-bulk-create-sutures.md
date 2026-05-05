# 03. Bulk Create Sutures

```http
POST /sutures/bulk
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Multiple sutures ekbar e create kore. Duplicate name skip kore — response e kon gula skip hoyeche dekhay.

## Implementation
- **Route**: [sutures.route.ts](file:///src/app/modules/sutures/sutures.route.ts)
- **Controller**: [sutures.controller.ts](file:///src/app/modules/sutures/sutures.controller.ts) — `bulkCreate`
- **Service**: [sutures.service.ts](file:///src/app/modules/sutures/sutures.service.ts) — `bulkCreateSuturesToDB`

### Business Logic (`bulkCreateSuturesToDB`)
- Prothome input items-gulo theke `name` trim kora hoy ebong empty names filter kora hoy.
- Existing database-e same name-er sutures ache kina ta check kora hoy (`$in` query).
- Shudhu matro unique (non-existing) sutures-gulo `insertMany` diye ekbare insert kora hoy.
- Response-e `createdCount`, successfully created items, ebong skipped `duplicates` name list return kora hoy.

## Request Body
```json
{
  "items": [
    { "name": "3-0 Vicryl" },
    { "name": "4-0 Monocryl" },
    { "name": "2-0 Silk" }
  ]
}
```

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Sutures created",
  "data": {
    "createdCount": 1,
    "created": [
      { "id": "664b2c3d4e5f6a7b8c9d1a10", "name": "2-0 Silk" }
    ],
    "duplicates": ["3-0 Vicryl", "4-0 Monocryl"]
  }
}
```
