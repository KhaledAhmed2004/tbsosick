# 04. Create Preference Card

```http
POST /preference-cards
Content-Type: multipart/form-data
Auth: Bearer {{accessToken}} (USER)
```

> use case: User Creates a new preference card.

## Implementation
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `createCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `createPreferenceCardInDB`

### Business Logic (`createPreferenceCardInDB`)
- **Draft Support**: Long-form fields are optional at the schema level, allowing incomplete cards to be saved as `PRIVATE` drafts.
- **Publish Validation**: If `visibility: 'PUBLIC'` is sent, the system verifies whether required fields like `medication`, `instruments`, `workflow`, etc., are filled.
- **Auto-Cataloging**: If new names are found in the Supplies and Sutures fields, the backend automatically inserts them into their respective catalogs.
- **Ownership**: The current user's ID is set in the `createdBy` field.

**Middleware chain**: `auth(USER) → fileHandler(photoLibrary max 5) → parseBody → validateRequest`

## Request Body
```json
{
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
    { "name": "Surgical Drape", "quantity": 2 }
  ],
  "sutures": [
    { "name": "3-0 Vicryl", "quantity": 1 }
  ],
  "instruments": "Standard arthroscopy set",
  "positioningEquipment": "Leg holder",
  "prepping": "Betadine",
  "workflow": "Incision, portal placement, joint inspection...",
  "keyNotes": "Be careful with the ACL",
  "visibility": "PRIVATE"
}
```

> Upload `photoLibrary` files using the form field name `photoLibrary`, max 5 files.
> Send `supplies` and `sutures` as JSON strings in the multipart form data.

## Responses

### Scenario: Success (201)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Preference card created",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
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
      { "supply": "664a1b2c3d4e5f6a7b8c9d10", "quantity": 10 },
      { "supply": "664a1b2c3d4e5f6a7b8c9d11", "quantity": 2 }
    ],
    "sutures": [
      { "suture": "664b2c3d4e5f6a7b8c9d1a0e", "quantity": 1 }
    ],
    "instruments": "Standard arthroscopy set",
    "positioningEquipment": "Leg holder",
    "prepping": "Betadine",
    "workflow": "Incision, portal placement, joint inspection...",
    "keyNotes": "Be careful with the ACL",
    "photoLibrary": [],
    "visibility": "PRIVATE",
    "published": false,
    "verificationStatus": "UNVERIFIED",
    "downloadCount": 0,
    "createdBy": "664a1b2c3d4e5f6a7b8c0001",
    "createdAt": "2026-03-15T10:30:00.000Z",
    "updatedAt": "2026-03-15T10:30:00.000Z"
  }
}
```

### Scenario: Publish without required fields (400)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot publish — missing required fields: medication, instruments, supplies"
}
```
