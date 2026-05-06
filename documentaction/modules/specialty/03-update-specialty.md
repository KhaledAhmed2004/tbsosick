# 03. Update Specialty

```http
PATCH /specialties/:specialtyId
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Updates an existing specialty.

## Request Body (Multipart Form-Data)

| Key | Value Type | Description |
| :--- | :--- | :--- |
| `name` | `text` | e.g., "Orthopedic Surgery" |
| `isActive` | `text` | e.g., "false" |

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Specialty updated",
  "data": {
    "id": "69fa332f3fc3858c40265421",
    "name": "Orthopedic Surgery",
    "isActive": false,
    "createdAt": "2026-05-06T10:05:00.000Z",
    "updatedAt": "2026-05-06T10:10:00.000Z"
  }
}
```
