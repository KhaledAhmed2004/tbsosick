# 02. Create Specialty

```http
POST /specialties
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> **Admin Only**: Creates a new specialty in the system. This must be done by an Admin before users can select this specialty while creating preference cards.

## Request Body (Multipart Form-Data)

| Key | Value Type | Description |
| :--- | :--- | :--- |
| `name` | `text` | e.g., "Orthopedics" |

## Responses

### Scenario: Success (201)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Specialty created",
  "data": {
    "id": "69fa332f3fc3858c40265421",
    "name": "Orthopedics",
    "isActive": true,
    "createdAt": "2026-05-06T10:05:00.000Z",
    "updatedAt": "2026-05-06T10:05:00.000Z"
  }
}
```
