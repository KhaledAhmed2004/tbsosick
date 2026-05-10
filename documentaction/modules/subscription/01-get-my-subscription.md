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
- Prothome User-er `userId` diye existing subscription document fetch kora hoy (`metadata` field excluded — server-internal).
- Jodi database-e kono record na thake, tobe **read-only** synthetic FREE entitlement object return kora hoy — kono row insert hoy na. Industry rule: GET handlers never mutate state.
- Subscription row lazy-ly create hoy first paid action-er somoy (`/apple/verify`, `/google/verify`, ba `/choose/free`) — `getMySubscription` ekhon purely read-only.
- Client-side e sobshomoy ekta valid plan object pawa nishchit kora hoy (never returns 404).

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
    "platform": "APPLE",
    "currentPeriodEnd": "2027-04-07T10:30:00.000Z"
  }
}
```

> [!NOTE]
> **Feature Gating**: User-er access permission (Premium features) determine korar jonno backend application level-e `subscriptionGate` middleware use kora hoy, ja ei current state-er upor bhitti kore access allow ba block kore.

> **Edge case (Free user):** `GET /subscriptions/me` always returns a plan object — for free users it returns `plan: "FREE"` instead of 404.
