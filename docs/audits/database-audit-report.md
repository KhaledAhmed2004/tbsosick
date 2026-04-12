# Database Audit Report

> **Audit Date:** 2026-04-13
> **Reviewed By:** AI (nosql-mongoose-expert skill)
> **Total Models Reviewed:** 12 (User, PreferenceCard, Supply, Suture, Subscription, SubscriptionEvent, Event, Notification, ScheduledNotification, Favorite, ResetToken, Legal)

---

## Summary

Tier 1 doc drift ar Tier 2 design smells onek ta cleanup hoyeche (favoriteCards → Favorite collection, deviceTokens sub-doc, Event time model, Subscription audit log, Notification polymorphic ref consolidate) — oi kaj gulo solid. Kintu **indexing strategy fully underbuilt**, **hot-path populate() chains aggregation-e convert kora hoy nai**, **PreferenceCard required free-text field spam** ekhono ase, ar ekta **real security gap** (auth middleware tokenVersion check kore na) bose ase. Production-e choltechey but scale-er sathe painfully degrade korbe.

---

## 📊 Score: 67/100

| Category | Score | Max | Notes |
|---|---|---|---|
| Schema Design (embed vs ref, patterns, cardinality) | 18 | 25 | Tier 2 fix er pore major anti-patterns nei, kintu PreferenceCard required free-text spam ar ResetToken underbuilt |
| Indexing Strategy | 10 | 20 | PreferenceCard list query index-less scan chalay, text index nei konohate, Event eventType filter cover hoy na |
| Data Integrity & Types (ObjectId, enums, validators) | 16 | 20 | Verified-flip + status-required + enum narrow shob bhalo; but auth middleware tokenVersion check kore na — security hole |
| Performance & Scalability (unbounded arrays, pagination, N+1) | 12 | 20 | Populate on hot paths, skip/limit pagination, regex search — scale-e bite korbe |
| Mongoose Best Practices (lean, select, timestamps, hooks) | 11 | 15 | Lean inconsistent, pre-save hook redundant with unique index, Mixed type naming inconsistent |
| **TOTAL** | **67** | 100 | |

**Grade:** C (60–74)
**Honest Summary:** Foundation thik hoyeche Tier 2 fix er pore, kintu "fast, indexed, production-scale" level e nei — query path gulo ekhono naive.

---

## ✅ Ja Valo Ache

- **Favorite collection refactor** (`src/app/modules/favorite/favorite.model.ts`) — proper join table with unique compound `{ userId, cardId }` index. Idempotent upsert via `$setOnInsert`. Eta textbook-level correct.
- **deviceTokens sub-doc array** (`src/app/modules/user/user.model.ts`) — metadata rakha + smart upsert statics ja existing token er `lastSeenAt` refresh kore. Most apps eita shob time e miss kore.
- **Subscription fraud guard** — `appleOriginalTransactionId` + `googlePurchaseToken` unique+sparse — ei ta prevent kore same IAP kinle multiple user-ke link hote. Legit security layer.
- **SubscriptionEvent audit collection** — append-only log with diff-based write in `upsertForUser`. Try/catch so audit failure never blocks primary write. This is how senior engineers design audit trails.
- **Notification polymorphic ref consolidation** — `{ resourceType, resourceId }` pair as the only link, compound index on both, plus narrowed `type` enum. Previous dual-system confusion gone.
- **Event compound index `{ userId, startsAt }`** — matches the natural calendar range query `{ userId, startsAt: { $gte, $lte } }`.
- **Notification TTL index on `expiresAt`** — auto-prune dead notifications instead of cron jobs. Zero-ops housekeeping.

---

## ⚠️ Issue List

### 🔴 Critical

- **PreferenceCard list query runs without indexes on filter fields** (`src/app/modules/preference-card/preference-card.model.ts`)
  - **Ki problem:** Home screen er `GET /preference-cards` query chalay `{ published: true }` as base filter + search on `cardTitle`, `surgeon.fullName`, `medication` via `$regex`, plus optional `surgeon.specialty` regex filter. Index ase shudhu `createdBy`. Mane base filter `published: true` sob document-e collection scan kore, tar pore regex match. 10k cards hole protiti home screen hit 10k doc scan korbe.
  - **Ki korte hobe:** `{ published: 1, verificationStatus: 1, createdAt: -1 }` compound index add koro (ESR rule: equality → equality → sort). Search-er jonno `cardTitle + medication + surgeon.fullName + surgeon.specialty` er upor **text index**: `PreferenceCardSchema.index({ cardTitle: 'text', medication: 'text', 'surgeon.fullName': 'text', 'surgeon.specialty': 'text' })`. Tar pore QueryBuilder.search() ke refactor koro `$text: { $search: term }` use korar jonno, regex na.
  - **Keno important:** Home screen = highest-read endpoint. Index na thakle protiti user er protiti home hit → full scan → working set RAM er baire chole jabe → p95 latency collapse. Eta scale problem na, eta **scale cliff**.

- **Auth middleware tokenVersion check kore na** (`src/app/middlewares/auth.ts`)
  - **Ki problem:** `tokenVersion` shudhu refresh-token flow-e verify hoy. Access token independently verify hoy JWT signature diye, kintu issued access token-er `tokenVersion` compare hoy na current DB value er sathe. Mane `changePassword`, admin-triggered logout, ba `$inc: tokenVersion` hoilei — **access token still works until it naturally expires**. Refresh token invalidated, but next 15-30 min access still valid.
  - **Ki korte hobe:** Auth middleware-e user fetch korte hobe (`.select('+tokenVersion')`) ar decoded JWT er `tokenVersion` ta DB value er sathe match korte hobe. Mismatch → 401. Performance impact: 1 extra indexed `_id` lookup per authenticated request. OR ekta Redis cache layer use koro `userId → tokenVersion` memoize kora jate DB hit avoid hoy.
  - **Keno important:** Security boundary. Ei gap ta mane **force-logout technically kaj kore na**. Password reset er pore o attacker-er stolen access token short-lived window e use kora jabe. Banking/healthcare context-e eta audit failure.

- **QueryBuilder.search() uses `$regex` — no text indexes anywhere** (`src/app/builder/QueryBuilder.ts:16-30`)
  - **Ki problem:** Sob search `$regex` diye implement. Prefix anchor (`^`) nei, so MongoDB can't use a B-tree index even if one existed on the field. Every search = collection scan.
  - **Ki korte hobe:** Search-intensive collections-e (PreferenceCard, Supply, Suture) MongoDB text index add koro. QueryBuilder-e ekta `textSearch(term)` method add koro ja `$text: { $search }` use kore ar natural score diye sort kore. Legacy `search()` ke deprecated mark koro.
  - **Keno important:** Regex search `O(n × m)` complexity — collection size er sathe linearly degrade kore. Text index `O(log n)`. Ei difference 100k doc-e 500ms vs 5ms.

---

### 🟠 High

- **PreferenceCard hot-path `populate()` chain should be `$lookup` aggregation** (`src/app/modules/preference-card/preference-card.service.ts` — multiple list methods)
  - **Ki problem:** `listPublicPreferenceCardsFromDB`, `listFavoritePreferenceCardsForUserFromDB`, `listPrivatePreferenceCardsForUserFromDB`, `getPreferenceCardByIdFromDB`, `listPreferenceCardsForUserFromDB` — shob `populate('supplies.supply').populate('sutures.suture')` kore. Protiti `populate` alada round trip. Pagination er 10 card × 5 supplies = 50 separate Supply fetch. Eta classic N+1 via populate.
  - **Ki korte hobe:** `AggregationBuilder` diye `$lookup` pipeline build koro: main `$match` + `$lookup` for supplies with `let: { ids: '$supplies.supply' }` + nested pipeline filter — single round trip, all joins at server side. Project-e already `AggregationBuilder` ache (per CLAUDE.md blueprint) but use hocche na ei hot path-e.
  - **Keno important:** 100 card × 5 supplies = 500 DB round trips per page load. Even local, eta `populate()` e 300-800ms add kore per list query.

- **PreferenceCard required free-text field spam** (`src/app/modules/preference-card/preference-card.model.ts:40-48`)
  - **Ki problem:** `medication`, `instruments`, `positioningEquipment`, `prepping`, `workflow`, `keyNotes` — **sob `String, required: true`**. User card create korte gele 6 ta free-text field obossho fill korte hobe. Ei ta `required` hoe enforcement na, eta UX friction + "lorem ipsum" data dhukano er invitation.
  - **Ki korte hobe:** Ei field guloke `required: false` koro. Frontend-e validation levels define koro (draft vs publish). `verificationStatus: 'VERIFIED'` er jonno mandatory shomosto field ache ki na — seta service-layer pre-verify check e rakho.
  - **Keno important:** Schema required = at every write. Mane draft save o fail hobe. Data quality improve kora jabe na karon users just `"-"` type dummy dibe.

- **Notification.listForUser uses skip/limit + 2x countDocuments per call** (`src/app/modules/notification/notification.service.ts:7-30`)
  - **Ki problem:** Paginated list + total count + unreadCount = **3 separate queries per request**. `skip(page * limit)` on large collections is `O(n)` — Mongo scans skipped docs. Active user > 5000 notifications e noticable.
  - **Ki korte hobe:** (a) `$facet` diye ekta aggregation-e 3 ta kaj chalao. (b) Ba long-run e cursor-based pagination: `?beforeId=<lastNotificationId>` query with `{ _id: { $lt: beforeId } }`. (c) `unreadCount` user doc-e denormalize ba Redis-e cache.
  - **Keno important:** Notification bell per app-open hit hoy. Koti scale na, kintu active user count barle proportional DB load barbe.

- **deviceTokens token rebinding not handled across users** (`src/app/modules/user/user.model.ts` — addDeviceToken static)
  - **Ki problem:** Device A theke User 1 logout → User 2 login. Same FCM token. Current `addDeviceToken` User 2-e token add kore, but User 1 er record theke remove kore na. Push for User 1 → delivered to User 2's device. **Push misdelivery bug.**
  - **Ki korte hobe:** `addDeviceToken` er beginning-e: `await User.updateMany({ _id: { $ne: userId }, 'deviceTokens.token': token }, { $pull: { deviceTokens: { token } } })`. Ei line ta ensure kore globally unique (user, token) pair.
  - **Keno important:** Cross-user data leak via push notification. Minor frequency but legal/privacy implications.

- **Pre-save hook on User does redundant email uniqueness check** (`src/app/modules/user/user.model.ts:143-161`)
  - **Ki problem:** `userSchema.pre('save')` e `await User.findOne({ email, _id: { $ne: this._id } })` — ei check ta every `.save()` e chalay, even when `email` change hoy nai. `email` field already `unique: true` schema-e, so MongoDB handles this at the index level. Hook ta ekhon kaj korche:
    - (a) Extra DB query every save (profilePicture update, deviceTokens push, etc.)
    - (b) Race condition unsafe — check-then-write is not atomic; unique index is.
    - (c) Throws generic error instead of letting MongoDB 11000 duplicate-key error bubble up with structured info.
  - **Ki korte hobe:** Delete the pre-save uniqueness check entirely. Trust the unique index. Error handler level-e 11000 ke translate koro "Email already exists" message-e.
  - **Keno important:** Free 30-50% perf win on all User writes. Also eliminates a subtle race that the current code hides.

---

### 🟡 Medium

- **ResetToken model has no TTL index, no required user ref, no token index** (`src/app/modules/auth/resetToken/resetToken.model.ts`)
  - **Ki problem:** `expireAt: Date, required: true` — kintu TTL index nei, so expired tokens collect forever. `token` field not indexed but `findOne({ token })` every reset-password call. `user` field not `required: true` so orphaned tokens possible. Model name `'Token'` (generic) but variable `ResetToken` — collection becomes `tokens` which is ambiguous.
  - **Ki korte hobe:**
    ```typescript
    token: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expireAt: { type: Date, required: true, index: { expires: 0 } },
    // model name → 'ResetToken' instead of 'Token'
    ```
  - **Keno important:** Expired token cleanup hoy na → collection bloat. `token` index nei → every reset call scan. Model name generic → migration/ops confusion future-e.

- **`.lean()` missing on several read-only paths** (`src/app/modules/subscription/subscription.service.ts`, `src/app/modules/event/event.service.ts` — update paths)
  - **Ki problem:** `ensureSubscriptionDoc` er prothom `findByUser` returns a full hydrated doc even though we only read `plan`/`status` then possibly return the doc to caller. If caller doesn't mutate → `.lean()` faster. Event `getEventByIdFromDB` uses `.lean()` already, good. But `findByUser` doesn't.
  - **Ki korte hobe:** Audit koro each query: "ei doc ke `.save()` ba `.set()` hobe future-e?" Na hole `.lean()` add koro. `ensureSubscriptionDoc` can return `.lean()` since it's passed through to API response.
  - **Keno important:** Lean queries ~5-10x faster — no schema validation wrapper, no change tracking. Incremental win but adds up.

- **Event compound index missing `eventType`** (`src/app/modules/event/event.model.ts:33`)
  - **Ki problem:** Current index `{ userId: 1, startsAt: 1 }`. If calendar ever filters by type (e.g. "show me only surgeries next week"), that query cannot use the compound — it degenerates to index prefix on userId only.
  - **Ki korte hobe:** Jodi eventType filter real use case, compound ta expand koro: `{ userId: 1, eventType: 1, startsAt: 1 }` (ESR order). Jodi na, leave it.
  - **Keno important:** Preference, depends on real query pattern. Flag as medium because unclear from code which queries run.

- **Subscription `upsertForUser` diff logic misses `UPGRADED` / `DOWNGRADED` distinction** (`src/app/modules/subscription/subscription.model.ts:86+`)
  - **Ki problem:** Plan change hole only `PLAN_CHANGED` event emit hoy. FREE → PREMIUM and PREMIUM → FREE same event type — analytics perspective differentiate kora jabe na easily.
  - **Ki korte hobe:** Plan rank map maintain koro: `FREE=0, PREMIUM=1, ENTERPRISE=2`. `afterRank > beforeRank` → `UPGRADED`, otherwise `DOWNGRADED`. `CREATED` already separate.
  - **Keno important:** Churn analytics usability.

- **PreferenceCard `photoLibrary: [String], required: true`** (`src/app/modules/preference-card/preference-card.model.ts:48`)
  - **Ki problem:** `required: true` on array means the field must exist, but `[]` empty array satisfies required. So "required" provides false security. Also unbounded array — if users upload 100 photos per card, doc size explodes.
  - **Ki korte hobe:** `required: false` (semantically honest), add `validate: { validator: v => v.length <= 10, message: 'Max 10 photos per card' }` cap. Ba jodi photo bigger than cap required, alada `CardPhoto` collection e move kore.
  - **Keno important:** Unbounded array smell, schema lies about required.

- **Mixed type inconsistency** (`Subscription.metadata: Object` vs `Notification.metadata: Schema.Types.Mixed`)
  - **Ki problem:** Both store free-form payload but use different type syntaxes. `Object` in schema gets treated specially by Mongoose change tracking (you need `markModified`), while `Schema.Types.Mixed` behaves consistently.
  - **Ki korte hobe:** `Subscription.metadata: { type: Schema.Types.Mixed }`. Standardize across the codebase.
  - **Keno important:** Mongoose Mixed paths don't track changes — writing to a nested property fails silently without `markModified`. `Object` inherits this problem.

---

### 🔵 Low / ⚪ Style

- **`USER_STATUS.DELETE` should be `DELETED`** (`src/app/modules/user/user.interface.ts`) — past-participle convention for terminal states. Rest of enums use it (`CANCELED`, `EXPIRED`). Low because it's a breaking change to fix.

- **ResetToken model name `'Token'`** — collection becomes `tokens`. Rename to `'ResetToken'` for clarity (breaking — would need migration).

- **`Favorite.timestamps: true` but `updatedAt` never meaningful** — a Favorite is either present or deleted, no "update" lifecycle. Use `{ timestamps: { createdAt: true, updatedAt: false } }`.

- **`User.googleId: sparse: true` but not `unique: true`** — sparse without unique doesn't prevent duplicate Google IDs, just allows multiple nulls. If the intent is "one user per Google account", add `unique: true`.

- **`AggregationBuilder` defined but unused in modules** — per CLAUDE.md blueprint it's meant for complex joins, but zero usage found. Either delete it as dead code or migrate PreferenceCard list queries to it (aligns with 🟠 High issue above).

- **Dead notification template files still in `src/app/builder/NotificationBuilder/templates/`** — `bidReceived`, `orderShipped`, `cartAbandoned`, etc. Reference enum values no longer supported. Won't break anything (never registered via `useTemplate()` in code), but they're zombie files.

- **`User.name` should have `maxlength`** — unbounded strings in schema. Defensive validation.

- **Text field trimming inconsistent** — some string fields `trim: true`, others not. Pick a convention.

---

## Verdict

**Needs work.** Tier 2 design smells fix hoyeche properly, but core hot-path performance (indexing + populate + regex search) ekhono production-ready na. **Auth middleware tokenVersion gap** ekta real security issue — eta priority 1. Scale <10k users e kichu feel hobe na, but 50k+ e p95 collapse korbe.

---

## 🏆 Senior Engineer Reference Design

### Collection: PreferenceCard (indexing + query path)

**Tomar approach:** Single `createdBy` index; list queries use `populate()` chain + regex search.

**Senior approach:** Compound indexes covering actual query patterns + text index + aggregation-based list query.

```typescript
// preference-card.model.ts

PreferenceCardSchema.index({ createdBy: 1, updatedAt: -1 });
PreferenceCardSchema.index({ published: 1, verificationStatus: 1, createdAt: -1 });
PreferenceCardSchema.index({ 'surgeon.specialty': 1, published: 1 });
PreferenceCardSchema.index(
  {
    cardTitle: 'text',
    medication: 'text',
    'surgeon.fullName': 'text',
    'surgeon.specialty': 'text',
  },
  { weights: { cardTitle: 10, 'surgeon.fullName': 5, medication: 2 }, name: 'card_text_idx' },
);
```

```typescript
// preference-card.service.ts — list query via aggregation
const listPublicPreferenceCardsFromDB = async (query: Record<string, any>) => {
  const { page = 1, limit = 10, search, specialty } = query;
  const match: any = { published: true };
  if (specialty) match['surgeon.specialty'] = specialty;
  if (search) match.$text = { $search: search };

  const [result] = await PreferenceCardModel.aggregate([
    { $match: match },
    { $sort: search ? { score: { $meta: 'textScore' } } : { createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) },
          {
            $lookup: {
              from: 'supplies',
              localField: 'supplies.supply',
              foreignField: '_id',
              as: 'supplyDocs',
              pipeline: [{ $project: { name: 1 } }],
            },
          },
          {
            $lookup: {
              from: 'sutures',
              localField: 'sutures.suture',
              foreignField: '_id',
              as: 'sutureDocs',
              pipeline: [{ $project: { name: 1 } }],
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  return {
    data: result.data,
    meta: { page, limit, total: result.total[0]?.count || 0 },
  };
};
```

**Keno ei ta better:**
- Single round trip instead of 1 find + 2 populate queries (3 → 1).
- Text index matches score-ranked instead of regex full-scan — O(log n) vs O(n).
- `$facet` gives data + total in one pass.
- Index support on `published` + sort field eliminates scan.

---

### Collection: ResetToken

**Tomar approach:** Plain schema with no TTL, no indexes, no required user ref.

**Senior approach:** TTL index + proper foreign key + unique token + correct model name.

```typescript
const resetTokenSchema = new Schema<IResetToken, ResetTokenModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expireAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB auto-deletes at expireAt
    },
  },
  { timestamps: true },
);

export const ResetToken = model<IResetToken, ResetTokenModel>(
  'ResetToken',
  resetTokenSchema,
);
```

**Keno ei ta better:**
- TTL index = zero-ops cleanup.
- Unique+indexed `token` = O(log n) lookup, dedupe enforced at DB.
- Required `user` = referential integrity.
- Model name `ResetToken` → collection `resettokens` (unambiguous).

---

### Collection: User — addDeviceToken global uniqueness

**Tomar approach:** Per-user dedupe, no cross-user rebind handling.

**Senior approach:** Global (user, token) uniqueness enforced at the operation level.

```typescript
userSchema.statics.addDeviceToken = async function (
  userId: string,
  token: string,
  platform?: 'ios' | 'android' | 'web',
  appVersion?: string,
) {
  // Step 1: Remove this token from any OTHER user (device rebinding).
  await User.updateMany(
    { _id: { $ne: userId }, 'deviceTokens.token': token },
    { $pull: { deviceTokens: { token } } },
  );

  // Step 2: Upsert on the target user — refresh metadata if exists,
  //         otherwise push a new sub-doc.
  const updated = await User.findOneAndUpdate(
    { _id: userId, 'deviceTokens.token': token },
    {
      $set: {
        'deviceTokens.$.lastSeenAt': new Date(),
        ...(platform ? { 'deviceTokens.$.platform': platform } : {}),
        ...(appVersion ? { 'deviceTokens.$.appVersion': appVersion } : {}),
      },
    },
    { new: true },
  );
  if (updated) return updated;

  return await User.findByIdAndUpdate(
    userId,
    { $push: { deviceTokens: { token, platform, appVersion, lastSeenAt: new Date() } } },
    { new: true },
  );
};
```

**Keno ei ta better:** Prevents push misdelivery when devices get handed off between users. Cost: one extra `updateMany` on login — indexed by `deviceTokens.token` if you add `UserSchema.index({ 'deviceTokens.token': 1 })`, minimal.

---

### Collection: Auth middleware

**Tomar approach:** Access token trust shudhu JWT signature — no DB check.

**Senior approach:** Either (a) DB-backed `tokenVersion` compare per request with Redis cache, or (b) short-lived access tokens (60s) so the attack window is bounded.

```typescript
// src/app/middlewares/auth.ts (additive)
const auth = (...roles: USER_ROLES[]) => async (req, res, next) => {
  // ... existing JWT verify
  const decoded = jwtHelper.verifyToken(token, secret);

  // NEW: tokenVersion check
  const user = await User.findById(decoded.id).select('+tokenVersion').lean();
  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Session invalidated');
  }
  // ...
};
```

**Keno ei ta better:** Force-logout, password-reset, admin-restrict — shob immediately effective instead of waiting for natural access token expiry. Adds ~1ms indexed lookup per request; if that's a concern, cache `(userId → tokenVersion)` in Redis with 30s TTL.

---

### Overall Architecture Decision

Ei system-er data model ekhon architecturally sound — proper references, audit trail for subscriptions, polymorphic notification, sub-doc device tokens. **Ja nei seta holo index discipline ar hot-path optimization**. Top 1% engineer ei stage e ashe query profiling first: `explain('executionStats')` chaliye protiti list endpoint check korto — kon query collection scan marche, kon populate round trip gula aggregation e convert kora jay, kon filter index-e hit kore na. Sei audit theke index strategy ber hoy, pattern-matching theke na.

Second big thing: **auth middleware tokenVersion check** baad deya — eta single decision je production system ke "kind of secure" theke "actually secure" distinction create kore. Ei ekta change absence production deployment delay korano uchit.

Third: **text indexes** on search-heavy collections. Regex search is a junior mistake that senior engineers catch in first review.

---

## 🔧 Update & Optimization Plan

### Priority 1 — Critical Fixes (Ekhuni korte hobe)

| # | Ki korte hobe | File | Keno |
|---|---|---|---|
| 1 | Auth middleware-e tokenVersion DB check add koro (with Redis cache optional) | `src/app/middlewares/auth.ts` | Security — force-logout/reset-password access token ekhon immediately invalidate hoy na |
| 2 | PreferenceCard e compound index `{ published: 1, verificationStatus: 1, createdAt: -1 }` add koro | `src/app/modules/preference-card/preference-card.model.ts` | Home screen list query currently collection scan marche |
| 3 | PreferenceCard e text index on `cardTitle + medication + surgeon.fullName + surgeon.specialty` add koro | `src/app/modules/preference-card/preference-card.model.ts` | Search regex from O(n) → O(log n) |
| 4 | ResetToken e TTL index `{ expireAt: { expires: 0 } }`, unique on `token`, required on `user` | `src/app/modules/auth/resetToken/resetToken.model.ts` | Expired token accumulation + query perf + referential integrity |
| 5 | `addDeviceToken` static e cross-user rebind logic add koro | `src/app/modules/user/user.model.ts` | Push misdelivery bug — device handoff scenario |

### Priority 2 — High Impact Improvements

| # | Ki korte hobe | File | Keno |
|---|---|---|---|
| 1 | PreferenceCard list queries ke `AggregationBuilder` + `$lookup` aggregation e convert koro (5 methods) | `src/app/modules/preference-card/preference-card.service.ts` | Eliminate populate chain N+1 — 3 round trips → 1 |
| 2 | QueryBuilder e `textSearch(term)` method add koro ja `$text: { $search }` use kore; PreferenceCard search ke oita use koraw | `src/app/builder/QueryBuilder.ts` + service files | Regex search replacement |
| 3 | User pre-save hook er email uniqueness check delete koro (trust unique index) | `src/app/modules/user/user.model.ts:143-161` | 30-50% User save perf win + race safety |
| 4 | PreferenceCard required free-text fields (`instruments`, `positioningEquipment`, `prepping`, `workflow`, `keyNotes`, `medication`) ke `required: false` koro | `src/app/modules/preference-card/preference-card.model.ts` | Draft-save support + real data quality via service-layer verify check |
| 5 | Notification `listForUser` ke `$facet` aggregation e convert koro (data + total + unreadCount ek call-e) | `src/app/modules/notification/notification.service.ts` | 3 queries → 1 |
| 6 | `photoLibrary` e `validate` cap add koro (max 10) ar `required: false` koro | `src/app/modules/preference-card/preference-card.model.ts` | Unbounded array protection |

### Priority 3 — Nice to Have

| # | Ki korte hobe | File | Keno |
|---|---|---|---|
| 1 | Subscription `upsertForUser` e `UPGRADED`/`DOWNGRADED` distinction add koro plan rank map diye | `src/app/modules/subscription/subscription.model.ts` | Better churn analytics |
| 2 | `Subscription.metadata` ke `Object` theke `Schema.Types.Mixed` e change koro consistency er jonno | `src/app/modules/subscription/subscription.model.ts` | Naming + Mongoose change tracking consistency |
| 3 | `USER_STATUS.DELETE` → `DELETED` rename (with migration script) | `src/app/modules/user/user.interface.ts` + all references | Enum naming consistency |
| 4 | Favorite e `{ timestamps: { createdAt: true, updatedAt: false } }` set koro | `src/app/modules/favorite/favorite.model.ts` | `updatedAt` meaningless, save a field |
| 5 | `User.googleId` e `unique: true` add koro | `src/app/modules/user/user.model.ts` | Duplicate Google account prevention |
| 6 | Dead notification templates (bidReceived, orderShipped etc.) delete koro | `src/app/builder/NotificationBuilder/templates/` | Dead code removal |
| 7 | ResetToken model name `'Token'` → `'ResetToken'` (breaking — needs DB migration) | `src/app/modules/auth/resetToken/resetToken.model.ts` | Clarity |
| 8 | Audit koro `.lean()` absent paths ar read-only queries e add koro | Multiple service files | 5-10x read perf |
| 9 | Event compound index expand `{ userId, eventType, startsAt }` jodi eventType filter real use case hoy | `src/app/modules/event/event.model.ts` | Depends on query pattern |

### Schema Migration Notes

**Live data migrations needed for Tier 2 fixes already applied** (if production DB exists):

```js
// 1. favoriteCards → Favorite collection backfill
db.users.find({ favoriteCards: { $exists: true, $ne: [] } }).forEach(u => {
  const docs = u.favoriteCards.map(cardId => ({
    userId: u._id,
    cardId: ObjectId(cardId),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  if (docs.length) db.favorites.insertMany(docs, { ordered: false });
});
db.users.updateMany({}, { $unset: { favoriteCards: '' } });

// 2. deviceTokens flat-string → sub-doc
db.users.updateMany({ 'deviceTokens.0': { $type: 'string' } }, [
  {
    $set: {
      deviceTokens: {
        $map: {
          input: '$deviceTokens',
          as: 't',
          in: { token: '$$t', lastSeenAt: new Date() },
        },
      },
    },
  },
]);

// 3. PreferenceCard supplies[].name → supplies[].supply
db.preferencecards.updateMany({ 'supplies.0': { $exists: true } }, [
  {
    $set: {
      supplies: {
        $map: {
          input: '$supplies',
          as: 'it',
          in: { supply: '$$it.name', quantity: '$$it.quantity' },
        },
      },
      sutures: {
        $map: {
          input: '$sutures',
          as: 'it',
          in: { suture: '$$it.name', quantity: '$$it.quantity' },
        },
      },
    },
  },
]);

// 4. Event legacy { date, time, durationHours } → { startsAt, endsAt }
db.events.find({ date: { $exists: true }, time: { $type: 'string' } }).forEach(doc => {
  const dateStr = doc.date.toISOString().slice(0, 10);
  const startsAt = new Date(`${dateStr}T${doc.time}:00.000Z`);
  const endsAt = new Date(startsAt.getTime() + (doc.durationHours || 1) * 3600000);
  db.events.updateOne(
    { _id: doc._id },
    { $set: { startsAt, endsAt }, $unset: { date: '', time: '', durationHours: '' } },
  );
});

// 5. Notification referenceId → resourceId
db.notifications.updateMany(
  { referenceId: { $exists: true }, resourceId: { $exists: false } },
  [{ $set: { resourceId: { $toString: '$referenceId' } } }],
);
db.notifications.updateMany({}, { $unset: { referenceId: '' } });
```

**Additional index builds (for Priority 1 items):**

```js
db.preferencecards.createIndex(
  { published: 1, verificationStatus: 1, createdAt: -1 },
);
db.preferencecards.createIndex(
  {
    cardTitle: 'text',
    medication: 'text',
    'surgeon.fullName': 'text',
    'surgeon.specialty': 'text',
  },
  { weights: { cardTitle: 10, 'surgeon.fullName': 5, medication: 2 }, name: 'card_text_idx' },
);
db.tokens.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
db.tokens.createIndex({ token: 1 }, { unique: true });
db.users.createIndex({ 'deviceTokens.token': 1 });
```

All migrations are forward-only. Plan for backup snapshot before running on production.
