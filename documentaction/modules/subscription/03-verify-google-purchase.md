# 03. Verify Google Purchase (Android)

```http
POST /subscriptions/google/verify
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Android BillingClient theke pawa `purchaseToken` verify kore. Google Play Developer API use kore state fetch kora hoy.

## Implementation
- **Route**: [subscription.route.ts](file:///src/app/modules/subscription/subscription.route.ts)
- **Controller**: [subscription.controller.ts](file:///src/app/modules/subscription/subscription.controller.ts) — `verifyGooglePurchaseController`
- **Service**: [subscription.service.ts](file:///src/app/modules/subscription/subscription.service.ts) — `verifyGooglePurchase`

### Business Logic (`verifyGooglePurchase`)
- **State Fetching**: Google Play API (v2) theke `purchases.subscriptionsv2.get` call kore latest authoritative subscription state fetch kora hoy.
- **Test-Purchase Gate**: `NODE_ENV === 'production'` mode-e Google `testPurchase: true` token reject hoy (`400 Bad Request`) — license-tester transactions only non-production environments-e accept kora hoy.
- **72h Purchase Acknowledgement**: Verified hoa-r por server `purchases.subscriptions.acknowledge` call kore — Google policy onujayi 72h-er moddhe acknowledge na korle auto-refund hoy. Ack failure non-fatal: log hoy, user access pay, ops manually retry korte parbe.
- **Buyer-Account Binding**: Subscription-er `externalAccountIdentifiers.obfuscatedExternalAccountId` check kora hoy. Mobile client-ke `BillingFlowParams.setObfuscatedAccountId(uuidv5(userId, IAP_NAMESPACE))` use korte hobe ([helpers/iap-account.ts](file:///src/app/modules/subscription/helpers/iap-account.ts)). ID mismatch → `409 Conflict`. Missing → log warning, accept (soft rollout).
- **Fraud Guard**: Purchase token check kora hoy jate same purchase multiple accounts-e link na hoy. Upgrades/Downgrades-er khetre `linkedPurchaseToken` check kore existing record identify kora hoy.
- **Status Normalization**: Google-er `subscriptionState` (e.g., `SUBSCRIPTION_STATE_ACTIVE`, `SUBSCRIPTION_STATE_IN_GRACE_PERIOD`) local `ACTIVE` ba `PAST_DUE` status-e convert kora hoy. Inactive states (cancelled, on_hold, paused, expired) `400 Bad Request` return kore.
- **Persistence**: `upsertForUser` call kore user-er current state update kora hoy including `autoRenewing`, `googleOrderId`, `expiryTime`, `gracePeriodEndsAt` (jodi PAST_DUE), ebong `metadata` (acknowledgementState, linkedPurchaseToken, testPurchase).

### Mobile Integration (Android) — Required
Google Play Billing `BillingFlowParams.Builder().setObfuscatedAccountId(...)` use korte hobe deterministic UUID dite, derived from authenticated `userId` via UUIDv5 with the shared `IAP_NAMESPACE`. Mismatch → server 409 reject korbe.

## Request Body
```json
{
  "purchaseToken": "<token-from-google-play>",
  "productId": "com.tbsosick.premium.yearly"
}
```

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Google subscription verified successfully",
  "data": {
    "_id": "...",
    "userId": "...",
    "plan": "PREMIUM",
    "status": "active",
    "platform": "google",
    "environment": "production",
    "productId": "premium_yearly",
    "autoRenewing": true,
    "googlePurchaseToken": "abc123...",
    "googleOrderId": "GPA.1234-5678-9012-34567",
    "startedAt": "2026-04-28T10:30:00.000Z",
    "currentPeriodEnd": "2027-04-28T10:30:00.000Z"
  }
}
```

## Error Responses

| Status | Trigger |
|---|---|
| `400` | Invalid `purchaseToken`, Google API error, expired subscription, inactive `subscriptionState`, unknown `productId`, **`testPurchase: true` in production** |
| `401` | Missing/invalid bearer JWT |
| `409` | Purchase token already linked to another user account, **OR `obfuscatedAccountId` does not match `uuidv5(userId, IAP_NAMESPACE)`** |
| `429` | Rate limit exceeded (30 req/min per user) |
| `500` | Google service account credentials misconfigured |
