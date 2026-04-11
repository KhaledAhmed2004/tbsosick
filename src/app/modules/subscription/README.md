# Subscription Module

> Apple In-App Purchase (StoreKit 2) + Google Play Billing integration
> for mobile-only app. Both providers fully implemented.

---

## Overview — কী এটা?

Ei module ti user subscriptions manage kore — **direct Apple StoreKit 2** ar **direct Google Play Billing** integration use kore, kono third-party middleman chara.

- **iOS users** subscribe korle Apple er **JWS signed transaction** backend e ashe, backend cryptographically verify kore DB te save kore, tarpor Apple er **App Store Server Notifications V2** webhook diye lifecycle events (renewal, cancel, refund, expire) real-time e track kore.
- **Android users** subscribe korle backend Google er **Android Publisher API** (`purchases.subscriptionsv2.get`) call kore authoritative state ane, tarpor **Real-Time Developer Notifications (RTDN)** Cloud Pub/Sub push diye lifecycle events real-time e track kore.

Dui platform er state machine same `Subscription` doc e converge kore — same `plan`, `status`, `currentPeriodEnd` field, sudhu `platform` field e `apple` / `google` distinguish kora hoy.

**Keno ei approach:**
- **Free forever** — kono recurring third-party fee nai (RevenueCat-er moto MTR % nai)
- **Full control** — verification + state machine logic tor hater e
- **No third-party dependency** — Apple SDK + Google SDK + tor backend, bas
- **Zero vendor lock-in**

**Cons je thakte pare:**
- Apple + Google alada API — dui ta provider alada maintain korte hobe (eta kora ache)
- Apple/Google er policy/library updates track korte hobe
- Built-in analytics/dashboard nai — nije query likhte hobe

---

## Current Implementation Status

| Feature | Status |
|---|---|
| Apple StoreKit 2 verification | ✅ Complete |
| Apple Server Notifications V2 webhook | ✅ Complete |
| Google Play subscriptionsv2 verification | ✅ Complete |
| Google Play RTDN (Pub/Sub) webhook | ✅ Complete |
| Pub/Sub JWT verification | ✅ Complete |
| Subscription lifecycle state machine | ✅ Complete |
| Idempotent webhook handling | ✅ Complete |
| Fraud prevention (unique indexes) | ✅ Complete |
| Grace period support | ✅ Complete |
| Refund immediate revoke | ✅ Complete |
| Access gating helpers (`isUserPremium`) | ✅ Complete |
| Enterprise tier via store purchase | ✅ Complete |

---

## Architecture

### File tree

```
src/app/modules/subscription/
├── README.md                           ← this file
│
├── providers/
│   ├── apple/
│   │   ├── apple.types.ts              ← local type aliases (narrow shape)
│   │   ├── apple.client.ts             ← SignedDataVerifier lazy singleton
│   │   ├── apple.verify.ts             ← verifyAppleTransaction() — JWS verify
│   │   └── apple.webhook.ts            ← handleAppleNotification() — state machine
│   └── google/
│       ├── google.types.ts             ← local type aliases for Google Play
│       ├── google.client.ts            ← Android Publisher + Pub/Sub verifier singletons
│       ├── google.verify.ts            ← verifyGoogleSubscription() — API call
│       └── google.webhook.ts           ← handleGoogleNotification() — Pub/Sub + RTDN state machine
│
├── helpers/
│   ├── plan.mapper.ts                  ← productId → SUBSCRIPTION_PLAN lookup table
│   └── entitlement.ts                  ← isUserPremium, getUserEntitlement, etc.
│
├── subscription.interface.ts           ← types, enums
├── subscription.model.ts               ← Mongoose schema with unique indexes
├── subscription.service.ts             ← business logic
├── subscription.controller.ts          ← HTTP handlers
├── subscription.route.ts               ← routes
└── subscription.validation.ts          ← Zod schemas
```

### Request flow (initial purchase)

```
┌─────────────────┐
│  Flutter app    │  User taps "Subscribe"
│   (StoreKit 2)  │
└────────┬────────┘
         │
         │ 1. StoreKit presents Apple purchase sheet
         │ 2. User confirms → Apple processes payment
         │ 3. Apple returns signedTransactionInfo (JWS)
         ▼
┌─────────────────┐
│  Flutter app    │  POST /api/v1/subscription/apple/verify
└────────┬────────┘  Headers: Authorization: Bearer <JWT>
         │            Body: { signedTransactionInfo: "eyJhbGc..." }
         ▼
┌────────────────────────────────────────┐
│  Express route                         │
│  - auth() middleware (JWT validation)  │
│  - rateLimit (30/min)                  │
│  - validateRequest (Zod)               │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  verifyApplePurchaseController         │
│  (catchAsync wrapper)                  │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  SubscriptionService.verifyApplePurchase│
│  1. verifyAppleTransaction()            │  ← cryptographic check
│  2. Fraud check (existing txn → other user?)
│  3. mapAppleProductToPlan()             │
│  4. Upsert subscription doc             │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  MongoDB                               │
│  Subscription doc upserted with:       │
│  - plan: PREMIUM                       │
│  - status: active                      │
│  - platform: apple                     │
│  - appleOriginalTransactionId (unique) │
│  - currentPeriodEnd, etc.              │
└────────────────────────────────────────┘
```

### Webhook flow (lifecycle events)

```
┌──────────────────────┐
│  Apple Server        │  Event happens (renewal, cancel, refund, etc.)
└────────┬─────────────┘
         │
         │ POST /api/v1/subscription/apple/webhook
         │ Body: { signedPayload: "eyJhbGc..." } (V2 JWS)
         ▼
┌────────────────────────────────────────┐
│  Express raw body middleware           │
│  (no express.json — raw Buffer)        │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  appleWebhookController                │
│  - Parse Buffer → JSON                 │
│  - Extract signedPayload               │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  handleAppleNotification()             │
│  1. verifyAndDecodeNotification (JWS)  │
│  2. Check if TEST notification         │
│  3. Decode nested signedTransactionInfo│
│  4. Find subscription by originalTxnId │
│  5. Idempotency check (notificationUUID)│
│  6. Run state machine (switch on type) │
│  7. Update subscription doc            │
└────────────────────────────────────────┘
```

---

## Files Explained

### New files (6)

#### 1. `providers/apple/apple.types.ts`
Local TypeScript type aliases. Wraps `@apple/app-store-server-library` types into a narrower, safer shape so the rest of the module doesn't depend directly on library internals. If the Apple library changes its type shapes in a future version, only this file needs to adapt.

**Exports:**
- `AppleEnvironment` = `'sandbox' | 'production'`
- `DecodedAppleTransaction` — normalized transaction shape
- `AppleWebhookResult` — webhook processing result

#### 2. `providers/apple/apple.client.ts`
Lazy-initialized `SignedDataVerifier` singleton.

**Why lazy:** Server boot never touches Apple credentials. Only when a verify/webhook endpoint is actually hit does the client load certificates and initialize. This means the server can start even if Apple keys aren't configured yet — you only get an error when trying to verify.

**Exports:**
- `getAppleVerifier()` — returns cached singleton, loads certs on first call
- `resetAppleVerifierForTests()` — for test isolation

**Loads from:**
- `config.apple.rootCertsDir` → reads all `.cer` / `.der` files as `Buffer[]`
- `config.apple.bundleId` → passed to verifier
- `config.apple.environment` → maps to `Environment.SANDBOX` or `Environment.PRODUCTION`

#### 3. `providers/apple/apple.verify.ts`
Handles the initial purchase verification when a client sends a fresh StoreKit 2 transaction.

**Main export:** `verifyAppleTransaction(signedTransactionInfo: string)`

**What it does:**
1. Cryptographically verifies the JWS via `SignedDataVerifier.verifyAndDecodeTransaction()`
2. Guards all required fields (transactionId, originalTransactionId, productId, bundleId)
3. Checks `bundleId` matches configured bundle (cross-app replay protection)
4. Rejects if `revocationDate` is set (already refunded/revoked)
5. Rejects if `expiresDate` is in the past
6. Returns normalized `DecodedAppleTransaction`

**Throws:**
- `ApiError(400)` — invalid JWS, missing fields, expired, revoked, bundle mismatch

#### 4. `providers/apple/apple.webhook.ts`
Handles Apple App Store Server Notifications V2 events.

**Main export:** `handleAppleNotification(signedPayload: string)`

**State machine logic** (`buildUpdatesForNotification`):

| Apple event | Local action |
|---|---|
| `SUBSCRIBED` (initial) | `status: ACTIVE`, set plan + `currentPeriodEnd`, clear cancel/grace fields |
| `DID_RENEW` | Extend `currentPeriodEnd`, keep `ACTIVE`, clear grace |
| `DID_FAIL_TO_RENEW` | Set `PAST_DUE` (grace period active — user keeps access) |
| `GRACE_PERIOD_EXPIRED` | Set `INACTIVE`, plan → `FREE` |
| `EXPIRED` | Set `INACTIVE`, plan → `FREE` |
| `REFUND` | Set `CANCELED`, plan → `FREE`, immediate revoke |
| `REVOKE` (family sharing) | Set `CANCELED`, plan → `FREE`, immediate revoke |
| `DID_CHANGE_RENEWAL_STATUS` | Update `autoRenewing` flag |
| `DID_CHANGE_RENEWAL_PREF` | Plan change scheduled — no immediate action (applied on next renewal) |
| `TEST` | Log only, return 200 |
| Others | Log, no state change |

**Idempotency:**
- Apple can retry webhooks on failure
- We store `metadata.lastAppleNotificationUUID` on the subscription doc
- Duplicate notifications (same UUID) are detected and skipped

**Orphan handling:**
- If webhook arrives for a subscription we don't have in DB yet, we log and skip
- The client's `/apple/verify` call will eventually create the record

#### 5. `helpers/plan.mapper.ts`
Explicit `productId → SUBSCRIPTION_PLAN` lookup table. Replaces the old brittle string-matching approach (`productId.includes('premium')`).

**Current mapping:**
```typescript
{
  premium_monthly:     PREMIUM,    // $5.99/mo
  premium_yearly:      PREMIUM,    // $3.99/mo billed yearly
  enterprise_monthly:  ENTERPRISE, // $9.99/mo
  enterprise_yearly:   ENTERPRISE, // $5.99/mo billed yearly
}
```

**Pricing tiers:**
| Plan | Monthly | Yearly (per month) |
|---|---|---|
| FREE | $0 | — |
| PREMIUM | $5.99/mo | $3.99/mo billed yearly |
| ENTERPRISE | $9.99/mo | $5.99/mo billed yearly |

**When adding a new product** in App Store Connect / Play Console, add the exact product identifier here. Unknown product IDs resolve to `FREE` so verification code can detect and reject them cleanly.

**Exports:**
- `mapAppleProductToPlan(productId)`
- `mapGoogleProductToPlan(productId)` (same table, ready for Google phase)
- `isKnownProductId(productId)`
- `getKnownProductIds()`

#### 6. `helpers/entitlement.ts`
Access gating helpers. Use these throughout the app to check if a user has premium access.

**Exports:**
- `getUserEntitlement(userId)` — returns full entitlement object
- `isUserPremium(userId)` — boolean
- `isUserEnterprise(userId)` — boolean

**Critical logic:**
- `ACTIVE_STATUSES` set includes `ACTIVE`, `TRIALING`, **and `PAST_DUE`**
- This means users in the **grace period** (billing retry phase) **keep their access** — this matches Apple/Google's user-friendly behavior and is the industry standard
- `isPremium = isActive && plan !== FREE`
- `isEnterprise = isActive && plan === ENTERPRISE`

**Usage example** in another module:
```typescript
import { isUserPremium } from '../subscription/helpers/entitlement';

// In a feature controller:
if (!(await isUserPremium(req.user.id))) {
  throw new ApiError(403, 'Premium subscription required');
}
```

---

### Edited files (8)

#### 7. `subscription.interface.ts`

**Exports:**
- Enums: `SUBSCRIPTION_PLAN` (`FREE`/`PREMIUM`/`ENTERPRISE`), `SUBSCRIPTION_STATUS` (`active`/`trialing`/`past_due`/`canceled`/`inactive`), `SUBSCRIPTION_PLATFORM` (`apple`/`google`/`admin`)
- Type: `ISubscription` — full subscription document shape
- Type: `SubscriptionModel` — Mongoose model interface with static methods

**Key fields on ISubscription:**
```typescript
{
  userId: Types.ObjectId,
  plan: SubscriptionPlanType,
  status: SubscriptionStatusType,
  platform?: 'apple' | 'google' | 'admin',
  environment?: 'sandbox' | 'production',
  productId?: string,
  autoRenewing?: boolean,

  // Apple-specific
  appleOriginalTransactionId?: string,  // unique index
  appleLatestTransactionId?: string,

  // Google-specific (for phase 2)
  googlePurchaseToken?: string,         // unique index
  googleOrderId?: string,

  // Lifecycle
  startedAt?: Date | null,
  currentPeriodEnd?: Date | null,
  gracePeriodEndsAt?: Date | null,
  canceledAt?: Date | null,

  metadata?: Record<string, any>,
}
```

#### 8. `subscription.model.ts`

Mongoose schema with critical constraints:

- `userId: unique` — one subscription doc per user (upsert pattern)
- `appleOriginalTransactionId: { unique: true, sparse: true }` — **fraud prevention**: same Apple transaction cannot be linked to two different user accounts
- `googlePurchaseToken: { unique: true, sparse: true }` — same for Google
- `platform`, `productId` — indexed for queries
- Timestamps enabled

**Static methods:**
- `findByUser(userId)` — lookup by user
- `upsertForUser(userId, payload)` — create or update atomically

#### 9. `subscription.service.ts`

Thin orchestration layer — delegates to providers + helpers.

**Exports:**
- `getMySubscription(userId)` — returns user's subscription (creates FREE default if none exists)
- `setFreePlan(userId)` — manual switch to FREE
- `verifyApplePurchase(userId, signedTransactionInfo)` — Apple initial purchase flow
- `processAppleWebhook(signedPayload)` — passthrough to `handleAppleNotification`
- `verifyGooglePurchase(userId, purchaseToken, productId)` — Google initial purchase flow
- `processGoogleWebhook(rawBody, authorizationHeader)` — passthrough to `handleGoogleNotification`

**`verifyApplePurchase` flow:**
1. Call `verifyAppleTransaction(signedTransactionInfo)` — cryptographic verification
2. **Fraud check:** query `SubscriptionModel.findOne({ appleOriginalTransactionId })`. If exists and `userId` is different → throw `409 Conflict`
3. Map `decoded.productId` → `SubscriptionPlan` via `mapAppleProductToPlan()`
4. Reject unknown productIds with `400 Bad Request`
5. `SubscriptionModel.upsertForUser()` with all fields populated
6. Return updated subscription doc

**`verifyGooglePurchase` flow:**
1. Call `verifyGoogleSubscription(purchaseToken, productId)` — Android Publisher API call
2. **Fraud check:** query `SubscriptionModel.findOne({ googlePurchaseToken })`. If exists and `userId` is different → throw `409 Conflict`
3. Map `decoded.productId` → `SubscriptionPlan` via `mapGoogleProductToPlan()`
4. Reject unknown productIds with `400 Bad Request`
5. Translate Google's `subscriptionState` to local status (`ACTIVE` or `PAST_DUE`)
6. Reject if subscription is not active or in grace period
7. `SubscriptionModel.upsertForUser()` with all fields populated
8. Return updated subscription doc

**Removed from previous version:**
- `verifyIapSubscription()` — the old fake verification that accepted any receipt string. Replaced by the new crypto-verified flow.
- `mapIapProductToPlan()` — replaced by `plan.mapper.ts`

#### 10. `subscription.validation.ts`

Zod schemas for request validation.

**Exports:**
- `SubscriptionValidation.appleVerifySchema` — requires `body.signedTransactionInfo: string`
- `SubscriptionValidation.googleVerifySchema` — requires `body.purchaseToken: string` and `body.productId: string`

The old `verifyIapSubscriptionSchema` is removed (the endpoint it validated is gone).

#### 11. `subscription.controller.ts`

HTTP handlers using project conventions (`catchAsync`, `sendResponse`, `ApiError`).

**Exports:**
- `getMySubscriptionController` — `GET /me`
- `verifyApplePurchaseController` — `POST /apple/verify`
- `appleWebhookController` — `POST /apple/webhook` (special: handles raw Buffer body)
- `verifyGooglePurchaseController` — `POST /google/verify`
- `googleWebhookController` — `POST /google/webhook` (special: handles raw Buffer body + Pub/Sub JWT verification)
- `chooseFreePlanController` — `POST /choose/free`

**Webhook controller special handling:**
- Both `/apple/webhook` and `/google/webhook` routes use `express.raw()` middleware, so `req.body` is a `Buffer`, not a parsed object
- Apple: Manually `JSON.parse(req.body.toString('utf8'))` to extract `signedPayload`
- Google: Passes raw body + `Authorization` header to `processGoogleWebhook()` for Pub/Sub JWT verification + RTDN decode
- Validates presence, then calls the respective service method

#### 12. `subscription.route.ts`

Routes with middleware chain (rate limit → auth → validate → controller):

```
GET  /api/v1/subscription/me               auth required
POST /api/v1/subscription/apple/verify     auth + rate limit + validation
POST /api/v1/subscription/apple/webhook    no auth (JWS self-verifies)
POST /api/v1/subscription/google/verify    auth + rate limit + validation
POST /api/v1/subscription/google/webhook   no auth (Pub/Sub JWT self-verifies)
POST /api/v1/subscription/choose/free      auth required
```

**Removed:** old `POST /iap/verify` route (the fake-verification endpoint).

#### 13. `src/config/index.ts`

Added `apple` and `googlePlay` config sections:

```typescript
apple: {
  bundleId: process.env.APPLE_BUNDLE_ID || '',
  appAppleId: process.env.APPLE_APP_APPLE_ID,
  keyId: process.env.APPLE_KEY_ID,
  issuerId: process.env.APPLE_ISSUER_ID,
  privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH,
  environment: (process.env.APPLE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  rootCertsDir: process.env.APPLE_ROOT_CERTS_DIR || './secrets/apple-root-certs',
}

googlePlay: {
  packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || '',
  serviceAccountPath: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH || './secrets/google-service-account.json',
  pubsubAudience: process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE || '',
  pubsubServiceAccountEmail: process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL || '',
}
```

#### 14. `src/app.ts`

Added raw body middleware for both webhook routes **before** the generic `express.json()`:

```typescript
app.use(
  '/api/v1/subscription/apple/webhook',
  express.raw({ type: 'application/json' })
);
app.use(
  '/api/v1/subscription/google/webhook',
  express.raw({ type: 'application/json' })
);
app.use(express.json());
```

**Why:** Apple's JWS signature is computed over the **original raw bytes** of the request body. Google's Pub/Sub push also delivers raw JSON that needs to be parsed manually after JWT verification. If `express.json()` parses the body first, the bytes mutate (whitespace changes, field reordering, etc.) and signature verification fails. The raw parser preserves bytes as-is for the controllers to JSON.parse manually.

---

## NPM Packages

```bash
npm install @apple/app-store-server-library
npm install googleapis google-auth-library
```

**Apple — `@apple/app-store-server-library`** (`^3.0.0`)
- `SignedDataVerifier` — JWS verification
- `AppStoreServerAPIClient` — for calling App Store Server API endpoints
- Type definitions for all Apple data shapes
- `NotificationTypeV2` enum, `Environment` enum

**Google — `googleapis` + `google-auth-library`**
- `google.androidpublisher({ version: 'v3' })` — Android Publisher API client
- `google.auth.GoogleAuth` — service-account-based auth
- `OAuth2Client.verifyIdToken` — verify Pub/Sub push bearer JWTs

---

## API Endpoints

### `GET /api/v1/subscription/me`

Get the current user's subscription.

**Auth:** Bearer JWT required
**Rate limit:** None
**Body:** None

**Response 200:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription retrieved successfully",
  "data": {
    "_id": "6712abc...",
    "userId": "6712xyz...",
    "plan": "PREMIUM",
    "status": "active",
    "platform": "apple",
    "environment": "sandbox",
    "productId": "premium_monthly",
    "autoRenewing": true,
    "appleOriginalTransactionId": "2000000123456789",
    "startedAt": "2026-04-10T12:00:00Z",
    "currentPeriodEnd": "2026-05-10T12:00:00Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

If user has no subscription yet, a FREE/active default is created and returned.

---

### `POST /api/v1/subscription/apple/verify`

Verify an Apple IAP initial purchase. Called by the Flutter client after StoreKit 2 completes a purchase.

**Auth:** Bearer JWT required
**Rate limit:** 30 requests per minute per route
**Validation:** Zod schema — `signedTransactionInfo` required string

**Request body:**
```json
{
  "signedTransactionInfo": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
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
    "productId": "premium_monthly",
    "currentPeriodEnd": "2026-05-10T12:00:00Z",
    ...
  }
}
```

**Error responses:**
- `400` — Invalid JWS, missing fields, expired transaction, revoked, bundle mismatch, unknown productId
- `401` — Missing/invalid JWT
- `409` — Transaction already linked to another user account (fraud prevention)
- `429` — Rate limit exceeded
- `500` — Apple credentials not configured (on first call when certs/keys missing)

---

### `POST /api/v1/subscription/apple/webhook`

Apple App Store Server Notifications V2 webhook. Called by Apple's servers when subscription lifecycle events happen.

**Auth:** None — JWS signature verification replaces caller trust
**Body:** Raw JSON (not parsed by express.json — see raw body middleware note)

**Expected body shape:**
```json
{
  "signedPayload": "eyJhbGciOiJFUzI1NiIs..."
}
```

**Response 200:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Apple webhook processed",
  "data": {
    "processed": true,
    "notificationType": "DID_RENEW",
    "subtype": null,
    "reason": "applied"
  }
}
```

**Response 200 (skipped cases — still 200 to prevent Apple retries):**
- `{ processed: false, reason: "duplicate" }` — idempotency hit
- `{ processed: false, reason: "no_transaction_info" }` — payload missing transaction
- `{ processed: false, reason: "no_matching_subscription" }` — orphan notification

**Error responses:**
- `400` — Invalid JWS or malformed body
- `500` — Credentials not configured

**Configuration required in App Store Connect:**
- App Information → App Store Server Notifications
- Production Server URL: `https://<your-domain>/api/v1/subscription/apple/webhook`
- Sandbox Server URL: same
- Version: Version 2 Notifications (JWS format)

---

### `POST /api/v1/subscription/google/verify`

Verify a Google Play subscription purchase. Called by the Android client after `BillingClient` completes a purchase.

**Auth:** Bearer JWT required
**Rate limit:** 30 requests per minute per route
**Validation:** Zod schema — `purchaseToken` and `productId` required

**Request body:**
```json
{
  "purchaseToken": "abc123...",
  "productId": "premium_monthly"
}
```

**Response 200:**
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
    "productId": "premium_monthly",
    "googlePurchaseToken": "abc123...",
    "googleOrderId": "GPA.1234-5678-9012-34567",
    "currentPeriodEnd": "2026-05-10T12:00:00Z"
  }
}
```

**Error responses:**
- `400` — Google API error, expired subscription, inactive state, unknown productId
- `401` — Missing/invalid JWT
- `409` — Purchase token already linked to another user
- `429` — Rate limit exceeded
- `500` — Google credentials not configured

---

### `POST /api/v1/subscription/google/webhook`

Google Play Real-Time Developer Notifications webhook (Pub/Sub push). Called by Google Cloud Pub/Sub when subscription lifecycle events happen.

**Auth:** None at the app layer — the service verifies the bearer JWT from Pub/Sub against the configured audience
**Body:** Raw JSON Pub/Sub envelope (not parsed by `express.json` — see raw body middleware note)

**Expected body shape:**
```json
{
  "message": {
    "data": "<base64-encoded RTDN JSON>",
    "messageId": "1234567890",
    "publishTime": "2026-04-10T12:00:00Z"
  },
  "subscription": "projects/your-project/subscriptions/play-rtdn-push"
}
```

**Decoded RTDN payload (after base64 decode of `message.data`):**
```json
{
  "version": "1.0",
  "packageName": "com.yourcompany.tbsosick",
  "eventTimeMillis": "1712750400000",
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 2,
    "purchaseToken": "abc123...",
    "subscriptionId": "premium_monthly"
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Google webhook processed",
  "data": {
    "processed": true,
    "notificationType": "SUBSCRIPTION_RENEWED",
    "rawNotificationType": 2,
    "reason": "applied"
  }
}
```

**Skipped cases (still return 200 to prevent Pub/Sub retries):**
- `{ processed: false, reason: "duplicate" }` — same `messageId` already processed
- `{ processed: false, reason: "no_subscription_notification" }` — Pub/Sub message wasn't a subscription RTDN
- `{ processed: false, reason: "no_matching_subscription" }` — orphan notification (client hasn't called `/google/verify` yet)
- `{ processed: false, reason: "test" }` — Play Console "Send test notification" button
- `{ processed: false, reason: "unauthorized" }` — JWT verification failed

**Configuration required:**
- GCP Pub/Sub topic + push subscription pointing here
- Play Console → Monetization → Real-time developer notifications → topic configured
- `GOOGLE_PLAY_PUBSUB_AUDIENCE` env var set to this URL

---

### `POST /api/v1/subscription/choose/free`

Manually switch user to FREE plan. Does not cancel actual Apple subscription (user must cancel via Settings).

**Auth:** Bearer JWT required

---

## Environment Variables

Add to `.env`:

```bash
# Apple IAP — required for Apple side of subscription module
APPLE_BUNDLE_ID=com.yourcompany.tbsosick          # from App Store Connect
APPLE_APP_APPLE_ID=1234567890                     # numeric App ID from App Store Connect
APPLE_KEY_ID=ABC1234DEF                           # 10-char Key ID from API key generation
APPLE_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  # UUID from App Store Connect
APPLE_PRIVATE_KEY_PATH=./secrets/apple-key.p8     # path to .p8 private key file
APPLE_ENVIRONMENT=sandbox                         # 'sandbox' or 'production'
APPLE_ROOT_CERTS_DIR=./secrets/apple-root-certs   # directory containing Apple root CAs

# Google Play Billing — required for Google side of subscription module
GOOGLE_PLAY_PACKAGE_NAME=com.yourcompany.tbsosick
GOOGLE_PLAY_SERVICE_ACCOUNT_PATH=./secrets/google-service-account.json
GOOGLE_PLAY_PUBSUB_AUDIENCE=https://your-domain.com/api/v1/subscription/google/webhook
GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL=your-pubsub-pusher@your-project.iam.gserviceaccount.com
```

**IMPORTANT:**
- Add `secrets/` to `.gitignore` — never commit these files
- The `.p8` file can only be downloaded once from App Store Connect
- Sandbox and production environments use different URLs; the library auto-detects based on the transaction environment

---

## External Setup (Apple Developer Account)

### Step 1 — Apple Developer Program

1. Visit https://developer.apple.com/programs/enroll/
2. Enroll for $99/year (Individual or Organization)
3. Wait 24-48 hours for approval

### Step 2 — Create app in App Store Connect

1. https://appstoreconnect.apple.com/ → My Apps → `+` → New App
2. Platforms: iOS
3. Bundle ID: create if needed (must have "In-App Purchase" capability enabled)
4. SKU: internal identifier

### Step 3 — Create Subscription Group + Products

1. App Store Connect → your app → Features → In-App Purchases → Subscriptions
2. Create Subscription Group (e.g., "Premium Membership")
3. Inside the group, create subscriptions:

   | Product ID | Duration | Price |
   |---|---|---|
   | `premium_monthly` | 1 Month | $5.99/mo |
   | `premium_yearly` | 1 Year | $3.99/mo billed yearly |
   | `enterprise_monthly` | 1 Month | $9.99/mo |
   | `enterprise_yearly` | 1 Year | $5.99/mo billed yearly |

4. **Product IDs must match exactly** with `helpers/plan.mapper.ts`

### Step 4 — Generate API Key

1. App Store Connect → Users and Access → Integrations → In-App Purchase
2. Click "Generate API Key"
3. Download the `.p8` file (**only downloads once**)
4. Note the Key ID and Issuer ID
5. Save `.p8` file as `./secrets/apple-key.p8` in the project

### Step 5 — Download Apple Root Certificates

1. Visit https://www.apple.com/certificateauthority/
2. Download:
   - `AppleRootCA-G3.cer`
   - `AppleIncRootCertificate.cer`
3. Place both files in `./secrets/apple-root-certs/`

### Step 6 — Configure Server Notifications V2

1. App Store Connect → your app → App Information → scroll to App Store Server Notifications
2. Production Server URL: `https://<your-domain>/api/v1/subscription/apple/webhook`
3. Sandbox Server URL: same URL (library auto-detects)
4. Version: **Version 2 Notifications**
5. Click "Send Test Notification" to verify reachability — should return 200 OK

### Step 7 — Create Sandbox Tester

1. App Store Connect → Users and Access → Sandbox → Testers
2. Add a new tester (fake email OK, doesn't need to be real)
3. On a physical iPhone: Settings → App Store → Sandbox Account → sign in
4. Test purchase flow in your app

---

## Testing Guide

### iOS Sandbox Testing

Requirements:
- Physical iPhone (Simulator doesn't support real IAP)
- Sandbox tester account created in App Store Connect
- App signed with development certificate

**Accelerated timing in sandbox:**
- 1 day = 5 minutes
- 1 month = 10 minutes
- 1 year = 1 hour
- Auto-renews up to 6 times, then stops

**Test scenarios to validate:**
1. **Initial purchase:** Subscribe → check `GET /me` shows active
2. **Auto-renewal:** Wait 10 minutes → webhook fires `DID_RENEW` → `currentPeriodEnd` extends
3. **Cancel:** Settings → Subscriptions → Cancel → webhook `DID_CHANGE_RENEWAL_STATUS` (autoRenewing: false). User still has access until period ends.
4. **Expire:** Let subscription expire → webhook `EXPIRED` → status becomes `inactive`, plan `FREE`
5. **Refund:** Use Sandbox App e request refund → webhook `REFUND` → status `canceled`, immediate plan `FREE`
6. **Restore:** On a new device with same Apple ID, subscription should be recovered

### Webhook Testing

**From App Store Connect:**
- App Information → App Store Server Notifications → "Send Test Notification" button
- Server should respond 200 with `{ processed: true, notificationType: "TEST" }`

**From your own code:**
- Apple library `SignedDataVerifier` rejects unsigned test payloads, so you can't easily fake webhooks locally
- Use actual sandbox purchases to trigger real webhooks

**Local dev with ngrok:**
```bash
npm install -g ngrok
ngrok http 5000
# Copy the https://abc123.ngrok-free.app URL
# Temporarily set this URL in App Store Connect Server Notifications
# Test sandbox purchase — webhook will hit your local server
```

---

## Security Features

| Attack surface | Protection |
|---|---|
| **Fake receipt injection** | JWS cryptographic signature verification via `SignedDataVerifier` |
| **Same receipt used by multiple accounts** | Unique sparse index on `appleOriginalTransactionId` |
| **Tampered transaction data** | JWS signature includes all fields; any modification invalidates |
| **Expired transaction replay** | `expiresDate` check rejects past-expiry transactions |
| **Revoked transaction replay** | `revocationDate` check rejects revoked transactions |
| **Cross-bundle receipt injection** | `bundleId` match check against `config.apple.bundleId` |
| **Duplicate webhook processing** | `notificationUUID` idempotency check in `metadata` |
| **Unknown product IDs** | Explicit lookup in `plan.mapper.ts`; unknown IDs rejected 400 |
| **Rate limiting** | 30 requests/minute on `/apple/verify` |
| **Missing JWT auth** | `auth()` middleware on verify endpoint |
| **Webhook spoofing** | JWS signature verification; no auth middleware needed |

---

## Troubleshooting

### Error: "Apple root certificates directory not found"

**Cause:** `APPLE_ROOT_CERTS_DIR` doesn't exist or has no `.cer` files.

**Fix:**
1. Download Apple root CAs from https://www.apple.com/certificateauthority/
2. Place `.cer` files in the configured directory (default `./secrets/apple-root-certs/`)
3. Make sure files have `.cer` or `.der` extension

### Error: "APPLE_BUNDLE_ID environment variable is not configured"

**Cause:** `.env` missing `APPLE_BUNDLE_ID`.

**Fix:** Add the bundle ID from App Store Connect to `.env`.

### Error: "Bundle ID mismatch: expected X, received Y"

**Cause:** The transaction was made by a different app (bundle), or the env var is wrong.

**Fix:** Verify `APPLE_BUNDLE_ID` in `.env` matches the actual bundle ID registered in App Store Connect AND embedded in the iOS app build.

### Error: "This Apple transaction is already linked to another account" (409)

**Cause:** The `originalTransactionId` is already associated with a different user in the DB.

**Fix:** This is fraud prevention working correctly. A user cannot buy one subscription and share it across multiple accounts. If a legitimate case (e.g., user created a new account), admin should manually clean up the old subscription record.

### Error: "Unknown or unsupported productId: X"

**Cause:** The productId returned from Apple doesn't exist in `helpers/plan.mapper.ts`.

**Fix:** Add the productId to the `PRODUCT_ID_TO_PLAN` lookup table. Make sure the ID matches exactly what was configured in App Store Connect.

### Webhook returns 200 but subscription doesn't update

**Possible causes:**
1. **Orphan notification** — client hasn't called `/verify` yet, so no subscription doc exists. Log message: "Orphan Apple notification ..."
2. **Duplicate** — notificationUUID matches existing `metadata.lastAppleNotificationUUID`. Log message: check response `reason: 'duplicate'`
3. **Unhandled notification type** — falls through the switch statement. Log message: "Apple notification X — no state change"

**Fix:** Check server logs for the specific reason.

### "Apple notification verification failed"

**Cause:** Could be:
- JWS signature invalid (malformed payload)
- Root certs wrong version
- Clock skew

**Fix:**
1. Verify root certs are downloaded from the official Apple URL
2. Check server clock is accurate (NTP)
3. If testing, make sure you're using real Apple-signed payloads, not hand-crafted fakes

---

## Google Play Integration

### Architecture differences vs Apple

| Concern | Apple | Google Play |
|---|---|---|
| **Initial verify input** | JWS-signed transaction string | `purchaseToken` + `productId` (opaque) |
| **Verification mechanism** | Local JWS signature check (offline crypto) | Server-to-server API call to Android Publisher |
| **Webhook transport** | Direct HTTPS POST from Apple | Google Cloud Pub/Sub push delivery |
| **Webhook auth** | JWS signature on payload | OAuth bearer JWT signed by Pub/Sub |
| **Notification body** | Decoded JWS with signed transaction | Base64-encoded RTDN payload inside Pub/Sub envelope |

### Google API endpoints used

- `purchases.subscriptionsv2.get(packageName, token)` — fetches the latest subscription state
- Real-Time Developer Notifications (RTDN) via Cloud Pub/Sub Push subscription

### Google Play Console + GCP setup

#### Step 1 — Google Play Console signup
1. Go to https://play.google.com/console
2. Pay $25 one-time registration fee
3. Complete identity verification (takes 1-2 days)

#### Step 2 — Create subscription products in Play Console

**Google Play er subscription model ta 3-tier hierarchy:**
```
Subscription (product — just a container, NO price here)
  └── Base Plan (actual pricing + duration lives HERE)
        └── Offer (optional — free trial, intro discount, etc.)
```
- **Subscription** = container with a Product ID + name. Price set kora jay NA directly.
- **Base Plan** = price, duration, grace period — shob ekhane. Ekta subscription e multiple base plan thakte pare (e.g., monthly + yearly).
- **Offer** = optional promotional discount attached to a base plan.

**Base Plan types:**
| Type | Description |
|---|---|
| **Auto-renewing** | Monthly/yearly charge, auto-renews until cancel. Most common. |
| **Prepaid** | One-time payment, NO auto-renew. User manually top-up kore extend korte hoy. |
| **Installments** | Commitment-based (e.g., 12 monthly payments). Select countries only. |

**Now create the products:**

1. Play Console → select your app
2. Left sidebar: **Monetize with Play** → **Products** → **Subscriptions**
3. Click **"Create subscription"** button (top-right)
4. Fill in:
   - Product ID: `premium_monthly`
   - Name: "Premium Monthly"
5. Click **"Create"** — you land on the **subscription detail page**

6. Scroll to the **"Base plans and offers"** section (this is INSIDE the subscription detail page, not a separate tab)
7. Click **"Add base plan"**
8. Fill in:
   - Base Plan ID: e.g. `monthly-autorenew` (monthly er jonno) or `yearly-autorenew` (yearly er jonno)
   - Type: **Auto-renewing**
   - Billing period: **1 month** (monthly) or **1 year** (yearly)
   - Grace period: **7 days** (recommended — retry failed payments before cancelling)
   - Account hold: enable if you want (user loses access but subscription isn't fully cancelled)
   - Resubscribe: enable (let cancelled users resubscribe from Play Store)
9. Click **"Set prices"** → enter price in your default currency (e.g. $5.99 USD)
   - Google auto-generates converted prices for all other countries
   - You can manually override individual country prices
   - Click **"Update"** to confirm
10. Click **"Save"** on the base plan
11. **IMPORTANT:** Base plan starts in **Draft** status — click **"Activate"** to make it live

12. Repeat steps 3-11 for the remaining 3 products:

    | Product ID | Base Plan ID | Name | Duration | Price |
    |---|---|---|---|---|
    | `premium_yearly` | `yearly-autorenew` | Premium Yearly | 1 year | $3.99/mo billed yearly ($47.88/yr) |
    | `enterprise_monthly` | `monthly-autorenew` | Enterprise Monthly | 1 month | $9.99/mo |
    | `enterprise_yearly` | `yearly-autorenew` | Enterprise Yearly | 1 year | $5.99/mo billed yearly ($71.88/yr) |

13. Product IDs must match exactly with `helpers/plan.mapper.ts`

**Common confusion points:**
- "Subscription create korlam but price field nai!" → Price subscription e na, **base plan e** set hoy. "Add base plan" click koro.
- "Base plan kothay?" → Subscription er detail page er vitore **"Base plans and offers"** section e. Alada tab/page na.
- "Subscription app e dekhachhe na!" → Base plan probably still **Draft** — **"Activate"** click koro.

#### Step 3 — Create a GCP project
1. Go to https://console.cloud.google.com/
2. Click project dropdown (top bar) → **New Project**
3. Name it (e.g. `tbsosick-backend`) → **Create**

#### Step 4 — Enable Google Play Android Developer API
1. GCP Console → left sidebar: **APIs & Services** → **Library**
2. Search for **"Google Play Android Developer API"**
3. Click it → click **Enable**

#### Step 5 — Create a Service Account + download key
1. GCP Console → left sidebar: **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: e.g. `play-billing-service` → click **Create and Continue**
4. Skip role assignment (not needed here) → **Done**
5. Click the service account you just created → **Keys** tab → **Add Key** → **Create new key** → JSON → **Create**
6. A `.json` file downloads — save it as `./secrets/google-service-account.json` in your project

#### Step 6 — Link service account in Play Console

**Important:** Ei step er jonno tomar Play Console er **Account Owner** hote hobe. Owner chara "API access" menu dekhabe na.

**Part A — GCP project link koro:**

1. Play Console → left sidebar e niche **Setup** section khujho → click **"API access"**
2. Page er upore **"Link a Google Cloud project"** section thakbe
3. Du ta option dekhbe:
   - **"Create a new Google Cloud project"** — Play Console nije ekta banabe
   - **"Link an existing Google Cloud project"** — dropdown theke tomar Step 3 er project select koro
4. Tomar existing project select koro dropdown theke → click **"Link"**
5. Confirmation dialog asle confirm koro

**Project dropdown e tomar project dekhachhe na?** Tomar Google account er oi GCP project e **Owner** ba **Editor** role thakte hobe. GCP Console → IAM → check koro.

**Part B — Service account automatically appear hobe:**

6. Link korar por page refresh hobe — niche **"Service accounts"** section e tomar GCP project er shob service account dekhabe
7. Tomar `play-billing-service@your-project.iam.gserviceaccount.com` email ta ekhane dekhte pabe
8. Service account er row er right side e **"Grant access"** ba **"Manage permissions"** link/button thakbe — click koro

**Service account dekhachhe na?** Wrong GCP project link kora hoye thakte pare. Page refresh koro, ba 1-2 minute wait koro.

**Part C — Permissions set koro:**

9. Click korar por permissions page khulbe — dui level er permission thake:

   **Account permissions (shob app er jonno):**
   - "Financial data" section e 2ta checkbox khujho:
     - ✅ **"View financial data, orders, and cancellation survey responses"** — purchase/subscription data read korar jonno
     - ✅ **"Manage orders and subscriptions"** — purchase acknowledge, refund, subscription manage korar jonno
   - Baki checkboxes (App information, Store presence, etc.) dorkar nai — uncheck rekho

   **App permissions (specific app er jonno — optional):**
   - Niche **"Add app"** section thakbe — chaile specific app select kore only sei app er jonno permission dite paro
   - Shob app e access dite chaile account-level permission e enough, app-level skip koro

10. Click **"Invite user"** ba **"Save changes"**
11. Service account er jonno kono email accept step nai — instantly effect hobe

**Part D — Verify koro:**

12. **Setup** → **API access** page e fire gele service account ta "Access granted" dekhabe
13. **Users and permissions** page e o service account email ta user list e dekhbe

**⚠️ CRITICAL: 24-48 hour wait!**
Permissions grant korar por API call immediately kaj na-o korte pare. Google er system e propagation delay ache — **24-48 hours wait koro** tarpor API test koro. Ei delay ta well-known issue, Google er documentation e o mention ache.

#### Step 7 — Enable Cloud Pub/Sub API + create topic
1. GCP Console → **APIs & Services** → **Library** → search **"Cloud Pub/Sub API"** → **Enable** (if not already)
2. GCP Console → left sidebar: **Pub/Sub** → **Topics** (or search "Pub/Sub" in top bar)
3. Click **Create topic**
4. Topic ID: `play-rtdn` → **Create**

#### Step 8 — Grant publish permission to Google Play
1. GCP Console → **Pub/Sub** → **Topics** → click your `play-rtdn` topic
2. In the info panel, click **Permissions** tab → **Add Principal**
3. New principal: `google-play-developer-notifications@system.gserviceaccount.com`
4. Role: **Pub/Sub Publisher**
5. Click **Save**

#### Step 9 — Create a Push subscription
1. GCP Console → **Pub/Sub** → **Subscriptions** → **Create subscription**
2. Subscription ID: e.g. `play-rtdn-push`
3. Select topic: `play-rtdn`
4. Delivery type: **Push**
5. Endpoint URL: `https://<your-domain>/api/v1/subscription/google/webhook`
6. Check **Enable authentication**
7. Select a service account for signing push JWTs (can be the same service account from Step 5)
8. Audience: paste the same webhook URL
9. Click **Create**

#### Step 10 — Configure RTDN in Play Console
1. Play Console → select your app
2. Left sidebar: **Monetize with Play** → **Monetization setup**
3. Scroll to **Real-time developer notifications** section
4. Enable notifications
5. Paste the full topic name: `projects/YOUR_PROJECT_ID/topics/play-rtdn`
6. Click **Save changes**
7. Click **Send test notification** — your server should respond 200

### Google environment variables

Add to `.env`:

```bash
GOOGLE_PLAY_PACKAGE_NAME=com.yourcompany.tbsosick
GOOGLE_PLAY_SERVICE_ACCOUNT_PATH=./secrets/google-service-account.json

# Pub/Sub push verification (recommended in production)
GOOGLE_PLAY_PUBSUB_AUDIENCE=https://<your-domain>/api/v1/subscription/google/webhook
GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL=your-pubsub-pusher@your-project.iam.gserviceaccount.com
```

If `GOOGLE_PLAY_PUBSUB_AUDIENCE` is empty, JWT verification is **skipped** with a warning — only do this in dev.

### Notification type → local action

| RTDN code | Type | Local action |
|---|---|---|
| 1 | `SUBSCRIPTION_RECOVERED` | `ACTIVE`, refresh `currentPeriodEnd`, clear grace |
| 2 | `SUBSCRIPTION_RENEWED` | `ACTIVE`, extend `currentPeriodEnd` |
| 4 | `SUBSCRIPTION_PURCHASED` | `ACTIVE`, set plan + `currentPeriodEnd` |
| 7 | `SUBSCRIPTION_RESTARTED` | `ACTIVE`, clear cancel/grace |
| 6 | `SUBSCRIPTION_IN_GRACE_PERIOD` | `PAST_DUE` (keep access) |
| 5 | `SUBSCRIPTION_ON_HOLD` | `PAST_DUE` (Google account hold) |
| 3 | `SUBSCRIPTION_CANCELED` | `autoRenewing: false`, set `canceledAt` (user keeps access until expiry) |
| 13 | `SUBSCRIPTION_EXPIRED` | `INACTIVE`, plan → `FREE` |
| 12 | `SUBSCRIPTION_REVOKED` | `CANCELED`, plan → `FREE`, immediate revoke |
| 10 | `SUBSCRIPTION_PAUSED` | `INACTIVE` |
| Others (8/9/11/20) | Logged, no state change | |

After every notification, the webhook **re-fetches the authoritative state** from `subscriptionsv2.get()` rather than trusting the notification body alone — this matches Google's recommendation.

### Idempotency

Each Pub/Sub message has a unique `messageId`. We persist the latest seen ID under `metadata.lastGoogleMessageId` and skip duplicates.

---

## FAQ

### Why not use `verifyReceipt` (the legacy Apple endpoint)?

Apple officially deprecated `/verifyReceipt` in 2023. The modern approach is:
- StoreKit 2 on the client (iOS 15+)
- App Store Server API on the server
- JWS-signed transactions and notifications

Our implementation uses this modern stack. The legacy `receipt-data` format doesn't even exist in StoreKit 2.

### Why raw body for the webhook?

Apple's JWS signature is computed over the **original raw bytes** of the request body. Any parsing/reformatting (whitespace changes, field reordering) will invalidate the signature. The `express.raw()` middleware preserves bytes exactly as received, which the controller then JSON.parse manually to extract `signedPayload`.

### Why lazy-initialize the verifier?

So the server can boot even when Apple credentials are not yet configured. Useful during development and for graceful degradation. Only when an actual verify/webhook endpoint is hit do we require the certificates.

### Why grace period keeps access?

Apple's grace period (up to 16 days) is when Apple retries failed billing. The user is legitimate — just had a temporary card issue. Industry standard is to keep access during this time. Revoking immediately would create a poor user experience and confuse users whose cards just expired.

### Why refund immediately revokes?

Refunds are intentional actions (either by the user or by Apple support). Unlike grace period, there's no expectation of continued access. Per product decision in this project, refunds trigger immediate plan revocation (set to FREE).

### What about Enterprise tier?

Enterprise is the highest paid tier ($9.99/mo, $5.99/mo billed yearly), sold through Apple/Google stores like the Premium tier. It follows the same purchase → verify → webhook flow. The `plan.mapper.ts` already maps `enterprise_monthly` and `enterprise_yearly` product IDs to `SUBSCRIPTION_PLAN.ENTERPRISE`. No admin assignment needed — users purchase it directly from the store.

### How do I check if a user is premium in another module?

```typescript
import { isUserPremium } from '../subscription/helpers/entitlement';

// In your controller:
const hasPremium = await isUserPremium(req.user.id);
if (!hasPremium) {
  throw new ApiError(httpStatus.FORBIDDEN, 'Premium subscription required');
}
```

Or get the full entitlement object:
```typescript
import { getUserEntitlement } from '../subscription/helpers/entitlement';

const ent = await getUserEntitlement(userId);
// ent.plan, ent.status, ent.isActive, ent.isPremium, ent.isEnterprise,
// ent.currentPeriodEnd, ent.gracePeriodEndsAt
```

### How do I test locally without Apple sandbox?

You can't fully test without sandbox, because the `SignedDataVerifier` requires real Apple-signed payloads. Options:
1. Use a physical iPhone with sandbox account (recommended)
2. Unit test the state machine logic (`buildUpdatesForNotification`) with mock decoded transactions — bypasses crypto verification
3. Temporarily mock `getAppleVerifier()` in tests

---

## Summary

This module provides production-grade Apple IAP verification following Apple's current best practices (StoreKit 2, App Store Server API v2, Server Notifications V2). All security fundamentals are in place: cryptographic verification, fraud prevention via unique indexes, idempotent webhook handling, grace period support, and immediate refund revocation.

**Ready for:**
- Apple sandbox testing (once `.env` is filled and certs/keys are placed)
- Google Play sandbox testing (once service account + Pub/Sub are configured)
- Production deployment (once Apple Developer account + Google Play Console are set up and webhook URLs are configured)
