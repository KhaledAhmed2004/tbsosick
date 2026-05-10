# 04. Set Free Plan (Internal/Manual)

```http
POST /subscriptions/choose/free
Auth: Bearer {{accessToken}}
```

> User-ke manually free plan-e downgrade ba switch korte allow kore.

## Implementation
- **Route**: [subscription.route.ts](file:///src/app/modules/subscription/subscription.route.ts)
- **Controller**: [subscription.controller.ts](file:///src/app/modules/subscription/subscription.controller.ts) — `chooseFreePlanController`
- **Service**: [subscription.service.ts](file:///src/app/modules/subscription/subscription.service.ts) — `setFreePlan`

## Business Logic (`setFreePlan`)
1. **Active Store Guard**: User-er jodi store-side (Apple ba Google) active subscription thake — i.e. `platform !== "admin"` AND `status ∈ {active, trialing, past_due}` AND `currentPeriodEnd > now` — tobe downgrade allow kora hoy na (returns `409 Conflict`). Existing admin-set subscriptions (`platform === "admin"`) ei guard skip kore karon ora store-linked noy.
2. **Reset**: Guard pass korle, `upsertForUser` call kore record-ke `plan: FREE`, `status: ACTIVE`, ebong **`platform: "admin"`** mark kora hoy. Ei admin-mark prevents subsequent `setFreePlan` calls theke unnecessary 409 — ebong make it clear je current state user-initiated, store-driven noy.
3. **Audit Log**: `upsertForUser` automatic-ally `SubscriptionEvent` write kore — eg. `DOWNGRADED` (PREMIUM → FREE) ba `PLAN_CHANGED`. No separate logging code prokriyojon noy.

> **Important caveat**: Ei endpoint shudhu **local DB row** ke FREE-te switch kore. Apple/Google-er kache active billing thakle store will continue to bill the user. Real cancellation client-ke App Store / Play Store theke korte hobe — ei karon-ei guard active store subscription block kore.

## Responses

### 200 OK
```json
{
  "success": true,
  "message": "Switched to Free plan successfully",
  "data": { ...subscriptionDoc }
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "You have an active store subscription. Please cancel it through the App Store or Play Store first."
}
```
