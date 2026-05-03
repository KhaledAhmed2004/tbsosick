# Subscription Module APIs

> **Section**: Backend API specifications for the subscription module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Profile](../app-screens/06-profile.md) — Subscription read for profile screen, IAP receipt verification on upgrade

---

## Endpoints Index

| # | Method | Endpoint | Auth | Used By |
|---|---|---|---|---|
| 9.1 | GET | `/subscriptions/me` | Bearer | [App Profile](../app-screens/06-profile.md) |
| 9.2 | POST | `/subscriptions/verify-receipt` | Bearer | [App Profile](../app-screens/06-profile.md) — Subscription Management / Upgrade flow |

---

### 9.1 Get My Subscription

```
GET /subscriptions/me
Auth: Bearer {{accessToken}}
```

> Current user-er active subscription plan ebong status fetch kore. Free user-er jonno o sobshomoy ekta plan object return hoy — 404 return hoy na.

**Implementation:**
- **Route**: [subscription.route.ts](file:///src/app/modules/subscription/subscription.route.ts)
- **Controller**: [subscription.controller.ts](file:///src/app/modules/subscription/subscription.controller.ts) — `getMySubscriptionController`
- **Service**: [subscription.service.ts](file:///src/app/modules/subscription/subscription.service.ts) — `getMySubscription`

**Business Logic (`getMySubscription`):**
- Prothome User-er `userId` diye existing subscription check kora hoy.
- Jodi database-e kono record na thake, tobe automatic ekta `FREE` plan logic upsert kora hoy (idempotent creation).
- Ete kore client-side e sobshomoy ekta valid plan object pawa nishchit kora hoy (never returns 404 for valid users).

#### Responses

- **Scenario: Success (200)**
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

---

### 9.2 Verify Apple Purchase (iOS)

```
POST /subscriptions/apple/verify
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> iOS StoreKit 2 theke pawa `signedTransactionInfo` verify kore. Apple server-er shathe cryptographic verification hoy ebong user-er plan update kore.

**Implementation:**
- **Route**: [subscription.route.ts](file:///src/app/modules/subscription/subscription.route.ts)
- **Controller**: [subscription.controller.ts](file:///src/app/modules/subscription/subscription.controller.ts) — `verifyApplePurchaseController`
- **Service**: [subscription.service.ts](file:///src/app/modules/subscription/subscription.service.ts) — `verifyApplePurchase`

**Business Logic (`verifyApplePurchase`):**
- **Cryptographic Verification**: Apple library use kore JWS signature verify kora hoy.
- **Fraud Guard**: Check kora hoy ei `originalTransactionId` onno kono account-e already link kora kina (`409 Conflict` jodi thake).
- **Plan Mapping**: `productId` theke server-side definition onujayi local `PREMIUM` plan map kora hoy.
- **Persistence**: `upsertForUser` call kore user-er current state update kora hoy, jekhane `expiresDate`, `environment`, ebong `transactionId` save kora hoy.

**Request Body:**
```json
{
  "signedTransactionInfo": "<JWS-token-from-storekit2>"
}
```

#### Responses

- **Scenario: Success (200)**
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

---

### 9.3 Verify Google Purchase (Android)

```
POST /subscriptions/google/verify
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Android BillingClient theke pawa `purchaseToken` verify kore. Google Play Developer API use kore state fetch kora hoy.

**Implementation:**
- **Route**: [subscription.route.ts](file:///src/app/modules/subscription/subscription.route.ts)
- **Controller**: [subscription.controller.ts](file:///src/app/modules/subscription/subscription.controller.ts) — `verifyGooglePurchaseController`
- **Service**: [subscription.service.ts](file:///src/app/modules/subscription/subscription.service.ts) — `verifyGooglePurchase`

**Business Logic (`verifyGooglePurchase`):**
- **State Fetching**: Google Play API (v2) theke latest subscription state fetch kora hoy.
- **Fraud Guard**: Purchase token check kora hoy jate same purchase multiple accounts-e link na hoy.
- **Status Normalization**: Google-er `subscriptionState` (e.g., Active, Grace Period) local `ACTIVE` ba `PAST_DUE` status-e convert kora hoy.
- **Persistence**: User-er subscription record update kora hoy including `autoRenewing`, `googleOrderId`, ebong `expiryTime`.

**Request Body:**
```json
{
  "purchaseToken": "<token-from-google-play>",
  "productId": "com.tbsosick.premium.yearly"
}
```

#### Responses

- **Scenario: Success (200)**
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

---

### 9.4 Set Free Plan (Internal/Manual)

```
POST /subscriptions/choose/free
Auth: Bearer {{accessToken}}
```

> User-ke manually free plan-e downgrade ba switch korte allow kore.

**Business Logic (`setFreePlan`):**
- User-er current subscription record-ke `FREE` plan ebong `ACTIVE` status-e reset kore dey.

---

### 9.5 Platform Webhooks (Server-to-Server)

- **Apple Webhook**: `POST /subscriptions/apple/webhook`
- **Google Webhook**: `POST /subscriptions/google/webhook`

> Store theke renewal, cancellation, ba billing issue-r update gulo automatically process hoy. Auth middleware thake na karon signature (Apple JWS / Google JWT) service level-e verify kora hoy.

---

## API Status

| # | Endpoint | Status | Notes |
|---|---|:---:|---|
| 9.1 | `GET /subscriptions/me` | Done | Plan status check — never returns 404 (free users get `plan: "FREE"`) |
| 9.2 | `POST /subscriptions/apple/verify` | Done | iOS IAP verification using StoreKit 2 JWS |
| 9.3 | `POST /subscriptions/google/verify` | Done | Android IAP verification via Google Publisher API |
| 9.4 | `POST /subscriptions/choose/free` | Done | Downgrade to FREE plan |
| 9.5 | `POST /subscriptions/.../webhook` | Done | Apple/Google server notifications (auto-sync) |
