# 📘 RESTful API Design Audit Report

> **Audit date:** 2026-04-09
> **Source:** `ux-flow-with-api-responses/api-inventory.md` (screen-wise endpoint inventory)
> **Skill applied:** `.trae/skills/api-design` — REST principles, URL naming, method semantics, contract consistency
> **Scope:** Document-level audit of the catalogued surface. Underlying route code spot-checked for the `users` module only.

---

## 📊 Summary

| Severity | Count | Notes |
|---|---:|---|
| 🔴 Critical | 6 | REST violations / security smells — fix before contract hardens |
| 🟡 Warning | 9 | Inconsistencies / DX issues |
| 🔵 Suggestion | 5 | Doc hygiene / quality lifts |
| ✅ Recently fixed | 2 | Done in this audit cycle (see bottom) |

---

## 🔴 Critical Findings

### C1. Verb in resource path — `POST /payments/refund/:paymentId`
**Where:** Payment module
**Problem (Banglish):** Skill rule bole verb gulo state-transition er **suffix** hisebe boshte hobe, prefix na. `refund` ekta payment-er upor action, tai oita path-er sheshe ashbe. Ekhon refund ta `payments`-er age boshche, jeta REST-er resource-action ordering bhange.
**Correct design:** `POST /payments/:paymentId/refund` (or treat as a resource: `POST /payments/:paymentId/refunds`).

---

### C2. Two endpoints for one boolean — `PATCH /users/:id/block` + `PATCH /users/:id/unblock` ✅ FIXED
**Where:** User module
**Problem (Banglish):** Ekta single boolean state-er jonno duita route doubles the surface area. Mirror routes drift out of sync hoye jay, ar `/block` + `/unblock` paira maintain kora extra burden.
**Correct design:** Collapsed to `PATCH /users/:userId` with `{ "status": "RESTRICTED" | "ACTIVE" }` in body. State change is just a field update on the resource — no verb route needed.
**Status:** ✅ Implemented this cycle. See "Recently Fixed" section.

---

### C3. Same endpoint serves two distinct flows — `POST /users` (Public)
**Where:** Listed under both **Dashboard → User Management 3.2** *and* **Mobile → Auth 1.1**, both `Public`
**Problem (Banglish):** Admin-create-user flow ar mobile self-registration ekta open endpoint share korche. Admin creation typically `auth(SUPER_ADMIN)` lagbe ar role/status set korar permission lagbe; public registration sheta korte parbe na. Ek route diye dui contract serve korle mass-assignment vulnerability open hoye jay (e.g., mobile client `{ role: "SUPER_ADMIN" }` pathate parbe).
**Correct design:**
- Mobile: `POST /auth/register` (public, restricted fields)
- Admin: `POST /users` (admin-only, can set role/status)

---

### C4. Singular resource + verb in path — `/subscription/*`
**Where:** Subscription module
**Routes affected:**
- `GET /subscription/me`
- `POST /subscription/iap/verify`
- `POST /subscription/choose/free`

**Problem (Banglish):** Duita rule bhanche — (1) resource singular (`subscription` instead of `subscriptions`), (2) verb path segments (`verify`, `choose`). Skill rule: nouns only, plural collections.
**Correct design:**
- `GET /subscriptions/me`
- `POST /subscriptions/iap-verifications` (treat verification as a resource), or `POST /subscriptions/me/iap-verify` (state transition suffix)
- `POST /subscriptions` with `{ "plan": "free" }` (or `POST /subscriptions/me/plan` body `{ plan: "free" }`)

---

### C5. Non-resource namespace — `/dashboard/...`
**Where:** Admin Dashboard
**Routes affected:**
- `GET /dashboard/growth-metrics`
- `GET /dashboard/preference-cards/monthly`
- `GET /dashboard/subscriptions/active/monthly`

**Problem (Banglish):** `dashboard` ekta UI concept, resource na. URL e UI surface name dile API tightly coupled hoye jay frontend-er sathe — onno consumer (mobile, third-party) er kase eta meaningless. Ar UI rename korle API o break hobe.
**Correct design:** Move under `/admin/metrics/...` with query params:
- `GET /admin/metrics/users` (overall growth)
- `GET /admin/metrics/preference-cards?period=monthly`
- `GET /admin/metrics/subscriptions?status=active&period=monthly`

---

### C6. `/notifications/admin/...` reverses ownership semantics
**Where:** Notification module
**Routes affected:**
- `GET /notifications/admin`
- `PATCH /notifications/admin/:id/read`
- `PATCH /notifications/admin/read-all`

**Problem (Banglish):** `admin` notifications-er sub-resource na — eta same `notifications` resource ke onno role scope theke dekha. Current shape implies admin ekta child of notifications, jeta semantically wrong. Plus role-based scoping middleware-er kaj, URL-er na.
**Correct design:** Either:
- `/admin/notifications` (clear admin scope)
- Drop the `/admin` segment entirely — let `auth(SUPER_ADMIN)` + a query filter handle it

---

## 🟡 Warnings

### W1. Inconsistent "current user" convention
Three different idioms used for the same concept:
- `/users/profile` (mobile 6.1, 6.2)
- `/users/me/favorites` (mobile 2.3)
- `/subscription/me` (mobile 6.3)

**Fix:** Standardize on `/me` everywhere → `/users/me`, `/users/me/favorites`, `/subscriptions/me`.

### W2. Singular sub-resources in payments module
- `DELETE /payments/account/:accountId` — should be `/payments/accounts/:accountId`
- `POST /payments/stripe/account` — should be `/payments/stripe/accounts`

### W3. Filter-as-path-segment — `/payments/by-bid/:bidId/current-intent`
`by-bid` ekta filter expression, path segment na. Two cleaner options:
- Owner path: `GET /bids/:bidId/payment-intent` (if bid owns the payment)
- Query: `GET /payments?bidId=...`

### W4. Mixed identifier types
`/legal/:slug` uses slug while everything else uses an id. Fine if intentional — but document it explicitly so consumers know slug is canonical for `legal`.

### W5. Logout role mismatch across docs
- Dashboard `1.6 /auth/logout` = `All Auth`
- Mobile `1.7 /auth/logout` = `User`

Same endpoint should have **one** role contract; admins on mobile would currently be denied.

### W6. Section numbering gap in dashboard inventory
Dashboard sections jump `1, 2, 3, 4, 6` — section 5 is missing entirely. Either renumber or document the deletion.

### W7. Missing GET-by-id for catalog resources
- `/supplies/:id` has `PATCH`/`DELETE` but no `GET`
- `/sutures/:id` same

Either inventory is incomplete or the API genuinely lacks read-single endpoints — admins editing a row need it.

### W8. `POST /preference-cards` (create) absent from mobile inventory
Mobile sections 2/3 list `GET`, `PATCH`, `DELETE` on cards but **no create** — yet "Preference Card Details" implies users own cards. Either inventory missing or API missing.

### W9. Bare `:id` path params across most modules ⚠️ PARTIAL FIX
Skill rule (newly added this cycle): never use bare `:id` — name the param after the resource (`:cardId`, `:bookingId`, etc.). Bare `:id` is ambiguous, collides in nested routes (Express silently overwrites), and harder to grep.

**Status by module:**
- ✅ `users` module — fully migrated to `:userId` this cycle
- ❌ `preference-cards/:id` — still bare
- ❌ `events/:id` — still bare
- ❌ `notifications/:id` — still bare
- ❌ `supplies/:id`, `/sutures/:id` — still bare
- ❌ `legal/:slug` — uses slug (acceptable, but document)
- ❌ `payments/:paymentId` — already meaningful ✅

**Fix:** Per-module migration. See "Outstanding Migrations" below.

---

## 🔵 Suggestions

### S1. Status column is misleading
Every row in the inventory is `✅`, but the "Missing Implementation" table at the bottom contradicts this (e.g., `/notifications/:id DELETE` is in inventory but listed as not implemented). Add a `❌` / `🚧` state and use it consistently.

### S2. Add `Idempotency-Key` column
Mutating financial endpoints (`/payments/*`, `/subscription/iap/verify`, `/preference-cards/:id/download`) should be idempotent. Add a column to make it visible during review.

### S3. Add a `Validation` column
Reference the Zod schema name per row — makes future audits trivial and surfaces missing validation gaps.

### S4. Group webhook / OAuth-callback routes separately
`/payments/webhook` and `/auth/google/callback` are external-callback endpoints with different security models (signature verification, no JWT). Mixing them with auth-protected routes hides that distinction.

### S5. Add `/api/health` + `/api/ready` to the inventory
Standard production probes — listed as a best practice in the skill's audit suggestions. If they don't exist, create them; if they do, document them.

---

## ✅ Recently Fixed (this audit cycle)

### F1. Block/Unblock collapsed into a single status update
**Old:** `PATCH /users/:id/block`, `PATCH /users/:id/unblock`
**New:** `PATCH /users/:userId` body `{ "status": "RESTRICTED" | "ACTIVE" }`

Changes made:
- `src/app/modules/user/user.route.ts` — both routes removed
- `src/app/modules/user/user.controller.ts` — `blockUser` + `unblockUser` controllers removed
- `src/app/modules/user/user.validation.ts` — `setBlockStatusZodSchema` not needed (handled by `adminUpdateUserZodSchema`)
- `ux-flow-with-api-responses/dashboard-screens/03-user-management.md` — UX flow + section 3.3 updated, old block/unblock sections deleted
- `ux-flow-with-api-responses/api-inventory.md` — block/unblock rows removed

### F2. User module `:id` → `:userId` migration
**Old:** `/users/:id`, `/users/:id/status`, etc.
**New:** `/users/:userId`, `/users/:userId/status`, etc.

Changes made:
- All 5 routes in `user.route.ts` renamed
- All 5 controllers (`updateUserStatus`, `adminUpdateUser`, `deleteUser`, `getUserById`, `getUserDetailsById`) destructure `userId`
- Validation schemas (`updateUserStatusZodSchema`, `adminUpdateUserZodSchema`) params updated
- Inventory + screen docs updated

### F3. New skill rule: meaningful path params
Added across the api-design skill so future routes default to the correct convention:
- `.trae/skills/api-design/SKILL.md` — quick rules + canonical Route example
- `.trae/skills/api-design/references/rest-principles.md` — new "Path parameter names" section + anti-pattern row
- `.trae/skills/api-design/references/audit.md` — checklist + violation table
- `.trae/skills/api-design/references/build.md`, `security.md`, `uploads.md` — examples updated
- `.trae/templates/codebase-blueprint.md` — module scaffold template
- `CLAUDE.md` — Route Design Rules section
- `docs/standards/api-design-rules.md` — example + explicit note
- Persistent memory: `feedback_meaningful_route_params.md`

---

## 📋 Outstanding Migrations (per module)

These modules still have bare `:id` and need the same treatment as `users`:

| Module | Routes affected | Suggested param name |
|---|---|---|
| **preference-card** | `/preference-cards/:id`, `/:id/favorite`, `/:id/download` | `:cardId` |
| **event** | `/events/:id` | `:eventId` |
| **notification** | `/notifications/:id`, `/:id/read` | `:notificationId` |
| **supplies** | `/supplies/:id` | `:supplyId` |
| **sutures** | `/sutures/:id` | `:sutureId` |
| **subscription** | (also needs C4 fix) | `:subscriptionId` / `me` |

Each migration: rename param in route → controller destructure → validation `params` schema → inventory/screen docs → postman collection.

---

## 🎯 Verdict

Inventory ta **structurally useful** as a screen-to-endpoint map, kintu API surface itself e kichu REST violations ache je client contract harden hoyar age fix kora dorkar:

**Top 4 priority fixes (in order):**
1. ✅ ~~Block/unblock duplication~~ — DONE
2. **Duplicated `POST /users`** (admin + public sharing one endpoint) — security risk
3. **`/payments/refund/:paymentId`** verb-prefix
4. **`/subscription/*`** singular + verb cluster
5. **`/dashboard/*`** UI-as-resource pattern

The smaller inconsistencies (`me` vs `profile`, singular `account`, `notifications/admin` shape) are worth catching now while consumers are still flexible — but block on items 2-5 first.
