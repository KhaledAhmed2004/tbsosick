# API Design & Mentor Notes

> **Generated from** (folder: `app-screens/`):
> - `01-auth.md` — Mobile auth: registration, OTP verification (with state-persistence across cold-start), login (email + Google + Apple), forgot / reset / change password, refresh-token rotation, logout, device registration.
> - `02-home.md` — Home screen: stats counts, favorite-cards horizontal carousel, "All Cards / My Cards" tabs, search bar, quick-create FAB, edit/delete on My Cards.
> - `03-preference-card-details.md` — Card details: read full record, favorite toggle, share (frontend-only), download (PDF rendered locally + counter increment).
> - `04-create-preference-card.md` — Card creation form: catalog typeaheads (supplies + sutures with custom-add), photo upload (max 5), draft / publish CTAs.
> - `05-library.md` — Global search across public preference cards: search bar with debounce, filter sheet (specialty + verified-only), list actions.
> - `06-calendar.md` — Calendar: month-range fetch, date selection, structured event CRUD (`title, date, time, duration, location, eventType, linkedPreferenceCard, personnel, notes`), 24 h + 1 h auto reminders.
> - `07-profile.md` — Profile: read / edit profile, subscription read state, IAP upgrade flow, restore purchases, legal pages, logout.
> - `08-notifications.md` — Notifications: bell + red dot from `meta.unreadCount`, list with cursor pagination, deep-link by `type`, mark single / mark-all read, swipe-to-delete, real-time `notification:new` socket sync.
>
> Plus `system-concepts.md` (cross-cutting envelope, status mapping, roles, common UI rules) — read for context, not for endpoint shapes.
>
> **Date**: 2026-04-30
> **Scope**: Greenfield REST API for the **mobile (USER) surface only** of a medical preference-card platform. Admin / dashboard endpoints are out of scope (no UX docs in `app-screens/` for them).
> **Stack assumed**: stack-agnostic (HTTP + JSON + JWT). Design transfers to any backend.
> **Mode**: Greenfield (UX-up). Existing backend code, route files, and prior `api-mentor.md` were ignored — this is what the API would look like if built fresh today.

---

## 0. Conventions & Cross-Cutting

### 0.1 Base URL & versioning

- `{{baseUrl}}` = `https://api.tbsosick.com/v1` (production), `https://staging-api.tbsosick.com/v1` (staging), `http://localhost:5000/v1` (local).
- All endpoints mounted under `/v1`.

> **Why URI versioning** (`/v1/`) over header versioning: the version is visible in every log line, every Postman tab, every error report. Alternative — `Accept: application/vnd.tbsosick.v1+json` — hides the version in something proxies don't see and clients often forget to set, leading to silent v0 fallback. Trade-off: every breaking change forces a `/v2/` prefix and a parallel-deploy migration. Acceptable for a closed-loop app (mobile + dashboard, no third-party integrators). *Citation: Google AIP-180.*

### 0.2 Response envelope

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human-readable description",
  "data": { /* endpoint-specific */ },
  "meta": { /* pagination + domain-specific (e.g. unreadCount) */ }
}
```

> **Why this envelope**: stable shape across endpoints means the mobile app needs one generic `ApiResponse<T>` deserializer instead of branching per endpoint. `statusCode` mirrors the HTTP code so logs are scannable without joining body + status. Trade-off: adds ~30 bytes vs returning bare data. Alternative (raw response): cleaner on the wire but every client has to inspect HTTP status and pick a different parse path on errors. *Citation: in-house pragmatic; documented in `system-concepts.md`.*

### 0.3 Error envelope

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "code": "invalid_format", "message": "Enter a valid email address." }
  ],
  "data": null
}
```

> **Why machine-readable per-field codes** (`field` + `code`): clients render inline errors under the right form field by `field`, and branch on `code` for non-translatable logic ("show password-strength meter" on `code: "weak_password"`). The human `message` is for direct display + i18n. RFC 7807 (`application/problem+json`) is the open-standard alternative — adopt it if external partners ever consume the API; this in-house envelope wins for closed-loop apps because it reuses the success envelope's shape. *Citation: in-house; see RFC 7807 § Problem Details for an alternative.*

### 0.4 Pagination

- **Default**: cursor — `?cursor=<opaque>&limit=20`. Response `meta`: `{ nextCursor, hasNext }`.
- **Page-based ONLY when**: total is small + bounded (e.g. dashboard admin tables — out of scope here).
- **Notification list adds**: `meta.unreadCount: number` — the user's total unread count across all pages, computed server-side.

> **Why cursor by default**: the notification list and preference-card discovery list both grow under inserts. Page-based pagination drifts: page 2 fetched 5 minutes after page 1 may show overlapping rows because new records arrived between fetches. Cursor pagination is stable under inserts and cheap on indexed columns (`{ userId, createdAt }`). Trade-off: cursors are opaque tokens the client can't construct, so "jump to page N" UX dies — fine here because mobile always paginates by infinite scroll. *Citation: Stripe API § List endpoints; Slack `conversations.list` returns cursor-based + inline counts.*

### 0.5 Auth

- **User sessions**: JWT access token (**15 min**) + refresh token (**30 days**, rotated on every use). Mobile reads tokens from response body, persists to SecureStorage.
- **Refresh-token reuse detection**: server tracks `tokenVersion` per user. Reset / change-password / logout / refresh-failure increments it. Any refresh request with a stale `tokenVersion` force-logs-out the user.
- **Roles**: `Public`, `USER`. (`SUPER_ADMIN` exists in the system but doesn't appear in `app-screens/` UX — out of scope here.)
- **Plan gate** (separate from role gate): subscription tier check on Library, Calendar, and card-creation count.

> **Why short-lived access + rotating refresh** instead of a single long-lived token: limits blast radius of an access-token leak (max 15-min exposure) without forcing the user to log in every session. Rotation + reuse-detection turns refresh-token theft into a self-defeating attack — the legitimate client immediately sees a 401, the system force-logs-out, and the attacker's token is dead too. Trade-off: client must implement proactive refresh at `TTL - 60s` to avoid user-visible 401-then-retry latency. *Citation: OAuth 2.1 draft (BCP 195).*

### 0.6 Idempotency

- **Idempotent verbs** (GET / PUT / DELETE / PATCH-as-partial-set-of-stable-fields): safe to retry blindly.
- **Non-idempotent POSTs that REQUIRE `Idempotency-Key`**: signup, card create, event create, IAP receipt verify. Header value = UUID v4. Server stores `(userId, key) → response` in a 24-h TTL cache; replays return the cached response.

> **Why mandatory for create + verify-receipt**: client retries on 5xx / network drops are inevitable on mobile. Without keys, retries cause duplicate cards, duplicate events, duplicate accounts, and (worst case) split-brain subscription state where the receipt was processed but the response was lost. The server keys on `(userId, key)` so different users with the same UUID don't collide. Trade-off: 24-h key retention adds a small cache footprint. Alternative (deterministic keys derived from request hash): breaks legitimate duplicate creates — e.g. user creates two cards with the same title. *Citation: Stripe API § Idempotent requests.*

### 0.7 Rate limits

- **Default**: 100 req / min per authenticated user (token-bucket).
- **Stricter buckets**: `/auth/*` 5 req / min per IP (brute-force protection); `GET /preference-cards` search 60 / min (search-bar debounce protection); `POST /preference-cards/:cardId/download` 20 / min.
- **Headers** on every response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (epoch seconds). On 429 also `Retry-After: <seconds>`.

> **Why token-bucket + per-route overrides**: hot endpoints need tighter limits than cold endpoints. Returning rate-limit headers on success too lets clients self-throttle before hitting 429. *Citation: GitHub REST § Rate limiting; RFC 6585 § Retry-After.*

### 0.8 Cacheability

- `GET /legal-pages` and `GET /legal-pages/:slug`: `Cache-Control: public, max-age=300` + `ETag`. Clients send `If-None-Match` → 304 on hit.
- `GET /preference-cards/specialties`: `Cache-Control: private, max-age=600` + `ETag` (specialties drift slowly).
- All other authenticated GETs: `Cache-Control: no-store`.

> **Why ETag on legal pages**: legal-page slugs change rarely (months between revisions) but every Profile screen open re-fetches them. `If-None-Match` → 304 saves the body bytes. Trade-off: server has to compute the ETag (typically `md5(body)`); negligible cost for small documents. *Citation: RFC 7232 § Conditional requests.*

### 0.9 Status code policy

| Verb | Success | Common errors |
|---|---|---|
| GET | 200, 304 (cache hit) | 401, 403, 404, 429 |
| POST (create) | 201 + `Location` header | 400, 401, 403, 409, 422, 429 |
| POST (action — login, refresh, mark-all-read, verify-receipt, download) | 200 / 202 | 400, 401, 403, 404, 409, 422, 429 |
| PATCH (partial update) | 200 | 400, 401, 403, 404, 409, 422 |
| PUT (idempotent set / replace) | 200 / 204 | 400, 401, 403, 404, 422 |
| DELETE | 204 | 401, 403, 404, 409 |

> **Why never overload 200 with `success: false`** in body: HTTP gives us a free machine-readable status field. Returning `200 { success: false }` forces every client to parse the body twice (once for status, once for actual error) and breaks intermediate observability tools that bucket by HTTP status. *Citation: RFC 7231 § 6 (status codes carry semantics).*

### 0.10 Real-time channel (Socket.IO)

Not REST, but in scope for the design:
- Channel: `notifications:${userId}` (server emits to a room keyed on the authenticated user).
- Events: `notification:new` (payload = the new notification record), `notification:read` (id), `notification:deleted` (id).
- Auth: client connects with the JWT access token in the `auth` handshake; server validates same-as-REST.

> **Why a separate socket channel** instead of long-poll: the bell badge wants real-time updates on event-reminder fires. Long-polling would waste battery on mobile. WebSockets are well-supported in Flutter (`socket_io_client`). Trade-off: keeping a socket open costs battery — the client should close on background and resume on foreground. *Citation: industry-standard for in-app real-time notifications.*

### 0.11 File upload contract

- **Mechanism**: `multipart/form-data` direct to the resource endpoint (e.g. `POST /preference-cards` with photo files in `photos[]` field).
- **Constraints**: max 5 files per card; ≤ 5 MB per file; accepted MIME types `image/jpeg, image/png, image/webp, image/heic, image/heif`.
- **Profile picture**: same shape on `PATCH /users/me` with `profilePicture` field.

> **Why direct multipart** instead of a pre-signed-URL two-step flow: a single request keeps the mobile retry / progress logic simple. Pre-signed URLs (S3-style) are better for large files (> 50 MB) where progress reporting and resumable uploads matter; medical preference cards top out at ~25 MB total. Trade-off: the server pays the upload-bandwidth cost. Acceptable at this scale. *Citation: in-house; revisit if photo libraries grow.*

---

## 1. Endpoint Inventory (grouped by module)

> 12 modules. Endpoints derived from UX in `app-screens/`. Every endpoint traces to a user action documented in the source files.

---

### Module: `users` (signup + self-profile + change password)

#### 1.1 `POST /users`
- **Auth**: Public
- **Idempotent**: No (`Idempotency-Key` header recommended)
- **Triggered by**: `01-auth.md § Registration Flow → step 3`
- **Request**:
  ```json
  { "name": "John Doe", "email": "user@example.com", "password": "Str0ng!Pwd", "phone": "+15551234567", "country": "US" }
  ```
- **Response 201** (`Location: /users/me`):
  ```json
  { "success": true, "statusCode": 201, "message": "Account created. Check your email for verification.", "data": { "userId": "usr_...", "email": "user@example.com", "verified": false } }
  ```
- **Errors**: 409 (email already registered), 422 (validation), 429.

> **Why `POST /users` is the public signup endpoint** instead of `/auth/register`: signup creates a User resource — that's a CRUD-shaped action, so the resource path wins. `/auth/register` is a verb-shaped action endpoint and is also fine industry-wide; both are defensible. Picking the resource path keeps signup discoverable in the same `/users` namespace as the rest of self-management. Trade-off: tradition is split — Stripe uses `/customers`, Auth0 uses `/dbconnections/signup`. *Citation: GitHub `POST /user` for self.*

#### 1.2 `GET /users/me`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Triggered by**: `07-profile.md § Profile Load & View → step 3`
- **Response 200**:
  ```json
  { "success": true, "data": { "userId": "usr_...", "name": "John Doe", "email": "...", "hospital": "...", "specialty": "...", "profilePicture": "https://...", "verified": true, "subscriptionPlan": "PREMIUM" } }
  ```
- **Errors**: 401, 403 (account suspended).

> **Why `me` alias** instead of `/users/:userId` with the user's own ID: the ID is implied by the access token; making the client repeat their own ID in the URL is redundant and a footgun (a copy-pasted admin URL with another user's ID could leak data if the auth gate fails). `/me` is industry idiom. *Citation: Stripe `/v1/account`, GitHub `/user`.*

#### 1.3 `PATCH /users/me`
- **Auth**: Bearer
- **Idempotent**: Yes (partial set)
- **Triggered by**: `07-profile.md § Profile Edit Flow`
- **Content-Type**: `multipart/form-data` (when `profilePicture` is set) or `application/json` (when not).
- **Request body fields**: `name`, `hospital`, `specialty`, `phone`, `profilePicture` (file). All optional; at least one required.
- **Response 200**: returns the updated user record.
- **Errors**: 400 (empty body), 401, 422, 415 (unsupported media type).

> **Why `PATCH /users/me`** instead of `PUT`: PATCH is a partial set — the user updates only the fields they changed. PUT would require sending the full user record on every save, which mobile dirty-state tracking specifically tries to avoid. *Citation: RFC 5789 (PATCH semantics).*

---

### Module: `auth` — sessions

#### 2.1 `POST /auth/login`
- **Auth**: Public
- **Idempotent**: No
- **Triggered by**: `01-auth.md § Login Flow → step 2`
- **Request**:
  ```json
  { "email": "user@example.com", "password": "..." }
  ```
- **Response 200**:
  ```json
  { "success": true, "data": { "user": { "userId": "...", "email": "...", "verified": true }, "accessToken": "eyJ...", "refreshToken": "eyJ..." } }
  ```
- **Errors**: 401 (`code: "invalid_credentials"` — generic, no email enumeration; `code: "email_not_verified"` — special case so the client can route to the OTP screen), 403 (account suspended), 422, 429.

> **Why generic `invalid_credentials` for both bad password AND missing user**: prevents email enumeration. An attacker timing the response shouldn't get different copy. The one exception is `email_not_verified` — that's an in-product UX (the user just registered and forgot to verify), not an enumeration vector, because the same path is reachable via `POST /users` returning 201. Trade-off: legitimate users with typo'd emails get a slightly less helpful error. *Citation: OWASP ASVS § V2.1; Stripe API guideline.*

> **Why credentials in body, not query**: query strings leak via access logs, browser history, referrer headers. POST body is the conventional credential channel and is not logged by default proxies. *Citation: RFC 9110 § Security Considerations.*

#### 2.2 `POST /auth/refresh`
- **Auth**: refresh token in body OR `httpOnly` cookie (web)
- **Idempotent**: No (rotates the refresh token)
- **Triggered by**: `01-auth.md § Token Refresh (Background)` — fires on any 401 from a protected call
- **Request**: `{ "refreshToken": "..." }` (mobile body) — or cookie-borne (web).
- **Response 200**: same shape as 2.1 with new token pair.
- **Errors**: 401 (`code: "refresh_token_reused"` — force-logout; `code: "refresh_token_expired"` — re-login).

> **Why a separate endpoint** instead of folding refresh into `/auth/login`: refresh has a different threat model — different rate-limit, different audit trail, different reuse-detection logic. Mixing them complicates security review and makes it harder to instrument breach detection. *Citation: OAuth 2.0 § Token endpoint; in-house security review.*

> **Why distinguish `refresh_token_reused` from `refresh_token_expired`** with explicit codes: the client behavior differs — reuse means an attacker may be active and the user must be alerted; expiry is normal. Without distinct codes, the client treats both as "log in again" and the security signal is lost. *Citation: RFC 6749 § Refresh-token reuse detection (custom extension).*

#### 2.3 `POST /auth/logout`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Triggered by**: `07-profile.md § Logout Flow → step 3`
- **Request**: empty body (or `{ "deviceId": "..." }` to also unregister the device — alternative: client calls `DELETE /users/me/devices/:deviceId` separately).
- **Response 204**: no content.
- **Errors**: 401 (invalid token).

> **Why `POST` not `DELETE`**: logout creates side effects (revoke refresh token, increment `tokenVersion`, optionally unregister device). DELETE on a session resource (`DELETE /auth/sessions/current`) is more REST-pure but introduces a sessions resource the API doesn't otherwise expose. POST keeps the auth namespace flat. *Citation: in-house pragmatic; see Stripe `POST /v1/oauth/deauthorize`.*

#### 2.4 `POST /auth/social-login`
- **Auth**: Public
- **Idempotent**: No (creates / links account)
- **Triggered by**: `01-auth.md § Social Login Flow (Google / Apple)`
- **Request**:
  ```json
  { "provider": "google", "idToken": "...", "nonce": "..." }
  ```
- **Response 200**: same shape as 2.1.
- **Errors**: 401 (`code: "invalid_id_token"`, `code: "nonce_mismatch"`), 409 (`code: "email_already_password_account"` — user has an existing email-password account; do not auto-link), 400 (`code: "apple_email_not_shared"`).

> **Why no auto-link** between social and email-password accounts on 409: an attacker who can sign up for a Google account at any email can then log into a victim's email-password account via the social path. Forcing manual login with the original password closes that account-hijack vector. *Citation: in-house security review; OWASP Account Takeover prevention.*

> **Why `nonce` is required (Apple) and recommended (Google)**: replay protection — a stolen `idToken` that includes a `nonce` claim is bound to that one auth attempt. Without it, captured tokens can be replayed within the token's TTL. Apple's `sign_in_with_apple` SDK handles this transparently; Google's Flutter plugin doesn't expose it cleanly so we degrade. *Citation: OpenID Connect Core § 15.5.2; Apple Developer § Sign in with Apple.*

---

### Module: `auth` — email verification

#### 3.1 `POST /auth/email/verify`
- **Auth**: Public
- **Idempotent**: No (consumes the OTP)
- **Triggered by**: `01-auth.md § Registration Flow → step 6` and `Login Flow → step 4` (when login returns `email_not_verified`)
- **Request**: `{ "email": "...", "otp": "123456" }`
- **Response 200**: same shape as 2.1 — auto-login on first verification.
- **Errors**: 400 (`code: "invalid_or_expired_otp"`), 422, 429.

#### 3.2 `POST /auth/email/resend`
- **Auth**: Public
- **Idempotent**: No (rate-limited; sends a new email)
- **Triggered by**: `01-auth.md § Registration Flow → step 5` ("Resend" button)
- **Request**: `{ "email": "..." }`
- **Response 200**: silent-success body (regardless of whether the email exists).
- **Errors**: 429.

> **Why split email-verify from password-reset-token-issue** (instead of one `/auth/verify-otp` that branches on the user's `verified` flag and returns different response shapes): one endpoint returning two different response shapes is a soft REST violation — clients can't tell from the request which response shape they'll get; they have to inspect server-state-derived hidden context. Splitting into two endpoints with two distinct response contracts removes the ambiguity. The client already knows which flow it's in (`purpose: "REGISTRATION"` vs `purpose: "FORGOT_PASSWORD"`) — let the URL reflect that. *Citation: in-house; cleaner contract per OpenAPI 3.1 design principles.*

---

### Module: `auth` — password

#### 4.1 `POST /auth/password/forgot`
- **Auth**: Public
- **Idempotent**: Effectively (silent-success)
- **Triggered by**: `01-auth.md § Forgot Password Flow → step 2`
- **Request**: `{ "email": "..." }`
- **Response 200**: silent-success body — *"If this email is registered, you'll receive a verification code."*
- **Errors**: 429.

#### 4.2 `POST /auth/password/reset-tokens`
- **Auth**: Public
- **Idempotent**: No (consumes the OTP)
- **Triggered by**: `01-auth.md § Forgot Password Flow → step 5` (verify OTP for forgot-password)
- **Request**: `{ "email": "...", "otp": "123456" }`
- **Response 200**:
  ```json
  { "success": true, "data": { "resetToken": "rst_...", "expiresIn": 600 } }
  ```
- **Errors**: 400 (`invalid_or_expired_otp`), 422, 429.

#### 4.3 `POST /auth/password/reset`
- **Auth**: Reset Token (`Authorization: Bearer rst_...`)
- **Idempotent**: No (consumes the token + bumps `tokenVersion`)
- **Triggered by**: `01-auth.md § Forgot Password Flow → step 7`
- **Request**: `{ "newPassword": "..." }`
- **Response 204**.
- **Errors**: 401 (token expired/invalid), 422 (weak password).

#### 4.4 `POST /auth/password/change`
- **Auth**: Bearer
- **Idempotent**: No (bumps `tokenVersion`)
- **Triggered by**: implied by `01-auth.md § Related Screens → "(change password, logout)"` reference to Profile (no explicit UX in `app-screens/` — see Open Questions Q1).
- **Request**: `{ "currentPassword": "...", "newPassword": "..." }`
- **Response 204**.
- **Errors**: 401 (`current_password_wrong`), 422 (weak new password).

> **Why bump `tokenVersion` on password reset AND change**: invalidates every other device's refresh token. If the user reset the password because their phone was stolen, the old phone's logged-in session is now dead too. Trade-off: the user has to re-login on every other device after a password change. Acceptable. *Citation: in-house security review.*

---

### Module: `users` — devices (FCM push)

#### 5.1 `POST /users/me/devices`
- **Auth**: Bearer
- **Idempotent**: Yes (upsert on `(userId, deviceId)`)
- **Triggered by**: `01-auth.md § Device & FCM token lifecycle` — fires after every auth success and on FCM token rotation.
- **Request**: `{ "deviceId": "uuid-v4-stable-per-install", "platform": "ios", "fcmToken": "..." }`
- **Response 200**: returns the registered device record.
- **Errors**: 422.

#### 5.2 `DELETE /users/me/devices/:deviceId`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Triggered by**: explicit logout (before clearing local session).
- **Response 204**.
- **Errors**: 401, 404.

#### 5.3 `GET /users/me/devices`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Triggered by**: future "Active Sessions" UI in Profile (not in current `app-screens/` UX — see Open Questions Q2).
- **Response 200**: cursor-paginated list of `{ deviceId, platform, lastSeenAt, registeredAt }`.

> **Why dedicated `/users/me/devices` resource** instead of stuffing `deviceToken` into auth bodies: device registration has its own lifecycle that doesn't align with auth — FCM rotates the token mid-session (no auth event); logout might end the session but leave the device registered (different intent). Decoupling keeps each lifecycle clean and lets the device API evolve (e.g. `lastSeenAt` for active-session UI). *Citation: GitHub `/user/installations`; Apple Push Notification Service guidelines.*

> **Why nest under `/users/me/`** instead of a flat `/devices`: devices are exclusively owned by one user. The path makes ownership unambiguous and removes any temptation to add a `?userId=` query later. *Citation: Spotify `/me/playlists`, Twitter `/users/:id/tweets`.*

---

### Module: `preference-cards` — public discovery

#### 6.1 `GET /preference-cards`
- **Auth**: Bearer (plan-gated for paid users only)
- **Idempotent**: Yes
- **Triggered by**: `05-library.md § Library Initial Load`, `02-home.md § Search & Discovery`
- **Query**: `?cursor=...&limit=20&searchTerm=...&specialty=...&verifiedOnly=true`
- **Response 200**: cursor-paginated list of card summaries `{ cardId, cardTitle, surgeon: { name, specialty }, verificationStatus, isFavorited, downloadCount, createdAt }`.
- **Errors**: 401, 403 (`code: "plan_required"` — Free user hitting the library), 422, 429.

#### 6.2 `GET /preference-cards/:cardId`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Triggered by**: `03-preference-card-details.md § View Card Details → step 2`
- **Response 200**: full card record (all clinical sections, photos, surgeon block).
- **Errors**: 401, 403 (private card, non-owner), 404.

#### 6.3 `GET /preference-cards/specialties`
- **Auth**: Bearer
- **Idempotent**: Yes (cacheable, ETag)
- **Triggered by**: `05-library.md § Filtering → step 2` (filter dropdown)
- **Response 200**: `{ data: ["Orthopedics", "Cardiology", ...] }`.

> **Why a public discovery list** (`/preference-cards`) **separate from "my own cards"** (`/users/me/preference-cards`, see 7.1 below): they're conceptually different surfaces — global catalog vs personal workspace. A single `/preference-cards?visibility=public|private` endpoint that returns different data based on a query flag has dual semantics under one URL, which is harder to reason about and harder to rate-limit (different traffic patterns). Splitting follows the Spotify pattern: `/playlists` (public) vs `/me/playlists` (mine). *Citation: Spotify Web API.*

#### 6.4 `POST /preference-cards/:cardId/download`
- **Auth**: Bearer (plan-gated)
- **Idempotent**: No (counter increments per request)
- **Triggered by**: `03-preference-card-details.md § Download → step 4`
- **Request**: empty body.
- **Response 200**: `{ data: { downloadCount: 13 } }`.
- **Errors**: 401, 403, 404, 429 (20 / min limit per user).

> **Why `POST` with verb-in-path** for download: this is a non-CRUD action with a side effect (counter increment) and no resource to PUT or PATCH. The idiomatic REST shape for "trigger an action on a resource" is `POST /resource/:id/action`. Alternative (`PATCH /:cardId { downloadCount: prev + 1 }`): forces the client to know the previous count and creates a race condition. *Citation: Stripe `POST /charges/:id/capture`; Google AIP-136 (Custom methods).*

> **Why client-side PDF generation** (the actual file is rendered locally; this endpoint only increments the counter): zero server CPU cost, zero bandwidth cost, the app already has the JSON in memory. Trade-off: PDF formatting is duplicated per platform (iOS / Android). Acceptable in v1 because the card layout is simple. Migrate to `GET /preference-cards/:cardId/download.pdf` returning a server-rendered binary IF "share PDF link" becomes a feature. *Citation: in-house; D5 in `overview.md`.*

---

### Module: `users` — owned preference cards

#### 7.1 `GET /users/me/preference-cards`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Triggered by**: `02-home.md § 1. Home Initial Load → step 3` (My Cards tab)
- **Query**: `?cursor=...&limit=20&status=draft|published|all`
- **Response 200**: cursor-paginated list of the user's own cards (drafts + published).

#### 7.2 `POST /users/me/preference-cards`
- **Auth**: Bearer (plan-gated — card-count ceiling check)
- **Idempotent**: No (`Idempotency-Key` required)
- **Triggered by**: `04-create-preference-card.md § Create Card`
- **Content-Type**: `multipart/form-data`
- **Request fields**: `cardTitle`, `surgeon` (JSON-encoded object), `medication`, `supplies[]` (JSON array of `{ supplyId | name, quantity }`), `sutures[]` (JSON array, same shape), `instruments`, `positioningEquipment`, `prepping`, `workflow`, `keyNotes`, `photos[]` (file fields, max 5), `published` (boolean).
- **Response 201** (`Location: /preference-cards/:cardId`): the created card.
- **Errors**: 400 (`code: "publish_requires_all_fields"` — published=true with missing required clinical fields), 403 (`code: "card_limit_reached"`), 422, 415.

> **Why supply / suture items can be submitted by `name` OR `supplyId`**: the create-card UX has a "+ Add 'X' as custom" affordance — when a user types a supply name not in the catalog, they expect it to "just work" without a separate `POST /supplies` step. Server resolves names: matches an existing supply if the name is unique-case-insensitive; auto-creates a new catalog row if not. Trade-off: catalog grows organically + admin curates later. Alternative (force the client to call `POST /supplies` first): two round-trips, error-prone retry semantics. *Citation: in-house; common pattern in tag-creation UIs.*

> **Why nest under `/users/me/`** for create / update / delete but flat `/preference-cards/:cardId` for read: the read is shared between owner and public (a published card shows up in both `/preference-cards` discovery and `/users/me/preference-cards`); having two read URLs for the same resource is confusing. Mutations are exclusively owner-scoped, so `/users/me/preference-cards/...` makes the auth contract obvious. *Citation: in-house; balances Spotify-style nested ownership with Stripe-style flat resource reads.*

#### 7.3 `PATCH /users/me/preference-cards/:cardId`
- **Auth**: Bearer (must be card creator)
- **Idempotent**: Yes (partial set)
- **Triggered by**: `02-home.md § 3. My Cards → Edit Card`, `03-preference-card-details.md § View Card Details → step 4` (Edit icon for owner)
- **Content-Type**: `multipart/form-data` (when photos change) or `application/json`.
- **Response 200**: updated card record.
- **Errors**: 400 (publish-validation), 403 (not owner), 404, 422.

#### 7.4 `DELETE /users/me/preference-cards/:cardId`
- **Auth**: Bearer (must be card creator)
- **Idempotent**: Yes
- **Triggered by**: `02-home.md § 3. My Cards → Delete Card`, `03-preference-card-details.md § View Card Details → step 4` (Delete button for owner)
- **Response 204**.
- **Errors**: 401, 403, 404.

---

### Module: `users` — favorites

#### 8.1 `GET /users/me/favorites`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Triggered by**: `02-home.md § 1. Home Initial Load → step 3` (favorites carousel)
- **Query**: `?cursor=...&limit=20`
- **Response 200**: cursor-paginated list of card summaries.

#### 8.2 `PUT /users/me/favorites/:cardId`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Triggered by**: `02-home.md § 5. Favorite Interaction Flow`, `03-preference-card-details.md § Favorite Toggle`, `05-library.md § Card Actions`
- **Request**: empty body.
- **Response 204**.
- **Errors**: 401, 404 (card doesn't exist), 403 (private card not owned by user).

#### 8.3 `DELETE /users/me/favorites/:cardId`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Response 204**.

> **Why `PUT` for favorite-add** instead of `POST`: favoriting is idempotent — calling it twice yields the same state (one row, the user has favorited the card). PUT signals this contract to clients and intermediaries. POST would imply each call creates a new resource (duplicate-favorite rows), which the server then has to dedupe. *Citation: RFC 7231 § 4.3.4 (PUT idempotent).*

> **Why nest under `/users/me/favorites/`** instead of `/preference-cards/:cardId/favorite`: favorites are a relation owned by the user — "this user has favorited that card" is more naturally a sub-resource of the user. The card doesn't "have favorites" in any UX-meaningful way; the user has a favorites collection. *Citation: Spotify `PUT /me/tracks/:id`; Twitter `POST /favorites/create.json` (legacy, kept for shape comparison).*

---

### Module: `catalog` — supplies + sutures (read-only from app)

#### 9.1 `GET /supplies`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Triggered by**: `04-create-preference-card.md § Create Card → step 3`
- **Query**: `?cursor=...&limit=20&searchTerm=...`
- **Response 200**: cursor-paginated `{ supplyId, name }`.

#### 9.2 `GET /sutures`
- Same shape, mounted at `/sutures`.

> **Why two near-identical resources** (`supplies` + `sutures`) rather than one polymorphic `/catalog?type=...`: domain-distinct master catalogs. In v2, sutures will gain `material`, `gauge`, `length`; supplies will gain `sterile`, `single-use`. Forcing them through one endpoint creates a bag of optional fields that don't apply to half the rows. *Citation: Domain-Driven Design § Bounded Contexts.*

> **Why these are read-only from the app surface**: catalog management is admin-only (out of scope for `app-screens/`). User-side custom-add happens transparently inside `POST /users/me/preference-cards` (see 7.2 rationale).

---

### Module: `users` — events (calendar)

#### 10.1 `GET /users/me/events`
- **Auth**: Bearer (plan-gated)
- **Idempotent**: Yes
- **Triggered by**: `06-calendar.md § Calendar Initial Load → step 2`
- **Query**: `?from=2026-04-01&to=2026-04-30&cursor=...&limit=50`
- **Response 200**: list of events in the date range (cursor only used when range exceeds limit).

#### 10.2 `POST /users/me/events`
- **Auth**: Bearer (plan-gated)
- **Idempotent**: No (`Idempotency-Key` required)
- **Triggered by**: `06-calendar.md § Create Event Flow → step 3`
- **Request**:
  ```json
  {
    "title": "Knee Arthroscopy — Smith",
    "date": "2026-05-15",
    "time": "08:30",
    "duration": 90,
    "location": "OR-3",
    "eventType": "surgery",
    "linkedPreferenceCard": "card_...",
    "personnel": [{ "name": "Dr. Smith", "role": "Lead Surgeon" }],
    "notes": "..."
  }
  ```
- **Response 201** (`Location: /users/me/events/:eventId`): the created event with computed `startsAt`, `endsAt`.
- **Errors**: 400 (`code: "invalid_event_type"`), 422, 429.

#### 10.3 `GET /users/me/events/:eventId`
- **Auth**: Bearer (must be event owner)
- **Response 200**: event with `linkedPreferenceCard` populated to `{ cardId, cardTitle }`.
- **Errors**: 401, 403, 404.

#### 10.4 `PATCH /users/me/events/:eventId`
- **Auth**: Bearer (owner)
- **Idempotent**: Yes
- **Response 200**: updated event. Reminders re-scheduled if `date` / `time` / `duration` changed.

#### 10.5 `DELETE /users/me/events/:eventId`
- **Auth**: Bearer (owner)
- **Response 204**.

> **Why `personnel: Array<{ name, role }>`** instead of `Array<userId>`: the UX (`06-calendar.md`) defines personnel as free-text names with role labels (Lead Surgeon, Surgical Team, etc.). Using userIds would require team collaboration — which is out of scope per `overview.md` D12. Migrate to refs in v2 if collaboration ships. *Citation: D6 in `overview.md`.*

> **Why server resolves `date + time + duration` into `startsAt + endsAt`** (instead of accepting `startsAt + endsAt` directly): the UX form has separate inputs for each. Asking the client to compute the ISO timestamps means more places to get timezone math wrong. Server takes the user's local-clock inputs and computes consistent UTC timestamps using the user's stored timezone. *Citation: in-house pragmatic.*

---

### Module: `users` — notifications

#### 11.1 `GET /users/me/notifications`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Triggered by**: `08-notifications.md § Bell Icon`, `Open Notification List`
- **Query**: `?cursor=...&limit=20`
- **Response 200**:
  ```json
  {
    "success": true,
    "data": [
      { "notificationId": "ntf_...", "type": "REMINDER", "title": "...", "subtitle": "...", "read": false, "icon": "calendar", "resource": { "type": "event", "id": "evt_..." }, "createdAt": "..." }
    ],
    "meta": { "nextCursor": "...", "hasNext": true, "unreadCount": 7 }
  }
  ```
- **Errors**: 401.

> **Why `meta.unreadCount` lives on the existing list response** (not a separate `GET /unread-count` endpoint): app foreground re-fetch returns both list AND badge in one round-trip. A separate count endpoint doubles the request count for the most common app-launch scenario, and the count would drift between fetches anyway. Server computes via a covering index `{ userId, read }`. Trade-off: every list call computes the count, even when the client only wanted the list rows. Cheap with the index. *Citation: Slack Web API `conversations.list` returns `unread_count` inline.*

> **Why `resource: { type, id }` is included on every notification**: the UX deep-links to the related resource on tap (`type: "REMINDER"` → event detail; card-related → card detail). Including the structured ref means the client doesn't have to parse `subtitle` text or guess from `type` alone. *Citation: in-house; common notification-payload pattern.*

#### 11.2 `PATCH /users/me/notifications/:notificationId`
- **Auth**: Bearer (must be notification owner)
- **Idempotent**: Yes
- **Triggered by**: `08-notifications.md § Tap on Notification → Deep Link → step 3` (mark as read)
- **Request**: `{ "read": true }`
- **Response 200**: updated notification record.
- **Errors**: 401, 404.

#### 11.3 `POST /users/me/notifications/mark-all-read`
- **Auth**: Bearer
- **Idempotent**: Yes (no-op if already all-read)
- **Triggered by**: `08-notifications.md § Mark All as Read → step 2`
- **Request**: empty body.
- **Response 200**: `{ data: { markedCount: 7 } }`.
- **Errors**: 401.

#### 11.4 `DELETE /users/me/notifications/:notificationId`
- **Auth**: Bearer (owner)
- **Idempotent**: Yes
- **Triggered by**: `08-notifications.md § Swipe-to-Delete`
- **Response 204**.
- **Errors**: 401, 404.

> **Why `PATCH /:notificationId { read: true }`** instead of `PATCH /:notificationId/read` (verb-in-path): this is a state mutation on a resource — exactly what PATCH-with-body is for. State in body composes naturally with future state additions (e.g. archived, snoozed) without new routes. Verb-in-path forces a new endpoint per state and can't compose. *Citation: Google AIP-216 (state transition); RFC 5789.*

> **Why `POST /mark-all-read` is verb-in-path** (and acceptable): bulk action endpoints that target a collection (not a specific resource) are non-CRUD actions. PATCH on the collection (`PATCH /users/me/notifications { read: true }`) is REST-pure but unusual and harder for clients to discover. The `mark-all-read` verb is unambiguous and matches Slack's `conversations.markAll`. Trade-off: adds a verb to the path, but only at the action-endpoint frontier. *Citation: Slack Web API; Google AIP-136 (Custom methods) explicitly allows this.*

---

### Module: `users` — subscription (IAP)

#### 12.1 `GET /users/me/subscription`
- **Auth**: Bearer
- **Idempotent**: Yes
- **Triggered by**: `07-profile.md § Subscription Read State`
- **Response 200**:
  ```json
  { "success": true, "data": { "plan": "PREMIUM", "interval": "yearly", "status": "ACTIVE", "expiresAt": "2027-04-28T00:00:00Z", "autoRenew": true } }
  ```
  Free users get `{ plan: "FREE", ... }` — never 404.
- **Errors**: 401.

#### 12.2 `POST /users/me/subscription/verify-receipt`
- **Auth**: Bearer
- **Idempotent**: Yes (server-side, on `(userId, originalTransactionId)`) + `Idempotency-Key` header recommended for network retries
- **Triggered by**: `07-profile.md § Upgrade Flow (IAP) → step 8`, `Restore Purchases → step 3`
- **Request**: `{ "platform": "ios", "productId": "com.tbsosick.premium.yearly", "receipt": "<base64>" }`
- **Response 200**: returns the updated subscription record.
- **Errors**: 400 (`code: "invalid_receipt"`), 409 (`code: "receipt_belongs_to_another_user"`), 422.

> **Why `/users/me/subscription` is singular** (no plural collection): a user has at most one active subscription. Modeling it as a collection (`/subscriptions/:id`) creates a fake plural that the API must hide via "always returns one" semantics. Singular keeps the contract honest. *Citation: Stripe `/customer/:id/subscription` (when only one allowed); Google AIP-156 (Singletons).*

> **Why the receipt verify is `POST` with verb-in-path** (`/verify-receipt`): non-CRUD action against an external IDP (Apple App Store, Google Play). The action is the receipt verification; the side effect is the subscription update. PATCH on the subscription resource (`PATCH /users/me/subscription { receipt }`) is technically possible but obscures that the receipt is an *external* token being processed, not a field being set. *Citation: Apple Developer § Verifying receipts; Google Play Developer API.*

> **Why server-side idempotent on `(userId, originalTransactionId)`**: Restore Purchases on a new device replays the exact same receipt. The server must yield the same active subscription record, not duplicate it. Plus `Idempotency-Key` for network-retry safety. Two layers of idempotency for the price of one — store-side semantic + client-side network-retry. *Citation: Apple Developer § Restoring purchases; Stripe idempotency layered design.*

---

### Module: `legal-pages` (public CMS read)

#### 13.1 `GET /legal-pages`
- **Auth**: Public
- **Idempotent**: Yes (cacheable, ETag, `Cache-Control: public, max-age=300`)
- **Triggered by**: `07-profile.md § Legal Pages → step 2`
- **Response 200**: list of `{ slug, title }`.

#### 13.2 `GET /legal-pages/:slug`
- **Auth**: Public
- **Idempotent**: Yes (cacheable, ETag)
- **Triggered by**: `07-profile.md § Legal Pages → step 5`
- **Response 200**: `{ slug, title, content (HTML or Markdown), updatedAt }`.
- **Errors**: 404, 304 (cache hit).

> **Why `/legal-pages` plural-noun** instead of `/legal`: REST commandment — plural noun for resource collections. `/legal` is an abstract namespace, not a resource. Trade-off: slightly longer path. *Citation: GitHub `POST /legal/license`, etc., uses plural for actual resource collections.*

---

## 2. Resource Model Cheat-Sheet

| Resource | Identifier | Base path | Collection (GET) | Create (POST) | Get one (GET) | Update (PATCH) | Delete (DELETE) | Sub-resources / Notes |
|---|---|---|---|---|---|---|---|---|
| User | `userId` (`me` alias) | `/users` | — (admin only, out of scope) | `POST /users` (signup) | `GET /users/me` | `PATCH /users/me` | — | `/users/me/devices`, `/users/me/preference-cards`, `/users/me/favorites`, `/users/me/events`, `/users/me/notifications`, `/users/me/subscription` |
| Session | (token) | `/auth` | — | `POST /auth/login`, `/social-login`, `/refresh` | — | — | `POST /auth/logout` | `/auth/email/verify`, `/auth/email/resend`, `/auth/password/forgot`, `/auth/password/reset-tokens`, `/auth/password/reset`, `/auth/password/change` |
| Device | `deviceId` | `/users/me/devices` | ✅ | `POST /users/me/devices` (idempotent upsert) | — | — (rotation = re-POST) | `DELETE /users/me/devices/:deviceId` | — |
| PreferenceCard (public read) | `cardId` | `/preference-cards` | ✅ public discovery | — | ✅ `GET /preference-cards/:cardId` | — | — | `/preference-cards/specialties`, `/preference-cards/:cardId/download` |
| OwnedPreferenceCard | `cardId` | `/users/me/preference-cards` | ✅ owner workspace | ✅ `POST /users/me/preference-cards` | (read via `/preference-cards/:cardId`) | ✅ owner | ✅ owner | Multipart upload for photos |
| Favorite | `cardId` | `/users/me/favorites` | ✅ | `PUT /users/me/favorites/:cardId` (idempotent set) | — | — | `DELETE /users/me/favorites/:cardId` | — |
| Supply | `supplyId` | `/supplies` | ✅ (search-able typeahead) | (admin-only, out of scope) | — | — | — | Auto-resolved by name in card create |
| Suture | `sutureId` | `/sutures` | ✅ | (admin-only, out of scope) | — | — | — | Same as Supply |
| Event | `eventId` | `/users/me/events` | ✅ (date-range filter) | ✅ | ✅ | ✅ | ✅ | Auto reminders T-24h, T-1h |
| Notification | `notificationId` | `/users/me/notifications` | ✅ (cursor + `unreadCount`) | (system-created, out of band) | (read via list) | ✅ `{ read: true }` | ✅ | `POST /users/me/notifications/mark-all-read` |
| Subscription | (singleton per user) | `/users/me/subscription` | — | (created via verify-receipt) | ✅ | — (state via verify-receipt) | — | `POST /users/me/subscription/verify-receipt` |
| LegalPage | `slug` | `/legal-pages` | ✅ public | (admin-only, out of scope) | ✅ | — | — | ETag cacheable |

---

## 3. RESTful Compliance Audit

| # | Endpoint | Plural-noun path | Meaningful path param | Correct verb | Correct status code | No mirrored verbs | Idempotency contract | Notes |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1.1 | `POST /users` | ✅ | N/A | ✅ | ✅ 201 | ✅ | ✅ `Idempotency-Key` | — |
| 1.2 | `GET /users/me` | ✅ | ✅ (`me` alias) | ✅ | ✅ 200 | ✅ | ✅ idempotent | — |
| 1.3 | `PATCH /users/me` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ partial set | — |
| 2.1 | `POST /auth/login` | ✅ | N/A | ✅ | ✅ 200 | ✅ | ✅ session-create | Verb-in-path acceptable for non-CRUD action collection |
| 2.2 | `POST /auth/refresh` | ✅ | N/A | ✅ | ✅ 200 | ✅ | ✅ rotation | Same as above |
| 2.3 | `POST /auth/logout` | ✅ | N/A | ✅ | ✅ 204 | ✅ | ✅ | — |
| 2.4 | `POST /auth/social-login` | ✅ | N/A | ✅ | ✅ 200 | ✅ | ✅ | — |
| 3.1 | `POST /auth/email/verify` | ✅ | N/A | ✅ | ✅ 200 | ✅ | ✅ token-consuming | — |
| 3.2 | `POST /auth/email/resend` | ✅ | N/A | ✅ | ✅ 200 | ✅ | ✅ rate-limited | — |
| 4.1 | `POST /auth/password/forgot` | ✅ | N/A | ✅ | ✅ 200 | ✅ | ✅ silent-success | — |
| 4.2 | `POST /auth/password/reset-tokens` | ✅ | N/A | ✅ | ✅ 200 | ✅ | ✅ token-consuming | Plural-noun resource (reset-tokens issued) |
| 4.3 | `POST /auth/password/reset` | ✅ | N/A | ✅ | ✅ 204 | ✅ | ✅ | — |
| 4.4 | `POST /auth/password/change` | ✅ | N/A | ✅ | ✅ 204 | ✅ | ✅ | — |
| 5.1 | `POST /users/me/devices` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ upsert idempotent | Returns 200 not 201 because upsert |
| 5.2 | `DELETE /users/me/devices/:deviceId` | ✅ | ✅ | ✅ | ✅ 204 | ✅ | ✅ | — |
| 5.3 | `GET /users/me/devices` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ | — |
| 6.1 | `GET /preference-cards` | ✅ | N/A | ✅ | ✅ 200 | ✅ | ✅ | — |
| 6.2 | `GET /preference-cards/:cardId` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ | — |
| 6.3 | `GET /preference-cards/specialties` | ✅ | N/A | ✅ | ✅ 200 / 304 | ✅ | ✅ ETag | — |
| 6.4 | `POST /preference-cards/:cardId/download` | ✅ | ✅ | ✅ | ✅ 200 | ✅ (deliberate verb-in-path) | ⚠️ counter not idempotent | Documented as deliberate non-CRUD action |
| 7.1 | `GET /users/me/preference-cards` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ | — |
| 7.2 | `POST /users/me/preference-cards` | ✅ | ✅ | ✅ | ✅ 201 | ✅ | ✅ `Idempotency-Key` | — |
| 7.3 | `PATCH /users/me/preference-cards/:cardId` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ partial set | — |
| 7.4 | `DELETE /users/me/preference-cards/:cardId` | ✅ | ✅ | ✅ | ✅ 204 | ✅ | ✅ | — |
| 8.1 | `GET /users/me/favorites` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ | — |
| 8.2 | `PUT /users/me/favorites/:cardId` | ✅ | ✅ | ✅ | ✅ 204 | ✅ | ✅ idempotent set | — |
| 8.3 | `DELETE /users/me/favorites/:cardId` | ✅ | ✅ | ✅ | ✅ 204 | ✅ | ✅ | — |
| 9.1 | `GET /supplies` | ✅ | N/A | ✅ | ✅ 200 | ✅ | ✅ | — |
| 9.2 | `GET /sutures` | ✅ | N/A | ✅ | ✅ 200 | ✅ | ✅ | — |
| 10.1 | `GET /users/me/events` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ | — |
| 10.2 | `POST /users/me/events` | ✅ | ✅ | ✅ | ✅ 201 | ✅ | ✅ `Idempotency-Key` | — |
| 10.3 | `GET /users/me/events/:eventId` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ | — |
| 10.4 | `PATCH /users/me/events/:eventId` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ partial set | — |
| 10.5 | `DELETE /users/me/events/:eventId` | ✅ | ✅ | ✅ | ✅ 204 | ✅ | ✅ | — |
| 11.1 | `GET /users/me/notifications` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ `unreadCount` in meta | — |
| 11.2 | `PATCH /users/me/notifications/:notificationId` | ✅ | ✅ | ✅ | ✅ 200 | ✅ | ✅ state in body | — |
| 11.3 | `POST /users/me/notifications/mark-all-read` | ✅ | ✅ | ✅ | ✅ 200 | ✅ (deliberate verb-in-path) | ✅ idempotent (no-op replay) | Bulk action endpoint |
| 11.4 | `DELETE /users/me/notifications/:notificationId` | ✅ | ✅ | ✅ | ✅ 204 | ✅ | ✅ | — |
| 12.1 | `GET /users/me/subscription` | (singleton, no plural) | ✅ | ✅ | ✅ 200 | ✅ | ✅ | Documented exception per Google AIP-156 |
| 12.2 | `POST /users/me/subscription/verify-receipt` | (singleton parent) | ✅ | ✅ | ✅ 200 | ✅ (deliberate verb-in-path) | ✅ server-idempotent + key | — |
| 13.1 | `GET /legal-pages` | ✅ | N/A | ✅ | ✅ 200 / 304 | ✅ | ✅ ETag | — |
| 13.2 | `GET /legal-pages/:slug` | ✅ | ✅ | ✅ | ✅ 200 / 304 | ✅ | ✅ ETag | — |

All endpoints comply with REST commandments. Three deliberate verb-in-path actions are documented: `POST /preference-cards/:cardId/download` (counter), `POST /users/me/notifications/mark-all-read` (bulk action), `POST /users/me/subscription/verify-receipt` (external IDP action). Each has a "why this" rationale in §1.

---

## 4. Mentor Notes — Top 10 Decisions Explained

### 4.1 Why URI versioning (`/v1/`) over header versioning

URI versioning is visible in every log line, every Postman tab, every error report. Header versioning hides the version in something proxies don't see and clients often forget to set, leading to silent v0 fallback. Trade-off: every breaking change forces a `/v2/` prefix and a parallel-deploy migration. Acceptable for a closed-loop app where you control all clients. Rejected alternative: `Accept: application/vnd.tbsosick.v1+json` — invisible in access logs. *Citation: Google AIP-180.*

### 4.2 Why cursor pagination by default

The notification list, preference-card discovery, and favorites all grow under inserts. Page-based pagination drifts: page 2 fetched 5 minutes after page 1 may show overlapping rows because new records arrived between fetches. Cursor pagination is stable under inserts and cheap on a `{ userId, createdAt }` covering index. Trade-off: opaque cursors aren't client-constructable, so "jump to page N" UX dies — fine here because mobile always paginates by infinite scroll. *Citation: Stripe API § List endpoints.*

### 4.3 Why split read paths: `/preference-cards` (public) vs `/users/me/preference-cards` (owner)

A single `/preference-cards?visibility=public|private` would return different data based on a query flag — dual semantics under one URL. Splitting makes ownership obvious from the path alone and lets each surface evolve independently (different rate limits, different caching strategy, different response shapes if needed). Trade-off: two list controllers instead of one. Cheap. *Citation: Spotify `/playlists` vs `/me/playlists`.*

### 4.4 Why `PATCH /resource/:id { state: "..." }` instead of `POST /resource/:id/state-verb`

State transitions on a resource compose: adding a third state (e.g. `archived` on notifications) is a Zod enum addition, not a new route. Mirrored verb routes (`/mark-read`, `/mark-unread`, `/archive`, `/unarchive`) duplicate validators, controllers, and audit entries for what is logically one operation — "change my state". The exception is bulk actions on collections (no specific resource to PATCH), where verb-in-path is unambiguous and idiomatic. *Citation: Google AIP-216.*

### 4.5 Why short-lived access (15 min) + rotating refresh (30 days) + reuse detection

Limits blast radius of an access-token leak (max 15-min exposure) without forcing the user to log in every session. Rotation + reuse detection turns refresh-token theft into a self-defeating attack: the legitimate client immediately sees a 401, the system force-logs-out, and the attacker's stolen token is dead too. Trade-off: more refresh traffic than long-lived tokens. Cheap. *Citation: OAuth 2.1 draft (BCP 195).*

### 4.6 Why generic 401 on `/auth/login` (no email enumeration)

An attacker who can distinguish "user exists" from "user doesn't exist" via timing or copy can build a list of valid emails to brute-force. The same principle drives silent-success on `/auth/password/forgot` and `/auth/email/resend` — response is identical regardless of whether the email is registered. Trade-off: legitimate users with typo'd emails get a slightly less helpful error. The single exception (`code: "email_not_verified"`) isn't an enumeration vector because the same path is reachable via signup. *Citation: OWASP ASVS § V2.1.*

### 4.7 Why split OTP verification into two endpoints (`/auth/email/verify` vs `/auth/password/reset-tokens`)

The current single-endpoint pattern returns two different response shapes (auto-login tokens vs reset-token) based on the user's `verified` flag — a soft REST violation because the response shape isn't predictable from the request alone. Splitting into two endpoints with two distinct contracts removes the ambiguity. Each endpoint does one thing; the URL signals which flow the client is in. Trade-off: two routes instead of one. Negligible cost. *Citation: in-house; cleaner contract per OpenAPI 3.1.*

### 4.8 Why `Idempotency-Key` is mandatory on creates and verify-receipt

Client retries on 5xx / network drops are inevitable on mobile. Without keys, retries cause duplicate cards, duplicate events, duplicate accounts, and (worst case) split-brain subscription state where the receipt was processed but the response was lost. The server keys on `(userId, key)` so different users with the same UUID don't collide. Trade-off: 24-h key retention adds a small cache footprint. *Citation: Stripe API § Idempotent requests.*

### 4.9 Why `meta.unreadCount` lives on the existing list response (not a separate endpoint)

The bell badge wants real-time accuracy. Bundling the count into the list response means one round-trip on app foreground returns both the latest list AND the badge count. A separate `GET /unread-count` endpoint would double the request count for the most common app-launch scenario, and the count would drift between fetches anyway. Trade-off: every list call computes the count, even when the client only wanted the rows. Cheap with a `{ userId, read }` covering index. *Citation: Slack Web API `conversations.list`.*

### 4.10 Why client-side PDF generation for card download (counter-only endpoint)

Server cost: zero (no PDF rendering). Server bandwidth: zero (no binary response). The client already has the JSON in memory from `GET /preference-cards/:cardId`. The `POST /:cardId/download` endpoint exists only as analytics — counter increment on a separate POST keeps the read endpoint cacheable (a hypothetical `GET /:cardId.pdf` returning a binary would defeat ETags on the JSON read). Trade-off: PDF formatting is duplicated per platform (iOS / Android — two renderers). Migrate to server-rendered PDF when "share PDF link" becomes a feature OR when card complexity makes per-platform parity a real test burden. *Citation: in-house; D5 in `overview.md`.*

---

## 5. Open Questions

These are gaps in the source UX that block a final API freeze.

### From `01-auth.md`

- **Q1 `[NEEDS INFO]`** — *(§ Related Screens header — "(change password, logout)")* — Change-password UX flow is referenced in 01-auth's header link but the actual screen / flow isn't in `app-screens/`. Endpoint 4.4 (`POST /auth/password/change`) is therefore designed from inference. Confirm: **(A)** Change password is a Profile-screen flow with `currentPassword + newPassword` fields → endpoint shape stands. **(B)** No in-app change password — users must use forgot-password flow → drop endpoint 4.4. **Blocks**: deciding whether `tokenVersion` bumps on change-password (forces other devices to re-login). **`[ANS: ]`**

### From `07-profile.md`

- **Q2 `[NEEDS INFO]`** — *(§ Profile screen, no current sub-flow)* — Multi-device session list is implied by the design of `/users/me/devices` (endpoint 5.3) but no UX shows a "Manage Devices" or "Active Sessions" surface. Decide: **(A)** Add the surface in v1 (Profile → Active Sessions list with "log out this device" buttons) → endpoint 5.3 stays. **(B)** Defer to v2 → drop endpoint 5.3 from v1. **Blocks**: scope of v1 device API. **`[ANS: ]`**

### Cross-cutting

- **Q3 `[NEEDS INFO]`** — *(§ 0.4 Pagination)* — Notifications + favorites + preference-cards default to cursor pagination. The current production system is page-based. Decide: **(A)** Land cursor in v1 — preferred for hot lists, requires client + server changes. **(B)** Keep page-based in v1 and migrate hot lists to cursor in v2. **Blocks**: client pagination implementation. **`[ANS: ]`**

- **Q4 `[NEEDS INFO]`** — *(§ 0.10 Real-time channel + `08-notifications.md § Real-time Updates`)* — Socket events on the `notifications:${userId}` channel: should the server also emit `notification:read` and `notification:deleted` events when the user mutates state on Device A, so Device B's open notification screen syncs in real-time? Or is that out-of-scope for v1 (multi-device sync via re-fetch on foreground only)? **(A)** Emit cross-device sync events. **(B)** Defer to v2; rely on foreground re-fetch. **Blocks**: socket event payload contract and server emit logic. **`[ANS: ]`**

- **Q5 `[NEEDS INFO]`** — *(§ 0.11 File upload contract + `04-create-preference-card.md § photos`)* — Photo upload is direct-multipart on the same `POST /users/me/preference-cards` request. As card photo libraries grow, this could push response time over the mobile timeout window (~30 s on weak networks). Decide: **(A)** Direct multipart in v1; revisit if upload-timeout complaints surface. **(B)** Two-step pre-signed-URL flow now (`POST /users/me/uploads` returns S3-style URL → client uploads → `POST /users/me/preference-cards { photoUrls: [...] }`). **Blocks**: upload pipeline, retry semantics. **`[ANS: ]`**

- **Q6 `[NEEDS INFO]`** — *(§ Module: catalog — supplies + sutures)* — Custom-add: `POST /users/me/preference-cards` accepts `supplies: [{ name: "X", quantity: 1 }]` and the server auto-creates the supply if it doesn't exist. Decide: **(A)** Auto-create silently → catalog grows organically; admin curates duplicates later. **(B)** Reject unknown names with `422 { code: "unknown_supply" }` → user must explicitly call a separate `POST /supplies` first (which doesn't exist on the user surface yet — would need adding). **Blocks**: catalog quality + UX of the `+ Add "X" as custom` affordance. **`[ANS: ]`**

---

## 6. Suggested Next Steps

1. Resolve **Q1** (change-password flow) and **Q5** (upload pipeline) first — both touch endpoint contracts that downstream consumers (mobile + future audit) need pinned before implementation.
2. Decide **Q3** (cursor vs page-based pagination) before client engineering starts — switching pagination style mid-project is expensive.
3. Resolve **Q6** (catalog auto-create) before the create-card form ships — the affordance copy ("+ Add 'X' as custom") commits the UX to one behaviour or the other.
4. Generate per-module API specs using the **API Module Generator** template in this prompt library — feed each module section from §1 as input.
5. Cross-check the audit using the **RESTful API Inventory + Audit Generator** template to catch anything missed in §3.
6. Use the **API Spec → Coder Prompt** template to scaffold the actual backend code from these specs.
