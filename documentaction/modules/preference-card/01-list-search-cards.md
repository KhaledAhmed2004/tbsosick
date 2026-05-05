# 01. List/Search Preference Cards

```http
GET /preference-cards?searchTerm=keyword
Auth: Bearer {{accessToken}}
```

> **Primary Search Endpoint**: This is the main API used to search cards.
> 
> By default, it returns:
> - All **public (published) cards**
> - Your **own private cards**
> - **Use `visibility=private`**  
>   → You get: Only your own private cards 

## Query Parameters
- `searchTerm`: (Optional) Search by card title, surgeon name, or medication.
- `visibility`: `public` (Default) or `private` (Only your cards).
- `surgeonSpecialty` / `specialty`: Filter by surgeon's specialty.
- `verificationStatus`: Filter by `VERIFIED` or `UNVERIFIED`.
- `page` / `limit`: Standard pagination.

## Implementation
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listPublicPreferenceCardsFromDB` / `listPrivatePreferenceCardsForUserFromDB`

### Business Logic (`listPublicPreferenceCardsFromDB`)
- **Unified Visibility**: Uses an `$or` query to fetch cards that are either `visibility: 'PUBLIC'` OR `createdBy: authenticatedUser`.
- **Privacy Enforcement**: PRIVATE cards from other users are never returned, even to `SUPER_ADMIN`.
- **Aggregation Pipeline**: MongoDB aggregation is used for efficiency to apply search and filters.
- **Text Search**: Search is performed on `cardTitle`, `surgeon.fullName`, and `medication` fields using a full-text index (`$text`).
- **Specialty Filter**: Exact matching is applied to the `surgeon.specialty` field.
- **Data Flattening**: Supplies and sutures are populated to extract names for easier client-side rendering.
- **Deleted Filter**: Only cards with `isDeleted: false` are returned.

### Business Logic (`listPrivatePreferenceCardsForUserFromDB`)
- `QueryBuilder` is used to fetch the user's own cards (both PUBLIC and PRIVATE).
- A `createdBy: userId` and `isDeleted: false` filter is applied to maintain privacy and exclude deleted items.
- Results are strictly scoped to the authenticated user.

## Responses

### Scenario: Success — Public (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Public preference cards retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 120,
    "totalPages": 12,
    "hasNext": true,
    "hasPrev": false
  },
  "data": [
    {
      "id": "664a1b2c3d4e5f6a7b8c9d0e",
      "cardTitle": "Knee Arthroscopy",
      "surgeon": {
        "name": "Dr. Smith",
        "specialty": "Orthopedics"
      },
      "verificationStatus": "VERIFIED",
      "published": true,
      "isFavorited": false,
      "downloadCount": 15,
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-15T10:30:00.000Z"
    }
  ]
}
```

### Scenario: Success — Admin View (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Public preference cards fetched successfully",
  "meta": { "total": 45, "limit": 10, "page": 1, "totalPages": 5 },
  "data": [
    {
      "id": "664c1b2c3d4e5f6a7b8c9d1a",
      "cardTitle": "Hip Replacement (Dr. Smith)",
      "surgeon": {
        "name": "Dr. John Smith",
        "specialty": "Orthopedics"
      },
      "verificationStatus": "UNVERIFIED",
      "downloadCount": 12,
      "createdAt": "2026-03-20T14:45:00.000Z"
    }
  ]
}
```

### Scenario: Success — Private (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Private preference cards retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "data": [
    {
      "id": "664a1b2c3d4e5f6a7b8c9d0f",
      "cardTitle": "My Private Card",
      "surgeon": {
        "name": "Dr. Own",
        "specialty": "General"
      },
      "verificationStatus": "UNVERIFIED",
      "isFavorited": false,
      "downloadCount": 0,
      "createdAt": "2026-04-01T10:30:00.000Z",
      "updatedAt": "2026-04-01T10:30:00.000Z"
    }
  ]
}
```

### Scenario: Validation Error (400)
```json
{
  "success": false,
  "message": "Validation Error",
  "errorMessages": [
    {
      "path": "limit",
      "message": "Number must be less than or equal to 50"
    }
  ]
}
```
