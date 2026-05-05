# 02. Create Suture

```http
POST /sutures
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Single suture create kore. Shudhu `name` field required.

## Implementation
- **Route**: [sutures.route.ts](file:///src/app/modules/sutures/sutures.route.ts)
- **Controller**: [sutures.controller.ts](file:///src/app/modules/sutures/sutures.controller.ts) — `createSuture`
- **Service**: [sutures.service.ts](file:///src/app/modules/sutures/sutures.service.ts) — `createSutureToDB`

### Business Logic (`createSutureToDB`)
- Direct input data use kore Mongoose `create` method call kora hoy.
- Schema validation ensure kore je `name` required.

## Request Body
```json
{
  "name": "3-0 Vicryl"
}
```

## Responses

### Scenario: Success (201)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Suture created",
  "data": {
    "id": "664b2c3d4e5f6a7b8c9d1a0e",
    "name": "3-0 Vicryl",
    "createdAt": "2026-03-15T10:30:00.000Z",
    "updatedAt": "2026-03-15T10:30:00.000Z"
  }
}
```
