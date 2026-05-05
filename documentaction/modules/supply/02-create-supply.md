# 02. Create Supply

```http
POST /supplies
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Single supply create kore. Shudhu `name` field required.

## Implementation
- **Route**: `src/app/modules/supplies/supplies.route.ts`
- **Controller**: `src/app/modules/supplies/supplies.controller.ts` — `createSupply`
- **Service**: `src/app/modules/supplies/supplies.service.ts` — `createSupplyToDB`

### Business Logic (`createSupplyToDB`)
- Database-e single supply record create kora hoy.
- Schema level-e `name` field-e unique constraint thakai duplicate name-e error throw korbe.

## Request Body
```json
{
  "name": "Sterile Gauze"
}
```

## Responses

### Scenario: Success (201)
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
