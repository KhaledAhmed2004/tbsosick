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

### Scenario A: Existing subscription (200)
For users with a materialized subscription row, the full document is returned (`metadata` field excluded — server-internal):

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
    "environment": "production",
    "productId": "premium_monthly",
    "autoRenewing": true,
    "currentPeriodEnd": "2027-04-07T10:30:00.000Z",
    "createdAt": "2026-04-07T10:30:00.000Z",
    "updatedAt": "2026-04-07T10:30:00.000Z"
  }
}
```

### Scenario B: Free user with no row yet (200)
For users who have never made a paid purchase or chosen the free plan, **no row is created** — a synthetic FREE entitlement is returned. Note the slimmer shape (no `_id`, `createdAt`, `updatedAt`):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription fetched successfully",
  "data": {
    "userId": "664a1b2c3d4e5f6a7b8c9d0e",
    "plan": "FREE",
    "status": "ACTIVE"
  }
}
```

> **Client implication**: do NOT rely on `data._id`, `data.createdAt`, or `data.updatedAt` from this endpoint — those are only present once the user has materialized a real subscription row (via `/apple/verify`, `/google/verify`, or `/choose/free`). Use `data.plan` + `data.status` as the source of truth for entitlement display.

> [!NOTE]
> **Feature Gating**: User-er access permission (Premium features) determine korar jonno backend application level-e [`subscriptionGate`](file:///src/app/middlewares/subscriptionGate.ts) middleware use kora hoy, ja ei current state-er upor bhitti kore access allow ba block kore.

> **Edge case (Free user):** `GET /subscriptions/me` always returns a plan object — for free users it returns `plan: "FREE"` instead of 404.
