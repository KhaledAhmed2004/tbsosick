# 04. Update Suture

```http
PATCH /sutures/:sutureId
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Suture er name update kore. Shudhu `name` field changeable.

## Implementation
- **Route**: [sutures.route.ts](file:///src/app/modules/sutures/sutures.route.ts)
- **Controller**: [sutures.controller.ts](file:///src/app/modules/sutures/sutures.controller.ts) — `updateSuture`
- **Service**: [sutures.service.ts](file:///src/app/modules/sutures/sutures.service.ts) — `updateSutureInDB`

### Business Logic (`updateSutureInDB`)
- `findById` call kore existing suture fetch kora hoy.
- Jodi suture na paoya jay, tobe `404 Not Found` error throw kora hoy.
- Mongoose model instances-er logic use kore field update ebong `save()` call kora hoy.

## Request Body
```json
{
  "name": "4-0 Monocryl"
}
```

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Suture updated",
  "data": {
    "id": "664b2c3d4e5f6a7b8c9d1a0e",
    "name": "4-0 Monocryl",
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
  "message": "Suture not found"
}
```
