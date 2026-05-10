# Subscription Module APIs

> **Section**: Backend API specifications for the subscription module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Profile](../../app-screens/06-profile.md) — Subscription read for profile screen, IAP receipt verification on upgrade

---

## Endpoints Index

> **New here?** Read [00-flows.md](./00-flows.md) first — it covers end-to-end API flow diagrams, the mental model, and how cross-cutting concerns (idempotency, orphan queue, audit log, fraud guards) plug in.

| # | Method | Endpoint | Auth | Documentation | Used By |
|---|---|---|---|---|---|
| 00 | N/A | *Read-this-first* | Docs | [00-flows.md](./00-flows.md) | End-to-end API flow diagrams |
| 01 | GET | `/subscriptions/me` | Bearer | [01-get-my-subscription.md](./01-get-my-subscription.md) | [App Profile](../../app-screens/06-profile.md) |
| 02 | POST | `/subscriptions/apple/verify` | Bearer | [02-verify-apple-purchase.md](./02-verify-apple-purchase.md) | [App Profile](../../app-screens/06-profile.md) — Upgrade flow |
| 03 | POST | `/subscriptions/google/verify` | Bearer | [03-verify-google-purchase.md](./03-verify-google-purchase.md) | [App Profile](../../app-screens/06-profile.md) — Upgrade flow |
| 04 | POST | `/subscriptions/choose/free` | Bearer | [04-set-free-plan.md](./04-set-free-plan.md) | [App Profile](../../app-screens/06-profile.md) — Downgrade flow |
| 05 | POST | `/subscriptions/.../webhook` | Public | [05-platform-webhooks.md](./05-platform-webhooks.md) | Apple/Google Store Notifications |
| 06 | N/A | `Internal Architecture` | Docs | [06-technical-architecture.md](./06-technical-architecture.md) | System Design & Reliability |
| 07 | GET/POST | `/subscriptions/admin/...` | Admin | [07-admin-endpoints.md](./07-admin-endpoints.md) | Admin Dashboard |
| 08 | N/A | `subscriptionGate` | Middleware | [subscriptionGate.ts](../../../src/app/middlewares/subscriptionGate.ts) | Feature Gating across modules |

---

## API Status

| # | Endpoint | Status | Notes |
|---|---|:---:|---|
| 01 | `GET /subscriptions/me` | Done | Plan status check — never returns 404 (free users get `plan: "FREE"`) |
| 02 | `POST /subscriptions/apple/verify` | Done | iOS JWS verification + upgrade/fraud guards |
| 03 | `POST /subscriptions/google/verify` | Done | Android API verification + token migration |
| 04 | `POST /subscriptions/choose/free` | Done | Downgrade guard (active store subscription check) |
| 05 | `POST /subscriptions/.../webhook` | Done | Security verified (JWT/JWS) + Audit logging |
| 06 | `Technical Architecture` | Done | Idempotency, Orphan Queues, and Quotas |
| 07 | `GET/POST /subscriptions/admin/...` | Done | Full suite of Admin monitoring & management APIs |

