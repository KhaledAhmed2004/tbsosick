# 00. Subscription Module — End-to-End Flows

> Read-this-first orientation document. Shows how the pieces fit together: what the client does, what the server does at each step, and where the cross-cutting defenses (idempotency, fraud guards, orphan queue, audit log) plug in.

---

## Mental Model

The system is a **state machine** synced between three sources of truth:

1. **Apple App Store / Google Play** — the **authoritative billing state**. Always re-check with their APIs; never trust client claims.
2. **`subscriptions` collection** — single "current state" row per user (`userId` is unique).
3. **`subscription_events` collection** — append-only audit log; one row per state transition.

Plus two operational helpers:

- **`processed_webhooks`** — idempotency dedup (TTL 30d).
- **`pending_webhooks`** — orphan queue for webhooks that arrive before the user's `/verify` call (TTL 7d).

Everything below is variations on: *"verify with the store → upsert the row → emit an audit event."*

---

## 1. Initial Purchase Flow (iOS)

User taps **Subscribe** in the mobile app → StoreKit 2 completes the purchase locally → app sends the signed receipt to the backend.

```
┌──────────────┐                 ┌─────────────────┐                 ┌────────────────┐
│  iOS Client  │                 │  Backend (API)  │                 │  Apple Servers │
└──────┬───────┘                 └────────┬────────┘                 └────────┬───────┘
       │                                  │                                   │
       │ 1. StoreKit purchase             │                                   │
       │    + appAccountToken =           │                                   │
       │      uuidv5(userId, NS)          │                                   │
       │ ───────────────────────────────────────────────────────────────────► │
       │                                  │                                   │
       │ 2. signedTransactionInfo (JWS)   │                                   │
       │ ◄─────────────────────────────────────────────────────────────────── │
       │                                  │                                   │
       │ 3. POST /subscriptions/apple/verify                                   │
       │    Bearer JWT                    │                                   │
       │    body: { signedTransactionInfo }                                    │
       │ ───────────────────────────────► │                                   │
       │                                  │                                   │
       │                                  │ 4. JWS signature verify           │
       │                                  │    (uses Apple root certs)        │
       │                                  │                                   │
       │                                  │ 5. Bundle ID match check          │
       │                                  │ 6. Sandbox-in-prod gate           │
       │                                  │ 7. appAccountToken binding ────► [≠ user → 409]
       │                                  │ 8. isUpgraded check    ────────► [true → 400]
       │                                  │ 9. Cross-account fraud check ──► [other user → 409]
       │                                  │ 10. productId → plan mapping     │
       │                                  │ 11. upsertForUser (atomic):      │
       │                                  │     • write subscription row     │
       │                                  │     • emit SubscriptionEvent     │
       │                                  │       (CREATED / UPGRADED / ...) │
       │                                  │ 12. fire-and-forget:             │
       │                                  │     reprocess orphan webhooks    │
       │                                  │     for this originalTxnId       │
       │                                  │                                   │
       │ 13. 200 OK + subscription doc    │                                   │
       │ ◄─────────────────────────────── │                                   │
       │                                  │                                   │
       │ 14. UI shows PREMIUM             │                                   │
```

**Critical guarantees**
- Step 4 ensures the JWS came from Apple (no forged receipts).
- Step 7 ensures the receipt belongs to *this* user (no replay across accounts).
- Step 11 is atomic at the doc level — concurrent webhooks won't lose updates.
- Step 12 catches the race where Apple's server sent a renewal/cancel notification before the user finished `/verify` — the orphan is replayed automatically.

**Files:** [verifyApplePurchase](../../../src/app/modules/subscription/subscription.service.ts) → [verifyAppleTransaction](../../../src/app/modules/subscription/providers/apple/apple.verify.ts) → [upsertForUser](../../../src/app/modules/subscription/subscription.model.ts).

---

## 2. Initial Purchase Flow (Android)

Identical shape to iOS, but the verify step pulls authoritative state from Google instead of decoding a local JWS.

```
┌──────────────┐                 ┌─────────────────┐                 ┌─────────────────┐
│ Android App  │                 │  Backend (API)  │                 │  Google Play API│
└──────┬───────┘                 └────────┬────────┘                 └────────┬────────┘
       │                                  │                                   │
       │ 1. BillingClient purchase        │                                   │
       │    + setObfuscatedAccountId(     │                                   │
       │        uuidv5(userId, NS))       │                                   │
       │                                  │                                   │
       │ 2. POST /subscriptions/google/verify                                  │
       │    Bearer JWT                    │                                   │
       │    body: { purchaseToken, productId }                                 │
       │ ───────────────────────────────► │                                   │
       │                                  │                                   │
       │                                  │ 3. purchases.subscriptionsv2.get  │
       │                                  │ ────────────────────────────────► │
       │                                  │                                   │
       │                                  │    full subscription state        │
       │                                  │ ◄──────────────────────────────── │
       │                                  │                                   │
       │                                  │ 4. testPurchase-in-prod gate      │
       │                                  │ 5. obfuscatedAccountId binding ─► [≠ user → 409]
       │                                  │ 6. linkedPurchaseToken handling   │
       │                                  │    (upgrade/downgrade migration)  │
       │                                  │ 7. cross-account fraud check ──── [other → 409]
       │                                  │ 8. state → ACTIVE / PAST_DUE      │
       │                                  │ 9. acknowledge purchase (72h ack) │
       │                                  │ ────────────────────────────────► │
       │                                  │ 10. upsertForUser + audit event   │
       │                                  │ 11. reprocess orphan webhooks     │
       │                                  │                                   │
       │ 12. 200 OK + subscription doc    │                                   │
       │ ◄─────────────────────────────── │                                   │
```

**Why the extra Google API call**: Google's RTDN webhook payloads are intentionally lean. Their docs explicitly recommend re-fetching authoritative state via `subscriptionsv2.get` — that's what step 3 does.

**72-hour acknowledgement** (step 9): if you don't acknowledge within 72h, Google auto-refunds the user. We acknowledge here even on initial verify; failure is logged but non-fatal (subscription is still valid for 72h, ops can retry manually).

**Files:** [verifyGooglePurchase](../../../src/app/modules/subscription/subscription.service.ts) → [verifyGoogleSubscription](../../../src/app/modules/subscription/providers/google/google.verify.ts) → [upsertForUser](../../../src/app/modules/subscription/subscription.model.ts).

---

## 3. Webhook Lifecycle Flow (Apple)

Apple's servers POST a signed JWS to `/subscriptions/apple/webhook` whenever something changes — renewal, cancellation, refund, grace-period entry, etc.

```
┌────────────────┐                 ┌─────────────────┐                 ┌─────────────────────┐
│  Apple Servers │                 │  Backend (API)  │                 │      MongoDB        │
└────────┬───────┘                 └────────┬────────┘                 └──────────┬──────────┘
         │                                  │                                     │
         │ 1. POST /apple/webhook           │                                     │
         │    body: { signedPayload }       │                                     │
         │ ───────────────────────────────► │                                     │
         │                                  │                                     │
         │                                  │ 2. Verify JWS signature             │
         │                                  │    (Apple root certs + OCSP)        │
         │                                  │ 3. Decode notification +            │
         │                                  │    nested signedTransactionInfo     │
         │                                  │                                     │
         │                                  │ 4. Look up subscription by          │
         │                                  │    appleOriginalTransactionId       │
         │                                  │ ──────────────────────────────────► │
         │                                  │                                     │
         │                                  │    not found?                       │
         │                                  │ ┌────────────────────────────┐      │
         │                                  │ │ 4a. Queue as orphan in     │      │
         │                                  │ │     pending_webhooks (7d)  │      │
         │                                  │ │ Return 200 OK              │      │
         │                                  │ └────────────────────────────┘      │
         │                                  │                                     │
         │                                  │    found:                           │
         │                                  │ 5. Idempotency (write-first):       │
         │                                  │    INSERT INTO processed_webhooks   │
         │                                  │    { provider:'apple',              │
         │                                  │      webhookId: notificationUUID }  │
         │                                  │ ──────────────────────────────────► │
         │                                  │                                     │
         │                                  │    duplicate-key error              │
         │                                  │ ◄────────────────────────────────── │
         │                                  │    → already processed, return 200  │
         │                                  │                                     │
         │                                  │ 6. State machine                    │
         │                                  │    (notificationType → updates):    │
         │                                  │     • SUBSCRIBED       → active     │
         │                                  │     • DID_RENEW        → active     │
         │                                  │     • DID_FAIL_TO_RENEW→ past_due   │
         │                                  │     • EXPIRED          → inactive   │
         │                                  │     • REFUND / REVOKE  → canceled   │
         │                                  │     • OFFER_REDEEMED   → active     │
         │                                  │     • GRACE_PERIOD_EXPIRED → inactive
         │                                  │     • ...                           │
         │                                  │                                     │
         │                                  │ 7. upsertForUser                    │
         │                                  │    (auto-emits UPGRADED / RENEWED / │
         │                                  │     CANCELED / EXPIRED audit event) │
         │                                  │ ──────────────────────────────────► │
         │                                  │                                     │
         │ 8. 200 OK                        │                                     │
         │ ◄─────────────────────────────── │                                     │
```

**Why "write-first" idempotency** (step 5): naive `findOne → maybeInsert` has a TOCTOU race — two concurrent deliveries of the same `notificationUUID` could both pass the find before either writes. By trying the insert first and relying on the unique index to reject the second one, the race is eliminated atomically.

**Files:** [handleAppleNotification](../../../src/app/modules/subscription/providers/apple/apple.webhook.ts).

---

## 4. Webhook Lifecycle Flow (Google)

Google Pub/Sub pushes Real-Time Developer Notifications (RTDN) to `/subscriptions/google/webhook`.

```
┌─────────────────────┐               ┌─────────────────┐                 ┌─────────────────────┐
│ Google Cloud Pub/Sub│               │  Backend (API)  │                 │  Google Play API    │
└──────────┬──────────┘               └────────┬────────┘                 └──────────┬──────────┘
           │                                   │                                     │
           │ 1. POST /google/webhook           │                                     │
           │    Authorization: Bearer <JWT>    │                                     │
           │    body: { message: {data: ...} } │                                     │
           │ ────────────────────────────────► │                                     │
           │                                   │                                     │
           │                                   │ 2. Verify Pub/Sub JWT against       │
           │                                   │    configured audience              │
           │                                   │ 3. base64-decode RTDN payload       │
           │                                   │                                     │
           │                                   │ 4. Find sub by purchaseToken        │
           │                                   │                                     │
           │                                   │    not found?                       │
           │                                   │ ┌─────────────────────────────────┐ │
           │                                   │ │ 4a. Try linkedPurchaseToken     │ │
           │                                   │ │     (upgrade/downgrade case)    │ │
           │                                   │ │ 4b. Still not found → queue as  │ │
           │                                   │ │     orphan + return 200         │ │
           │                                   │ └─────────────────────────────────┘ │
           │                                   │                                     │
           │                                   │ 5. Re-fetch authoritative state ─►  │
           │                                   │ ──────────────────────────────────► │
           │                                   │                                     │
           │                                   │ 6. Write-first idempotency check    │
           │                                   │    (provider='google', messageId)   │
           │                                   │                                     │
           │                                   │ 7. State machine (notificationType  │
           │                                   │    code → updates):                 │
           │                                   │     • 1  RECOVERED       → active   │
           │                                   │     • 2  RENEWED         → active   │
           │                                   │     • 3  CANCELED        → autoRenew=false
           │                                   │     • 4  PURCHASED       → active   │
           │                                   │     • 5  ON_HOLD         → inactive │
           │                                   │     • 6  IN_GRACE_PERIOD → past_due │
           │                                   │     • 7  RESTARTED       → active   │
           │                                   │     • 12 REVOKED         → canceled │
           │                                   │     • 13 EXPIRED         → inactive │
           │                                   │                                     │
           │                                   │ 8. upsertForUser + audit event      │
           │                                   │                                     │
           │ 9. 200 OK                         │                                     │
           │ ◄──────────────────────────────── │                                     │
```

**Critical mapping detail**: code `5` (`SUBSCRIPTION_ON_HOLD`) maps to **`INACTIVE`**, NOT `PAST_DUE`. Account hold = grace period exhausted = no access. Many implementations get this wrong and silently grant free access during account hold.

**Files:** [handleGoogleNotification](../../../src/app/modules/subscription/providers/google/google.webhook.ts).

---

## 5. Get-My-Subscription Flow

Read-only entitlement check used by mobile profile screens and feature-gated UI.

```
┌──────────────┐                 ┌─────────────────┐                 ┌────────────────┐
│   Client     │                 │  Backend (API)  │                 │    MongoDB     │
└──────┬───────┘                 └────────┬────────┘                 └────────┬───────┘
       │                                  │                                   │
       │ 1. GET /subscriptions/me         │                                   │
       │    Bearer JWT                    │                                   │
       │ ───────────────────────────────► │                                   │
       │                                  │                                   │
       │                                  │ 2. findOne({userId})              │
       │                                  │    .select('-metadata')           │
       │                                  │ ────────────────────────────────► │
       │                                  │                                   │
       │                                  │    row exists?                    │
       │                                  │ ┌──────────────────────────────┐  │
       │                                  │ │ YES → return doc as-is       │  │
       │                                  │ │ NO  → return synthetic       │  │
       │                                  │ │       {userId, plan: FREE,   │  │
       │                                  │ │        status: ACTIVE}       │  │
       │                                  │ │       (no DB write)          │  │
       │                                  │ └──────────────────────────────┘  │
       │                                  │                                   │
       │ 3. 200 OK                        │                                   │
       │ ◄─────────────────────────────── │                                   │
```

**Industry rule respected**: GET handlers do NOT mutate state. The synthetic FREE response avoids creating spurious "CREATED" audit events for users who only ever load their profile screen.

**Files:** [getMySubscription](../../../src/app/modules/subscription/subscription.service.ts).

---

## 6. Choose-Free-Plan Flow

User explicitly opts out of paid plans (downgrade button in profile settings).

```
┌──────────────┐                 ┌─────────────────┐                 ┌────────────────┐
│   Client     │                 │  Backend (API)  │                 │    MongoDB     │
└──────┬───────┘                 └────────┬────────┘                 └────────┬───────┘
       │                                  │                                   │
       │ 1. POST /subscriptions/choose/free                                    │
       │    Bearer JWT                    │                                   │
       │ ───────────────────────────────► │                                   │
       │                                  │                                   │
       │                                  │ 2. findByUser(userId)             │
       │                                  │ ────────────────────────────────► │
       │                                  │                                   │
       │                                  │ 3. Active-store-subscription guard:
       │                                  │    if existing is APPLE/GOOGLE    │
       │                                  │    AND status ∈ {active, trialing,│
       │                                  │      past_due}                    │
       │                                  │    AND currentPeriodEnd > now     │
       │                                  │    → throw 409 ("cancel via store"
       │                                  │       first)                      │
       │                                  │                                   │
       │                                  │ 4. upsertForUser({                │
       │                                  │     plan: FREE,                   │
       │                                  │     status: ACTIVE,               │
       │                                  │     platform: ADMIN               │
       │                                  │    })                             │
       │                                  │                                   │
       │ 5. 200 OK + subscription doc     │                                   │
       │ ◄─────────────────────────────── │                                   │
```

**Why the guard** (step 3): if a user is mid-cycle with a paid Apple/Google subscription, flipping the local row to FREE doesn't cancel the actual store-side billing — they'd keep paying while losing in-app access. The store remains the source of truth; we refuse to silently drift.

---

## 7. Entitlement Check Flow (`subscriptionGate` middleware)

Used to feature-gate routes (e.g., "premium-only export endpoint").

```
Request → auth() middleware (sets req.user) → subscriptionGate(SUBSCRIPTION_PLAN.PREMIUM) → controller
                                                       │
                                                       ▼
                                              getUserEntitlement(userId)
                                                       │
                                                       ▼
                                              ┌──────────────────────────┐
                                              │ findByUser(userId)       │
                                              │ no row → return synthetic│
                                              │           FREE/active    │
                                              │ row → temporal expiry    │
                                              │       check (currentPeriod
                                              │       End < now → expired)
                                              │ → compute {plan, isActive,│
                                              │   isPremium, isEnterprise}│
                                              └──────────────────────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────────────┐
                                              │ SUPER_ADMIN bypasses gate│
                                              │ !isActive → 402 PAYMENT  │
                                              │             REQUIRED     │
                                              │ Plan rank too low → 403  │
                                              │             FORBIDDEN    │
                                              │ else → next()            │
                                              └──────────────────────────┘
```

**Temporal expiry check**: even if a webhook for `EXPIRED` was missed (server downtime, Apple/Google outage), the entitlement helper compares `currentPeriodEnd` against `now` — past-due rows are treated as expired regardless of stored status. Belt-and-braces.

**Files:** [subscriptionGate](../../../src/app/middlewares/subscriptionGate.ts), [getUserEntitlement](../../../src/app/modules/subscription/helpers/entitlement.ts).

---

## 8. Orphan Webhook Re-Processing

Real-world race: Apple/Google sends a webhook for a purchase, but the user's app hasn't finished its `/verify` call yet. The webhook hits an empty database.

```
T=0   Webhook arrives  ──► no subscription row ──► queue raw payload in pending_webhooks (7d TTL)
                                                   return 200 OK to store
                                                   (so they don't retry forever)

T=10s User's app finishes /verify
        ──► server upserts the subscription row
        ──► fire-and-forget reprocessPendingWebhooks(externalPurchaseId, provider)
              ──► find queued webhooks
              ──► replay each through handleAppleNotification / handleGoogleNotification
                   (with skipAuth=true since it was already authenticated on first arrival)
              ──► delete from pending_webhooks on success
```

**Why TTL is 7d**: covers a generous window for the user to come back and complete verify (e.g., app crashed, phone offline). After 7d the orphan is dropped — at that point the store will have either re-delivered the notification or the purchase is irrelevant.

---

## 9. Admin Flows (super-admin only)

| Flow | Endpoint | Path through code |
|---|---|---|
| List all subscriptions | `GET /admin?…` | `getAllSubscriptions` → `QueryBuilder` over `Subscription.find()` |
| Plan/platform analytics | `GET /admin/analytics` | `getSubscriptionAnalytics` → single `$facet` aggregation |
| Audit history | `GET /admin/events/:userId?page=&limit=` | `getSubscriptionEvents` → paginated `SubscriptionEvent.find()` |
| Single sub by ID | `GET /admin/:subscriptionId` | `getSubscriptionById` → populated `Subscription.findById` |
| Manual grant | `POST /admin/grant` | `assertUserExists` → `upsertForUser({plan, status:ACTIVE, platform:ADMIN})` |
| Manual reset | `POST /admin/reset/:userId` | `assertUserExists` → `upsertForUser({plan:FREE, canceledAt:now})` |
| Pending orphans | `GET /admin/pending-webhooks` | `getPendingWebhooks` → recent 100 from `PendingWebhook` |

All admin writes go through `upsertForUser`, so audit events are emitted automatically.

---

## Cross-Cutting Concerns Summary

| Concern | Where it lives | What it does |
|---|---|---|
| JWS / JWT verification | provider verify files | Cryptographic auth at the edge |
| Bundle ID / packageName | apple.verify.ts / google.verify.ts | Cross-app receipt replay defense |
| Sandbox-in-prod gate | apple.verify.ts / google.verify.ts | Reject test transactions in prod |
| Buyer binding | subscription.service.ts (verify) | Receipt-theft defense via UUIDv5 |
| Cross-account fraud | subscription.service.ts (verify) | Same receipt → same account, always |
| Idempotency | apple.webhook.ts / google.webhook.ts | Write-first to `processed_webhooks` |
| Orphan queue | webhook handlers | `pending_webhooks` + replay on next verify |
| Atomic state machine | subscription.model.ts (`upsertForUser`) | Single doc update + audit event |
| Temporal expiry safety net | helpers/entitlement.ts | Catch missed `EXPIRED` webhooks |
| Audit trail | subscription_events collection | Append-only history of every transition |
| Rate limiting | route.ts (verify endpoints) | 30 req/min on `/apple/verify`, `/google/verify` |
| Feature gating | subscriptionGate middleware | Plan-tier route protection |

---

## Where to read next

- [01-get-my-subscription.md](./01-get-my-subscription.md) — read endpoint contract
- [02-verify-apple-purchase.md](./02-verify-apple-purchase.md) — iOS verify contract + integration requirements
- [03-verify-google-purchase.md](./03-verify-google-purchase.md) — Android verify contract + integration requirements
- [04-set-free-plan.md](./04-set-free-plan.md) — manual downgrade contract
- [05-platform-webhooks.md](./05-platform-webhooks.md) — webhook contracts + deploy migration note
- [06-technical-architecture.md](./06-technical-architecture.md) — deeper internals (idempotency, fraud, security)
- [07-admin-endpoints.md](./07-admin-endpoints.md) — admin dashboard contracts
