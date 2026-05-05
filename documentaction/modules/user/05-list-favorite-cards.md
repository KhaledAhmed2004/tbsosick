# 05. List Favorite Cards

```http
GET /users/me/favorites
Auth: Bearer {{accessToken}}
```

## Implementation
- **Controller**: `getFavoriteCards`
- **Service**: `PreferenceCardService.listFavoritePreferenceCardsForUserFromDB`

### Business Logic (`listFavoritePreferenceCardsForUserFromDB`)
1. **Favorite Lookup**: Retrieves the list of preference card IDs favorited by the user.
2. **Summarized Mapping**: Maps each card to a specific UI-friendly format including:
    - `isFavorited: true` (since they are from the favorite list).
    - `surgeon`: Nested object with `name` and `specialty`.
    - `downloadCount`: Defaults to 0 if not present.
3. **Empty State**: If no favorites exist, returns a success response with an empty array and a specific message.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Favorite preference cards retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5
  },
  "data": [
    {
      "id": "664a1b2c3d4e5f6a7b8c9d0f",
      "cardTitle": "Hip Replacement",
      "surgeon": {
        "name": "Dr. Brown",
        "specialty": "Orthopedics"
      },
      "verificationStatus": "VERIFIED",
      "isFavorited": true,
      "downloadCount": 12,
      "createdAt": "2026-03-20T09:00:00.000Z",
      "updatedAt": "2026-04-15T14:00:00.000Z"
    }
  ]
}
```

### Scenario: No Favorites Found (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "No favorite cards found.",
  "data": []
}
```
