# 01. List Specialties

```http
GET /specialties
Auth: Bearer {{accessToken}}
```

> Fetches a list of all active specialties available in the system.

## Implementation
- **Route**: [specialty.route.ts](file:///src/app/modules/specialty/specialty.route.ts)
- **Controller**: [specialty.controller.ts](file:///src/app/modules/specialty/specialty.controller.ts) — `listSpecialties`
- **Service**: [specialty.service.ts](file:///src/app/modules/specialty/specialty.service.ts) — `listSpecialtiesFromDB`

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Specialties fetched successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1
  },
  "data": [
    {
      "id": "69fa332f3fc3858c40265420",
      "name": "Cardiology",
      "isActive": true,
      "createdAt": "2026-05-06T10:00:00.000Z",
      "updatedAt": "2026-05-06T10:00:00.000Z"
    }
  ]
}
```
