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
- **Controller**: [subscription.controller.ts](file:///src/app/modules/subscription/subscription.controller.ts) — `getMySubscription`
- **Service**: [subscription.service.ts](file:///src/app/modules/subscription/subscription.service.ts) — `getSubscriptionByUserIdFromDB`

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

### 9.2 Verify Receipt (IAP)

```
POST /subscriptions/verify-receipt
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Mobile IAP SDK theke pawa store receipt server-e verify korar jonno. Apple App Store / Google Play r shathe verify hoy ebong subscription record upsert kore. **Idempotent** — same receipt re-submit korle existing subscription return kore (used by Restore Purchases).

**Implementation:**
- **Route**: [subscription.route.ts](file:///src/app/modules/subscription/subscription.route.ts)
- **Controller**: [subscription.controller.ts](file:///src/app/modules/subscription/subscription.controller.ts) — `verifyReceipt`
- **Service**: [subscription.service.ts](file:///src/app/modules/subscription/subscription.service.ts) — `verifyReceiptAndUpsertSubscription`

**Business Logic (`verifyReceiptAndUpsertSubscription`):**
- Platform onujayi correct verifier select hoy (`AppleReceiptVerifier` / `GoogleReceiptVerifier`).
- Receipt store-er API te pathay verify korar jonno; signature, expiry, ebong product validity check kora hoy.
- Verified hole `plan` ebong `interval` `productId` theke derive kora hoy ebong subscription document upsert hoy current user-er jonno.
- `expiresAt`, `autoRenew`, ebong `originalTransactionId` save kora hoy webhook reconciliation-er jonno.
- Verification fail hole 400 throw kore — kono subscription state change hoy na.

**Request Body:**

| Field | Required | Type | Notes |
|---|---|---|---|
| `platform` | Yes | string | `"ios"` or `"android"` |
| `productId` | Yes | string | Store product ID (e.g., `com.tbsosick.premium.yearly`) |
| `receipt` | Yes | string | Base64-encoded receipt from native SDK |

```json
{
  "platform": "ios",
  "productId": "com.tbsosick.premium.yearly",
  "receipt": "<base64-encoded-receipt>"
}
```

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Subscription verified and updated",
    "data": {
      "plan": "PREMIUM",
      "interval": "yearly",
      "status": "ACTIVE",
      "expiresAt": "2027-04-28T00:00:00.000Z",
      "autoRenew": true
    }
  }
  ```
- **Scenario: Invalid Receipt (400)**
  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "Receipt verification failed. Please try again."
  }
  ```
- **Scenario: Receipt Belongs to Another Account (409)**
  ```json
  {
    "success": false,
    "statusCode": 409,
    "message": "This purchase is associated with a different account."
  }
  ```

> **Note**: Renewal / cancel events update `expiresAt` + plan via App Store / Play Store webhook handlers (server-side), no client action needed.

---

## API Status

| # | Endpoint | Status | Notes |
|---|---|:---:|---|
| 9.1 | `GET /subscriptions/me` | Done | Plan status check — never returns 404 (free users get `plan: "FREE"`) |
| 9.2 | `POST /subscriptions/verify-receipt` | 🟡 Spec Done · Code Pending | IAP receipt verification (Apple + Google). Idempotent for restore-purchases. Spec from [App Profile §6.6](../app-screens/06-profile.md). |
