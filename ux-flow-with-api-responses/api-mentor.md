# API Design & Mentor Notes

> **Generated from** (folder: `app-screens/`):
> - `01-auth.md` — Mobile auth: register, login, OTP verify, social login (Google / Apple), forgot / reset password, refresh token rotation, logout. Devices endpoint sketched (Q2 resolved, not yet in modules).
> - `02-home.md` — Home screen: stats counts, favorite-cards horizontal carousel, "All Cards / My Cards" tabs (mapped to `?visibility=public|private`), search & discovery, quick-create FAB.
> - `03-preference-card-details.md` — Card details: read full record, favorite toggle, share (frontend-only), download (counter-only — client renders PDF locally).
> - `04-create-preference-card.md` — Card creation form: parallel catalog fetch (supplies + sutures), supply / suture custom-add typeahead, photo upload (multipart, max 5), draft / publish CTAs.
> - `05-library.md` — Global search over public preference cards (no tabs — paid feature). Filters (specialty + verified-only), sort, list actions (favorite, download).
> - `06-calendar.md` — Calendar view: month range fetch, date selection, event CRUD, automatic 24 h + 1 h reminders, structured event fields including `personnel: Array<{name, role}>` and `linkedPreferenceCard`.
> - `07-profile.md` — Profile: read / edit profile, subscription read state, IAP upgrade flow, restore purchases, legal page reader, logout.
> - `08-notifications.md` — Notifications: bell + red-dot from `meta.unreadCount`, list pagination, deep-link by `type`, mark single / mark-all read, swipe-to-delete, real-time socket sync.
>
> **Plus cross-cutting**: `system-concepts.md` (canonical envelope, status mapping, roles, common UI rules), `overview.md` (Decisions Log D1–D13 — visibility, plan-gating, IAP flow, verification eligibility, etc.), `modules/*.md` (existing canonical API specs for each backend module).
>
> **Date**: 2026-04-30
> **Scope**: REST API for a medical preference-card platform with two consumers (Flutter mobile app for `USER`, web dashboard for `SUPER_ADMIN`) sharing one backend.
> **Stack assumed**: TypeScript + Express + MongoDB (Mongoose) + Socket.IO + FCM + Apple/Google IAP, per `overview.md §2`.

---

## 0. Conventions & Cross-Cutting

### 0.1 Base URL & versioning

- `{{baseUrl}}` = `https://api.tbsosick.com/api/v1` (production), `https://staging-api.tbsosick.com/api/v1` (staging), `http://localhost:5000/api/v1` (local). Per `system-concepts.md § Base URL & Environment`.
- All endpoints mounted under `/api/v1`.

> **Why URI versioning** (`/v1/`) over header / query versioning: cache-friendly (intermediate proxies key on URL); discoverable from access logs; requires no client header config; the version is implicit in every Postman / curl example. Trade-off: every breaking change forces a `/v2/` prefix and migration. Alternative (header `Accept: application/vnd.tbsosick.v1+json`) hides the version in something proxies don't see and clients often forget to set. *Citation: Google AIP-180.*

### 0.2 Response envelope

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human-readable description",
  "data": { /* endpoint-specific */ },
  "meta": { /* pagination, plus domain-specific keys like unreadCount */ }
}
```

> **Why this envelope**: stable shape across endpoints simplifies client deserialization (the mobile app has one generic `ApiResponse<T>` deserializer). `statusCode` mirrors the HTTP code so logs are scannable without joining body + status. `meta` carries pagination + rate-limit-style hints without polluting `data`. Trade-off: doubles payload bytes on small responses vs returning bare data. Alternative (raw response): cleaner but every client has to inspect status and pick a different parse path on errors. *Citation: in-house pragmatic; see `system-concepts.md § Standard Response Envelope`.*

### 0.3 Error envelope

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errorMessages": [
    { "path": "email", "message": "Invalid email address." }
  ],
  "data": null
}
```

> **Why machine-readable per-field errors** (`errorMessages[]` with `path`): clients render inline errors under the right field without parsing the human `message`. RFC 7807 (`application/problem+json`) is the open standard alternative — adopt it if interop with strict consumers (e.g. external partners) becomes a goal; this in-house envelope wins for closed-loop apps because it reuses the success envelope's shape.

### 0.4 Pagination

- **Default in v1**: page-based — `?page=1&limit=20`. Response `meta`: `{ page, limit, total, totalPages, hasNext, hasPrev }`. Per `system-concepts.md § Standard Response Envelope`.
- **Hot lists to migrate to cursor in v2**: `GET /preference-cards`, `GET /notifications` — high-frequency reads that may drift under inserts.

> **Why page-based now**: simpler for admin tables (`/users`, `/preference-cards` admin moderation) where total count + jump-to-page UX matters. Cursor pagination is stable under inserts (page 2 doesn't shift when new records arrive between page 1 and page 2 fetches) and cheaper on indexed columns. Trade-off: opaque cursors aren't client-constructable, which complicates "jump to page N" UX. Recommendation: keep page-based for admin and migrate user-facing hot lists to cursor when total grows past ~10k rows. *Citation: Stripe API guidelines § List endpoints.*

### 0.5 Auth

- **User sessions**: JWT access token (**15 min**) + refresh token (**30 days**, rotated on every use). Mobile reads tokens from response body + persists to SecureStorage; web (dashboard) reads `httpOnly` cookie. Per `01-auth.md § Storage & Session` + Q5 decision.
- **Refresh-token reuse detection**: `tokenVersion` on the user record. Reset / logout / refresh-failure increments it; any refresh request with a stale `tokenVersion` force-logs-out the user.
- **Roles**: `Public`, `USER`, `SUPER_ADMIN`. Per `system-concepts.md § User Roles`.
- **Plan gate** (separate from role gate): subscription tier check on paid features (library, calendar, card-count ceiling, verification eligibility). Per `overview.md §8` + `§9`.

> **Why short-lived access + rotating refresh**: limits blast radius if an access token leaks (max 15-min exposure) without forcing the user to log in every session. Rotation + reuse-detection turns refresh-token theft into a self-defeating attack (the legitimate client immediately notices and force-logs-out). `httpOnly` cookie defends the web refresh against XSS exfiltration; mobile uses SecureStorage for the same reason. Trade-off: 15-min access TTL means the app must implement proactive refresh (at `TTL - 60s`) to avoid user-visible 401 then-retry flicker. *Citation: OAuth 2.1 draft (BCP 195) + `01-auth.md § Token Refresh (Background)`.*

### 0.6 Idempotency

- **Idempotent verbs** (GET / PUT / DELETE / PATCH-as-partial-update of stable fields): safe to retry blindly.
- **Non-idempotent POSTs that need an `Idempotency-Key`**: `POST /preference-cards`, `POST /events`, `POST /subscriptions/verify-receipt`. Key = UUID v4 sent by the client; server stores `(userId, key) → response` for 24 h and replays on retry.
- **Currently NOT implemented**: see Open Questions Q1.

> **Why mandatory for create-resource and verify-receipt**: client retries on 5xx / network drops are inevitable on mobile. Without keys, retries cause duplicate cards, duplicate events, and (worst case) double-charge effects on receipt-verify if the response was lost. The server keys on `(userId, key)` so two different users can't collide. Trade-off: 24-h key retention adds storage cost. Alternative (deterministic keys derived from request hash) breaks when intentional duplicate creates are valid. *Citation: Stripe API § Idempotent requests; Twilio § Idempotency.*

### 0.7 Rate limits

- **Default**: 100 req / min per authenticated user (token-bucket).
- **Stricter buckets** (already in code per `preference-card.route.ts`): `GET /preference-cards` search 60/min, `POST /preference-cards/:cardId/download` 20/min.
- **Auth bucket** (recommended): `/auth/*` 5 req / min per IP.
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` on every response. On 429 also `Retry-After` (seconds).

> **Why token-bucket + per-route overrides**: hot endpoints (search, download, login-attempt brute-force) need tighter limits than cold endpoints (read profile). Returning the rate-limit headers on success too lets clients self-throttle before hitting 429. *Citation: GitHub REST § Rate limiting; RFC 6585 (Retry-After).*

### 0.8 Cacheability

- Apply `ETag` + `Cache-Control: private, max-age=60` to: `GET /legal`, `GET /legal/:slug`, `GET /preference-cards/specialties`. These are low-volatility shared resources.
- Mutable / personalized resources (`GET /users/profile`, `GET /preference-cards/stats`, `GET /notifications`): no cache, `Cache-Control: no-store`.
- Currently NOT implemented — see Open Questions Q2.

> **Why ETag for legal pages**: legal slugs change rarely (months between revisions) but every app launch re-fetches them. `If-None-Match` → 304 saves the round-trip body. Trade-off: server has to compute the ETag (typically `md5(body)`); negligible cost for small documents. *Citation: RFC 7232 § Conditional requests.*

### 0.9 Status code policy

| Verb | Success | Common errors |
|---|---|---|
| GET | 200, 304 | 401, 403, 404, 429 |
| POST (create) | 201 + `Location` | 400, 401, 403, 409, 422, 429 |
| POST (action — login, refresh, verify-receipt, download-counter) | 200 / 202 | 400, 401, 403, 404, 409, 422, 429 |
| PATCH (partial update) | 200 | 400, 401, 403, 404, 409, 422 |
| PUT (idempotent set / replace) | 200 / 204 | 400, 401, 403, 404, 422 |
| DELETE | 200 / 204 | 401, 403, 404, 409 |

> Project currently returns `200` for some create-actions (e.g. `POST /preference-cards/:cardId/download`) where `202 Accepted` would be technically more accurate (the side effect is recorded but the response body is informational, not the created resource). 200 is fine here because the operation is synchronous + the body is stable. Don't over-correct. *Citation: RFC 7231 § 6.3.*

---

## 1. Endpoint Inventory (grouped by module)

> Tight inventory: endpoint + auth + status codes + 1-line "why this shape" per entry. Full request / response specs live in `modules/<name>.md`. Each row links to the canonical module entry.

### Module: `auth`

| # | Method | Endpoint | Auth | Idempotent | Spec |
|---|---|---|---|:---:|---|
| 1.1 | POST | `/auth/login` | Public | No | [auth.md#11-login](./modules/auth.md#11-login) |
| 1.2 | POST | `/auth/verify-otp` | Public | No (atomic) | [auth.md#12-verify-otp](./modules/auth.md#12-verify-otp) |
| 1.3 | POST | `/auth/forgot-password` | Public | Effectively yes (silent-success) | [auth.md#13-forgot-password](./modules/auth.md#13-forgot-password) |
| 1.4 | POST | `/auth/reset-password` | Reset Token | No (consumes token) | [auth.md#14-reset-password](./modules/auth.md#14-reset-password) |
| 1.5 | POST | `/auth/refresh-token` | Refresh Token | No (rotates) | [auth.md#15-refresh-token](./modules/auth.md#15-refresh-token) |
| 1.6 | POST | `/auth/logout` | Bearer | Yes | [auth.md#16-logout](./modules/auth.md#16-logout) |
| 1.7 | POST | `/auth/resend-verify-email` | Public | No (rate-limited) | [auth.md#17-resend-otp-resend-verify-email](./modules/auth.md#17-resend-otp-resend-verify-email) |
| 1.8 | POST | `/auth/social-login` | Public | No | [auth.md#18-social-login-google--apple](./modules/auth.md#18-social-login-google--apple) |
| 1.9 | POST | `/auth/change-password` | Bearer | No (consumes / rotates) | [auth.md#19-change-password](./modules/auth.md#19-change-password) |

> **Why all auth ops are POST** — even refresh / logout, which feel like state queries: they all create or invalidate sessions, mutate `tokenVersion` server-side, or set tokens. POST is the only verb whose body is conventionally NOT logged in proxies / referrer chains, which matters for credentials. Alternative (GET refresh): tokens-in-URL leak via every layer of HTTP plumbing. Rejected.

> **Why generic 401 for both bad password AND missing user on `/auth/login`**: prevents email enumeration. An attacker timing the response ("user exists" vs "user doesn't exist") shouldn't get different copy. Trade-off: legitimate users get a slightly less helpful error message. *Citation: OWASP ASVS § V2.1.*

### Module: `users`

| # | Method | Endpoint | Auth | Idempotent | Spec |
|---|---|---|---|:---:|---|
| 2.1 | POST | `/users` | Public (signup) / `SUPER_ADMIN` (admin-create) | No | [user.md#21-create-user-registration--admin-create](./modules/user.md#21-create-user-registration--admin-create) |
| 2.2 | GET | `/users` | `SUPER_ADMIN` | Yes | [user.md#22-getsearch-users-doctors](./modules/user.md#22-getsearch-users-doctors) |
| 2.3 | GET | `/users/stats` | `SUPER_ADMIN` | Yes | [user.md#23-user-stats-overview-cards](./modules/user.md#23-user-stats-overview-cards) |
| 2.4 | PATCH | `/users/:userId` | `SUPER_ADMIN` | Yes (partial set) | [user.md#24-update-user-admin](./modules/user.md#24-update-user-admin) |
| 2.5 | DELETE | `/users/:userId` | `SUPER_ADMIN` | Yes | [user.md#25-delete-user-admin](./modules/user.md#25-delete-user-admin) |
| 2.6 | GET | `/users/profile` | Bearer (self) | Yes | [user.md#26-get-profile](./modules/user.md#26-get-profile) |
| 2.7 | PATCH | `/users/profile` | Bearer (self) | Yes | [user.md#27-update-profile](./modules/user.md#27-update-profile) |
| 2.8 | GET | `/users/me/favorites` | Bearer | Yes | [user.md#28-list-favorite-cards](./modules/user.md#28-list-favorite-cards) |

> **Why `/users/profile` and `/users/me/favorites` use the `me` alias** instead of explicit `:userId`: the "current user" identifier is implied by the access token; making the client repeat their own ID in the URL is redundant and a footgun (a copy-paste of an admin endpoint with another user's ID could leak data if the auth gate fails). `/me` is industry idiom (Stripe `/v1/account`, GitHub `/user`). Trade-off: the `me` segment is a magic value the URL doesn't validate as a real ID — caught only by the auth middleware. *Citation: Stripe `/v1/account`, GitHub `/user`.*

> **Why `POST /users` is shared between public signup and admin-create**: the body shape is identical (name, email, password, role). The role gate decides whether `role` field in the body is accepted. Alternative (`POST /admin/users`): cleaner separation but duplicates the validator and the model. The current design is justified IF the validation explicitly rejects `role` from the public path — which the project's Zod schema does. *Citation: in-house pragmatic.*

### Module: `preference-cards`

| # | Method | Endpoint | Auth | Idempotent | Spec |
|---|---|---|---|:---:|---|
| 3.1 | GET | `/preference-cards?visibility=public\|private` | Bearer | Yes | [preference-card.md#31-listsearch-preference-cards](./modules/preference-card.md#31-listsearch-preference-cards) |
| 3.2 | GET | `/preference-cards/stats` | Bearer | Yes | [preference-card.md#32-get-cards-stats](./modules/preference-card.md#32-get-cards-stats) |
| 3.3 | GET | `/preference-cards/specialties` | Bearer | Yes (cacheable) | [preference-card.md#33-fetch-distinct-specialties](./modules/preference-card.md#33-fetch-distinct-specialties) |
| 3.4 | POST | `/preference-cards` | Bearer | No (needs `Idempotency-Key`) | [preference-card.md#34-create-preference-card](./modules/preference-card.md#34-create-preference-card) |
| 3.5 | GET | `/preference-cards/:cardId` | Bearer | Yes | [preference-card.md#35-get-card-details](./modules/preference-card.md#35-get-card-details) |
| 3.6 | PATCH | `/preference-cards/:cardId` | Bearer (owner / admin) | Yes (partial set) | [preference-card.md#36-update-preference-card](./modules/preference-card.md#36-update-preference-card) |
| 3.7 | DELETE | `/preference-cards/:cardId` | Bearer (owner / admin) | Yes | [preference-card.md#37-delete-preference-card](./modules/preference-card.md#37-delete-preference-card) |
| 3.8 | PUT | `/preference-cards/favorites/cards/:cardId` | Bearer | Yes | [preference-card.md#38-favorite-a-card](./modules/preference-card.md#38-favorite-a-card) |
| 3.9 | DELETE | `/preference-cards/favorites/cards/:cardId` | Bearer | Yes | [preference-card.md#39-unfavorite-a-card](./modules/preference-card.md#39-unfavorite-a-card) |
| 3.10 | POST | `/preference-cards/:cardId/download` | Bearer | No (counter increments) | [preference-card.md#310-increment-download-count](./modules/preference-card.md#310-increment-download-count) |
| 3.11 | PATCH | `/preference-cards/:cardId` (`{ verificationStatus }` body) | `SUPER_ADMIN` | Yes (set state) | [preference-card.md#311-update-verification-status-approvereject--admin](./modules/preference-card.md#311-update-verification-status-approvereject--admin) |

> **Why one `GET /preference-cards` endpoint with `?visibility=public|private`** instead of two routes (`/preference-cards/public` + `/preference-cards/my-cards`): a single endpoint with a query filter is the canonical REST list pattern (Stripe `/charges?customer=...`, GitHub `/repos?type=...`). Two routes duplicate the controller, the validator, the QueryBuilder, and the Used-By cross-link surface. Trade-off: the same endpoint changes its semantics based on a query param, which the docs must call out clearly. Decision Q1 from `overview.md`. *Citation: Stripe API style guide.*

> **Why `PUT` for favorites instead of `POST`**: favoriting is idempotent — calling `PUT /favorites/cards/:cardId` twice is the same as once (the user is favorited; no duplicate row). PUT signals this contract to clients + intermediaries. Trade-off: the URL `/preference-cards/favorites/cards/:cardId` has nested redundancy (could be flatter as `PUT /users/me/favorites/:cardId`). Current shape is locked because the favorites collection lives under the card resource conceptually (`who has favorited THIS card`). *Citation: RFC 7231 § 4.3.4 (PUT idempotent).*

> **Why `POST /:cardId/download` has a verb in the path**: this is a non-CRUD action with a side effect (`downloadCount++`) and no request body — there's no resource to PUT or PATCH. The idiomatic REST shape for "trigger an action on a resource" is `POST /resource/:id/action`. Alternative (`PATCH /:cardId { downloadCount: <prev>+1 }`): forces the client to know the previous count and creates a race. Rejected. *Citation: Stripe `POST /charges/:id/capture`.*

> **Why the verification status uses `PATCH /:cardId { verificationStatus }`** (D8) instead of mirrored `/approve` + `/reject` routes: verification is a state transition on the card resource. Adding a third state (e.g. `PENDING_REVIEW`) doesn't require a new route — just a new enum value. Mirrored verb routes (`POST /:cardId/approve`) violate the project rule "no mirrored verb routes" + don't compose. Trade-off: the same PATCH endpoint is now used by owners (to edit fields) and admins (to set state), which the role gate must enforce on a per-field basis. *Citation: `CLAUDE.md` Route Design Rules; Google AIP-216.*

### Module: `supplies`

| # | Method | Endpoint | Auth | Idempotent | Spec |
|---|---|---|---|:---:|---|
| 7.1 | GET | `/supplies` | Bearer | Yes | [supply.md#71-list-supplies](./modules/supply.md#71-list-supplies) |
| 7.2 | POST | `/supplies` | `SUPER_ADMIN` | No | [supply.md#72-create-supply](./modules/supply.md#72-create-supply) |
| 7.3 | POST | `/supplies/bulk` | `SUPER_ADMIN` | No (skips duplicates) | [supply.md#73-bulk-create-supplies](./modules/supply.md#73-bulk-create-supplies) |
| 7.4 | PATCH | `/supplies/:supplyId` | `SUPER_ADMIN` | Yes | [supply.md#74-update-supply](./modules/supply.md#74-update-supply) |
| 7.5 | DELETE | `/supplies/:supplyId` | `SUPER_ADMIN` | Yes | [supply.md#75-delete-supply](./modules/supply.md#75-delete-supply) |

### Module: `sutures`

Same shape as supplies, mounted at `/sutures`. See [suture.md](./modules/suture.md).

> **Why two near-identical modules** (`supplies` + `sutures`) instead of one polymorphic `/catalog?type=supply|suture`: domain-distinct master catalogs. Surgeons think of supplies and sutures as different categories; they have different attributes in v2 (sutures will gain `material`, `gauge`, `length`; supplies will gain `sterile`, `single-use`). Forcing them through one endpoint creates a bag of optional fields that don't apply to half the rows. *Citation: Domain-Driven Design § Bounded Contexts.*

> **Why `POST /supplies/bulk`** has a verb in the path: bulk-create is a non-CRUD action with different semantics than `POST /supplies` (it skips duplicates and returns a `{ createdCount, duplicates[] }` summary instead of a single created row). Idiomatic shape. Alternative (`POST /supplies` with array body): conflates two contracts under one route. *Citation: Google AIP-231 (Batch Methods).*

### Module: `events`

| # | Method | Endpoint | Auth | Idempotent | Spec |
|---|---|---|---|:---:|---|
| 4.1 | GET | `/events?from=...&to=...` | Bearer | Yes | [event.md#41-list-my-events](./modules/event.md#41-list-my-events) |
| 4.2 | POST | `/events` | Bearer | No (needs `Idempotency-Key`) | [event.md#42-create-event](./modules/event.md#42-create-event) |
| 4.3 | GET | `/events/:eventId` | Bearer (owner / admin) | Yes | [event.md#43-get-event-details](./modules/event.md#43-get-event-details) |
| 4.4 | PATCH | `/events/:eventId` | Bearer (owner / admin) | Yes (partial set) | [event.md#44-update-event](./modules/event.md#44-update-event) |
| 4.5 | DELETE | `/events/:eventId` | Bearer (owner / admin) | Yes | [event.md#45-delete-event](./modules/event.md#45-delete-event) |

> **Why `personnel: Array<{name, role}>`** instead of `Array<userId>`: per `overview.md` D6 — keeps v1 free of cross-user FK semantics (collaboration is out of scope). Free-text names + role labels match how a surgeon mentally lists their team. Migrate to `Array<userId>` in v2 if the team-collaboration feature ships. *Citation: in-house D6 decision.*

### Module: `notifications`

| # | Method | Endpoint | Auth | Idempotent | Spec |
|---|---|---|---|:---:|---|
| 5.1 | GET | `/notifications?page=...&limit=...` | Bearer | Yes | [notification.md#51-get-my-notifications](./modules/notification.md#51-get-my-notifications) |
| 5.2 | PATCH | `/notifications/:notificationId/read` | Bearer | Yes | [notification.md#52-mark-as-read](./modules/notification.md#52-mark-as-read) |
| 5.3 | PATCH | `/notifications/read-all` | Bearer | Yes | [notification.md#53-mark-all-as-read](./modules/notification.md#53-mark-all-as-read) |
| 5.4 | DELETE | `/notifications/:notificationId` | Bearer | Yes | [notification.md#54-delete-notification](./modules/notification.md#54-delete-notification) |

> **Why `meta.unreadCount` lives on the existing list response** (Q2 / D4-reversed) instead of a separate `GET /notifications/unread-count`: one round-trip on app foreground returns both the latest list AND the badge count. A separate endpoint doubles the request count for the most common app-launch scenario. Trade-off: every list call computes the unread count, even when the client only wanted the list — backend must either cache it or compute it via a covering index (`{ userId, read }` partial index). *Citation: Slack Web API `conversations.list` returns `unread_count` inline.*

> **Why `PATCH /:notificationId/read` has a verb in the path** (soft REST violation): this is a state transition with no body — the only fact being communicated is "mark this read". `PATCH /:notificationId { read: true }` would be more strictly RESTful, but the verb-in-path form is unambiguous and shorter on the wire. Document this as a deliberate divergence. Alternative (next refactor): converge to `PATCH /:notificationId { read: true }` to match the verification refactor (D8). See Open Questions Q3. *Citation: this is the same class of decision as D8.*

### Module: `subscriptions`

| # | Method | Endpoint | Auth | Idempotent | Spec |
|---|---|---|---|:---:|---|
| 9.1 | GET | `/subscriptions/me` | Bearer | Yes | [subscription.md#91-get-my-subscription](./modules/subscription.md#91-get-my-subscription) |
| 9.2 | POST | `/subscriptions/verify-receipt` | Bearer | Yes (server idempotent on `originalTransactionId`) | [subscription.md#92-verify-receipt-iap](./modules/subscription.md#92-verify-receipt-iap) |

> **Why `POST /verify-receipt` is idempotent server-side** even though POSTs are typically not: re-submitting the same store receipt must yield the same active subscription record (Restore Purchases on a new device fires this exact replay). The server keys idempotency on `(userId, originalTransactionId)`. Trade-off: the endpoint is POST (because it carries a payload + has side effects on first call) but the second call is a no-op — clients should still treat it as "may have side effects". *Citation: Apple Developer § Verifying receipts; Stripe-style idempotency.*

### Module: `legal`

| # | Method | Endpoint | Auth | Idempotent | Spec |
|---|---|---|---|:---:|---|
| 6.1 | GET | `/legal` | Public | Yes (cacheable, ETag) | [legal.md#61-list-legal-pages](./modules/legal.md#61-list-legal-pages) |
| 6.2 | GET | `/legal/:slug` | Public | Yes (cacheable, ETag) | [legal.md#62-get-legal-page-by-slug](./modules/legal.md#62-get-legal-page-by-slug) |
| 6.3 | POST | `/legal` | `SUPER_ADMIN` | No | [legal.md#63-create-legal-page](./modules/legal.md#63-create-legal-page) |
| 6.4 | PATCH | `/legal/:slug` | `SUPER_ADMIN` | Yes (partial set) | [legal.md#64-update-legal-page](./modules/legal.md#64-update-legal-page) |
| 6.5 | DELETE | `/legal/:slug` | `SUPER_ADMIN` | Yes | [legal.md#65-delete-legal-page](./modules/legal.md#65-delete-legal-page) |

### Module: `admin`

| # | Method | Endpoint | Auth | Idempotent | Spec |
|---|---|---|---|:---:|---|
| 10.1 | GET | `/admin/growth-metrics` | `SUPER_ADMIN` | Yes | [admin.md](./modules/admin.md) |
| 10.2 | GET | `/admin/preference-cards/monthly` | `SUPER_ADMIN` | Yes | [admin.md](./modules/admin.md) |
| 10.3 | GET | `/admin/subscriptions/active/monthly` | `SUPER_ADMIN` | Yes | [admin.md](./modules/admin.md) |

### Module: `devices` (proposed — not yet in `modules/`)

Q2 from `01-auth.md` resolved this: device is a first-class resource. Currently NOT documented in `modules/devices.md` (file doesn't exist) and NOT implemented in code. Endpoints below are spec-only.

| # | Method | Endpoint | Auth | Idempotent | Notes |
|---|---|---|---|:---:|---|
| 11.1 | POST | `/devices/register` | Bearer | Yes (upsert on `(userId, deviceId)`) | Called after every auth success + on FCM token rotation. |
| 11.2 | DELETE | `/devices/:deviceId` | Bearer | Yes | Called before explicit logout. |

> **Why dedicated `/devices` resource** instead of stuffing `deviceToken` in `/auth/login` body: device registration has its own lifecycle that doesn't align with auth (FCM rotates the token mid-session; the user's logout shouldn't lose the token if it was a session-end-only event vs an account-end event). Decoupling lets the device API evolve (e.g. add `lastSeenAt`, multi-device session UI) without touching auth. *Citation: `01-auth.md § Q2 Resolved Decision`.*

---

## 2. Resource Model Cheat-Sheet

| Resource | Identifier | Base path | Collection (GET) | Create (POST) | Get one (GET) | Update (PATCH) | Delete (DELETE) | Sub-resources / Notes |
|---|---|---|---|---|---|---|---|---|
| User | `userId` | `/users` | ✅ admin only | ✅ public (signup) + admin-create | ✅ self via `/users/profile`, admin via `:userId` | ✅ self / admin | ✅ admin (hard) | `/users/me/favorites` |
| Auth session | (token) | `/auth` | — | `/auth/login`, `/auth/social-login` | — | `/auth/refresh-token`, `/auth/change-password` | `/auth/logout` | `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-otp`, `/auth/resend-verify-email` |
| PreferenceCard | `cardId` | `/preference-cards` | ✅ public + private filter via `?visibility=` | ✅ Bearer | ✅ Bearer (gated by `visibility` + ownership) | ✅ owner / admin (also state via `{verificationStatus}`) | ✅ owner / admin | `/preference-cards/:cardId/download`, `/preference-cards/favorites/cards/:cardId`, `/preference-cards/stats`, `/preference-cards/specialties` |
| Supply | `supplyId` | `/supplies` | ✅ Bearer | ✅ admin (single + `/bulk`) | (read-only via list) | ✅ admin | ✅ admin | `/supplies/bulk` |
| Suture | `sutureId` | `/sutures` | ✅ Bearer | ✅ admin (single + `/bulk`) | (read-only via list) | ✅ admin | ✅ admin | `/sutures/bulk` |
| Event | `eventId` | `/events` | ✅ owner-scoped (date-range filter) | ✅ Bearer | ✅ owner / admin | ✅ owner / admin | ✅ owner / admin | Auto reminders T-24h, T-1h |
| Notification | `notificationId` | `/notifications` | ✅ owner-scoped (paginated, includes `meta.unreadCount`) | (system-created) | (read via list) | ✅ `:id/read` (single), `read-all` (bulk) | ✅ Bearer | Soft-delete (`isDeleted: true`) |
| Subscription | (per user) | `/subscriptions` | — | — | `/subscriptions/me` | (state changes via webhooks + `verify-receipt`) | (state-only, never deleted) | `/subscriptions/verify-receipt` |
| LegalPage | `slug` | `/legal` | ✅ public | ✅ admin | ✅ public (`:slug`) | ✅ admin | ✅ admin | Cacheable (ETag) |
| Device (proposed) | `deviceId` | `/devices` | — | `POST /devices/register` (upsert) | — | — (rotation = re-register) | `DELETE /devices/:deviceId` | New resource, not yet in `modules/` |
| Admin metrics | (computed) | `/admin` | — | — | `/admin/growth-metrics`, `/admin/preference-cards/monthly`, `/admin/subscriptions/active/monthly` | — | — | Read-only analytics |

---

## 3. RESTful Compliance Audit

For each existing endpoint: plural-noun path ✅ / ❌ · meaningful path param ✅ / ❌ · correct verb ✅ / ❌ · correct status code ✅ / ❌ · no mirrored verb routes ✅ / ❌ · idempotency contract documented ✅ / ❌.

| # | Endpoint | Plural | Meaningful param | Verb | Status | No mirrored verbs | Idempotency | Notes |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1.1 | `POST /auth/login` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ documented | — |
| 1.2 | `POST /auth/verify-otp` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ atomic | — |
| 1.3 | `POST /auth/forgot-password` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ silent-success | — |
| 1.4 | `POST /auth/reset-password` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ token-consuming | — |
| 1.5 | `POST /auth/refresh-token` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ rotation | — |
| 1.6 | `POST /auth/logout` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ idempotent | — |
| 1.7 | `POST /auth/resend-verify-email` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ rate-limited | — |
| 1.8 | `POST /auth/social-login` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ provider-token-bound | — |
| 1.9 | `POST /auth/change-password` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ rotates `tokenVersion` | — |
| 2.1 | `POST /users` | ✅ | N/A | ✅ | ✅ 201 | ✅ | ⚠️ no `Idempotency-Key` | Recommend adding key (R1) |
| 2.2 | `GET /users` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | — |
| 2.3 | `GET /users/stats` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | — |
| 2.4 | `PATCH /users/:userId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 2.5 | `DELETE /users/:userId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 2.6 | `GET /users/profile` | ✅ | N/A (`me` alias) | ✅ | ✅ | ✅ | ✅ | — |
| 2.7 | `PATCH /users/profile` | ✅ | N/A (`me` alias) | ✅ | ✅ | ✅ | ✅ | — |
| 2.8 | `GET /users/me/favorites` | ✅ | ✅ (`me`) | ✅ | ✅ | ✅ | ✅ | — |
| 3.1 | `GET /preference-cards` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | — |
| 3.2 | `GET /preference-cards/stats` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | — |
| 3.3 | `GET /preference-cards/specialties` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | — |
| 3.4 | `POST /preference-cards` | ✅ | N/A | ✅ | ✅ 201 | ✅ | ⚠️ no `Idempotency-Key` | Recommend adding key (R1) |
| 3.5 | `GET /preference-cards/:cardId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 3.6 | `PATCH /preference-cards/:cardId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 3.7 | `DELETE /preference-cards/:cardId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 3.8 | `PUT /preference-cards/favorites/cards/:cardId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Path nesting redundant (R2) |
| 3.9 | `DELETE /preference-cards/favorites/cards/:cardId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Same nesting note |
| 3.10 | `POST /preference-cards/:cardId/download` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ counter not idempotent | Document as deliberate (R3) |
| 3.11 | `PATCH /preference-cards/:cardId` (`{ verificationStatus }`) | ✅ | ✅ | ✅ | ✅ | ✅ (post-D8) | ✅ | Code refactor still pending |
| 4.1 | `GET /events` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | — |
| 4.2 | `POST /events` | ✅ | N/A | ✅ | ✅ 201 | ✅ | ⚠️ no `Idempotency-Key` | Recommend adding key (R1) |
| 4.3 | `GET /events/:eventId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 4.4 | `PATCH /events/:eventId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 4.5 | `DELETE /events/:eventId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Hard-delete (vs notif soft-delete) — see R4 |
| 5.1 | `GET /notifications` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | `meta.unreadCount` on response |
| 5.2 | `PATCH /notifications/:notificationId/read` | ✅ | ✅ | ✅ | ✅ | ❌ verb-in-path | ✅ | Same class as old `/approve` — see R5 |
| 5.3 | `PATCH /notifications/read-all` | ✅ | N/A | ✅ | ✅ | ❌ verb-in-path | ✅ | Bulk action; see R5 |
| 5.4 | `DELETE /notifications/:notificationId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ soft-delete | — |
| 6.1 | `GET /legal` | ✅ | N/A | ✅ | ✅ | ✅ | ⚠️ no ETag | Recommend ETag (R6) |
| 6.2 | `GET /legal/:slug` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ no ETag | Same |
| 6.3 | `POST /legal` | ✅ | N/A | ✅ | ✅ 201 | ✅ | ✅ slug-unique | — |
| 6.4 | `PATCH /legal/:slug` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 6.5 | `DELETE /legal/:slug` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 7.1 | `GET /supplies` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | — |
| 7.2 | `POST /supplies` | ✅ | N/A | ✅ | ✅ 201 | ✅ | ✅ name-unique | — |
| 7.3 | `POST /supplies/bulk` | ✅ | N/A | ✅ | ✅ | ✅ | ✅ skips dups | Verb-in-path (acceptable batch idiom) |
| 7.4 | `PATCH /supplies/:supplyId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 7.5 | `DELETE /supplies/:supplyId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 8.x | `/sutures/*` | (mirror of supplies) | | | | | | Same audit applies |
| 9.1 | `GET /subscriptions/me` | ✅ | ✅ (`me`) | ✅ | ✅ | ✅ | ✅ | Returns `plan: "FREE"` for free users — never 404 |
| 9.2 | `POST /subscriptions/verify-receipt` | ✅ | N/A | ✅ | ✅ | ❌ verb-in-path | ✅ idempotent | Acceptable — non-CRUD action against external IDP |
| 10.x | `/admin/*` | mixed | N/A | ✅ | ✅ | ⚠️ verb-ish path segments | ✅ | Read-only analytics — pragmatic |

### Recommendations

- **R1 — Add `Idempotency-Key` to `POST /preference-cards`, `POST /events`, `POST /users` (signup)**. Without it, network-retry on a 5xx after the row was committed causes duplicate cards / events / accounts. Implementation: middleware that stores `(userId, key) → response` in Redis or Mongo with 24-h TTL. *Citation: Stripe API.*
- **R2 — Flatter favorites path** (cosmetic, low priority): `PUT /users/me/favorites/:cardId` is shorter and reads as "attach card to my favorites collection". Trade-off: the current `PUT /preference-cards/favorites/cards/:cardId` is locked across docs; renaming is a breaking change. Park unless we're shipping a v2 anyway.
- **R3 — Document `POST /preference-cards/:cardId/download` as a deliberate non-idempotent counter**. The doc should state: "Multiple POSTs increment the counter multiple times; clients should debounce." Otherwise a retry-on-5xx will inflate the counter.
- **R4 — Reconcile delete strategy**: events use hard-delete, notifications use soft-delete. Pick one per resource based on audit-trail need. Likely: events soft-delete (medical context = compliance), notifications hard-delete or TTL is fine. Currently inverted.
- **R5 — Notification mark-read shape**: align with D8 by switching to `PATCH /:notificationId { read: true }` and `PATCH /notifications { read: true, ids: [...] }` for bulk. Same class of decision as D8 (D8 already converged verification routes; the notification routes are next). See Open Questions Q3.
- **R6 — Add `ETag` + `Cache-Control: private, max-age=300` to `GET /legal` and `GET /legal/:slug`**. Legal slugs change rarely; the list endpoint is hit on every Profile screen open. Save the body bytes.

---

## 4. Mentor Notes — Top 10 Decisions Explained

The architecturally consequential calls. Read this before the inventory if you want the high-level mental model first.

### 4.1 Why URI versioning (`/v1/`) over header versioning

URI versioning is visible in every log line, every Postman tab, every error report. Header versioning hides the version in something proxies don't see and clients often forget to set. The trade-off is rigidity — every breaking change forces a new prefix and a parallel-deploy migration. For a closed-loop app (mobile + dashboard, no third-party integrators), this rigidity is fine; you control all clients. *Alternative: header `Accept: application/vnd.tbsosick.v1+json`. Rejected: invisible in logs, client mis-config = silent v0 fallback.* *Citation: Google AIP-180.*

### 4.2 Why server-side `meta.unreadCount` instead of client-computed badge

Client-computed only works while the unread set fits on page 1 (default `limit=20`). Past that, the bell shows "no unread" while page 2 has unread rows — bug class users never report because they assume the badge is correct. Server-side keeps a single integer the client trusts. The cost is one indexed count query per `GET /notifications`, served by a partial index `{ userId: 1, read: 1, createdAt: -1 }`. *Reverses D4 in `overview.md`. Citation: Slack Web API `conversations.list` returns `unread_count` inline.*

### 4.3 Why `PATCH /users/:userId { status: "RESTRICTED" }` instead of `POST /users/:userId/block`

Block is one of N possible state transitions on the user resource (`ACTIVE` / `RESTRICTED` / `INACTIVE` / `DELETED`). PATCH-with-body composes — adding a fifth state is a Zod enum addition, not a new route. Mirrored verb routes (`/block`, `/unblock`, `/suspend`, `/reactivate`) duplicate validators, controllers, and audit entries for what is logically one operation. *Trade-off: the same PATCH is used by self-update (profile fields) and admin (status), so the role gate must be field-aware. Citation: Google AIP-216 (state transition); `CLAUDE.md` Route Design Rules.*

### 4.4 Why one `GET /preference-cards?visibility=public|private` instead of two routes

Q1 decision. A single endpoint with a query filter is the canonical REST list pattern (Stripe `/charges?customer=...`, GitHub `/repos?type=...`). Splitting into `/preference-cards/public` + `/preference-cards/my-cards` duplicates the controller + the Used-By cross-link surface across `app-screens/` for no semantic gain. The query param is not "magic" — it's documented in the spec, validated by Zod, and the response shape is identical. *Trade-off: the same endpoint changes its visibility-filter behaviour based on a query param, so the docs must call out the dual semantics. Citation: Stripe API style guide.*

### 4.5 Why short-lived access (15 min) + rotating refresh (30 days)

Q5 decision. Limits blast radius of an access-token leak (max 15-min exposure) without forcing the user to log in every session. Rotation + reuse-detection turns refresh-token theft into a self-defeating attack: the legitimate client immediately sees a 401, the system force-logs-out, and the attacker's stolen token is dead too. The mobile client schedules proactive refresh at `TTL - 60s` to avoid user-visible 401-then-retry latency on the next request. *Trade-off: more refresh traffic than long-lived tokens. Cheap. Citation: OAuth 2.1 draft (BCP 195) + reuse-detection from `01-auth.md § Token Refresh (Background)`.*

### 4.6 Why generic 401 on `/auth/login` for both bad password AND missing user

Email enumeration. An attacker who can distinguish "user exists" from "user doesn't exist" via timing or copy can build a list of valid emails to brute-force. The same principle drives silent-success on `/auth/forgot-password` (response is identical whether the email is registered). *Trade-off: legitimate users get a slightly less helpful error message. Citation: OWASP ASVS § V2.1.*

### 4.7 Why `POST /verify-receipt` is server-idempotent

Mobile IAP receipt verification re-runs on Restore Purchases (new device, OS reinstall, "Restore Purchases" button). The server keys idempotency on `(userId, originalTransactionId)` from the verified receipt — same transaction = same subscription record returned, no duplicate charge state. Without this, restore would either duplicate the subscription or hard-fail. *Trade-off: the endpoint is POST (carries a payload, has side effects on first call) but the second call is a no-op — clients should still treat it as "may have side effects" + use `Idempotency-Key` for the network-retry case. Citation: Apple Developer § Verifying receipts.*

### 4.8 Why dedicated `/devices` resource instead of stuffing `deviceToken` in auth bodies

Q2 decision. Device registration has its own lifecycle that doesn't align with auth: FCM rotates the token mid-session (no auth event), and logout might be session-only vs account-end (each requires different device handling). Decoupling lets the device API evolve (e.g. add `lastSeenAt`, multi-device session UI for "active sessions" in profile) without touching auth. The authentication endpoints stop accepting `deviceToken`; the app calls `POST /devices/register` immediately after auth success. *Citation: `01-auth.md § Q2 Resolved Decision`.*

### 4.9 Why client-side PDF generation instead of `GET /preference-cards/:cardId/download` returning binary

D5 decision. Client renders the PDF locally from the JSON it already has in memory (just opened the card details). Server cost: zero. Server bandwidth: zero. The `POST /:cardId/download` endpoint only increments the counter as analytics. *Trade-off: PDF formatting is duplicated per platform (iOS / Android / web — three renderers). Acceptable in v1 because the card layout is simple. Migrate to `GET /:cardId/download.pdf` returning a server-rendered binary IF: (a) the card layout becomes complex enough that rendering parity across platforms is a real test burden, OR (b) "share PDF link" becomes a feature (server URL > client-rendered file). Citation: D5 in `overview.md`.*

### 4.10 Why page-based pagination in v1, cursor in v2

Page-based is simpler for admin tables (`/users`, `/preference-cards` admin moderation) where total + jump-to-page UX matters. Hot user-facing lists (`/preference-cards`, `/notifications`) will eventually outgrow it: page 2 drifts when new records arrive between fetches. Cursor pagination is stable under inserts and cheaper on indexed columns; the cost is opaque cursors that aren't client-constructable, so "jump to page N" UX dies. *Recommendation: keep page-based for admin tables forever; migrate user-facing lists to cursor when total grows past ~10k rows OR when "drift" complaints surface. Citation: Stripe API guidelines § List endpoints.*

---

## 5. Open Questions

Items the docs don't fully specify. Each blocks a final API freeze.

### From `system-concepts.md` + cross-cutting design

- **Q1 `[NEEDS INFO]`** — *(§ Idempotency, applies to `POST /preference-cards`, `POST /events`, `POST /users` signup)* — Should we ship `Idempotency-Key` middleware in v1 OR defer to v2? **(A)** Ship now: 24-h `(userId, key)` cache in Redis or Mongo TTL collection; clients add a UUID v4 header on retries. **(B)** Defer; rely on client-side de-dup + accept rare duplicate rows in v1. **Blocks**: client-side retry strategy (without server idempotency, the safe retry policy is "do not retry POSTs", which means a single network blip becomes a user-visible failure). **`[ANS: ]`**

- **Q2 `[NEEDS INFO]`** — *(§ Cacheability, applies to `GET /legal` + `GET /legal/:slug`)* — Add `ETag` + `Cache-Control: private, max-age=300` now OR defer? **(A)** Add now: trivial implementation (`md5(body)` as ETag), saves ~5KB on every Profile screen open. **(B)** Defer until Profile-screen latency becomes a measured complaint. **Blocks**: nothing critical, but clean to land before legal becomes a frequently-edited surface. **`[ANS: ]`**

- **Q3 `[NEEDS INFO]`** — *(§ Notifications, applies to `PATCH /:notificationId/read` and `PATCH /notifications/read-all`)* — Same class as D8 verification refactor: should mark-read converge to `PATCH /:notificationId { read: true }` (single) and `PATCH /notifications { read: true }` (bulk)? **(A)** Yes, refactor for consistency with D8. **(B)** No, current `/read` and `/read-all` paths are clear-by-name and changing breaks two clients (mobile + dashboard) for cosmetics. **Blocks**: a future "mark unread" feature would require either another verb path (`/unread`) under (B) or just `{ read: false }` body under (A). **`[ANS: ]`**

- **Q4 `[NEEDS INFO]`** — *(§ Delete strategy, applies to `/events` vs `/notifications`)* — Reconcile soft-delete vs hard-delete. **(A)** Make events soft-delete (audit / compliance — medical events should be retrievable for 7 years per HIPAA-style retention). **(B)** Keep events hard-delete; rely on backups for compliance retrieval. **(C)** Make both soft-delete uniformly. **Blocks**: backup retention policy + the eventual "deleted events" admin view. **`[ANS: ]`**

- **Q5 `[NEEDS INFO]`** — *(§ Devices, applies to proposed `/devices` module)* — Is the `/devices/register` + `/devices/:deviceId` shape green-lit for module-doc creation now, or wait until backend code lands? **(A)** Create `modules/device.md` with the spec; mark code-state pending. **(B)** Wait until code is written; risk drift between intent and implementation. **Blocks**: 01-auth.md currently references endpoints that have no module spec. **`[ANS: ]`**

---

## 6. Suggested Next Steps

1. Resolve **Q1** (idempotency) and **Q4** (delete strategy) first — both touch implementation across multiple modules and define behaviour at retry / audit boundaries that are painful to add later.
2. Apply **R1** (idempotency middleware), **R3** (document download counter as deliberate), and **R6** (legal ETag) — these are net-additive; no breaking changes.
3. After **Q3** is answered, schedule **R5** (notification mark-read refactor) alongside the existing D8 verification refactor — both are the same class of route convergence and should land together.
4. Create `modules/device.md` per **Q5** decision; backfill the code state note like `preference-card.md` currently does for the `:cardId/status` route.
5. When migrating to cursor pagination (per §4.10), do `GET /preference-cards` first — highest read volume on mobile.