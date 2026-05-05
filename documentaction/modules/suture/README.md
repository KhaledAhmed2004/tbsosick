# Suture Module APIs

> **Section**: Backend API specifications for the suture module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Card Details](../../app-screens/03-preference-card-details.md) — Catalog dropdown for card create/edit form
> - [Dashboard Sutures Management](../../dashboard-screens/07-sutures-management.md) — Admin master catalog CRUD

---

## Endpoints Index

| # | Method | Endpoint | Auth | Documentation | Used By |
|---|---|---|---|---|---|
| 01 | GET | `/sutures` | Bearer / SUPER_ADMIN | [01-list-sutures.md](./01-list-sutures.md) | [App Card Details], [Dashboard Sutures Mgmt] |
| 02 | POST | `/sutures` | SUPER_ADMIN | [02-create-suture.md](./02-create-suture.md) | [Dashboard Sutures Mgmt] |
| 03 | POST | `/sutures/bulk` | SUPER_ADMIN | [03-bulk-create-sutures.md](./03-bulk-create-sutures.md) | [Dashboard Sutures Mgmt] |
| 04 | PATCH | `/sutures/:sutureId` | SUPER_ADMIN | [04-update-suture.md](./04-update-suture.md) | [Dashboard Sutures Mgmt] |
| 05 | DELETE | `/sutures/:sutureId` | SUPER_ADMIN | [05-delete-suture.md](./05-delete-suture.md) | [Dashboard Sutures Mgmt] |

---

## Edge Cases

- **Duplicate Name**: Create e jodi same name already exist kore, backend error throw korbe.
- **Bulk Duplicates**: Bulk create e duplicate names skip kore — response e `duplicates` array te kon gula skip hoyeche dekhay.
- **Not Found**: Update/Delete e invalid ID hole 404 return korbe.
- **Auto-create from Card**: Preference card create/update e sutures e plain `name` (ObjectId nay) pathale backend automatically catalog e add kore dey.

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 01 | `/sutures` | `GET` | Bearer | Done | Paginated list with search; reused for card-form catalog |
| 02 | `/sutures` | `POST` | SUPER_ADMIN | Done | Single suture create |
| 03 | `/sutures/bulk` | `POST` | SUPER_ADMIN | Done | Bulk create with duplicate skip |
| 04 | `/sutures/:sutureId` | `PATCH` | SUPER_ADMIN | Done | Update name |
| 05 | `/sutures/:sutureId` | `DELETE` | SUPER_ADMIN | Done | Hard delete |
