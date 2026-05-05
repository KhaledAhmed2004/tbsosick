# 11. Admin Verification

```http
PATCH /preference-cards/:cardId
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
Body: { "verificationStatus": "VERIFIED" | "UNVERIFIED" }
```

> use case: Admin verify or unverify preference cards. 

## Implementation
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `updateVerificationStatus`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `updateVerificationStatusInDB`

### Business Logic (`updateVerificationStatusInDB`)
- **Authorization**: Role-gated strictly to `SUPER_ADMIN`.
- **State Management**: Updating the status triggers any necessary background events (like notifying the card creator).

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card status updated to VERIFIED",
  "data": {
    "verificationStatus": "VERIFIED"
  }
}
```

### Scenario: Unauthorized (403)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Not authorized to verify/reject this card"
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
