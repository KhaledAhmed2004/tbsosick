# System Concepts

> Cross-cutting concepts referenced by every screen and module doc. Read this once; the rest of the project assumes you know it.

---

## Base URL & Environment

| Environment | Base URL |
|---|---|
| Local | `http://localhost:5000/api/v1` |
| Staging | `https://staging-api.tbsosick.com/api/v1` |
| Production | `https://api.tbsosick.com/api/v1` |

Throughout the docs `{{baseUrl}}` is the placeholder. All endpoints are mounted under `/api/v1`.

---

## Standard Response Envelope

Every API response (success or error) shares the same shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": { ... },
  "meta": { ... }
}
```

Errors share the same envelope with `success: false` and `data: null`:

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation Error",
  "errorMessages": [
    { "path": "email", "message": "Enter a valid email address." }
  ],
  "data": null
}
```

**Pagination meta** (only on list endpoints):

```json
{
  "page": 1,
  "limit": 20,
  "total": 50,
  "totalPages": 3,
  "hasNext": true,
  "hasPrev": false
}
```

Some list endpoints add domain-specific keys to `meta` (for example, `meta.unreadCount` on `GET /notifications`).

---

## User Roles

| Role | Surface | Capability summary |
|---|---|---|
| `USER` | Mobile | Register / login (email or Google / Apple), create / favorite / download cards, manage personal calendar, manage profile and subscription. Gated features depend on subscription tier. |
| `SUPER_ADMIN` | Dashboard | Full admin surface: growth metrics, user CRUD + block, card verification (verify / reject), legal CMS, supplies + sutures master catalog. |
| Public (unauth) | Either | Auth endpoints only (register, login, forgot / reset password, social login, refresh, resend OTP). |

For the full visibility / plan-gate matrix, see [overview.md §3 — User Roles & Personas](./overview.md#3-user-roles--personas) and [overview.md §9 — Subscription Plans](./overview.md#9-subscription-plans-iap).

---

## Status Code → UX Response Mapping

Canonical map of HTTP status codes to UI behaviour. Screen docs cross-link to this table instead of duplicating it.

| Status | Cause | UX response | Notes |
|---|---|---|---|
| 200 / 201 | Success | Render result | — |
| 400 | Bad request shape | Inline error under affected field | — |
| 401 | Auth (token missing / invalid / expired) | Redirect Login (or auto-refresh per [Token Refresh](./app-screens/01-auth.md#token-refresh-background)) | — |
| 403 | Account state OR plan-required | Toast or modal (account state) / paywall (plan) | — |
| 404 | Resource missing | Empty state / inline | — |
| 409 | Conflict (e.g. email exists) | Inline + recovery CTA | — |
| 422 | Validation (Zod) | Field-level inline | — |
| 429 | Rate limit | Inline countdown using `Retry-After` | — |
| 5xx | Server error | Toast + crash report | — |

---

## Common UI Rules

These apply to every authenticated screen — don't repeat them in each section.

- **Submit protection**: every submit / mutation button is disabled the moment it is tapped and shows a spinner until the request settles. Re-enable on `200`, `4xx`, `5xx`, or network failure. Prevents double-submit on slow networks.
- **Offline pre-flight**: before any submit, check connectivity. If offline, show inline message *"You're offline. Check your connection and try again."* and don't fire the request.
- **Generic 5xx**: for any unexpected `500` / `502` / `503`, show toast *"Something went wrong. Please try again."* and log to the crash reporter with request context.
- **Validation (`422`)**: map each `error.path` to its form field; show inline. Never show a generic toast for validation failures.
- **Rate-limit (`429`)**: read the `Retry-After` header; show inline *"Too many attempts. Try again in {N}s."* and disable submit until the timer expires.
- **Auth (`401`)**: redirect to Login (or auto-refresh in background per [Token Refresh](./app-screens/01-auth.md#token-refresh-background)).

---

## Subscription Plans

Three-tier IAP subscription:

- **Free** — 2 cards max, no library access, no calendar.
- **Premium** — 20 cards, unlocked library + basic calendar.
- **Enterprise** — unlimited cards, advanced calendar, only tier whose cards admin can mark as `VERIFIED`.

For the full pricing matrix and plan-gating rules, see [overview.md §9 — Subscription Plans](./overview.md#9-subscription-plans-iap).

---

## Bilingual Convention

Banglish for narrative + "WHY" rationale (where present). English for endpoint paths, status codes, JSON, and table headers. This keeps technical references unambiguous while letting product reasoning stay in the team's working language.

Where a screen doc has been migrated to v2, callouts are normalized to English under the heading `> **Why this design**`.

---

## Cross-link Anchor Format

Markdown headings auto-generate GitHub-flavored anchors. Rule: lowercase, spaces → hyphens, drop punctuation. Example: `### 3.4 Create Preference Card` → `#34-create-preference-card`.

Useful canonical anchors on this page (linked from every screen file):

- `#base-url--environment`
- `#standard-response-envelope`
- `#user-roles`
- `#status-code--ux-response-mapping`
- `#common-ui-rules`
