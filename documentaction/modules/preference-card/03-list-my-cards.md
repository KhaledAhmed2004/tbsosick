# 03. List My Cards

```http
GET /preference-cards/my-cards?searchTerm=keyword
Auth: Bearer {{accessToken}}
```

> **Personal Library Endpoint**: This API is used to fetch all cards created by the authenticated user, regardless of whether they are `PUBLIC` or `PRIVATE`.

## Query Parameters
- `searchTerm`: (Optional) Search by card title, surgeon name, or medication.
- `visibility`: (Optional) `public` or `private`. Filter your cards by their visibility status.
- `page` / `limit`: Standard pagination.
- `sortBy` / `sortOrder`: Standard sorting.

## Implementation
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `listPrivateCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listPrivatePreferenceCardsForUserFromDB`

### Business Logic (`listPrivatePreferenceCardsForUserFromDB`)
- **Strict Ownership**: Filters documents by `createdBy: authenticatedUser`.
- **Comprehensive View**: Returns both `PUBLIC` and `PRIVATE` cards owned by the user.
- **Exclusion**: Cards created by other users are never returned, even if they are public.
- **Search Support**: Supports full-text search within the user's own collection.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Private preference cards fetched successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "data": [
    {
      "id": "664a1b2c3d4e5f6a7b8c9d0f",
      "cardTitle": "My Custom Procedure",
      "surgeon": {
        "name": "Dr. Self",
        "specialty": "General Surgery"
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
