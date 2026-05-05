# 03. Fetch Distinct Specialties

```http
GET /preference-cards/specialties
Auth: Bearer {{accessToken}}
```

> use case: its used to populate the filter dropdown dynamically.

## Implementation
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getSpecialties`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `getDistinctSpecialtiesFromDB`

### Business Logic (`getDistinctSpecialtiesFromDB`)
- **Unified Discovery**: Fetches unique specialties from all cards that are either `published: true` or created by the current user. This ensures the filter dropdown shows relevant options for both public content and the user's private drafts.
- **Data Cleanup**: Filters out any null or empty values using `filter(Boolean)`.
- **User Experience**: Sorts the list alphabetically to ensure a consistent and predictable dropdown order in the UI.

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Specialties retrieved successfully",
  "data": [
    "Cardiology",
    "General",
    "Neurology",
    "Orthopedics",
    "Pediatrics"
  ]
}
```
