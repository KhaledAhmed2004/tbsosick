# 04. Delete Specialty

```http
DELETE /specialties/:specialtyId
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Deletes a specialty from the system.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Specialty deleted",
  "data": {
    "deleted": true
  }
}
```
