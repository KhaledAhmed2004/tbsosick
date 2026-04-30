# Admin Dashboard Specification

> **Generated from** (folder: `app-screens/`):
> - [`01-auth.md`](./app-screens/01-auth.md) — Registration / OTP / login (email + Google + Apple) / forgot-reset password / refresh-token rotation / logout / device & FCM token lifecycle. Account states `ACTIVE / RESTRICTED / INACTIVE / DELETED`. Validation rules for email / password / phone.
> - [`02-home.md`](./app-screens/02-home.md) — Home: stats counts, favorite-cards carousel, "All Cards / My Cards" tabs (`?visibility=public|private`), search + create FAB.
> - [`03-preference-card-details.md`](./app-screens/03-preference-card-details.md) — Card detail read; favorite toggle; download (counter-only, PDF rendered locally); Edit / Delete buttons available to owner OR `SUPER_ADMIN`.
> - [`04-create-preference-card.md`](./app-screens/04-create-preference-card.md) — Card creation. Supplies / sutures typeahead with `+ Add "X" as custom` affordance — catalog grows organically from user input.
> - [`05-library.md`](./app-screens/05-library.md) — Global search over public cards. Filter by specialty + `verificationStatus=VERIFIED`. Plan-gated (paid feature).
> - [`06-calendar.md`](./app-screens/06-calendar.md) — Event CRUD with `personnel: Array<{name, role}>`, `linkedPreferenceCard`, `eventType` enum. User-private resource.
> - [`07-profile.md`](./app-screens/07-profile.md) — Profile edit; subscription read; IAP upgrade + restore purchases (`POST /subscriptions/verify-receipt`); legal-page reader (`GET /legal`, `GET /legal/:slug`); logout.
> - [`08-notifications.md`](./app-screens/08-notifications.md) — Notifications: FCM push + Socket.IO + DB. `meta.unreadCount` server-computed. Mark-read / mark-all-read / swipe-delete.
>
> **Date**: 2026-04-30
> **Scope**: SUPER_ADMIN-facing operational dashboard for the medical preference-card platform. Surfaces every admin action implied by the user UX: account moderation, card verification, catalog curation, legal CMS, subscription operations, audit trail, and platform health.
> **Total pages**: 9 · **By category**: User Management 1 · Content Moderation 1 · Configuration 3 · Operational 3 · Analytics 1 · Support 0
> **RBAC roles** (from app-screens/01-auth.md): `USER` (mobile app consumer), `SUPER_ADMIN` (dashboard). The user UX implies a single admin role; whether a sub-role like `MODERATOR` is desired is an open question — see §7 Q1.
> **Stack assumed**: TypeScript + Express + MongoDB (per `system-concepts.md` referenced from app-screens — not directly read).

---

## 0. Conventions & Cross-Cutting

### 0.1 Navigation pattern

- **Sidebar**: collapsible, sectioned by category — *User Management / Moderation / Catalog / Legal / Subscriptions / Operational / Analytics / Audit*. Each section header is keyboard-collapsible. Bottom of sidebar: current admin avatar + role badge + workspace selector (single workspace today; placeholder for v2 multi-tenant).
- **Topbar**: global search (command palette `⌘K` / `Ctrl+K`), notification bell (admin-side notifications: failed receipt-verifies, queue alerts), help / changelog button.
- **Density toggle**: comfortable / compact, persisted per-admin in `adminPreferences`.

> **Why sidebar over topbar at this scale**: 9 destinations + sub-pages would collapse into a hamburger on a topbar. Sidebar with sections scans linearly and supports keyboard shortcuts. *Citation: Linear / Stripe Dashboard / Notion all use sidebar at admin scale.*

### 0.2 Table standards

- **Default density**: comfortable. Toggle stored per-admin.
- **Sortable columns**: arrow icon indicator; multi-sort via shift-click.
- **Pagination**: page-based by default (matches `meta: { page, limit, total, totalPages, hasNext, hasPrev }` returned by the API per `08-notifications.md` and `02-home.md`). Cursor pagination is reserved for high-frequency lists if/when total grows past ~10K rows (see Operational Dashboard).
- **Row click**: opens **slide-over detail panel** from the right — NOT a full-page nav. Filter state preserved.
- **Bulk select**: checkbox column + "Select all matching filter" affordance. Bulk action bar appears on selection.

> **Why slide-over over full-page nav**: admin tasks are *triage*-shaped — open user, glance, take action, close, move to next user. Full-page nav loses the list context and forces a back-button round-trip per row. Slide-over keeps the queue position. *Citation: Linear / GitHub admin / Stripe Dashboard.*

### 0.3 Filter & search ergonomics

- **Filter bar**: pinned chips for active filters; inline clear icon per chip; "Saved views" for recurring queries (e.g. *"Restricted users in last 7 days"*).
- **Search**: free-text with 300 ms debounce on user-management and card-moderation tables. Indexed-field exact-match where indexes exist (email, cardId); full-text where supported (card title, surgeon name).
- **Filter persistence**: filters encoded in the URL query string so admins can share / bookmark / reproduce filtered views.

### 0.4 Action UX

- **Per-row actions**: kebab menu (3-dot icon) — view / edit / suspend / delete. Keyboard: arrow keys + enter.
- **Bulk actions**: single bar above table when ≥1 row selected. Destructive bulk = **typing-to-confirm** (admin must type the resource name or count, e.g. *"Type DELETE 12 cards to confirm"*).
- **Page-level actions**: top-right primary button (e.g. `+ New legal page`).
- **Destructive actions**: confirmation modal naming the resource + count + irreversible warning.

> **Why typing-to-confirm**: muscle-memory clicks delete 12 customers' worth of data. Stripe / GitHub / Vercel all require typing the resource name for irreversible bulk ops. Habit-protected destructive flow is the load-bearing pattern. *Citation: Stripe deletion guidelines; GitHub Repo deletion UX.*

### 0.5 RBAC & audit

- Every action declares which role(s) can perform it (matrix per page in §2).
- **Audit-logged actions** (always): any role/permission change, any deletion (user / card / catalog row / legal page), any user impersonation, any subscription grant or refund, any export, any verification approve/reject. Logged with:
  ```json
  {
    "logId": "log_...",
    "adminId": "adm_...",
    "action": "user.suspend",
    "targetType": "User",
    "targetId": "usr_...",
    "before": { "status": "ACTIVE" },
    "after":  { "status": "RESTRICTED", "reason": "fraud-suspected" },
    "timestamp": "2026-04-30T08:13:42Z",
    "requestId": "req_...",
    "ip": "203.0.113.42",
    "userAgent": "Mozilla/5.0 ..."
  }
  ```
- **Retention**: ≥ 13 months (covers SOX-style + GDPR audit cycles). Append-only (no edits, no deletes from the audit collection).

> **Why this scope**: under-logging blinds incident response (*"who suspended this user and why?"*); over-logging burns storage and complicates GDPR right-to-erasure. Logging *administrative actions on user data* is the load-bearing middle. *Citation: OWASP ASVS V8 — audit-log requirements.*

### 0.6 States (consistent across every page)

- **Loading**: skeleton table (10 rows by default), not spinner — reduces perceived latency.
- **Empty (no data)**: contextual message + 1 next-best-action button. Never a generic *"No data"*.
- **Empty (filtered out)**: *"No <resource> match these filters."* + Clear filters button.
- **Error**: inline retry, exception ID copyable, deep-link to Operational Dashboard for recent incidents.
- **Partial-permission**: read-only rows render normally; restricted actions are **absent from the UI** (NOT greyed-out — greying invites support tickets *"why is this disabled?"*). One subtle tooltip on the row indicating the role gap is acceptable.

### 0.7 Export

- CSV + JSON formats. Audit-logged. Rate-limited (5 exports per admin per hour). Exports above 10K rows go to email-when-ready (avoid blocking the UI). Encrypted-at-rest in temp storage; URL valid for 1 hour.

> **Why rate-limit + email-when-ready**: a single careless `export all users` on a 100K-row table blocks the admin's session and the API node. Throttled async exports keep the dashboard responsive and create a paper trail (every export is one audit entry). *Citation: Stripe Dashboard exports; Notion CSV export pattern.*

### 0.8 Banglish narrative + English specs

This dashboard's user-facing copy and rationale text MAY be in Banglish (the project's narrative convention) but every endpoint path, role name, status code, JSON key, table column header, and action identifier MUST be English. Same convention as the `app-screens/*.md` source docs — see [system-concepts.md → User Roles](./system-concepts.md#user-roles).

---

## 1. Page Inventory

| #   | Page ID                | Name                            | Category           | Primary purpose                                                           | Required role(s)              | UX flow it serves                                                                                                                       |
| --- | ---------------------- | ------------------------------- | ------------------ | ------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| AD1 | `users-list`           | User Management                 | User Management    | Find / inspect / suspend / change-role / impersonate users                | `SUPER_ADMIN`                 | [`01-auth.md`](./app-screens/01-auth.md), [`07-profile.md`](./app-screens/07-profile.md)                                                |
| AD2 | `card-moderation`      | Preference Card Moderation      | Content Moderation | List public cards · review for verification · approve/reject · delete bad | `SUPER_ADMIN`                 | [`03-preference-card-details.md`](./app-screens/03-preference-card-details.md), [`05-library.md`](./app-screens/05-library.md)          |
| AD3 | `supplies-catalog`     | Supplies Master Catalog         | Configuration      | Curate the supplies catalog (incl. user-submitted custom adds)            | `SUPER_ADMIN`                 | [`04-create-preference-card.md`](./app-screens/04-create-preference-card.md)                                                            |
| AD4 | `sutures-catalog`      | Sutures Master Catalog          | Configuration      | Same as AD3, for sutures                                                  | `SUPER_ADMIN`                 | [`04-create-preference-card.md`](./app-screens/04-create-preference-card.md)                                                            |
| AD5 | `legal-pages`          | Legal Pages CMS                 | Configuration      | Author + publish Terms, Privacy, etc.                                     | `SUPER_ADMIN`                 | [`07-profile.md`](./app-screens/07-profile.md) (Legal Pages section)                                                                    |
| AD6 | `subscriptions-ops`    | Subscription Operations         | Operational        | Inspect IAP receipts · failed verifies · grant/revoke plans (manual)      | `SUPER_ADMIN`                 | [`07-profile.md`](./app-screens/07-profile.md) (Upgrade Flow + Restore Purchases)                                                       |
| AD7 | `audit-log`            | Audit Log                       | Operational        | Search / filter every admin action ever taken on user data                | `SUPER_ADMIN`                 | Cross-cutting (every other admin page writes here)                                                                                      |
| AD8 | `operational`          | Operational Dashboard           | Operational        | Platform health: FCM delivery, socket connections, IAP failure rate, etc. | `SUPER_ADMIN`                 | [`08-notifications.md`](./app-screens/08-notifications.md) (FCM/Socket channels imply observability needs)                              |
| AD9 | `analytics`            | Analytics Overview              | Analytics          | Business-level KPIs: DAU, signups, card creation, subscription funnel     | `SUPER_ADMIN`                 | All app-screens (every user action eventually lands as an analytic)                                                                     |

---

## 2. Per-Page Specs

---

### AD1. User Management — `/admin/users`

- **Purpose**: Find / inspect / suspend / change-role / force-logout / impersonate user accounts.
- **Why necessary**: User UX exposes account states `RESTRICTED / INACTIVE / DELETED` (see [`01-auth.md` → Account Restricted](./app-screens/01-auth.md#account-restricted-or-inactive-login)) and references *"contact support"* — but no support workflow exists in `app-screens/` to get them out of that state. Without this page, *"my account is locked"* tickets are unanswerable except via direct DB access (no audit, no permission gate). Forced-logout + role changes from password-reset flow ([`01-auth.md` → Forgot Password Flow](./app-screens/01-auth.md#forgot-password-flow)) similarly require an admin-facing surface for *"reset another user's session"*.
- **Primary user(s)**: `SUPER_ADMIN`.
- **Data displayed**:
  - **Table columns**: `userId`, `name`, `email`, `phone`, `country`, `role`, `status`, `verified`, `subscriptionPlan`, `createdAt`, `lastSeenAt`.
  - **Detail panel** (slide-over on row click):
    - Identity block (avatar, name, email, phone, country, hospital, specialty).
    - Account section (`status`, `role`, `verified`, `tokenVersion`, `createdAt`, `updatedAt`).
    - Active sessions / devices list (from `Device` collection — `01-auth.md § Device & FCM token lifecycle`): `deviceId`, `platform`, `registeredAt`, `lastSeenAt`, `Force unregister` button per row.
    - Subscription block (current plan, interval, status, `expiresAt`, manual-grant override toggle → links to AD6).
    - Recent activity timeline (last N audit entries where `targetUserId = this user`).
- **UI sections**:
  1. Header (title + total count + `+ Invite admin` page-level action).
  2. Filter bar (chips: `role`, `status`, `verified`, `subscriptionPlan`, `createdAt` range).
  3. Search (full-text on `email` + `name` + `phone`).
  4. Table (page-based pagination — admin tables stay bounded under 10K rows in this product).
  5. Detail panel.
  6. Empty (filtered): *"No users match these filters. Clear filters."*
- **Filters & search**:
  - Filters: `role` (`USER` / `SUPER_ADMIN`), `status` (`ACTIVE` / `RESTRICTED` / `INACTIVE` / `DELETED`), `verified` (true / false), `subscriptionPlan` (`FREE` / `PREMIUM` / `ENTERPRISE`), `createdAt` range, `lastSeenAt` range.
  - Search: full-text on `email`, `name`, `phone`.
- **Actions**:
  - **Per-row** (kebab):
    - `view` → opens detail panel.
    - `change-status` (sets `status` ∈ {`ACTIVE`, `RESTRICTED`, `INACTIVE`}; mirrors the user-side `403` state).
    - `change-role` (USER ↔ SUPER_ADMIN; **2FA gate required**).
    - `force-logout` (bumps server-side `tokenVersion` — every device on that account hits `01-auth.md § Session Expired` on next refresh).
    - `unregister-device` (per-device row action inside detail panel).
    - `impersonate` (a.k.a. *"View as user"* — opens the mobile app web wrapper as that user; **2FA gate + reason required**).
    - `soft-delete` (sets `status = DELETED`; data preserved 30 days then hard-deleted via background job).
  - **Bulk**:
    - `export-csv` (audit-logged, rate-limited).
    - `bulk-suspend` (typing-to-confirm with the affected count).
  - **Page-level**: `+ Invite admin` (sends invite email; creates user with `role = SUPER_ADMIN` on acceptance).
- **Permissions** (RBAC matrix):

  | Action                  | `SUPER_ADMIN` |
  | ----------------------- | :-----------: |
  | view                    | ✅            |
  | change-status           | ✅ + audit    |
  | change-role             | ✅ + 2FA + audit |
  | force-logout            | ✅ + audit    |
  | unregister-device       | ✅ + audit    |
  | impersonate             | ✅ + 2FA + reason + audit |
  | soft-delete             | ✅ + typing-to-confirm + audit |
  | bulk-suspend            | ✅ + typing-to-confirm + audit |
  | export                  | ✅ + audit + rate-limited |
  | + Invite admin          | ✅ + audit    |

  > **Why the 2FA gate on impersonate / change-role**: impersonation lets the admin act as the user, which can read private cards, draft events on their calendar, even initiate IAP flow. Without a separate authentication step (TOTP / hardware key), a stolen admin session = full account takeover of every user. Same with role-elevation. *Citation: OWASP ASVS V2.7 — re-authentication for sensitive ops.*

- **Edge cases & states**:
  - **Loading**: skeleton table (10 rows).
  - **Empty (no users yet)**: *"No users yet."* (production unlikely; only on a fresh install).
  - **Empty (filtered)**: *"No users match these filters. Clear filters."*
  - **Suspended user**: row tinted red, `status` badge red, available actions `change-status` (to ACTIVE), `force-logout`, `view`.
  - **Deleted user**: hidden by default; toggle *"include deleted"* shows them with `deletedAt` timestamp; row read-only; only `view` action available.
  - **User with no devices**: detail panel devices list shows *"No devices registered."* (FCM push won't deliver — useful diagnostic for *"I'm not getting notifications"* support tickets per [`08-notifications.md`](./app-screens/08-notifications.md)).
- **Cross-references**: serves [`01-auth.md` → Account Restricted](./app-screens/01-auth.md#account-restricted-or-inactive-login) (admins resolve the lock); related: AD7 `audit-log` (filter by `targetUserId`), AD6 `subscriptions-ops` (subscription detail shortcut).

> **Why this page**: support tickets *"my account is locked"*, *"I can't log in"*, *"I'm not getting push notifications"*, *"please delete my data (GDPR)"* are unanswerable without it. Without admin user-search, support reverts to direct DB access — which has no audit trail and no permission gate.

---

### AD2. Preference Card Moderation — `/admin/preference-cards`

- **Purpose**: List published preference cards · review submissions for verification · approve / reject / delete cards that violate policy.
- **Why necessary**: User UX includes:
  - **Verification**: `verificationStatus = VERIFIED` is a filter on [`05-library.md` → Filtering](./app-screens/05-library.md#filtering). Verification is decision-driven, not automatic — someone has to make the call.
  - **Admin delete**: [`03-preference-card-details.md § View Card Details`](./app-screens/03-preference-card-details.md#view-card-details) explicitly states *"Delete button (owner / `SUPER_ADMIN` hole)"* — so the admin surface is presumed to exist.
  - **Quality control**: catalog grows by users adding free-text supplies / sutures (`04-create-preference-card.md`), so card content quality drifts unless reviewed.
  Without this page, verified-only filtering on Library yields zero results forever, and bad-content cards stay public.
- **Primary user(s)**: `SUPER_ADMIN`. (See §7 Q1 — a dedicated `MODERATOR` sub-role is plausible but not in source docs.)
- **Data displayed**:
  - **Table columns**: `cardId`, `cardTitle`, `surgeon.fullName`, `surgeon.specialty`, `verificationStatus`, `published`, `ownerId` (clickable → AD1 detail panel), `downloadCount`, `favoriteCount`, `createdAt`.
  - **Detail panel** (slide-over on row click):
    - Header (title, owner avatar + name, status badges).
    - Full clinical sections (medication, supplies + qty, sutures + qty, instruments, positioning, prepping, workflow, key notes) — same shape as `03-preference-card-details.md`.
    - Photo strip (max 5 thumbnails, click for full-size).
    - Verification panel: current status + history (who verified / who rejected / when, with reason text), approve / reject buttons.
    - Delete button (typing-to-confirm).
- **UI sections**:
  1. Header (title + total count + filter chips overview).
  2. Tabs: `All` / `Pending verification` / `Verified` / `Rejected` / `Drafts` (admin-visible only). Default: `Pending verification`.
  3. Filter bar: `verificationStatus`, `specialty` (from `GET /preference-cards/specialties`), `published`, `ownerId` (clickable filter from AD1), `createdAt` range, `downloadCount` >= N.
  4. Search (full-text on `cardTitle` + `surgeon.fullName`).
  5. Table.
  6. Detail panel.
- **Filters & search**:
  - Filters: `verificationStatus` (`PENDING`/`VERIFIED`/`REJECTED`), `specialty`, `published`, `ownerId`, `createdAt` range, `downloadCount` threshold.
  - Search: full-text on `cardTitle` + `surgeon.fullName`.
- **Actions**:
  - **Per-row** (kebab): `view` (open panel), `verify` (sets `verificationStatus = VERIFIED`), `reject` (sets `verificationStatus = REJECTED`, requires reason), `delete` (typing-to-confirm), `view-owner` (deep-link to AD1).
  - **Bulk**: `bulk-verify` (typing-to-confirm), `bulk-reject` (requires reason; typing-to-confirm), `export-csv`.
  - **Page-level**: none (admin doesn't create cards).
- **Permissions** (RBAC matrix):

  | Action      | `SUPER_ADMIN` |
  | ----------- | :-----------: |
  | view        | ✅            |
  | verify      | ✅ + audit    |
  | reject      | ✅ + reason + audit |
  | delete      | ✅ + typing-to-confirm + audit (record full snapshot in `before`) |
  | bulk-verify | ✅ + typing-to-confirm + audit |
  | bulk-reject | ✅ + reason + typing-to-confirm + audit |
  | export      | ✅ + audit + rate-limited |

- **Edge cases & states**:
  - **Empty (no cards yet)**: *"No cards have been created yet."*
  - **Empty (Pending tab, none pending)**: *"All caught up — no cards waiting for verification."*
  - **Card already deleted by owner**: row stays in audit log but disappears from this list. AD7 audit-log shows the soft-delete event.
  - **Drafts tab**: drafts (`published: false`) visible to admin even though hidden from `GET /preference-cards`. Read-only — admins should NOT publish drafts on the user's behalf (consent boundary).
- **Cross-references**: [`05-library.md` → Filtering](./app-screens/05-library.md#filtering) consumes `verificationStatus`. [`03-preference-card-details.md`](./app-screens/03-preference-card-details.md) shows the delete affordance the admin uses.

> **Why this page**: a `verificationStatus = VERIFIED` filter without an admin verify-action is dead UX. And without an admin delete-card path for inappropriate content, the platform has no recourse against bad submissions. Both are load-bearing: verified cards are a paid-tier value driver, and content moderation is a baseline platform responsibility.

---

### AD3. Supplies Master Catalog — `/admin/supplies`

- **Purpose**: Curate the supplies master catalog. Merge duplicates, edit names, delete bad entries, bulk-import seed data.
- **Why necessary**: [`04-create-preference-card.md § Create Card → step 9`](./app-screens/04-create-preference-card.md#create-card) supplies typeahead has a `+ Add "X" as custom` affordance — every user who types an unknown supply name implicitly creates a row. Without admin curation:
  - The catalog accumulates duplicates (`"4-0 silk"`, `"silk 4-0"`, `"4 0 silk"`).
  - Typos pollute the typeahead (`"sutere"`, `"forsep"`).
  - There's no way to retire deprecated items.
  This page is the cleanup surface.
- **Primary user(s)**: `SUPER_ADMIN`.
- **Data displayed**:
  - **Table columns**: `supplyId`, `name`, `usageCount` (how many cards reference it), `createdBy` (`system` / userId of the user who custom-added it), `createdAt`.
  - **Detail panel**: full record + list of cards using this supply (read-only, click to AD2).
- **UI sections**:
  1. Header (title + total count + `+ Add supply` + `Bulk import CSV`).
  2. Filter bar: `createdBy` (`system` / `user`), `usageCount` (`= 0` to find orphans, `≥ 5` for hot items).
  3. Search (full-text on `name`).
  4. Table.
  5. Detail panel.
- **Filters & search**:
  - Filters: `createdBy`, `usageCount` threshold.
  - Search: full-text on `name`.
- **Actions**:
  - **Per-row** (kebab): `edit-name`, `merge-into-other` (promote one duplicate as canonical, rewrite all referencing cards' `supplies[].supplyId`), `delete` (only if `usageCount = 0`; otherwise must merge first).
  - **Bulk**: `bulk-delete` (only zero-usage rows; typing-to-confirm), `bulk-import-csv` (page-level), `export-csv`.
  - **Page-level**: `+ Add supply`, `Bulk import CSV`.
- **Permissions** (RBAC matrix):

  | Action            | `SUPER_ADMIN` |
  | ----------------- | :-----------: |
  | view              | ✅            |
  | edit-name         | ✅ + audit (logs `before.name` / `after.name`) |
  | merge             | ✅ + audit (logs source + target IDs + count of cards rewritten) |
  | delete (`usage = 0`) | ✅ + audit |
  | bulk-delete       | ✅ + typing-to-confirm + audit |
  | bulk-import       | ✅ + audit (logs filename + row count) |
  | + Add supply      | ✅ + audit    |
  | export            | ✅ + audit + rate-limited |

- **Edge cases & states**:
  - **Delete blocked by usage**: button disabled with tooltip *"This supply is used by 12 cards. Merge into another supply first."* + Merge shortcut.
  - **Merge target = source**: form validation rejects with *"Pick a different supply to merge into."*
  - **Bulk import partial failure**: row-level errors shown in a results modal; successful rows committed, failed rows downloadable as a CSV diff.
- **Cross-references**: AD2 card moderation (verifies cards reference clean catalog entries); user-side [`04-create-preference-card.md`](./app-screens/04-create-preference-card.md) consumes the catalog via `GET /supplies`.

> **Why this page**: a self-grow catalog *needs* a curator. Without periodic cleanup, the typeahead degrades into a graveyard of typos and the user UX *"+ Add 'X' as custom"* affordance creates a slow leak of duplicate entries. Refusing to curate doesn't make the problem go away — it just makes the typeahead worse for every new user.

---

### AD4. Sutures Master Catalog — `/admin/sutures`

- **Purpose**: Identical structure to AD3, scoped to sutures.
- **Why necessary**: Same as AD3 — `04-create-preference-card.md § step 10` mirrors the `+ Add "X" as custom` typeahead pattern for sutures.
- **Primary user(s)**: `SUPER_ADMIN`.
- **Data displayed / UI sections / Filters & search / Actions / Permissions / Edge cases**: same as AD3, replace `supplies` → `sutures`, `supplyId` → `sutureId`. (Future v2: sutures may gain `material`, `gauge`, `length` fields — at that point, this catalog diverges from supplies. Today they're symmetric.)
- **Cross-references**: AD2 card moderation; user-side [`04-create-preference-card.md`](./app-screens/04-create-preference-card.md).

> **Why a separate page from AD3**: in v1 they're symmetric, but the medical domain treats supplies and sutures as different entities with different attributes (sutures have material, gauge, absorption profile). Sharing one polymorphic page now would create a refactor cliff later. *Citation: Domain-Driven Design § Bounded Contexts.*

---

### AD5. Legal Pages CMS — `/admin/legal-pages`

- **Purpose**: Author and publish legal documents (Terms of Service, Privacy Policy, Cookie Policy, etc.) that the user reads on [`07-profile.md § Legal Pages`](./app-screens/07-profile.md#legal-pages).
- **Why necessary**: User app calls `GET /legal` and `GET /legal/:slug`. If no admin surface exists to author them, the response is empty and [`07-profile.md § Legal Content Missing`](./app-screens/07-profile.md#legal-content-missing) fires permanently — a compliance failure (App Store / Play Store both *require* a Privacy Policy URL).
- **Primary user(s)**: `SUPER_ADMIN`. Long-term: a `LEGAL_AUTHOR` role with edit-only-not-delete permissions is plausible (out of scope for v1).
- **Data displayed**:
  - **Table columns**: `slug`, `title`, `published`, `version`, `updatedAt`, `updatedBy`.
  - **Detail panel**: full editor with Markdown / WYSIWYG toggle; preview pane.
- **UI sections**:
  1. Header (title + `+ New legal page`).
  2. Table.
  3. Detail panel = editor.
- **Filters & search**:
  - Filters: `published`.
  - Search: full-text on `title` + `slug`.
- **Actions**:
  - **Per-row** (kebab): `edit`, `publish` (sets `published: true`), `unpublish`, `delete` (typing-to-confirm), `view-version-history`.
  - **Bulk**: none. Each legal page is sensitive — bulk ops are an anti-pattern here.
  - **Page-level**: `+ New legal page`.
- **Permissions** (RBAC matrix):

  | Action       | `SUPER_ADMIN` |
  | ------------ | :-----------: |
  | view         | ✅            |
  | edit         | ✅ + audit (snapshot before + after)    |
  | publish      | ✅ + audit    |
  | unpublish    | ✅ + audit    |
  | delete       | ✅ + typing-to-confirm + audit (full snapshot) |
  | view-version-history | ✅    |
  | + New legal page | ✅ + audit |

- **Edge cases & states**:
  - **Empty (no legal pages)**: *"No legal documents published yet. Tap '+ New legal page' to create your first one. Required for App Store / Play Store compliance."* (banner reinforces the urgency).
  - **Unpublished page**: row tinted yellow, badge *Draft*; user app does not see drafts (`GET /legal` filters by `published: true`).
  - **Slug collision**: form validation rejects on save with *"A page with this slug already exists. Pick a different slug or edit the existing page."*
  - **Version history**: every save creates a new immutable version row. `view-version-history` shows a diff; rollback writes a new version (no destructive overwrite).

> **Why version history is non-negotiable**: Terms / Privacy changes have legal weight. *"What were our terms on 2025-11-01?"* must be answerable years later (litigation, regulator request). Single-row mutable storage destroys that audit trail. Version-on-write is the only safe shape. *Citation: GDPR Art. 30 (record of processing); legal industry standard for ToS versioning.*

---

### AD6. Subscription Operations — `/admin/subscriptions`

- **Purpose**: Inspect subscription state across the user base. Triage failed IAP receipt verifications. Manually grant / revoke plans (e.g. comp-ed Premium for partners, refund-driven downgrades).
- **Why necessary**: [`07-profile.md`](./app-screens/07-profile.md) shows two write paths into `Subscription`:
  - **Upgrade Flow** (`POST /subscriptions/verify-receipt` from IAP) — failures fall into [Receipt Verification Failed](./app-screens/07-profile.md#receipt-verification-failed) which has a *"contact support"* implication.
  - **Restore Purchases** — same endpoint, different trigger.
  Without this page, *"my upgrade didn't go through"* tickets hit a dead end. Refunds on Apple/Google's side don't auto-sync — they're webhook-driven (per `07-profile.md § Endpoints Used` note: *"Subscription renewal/cancel synchronization webhook-driven"*) — so a webhook misfire silently breaks a user's plan.
- **Primary user(s)**: `SUPER_ADMIN`.
- **Data displayed**:
  - **Table columns**: `subscriptionId`, `userId`, `plan` (`FREE`/`PREMIUM`/`ENTERPRISE`), `status` (`ACTIVE`/`EXPIRED`/`CANCELLED`/`PENDING_VERIFICATION`/`VERIFICATION_FAILED`), `interval`, `platform` (`ios`/`android`), `expiresAt`, `lastVerifiedAt`.
  - **Detail panel**: subscription record + receipt history (every `verify-receipt` call attempt with timestamp, response status, raw error if any) + manual-action log.
- **UI sections**:
  1. Header (title + total count).
  2. Tabs: `All` / `Active` / `Failed verification` / `Cancelled in last 30d` / `Manual grants`. Default: `Failed verification` (highest-priority triage queue).
  3. Filter bar: `plan`, `status`, `platform`, `expiresAt` range.
  4. Search (by `userId` or user `email` — typeahead joins to AD1).
  5. Table.
  6. Detail panel.
- **Filters & search**:
  - Filters: `plan`, `status`, `platform`, `expiresAt` range, `interval`.
  - Search: by `userId`, `email`, or `originalTransactionId` (Apple) / `purchaseToken` (Google).
- **Actions**:
  - **Per-row** (kebab):
    - `view` (open panel + receipt history).
    - `retry-verification` (re-fires `POST /subscriptions/verify-receipt` server-side with cached receipt; useful when the failure was a transient store-side outage).
    - `manual-grant` (override `plan` + `expiresAt`; reason + duration required).
    - `revoke` (cancel manual grant; reason required).
  - **Bulk**: `export-csv`.
  - **Page-level**: none.
- **Permissions** (RBAC matrix):

  | Action             | `SUPER_ADMIN` |
  | ------------------ | :-----------: |
  | view               | ✅            |
  | retry-verification | ✅ + audit    |
  | manual-grant       | ✅ + 2FA + reason + audit (logs duration + reason) |
  | revoke             | ✅ + reason + audit |
  | export             | ✅ + audit + rate-limited |

  > **Why 2FA gate on manual-grant**: it's a financial primitive. A compromised admin session could grant `ENTERPRISE` lifetime to an attacker's account. Re-auth gate forces explicit intent. *Citation: PCI-DSS-style separation of duties for billing operations.*

- **Edge cases & states**:
  - **Empty (no subscriptions yet)**: *"No subscription activity yet."*
  - **Empty (Failed verification, none failed)**: *"No failed verifications. All payments are processing cleanly."*
  - **Manual grant with subsequent IAP**: detail panel shows merged history; the IAP record takes precedence (overrides manual `expiresAt`).
  - **Revoke an IAP-backed plan**: blocked with tooltip *"This plan is IAP-backed. The user must cancel through the App Store / Play Store. Manual revoke would re-grant on next refresh from store webhook."* (Apple/Google source-of-truth wins.)
- **Cross-references**: [`07-profile.md → Receipt Verification Failed`](./app-screens/07-profile.md#receipt-verification-failed) (the user-side dead end this page resolves); AD1 user detail panel (subscription card links here).

> **Why this page**: subscriptions are the only revenue surface in this product. A single failed receipt verification = a paying customer with no perks = a churn risk. Without this page, support has no triage tool and *"I paid but it didn't work"* tickets escalate to engineering — a dollar-per-ticket cost the page eliminates.

---

### AD7. Audit Log — `/admin/audit-log`

- **Purpose**: Search / filter / export every administrative action ever taken on user data.
- **Why necessary**: §0.5 mandates audit-logging for sensitive actions. Without a search surface, the log exists but is invisible — incident response (*"who suspended this user yesterday?"*), GDPR data-access requests (*"show me every action taken on subject X"*), and SOX-style compliance reviews are all impossible.
- **Primary user(s)**: `SUPER_ADMIN`. (Read-only; the log itself is append-only.)
- **Data displayed**:
  - **Table columns**: `timestamp`, `adminId` (clickable → AD1), `action`, `targetType`, `targetId` (clickable → relevant page detail), `ip`, `requestId`.
  - **Detail panel**: full log entry with `before` / `after` JSON diff rendered side-by-side.
- **UI sections**:
  1. Header (title + total count over selected range).
  2. Filter bar: `adminId`, `action` (multi-select from enum), `targetType`, `targetId`, `timestamp` range (default: last 7 days), `ip`.
  3. Search (free-text on `requestId` for incident triangulation).
  4. Table (cursor-paginated — this can grow to millions of rows).
  5. Detail panel.
- **Filters & search**:
  - Filters: `adminId`, `action`, `targetType`, `targetId`, `timestamp` range, `ip`.
  - Search: `requestId`.
- **Actions**:
  - **Per-row**: `view`, `copy-as-json`.
  - **Bulk**: `export-csv` / `export-json` (audit-logged — yes, exporting the audit log is itself audit-logged. Recursive but correct).
  - **Page-level**: none. The log is read-only by design.
- **Permissions** (RBAC matrix):

  | Action       | `SUPER_ADMIN` |
  | ------------ | :-----------: |
  | view         | ✅            |
  | export       | ✅ + audit + rate-limited (yes, this is recursive — export of the audit log writes a new audit entry) |
  | edit / delete | ❌ (collection is append-only at the DB level) |

- **Edge cases & states**:
  - **Empty (no actions in selected range)**: *"No admin actions in the selected range."* + suggestion to widen the range.
  - **Massive result set**: cursor pagination + lazy detail-panel load. Server-side query timeout fallback: *"Query took too long — narrow the range."*
  - **Tampered log row** (DB integrity check fails): row tinted red, banner at top: *"Audit-log integrity issue detected. Contact security."* (out-of-band alarm via Operational Dashboard.)

> **Why append-only at the DB level, not just the UI**: a compromised admin who can edit the log can also cover their tracks. Append-only enforced via DB collection rules + write-only DB user for the API layer is the only credible defence. *Citation: OWASP ASVS V8.5 (audit-log integrity); SANS audit-log best practices.*

---

### AD8. Operational Dashboard — `/admin/operational`

- **Purpose**: Platform health visibility — async job queues, FCM delivery, Socket.IO connection counts, IAP failure rate, login error rate, recent incidents.
- **Why necessary**: User UX has multi-channel sync ([`08-notifications.md`](./app-screens/08-notifications.md) — FCM + Socket + DB) and external-IDP integrations (IAP store webhooks per `07-profile.md`, Google / Apple auth per `01-auth.md`). All can fail silently from the user's perspective. Without operational visibility:
  - FCM token invalidations pile up (every dead device = a support ticket).
  - Socket disconnect storms (network event) go untriaged.
  - IAP webhook lag means cancellations don't reach the DB until the user complains.
- **Primary user(s)**: `SUPER_ADMIN` + on-call engineer (sometimes the same person in this product).
- **Data displayed**: a grid of widgets, NOT a table.
  - **Widget — Auth health**: login success rate (last 1 h / 24 h / 7 d), top error code (`INVALID_CREDENTIALS` / `EMAIL_NOT_VERIFIED` / `403 RESTRICTED`).
  - **Widget — FCM delivery**: pushes attempted / delivered / failed (last 1 h / 24 h); list of last 20 failures with `userId`, `deviceId`, error code.
  - **Widget — Socket connections**: current open connections, churn rate (connects/min, disconnects/min).
  - **Widget — IAP receipt-verify**: success / failure rate (last 24 h), median latency, list of last 10 failed receipts with copyable `originalTransactionId` (deep-link to AD6).
  - **Widget — Notification fan-out**: jobs in queue, oldest job age, dead-letter count + inspection deep-link.
  - **Widget — Recent incidents**: feed of admin-action errors, exception bursts, deploy markers.
- **UI sections**:
  1. Header (range selector: 1 h / 24 h / 7 d / custom).
  2. Widget grid (4 columns wide on desktop, single column on narrow).
  3. Drill-in panels (slide-over; e.g. tap an FCM failure → device detail).
- **Filters & search**: range selector at the page level applies to all widgets. Per-widget drill-in adds local filters.
- **Actions**:
  - **Per-widget** (kebab): `expand-to-table` (renders the underlying rows in a full-page table view), `export-csv`, `set-alert` (page-fires when the metric crosses a threshold).
  - **Per-failure-row in a widget**: `retry`, `discard`, `view-context` (deep-link).
- **Permissions** (RBAC matrix):

  | Action         | `SUPER_ADMIN` |
  | -------------- | :-----------: |
  | view           | ✅            |
  | retry          | ✅ + audit (record the retry + result) |
  | discard        | ✅ + reason + audit |
  | set-alert      | ✅ + audit    |
  | export         | ✅ + audit + rate-limited |

- **Edge cases & states**:
  - **All widgets healthy**: clean green panel, no panic-inducing red.
  - **Widget fails to load** (telemetry pipeline down): widget shows *"Telemetry unavailable — last successful query: 14 min ago"* — a missing-data signal, not silent zero.
  - **First-deploy / fresh install**: widgets show *"No data yet. Telemetry will populate once traffic begins."*

> **Why operational visibility is a first-class admin page** (not buried in engineering tools): in this product, admin = on-call. Engineering tools (Grafana / Datadog) are external and off-limits to non-engineers. Surfacing the load-bearing health metrics inside the same dashboard the admin already lives in cuts mean-time-to-detect for user-impacting incidents. *Citation: Stripe Sigma + Stripe Dashboard combine ops + admin for the same reason.*

---

### AD9. Analytics Overview — `/admin/analytics`

- **Purpose**: Business-level KPIs that answer *"is the platform healthy?"* — DAU / MAU, signup-to-first-card funnel, subscription conversion rate, card-creation cadence, download counts, retention curves.
- **Why necessary**: Product decisions (*"should we double down on Library? add team collaboration? raise the Premium price?"*) require evidence, not vibes. Operational alerts on AD8 answer *"is the platform up?"* — different question. This page answers *"is the platform working as a business?"*
- **Primary user(s)**: `SUPER_ADMIN` (founder / product-owner-equivalent).
- **Data displayed**: widget grid (NOT a table). Each widget answers exactly one question.
- **UI sections**:
  1. Header (range selector: 7 d / 28 d / 90 d / custom + comparison toggle vs prior period).
  2. Widget grid.
- **Widgets**:

  | Widget                                 | Business question it answers                                                       | Data source                                                |
  | -------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------- |
  | **DAU / WAU / MAU + delta**            | Is the platform growing? Are users retained?                                       | `User.lastSeenAt` events                                   |
  | **Signup → first published card funnel** | Is onboarding working? Where do users drop off?                                  | `User.createdAt` + `PreferenceCard.createdAt` per `ownerId`|
  | **Card creation rate (per active user)** | Are users *using* the product, not just opening it?                              | `PreferenceCard.createdAt` cohorted by user-active-week    |
  | **Library search → card download funnel** | Does Library deliver discovery value (paid feature)?                            | `GET /preference-cards` event log + `POST /:cardId/download`|
  | **Free → Paid conversion rate**        | Is the upgrade CTA working? Is pricing right?                                      | `Subscription.createdAt` joined to `User.createdAt`        |
  | **Subscription churn (last 30 d)**     | Are paid users staying? Where are we losing them?                                  | `Subscription.status` transitions                          |
  | **Median verified-card download count**| Is the verified-only filter actually surfacing valuable cards?                     | `PreferenceCard.downloadCount` filtered by `verificationStatus` |
  | **Notification engagement rate**       | Are we sending too many notifications? Are users muting them?                      | `notification.delivered` vs `notification.read` ratios     |

- **Filters & search**: range selector + comparison-period toggle. Per-widget drill-in (e.g. *"show me the signups from this cohort"*) opens AD1 with the cohort filter pre-applied.
- **Actions**:
  - **Per-widget** (kebab): `export-csv`, `pin-to-overview` (favorited widgets show on the dashboard home).
- **Permissions** (RBAC matrix):

  | Action     | `SUPER_ADMIN` |
  | ---------- | :-----------: |
  | view       | ✅            |
  | export     | ✅ + audit + rate-limited |
  | pin        | ✅ (preference, not audit-worthy) |

- **Edge cases & states**:
  - **Cold start (no data)**: each widget shows *"Insufficient data — needs at least N {users / cards / events} in the selected range."*
  - **Comparison-period unavailable**: e.g. user picks 7 d and the platform is only 3 d old; show the absolute number and disable the delta with a tooltip *"Not enough history for comparison."*

> **Why every widget names its question explicitly**: vanity metrics (*"Total users: 12,453"*) are emotionally satisfying and operationally useless. *"DAU vs 28 days ago: +12%"* tells a story. The discipline of *"what question does this widget answer?"* is the only filter that reliably keeps an analytics page useful instead of a slow-loading wall of numbers. *Citation: Andy Grove, *High Output Management*; Lean Analytics § *One Metric That Matters*.*

---

## 3. Admin Workflows

### Card Verification Flow

1. User publishes a card via [`04-create-preference-card.md`](./app-screens/04-create-preference-card.md) (`published: true`). Server stamps `verificationStatus = PENDING`.
2. `SUPER_ADMIN` opens AD2 → tab `Pending verification`. Sorted by `createdAt` ascending (oldest first — fairness).
3. Admin clicks a row → detail panel → reviews clinical content + photos.
4. Admin clicks `verify` → server sets `verificationStatus = VERIFIED`; user-side Library filter now surfaces the card.
5. Audit log entry: `{ adminId, action: "card.verify", targetType: "PreferenceCard", targetId, before: { verificationStatus: "PENDING" }, after: { verificationStatus: "VERIFIED" }, timestamp }`.

### Suspect-User Suspension Flow

1. Signal source: AD8 Operational Dashboard surfaces an auth-error spike from one `userId`, OR a support ticket arrives.
2. `SUPER_ADMIN` opens AD1 → searches `userId` or email.
3. Detail panel → reviews recent activity + active devices.
4. Action `change-status` → `RESTRICTED` with reason + (optional) `force-logout` to kill all device sessions immediately.
5. User-side: next API call hits `403` → [`01-auth.md → Account Restricted`](./app-screens/01-auth.md#account-restricted-or-inactive-login) shows *"Your account is restricted. Contact support."*
6. Audit log entries: one for `change-status`, one for `force-logout` (both with `before` / `after` snapshots).

### Failed-Receipt Triage Flow

1. AD8 widget *"IAP receipt-verify"* shows a failure spike.
2. Admin opens AD6 → tab `Failed verification`.
3. Picks a row → detail panel → reads the raw store-side error.
4. Decision:
   - **Transient (network / store outage)** → click `retry-verification`. Audit-logged.
   - **Receipt actually invalid** → contact the user via support email (out-of-app); explain refund vs re-purchase; do NOT manually-grant unless verified.
   - **Webhook missed** → reconcile via `retry-verification`; if still fails, escalate to engineering.
5. Audit log entry on every retry / manual-grant / revoke.

---

## 4. Moderation Flows

### Card Moderation (admin-initiated only)

> **Note**: User-to-user reporting is NOT documented in `app-screens/`. This flow is admin-initiated only — see §7 Q4 for whether user reporting is in scope.

1. **Trigger**: admin notices a problematic card via AD2 browse, OR a support email arrives, OR an external complaint (DMCA, compliance flag).
2. **Review**: admin opens AD2 detail panel → reads card + checks owner's `User` history (link to AD1).
3. **Action**:
   - `verify` (no issue, mark verified).
   - `reject` (sets `verificationStatus = REJECTED` + reason; user-side: card stays public but loses verified badge — see §7 Q3 for whether rejection should also unpublish).
   - `delete` (typing-to-confirm; full snapshot logged in `before` for restoration).
4. **Notifier**: optional follow-up email to owner *"Your card was removed because [reason]"* — out of scope for v1 unless user-comms infra exists.
5. **Audit**: every action writes to AD7.

> **Why admin-initiated only in v1**: the user app has no *"Report this card"* affordance documented in `app-screens/` (search returns no Report button across all 8 files). Adding a report queue without a corresponding user-side reporting flow creates a UX gap. Either both exist or neither does. *See §7 Q4.*

---

## 5. Operational Flows

### Async job + queue health

- AD8 Operational Dashboard surfaces queue depth + dead-letter count.
- Notification fan-out, FCM delivery, IAP webhook ingestion — each is implied by user UX and assumed to be a discrete job queue.
- **Dead-letter inspection**: AD8 widget → click → expanded table → per-row actions: `retry`, `discard` (reason required), `send-to-engineer` (creates an internal ticket / Slack post — implementation outside this spec).

### FCM token rotation

- Per [`01-auth.md § Device & FCM token lifecycle`](./app-screens/01-auth.md#device--fcm-token-lifecycle): `POST /devices/register` is idempotent + called on FCM `onTokenRefresh`.
- Admin visibility: AD1 detail panel → devices list → `lastSeenAt` per device. Stale rows (>30 d unseen) flagged. Admin can `unregister-device` to force the user-side app to re-register on next foreground.

### Feature flags

- Out of scope for v1 — no flagging UX in source docs. Listed for completeness; revisit when a flag system exists.

---

## 6. Analytics Requirements

(All widgets are documented inline in AD9 §2. This section restates the discipline.)

Every widget on AD9 names the business question it answers. No widget exists without one. *"Total users"* alone is rejected; *"DAU vs 28 d ago"* is accepted. The question is the gate.

---

## 7. Open Questions

These are gaps in the source UX (`app-screens/*.md`) that block a final admin spec. Each answer materially changes a page or permission matrix.

- **Q1 `[NEEDS INFO]`** — *(RBAC roles)* Source docs only define `USER` and `SUPER_ADMIN` ([`01-auth.md`](./app-screens/01-auth.md), [`03-preference-card-details.md`](./app-screens/03-preference-card-details.md)). Should there be a `MODERATOR` sub-role with limited scope (verify cards + suspend users, but no role-elevation, no IAP grants, no legal CMS), or is a single `SUPER_ADMIN` role sufficient for v1? **Blocks**: every RBAC matrix in §2; affects whether `MODERATOR` columns are added. **`[ANS: ]`**

- **Q2 `[NEEDS INFO]`** — *(Catalog auto-grow policy)* Per [`04-create-preference-card.md § step 9-10`](./app-screens/04-create-preference-card.md#create-card), users custom-add supplies / sutures via typeahead. Should:
  - **(A)** auto-create on submit (current implication) → AD3/AD4 are pure cleanup tools; OR
  - **(B)** queue submissions for admin approval first (`status = PENDING_APPROVAL` on the catalog row, hidden from other users' typeaheads until approved)?
  **Blocks**: AD3/AD4 page — option (B) adds a `Pending` tab and changes the moderation surface. **`[ANS: ]`**

- **Q3 `[NEEDS INFO]`** — *(Card rejection semantics)* When admin sets `verificationStatus = REJECTED` on AD2:
  - **(A)** card stays public but unverified (current implication); OR
  - **(B)** card is auto-unpublished (`published: false`) — admin-driven takedown; OR
  - **(C)** soft-delete entirely (`status: DELETED`).
  **Blocks**: AD2 reject action behaviour + audit-log payload + user-notification copy. **`[ANS: ]`**

- **Q4 `[NEEDS INFO]`** — *(User-to-user content reporting)* The user app has no *"Report this card"* affordance in any of the 8 `app-screens/*.md` files. Does this feature exist (or is it planned) — i.e. should AD2 expose a *"reported by N users"* column + a Reports tab? Or is moderation strictly admin-initiated for v1?
  **Blocks**: AD2 schema (Report collection presence), surface (Reports tab), and §4 Moderation Flows. **`[ANS: ]`**

- **Q5 `[NEEDS INFO]`** — *(Refund flow)* IAP refunds happen in two places: (a) Apple/Google's stores (user-initiated) which webhook back to our subscription; (b) our admin manual-revoke + parallel store-side refund. Does the platform offer **in-app admin-initiated refund** (route money back via the store API), or is refund handling delegated to the store entirely (admin only adjusts our DB state to match)? **Blocks**: AD6 refund action presence + permission gate. **`[ANS: ]`**

- **Q6 `[NEEDS INFO]`** — *(User-comms infrastructure)* Several admin actions imply outbound email to users: card-rejected notice, account-suspended notice, password-reset confirmation. Does an admin-side "send notice to user" template / infrastructure exist? If yes, AD2/AD1 grow a `Notify user` button; if no, that's a v2 feature and for v1 the admin sends email out-of-band. **Blocks**: AD1/AD2 action surface + audit-log scope (notify-user is itself audit-worthy). **`[ANS: ]`**

---

## 8. Suggested Next Steps

1. Resolve **§7 Q1–Q6** before downstream work — Q1 (RBAC sub-role) and Q4 (user-to-user reporting) materially change the page count and shape.
2. Reconcile this spec against [`dashboard-screens/`](./dashboard-screens/) (the existing admin UX docs not read in this pass). Specifically: this spec was derived strictly from `app-screens/`; cross-check which pages here already exist as `dashboard-screens/*.md` — likely candidates: User Management (AD1), Preference Card Management (AD2), Legal Management (AD5), Supplies Management (AD3), Sutures Management (AD4). Merge or reconcile to avoid parallel doc layers.
3. Run the **API Designer & Mentor — Brownfield** template scoped to admin endpoints — every page's data + actions need backing API endpoints. The existing `modules/*.md` should already cover the user-side; admin-only routes (verify card, manual-grant subscription, audit-log query, etc.) need their own module entries.
4. Database design: this spec implies `AuditLog`, `LegalPageVersion` (for history), and possibly `Report` (Q4) collections; plus indexes on every filter/search column in §2.
5. Hand the spec to UI/UX for high-fidelity mocks — §2 sections describe layout but not pixels.

---

## Note on scope

This spec was generated **strictly from `app-screens/`** at the user's instruction. The sibling folder [`dashboard-screens/`](./dashboard-screens/) contains 7 existing admin UX docs (admin auth, overview, user management, preference-card management, legal, supplies, sutures) that were intentionally NOT read in this pass. Expect overlap with this document; reconciling the two layers is step 2 of §8.
