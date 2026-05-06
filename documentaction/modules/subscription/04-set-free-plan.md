# 04. Set Free Plan (Internal/Manual)

```http
POST /subscriptions/choose/free
Auth: Bearer {{accessToken}}
```

> User-ke manually free plan-e downgrade ba switch korte allow kore.

## Business Logic (`setFreePlan`)
1. **Active Store Guard**: User-er jodi active Apple ba Google subscription thake (`currentPeriodEnd > now`), tobe downgrade allow kora hoy na (returns `409 Conflict`).
2. **Reset**: Guard pass korle, record-ke `FREE` plan ebong `ACTIVE` status-e reset kore.
3. **Audit Log**: `SubscriptionEvent` table-e transition track kora hoy.

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
