# Preference Card Module APIs

> **Section**: Backend API specifications for the preference-card module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../../README.md#standard-response-envelope)

---

## Endpoints Index

| # | Method | Endpoint | Auth | Documentation | Used By |
|---|---|---|---|---|---|
| 01 | GET | `/preference-cards` | Bearer | [01-list-search-cards.md](./01-list-search-cards.md) | [App Home](../../app-screens/02-home.md), [App Library](../../app-screens/04-library.md), [Dashboard Card Mgmt](../../dashboard-screens/04-preference-card-management.md) |
| 02 | GET | `/preference-cards/stats` | Bearer | [02-get-cards-stats.md](./02-get-cards-stats.md) | [App Home](../../app-screens/02-home.md) |
| 03 | GET | `/preference-cards/specialties` | Bearer | [03-fetch-distinct-specialties.md](./03-fetch-distinct-specialties.md) | [App Library](../../app-screens/04-library.md) |
| 04 | POST | `/preference-cards` | Bearer | [04-create-preference-card.md](./04-create-preference-card.md) | [App Card Details](../../app-screens/03-preference-card-details.md) |
| 05 | GET | `/preference-cards/:cardId` | Bearer | [05-get-card-details.md](./05-get-card-details.md) | [App Card Details](../../app-screens/03-preference-card-details.md), [App Library](../../app-screens/04-library.md) |
| 06 | PATCH | `/preference-cards/:cardId` | Bearer | [06-update-preference-card.md](./06-update-preference-card.md) | [App Card Details](../../app-screens/03-preference-card-details.md) |
| 07 | DELETE | `/preference-cards/:cardId` | Bearer | [07-delete-preference-card.md](./07-delete-preference-card.md) | [App Card Details](../../app-screens/03-preference-card-details.md), [Dashboard Card Mgmt](../../dashboard-screens/04-preference-card-management.md) |
| 08 | PUT | `/preference-cards/favorites/cards/:cardId` | Bearer | [08-favorite-card.md](./08-favorite-card.md) | [App Home](../../app-screens/02-home.md), [App Card Details](../../app-screens/03-preference-card-details.md), [App Library](../../app-screens/04-library.md), [Dashboard Card Mgmt](../../dashboard-screens/04-preference-card-management.md) |
| 09 | DELETE | `/preference-cards/favorites/cards/:cardId` | Bearer | [09-unfavorite-card.md](./09-unfavorite-card.md) | [App Home](../../app-screens/02-home.md), [App Card Details](../../app-screens/03-preference-card-details.md), [App Library](../../app-screens/04-library.md), [Dashboard Card Mgmt](../../dashboard-screens/04-preference-card-management.md) |
| 10 | POST | `/preference-cards/:cardId/download` | Bearer | [10-download-preference-card.md](./10-download-preference-card.md) | [App Card Details](../../app-screens/03-preference-card-details.md), [App Library](../../app-screens/04-library.md) |
| 11 | PATCH | `/preference-cards/:cardId` | SUPER_ADMIN | [11-admin-verification.md](./11-admin-verification.md) | [Dashboard Card Mgmt](../../dashboard-screens/04-preference-card-management.md) |

---

## Common errors

For cross-cutting responses (401 Unauthorized, 402/403 Plan Required, 429 Rate Limit, 400 Validation), see [Common Error Scenarios in modules/README.md](../../README.md#common-error-scenarios).

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 01 | `/preference-cards` | `GET` | Bearer | Done | List cards (public/private via `visibility` param) — also used for admin moderation |
| 02 | `/preference-cards/stats` | `GET` | Bearer | Done | Stats (BOLA safe) |
| 03 | `/preference-cards/specialties` | `GET` | Bearer | Done | Distinct specialties for filter dropdown |
| 04 | `/preference-cards` | `POST` | Bearer | Done | Create card (multipart, draft/publish) |
| 05 | `/preference-cards/:cardId` | `GET` | Bearer | Done | Get full details of a card |
| 06 | `/preference-cards/:cardId` | `PATCH` | Bearer | Done | Update card (partial, owner/admin) |
| 07 | `/preference-cards/:cardId` | `DELETE` | Bearer | Done | Hard delete (owner/admin) |
| 08 | `/preference-cards/favorites/cards/:cardId` | `PUT` | Bearer | Done | Add to favorites (Idempotent) |
| 09 | `/preference-cards/favorites/cards/:cardId` | `DELETE` | Bearer | Done | Remove from favorites (Idempotent) |
| 10 | `/preference-cards/:cardId/download` | `POST` | Bearer | Done | Increment downloads |
| 11 | `/preference-cards/:cardId` | `PATCH` | SUPER_ADMIN | Contract Done · Code Pending | Unified verify/reject per D8. Code currently uses `/:cardId/status` — refactor in progress. |
