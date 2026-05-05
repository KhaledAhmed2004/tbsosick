# Subscription Module APIs

> **Section**: Backend API specifications for the subscription module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Profile](../../app-screens/06-profile.md) — Subscription read for profile screen, IAP receipt verification on upgrade

---

## Endpoints Index

| # | Method | Endpoint | Auth | Documentation | Used By |
|---|---|---|---|---|---|
| 01 | GET | `/subscriptions/me` | Bearer | [01-get-my-subscription.md](./01-get-my-subscription.md) | [App Profile](../../app-screens/06-profile.md) |
| 02 | POST | `/subscriptions/apple/verify` | Bearer | [02-verify-apple-purchase.md](./02-verify-apple-purchase.md) | [App Profile](../../app-screens/06-profile.md) — Upgrade flow |
| 03 | POST | `/subscriptions/google/verify` | Bearer | [03-verify-google-purchase.md](./03-verify-google-purchase.md) | [App Profile](../../app-screens/06-profile.md) — Upgrade flow |
| 04 | POST | `/subscriptions/choose/free` | Bearer | [04-set-free-plan.md](./04-set-free-plan.md) | [App Profile](../../app-screens/06-profile.md) — Downgrade flow |
| 05 | POST | `/subscriptions/.../webhook` | Public | [05-platform-webhooks.md](./05-platform-webhooks.md) | Apple/Google Store Notifications |

---

## API Status

| # | Endpoint | Status | Notes |
|---|---|:---:|---|
| 01 | `GET /subscriptions/me` | Done | Plan status check — never returns 404 (free users get `plan: "FREE"`) |
| 02 | `POST /subscriptions/apple/verify` | Done | iOS IAP verification using StoreKit 2 JWS |
| 03 | `POST /subscriptions/google/verify` | Done | Android IAP verification via Google Publisher API |
| 04 | `POST /subscriptions/choose/free` | Done | Downgrade to FREE plan |
| 05 | `POST /subscriptions/.../webhook` | Done | Apple/Google server notifications (auto-sync) |
