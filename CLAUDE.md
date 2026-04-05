# CLAUDE.md — Master AI Hub

> This is the **single source of truth** for all AI tools working on this repository.
> Claude Code, Trae, Antigravity, and Cursor all point here.
> Update this file → all tools get the update automatically.

---

## Project Overview

Enterprise-grade TypeScript backend (tbsosick).

**Tech Stack**: TypeScript + Express + MongoDB/Mongoose + Socket.IO + Stripe + OpenTelemetry

---

## 🌐 Universal AI Instructions

> These instructions apply to **every AI tool** that reads this file — Claude Code, Trae, Antigravity, Cursor, or any other tool.
> There are no tool-specific roles or limitations. All capabilities are available to all tools equally.

**As an AI working on this project, you MUST:**

1. **Follow coding rules** — Architecture, clean code, and route design rules are in this file. Apply them always.
2. **Use Skills when relevant** — Skills live in `.trae/skills/`. Any tool can read and follow a SKILL.md. See the Skill Routing section below.
3. **Follow Workflows for multi-step tasks** — Workflows live in `.agent/workflows/`. Any tool can read and execute a workflow step-by-step.
4. **Plan before acting** — For any non-trivial task (3+ steps), write a plan first.
5. **Verify your work** — Never mark a task complete without proof (build passing, tests run, endpoint tested).

**Available capabilities (use any, always):**
- 📜 Coding Rules → embedded in this file
- ⚡ Skills → `.trae/skills/` (see Skill Index below)
- 🔁 Workflows → `.agent/workflows/` (see Workflow Index below)
- 📋 Code Templates → `.claude/rules/codebase-blueprint.md`

---

## 🚀 Development Commands

```bash
npm run dev              # Start dev server
npm run build           # Compile TypeScript
npm run lint:fix        # Auto-fix linting
npm run prettier:fix    # Auto-format
npm test                # Vitest watch mode
npm run test:run        # Run tests once

node scripts/code-review/reviewer.js       # Code Review CLI
node scripts/generate-diagrams.js         # Mermaid Diagram Generator
```

---

## ⚠️ CRITICAL: Import Order (MANDATORY)

Import order in `src/app.ts` and `src/server.ts` is **MANDATORY** — violation causes runtime errors:

1. `mongooseMetrics` — Before any Mongoose models compile
2. `autoLabelBootstrap` — Before routes/controllers load
3. `opentelemetry` — Instrumentation
4. `patchBcrypt`, `patchJWT`, `patchStripe` — Third-party patches
5. **LAST**: `routes` — They import controllers which need auto-labeling

---

## 📐 Architecture Rules

### Module Pattern
Every feature lives in `src/app/modules/[feature]/`:
- `[feature].interface.ts` — Types, enums, model type
- `[feature].model.ts` — Mongoose schema + statics
- `[feature].controller.ts` — Thin request handlers (`catchAsync`)
- `[feature].service.ts` — Fat business logic (`ApiError`)
- `[feature].route.ts` — Express routes (middleware chain)
- `[feature].validation.ts` — Zod schemas

**Request Flow**: Route → `validateRequest(ZodSchema)` → Controller (`catchAsync`) → Service → Model → `sendResponse()`

### Query Builders
- **QueryBuilder** (`app/builder/QueryBuilder.ts`): Chainable `.search()`, `.filter()`, `.sort()`, `.paginate()`, `.fields()`
- **AggregationBuilder** (`app/builder/AggregationBuilder.ts`): Chainable `.match()`, `.lookup()`, `.unwind()`, `.group()`, `.sort()`, `.paginate()`

### File Upload (`src/app/middlewares/fileHandler.ts`)
- Providers: `local`, `s3`, `cloudinary`, `memory`
- Simple: `fileHandler(['field1', 'field2'])`
- Advanced: `fileHandler({ maxFileSizeMB: 500, maxFilesTotal: 6, ... })`
- File URLs injected into `req.body` after middleware runs

### Socket.IO
- JWT-authenticated real-time features
- Connection validated in `socketHelper.ts`
- Rooms: Private `user:{userId}` and chat rooms
- Helpers: `presenceHelper.ts` (online status), `unreadHelper.ts` (unread counts)

### Payment (Stripe)
- Components: `stripe.adapter.ts`, `payment.service.ts`, `stripeConnect.service.ts`, `webhook.controller.ts`
- Flow: Create PaymentIntent → Hold funds (PENDING) → Transfer to seller on completion

### Observability (OpenTelemetry)
- Auto-Labeling: Classes named `*Controller` or `*Service` get automatic span creation
- Request Context: `getRequestContext()` from `requestContext.ts`
- Mongoose Metrics: Auto `.explain()` on queries

---

## 🧹 Clean Code Rules

### Naming
- Meaningful names: `userSubscription` NOT `sub`
- Boolean prefix: `isActive`, `hasPermission`, `shouldRetry`
- Variables/functions: `camelCase`; Classes/interfaces: `PascalCase`
- Files: `[feature].route.ts` (singular, not `.routes.ts`)
- Paths: plural kebab-case (`/api/v1/users`, `/my-courses`)

### Functions
- Keep functions < 30 lines
- Use `async/await` — no raw promises
- Use object destructuring for multiple properties

### Layered Architecture
- **Controllers (Thin)**: HTTP handling only — extract data, call service, send response. No business logic.
- **Services (Fat)**: All business logic, data transformation, DB interaction.
- **Models**: Schema and statics only.

### Stack Specifics
- Zod schemas in `[feature].validation.ts`, always use `validateRequest`
- Use `.lean()` for read-only Mongoose queries
- Index all search/filter fields in Mongoose
- Access env vars via `config/index.ts`, NOT `process.env` directly
- Throw `ApiError(StatusCode, message)` for controlled errors

---

## 🛣️ Route Design Rules

### Middleware Chain (Canonical Order)
`rateLimit` → `auth` → `fileHandler` → `validateRequest` → `Controller`

### Declaration Order in Route Files (CRITICAL)
Express matches routes order. Fixed paths MUST come before param paths:
1. `POST /webhook` (no auth)
2. Collection-level fixed paths (`POST /`, `GET /`, `GET /stats`, `GET /my-items`)
3. Single resource by param (`GET /:id`, `PATCH /:id`, `DELETE /:id`)
4. Nested sub-resources (`POST /:id/modules`)

### HTTP Methods
- `GET` → Read
- `POST` → Create or trigger action (`POST /auth/login`, `POST /:id/refund`)
- `PATCH` → Partial update or state toggle (`PATCH /:id/block`)
- `DELETE` → Remove
- Actions as suffix: `PATCH /:id/block` NOT `/block/:id`

### Postman Collection
- **Location**: `public/postman-collection.json` — single source of truth
- **Update on EVERY route change** (add/modify/remove)
- Organized by frontend screens, not backend modules
- Use `{{baseUrl}}`, `{{accessToken}}`, `{{refreshToken}}` variables

---

## 📖 Documentation Standards

- **No code without docs**: Update docs when modifying modules, schemas, endpoints
- **Critical systems**: Dedicated file in `docs/`
- **Helpers**: Inline JSDoc + examples
- **Language**: Bangla for architecture rationale; English for technical references

### Module Docs Status

| Module | Status | File |
|---|---|---|
| Logging & Tracing | ✅ Complete | `docs/logging-tracing-system-deep-dive-bn.md` |
| Payment System | ✅ Complete | `docs/payment-module-architecture-bn.md` |
| Messaging | ✅ Complete | `docs/messaging-system-deep-dive-bn.md` |
| Architecture | ✅ Complete | `.claude/rules/architecture.md` |
| Route Design | ✅ Complete | `.claude/rules/route-design.md` |
| API Audits | ✅ Complete | `docs/audits/api-audit-report.md` |

---

## ⚙️ Workflow Rules

- **Simplicity First**: Minimal code impact, clean solutions. No hacks.
- **Root Cause**: No temporary fixes. Find and fix the actual problem.
- **Plan Mode**: Required for non-trivial tasks (3+ steps).
- **Verification**: Never mark a task complete without running tests or showing proof.
- **Self-Improvement**: Use `skill-optimizer` from `.trae/skills/` periodically.

### Task Flow
1. Plan → Write actionable items
2. Track → Mark items complete as you go
3. Verify → Run tests and demonstrate functionality
4. Document → Summarize changes and update relevant docs

---

## 🧠 Skill Routing Rules

When user request matches, ALWAYS invoke the Skill tool FIRST. Do not answer directly.

| Request Type | Invoke Skill |
|---|---|
| Product ideas, brainstorming, "is this worth building" | `gstack-office-hours` |
| Plan review, "think bigger", strategy | `gstack-ceo-review` |
| Code review, "check my diff", security check | `gstack-review` |
| Bugs, testing, edge cases, "test this" | `gstack-qa` / `superpowers-tdd` |
| Research, comparing libraries, "find a solution" | `gstack-browse` |
| Feature specs, requirements, "build this from scratch" | `gsd-spec` |
| Context rot, long conversation, "what's the progress" | `gsd-state` |
| Complex bug, "why is this failing", root cause | `superpowers-debugging` |
| UX Flow doc, screen-by-screen API specs | `ux-flow-api-docs` |
| REST API design, schema audit, Mongoose modeling | `api-design` / `nosql-database-design` |

---

## ⚡ Skill Index (`.trae/skills/`)

### Core Skills
- **[api-design](file:///.trae/skills/api-design/SKILL.md)**: REST API design, building, auditing
- **[code-reviewer](file:///.trae/skills/code-reviewer/SKILL.md)**: Senior-level code reviews
- **[nosql-database-design](file:///.trae/skills/nosql-database-design/SKILL.md)**: Mongoose schema + MongoDB modeling
- **[typescript](file:///.trae/skills/typescript/SKILL.md)**: Type-safe, maintainable TypeScript
- **[ux-flow-api-docs](file:///.trae/skills/ux-flow-api-docs/SKILL.md)**: Screen-by-screen API docs in Banglish
- **[skill-optimizer](file:///.trae/skills/skill-optimizer/SKILL.md)**: Rule refinement and self-improvement

### Gstack Specialist Skills
- **[gstack-office-hours](file:///.trae/skills/gstack-office-hours/SKILL.md)**: Product Architect brainstorming (Banglish)
- **[gstack-ceo-review](file:///.trae/skills/gstack-ceo-review/SKILL.md)**: Founder-mode plan review (Banglish)
- **[gstack-review](file:///.trae/skills/gstack-review/SKILL.md)**: Senior Engineer code review (Banglish)
- **[gstack-qa](file:///.trae/skills/gstack-qa/SKILL.md)**: QA Lead testing and bug finding (Banglish)
- **[gstack-browse](file:///.trae/skills/gstack-browse/SKILL.md)**: Deep research and first-principles search (Banglish)

### GSD Skills
- **[gsd-spec](file:///.trae/skills/gsd-spec/SKILL.md)**: Spec-driven development (Banglish)
- **[gsd-state](file:///.trae/skills/gsd-state/SKILL.md)**: STATE.md management to avoid context rot (Banglish)

### Superpowers Skills
- **[superpowers-tdd](file:///.trae/skills/superpowers-tdd/SKILL.md)**: Red-Green-Refactor TDD (Banglish)
- **[superpowers-debugging](file:///.trae/skills/superpowers-debugging/SKILL.md)**: Systematic root-cause analysis (Banglish)

---

## 🔁 Workflow Index (`.agent/workflows/`)

> Any tool can execute these workflows. Read the workflow file and follow its steps.

| Trigger | Workflow File |
|---|---|
| "Build X feature", new module from scratch | [feature-implementation.md](file:///.agent/workflows/feature-implementation.md) |
| Bug report, error, unexpected behavior | [bug-fix.md](file:///.agent/workflows/bug-fix.md) |
| "Review my code", "check my diff" | [code-review.md](file:///.agent/workflows/code-review.md) |
| "Audit endpoints", "sync Postman" | [api-audit.md](file:///.agent/workflows/api-audit.md) |
