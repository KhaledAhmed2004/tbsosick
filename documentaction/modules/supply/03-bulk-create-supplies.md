# 03. Bulk Create Supplies

```http
POST /supplies/bulk
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Multiple supplies ekbar e create kore. Duplicate name skip kore — response e kon gula skip hoyeche dekhay.

## Implementation
- **Route**: `src/app/modules/supplies/supplies.route.ts`
- **Controller**: `src/app/modules/supplies/supplies.controller.ts` — `bulkCreate`
- **Service**: `src/app/modules/supplies/supplies.service.ts` — `bulkCreateSuppliesToDB`

### Business Logic (`bulkCreateSuppliesToDB`)
- Input items-gulo theke `name` trim kora hoy normalization-er jonno.
- Database-e existing supplies check kora hoy `$in` operator use kore duplicates detect korte.
- Shudhu unique (non-existing) supplies-gulo `insertMany` diye ekbare insert kora hoy.
- Response-e successfully created items ebong skipped `duplicates` name list return kora hoy.

## Request Body
```json
{
  "items": [
    { "name": "Sterile Gauze" },
    { "name": "Surgical Drape" },
    { "name": "Suction Tip" }
  ]
}
```

## Responses

### Scenario: Success — all new (200)
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

### Scenario: Success — with duplicates (200)
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
