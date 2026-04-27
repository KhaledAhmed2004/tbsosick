# Screen 6: Profile (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Auth](./01-auth.md) (Login/Logout flow)

---

## UX Flow

### Profile Load & View
1. User app-er bottom navigation theke "Profile" tab-e click kore.
2. Page load-e parallel API calls chole:
   - User basic info → `GET /users/profile` (→ 6.1)
   - Subscription status → `GET /subscriptions/me` (→ 6.3)
3. Profile screen render hoy: Profile picture, Name, Email, Hospital, Specialty, ebong current Subscription Plan dekhay.

### Profile Edit Flow
1. User "Edit Profile" button-e click kore.
2. Form-e field gulo pre-filled thake. User info change kore (e.g., Hospital, Specialty, Profile Picture).
3. Submit → `PATCH /users/profile` (→ 6.2)
4. Success hole updated fields show kore ebong profile re-render hoy.

### Subscription Management

**Read flow**:
1. Profile load-er shathe `GET /subscriptions/me` (→ 6.3) parallel-vabe call hoy.
2. "My Subscription" card-e current plan (`FREE` / `PREMIUM` / `ENTERPRISE`), `interval`, `expiresAt`, `autoRenew` dekhay.
3. Free user-er jonno **"Upgrade to Premium"** ebong **"Upgrade to Enterprise"** CTA dekhay.
4. Paid user-er jonno **"Manage Subscription"** button native store deep-link kholay (App Store / Play Store).

**Upgrade flow (IAP)**:
1. User "Upgrade" CTA tap kore → plan picker bottom-sheet open hoy:
   - **Premium** ($5.99/mo · $59.99/yr) — 20 cards, Library, Basic Calendar.
   - **Enterprise** ($9.99/mo · $99.99/yr) — Unlimited cards, Advanced Calendar, Verification eligibility.
2. User plan + interval (monthly / yearly) select kore.
3. App native IAP SDK trigger kore corresponding `productId` shoho:
   - iOS: `com.tbsosick.premium.monthly`, `com.tbsosick.premium.yearly`, `com.tbsosick.enterprise.monthly`, `com.tbsosick.enterprise.yearly`
   - Android: same IDs (Play Billing).
4. Store payment sheet open hoy → user payment confirm kore.
5. SDK theke purchase receipt (base64-encoded) pawa jay.
6. App receipt server-e pathay → `POST /subscriptions/verify-receipt` (→ 6.6) body shoho `{ platform, productId, receipt }`.
7. Server Apple / Google verify kore subscription upsert kore + updated plan return kore.
8. Success → app `GET /subscriptions/me` re-fetch kore → "My Subscription" card naya plan dekhay → success toast ("Welcome to Premium!").
9. Failure → user-ke current plan-e rakhe, error toast dekhay + "Retry" CTA. Client local-e receipt cache kore retry korte pare.

**Restore purchases** (existing user, new device):
1. Settings → "Restore Purchases" tap kore.
2. Native SDK previously-bought transactions return kore.
3. App receipt fresh `POST /subscriptions/verify-receipt` call kore.
4. Server idempotent vabe verify kore — already-active subscription thakle existing record return kore.

**Auto-renewal**:
- Renewal / cancel events App Store / Play Store theke server webhook-e ashe (no client action). Server `expiresAt` ebong `plan` update kore. App next time `GET /subscriptions/me` call korle latest state pay.

### Legal Pages (Terms & Conditions)
1. User profile menu theke "Terms and Conditions" ba "Privacy Policy"-te click kore.
2. Initial load-e sob legal page-er list fetch hoy → `GET /legal` (→ 6.4)
3. List theke specific page (e.g., `terms-and-conditions`) select korle slug diye content fetch kore → `GET /legal/:slug` (→ 6.5)
4. Full content render hoy screen-e.

### Logout Flow
1. User profile-er niche thaka "Logout" button-e tap kore.
2. Confirm modal ashe. Confirm korle → `POST /auth/logout` (→ 1.7 in Auth)
3. Local state clear hoy ebong user-ke Login screen-e pathiye deya hoy.

---

## Edge Cases

- **Unauthorized Access**: User token expire hoye gele `401` return korbe; system user-ke login screen-e redirect korbe.
- **Free Subscription**: `GET /subscriptions/me` free user-er jonno `plan: "FREE"` object return korbe — 404 na.
- **Empty Legal Pages**: Jodi kono legal page na thake, `GET /legal` empty array return korbe (`"data": []`). Client empty state dekhabe.
- **In-App Purchase Sync**: IAP receipt verify korte fail hole subscription status update hobe na; client-side retry logic implement kora uchit.

---

<!-- ══════════════════════════════════════ -->
<!--              PROFILE FLOW              -->
<!-- ══════════════════════════════════════ -->

## 6.1 Get Profile

```
GET /users/profile
Auth: Bearer {{accessToken}}
```

> Logged-in user-er profile data fetch korar jonno.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getUserProfile`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `getUserProfileFromDB`

### Responses

**200 — Success**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "phone": "+123456789",
    "hospital": "City Hospital",
    "specialty": "Cardiology",
    "profilePicture": "https://cdn.example.com/profile.png"
  }
}
```

**401 — Unauthorized** *(token missing or expired)*
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 6.2 Update Profile

```
PATCH /users/profile
Content-Type: multipart/form-data
Auth: Bearer {{accessToken}}
```

> Profile info update ebong/ba profile picture upload korar jonno. Shudhu updated fields pathano dorkar — sob field optional.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `updateProfile`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `updateProfileInDB`

### Request Body (FormData)

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | `string` | No | Min 2 chars, max 100 chars |
| `hospital` | `string` | No | Max 150 chars |
| `specialty` | `string` | No | Max 100 chars |
| `phone` | `string` | No | Valid phone format |
| `profilePicture` | `File` | No | JPEG or PNG only, max 5MB |

> At least one field must be provided. Empty request body returns `422`.

### Responses

**200 — Success** *(returns only the fields that were updated)*
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Updated",
    "hospital": "Metro Clinic",
    "profilePicture": "https://cdn.example.com/new-pic.jpg"
  }
}
```

---

<!-- ══════════════════════════════════════ -->
<!--           SUBSCRIPTION FLOW            -->
<!-- ══════════════════════════════════════ -->

## 6.3 Get My Subscription

```
GET /subscriptions/me
Auth: Bearer {{accessToken}}
```

> Current user-er active subscription plan ebong status fetch kore. Free user-er jonno o sবসময় একটি plan object return hoy — 404 return hoy na.

**Implementation:**
- **Route**: [subscription.route.ts](file:///src/app/modules/subscription/subscription.route.ts)
- **Controller**: [subscription.controller.ts](file:///src/app/modules/subscription/subscription.controller.ts) — `getMySubscription`
- **Service**: [subscription.service.ts](file:///src/app/modules/subscription/subscription.service.ts) — `getSubscriptionByUserIdFromDB`

### Responses

**200 — Success**
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

---

## 6.6 Verify Receipt (IAP)

```
POST /subscriptions/verify-receipt
Content-Type: application/json
Auth: Bearer {{accessToken}}
```

> Mobile IAP SDK theke pawa store receipt server-e verify korar jonno. Apple App Store / Google Play r shathe verify hoy ebong subscription record upsert kore. Idempotent — same receipt re-submit korle existing subscription return kore (used by Restore Purchases).

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

### Responses

**200 — Success**
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

**400 — Invalid Receipt**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Receipt verification failed. Please try again."
}
```

**409 — Receipt Belongs to Another Account**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "This purchase is associated with a different account."
}
```

---

<!-- ══════════════════════════════════════ -->
<!--              LEGAL FLOW                -->
<!-- ══════════════════════════════════════ -->

## 6.4 List Legal Pages

```
GET /legal
Auth: None
```

> Shob available legal pages (Terms, Privacy, etc.) er title ebong slug list fetch korar jonno.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `getLegalPages`
- **Service**: [legal.service.ts](file:///src/app/modules/legal/legal.service.ts) — `getLegalPagesFromDB`

### Responses

**200 — Success**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Legal pages retrieved successfully",
  "data": [
    { "_id": "664a1b2c3d4e5f6a7b8c9d10", "title": "Terms and Conditions", "slug": "terms-and-conditions" },
    { "_id": "664a1b2c3d4e5f6a7b8c9d11", "title": "Privacy Policy", "slug": "privacy-policy" }
  ]
}
```

---

## 6.5 Get Legal Page by Slug

```
GET /legal/:slug
Auth: None
```

> Slug diye specific legal page-er full HTML/Markdown content fetch korar jonno.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `getLegalPageBySlug`
- **Service**: [legal.service.ts](file:///src/app/modules/legal/legal.service.ts) — `getLegalPageBySlugFromDB`

### Responses

**200 — Success**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Legal page content retrieved successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d10",
    "title": "Terms and Conditions",
    "slug": "terms-and-conditions",
    "content": "<h1>Terms and Conditions</h1><p>Welcome to our application...</p>"
  }
}
```

---

## API Status

| # | Endpoint | Status | Notes |
|---|---|:---:|---|
| 6.1 | `GET /users/profile` | ✅ Done | Profile load |
| 6.2 | `PATCH /users/profile` | ✅ Done | Profile update + image upload |
| 6.3 | `GET /subscriptions/me` | ✅ Done | Plan status check |
| 6.4 | `GET /legal` | ✅ Done | List of legal titles |
| 6.5 | `GET /legal/:slug` | ✅ Done | Full page content |
| 6.6 | `POST /subscriptions/verify-receipt` | 🟡 Spec Done · Code Pending | IAP receipt verification (Apple + Google). Idempotent for restore-purchases. |
