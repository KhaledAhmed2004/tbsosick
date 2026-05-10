# 02. Verify Apple Purchase (iOS)

```http
POST /subscriptions/apple/verify
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> iOS StoreKit 2 theke pawa `signedTransactionInfo` verify kore. Apple server-er shathe cryptographic verification hoy ebong user-er plan update kore.

## Implementation
- **Route**: [subscription.route.ts](file:///src/app/modules/subscription/subscription.route.ts)
- **Controller**: [subscription.controller.ts](file:///src/app/modules/subscription/subscription.controller.ts) — `verifyApplePurchaseController`
- **Service**: [subscription.service.ts](file:///src/app/modules/subscription/subscription.service.ts) — `verifyApplePurchase`

### Business Logic (`verifyApplePurchase`)
- **Cryptographic Verification**: Apple library use kore JWS signature verify kora hoy.
- **Sandbox-in-Production Gate**: `NODE_ENV === 'production'` mode-e sandbox JWS reject hoy (`400 Bad Request`) — sandbox transactions only `development`/`staging` e accept kora hoy.
- **Buyer-Account Binding**: Transaction-er `appAccountToken` field check kora hoy. Mobile client-ke purchase time-e `appAccountToken = uuidv5(userId, IAP_NAMESPACE)` set korte hobe ([helpers/iap-account.ts](file:///src/app/modules/subscription/helpers/iap-account.ts)). Token mismatch → `409 Conflict` (receipt theft defense). Missing token → log warning, accept (soft rollout).
- **Fraud Guard**: Check kora hoy ei `originalTransactionId` onno kono account-e already link kora kina (`409 Conflict` jodi thake).
- **Upgrade Check**: Jodi transaction-e `isUpgraded` flag `true` thake, tobe request reject kora hoy (`400 Bad Request`). User-ke latest transaction verify korte hobe.
- **Plan Mapping**: `productId` theke server-side definition onujayi local `PREMIUM` plan map kora hoy.
- **Persistence**: `upsertForUser` call kore user-er current state update kora hoy, jekhane `expiresDate`, `environment`, ebong `transactionId` save kora hoy.

### Mobile Integration (iOS) — Required
StoreKit 2 purchase flow-e `Product.PurchaseOption.appAccountToken(_:)` use korte hobe deterministic UUID dite, derived from authenticated `userId` via UUIDv5 with the shared `IAP_NAMESPACE`. Mismatch → server 409 reject korbe.

## Request Body
```json
{
  "signedTransactionInfo": "<JWS-token-from-storekit2>"
}
```

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Apple subscription verified successfully",
  "data": {
    "_id": "...",
    "userId": "...",
    "plan": "PREMIUM",
    "status": "active",
    "platform": "apple",
    "environment": "production",
    "productId": "premium_monthly",
    "appleOriginalTransactionId": "2000000123456789",
    "appleLatestTransactionId": "2000000123456790",
    "startedAt": "2026-04-28T10:30:00.000Z",
    "currentPeriodEnd": "2027-04-28T10:30:00.000Z"
  }
}
```

## Error Responses

| Status | Trigger |
|---|---|
| `400` | Invalid JWS, expired/revoked transaction, bundle ID mismatch, unknown `productId`, **`isUpgraded === true`** (re-verify latest), **sandbox transaction in production** |
| `401` | Missing/invalid bearer JWT |
| `409` | Transaction already linked to another user account, **OR `appAccountToken` does not match `uuidv5(userId, IAP_NAMESPACE)`** |
| `429` | Rate limit exceeded (30 req/min per user) |
| `500` | Apple credentials misconfigured (root certs, .p8 key, issuer ID) |
