# Database Audit Report

> **Audit Date:** 2026-04-09
> **Reviewed By:** AI (nosql-mongoose-expert skill)
> **Total Models Reviewed:** 12 (User, PreferenceCard, Subscription, Payment, StripeAccount, Notification, Event, Supply, Suture, Legal, ResetToken, ScheduledNotification)

---

## Summary

Overall database ta functional ache — N+1 query nai, $where use hoy nai, QueryBuilder pattern consistently follow kora hoyeche. Kintu kisu **critical type inconsistency** ache (String vs ObjectId), **dangling model references** ache (Payment model Task/Bid ke reference kore ja exist kore na), ar **lean() almost kothao use hoy nai** read-only queries te. Production e ekhon cholbe, but scale korte gele ar data integrity protect korte gele fix korte hobe.

---

## 📊 Score: 62/100

| Category | Score | Max | Notes |
|---|---|---|---|
| Schema Design (embed vs ref, patterns, cardinality) | 17 | 25 | Surgeon embed kora valo, kintu String vs ObjectId mismatch onek jaygay, Notification e duplicate legacy+new fields, Payment e non-existent model references |
| Indexing Strategy | 13 | 20 | Payment e valo indexes ache, kintu Event e kono index nai, ResetToken e TTL index miss, kisu low-cardinality field e unnecessary index |
| Data Integrity & Types (ObjectId, enums, validators) | 11 | 20 | createdBy/userId String hisebe store hocche ObjectId er jaygay — 3 ta model e same mistake. Enum inconsistency (uppercase vs lowercase status values) |
| Performance & Scalability (unbounded arrays, pagination, N+1) | 14 | 20 | N+1 nai — eta valo. Kintu lean() almost kothao nai, pagination skip/limit based — large dataset e slow hobe |
| Mongoose Best Practices (lean, select, timestamps, hooks) | 7 | 15 | timestamps sobkhanei ache — valo. Kintu lean() 2 ta jaygay chara kothao nai, select() use ache but inconsistent. Password hashing hook e — eta theek ache |
| **TOTAL** | **62/100** | 100 | |

**Grade:** C (60-74)
**Honest Summary:** Functional but mid-level quality — type safety er significant gap ache, lean() missing almost everywhere, ar Payment model e ghost references ache ja production e error throw korbe populate() korar somoy.

---

## ✅ Ja Valo Ache

- **N+1 pattern nai** — `user.service.ts` e bulk `$in` lookup use kora hoyeche subscription ar card count er jonno, loop e individual query nai. Eta genuinely valo engineering.
- **QueryBuilder consistently use hoyeche** — sobkhanei pagination, filtering, sorting abstracted. Manual skip/limit sudhu aggregation pipeline e (doctor.service.ts).
- **Surgeon embedding** — PreferenceCard e surgeon info embed kora hoyeche sub-schema hisebe (`_id: false`). Eta correct — surgeon data independently access laage na, always card er sathe dekha hoy.
- **select() use onek jaygay ache** — field projection consistently kora hoyeche, unnecessary data fetch hocche na mostly.
- **timestamps: true sobkhanei** — every single model e ache. Kono exception nai.
- **Supply/Suture bulk resolution** — `resolveMixedItemsWithQuantity` function e `$in` diye bulk lookup kore, loop e individual query na. Smart approach.
- **ScheduledNotification er compound indexes** — `{scheduledFor: 1, status: 1}` ar `{recipients: 1, status: 1}` — named indexes, ESR rule follow kora.

---

## ⚠️ Issue List

### 🔴 Critical

- **String vs ObjectId Mismatch — 3 ta model e** (`preference-card.model.ts`, `event.model.ts`, `notification.model.ts`)
  - **Ki problem:** `createdBy`, `userId`, ar Notification er `userId` field gulo `String` type diye define kora — kintu egulo actually User er `_id` reference. MongoDB internally ObjectId store kore, String store korle type mismatch hoy — `$lookup` ar manual join e match hobe na properly, populate() o kaj korbe na eshob field e.
  - **Ki korte hobe:** Ei 3 ta field ke `Schema.Types.ObjectId` with `ref: 'User'` banate hobe. Interface file e `Types.ObjectId` type dite hobe.
  - **Keno important:** Data integrity er core issue — join/lookup fail korbe, query filter e inconsistent result ashbe. Existing data migration o lagbe (string to ObjectId convert).

- **Dangling Model References — Payment model** (`src/app/modules/payment/payment.model.ts`)
  - **Ki problem:** Payment schema te `taskId` field `ref: 'Task'` ar `bidId` field `ref: 'Bid'` use kore — kintu **Task ar Bid model exist kore na** ei codebase e. Kono `task.model.ts` ba `bid.model.ts` file nai.
  - **Ki korte hobe:** Decide koro — (a) jodi Task/Bid system plan e ache, create koro; (b) jodi legacy code, remove koro field gulo ar related statics (`getPaymentsByTask`, `getPaymentsByBid`). Ekhon ei populate() call gulo silently fail korbe ba error throw korbe.
  - **Keno important:** Runtime error hobe jokkhon keu payment populate korbe `taskId` ba `bidId` diye. Dead code maintenance overhead o barhacche.

- **ResetToken TTL Index Missing** (`src/app/modules/auth/resetToken/resetToken.model.ts`)
  - **Ki problem:** `expireAt` field ache but kono TTL index nai. Manual cleanup laage expired tokens delete korar jonno, nahole forever database e pore thakbe.
  - **Ki korte hobe:** `resetTokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })` add koro.
  - **Keno important:** Expired tokens accumulate korbe, collection size borhte thakbe, ar security risk — old tokens database e stored thakbe indefinitely.

### 🟠 High

- **lean() Almost Kothao Nai** (All service files except 2 places in `user.service.ts`)
  - **Ki problem:** 12 ta model er moddhe sudhu `user.service.ts` e 2 ta jaygay lean() use hoyeche. Baki sob read query full Mongoose Document return kore — 2-5x slow, memory waste.
  - **Ki korte hobe:** Sob read-only query e `.lean()` add koro — specifically `legal.service.ts`, `event.service.ts`, `notification.service.ts`, `preference-card.service.ts` er list/detail queries.
  - **Keno important:** Significant performance hit — every read e Mongoose puro Document object banay change tracking, virtuals, methods sahit. Jodi tumi save() call korcho na, eta pure waste.

- **Notification Model Dual Schema (Legacy + New)** (`src/app/modules/notification/notification.model.ts`)
  - **Ki problem:** Ekta schema te duita parallel field set ache — legacy (`text`, `receiver`, `isRead`) ar new (`userId`, `title`, `subtitle`, `read`, `type`). Duplicate indexes o ache (`receiver: 1` + `userId: 1`, `isRead: 1` + `read: 1`).
  - **Ki korte hobe:** Legacy fields remove koro jodi ar use hocche na. Jodi migration period e achen, sunset date fix koro. Duplicate indexes delete koro.
  - **Keno important:** 6 ta index in one collection — har index write slow kore. Dual schema confusion create kore kothay data likhbo ar kothay porhbo — bug er source.

- **User.favoriteCards String Array** (`src/app/modules/user/user.model.ts`)
  - **Ki problem:** `favoriteCards` field `[String]` hisebe define kora — kintu eitay PreferenceCard er ID store hoy. String array diye ObjectId store korle populate() kaj korbe na, ar $lookup e type mismatch hobe.
  - **Ki korte hobe:** `[{ type: Schema.Types.ObjectId, ref: 'PreferenceCard' }]` banao.
  - **Keno important:** Type safety nai, future e join/populate impossible eikhane, ar unbounded array risk ache jodi keu thousands of favorites add kore.

### 🟡 Medium

- **Enum Casing Inconsistency** (Multiple models)
  - **Ki problem:** User roles/status UPPERCASE (`ACTIVE`, `SUPER_ADMIN`), but Subscription status lowercase (`active`, `trialing`, `past_due`), ar Payment status o lowercase (`pending`, `held`). Same codebase e mixed convention.
  - **Ki korte hobe:** Ekta convention pick koro — ideally UPPERCASE since User model already eta follow kore ar eta industry standard for enums.
  - **Keno important:** Confusion, frontend e inconsistent handling, filter query e case mismatch risk.

- **Event Model — No Indexes** (`src/app/modules/event/event.model.ts`)
  - **Ki problem:** Kono index nai — `userId` (String, no index), `date` (no index). Users oder events filter korle full collection scan hobe.
  - **Ki korte hobe:** `eventSchema.index({ userId: 1, date: -1 })` — compound index ESR rule follow kore (equality on userId, sort on date).
  - **Keno important:** Event list page e every query slow hobe users borhle. Date-based filtering o index chara costly.

- **Payment Model — 6 Single-Field Indexes** (`src/app/modules/payment/payment.model.ts`)
  - **Ki problem:** `taskId: 1`, `posterId: 1`, `freelancerId: 1`, `bidId: 1`, `status: 1`, `stripePaymentIntentId: 1` — all separate indexes. `status` alone is low-cardinality. Most queries probably filter by userId + status together.
  - **Ki korte hobe:** Replace with compound indexes: `{ posterId: 1, status: 1, createdAt: -1 }`, `{ freelancerId: 1, status: 1, createdAt: -1 }`. Remove standalone `status: 1` index. Keep `stripePaymentIntentId: 1` (unique lookups).
  - **Keno important:** 6 ta index har write e overhead add kore. Compound index dile fewer indexes e better query performance pabo.

- **PreferenceCard.createdBy Inline Index** (`src/app/modules/preference-card/preference-card.model.ts`)
  - **Ki problem:** `createdBy` field e inline `index: true` kora — kintu eta String type, ObjectId na. Ar index ta standalone — compound index nei (e.g., createdBy + published + createdAt).
  - **Ki korte hobe:** Type fix korar pore compound index banao: `{ createdBy: 1, published: 1, createdAt: -1 }` — ei combination e frequently query hoy (user er published cards latest first).
  - **Keno important:** Standalone index e partial coverage — compound dile multiple query pattern cover hobe.

### 🔵 Low / ⚪ Style

- **ResetToken Collection Name Mismatch** (`resetToken.model.ts`)
  - Schema te `model<IResetToken, ResetTokenModel>('Token', ...)` use kora — collection name 'Token' kintu model name 'ResetToken'. Confusing.

- **Notification Dual Export** (`notification.model.ts`)
  - `Notification` ar `NotificationModel` duitai export kora same model er jonno. Pick one convention.

- **Password Pre-save Hook e Email Uniqueness Check** (`user.model.ts`)
  - Email uniqueness check pre-save hook e kora hoyeche — eta normally unique index er kaje. Redundant check, race condition o possible since it's not atomic.

- **Supply/Suture Models Overly Simple** (`supplies.model.ts`, `sutures.model.ts`)
  - Sudhu ekta `name` field — future e category, description, unit, etc. lagbe. But ekhon jodi ei e enough, then okay.

---

## Verdict

Mid-level quality codebase — query patterns ar structure mostly theek ache kintu **type safety er serious gap** (String vs ObjectId 3 jaygay), **dangling references** (Payment e Task/Bid ja exist kore na), ar **lean() almost kothao nai** — ei 3 ta fix korle production confidence significantly barhbe.

---

## 🏆 Senior Engineer Reference Design

### Collection: User

**Tomar approach:** `favoriteCards` as `[String]`, `deviceTokens` as `[String]` — bounded na
**Senior approach:** `favoriteCards` ke ObjectId ref banano, ar size limit add kora

```typescript
favoriteCards: {
  type: [{ type: Schema.Types.ObjectId, ref: 'PreferenceCard' }],
  validate: [arrayLimit(500), 'Favorite cards limit exceeded'],
  default: [],
},
```

**Keno ei ta better:** Type safety pabe, populate() possible hobe, ar unbounded array risk nai.

---

### Collection: PreferenceCard

**Tomar approach:** `createdBy` String hisebe store, inline index
**Senior approach:** ObjectId ref + compound index

```typescript
const preferenceCardSchema = new Schema<IPreferenceCard>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ... baki fields same
  },
  { timestamps: true }
);

preferenceCardSchema.index({ createdBy: 1, published: 1, createdAt: -1 });
preferenceCardSchema.index({ verificationStatus: 1, createdAt: -1 });
```

**Keno ei ta better:** $lookup/populate kaj korbe, compound index e user er published cards fast query hobe, ar type safety enforce hobe database level e.

---

### Collection: Event

**Tomar approach:** `userId` String, kono index nai
**Senior approach:** ObjectId ref + compound index + date index

```typescript
const eventSchema = new Schema<IEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ... baki fields same
  },
  { timestamps: true }
);

eventSchema.index({ userId: 1, date: -1 });
eventSchema.index({ date: 1 });
```

**Keno ei ta better:** User er events chronologically fetch korle lightning fast hobe. Ekhon full collection scan hocche.

---

### Collection: Notification

**Tomar approach:** Dual schema — legacy (receiver, isRead, text) + new (userId, read, title, subtitle, type). 6 indexes.
**Senior approach:** Clean single schema, legacy fields remove, 2 compound indexes only

```typescript
const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    link: {
      label: { type: String },
      url: { type: String },
    },
    resourceType: { type: String },
    resourceId: { type: Schema.Types.ObjectId },
    read: { type: Boolean, default: false },
    icon: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

**Keno ei ta better:** 6 index theke 2 te nambe — write speed barhbe. Dual schema confusion shesh hobe. TTL index expired notifications auto-delete korbe.

---

### Collection: ResetToken

**Tomar approach:** `expireAt` field ache but TTL index nai
**Senior approach:** TTL index add

```typescript
resetTokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
resetTokenSchema.index({ user: 1 });
```

**Keno ei ta better:** MongoDB automatically expired tokens delete korbe — manual cleanup code ar cron job laagbe na, ar database size controlled thakbe.

---

### Collection: Payment

**Tomar approach:** 6 ta single-field index, Task/Bid references ja exist kore na
**Senior approach:** Remove ghost refs, compound indexes

```typescript
// Remove taskId, bidId fields if Task/Bid models don't exist
// Or create proper Task/Bid models if they're planned

paymentSchema.index({ posterId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ freelancerId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true });
// Remove: taskId: 1, bidId: 1, status: 1 standalone indexes
```

**Keno ei ta better:** 6 index theke 3 te — write overhead half hobe. Compound indexes same queries cover korbe but faster.

---

### Overall Architecture Decision

System level e shobcheye boro issue holo **type inconsistency** — kisu model ObjectId use kore (Subscription, Payment), kisu String use kore (PreferenceCard, Event, Notification) same purpose er jonno (User reference). Eta accident — likely different developers different time e code likhechilo. Senior engineer hoyle day 1 e ekta convention set korto: "sob foreign key ObjectId hobe, no exception." Eta enforce korto interface level e (`Types.ObjectId`) ar model level e (`Schema.Types.ObjectId` with `ref`).

Dwitiyo issue holo **indexing strategy er lack of planning** — kisu model e over-indexed (Payment 6 ta, Notification 6 ta), kisu model e zero index (Event). Senior engineer hoyle upfront decide korto — ki ki query pattern hobe, compound index plan korto, ar 2-3 ta well-designed compound index dito instead of 6 ta scattered single-field index.

---

## 🔧 Update & Optimization Plan

### Priority 1 — Critical Fixes (Ekhuni korte hobe)

| # | Ki korte hobe | File | Keno |
|---|---|---|---|
| 1 | `createdBy` field String theke `Schema.Types.ObjectId` e change koro + interface update | `src/app/modules/preference-card/preference-card.model.ts`, `preference-card.interface.ts` | Type mismatch — $lookup ar populate fail kore |
| 2 | `userId` field String theke `Schema.Types.ObjectId` e change koro (Event model) | `src/app/modules/event/event.model.ts`, `event.interface.ts` | Same type mismatch issue |
| 3 | `userId` field String theke `Schema.Types.ObjectId` e change koro (Notification model) | `src/app/modules/notification/notification.model.ts`, `notification.interface.ts` | Same type mismatch issue |
| 4 | Task/Bid reference decide koro — remove or create models | `src/app/modules/payment/payment.model.ts`, `payment.interface.ts` | Ghost reference — populate() error throw korbe |
| 5 | ResetToken e TTL index add koro | `src/app/modules/auth/resetToken/resetToken.model.ts` | Expired tokens forever pore thake |

### Priority 2 — High Impact Improvements

| # | Ki korte hobe | File | Keno |
|---|---|---|---|
| 1 | Sob read-only query e `.lean()` add koro | `legal.service.ts`, `event.service.ts`, `notification.service.ts`, `preference-card.service.ts`, `payment.service.ts` | 2-5x faster reads, less memory |
| 2 | Notification legacy fields remove koro (receiver, isRead, text) | `notification.model.ts`, `notification.interface.ts` | Duplicate fields, extra indexes, confusion |
| 3 | `favoriteCards` String[] theke ObjectId[] e change koro | `src/app/modules/user/user.model.ts`, `user.interface.ts` | Populate possible hobe, type safety |
| 4 | Event model e compound index add koro | `src/app/modules/event/event.model.ts` | `{ userId: 1, date: -1 }` — ekhon full scan hocche |
| 5 | Payment e single indexes replace with compound | `src/app/modules/payment/payment.model.ts` | 6 index theke 3 — write faster, read same |

### Priority 3 — Nice to Have

| # | Ki korte hobe | File | Keno |
|---|---|---|---|
| 1 | Enum casing standardize koro (sob UPPERCASE) | `subscription.interface.ts`, `payment.interface.ts` | Consistency across codebase |
| 2 | PreferenceCard e compound index banao | `preference-card.model.ts` | `{ createdBy: 1, published: 1, createdAt: -1 }` |
| 3 | Notification e TTL index add koro `expiresAt` field e | `notification.model.ts` | Auto-cleanup expired notifications |
| 4 | ResetToken collection name fix koro ('Token' -> 'ResetToken') | `resetToken.model.ts` | Naming consistency |
| 5 | Notification dual export clean up koro | `notification.model.ts` | Pick one: `Notification` or `NotificationModel` |

### Schema Migration Notes

- **String to ObjectId conversion** (Priority 1, items 1-3): Existing data e string IDs stored ache. Migration script lagbe ja sob existing documents er `createdBy`/`userId` fields ke string theke ObjectId e convert korbe. Script: `db.collection.find().forEach(doc => { doc.field = ObjectId(doc.field); db.collection.save(doc); })`. **Backward compatible NA** — frontend/backend code ja ei fields read/write kore shob update korte hobe simultaneously.
- **favoriteCards migration** (Priority 2, item 3): Same approach — string array theke ObjectId array e convert. Comparatively lower risk since eta just user preferences.
- **Notification legacy field removal** (Priority 2, item 2): First verify kono code legacy fields use korche ki na (grep for `receiver`, `isRead`, `text` in notification-related files). Jodi na korche, safely remove koro. Jodi korche, migrate first.
- **Payment Task/Bid cleanup** (Priority 1, item 4): Jodi remove korba, check koro kono service/controller ei fields use korche ki na. Remove related statics methods o (`getPaymentsByTask`, `getPaymentsByBid`).
