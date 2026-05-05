# 05. Delete Suture

```http
DELETE /sutures/:sutureId
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Suture permanently delete kore. Hard delete — restore possible na.

## Implementation
- **Route**: [sutures.route.ts](file:///src/app/modules/sutures/sutures.route.ts)
- **Controller**: [sutures.controller.ts](file:///src/app/modules/sutures/sutures.controller.ts) — `deleteSuture`
- **Service**: [sutures.service.ts](file:///src/app/modules/sutures/sutures.service.ts) — `deleteSutureFromDB`

### Business Logic (`deleteSutureFromDB`)
- Suture existence check kora hoy delete korar age (findById).
- `findByIdAndDelete` use kore permanent (hard) delete kora hoy.

## Responses

### Scenario: Success (200)
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

### Scenario: Not Found (404)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Suture not found"
}
```
