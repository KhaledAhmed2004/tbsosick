# Flutter Implementation Guide — Subscriptions

This guide gives the Flutter team everything needed to integrate Apple App Store (StoreKit 2) and Google Play Billing with the backend. **Read this end-to-end before writing code** — the buyer-binding step (§4) is required for security, and `in_app_purchase` does not expose Apple's `appAccountToken` directly.

> **Cross-reference**: full backend contracts are in [`documentaction/modules/subscription/`](../../../../documentaction/modules/subscription/) (start with [`00-flows.md`](../../../../documentaction/modules/subscription/00-flows.md)). This guide is the client-side companion to those docs.

---

## 1. Overview

The backend uses **server-side verification + buyer binding**. The Flutter app must:

1. Initiate the purchase using the platform's native UI (StoreKit 2 / Play Billing).
2. **Bind the purchase to the authenticated user** by setting a deterministic UUID (`appAccountToken` on iOS, `obfuscatedAccountId` on Android) — see §4. *Without this, the backend's H3 receipt-theft defense never engages.*
3. Capture raw purchase data (JWS for Apple, purchase token + productId for Google).
4. POST to the verify endpoint — the backend cryptographically verifies, applies fraud guards, persists state, and returns the canonical subscription document.
5. Refresh local state after every verify, after restore, and on every app launch / resume.

---

## 2. Base Configuration

| | |
|---|---|
| **Base URL** | `/api/v1/subscriptions` *(plural — all routes start here)* |
| **Auth** | `Authorization: Bearer <userJwt>` on every endpoint **except** the two webhooks (server-to-server only) |
| **Content-Type** | `application/json` for all `POST` bodies |
| **Rate limit** | 30 req/min per user on `/apple/verify` and `/google/verify` |
| **Standard envelope** | All responses wrap `data` and (when paginated) `meta` — see [response envelope docs](../../../../documentaction/README.md#standard-response-envelope) |

---

## 3. Endpoint Map (client-facing)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/me` | Read current entitlement |
| `POST` | `/apple/verify` | Verify a StoreKit 2 transaction |
| `POST` | `/google/verify` | Verify a Play Billing purchase |
| `POST` | `/choose/free` | User-initiated downgrade to FREE |

The Apple/Google webhooks (`/apple/webhook`, `/google/webhook`) are server-to-server only — Flutter never calls them.

---

## 4. ⚠ Buyer Binding (REQUIRED — H3 receipt-theft defense)

The backend verifies that every purchase belongs to the authenticated user by comparing a deterministic UUID derived from `userId`. Both platforms support this:

- **iOS**: Apple `appAccountToken` (must be a valid UUID)
- **Android**: Google `obfuscatedExternalAccountId`

### 4.1 Compute the token in Dart

The namespace is a fixed UUID — **do not change it**. Rotating it invalidates every in-flight purchase globally.

```dart
import 'package:uuid/uuid.dart';

/// Must match `IAP_NAMESPACE` in
/// `src/app/modules/subscription/helpers/iap-account.ts` on the backend.
const String IAP_NAMESPACE = 'b9f6a4c0-1d2e-4f3a-9c8b-0e7d6c5b4a32';

/// Deterministic UUIDv5 derivation. Same userId → same UUID, every time.
String deriveIapAccountToken(String userId) {
  return const Uuid().v5(IAP_NAMESPACE, userId);
}
```

> **Soft rollout note**: today the backend logs a warning and accepts purchases without the token. Once the team flips to hard-enforce, **any client that forgets to send the token will start 409-failing on every verify**. Treat this as required, not optional.

### 4.2 Apply on iOS (StoreKit 2)

The cross-platform `in_app_purchase` package does **not** expose `appAccountToken` directly. You have two options:

**Option A (recommended) — `purchases_flutter` / direct StoreKit 2 native channel**: write a tiny method channel that calls `Product.purchase(options: [.appAccountToken(uuid)])` in Swift. Sample bridge:

```swift
// ios/Runner/IAPChannel.swift
import StoreKit

@available(iOS 15.0, *)
func purchase(productId: String, accountToken: UUID) async throws -> String {
  guard let product = try await Product.products(for: [productId]).first else {
    throw NSError(domain: "IAP", code: 404)
  }
  let result = try await product.purchase(options: [.appAccountToken(accountToken)])
  switch result {
    case .success(let verification):
      if case .verified(let txn) = verification { return txn.jwsRepresentation }
      throw NSError(domain: "IAP", code: 401) // unverified
    default: throw NSError(domain: "IAP", code: 499)
  }
}
```

**Option B (fallback)** — pass via `applicationUserName` on `in_app_purchase`. Note: iOS hashes this string; the backend's binding check works only if the hash matches the UUIDv5. Verify behavior in your environment before relying on it; Option A is safer.

### 4.3 Apply on Android (Play Billing)

The `in_app_purchase` package's `PurchaseParam.applicationUserName` maps directly to `BillingFlowParams.setObfuscatedAccountId` on Android. No native bridge required:

```dart
final String token = deriveIapAccountToken(currentUserId);

final purchaseParam = GooglePlayPurchaseParam(
  productDetails: productDetails,
  applicationUserName: token, // ← becomes obfuscatedAccountId
);

await InAppPurchase.instance.buyNonConsumable(purchaseParam: purchaseParam);
```

---

## 5. iOS — Verify Apple Purchase

`POST /api/v1/subscriptions/apple/verify`

### Request body

```json
{ "signedTransactionInfo": "eyJhbGciOiJFUzI1NiIs..." }
```

### Flutter (using your native bridge from §4.2)

```dart
import 'package:flutter/services.dart';

const _channel = MethodChannel('app.tbsosick/iap');

Future<void> purchaseApple({
  required String productId,
  required String userId,
  required String userJwt,
}) async {
  final accountToken = deriveIapAccountToken(userId);

  // 1. Native StoreKit 2 purchase with appAccountToken
  final String jws = await _channel.invokeMethod('purchase', {
    'productId': productId,
    'accountToken': accountToken,
  });

  // 2. Verify with backend
  final response = await http.post(
    Uri.parse('$baseUrl/api/v1/subscriptions/apple/verify'),
    headers: {
      'Authorization': 'Bearer $userJwt',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({ 'signedTransactionInfo': jws }),
  );

  if (response.statusCode == 200) {
    // refresh local cache from response.data
  } else {
    handleVerifyError(response);
  }
}
```

### Errors

| Status | Trigger | Recommended UI |
|---|---|---|
| `400` | Invalid JWS, expired/revoked transaction, bundle ID mismatch, unknown `productId`, **`isUpgraded === true`** (re-verify the latest transaction), **sandbox transaction received in production** | "Something went wrong with this purchase" + log details |
| `401` | Bearer JWT missing/expired | Force re-login |
| `409` | Transaction already linked to a different account, **OR `appAccountToken` does not match the authenticated user** | "This purchase belongs to another account" |
| `429` | Rate limit exceeded (30 req/min) | Backoff + retry |
| `500` | Backend Apple credentials misconfigured | "Service unavailable, please retry" |

---

## 6. Android — Verify Google Purchase

`POST /api/v1/subscriptions/google/verify`

### Request body

```json
{
  "purchaseToken": "abc123...",
  "productId": "premium_yearly"
}
```

### Flutter (using `in_app_purchase`)

```dart
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:in_app_purchase_android/in_app_purchase_android.dart';

Future<void> handleGooglePurchase(
  GooglePlayPurchaseDetails purchase,
  String userJwt,
) async {
  if (purchase.status != PurchaseStatus.purchased) return;

  final response = await http.post(
    Uri.parse('$baseUrl/api/v1/subscriptions/google/verify'),
    headers: {
      'Authorization': 'Bearer $userJwt',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'purchaseToken': purchase.verificationData.serverVerificationData,
      'productId': purchase.productID,
    }),
  );

  if (response.statusCode == 200) {
    // ✅ Required: tell the platform we're done so Google doesn't retry
    await InAppPurchase.instance.completePurchase(purchase);
    // refresh local cache from response.data
  } else {
    handleVerifyError(response);
  }
}
```

> **Don't skip `completePurchase()`**. Google's billing client retries delivery until the app finalizes the purchase. The backend separately calls `purchases.subscriptions.acknowledge` to satisfy the **72-hour acknowledgement window** (failure to acknowledge = auto-refund), but the local `completePurchase()` is what stops redelivery in the Flutter listener.

### Errors

| Status | Trigger | Recommended UI |
|---|---|---|
| `400` | Invalid token, Google API error, expired subscription, inactive `subscriptionState`, unknown `productId`, **`testPurchase: true` in production** | "Something went wrong with this purchase" |
| `401` | Bearer JWT missing/expired | Force re-login |
| `409` | Token already linked to another account, **OR `obfuscatedAccountId` does not match the authenticated user** | "This purchase belongs to another account" |
| `429` | Rate limit exceeded | Backoff + retry |
| `500` | Backend Google service-account credentials misconfigured | "Service unavailable" |

---

## 7. Read Current Subscription

`GET /api/v1/subscriptions/me`

This endpoint is **read-only** — it never writes to the database. Free users with no subscription row get a synthetic response (slimmer shape).

### Scenario A — User has a subscription row

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription retrieved successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "userId": "664a1b2c3d4e5f6a7b8c9d0e",
    "plan": "PREMIUM",
    "status": "active",
    "platform": "apple",
    "environment": "production",
    "productId": "premium_monthly",
    "autoRenewing": true,
    "currentPeriodEnd": "2027-04-07T10:30:00.000Z",
    "createdAt": "2026-04-07T10:30:00.000Z",
    "updatedAt": "2026-04-07T10:30:00.000Z"
  }
}
```

### Scenario B — User has no row yet (synthetic FREE)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription retrieved successfully",
  "data": {
    "userId": "664a1b2c3d4e5f6a7b8c9d0e",
    "plan": "FREE",
    "status": "active"
  }
}
```

> **Critical Flutter implication**: `data._id`, `data.currentPeriodEnd`, `data.autoRenewing`, `data.createdAt`, `data.updatedAt` are **only present in Scenario A**. Code that destructures them unconditionally will crash on new users. Always null-check.

### Entitlement check (recommended Dart helper)

```dart
class Entitlement {
  final String plan;     // 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  final String status;   // 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
  final DateTime? currentPeriodEnd; // null for synthetic FREE or admin-perpetual grants

  bool get isPaidPlan => plan != 'FREE';
  bool get hasAccess {
    // Match the backend's ACTIVE_STATUSES set (entitlement.ts).
    if (!{'active', 'trialing', 'past_due'}.contains(status)) return false;
    // Temporal safety net — a missed EXPIRED webhook shouldn't grant forever.
    if (currentPeriodEnd != null && currentPeriodEnd!.isBefore(DateTime.now())) return false;
    return true;
  }
  bool get isPremium    => hasAccess && isPaidPlan;
  bool get isEnterprise => hasAccess && plan == 'ENTERPRISE';
}
```

> `currentPeriodEnd` may be `null` for two valid reasons: (1) synthetic FREE response, (2) admin-granted plans (`POST /admin/grant`) which are intentionally perpetual until manually managed. Treat `null` as "no expiry to enforce client-side."

---

## 8. Downgrade — `POST /choose/free`

User-facing button that flips the local row to FREE. **It does NOT cancel any active store-side billing** — for users with live Apple/Google subscriptions, the backend rejects this with `409` and the user must cancel via App Store / Play Store.

### Request

```dart
final response = await http.post(
  Uri.parse('$baseUrl/api/v1/subscriptions/choose/free'),
  headers: { 'Authorization': 'Bearer $userJwt' },
);
```

### Responses

| Status | Meaning |
|---|---|
| `200` | Downgraded — local row is now `plan: "FREE"`, `platform: "admin"` |
| `409` | User has an active store subscription (`currentPeriodEnd > now`); show: *"You have an active store subscription. Please cancel it through the App Store or Play Store first."* |
| `401` | Bearer JWT missing/expired |

---

## 9. Known Product IDs

Apple and Google share the same product identifiers by convention (configure both stores with these exact strings):

| Product ID | Plan |
|---|---|
| `premium_monthly` | PREMIUM, monthly billing |
| `premium_yearly` | PREMIUM, yearly billing |
| `enterprise_monthly` | ENTERPRISE, monthly billing |
| `enterprise_yearly` | ENTERPRISE, yearly billing |

Source of truth: [`src/app/modules/subscription/helpers/plan.mapper.ts`](helpers/plan.mapper.ts). Adding a new product requires a backend change there *and* matching entries in App Store Connect / Google Play Console.

---

## 10. Restore Purchases

When the user taps "Restore Purchases", iterate every restored transaction and POST it to the same `/verify` endpoint.

```dart
Future<void> restorePurchases(String userJwt) async {
  await InAppPurchase.instance.restorePurchases();
  // Each restored purchase comes through the existing purchaseStream listener;
  // the same handleApplePurchase / handleGooglePurchase code paths apply.
}
```

> **Important**: if a restored receipt belongs to a different user account (e.g. the device was previously logged into someone else's app account), the backend returns `409 Conflict` (cross-account fraud guard). Show: *"This purchase is linked to a different account."* This is the **same** 409 as the buyer-binding mismatch — message can be unified.

---

## 11. App Lifecycle Hooks

Lifecycle events from Apple/Google (renewal, cancellation, refund, account hold) flow to the backend via webhooks **without any client involvement**. The Flutter app's only job is to keep its local cache fresh:

| Hook | Action |
|---|---|
| App launch | `GET /me`, populate cache |
| App resume from background | `GET /me`, refresh cache |
| After successful `/verify` | Use response body as-is (it's the canonical `Subscription` doc) |
| After successful `/choose/free` | Use response body |
| Pull-to-refresh on profile screen | `GET /me` |

Do **not** poll `/me` on a timer. The webhook → DB → next-launch refresh path is the design.

---

## 12. Best Practices Checklist

- ☐ Always set `appAccountToken` (iOS) / `obfuscatedAccountId` (Android) on every purchase — see §4.
- ☐ Handle `PurchaseStatus.pending` — do not call `/verify` until status is `purchased`.
- ☐ Call `InAppPurchase.instance.completePurchase(purchase)` after a 200 from `/google/verify` so Google stops redelivering.
- ☐ Null-check `_id`, `currentPeriodEnd`, `autoRenewing` on `/me` responses (Scenario B has the slim shape).
- ☐ For 409 errors, clearly tell the user the receipt is bound to another account — don't silently retry.
- ☐ Refresh `/me` on app launch and on resume; trust webhooks for the rest.
- ☐ Cache the JWT and refresh before calling `/verify` to avoid 401 mid-purchase.

---

## 14. Sandbox Testing Tips (Google Play) — টেস্টিং গাইডলাইন

স্যান্ডবক্স এনভায়রনমেন্টে সাবস্ক্রিপশন টেস্টিং করার সময় কিছু বিহেভিয়ার প্রোডাকশন থেকে আলাদা হয়। কনফিউশন এড়াতে নিচের বিষয়গুলো লক্ষ্য করুন:

### 14.1 কেন বারবার "PREMIUM" হয়ে যাচ্ছে? (Auto-Renewal)
- **স্যান্ডবক্স রিনিউয়াল**: গুগল স্যান্ডবক্স মোডে "Yearly" প্ল্যান প্রতি ১৫-৩০ মিনিটে অটোমেটিক রিনিউ হয়।
- **কিভাবে বুঝবেন?**: আপনার `googleOrderId` লক্ষ্য করুন। যদি শেষে `..1`, `..2`, `..3` থাকে, তার মানে গুগল এটি রিনিউ করেছে।
- **রিস্টোর (Restore)**: যখন আপনি "Restore" ক্লিক করেন, গুগল স্টোর থেকে লেটেস্ট একটিভ রিনিউয়ালটি খুঁজে পায়। যেহেতু গুগল বলছে এটি একটিভ, তাই ব্যাকএন্ড নিয়ম অনুযায়ী ইউজারকে প্রিমিয়াম এক্সেস দিয়ে দেয়। এটি কোনো বাগ নয়, বরং গুগলের ভ্যালিড ফিচার।

### 14.2 কিভাবে নতুন করে "Buy" ফ্লো টেস্ট করবেন?
আপনি যদি চান ইউজার `FREE` হয়ে যাক যাতে আপনি আবার নতুন করে কিনতে পারেন, তবে আপনাকে এই অটো-রিনিউয়াল প্রসেসটি থামাতে হবে:
1. অ্যান্ড্রয়েড ফোনের **Google Play Store** অ্যাপে যান।
2. **Payments & Subscriptions > Subscriptions** থেকে এই সাবস্ক্রিপশনটি **Cancel** করে দিন।
3. ক্যানসেল করার পর ১৫-২০ মিনিট অপেক্ষা করুন যাতে বর্তমান মেয়াদটি শেষ হয়।
4. মেয়াদ শেষ হওয়ার পর একবার `/subscriptions/me` কল করলেই আমাদের **Lazy Cleanup** লজিক আপনার অ্যাকাউন্টকে অটোমেটিক `FREE` করে দিবে।

### 14.3 সেফটি বাফার (Safety Buffer)
- **প্রোডাকশন**: মেয়াদ শেষ হওয়ার পর আরও ২৪ ঘণ্টা ইউজারকে এক্সেস দেওয়া হয় (যাতে নেটওয়ার্ক বা বিলিং ডিলেতে ইউজার ব্লক না হয়)।
- **স্যান্ডবক্স**: ডেভেলপারদের জন্য এটি মাত্র ২ মিনিট করা হয়েছে যাতে দ্রুত টেস্টিং করা যায়।

---

## 15. Where to Read Next

- [00-flows.md](../../../../documentaction/modules/subscription/00-flows.md) — end-to-end backend flow diagrams
- [02-verify-apple-purchase.md](../../../../documentaction/modules/subscription/02-verify-apple-purchase.md) — Apple verify contract
- [03-verify-google-purchase.md](../../../../documentaction/modules/subscription/03-verify-google-purchase.md) — Google verify contract
- [04-set-free-plan.md](../../../../documentaction/modules/subscription/04-set-free-plan.md) — choose-free contract
- [06-technical-architecture.md](../../../../documentaction/modules/subscription/06-technical-architecture.md) — security model, fraud guards, idempotency
- [helpers/iap-account.ts](helpers/iap-account.ts) — canonical `IAP_NAMESPACE` value
- [helpers/plan.mapper.ts](helpers/plan.mapper.ts) — canonical productId list
