# 05. Delete Supply

```http
DELETE /supplies/:supplyId
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Supply permanently delete kore. Hard delete — restore possible na.

## Implementation
- **Route**: `src/app/modules/supplies/supplies.route.ts`
- **Controller**: `src/app/modules/supplies/supplies.controller.ts` — `deleteSupply`
- **Service**: `src/app/modules/supplies/supplies.service.ts` — `deleteSupplyFromDB`

### Business Logic (`deleteSupplyFromDB`)
- Record existence check kora hoy delete process start korar age.
- `findByIdAndDelete` use kore permanent (hard) delete execute kora hoy.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Supply deleted",
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
  "message": "Supply not found"
}
```
