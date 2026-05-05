# 04. Update Supply

```http
PATCH /supplies/:supplyId
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Supply er name update kore. Shudhu `name` field changeable.

## Implementation
- **Route**: `src/app/modules/supplies/supplies.route.ts`
- **Controller**: `src/app/modules/supplies/supplies.controller.ts` — `updateSupply`
- **Service**: `src/app/modules/supplies/supplies.service.ts` — `updateSupplyInDB`

### Business Logic (`updateSupplyInDB`)
- `findById` call kore existing supply record check kora hoy.
- Mongoose document instance use kore `save()` call kora hoy jate middleware trigger hoy.

## Request Body
```json
{
  "name": "Updated Gauze Name"
}
```

## Responses

### Scenario: Success (200)
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

### Scenario: Not Found (404)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Supply not found"
}
```
