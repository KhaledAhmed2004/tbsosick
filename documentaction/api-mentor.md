# API Design & Mentor Notes

> **Generated from**:
>
> *Mobile* (`app-screens/`):
> - `01-auth.md`: Registration, login, OTP, forgot password, social login, and session refresh.
> - `02-home.md`: Home screen with favorite cards, all cards, my cards, and search features.
> - `03-preference-card-details.md`: View full card content, favorite toggle, download, edit, and delete actions.
> - `04-create-preference-card.md`: Form to create or edit a preference card including supplies, sutures, and photos.
> - `05-library.md`: Public preference card library with global search and specialty filtering.
> - `06-calendar.md`: Calendar view and event management (create, edit, delete).
> - `07-profile.md`: User profile, subscription read/upgrade, IAP restore, legal pages, and logout.
> - `08-notifications.md`: Real-time notifications list, read/unread states, and interactions.
>
> *Dashboard* (`dashboard-screens/`):
> - `01-auth.md`: Admin login, forgot password, OTP, and session refresh.
> - `02-overview.md`: Summary metrics and trend charts for total doctors, cards, and active subscriptions.
> - `03-user-management.md`: Doctor list, status toggling, edit profile, deletion, and role management.
> - `04-preference-card-management.md`: Moderation queue to verify, reject, and delete user-submitted cards.
> - `05-legal-management.md`: CMS for creating, editing, and deleting legal pages.
> - `06-supplies-management.md`: Master catalog for supplies with single/bulk creation and editing.
> - `07-sutures-management.md`: Master catalog for sutures with single/bulk creation and editing.
>
> *System* (cross-cutting):
> - `system-concepts.md`: Base URL, standard response envelopes, roles, and status code map.
> - `admin-dashboard-spec.md`: Dashboard navigation, action patterns, RBAC, and audit logging standards.
> - `overview.md`: Global system architecture, monetization constraints, module map, and domain models.
>
> **Date**: 2026-05-03
> **Scope**: Complete multi-surface RESTful API for the medical preference-card platform, covering mobile users, admin dashboard moderation, catalogs, and subscriptions.
> **Stack**: Node.js + Express + Zod + Mongoose
> **Audiences**: Both

---

## 0. Conventions & Cross-Cutting

### 0.1 Base URL & versioning
- `{{baseUrl}}` = `https://api.tbsosick.com/api/v1`
- > **Why URI versioning** instead of header / query: cache-friendly (intermediate proxies key on URL), discoverable from logs, requires no client config. Trade-off: every breaking change forces a new prefix. *Citation: Google AIP-180.*

### 0.2 Response envelope
```json
{ "success": true, "statusCode": 200, "message": "Success", "data": { ... }, "meta": { ... } }
```
> **Why this envelope**: stable shape across endpoints simplifies client deserialization. `statusCode` mirrors HTTP code so logs are scannable. `meta` carries pagination / rate-limit info without polluting `data`.

### 0.3 Error envelope
```json
{ "success": false, "statusCode": 422, "message": "Validation Error", "errorMessages": [ { "path": "email", "message": "Enter a valid email address." } ], "data": null }
```
> **Why machine-readable codes**: clients branch on specific errors instead of parsing `message` (which is for humans). Structured paths allow the UI to map inline errors directly to the form fields. *Citation: RFC 7807 (problem details pattern).*

### 0.4 Pagination
- **Default for hot mobile lists** (Notifications, Cards): cursor — `?cursor=<opaque>&limit=20`. Response `meta`: `{ nextCursor, hasNext }`.
- **Default for admin tables** (Users, Audit Logs): page-based — `?page=1&limit=20&sort=-createdAt`. Response `meta`: `{ page, limit, total, totalPages, hasNext, hasPrev }`. `total` is computed via `Model.countDocuments(filter)`.
- > **Why cursor for hot paths**: stable under inserts (page-pagination drifts when new records arrive between page fetches); cheap on indexed columns. **Why page-based for admin**: admins jump to specific pages, sort and filter aggressively, and the row count stays bounded — page-based is what they expect.

### 0.5 Auth
- **User sessions**: JWT access token + refresh token (rotated on use). Refresh token in `httpOnly` cookie.
- **Force-logout / global session invalidation**: `User.tokenVersion` (Mongoose schema field, integer, default 0). Every issued JWT includes the user's current `tokenVersion` claim. Bumping the field invalidates every outstanding token in one query — no token blacklist needed.
- > **Why short-lived access + rotating refresh + tokenVersion**: limits blast radius of token leak. `httpOnly` cookie defends refresh against XSS exfiltration. `tokenVersion` is the cheapest force-logout mechanism for Mongoose stacks. *Citation: OAuth 2.1 draft, BCP 195.*

### 0.6 Idempotency
- Idempotent verbs (GET / PUT / DELETE / PATCH) — safe to retry.
- Non-idempotent POST (Event Creation, Card Creation, Bulk Operations) — accept `Idempotency-Key` header (UUID v4). Server-side stores `{ key, userId, response, createdAt }` in a Mongoose `IdempotencyRecord` collection with a TTL index (`expireAfterSeconds: 86400`).
- > **Why this**: client retries on 5xx / network drops are inevitable. Without keys, retries cause duplicate cards or events. The TTL index gives 24 h replay protection without manual cleanup. *Citation: Stripe idempotency design.*

### 0.7 Rate limits
- **Default**: 100 req/min per user.
- **Stricter**: `/auth/*` (5 req/min per IP), `/admin/*/export` (5 per admin per hour).
- **Headers returned**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. On 429: `Retry-After` header (RFC 6585).

### 0.8 Status code policy
| Verb | Success | Common errors |
|---|---|---|
| GET | 200, 304 | 401, 402, 403, 404 |
| POST (create) | 201 + `Location` | 400, 401, 402, 403, 409, 422, 429 |
| POST (action) | 200 / 202 | 400, 401, 403, 404, 409, 422, 429 |
| PATCH | 200 / 204 | 400, 401, 403, 404, 409, 422 |
| PUT | 200 / 204 | 400, 401, 403, 404, 409, 422 |
| DELETE | 204 | 401, 403, 404, 409 |

### 0.9 RBAC + audit
- List endpoints return per-row `availableActions: ['view', 'edit', 'delete', 'suspend']` filtered to the requesting role.
- Every admin action changing state, performing a deletion, or interacting with a user's subscription requires an audit log entry in the `AuditLog` collection.
- > **Why per-row availableActions**: the UI uses these to hide or disable buttons the user isn't authorized for without duplicating RBAC logic on the client. It solves partial permissions cleanly.

---

## 1. Endpoint Inventory (grouped by module)

### Module: `auth`

#### 1.1 `POST /auth/register`
- **Audience**: mobile
- **Used on**: `01-auth` (registration form submit)
- **Auth**: Public
- **Idempotent**: No
- **Audit-logged**: No
- **Request**: `{ "name": "...", "email": "...", "password": "..." }`
- **Response 201**: `{ "success": true, "statusCode": 201, "message": "Check your email for OTP" }`
- **Errors**: 409 (Email exists), 422 (Validation).
- > **Why 201 without tokens**: registration puts the user into an unverified state requiring OTP. Returning tokens immediately would bypass email verification.

#### 1.2 `POST /auth/login`
- **Audience**: both
- **Used on**:
  - Mobile: `01-auth` (login form submit)
  - Dashboard: `01-auth` (admin login form submit)
- **Auth**: Public
- **Idempotent**: No (creates session)
- **Audit-logged**: No
- **Request**: `{ "email": "...", "password": "...", "deviceId": "..." }`
- **Response 200**: `{ "data": { "user": { ... }, "accessToken": "..." } }`
- **Errors**: 401 (Generic bad credentials), 403 (Account suspended).
- > **Why generic 401**: Prevents email enumeration (Stripe API guideline).

#### 1.3 `POST /auth/social-login`
- **Audience**: mobile
- **Used on**: `01-auth` (google/apple sign in)
- **Auth**: Public
- **Idempotent**: No
- **Audit-logged**: No
- **Request**: `{ "provider": "google|apple", "token": "..." }`
- **Response 200**: `{ "data": { "user": { ... }, "accessToken": "..." } }`
- **Errors**: 409 (Email matches password account), 422.

#### 1.4 `POST /auth/refresh-token`
- **Audience**: both
- **Used on**:
  - Mobile: `01-auth` (background refresh)
  - Dashboard: `01-auth` (background refresh)
- **Auth**: Public (uses httpOnly cookie)
- **Idempotent**: No (rotates token)
- **Audit-logged**: No
- **Response 200**: `{ "data": { "accessToken": "..." } }`
- **Errors**: 401 (Invalid/expired refresh token).

#### 1.5 `POST /auth/forgot-password`
- **Audience**: both
- **Used on**:
  - Mobile: `01-auth` (forgot password submit)
  - Dashboard: `01-auth` (forgot password submit)
- **Auth**: Public
- **Idempotent**: Yes
- **Audit-logged**: No
- **Request**: `{ "email": "..." }`
- **Response 200**: `{ "success": true, "message": "If the email exists, an OTP was sent." }`
- **Errors**: 429.
- > **Why silent success**: Returning a 404 for an unknown email leaks which emails are registered. 200 OK regardless of existence prevents enumeration.

#### 1.6 `POST /auth/verify-otp`
- **Audience**: both
- **Used on**:
  - Mobile: `01-auth` (otp verification)
  - Dashboard: `01-auth` (otp verification)
- **Auth**: Public
- **Idempotent**: No
- **Audit-logged**: No
- **Request**: `{ "email": "...", "code": "...", "purpose": "REGISTRATION|FORGOT_PASSWORD" }`
- **Response 200**: `{ "data": { "resetToken": "..." } }` (or tokens if registration)

#### 1.7 `POST /auth/logout`
- **Audience**: both
- **Used on**: 
  - Mobile: `07-profile` (logout submit)
  - Dashboard: `02-overview` (header logout)
- **Auth**: USER | SUPER_ADMIN
- **Idempotent**: Yes
- **Audit-logged**: No
- **Response 200**: `{ "success": true }`

---

### Module: `users`

#### 1.8 `GET /users/profile`
- **Audience**: mobile
- **Used on**: `07-profile` (profile load)
- **Auth**: USER
- **Idempotent**: Yes
- **Audit-logged**: No
- **Response 200**: `{ "data": { "name": "...", "hospital": "...", "subscriptionPlan": "..." } }`

#### 1.9 `PATCH /users/profile`
- **Audience**: mobile
- **Used on**: `07-profile` (edit profile submit)
- **Auth**: USER
- **Idempotent**: No
- **Audit-logged**: No
- **Request**: `{ "name": "...", "hospital": "...", "profilePicture": "..." }`
- **Response 200**: `{ "data": { ...updated profile... } }`

#### 1.10 `GET /admin/users`
- **Audience**: admin
- **Used on**: `03-user-management` (user list load)
- **Auth**: SUPER_ADMIN
- **Idempotent**: Yes
- **Audit-logged**: No
- **Request**: `?page=1&limit=20&status=ACTIVE&searchTerm=...`
- **Response 200**: `{ "data": [...], "meta": { "total": ... } }`

#### 1.11 `PATCH /admin/users/:userId`
- **Audience**: admin
- **Used on**: `03-user-management` (status/role toggles)
- **Auth**: SUPER_ADMIN
- **Idempotent**: No
- **Audit-logged**: Yes
- **Request**: `{ "status": "RESTRICTED", "reason": "..." }`
- **Response 200**: `{ "data": { ... } }`
- > **Why PATCH + body for state changes**: `PATCH /admin/users/:id { status: "RESTRICTED" }` is RESTful for partial resource updates. Avoid verb-paths like `POST /admin/users/:id/suspend`.

#### 1.12 `POST /admin/users/:userId/force-logout`
- **Audience**: admin
- **Used on**: `03-user-management` (row action)
- **Auth**: SUPER_ADMIN
- **Idempotent**: No
- **Audit-logged**: Yes
- **Response 200**: `{ "message": "User sessions invalidated." }`
- > **Why POST for force-logout**: This is a non-CRUD action with side effects (bumping `tokenVersion`), so POST is appropriate.

#### 1.13 `DELETE /admin/users/:userId`
- **Audience**: admin
- **Used on**: `03-user-management` (row delete)
- **Auth**: SUPER_ADMIN
- **Idempotent**: Yes
- **Audit-logged**: Yes
- **Response 204**: Empty body.

---

### Module: `preference-cards`

#### 1.14 `GET /preference-cards`
- **Audience**: both
- **Used on**:
  - Mobile: `02-home` (All Cards / My Cards tabs), `05-library` (search/filter list)
  - Dashboard: `04-preference-card-management` (moderation list)
- **Auth**: USER | SUPER_ADMIN
- **Idempotent**: Yes
- **Audit-logged**: No
- **Request**: `?visibility=public|private&verificationStatus=VERIFIED&cursor=...`
- **Response 200**: `{ "data": [...], "meta": { "nextCursor": "..." } }`
- > **Why one shared path**: The core resource is the same. The server scopes the response based on the role and `visibility` param. Free users get a 402/403 if they query `visibility=public`.

#### 1.15 `GET /preference-cards/:cardId`
- **Audience**: both
- **Used on**:
  - Mobile: `03-preference-card-details` (card load)
  - Dashboard: `04-preference-card-management` (slide-over panel)
- **Auth**: USER | SUPER_ADMIN
- **Idempotent**: Yes
- **Audit-logged**: No
- **Response 200**: `{ "data": { ...card details..., "availableActions": ["edit", "delete", "favorite"] } }`

#### 1.16 `POST /preference-cards`
- **Audience**: mobile
- **Used on**: `04-create-preference-card` (publish/draft submit)
- **Auth**: USER
- **Idempotent**: No
- **Audit-logged**: No
- **Request**: `{ "cardTitle": "...", "published": true, "supplies": [...], ... }`
- **Response 201**: `{ "data": { ... } }`
- **Errors**: 403 (Card limit reached), 422.

#### 1.17 `PATCH /preference-cards/:cardId`
- **Audience**: both
- **Used on**:
  - Mobile: `04-create-preference-card` (edit mode submit)
  - Dashboard: `04-preference-card-management` (verify/reject actions)
- **Auth**: USER | SUPER_ADMIN
- **Idempotent**: No
- **Audit-logged**: Yes (if by admin)
- **Request**: `{ "cardTitle": "..." }` OR (if admin) `{ "verificationStatus": "VERIFIED" }`
- **Response 200**: `{ "data": { ... } }`

#### 1.18 `DELETE /preference-cards/:cardId`
- **Audience**: both
- **Used on**:
  - Mobile: `03-preference-card-details` (delete action)
  - Dashboard: `04-preference-card-management` (delete action)
- **Auth**: USER | SUPER_ADMIN
- **Idempotent**: Yes
- **Audit-logged**: Yes (if by admin)
- **Response 204**: Empty body.

#### 1.19 `POST /preference-cards/:cardId/favorite`
- **Audience**: mobile
- **Used on**: `02-home` (favorite toggle), `03-preference-card-details` (favorite toggle), `05-library` (list favorite toggle)
- **Auth**: USER
- **Idempotent**: No
- **Audit-logged**: No
- **Response 200**: `{ "data": { "isFavorite": true } }`
- > **Why POST**: Toggling a relational state (user -> card favorite) is a non-idempotent action.

#### 1.20 `POST /preference-cards/:cardId/download`
- **Audience**: mobile
- **Used on**: `03-preference-card-details` (download action), `05-library` (list download action)
- **Auth**: USER
- **Idempotent**: No
- **Audit-logged**: No
- **Response 200**: `{ "success": true }`
- > **Why POST**: It doesn't fetch file bytes (client generates the PDF); it triggers an analytics counter increment on the server.

#### 1.21 `GET /preference-cards/specialties`
- **Audience**: both
- **Used on**:
  - Mobile: `05-library` (filter bottom sheet)
  - Dashboard: `04-preference-card-management` (filter dropdown)
- **Auth**: USER | SUPER_ADMIN
- **Idempotent**: Yes
- **Audit-logged**: No
- **Response 200**: `{ "data": ["General Surgery", "Orthopedics", ...] }`

---

### Module: `events` (Calendar)

#### 1.22 `GET /events`
- **Audience**: mobile
- **Used on**: `06-calendar` (calendar month/day load)
- **Auth**: USER
- **Idempotent**: Yes
- **Audit-logged**: No
- **Request**: `?startDate=2026-05-01&endDate=2026-05-31`
- **Response 200**: `{ "data": [...] }`
- **Errors**: 402/403 (Plan required).

#### 1.23 `POST /events`
- **Audience**: mobile
- **Used on**: `06-calendar` (create event submit)
- **Auth**: USER
- **Idempotent**: No
- **Audit-logged**: No
- **Request**: `{ "title": "...", "date": "...", "duration": 60, "eventType": "surgery" }`
- **Response 201**: `{ "data": { ... } }`
- **Errors**: 402/403 (Plan required).

#### 1.24 `GET /events/:eventId`
- **Audience**: mobile
- **Used on**: `06-calendar` (event details load)
- **Auth**: USER
- **Idempotent**: Yes
- **Audit-logged**: No
- **Response 200**: `{ "data": { ... } }`

#### 1.25 `PATCH /events/:eventId`
- **Audience**: mobile
- **Used on**: `06-calendar` (edit event submit)
- **Auth**: USER
- **Idempotent**: No
- **Audit-logged**: No
- **Response 200**: `{ "data": { ... } }`

#### 1.26 `DELETE /events/:eventId`
- **Audience**: mobile
- **Used on**: `06-calendar` (delete event action)
- **Auth**: USER
- **Idempotent**: Yes
- **Audit-logged**: No
- **Response 204**: Empty body.

---

### Module: `notifications`

#### 1.27 `GET /notifications`
- **Audience**: mobile
- **Used on**: `08-notifications` (list load / refresh)
- **Auth**: USER
- **Idempotent**: Yes
- **Audit-logged**: No
- **Response 200**: `{ "data": [...], "meta": { "unreadCount": 3 } }`

#### 1.28 `PATCH /notifications/:notificationId/read`
- **Audience**: mobile
- **Used on**: `08-notifications` (tap to read)
- **Auth**: USER
- **Idempotent**: No
- **Audit-logged**: No
- **Response 200**: `{ "success": true }`

#### 1.29 `PATCH /notifications/read-all`
- **Audience**: mobile
- **Used on**: `08-notifications` (mark all read)
- **Auth**: USER
- **Idempotent**: No
- **Audit-logged**: No
- **Response 200**: `{ "success": true }`

#### 1.30 `DELETE /notifications/:notificationId`
- **Audience**: mobile
- **Used on**: `08-notifications` (swipe delete)
- **Auth**: USER
- **Idempotent**: Yes
- **Audit-logged**: No
- **Response 204**: Empty body.

---

### Module: `catalogs` (Supplies & Sutures)

#### 1.31 `GET /supplies`
- **Audience**: both
- **Used on**:
  - Mobile: `04-create-preference-card` (typeahead search)
  - Dashboard: `06-supplies-management` (list load)
- **Auth**: USER | SUPER_ADMIN
- **Idempotent**: Yes
- **Audit-logged**: No
- **Request**: `?searchTerm=...`
- **Response 200**: `{ "data": [...] }`

#### 1.32 `POST /admin/supplies`
- **Audience**: admin
- **Used on**: `06-supplies-management` (create single)
- **Auth**: SUPER_ADMIN
- **Idempotent**: No
- **Audit-logged**: Yes
- **Request**: `{ "name": "..." }`
- **Response 201**: `{ "data": { ... } }`

#### 1.33 `PATCH /admin/supplies/:supplyId`
- **Audience**: admin
- **Used on**: `06-supplies-management` (edit name)
- **Auth**: SUPER_ADMIN
- **Idempotent**: No
- **Audit-logged**: Yes
- **Request**: `{ "name": "..." }`
- **Response 200**: `{ "data": { ... } }`

#### 1.34 `DELETE /admin/supplies/:supplyId`
- **Audience**: admin
- **Used on**: `06-supplies-management` (delete action)
- **Auth**: SUPER_ADMIN
- **Idempotent**: Yes
- **Audit-logged**: Yes
- **Response 204**: Empty body.

#### 1.35 `GET /sutures`
- **Audience**: both
- **Used on**:
  - Mobile: `04-create-preference-card` (typeahead search)
  - Dashboard: `07-sutures-management` (list load)
- **Auth**: USER | SUPER_ADMIN
- **Idempotent**: Yes
- **Audit-logged**: No
- **Response 200**: `{ "data": [...] }`

#### 1.36 `POST /admin/sutures`
- **Audience**: admin
- **Used on**: `07-sutures-management` (create single)
- **Auth**: SUPER_ADMIN
- **Idempotent**: No
- **Audit-logged**: Yes
- **Request**: `{ "name": "..." }`
- **Response 201**: `{ "data": { ... } }`

#### 1.37 `PATCH /admin/sutures/:sutureId`
- **Audience**: admin
- **Used on**: `07-sutures-management` (edit name)
- **Auth**: SUPER_ADMIN
- **Idempotent**: No
- **Audit-logged**: Yes
- **Request**: `{ "name": "..." }`
- **Response 200**: `{ "data": { ... } }`

#### 1.38 `DELETE /admin/sutures/:sutureId`
- **Audience**: admin
- **Used on**: `07-sutures-management` (delete action)
- **Auth**: SUPER_ADMIN
- **Idempotent**: Yes
- **Audit-logged**: Yes
- **Response 204**: Empty body.

---

### Module: `subscriptions`

#### 1.39 `GET /subscriptions/me`
- **Audience**: mobile
- **Used on**: `07-profile` (subscription status load)
- **Auth**: USER
- **Idempotent**: Yes
- **Audit-logged**: No
- **Response 200**: `{ "data": { "plan": "FREE", "expiresAt": null } }`
- > **Why 200 for FREE users**: Returning 404 for a user with no paid plan creates messy client error handling. Returning a 200 with `plan: "FREE"` provides a stable state.

#### 1.40 `POST /subscriptions/verify-receipt`
- **Audience**: mobile
- **Used on**: `07-profile` (restore purchase submit)
- **Auth**: USER
- **Idempotent**: No
- **Audit-logged**: No
- **Request**: `{ "platform": "ios", "receipt": "..." }`
- **Response 200**: `{ "data": { "plan": "PREMIUM", "expiresAt": "..." } }`

#### 1.41 `PATCH /admin/subscriptions/:subscriptionId/manual-grant`
- **Audience**: admin
- **Used on**: `03-user-management` (grant plan modal)
- **Auth**: SUPER_ADMIN
- **Idempotent**: No
- **Audit-logged**: Yes
- **Request**: `{ "plan": "ENTERPRISE", "expiresAt": "...", "reason": "..." }`
- **Response 200**: `{ "data": { ... } }`

---

## 2. Endpoint × Screen Matrix

| # | Endpoint | 01-auth (M) | 02-home (M) | 03-card (M) | 04-create (M) | 05-library (M) | 06-calendar (M) | 07-profile (M) | 08-notif (M) | 01-auth (D) | 02-overview (D) | 03-user (D) | 04-card (D) | 06-supplies (D) | 07-sutures (D) |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1.2 | POST /auth/login | ✅ | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| 1.4 | POST /auth/refresh | ✅ | — | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| 1.14 | GET /cards | — | ✅ | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — |
| 1.15 | GET /cards/:id | — | — | ✅ | — | — | — | — | — | — | — | — | ✅ | — | — |
| 1.17 | PATCH /cards/:id | — | — | — | ✅ | — | — | — | — | — | — | — | ✅ | — | — |
| 1.18 | DELETE /cards/:id | — | — | ✅ | — | — | — | — | — | — | — | — | ✅ | — | — |
| 1.19 | POST /.../favorite| — | ✅ | ✅ | — | ✅ | — | — | — | — | — | — | — | — | — |
| 1.31 | GET /supplies | — | — | — | ✅ | — | — | — | — | — | — | — | — | ✅ | — |
| 1.35 | GET /sutures | — | — | — | ✅ | — | — | — | — | — | — | — | — | — | ✅ |

### 2.1 Hotspots, orphans, lonely screens

- **Hotspots**:
  - `GET /preference-cards` — used on `02-home`, `05-library`, `04-preference-card-management`. Implications: changes to the list payload affect global search, personal feeds, and admin dashboards simultaneously.
  - `POST /preference-cards/:cardId/favorite` — used on `02-home`, `03-card-details`, `05-library`. Implications: standardizing the response shape is critical since multiple diverse views rely on the return state to update UI toggles.

---

## 3. Resource Model Cheat-Sheet

| Resource | Identifier | Base path | Audiences | Used on | Collection (GET) | Create (POST) | Get one (GET) | Update (PATCH) | Delete (DELETE) | Sub-resources |
|---|---|---|---|---|---|---|---|---|---|---|
| User | userId | `/users` | both | `01-auth`, `07-profile`, `03-user-management` | ✅ admin only (`/admin/users`) | ✅ public (signup) | ✅ self / admin | ✅ self / admin | ✅ admin (soft) | `/users/profile` |
| Preference Card | cardId | `/preference-cards` | both | `02-home`, `03-card-details`, `04-create-card`, `05-library`, `04-preference-card-management` | ✅ role-scoped + plan-gated | ✅ USER | ✅ visible-to-role | ✅ owner OR SUPER_ADMIN | ✅ owner OR SUPER_ADMIN | `/preference-cards/:cardId/favorite`, `/download` |
| Event | eventId | `/events` | mobile | `06-calendar` | ✅ owner only | ✅ owner only | ✅ owner only | ✅ owner only | ✅ owner only | — |
| Supply | supplyId | `/supplies` | both | `04-create-card`, `06-supplies-management` | ✅ public/auth | ✅ admin only | ✅ admin | ✅ admin | ✅ admin | `/admin/supplies/:supplyId/merge` |
| Suture | sutureId | `/sutures` | both | `04-create-card`, `07-sutures-management` | ✅ public/auth | ✅ admin only | ✅ admin | ✅ admin | ✅ admin | `/admin/sutures/:sutureId/merge` |
| Notification | id | `/notifications` | mobile | `08-notifications` | ✅ owner only | ❌ system-generated | ❌ list-only | ✅ owner (read) | ✅ owner | `/notifications/read-all` |
| Subscription | id | `/subscriptions` | both | `07-profile`, `03-user-management` | ✅ admin only | ✅ USER (`verify-receipt`) | ✅ self (`/me`) | ✅ admin (`manual-grant`) | ❌ no delete | — |

---

## 4. RESTful Compliance Audit (12 commandments)

| # | Endpoint | Plural-noun path | Meaningful path param | Correct verb | Correct status code | No mirrored verb | Idempotency contract | Notes |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 | POST /auth/login | ✅ | N/A | ✅ | ✅ 200 | ✅ | N/A (session) | — |
| 2 | POST /preference-cards | ✅ | N/A | ✅ | ✅ 201 | ✅ | ✅ TTL Index | Uses `Idempotency-Key` |
| 3 | PATCH /admin/users/:userId | ✅ | ✅ | ✅ | ✅ 200 | ✅ | N/A | Modifies state, avoids `POST /suspend` |
| 4 | POST /admin/users/:userId/force-logout | ✅ | ✅ | ✅ | ✅ 200 | ✅ | N/A | Side-effect action |

All endpoints comply with REST commandments. State changes are handled via `PATCH` with payloads, and side-effect actions use `POST`.

---

## 5. Mentor Notes — Top 10 Decisions Explained

### 5.1 Why URI versioning (`/v1/`) over header versioning
Versioning in the URI is cache-friendly and perfectly discoverable from logs without deep inspection of HTTP headers. It requires zero configuration on the mobile client. Trade-off: Every major breaking change requires a new prefix, but for a mobile app backend, this is standard. *Citation: Google AIP-180.*

### 5.2 Why cursor pagination for hot mobile lists, page-based for admin tables
Cursor pagination (`?cursor=...`) on the mobile Notifications and Library views prevents list drifting. When a new card is added, a page-based query (`?page=2`) shifts the items, causing the client to see duplicates or miss items. Admin tables, however, are heavily sorted and bounded (ad-hoc queries by name or date) where page numbers (`total` and `page`) provide the exact location within the dataset.

### 5.3 Why `PATCH /users/:userId { status: "RESTRICTED" }` instead of `POST /users/:userId/activate`
The REST standard demands that resource modifications use `PATCH` or `PUT`. A user's status is just a property on the User document. `PATCH /users/:userId` elegantly handles status updates, role changes, or metadata modifications without creating a sprawling RPC-style URL structure like `/suspend`, `/activate`, `/promote`.

### 5.4 Why one base path with role-scoped responses for shared resources
`GET /preference-cards` handles both public library queries and the user's "My Cards" queries. Doing this avoids splitting into `/my-preference-cards` and `/admin/preference-cards`. The underlying MongoDB query applies a filter based on the requester's `role` and the `visibility` query param. It enforces access logic centrally.

### 5.5 Why `/admin/` prefix only for admin-exclusive operations
Admin actions that have no parallel in the user application (e.g. `GET /admin/users`, `POST /admin/supplies`) are placed under `/admin/` so that RBAC middleware can blanket-protect the namespace. Shared resources don't get this prefix because the data identity is the same regardless of who accesses it.

### 5.6 Why plan gating returns 402/403 with `code: PLAN_REQUIRED`
When a free user accesses `/events`, returning a 403 `PLAN_REQUIRED` gives the mobile client a highly specific machine-readable trigger to open the upgrade paywall modal. Relying on a 404 would be inaccurate, and a 401 is strictly for unauthenticated users.

### 5.7 Why soft-delete for users and cards
`DELETE /admin/users/:userId` does not physically drop the MongoDB row; it sets `status: DELETED`. Hard-deleting immediately breaks referential integrity (e.g. audit logs point to nowhere, cards lose their author). A background cron job handles permanent purging after 30 days.

### 5.8 Why `tokenVersion` for global logout
When an admin invokes `force-logout`, keeping a Redis blacklist of JWTs is expensive. By incrementing a `tokenVersion` integer on the `User` document, and requiring the JWT payload to match that version, all previously issued JWTs become instantly invalid across all devices with zero extra infrastructure.

### 5.9 Why unread notification count is delivered in `meta`
Instead of a separate `GET /notifications/unread-count`, attaching `meta: { unreadCount: N }` to the `GET /notifications` list response provides the data exactly when the client needs to render the bell icon dot, eliminating an N+1 query problem on app startup.

### 5.10 Why the legal CMS uses immutable versioning
Every time an admin updates the Terms or Privacy Policy, a new row is created. Legal agreements carry liability; if a user sues over an event from 2025, the platform must produce the exact Terms they agreed to at that time. Mutable single-row storage destroys this audit trail.

---

## 6. Architectural Brainstorming

### 6.1 Single unified API vs separate admin / mobile APIs
- **Considered**: Standalone API for admin dashboard vs Unified API.
- **Chosen**: Unified API (`/v1`).
- **Trade-offs**: A single API ensures the Mongoose schemas and core business logic (like what makes a preference card valid) are never duplicated. However, it requires careful RBAC middleware and role-scoped projections so mobile users don't see admin fields.
- **Citation**: GitHub REST API merges admin/user actions under same entities.

### 6.2 Real-time channel for notifications: WebSocket vs FCM Push
- **Considered**: Socket.IO vs Firebase Cloud Messaging (FCM).
- **Chosen**: FCM Data Messages.
- **Trade-offs**: FCM provides offline queuing and background wake-ups for mobile, whereas WebSockets only work while the app is foregrounded and consume more server resources to hold connections open.

### 6.3 Pagination style trade-off per endpoint family
- **Considered**: Globally enforcing page-based pagination.
- **Chosen**: Hybrid approach (Cursor for mobile feeds, Page-based for admin tables).
- **Trade-offs**: It increases complexity in the Mongoose repository layer (needs two pagination plugins), but perfectly matches the UX constraints of each surface (infinite scroll vs precise data table jumping).

---

> **No open API design questions remain — design is locked and ready for module-level specs.** Every endpoint, status code, auth contract, and idempotency rule above is grounded in the source UX docs. Move to the API Module generator.
