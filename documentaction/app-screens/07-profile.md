# Screen 7: Profile (Mobile)

> **Section**: App Screens — UX Flow + API Reference
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Auth](./01-auth.md) — login, session-expire, logout shared · Subscription Management (native store handoff impacts this screen state).
> **Base URL**: `{{baseUrl}}/api/v1`
> **API conventions**: see [_shared/api-conventions.md](../_shared/api-conventions.md) — response envelope, error shape, status codes, headers, file uploads.

---

## Profile-Specific Constants

| Item | Value |
|---|---|
| Profile picture | Max 5 MB, JPEG / PNG / WEBP |
| Subscription read | DB-first — always fetched fresh on screen focus, no client cache |
| IAP receipt verification | Server validates against Apple / Google receipt servers before granting state |
| Server-confirmed commit | UI updates only after backend returns the saved document |
| Auth | All endpoints require `Authorization: Bearer {{accessToken}}` |

---

## 1. Profile Load & View

**Trigger** — user opens the Profile tab → parallel fetch:
- [`GET /users/profile`](#get-api-v1-users-profile) — name, email, hospital, specialty, profile picture
- [`GET /subscriptions/me`](#get-api-v1-subscriptions-me) — plan, status, expiry

**Use case**
- Subscription state is **DB-first** — the server reads its own subscription document, not the platform store. Always fresh on each focus; no client cache.
- Profile and subscription are independent calls; client merges them in the UI.

**Status — `GET /users/profile`** — `Implemented`

> **Path note**: doc previously proposed `GET /users/me`. **The actual route in code is `GET /users/profile`** — same purpose.

**Implementation**
- Route: [`user.route.ts`](src/app/modules/user/user.route.ts) — `GET /profile`
- Controller: [`UserController.getUserProfile`](src/app/modules/user/user.controller.ts)
- Service: [`UserService.getUserProfileFromDB`](src/app/modules/user/user.service.ts)
- Validation: —
- Reads: `User`
- Writes: —

**Status — `GET /subscriptions/me`** — `Implemented`

**Implementation**
- Route: [`subscription.route.ts`](src/app/modules/subscription/subscription.route.ts) — `GET /me`
- Controller: [`SubscriptionController.getMySubscriptionController`](src/app/modules/subscription/subscription.controller.ts)
- Service: [`SubscriptionService.getMySubscription`](src/app/modules/subscription/subscription.service.ts)
- Validation: —
- Reads: `Subscription`
- Writes: `Subscription` (lazy-write only — e.g. expire-stale-state on read)

### API Reference

#### `GET /api/v1/users/profile`

Returns the logged-in user's profile.

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "664a...",
    "name": "Dr. Sara Ahmed",
    "email": "sara@example.com",
    "hospital": "City General Hospital",
    "specialty": "General Surgery",
    "profilePictureUrl": "https://cdn.../avatar.jpg",
    "role": "USER",
    "isEmailVerified": true,
    "createdAt": "2026-01-10T08:00:00.000Z"
  }
}
```

#### `GET /api/v1/subscriptions/me`

Returns the user's current subscription state.

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {
    "plan": "PREMIUM",
    "billingInterval": "MONTHLY",
    "status": "ACTIVE",
    "renewalStatus": "AUTO_RENEW",
    "expiresAt": "2026-06-03T00:00:00.000Z",
    "platform": "APPLE",
    "isExpired": false
  }
}
```

> Possible values:
> - `plan`: `FREE` | `PREMIUM` | `ENTERPRISE`
> - `billingInterval`: `MONTHLY` | `YEARLY` | `null` (free)
> - `status`: `ACTIVE` | `EXPIRED` | `PENDING` | `CANCELLED`
> - `renewalStatus`: `AUTO_RENEW` | `CANCELLED` | `NONE`
> - `platform`: `APPLE` | `GOOGLE` | `null`

---

## 2. Edit Profile

**Trigger** — user submits the Edit Profile form → [`PATCH /users/profile`](#patch-api-v1-users-profile). Multipart when changing the picture; JSON otherwise.

> **Path note**: doc previously proposed `PATCH /users/me`. **The actual route is `PATCH /users/profile`.**

**Use case**
- Server-confirmed commit — UI updates only after the backend returns the final saved document.
- Email is **not** editable via this endpoint — change-email lives behind a separate verification flow (`// TBD`).
- `fileHandler` middleware enforces 5 MB / mime allow-list before the controller runs.

**Business rules**
- Email change flow — `// TBD`. Recommendation: dedicated `POST /auth/change-email` that re-issues OTP to the new address; not editable inline.
- Profile picture deletion (without replacement) — `// TBD`. Recommendation: accept `profilePicture: null` in the JSON body to clear.

**Status** — `Implemented`

**Implementation**
- Route: [`user.route.ts`](src/app/modules/user/user.route.ts) — `PATCH /profile`
- Controller: [`UserController.updateProfile`](src/app/modules/user/user.controller.ts)
- Service: [`UserService.updateProfileToDB`](src/app/modules/user/user.service.ts)
- Validation: [`updateUserZodSchema`](src/app/modules/user/user.validation.ts)
- Reads: `User`
- Writes: `User`

### API Reference

#### `PATCH /api/v1/users/profile`

Updates the user's profile. Accepts `application/json` for text fields or `multipart/form-data` when sending a new profile picture.

**Body / form fields** — all optional

| Field | Type | Notes |
|---|---|---|
| `name` | string | 2–60 chars |
| `hospital` | string | ≤ 120 chars |
| `specialty` | string | Single specialty |
| `profilePicture` | file | Max 5 MB, JPEG / PNG / WEBP — sent as multipart |

**Success — `200 OK`** — returns the full updated user document (same shape as `GET /users/profile`).

**Errors**

| Code | `message` |
|---|---|
| 400 | `Invalid input` (with `errorSources[]`) |
| 413 | `Profile picture exceeds 5 MB` |
| 415 | `Only JPEG, PNG, or WEBP allowed` |

---

## 3. Subscription Read State

**Trigger** — Profile screen rendered → values from [`GET /subscriptions/me`](#get-api-v1-subscriptions-me) (already fetched in §1).

**Use case**
- `status === EXPIRED` → render downgraded badge.
- `renewalStatus === CANCELLED` and `expiresAt` in the future → warning label, access remains valid.
- "Manage Subscription" link opens the native store screen — no backend call from the client.

**Status — `GET /subscriptions/plans` (plans listing)** — `Not implemented` (Planned)

> The doc proposes a `GET /subscriptions/plans` endpoint to populate the upgrade picker. **No such route exists in code today.** Plan list is currently inferred from the platform's product IDs (hardcoded on the client). **Recommendation**: add a server-side `GET /subscriptions/plans` so plan changes (price, billing interval) don't require client releases.

### API Reference

#### `GET /api/v1/subscriptions/plans` *(Planned)*

Proposed shape for the upgrade picker.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "id": "PREMIUM_MONTHLY",
      "plan": "PREMIUM",
      "billingInterval": "MONTHLY",
      "appleProductId": "com.app.premium.monthly",
      "googleProductId": "premium_monthly",
      "displayPrice": "$9.99/mo"
    }
  ]
}
```

---

## 4. Upgrade (In-App Purchase) & Restore

**Trigger**
- User completes IAP flow → app sends platform-specific receipt → either:
  - [`POST /subscriptions/apple/verify`](#post-api-v1-subscriptions-apple-verify) (App Store)
  - [`POST /subscriptions/google/verify`](#post-api-v1-subscriptions-google-verify) (Play Store)
- User taps **Restore Purchases** → native SDK fetches purchase history → same `/apple/verify` or `/google/verify` endpoint.
- User picks the **Free** plan (downgrade / first-time choose) → [`POST /subscriptions/choose/free`](#post-api-v1-subscriptions-choose-free).

> **Path note**: doc previously proposed a unified `POST /subscriptions/verify-receipt`. **The actual code splits per-platform** — `/subscriptions/apple/verify` and `/subscriptions/google/verify`. Apple and Google receipts have different shapes, so per-platform endpoints are simpler than a polymorphic body.

**Use case**
- **Server-side verification is mandatory** — clients must never grant subscription access until the server confirms the receipt with the platform.
- Restore reuses the same `/verify` call — receipt validity is determined by the platform, not by the action that triggered it.
- After verify: re-fetch [`GET /subscriptions/me`](#get-api-v1-subscriptions-me) to refresh the card.
- Apple/Google **webhooks** (`/subscriptions/apple/webhook`, `/subscriptions/google/webhook`) keep server state fresh on renewal/cancel — these are server-to-server, not invoked from the app.

**Business rules**
- Receipt double-redemption — server must reject when the same receipt has already been bound to another account → `409 Receipt already redeemed`.
- Plan downgrade window — `// TBD`. When upgrading mid-month, prorate or charge full?  Decision: defer to platform billing; server only mirrors the resulting state.

**Status — `POST /subscriptions/apple/verify`** — `Implemented`

**Implementation**
- Route: [`subscription.route.ts`](src/app/modules/subscription/subscription.route.ts) — `POST /apple/verify`
- Controller: [`SubscriptionController.verifyApplePurchaseController`](src/app/modules/subscription/subscription.controller.ts)
- Service: [`SubscriptionService.verifyApplePurchase`](src/app/modules/subscription/subscription.service.ts)
- Validation: [`appleVerifySchema`](src/app/modules/subscription/subscription.validation.ts)
- Reads: `Subscription`
- Writes: `Subscription`

**Status — `POST /subscriptions/google/verify`** — `Implemented`

**Implementation**
- Route: [`subscription.route.ts`](src/app/modules/subscription/subscription.route.ts) — `POST /google/verify`
- Controller: [`SubscriptionController.verifyGooglePurchaseController`](src/app/modules/subscription/subscription.controller.ts)
- Service: [`SubscriptionService.verifyGooglePurchase`](src/app/modules/subscription/subscription.service.ts)
- Validation: [`googleVerifySchema`](src/app/modules/subscription/subscription.validation.ts)
- Reads: `Subscription`
- Writes: `Subscription`

**Status — `POST /subscriptions/choose/free`** — `Implemented`

**Implementation**
- Route: [`subscription.route.ts`](src/app/modules/subscription/subscription.route.ts) — `POST /choose/free`
- Controller: [`SubscriptionController.chooseFreePlanController`](src/app/modules/subscription/subscription.controller.ts)
- Service: [`SubscriptionService.setFreePlan`](src/app/modules/subscription/subscription.service.ts)
- Validation: —
- Reads: —
- Writes: `Subscription` (sets `plan: FREE`)

### API Reference

#### `POST /api/v1/subscriptions/apple/verify`

Verifies an Apple IAP receipt and updates the user's subscription state.

**Request body**

```json
{
  "receipt": "<base64-encoded-receipt>",
  "productId": "com.app.premium.monthly"
}
```

**Success — `200 OK`** — returns the new subscription state (same shape as `GET /subscriptions/me`).

**Errors**

| Code | `message` |
|---|---|
| 400 | `Invalid receipt format` |
| 402 | `Receipt could not be verified by App Store` |
| 409 | `Receipt already redeemed by another account` |

#### `POST /api/v1/subscriptions/google/verify`

Same shape as Apple; body keys are platform-specific.

**Request body**

```json
{
  "purchaseToken": "<google-purchase-token>",
  "productId": "premium_monthly"
}
```

**Success — `200 OK`** — same shape as `GET /subscriptions/me`.

#### `POST /api/v1/subscriptions/choose/free`

Sets the user's plan to `FREE` (used for first-time onboarding when the user opts out of paid plans, or as a downgrade after cancellation).

**Request body** — none.

**Success — `200 OK`** — returns the new subscription state.

---

## 5. Legal Pages

**Trigger** — user selects **Terms & Conditions** or **Privacy Policy** → [`GET /legal`](#get-api-v1-legal). User picks a page → [`GET /legal/:slug`](#get-api-v1-legal-slug).

> **Path note**: doc previously proposed `/legal/pages` and `/legal/pages/:slug`. **The actual routes are `/legal/` and `/legal/:slug`** — no `pages` segment.

**Use case**
- Pages are stored in `LegalPage` documents keyed by `slug` (kebab-case).
- Content is markdown — client renders it in a reader view.

**Status — `GET /legal`** — `Implemented`

**Implementation**
- Route: [`legal.route.ts`](src/app/modules/legal/legal.route.ts) — `GET /`
- Controller: [`LegalController.getAll`](src/app/modules/legal/legal.controller.ts)
- Service: [`LegalService.getAll`](src/app/modules/legal/legal.service.ts)
- Validation: —
- Reads: `LegalPage`
- Writes: —

**Status — `GET /legal/:slug`** — `Implemented`

**Implementation**
- Route: [`legal.route.ts`](src/app/modules/legal/legal.route.ts) — `GET /:slug`
- Controller: [`LegalController.getBySlug`](src/app/modules/legal/legal.controller.ts)
- Service: [`LegalService.getBySlug`](src/app/modules/legal/legal.service.ts)
- Validation: —
- Reads: `LegalPage`
- Writes: —

### API Reference

#### `GET /api/v1/legal`

Returns the published legal pages index.

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": [
    { "slug": "terms-and-conditions", "title": "Terms & Conditions", "updatedAt": "2026-04-01T00:00:00.000Z" },
    { "slug": "privacy-policy", "title": "Privacy Policy", "updatedAt": "2026-04-01T00:00:00.000Z" }
  ]
}
```

#### `GET /api/v1/legal/:slug`

Returns a single legal page by slug.

**Path params** — `slug` (string, kebab-case)

**Success — `200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {
    "slug": "terms-and-conditions",
    "title": "Terms & Conditions",
    "contentMarkdown": "# Terms\n\n...",
    "version": "2.1",
    "updatedAt": "2026-04-01T00:00:00.000Z"
  }
}
```

**Errors** — `404 Page not found`.

---

## 6. Change Password

**Trigger** — Profile → Security → submit old + new password → [`POST /auth/change-password`](./01-auth.md#post-api-v1-auth-change-password) (full spec in [01-auth.md](./01-auth.md)).

**Status** — `Implemented` (full Implementation block in [01-auth.md](./01-auth.md#9-change-password-documented-for-completeness--invoked-from-profile-not-auth-flow)).

---

## 7. Logout

**Trigger** — user taps **Logout** → confirmation → [`POST /auth/logout`](./01-auth.md#post-api-v1-auth-logout) (full spec in [01-auth.md](./01-auth.md)).

**Use case** — see [01-auth.md §8](./01-auth.md#8-logout). After success, the client wipes local tokens, resets navigation, and returns to **Login**.

**Status** — `Implemented` for single-device logout. `POST /auth/logout-all` is `Not implemented` (Planned) — see [01-auth.md](./01-auth.md).

---

## Endpoint Index

| # | Method | Path | Status | Auth | Purpose |
|---|---|---|---|---|---|
| 1 | GET | `/api/v1/users/profile` | `Implemented` | Bearer | Fetch logged-in user profile |
| 2 | PATCH | `/api/v1/users/profile` | `Implemented` | Bearer | Update profile (multipart for picture) |
| 3 | GET | `/api/v1/subscriptions/me` | `Implemented` | Bearer | Current subscription state (DB-first) |
| 4 | GET | `/api/v1/subscriptions/plans` | `Not implemented` | Bearer | Available plans for upgrade picker (Planned) |
| 5 | POST | `/api/v1/subscriptions/apple/verify` | `Implemented` | Bearer | Verify Apple IAP receipt |
| 6 | POST | `/api/v1/subscriptions/google/verify` | `Implemented` | Bearer | Verify Google IAP receipt |
| 7 | POST | `/api/v1/subscriptions/choose/free` | `Implemented` | Bearer | Set plan to FREE |
| 8 | GET | `/api/v1/legal` | `Implemented` | Bearer | List legal pages |
| 9 | GET | `/api/v1/legal/:slug` | `Implemented` | Bearer | Fetch legal page by slug |

> Endpoints used on this screen but documented elsewhere:
> - `POST /api/v1/auth/change-password` — see [01-auth.md](./01-auth.md#post-api-v1-auth-change-password)
> - `POST /api/v1/auth/logout` — see [01-auth.md](./01-auth.md#post-api-v1-auth-logout)
> - `POST /api/v1/auth/logout-all` *(Planned)* — see [01-auth.md](./01-auth.md)

> Server-to-server endpoints (not invoked from the app):
> - `POST /api/v1/subscriptions/apple/webhook` · `POST /api/v1/subscriptions/google/webhook` — store renewal/cancel webhooks; keep server state in sync.
