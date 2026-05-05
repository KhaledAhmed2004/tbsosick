# 01. Get My Subscription

```http
GET /subscriptions/me
Auth: Bearer {{accessToken}}
```

> Current user-er active subscription plan ebong status fetch kore. Free user-er jonno o sobshomoy ekta plan object return hoy — 404 return hoy na.

## Implementation
- **Route**: [subscription.route.ts](file:///src/app/modules/subscription/subscription.route.ts)
- **Controller**: [subscription.controller.ts](file:///src/app/modules/subscription/subscription.controller.ts) — `getMySubscriptionController`
- **Service**: [subscription.service.ts](file:///src/app/modules/subscription/subscription.service.ts) — `getMySubscription`

### Business Logic (`getMySubscription`)
- Prothome User-er `userId` diye existing subscription check kora hoy.
- Jodi database-e kono record na thake, tobe automatic ekta `FREE` plan logic upsert kora hoy (idempotent creation).
- Ete kore client-side e sobshomoy ekta valid plan object pawa nishchit kora hoy (never returns 404 for valid users).

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription fetched successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "userId": "664a1b2c3d4e5f6a7b8c9d0e",
    "plan": "PREMIUM",
    "status": "ACTIVE",
    "expiresAt": "2027-04-07T10:30:00.000Z"
  }
}
```

> **Edge case (Free user):** `GET /subscriptions/me` always returns a plan object — for free users it returns `plan: "FREE"` instead of 404.
