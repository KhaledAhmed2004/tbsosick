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
- **Verification Status**: New cards default to `UNVERIFIED` and can only be verified by an admin.
- **Auto-Cataloging**: If new names are found in the Supplies and Sutures fields, the backend automatically inserts them into their respective catalogs.
- **Ownership**: The current user's ID is set in the `createdBy` field.

**Middleware chain**: `auth(USER) → fileHandler(photoLibrary max 5) → parseBody → validateRequest`

## Request Body (Multipart Form-Data)

In Postman, select the **form-data** body type. All fields below must be added as separate keys in the form-data table.

| Key | Value Type | Description |
| :--- | :--- | :--- |
| `cardTitle` | `text` | e.g., "Knee Arthroscopy" |
| `surgeon` | `text (JSON string)` | e.g., `{"fullName": "Dr. Smith", "handPreference": "Right", "specialty": "Orthopedics", "contactNumber": "+1234567890", "musicPreference": "Classical"}` |
| `medication` | `text` | e.g., "Lidocaine with Epinephrine" |
| `supplies` | `text (JSON string)` | e.g., `[{"name": "Sterile Gauze", "quantity": 10}, {"name": "Surgical Drape", "quantity": 2}]` |
| `sutures` | `text (JSON string)` | e.g., `[{"name": "3-0 Vicryl", "quantity": 1}]` |
| `instruments` | `text` | e.g., "Standard arthroscopy set" |
| `positioningEquipment` | `text` | e.g., "Leg holder" |
| `prepping` | `text` | e.g., "Betadine" |
| `workflow` | `text` | e.g., "Incision, portal placement, joint inspection..." |
| `keyNotes` | `text` | e.g., "Be careful with the ACL" |
| `visibility` | `text` | "PRIVATE" or "PUBLIC" |
| `photoLibrary` | `file` | Select binary image files (max 5) |

> **Note for Postman**: Since the request uses `multipart/form-data`, you cannot use a raw JSON body. Ensure all fields (including nested objects like `surgeon` and arrays like `supplies`) are passed as **text** keys with their values formatted as JSON strings.

## Responses

### Scenario: Success (201)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Preference card created",
  "data": {
    "createdBy": "69fa332f3fc3858c40265420",
    "cardTitle": "Knee Arthroscopy",
    "surgeon": {
      "fullName": "Dr. Smith",
      "handPreference": "Right",
      "specialty": "Orthopedics",
      "contactNumber": "+1234567890",
      "musicPreference": "Classical"
    },
    "supplies": [
      {
        "name": "Sterile Gauze",
        "quantity": 10
      },
      {
        "name": "Surgical Drape",
        "quantity": 2
      }
    ],
    "sutures": [
      {
        "name": "3-0 Vicryl",
        "quantity": 1
      }
    ],
    "medication": "Lidocaine with Epinephrine",
    "instruments": "Standard arthroscopy set",
    "positioningEquipment": "Leg holder",
    "prepping": "Betadine",
    "workflow": "Incision, portal placement, joint inspection...",
    "keyNotes": "Be careful with the ACL",
    "photoLibrary": [
      "http://localhost:5001/uploads/images/1778011654291-unzavs.png"
    ],
    "downloadCount": 0,
    "published": false,
    "visibility": "PRIVATE",
    "verificationStatus": "UNVERIFIED",
    "isDeleted": false,
    "id": "69fa4e06276f92747b080301",
    "createdAt": "2026-05-05T20:07:34.544Z",
    "updatedAt": "2026-05-05T20:07:34.544Z",
    "_v": 0
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
