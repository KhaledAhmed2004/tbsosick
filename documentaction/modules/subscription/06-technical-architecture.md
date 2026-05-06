# 06. Technical Architecture — Subscription & Entitlement

This document provides a deep dive into the internal engineering, security guards, and reliability patterns of the subscription module. It is intended for developers and AI agents to understand the system's "under-the-hood" mechanics.

---

## 1. System Overview
The module implements **direct platform integration** with Apple App Store (StoreKit 2) and Google Play (Android Publisher API). 
- **No Third-Party Middlemen**: Direct store-to-server communication.
- **Unified Schema**: Divergent store signals (Apple JWS vs. Google JSON) converge into a single `Subscription` document shape.

---

## 2. Entitlement & Quota Logic

### 2.1 The Entitlement Engine (`getUserEntitlement`)
- **Active Statuses**: `ACTIVE`, `TRIALING`, and `PAST_DUE`.
- **Grace Period Policy**: Users in `PAST_DUE` (billing retry phase) **retain access**. This is the industry standard to prevent immediate service disruption during payment failures.

### 2.2 Quota Enforcement (`checkCardCreationQuota`)
Hard limits are applied based on the user's current plan:
- **FREE**: 2 Cards
- **PREMIUM**: 20 Cards
- **ENTERPRISE**: Unlimited (`Infinity`)
- **Trigger**: The check runs during `POST /preference-cards`. Over-limit requests return `403 Forbidden`.

---

## 3. Reliability & Data Integrity

### 3.1 Idempotency (`ProcessedWebhook` Collection)
- **Mechanism**: Every store notification ID (`notificationUUID` for Apple, `messageId` for Google) is recorded in this collection.
- **Write-First Atomic Pattern**: To prevent race conditions (TOCTOU), the system attempts to write the ID to `ProcessedWebhook` *before* processing the state machine. If the write fails with a duplicate key error, the webhook is immediately acknowledged as already processed.
- **TTL**: Records are auto-deleted after 30 days via MongoDB index.

### 3.2 Orphan Webhook Queue (`PendingWebhook` Collection)
- **Scenario**: A user makes a purchase, but the store webhook arrives at the server *before* the user's mobile app can call the `/verify` endpoint.
- **Handling**: Unknown webhooks are queued in this collection.
- **Recovery**: When a user eventually calls `/verify`, the service checks this queue and immediately applies any "orphan" updates to ensure the user gets access instantly.

### 3.3 Temporal Expiry Safety Net
- **Problem**: If a lifecycle webhook (EXPIRED) is missed during server downtime, a user might keep access forever.
- **Solution**: The `getUserEntitlement` helper performs a secondary check: if `status` is `ACTIVE` but `currentPeriodEnd` is in the past, it treats the subscription as expired.

### 3.4 Atomic State Machine
- **Implementation**: The `SubscriptionModel.upsertForUser` method uses an atomic `findOneAndUpdate`.
- **Durable Audit Trail**: It emits high-fidelity events (`UPGRADED`, `DOWNGRADED`, `RENEWED`, `CANCELED`) based on before/after diffing.

---

## 4. Security & Fraud Prevention

### 4.1 Identity Protection
- **Unique Store Links**: `appleOriginalTransactionId` and `googlePurchaseToken` are indexed as **Unique**. 
- **Fraud Guard**: A single store purchase cannot be linked to multiple user accounts. Re-linking attempts return `409 Conflict`.

### 4.2 Replay Protection
- **Bundle ID Verification**: The system verifies that the `bundleId` (Apple) or `packageName` (Google) in the transaction matches our configured app. This prevents "Store Replay" attacks using transactions from other apps.

### 4.3 Google Account Hold Mapping
- **Correct Mapping**: `SUBSCRIPTION_ON_HOLD` (code 5) maps to `INACTIVE`. This ensures users lose access immediately when Google's grace period expires, adhering to Play Store policies.

---

## 5. Integration Guide

### 5.1 Protecting Routes (`subscriptionGate`)
The middleware can be applied to any route to enforce plan hierarchy (e.g., Enterprise users can access Premium features):
```typescript
router.post('/exclusive-feature', 
  auth(USER_ROLES.USER), 
  subscriptionGate(SUBSCRIPTION_PLAN.PREMIUM), 
  Controller.action
);
```

### 5.2 Checking Quotas in Services
```typescript
const quota = await checkCardCreationQuota(userId);
if (!quota.allowed) {
  throw new ApiError(StatusCodes.FORBIDDEN, 'Quota limit reached');
}
```

---

## 6. Administrative Controls (Admin APIs)

The system provides a suite of `SUPER_ADMIN` only endpoints for manual management:
- **`GET /subscriptions/admin`**: List all user subscriptions with filters.
- **`GET /subscriptions/admin/analytics`**: Real-time plan and platform distribution.
- **`GET /subscriptions/admin/events/:userId`**: View a user's full audit history.
- **`POST /subscriptions/admin/grant`**: Manually grant Premium/Enterprise plans.
- **`POST /subscriptions/admin/reset/:userId`**: Force reset any subscription to Free.

