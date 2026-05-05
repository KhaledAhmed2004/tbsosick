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
- **Fraud Guard**: Check kora hoy ei `originalTransactionId` onno kono account-e already link kora kina (`409 Conflict` jodi thake).
- **Plan Mapping**: `productId` theke server-side definition onujayi local `PREMIUM` plan map kora hoy.
- **Persistence**: `upsertForUser` call kore user-er current state update kora hoy, jekhane `expiresDate`, `environment`, ebong `transactionId` save kora hoy.

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
    "plan": "PREMIUM",
    "status": "ACTIVE",
    "platform": "APPLE",
    "currentPeriodEnd": "2027-04-28T10:30:00.000Z"
  }
}
```
