# Subscription Module

> Apple In-App Purchase (StoreKit 2) integration for mobile-only app.
> Google Play integration pending (Phase 2).

---

## Overview — কী এটা?

এই module ti user subscriptions manage kore — **direct Apple StoreKit 2** integration use kore, third-party middleman (jemon RevenueCat) chara. User iOS app theke subscribe korle, Apple er **JWS signed transaction** backend e ashe, backend cryptographically verify kore DB te save kore, tarpor Apple er **App Store Server Notifications V2** webhook diye lifecycle events (renewal, cancel, refund, expire) real-time e track kore.

**Keno ei approach:**
- **Free forever** — kono recurring fee nai (RevenueCat er moto 1% MTR na)
- **Full control** — verification logic tor hater e
- **No third-party dependency** — Apple er SDK + tor backend, bas
- **Zero vendor lock-in**

**Cons je thakte pare:**
- Google Play phase 2 alada kore implement korte hobe (Apple + Google alada API)
- Apple er policy/library updates track korte hobe
- RevenueCat er moto built-in analytics/dashboard nai

---

## Current Implementation Status

| Feature | Status |
|---|---|
| Apple StoreKit 2 verification | ✅ Complete |
| Apple Server Notifications V2 webhook | ✅ Complete |
| Subscription lifecycle state machine | ✅ Complete |
| Idempotent webhook handling | ✅ Complete |
| Fraud prevention (unique indexes) | ✅ Complete |
| Grace period support | ✅ Complete |
| Refund immediate revoke | ✅ Complete |
| Access gating helpers (`isUserPremium`) | ✅ Complete |
| Google Play verification | ⏳ Pending (Phase 2) |
| Google Play RTDN webhook | ⏳ Pending (Phase 2) |
| Enterprise admin assignment UI | ⏳ Pending |

---

## Architecture

### File tree

```
src/app/modules/subscription/
├── README.md                           ← this file
│
├── providers/
│   └── apple/
│       ├── apple.types.ts              ← local type aliases (narrow shape)
│       ├── apple.client.ts             ← SignedDataVerifier lazy singleton
│       ├── apple.verify.ts             ← verifyAppleTransaction() — JWS verify
│       └── apple.webhook.ts            ← handleAppleNotification() — state machine
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
  premium_monthly:     PREMIUM,
  premium_yearly:      PREMIUM,
  enterprise_monthly:  ENTERPRISE,
  enterprise_yearly:   ENTERPRISE,
}
```

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
- `verifyApplePurchase(userId, signedTransactionInfo)` — main initial purchase flow
- `processAppleWebhook(signedPayload)` — passthrough to `handleAppleNotification`

**`verifyApplePurchase` flow:**
1. Call `verifyAppleTransaction(signedTransactionInfo)` — cryptographic verification
2. **Fraud check:** query `SubscriptionModel.findOne({ appleOriginalTransactionId })`. If exists and `userId` is different → throw `409 Conflict`
3. Map `decoded.productId` → `SubscriptionPlan` via `mapAppleProductToPlan()`
4. Reject unknown productIds with `400 Bad Request`
5. `SubscriptionModel.upsertForUser()` with all fields populated
6. Return updated subscription doc

**Removed from previous version:**
- `verifyIapSubscription()` — the old fake verification that accepted any receipt string. Replaced by the new crypto-verified flow.
- `mapIapProductToPlan()` — replaced by `plan.mapper.ts`

#### 10. `subscription.validation.ts`

Zod schemas for request validation.

**Exports:**
- `SubscriptionValidation.appleVerifySchema` — requires `body.signedTransactionInfo: string`

The old `verifyIapSubscriptionSchema` is removed (the endpoint it validated is gone).

#### 11. `subscription.controller.ts`

HTTP handlers using project conventions (`catchAsync`, `sendResponse`, `ApiError`).

**Exports:**
- `getMySubscriptionController` — `GET /me`
- `verifyApplePurchaseController` — `POST /apple/verify`
- `appleWebhookController` — `POST /apple/webhook` (special: handles raw Buffer body)
- `chooseFreePlanController` — `POST /choose/free`

**`appleWebhookController` special handling:**
- Because the `/apple/webhook` route uses `express.raw()` middleware, `req.body` is a `Buffer`, not a parsed object
- Manually `JSON.parse(req.body.toString('utf8'))` to extract `signedPayload`
- Validates presence, then calls `SubscriptionService.processAppleWebhook()`

#### 12. `subscription.route.ts`

Routes with middleware chain (rate limit → auth → validate → controller):

```
GET  /api/v1/subscription/me              auth required
POST /api/v1/subscription/apple/verify    auth + rate limit + validation
POST /api/v1/subscription/apple/webhook   no auth (JWS self-verifies)
POST /api/v1/subscription/choose/free     auth required
```

**Removed:** old `POST /iap/verify` route (the fake-verification endpoint).

#### 13. `src/config/index.ts`

Added `apple` config section:

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
```

#### 14. `src/app.ts`

Added raw body middleware for the Apple webhook route **before** the generic `express.json()`:

```typescript
app.use(
  '/api/v1/subscription/apple/webhook',
  express.raw({ type: 'application/json' })
);
app.use(express.json());
```

**Why:** Apple's JWS signature is computed over the **original raw bytes** of the request body. If `express.json()` parses the body first, the bytes mutate (whitespace changes, field reordering, etc.) and signature verification fails. The raw parser preserves bytes as-is for the controller to JSON.parse manually.

---

## NPM Package

Installed in this session:

```bash
npm install @apple/app-store-server-library
```

Version: `^3.0.0`

This is Apple's official Node.js library. Provides:
- `SignedDataVerifier` — JWS verification
- `AppStoreServerAPIClient` — for calling App Store Server API endpoints (not used yet, available for future features)
- Type definitions for all Apple data shapes (`JWSTransactionDecodedPayload`, `ResponseBodyV2DecodedPayload`, etc.)
- `NotificationTypeV2` enum
- `Environment` enum

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

### `POST /api/v1/subscription/choose/free`

Manually switch user to FREE plan. Does not cancel actual Apple subscription (user must cancel via Settings).

**Auth:** Bearer JWT required

---

## Environment Variables

Add to `.env`:

```bash
# Apple IAP — required for subscription module to work
APPLE_BUNDLE_ID=com.yourcompany.tbsosick          # from App Store Connect
APPLE_APP_APPLE_ID=1234567890                     # numeric App ID from App Store Connect
APPLE_KEY_ID=ABC1234DEF                           # 10-char Key ID from API key generation
APPLE_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  # UUID from App Store Connect
APPLE_PRIVATE_KEY_PATH=./secrets/apple-key.p8     # path to .p8 private key file
APPLE_ENVIRONMENT=sandbox                         # 'sandbox' or 'production'
APPLE_ROOT_CERTS_DIR=./secrets/apple-root-certs   # directory containing Apple root CAs
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
   - Product ID: `premium_monthly`, Duration: 1 Month
   - Product ID: `premium_yearly`, Duration: 1 Year
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

## Phase 2 — Google Play (Not Yet Implemented)

When Google Play integration is added, the following will be created:

**New files:**
```
providers/google/
├── google.types.ts
├── google.client.ts       ← googleapis + google-auth-library setup
├── google.verify.ts       ← purchases.subscriptionsv2.get() wrapper
└── google.webhook.ts      ← RTDN Pub/Sub push handler
```

**New packages:**
```bash
npm install googleapis google-auth-library
```

**New routes:**
```
POST /api/v1/subscription/google/verify   (auth + rate limited)
POST /api/v1/subscription/google/webhook  (no auth — Pub/Sub JWT verified)
```

**New environment variables:**
```bash
GOOGLE_PACKAGE_NAME=com.yourcompany.tbsosick
GOOGLE_SERVICE_ACCOUNT_PATH=./secrets/google-service-account.json
GOOGLE_PUBSUB_TOPIC=projects/your-project/topics/play-rtdn
```

**Google Play Console setup steps** (summary):
1. Play Console → $25 one-time signup
2. Create app + subscription products (same IDs: `premium_monthly`, `premium_yearly`)
3. Create GCP project + enable Google Play Android Developer API
4. Create Service Account → download JSON credentials
5. Link Service Account in Play Console → grant subscription permissions
6. Set up Pub/Sub topic for RTDN
7. Create Push subscription pointing to `/google/webhook` endpoint
8. Configure RTDN in Play Console Monetization settings

All the pieces (plan.mapper, entitlement, subscription.model indexes) are already prepared for Google phase — adding it is mostly following the same pattern as Apple.

---

## Alternative: RevenueCat Option

If maintaining direct Apple + Google integration becomes burdensome, consider pivoting to RevenueCat:

**Pros:**
- Single webhook format for both Apple + Google
- Handles all edge cases (family sharing, offer codes, grace periods, price changes)
- Built-in analytics dashboard (MRR, churn, cohorts)
- Free tier up to $2.5K MTR
- Excellent Flutter SDK

**Cons:**
- 1% of MTR beyond $2.5K free tier
- Third-party dependency
- Partial vendor lock-in (client SDK)

**Migration effort:** ~1 hour (uninstall Apple library, delete `providers/apple/` folder, write new webhook handler for RevenueCat's format). The existing `plan.mapper.ts` and `entitlement.ts` helpers would be reused.

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

Enterprise subscriptions are **not sold via Apple IAP**. Apple would take a 15-30% commission on enterprise purchases, which is unsustainable for B2B sales. Instead, an admin manually assigns the ENTERPRISE plan via a future admin dashboard (or direct DB update). The `SUBSCRIPTION_PLATFORM.ADMIN` enum value exists for this purpose.

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

**Missing:** Google Play integration (same pattern, pending implementation). Enterprise admin assignment UI.

**Ready for:**
- Sandbox testing (once `.env` is filled and certs/keys are placed)
- Production deployment (once real Apple Developer account is set up and server notifications URL is configured)
