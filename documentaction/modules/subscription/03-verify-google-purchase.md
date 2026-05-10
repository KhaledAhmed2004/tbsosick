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
- **State Fetching**: Google Play API (v2) theke latest subscription state fetch kora hoy.
- **Test-Purchase Gate**: `NODE_ENV === 'production'` mode-e Google `testPurchase: true` token reject hoy (`400 Bad Request`) — license-tester transactions only non-production environments-e accept kora hoy.
- **Buyer-Account Binding**: Subscription-er `externalAccountIdentifiers.obfuscatedExternalAccountId` check kora hoy. Mobile client-ke `BillingFlowParams.setObfuscatedAccountId(uuidv5(userId, IAP_NAMESPACE))` use korte hobe ([helpers/iap-account.ts](file:///src/app/modules/subscription/helpers/iap-account.ts)). ID mismatch → `409 Conflict`. Missing → log warning, accept (soft rollout).
- **Fraud Guard**: Purchase token check kora hoy jate same purchase multiple accounts-e link na hoy. Upgrades/Downgrades-er khetre `linkedPurchaseToken` check kore existing record identify kora hoy.
- **Status Normalization**: Google-er `subscriptionState` (e.g., Active, Grace Period) local `ACTIVE` ba `PAST_DUE` status-e convert kora hoy.
- **Persistence**: User-er subscription record update kora hoy including `autoRenewing`, `googleOrderId`, ebong `expiryTime`.

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
    "plan": "PREMIUM",
    "status": "ACTIVE",
    "platform": "GOOGLE",
    "currentPeriodEnd": "2027-04-28T10:30:00.000Z"
  }
}
```
