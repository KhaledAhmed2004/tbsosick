# 05. Get Card Details

```http
GET /preference-cards/:cardId
Auth: Bearer {{accessToken}} (USER)
```

> Fetches all card details (surgeon, supplies, sutures, workflow, etc.).

## Implementation
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `getById`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `getPreferenceCardByIdFromDB`

### Business Logic (`getPreferenceCardByIdFromDB`)
- **Authorization**: Private (unpublished) cards can only be accessed by the owner or SUPER_ADMIN.
- **Data Enrichment**: Returns details by populating Supplies and Sutures.
- **Flattening**: Data is flattened for easier mapping in the UI.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card details fetched",
  "data": {
    "id": "664a1b2c3d4e5f6a7b8c9d0e",
    "cardTitle": "Knee Arthroscopy",
    "surgeon": {
      "fullName": "Dr. Smith",
      "handPreference": "Right",
      "specialty": "Orthopedics",
      "contactNumber": "+1234567890",
      "musicPreference": "Classical"
    },
    "medication": "Lidocaine with Epinephrine",
    "supplies": [
      { "name": "Sterile Gauze", "quantity": 10 },
      { "name": "Suture Pack", "quantity": 2 }
    ],
    "sutures": [
      { "name": "3-0 Vicryl", "quantity": 1 }
    ],
    "instruments": "Standard arthroscopy set",
    "positioningEquipment": "Leg holder",
    "prepping": "Betadine",
    "workflow": "Incision, portal placement, joint inspection...",
    "keyNotes": "Be careful with the ACL",
    "photoLibrary": [
      "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    ],
    "verificationStatus": "VERIFIED",
    "downloadCount": 15,
    "isFavorited": true
  }
}
```

### Scenario: Not Found (404)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Preference card not found"
}
```

### Scenario: Forbidden (403)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Not authorized to access this card"
}
```
