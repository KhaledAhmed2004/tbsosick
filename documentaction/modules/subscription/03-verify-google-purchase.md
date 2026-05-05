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
- **Fraud Guard**: Purchase token check kora hoy jate same purchase multiple accounts-e link na hoy.
- **Status Normalization**: Google-er `subscriptionState` (e.g., Active, Grace Period) local `ACTIVE` ba `PAST_DUE` status-e convert kora hoy.
- **Persistence**: User-er subscription record update kora hoy including `autoRenewing`, `googleOrderId`, ebong `expiryTime`.

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
