# Supply Module APIs

> **Section**: Backend API specifications for the supply module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - App - Preference Card Details Screen — Catalog dropdown for card create/edit form
> - Dashboard - Supplies Management Screen — Admin master catalog CRUD

---

## Endpoints Index

| # | Method | Endpoint | Auth | Documentation | Used By |
|---|---|---|---|---|---|
| 01 | GET | `/supplies` | Bearer / SUPER_ADMIN | [01-list-supplies.md](./01-list-supplies.md) | [App - Preference Card Details Screen], [Dashboard - Supplies Management Screen] |
| 02 | POST | `/supplies` | SUPER_ADMIN | [02-create-supply.md](./02-create-supply.md) | [Dashboard - Supplies Management Screen] |
| 03 | POST | `/supplies/bulk` | SUPER_ADMIN | [03-bulk-create-supplies.md](./03-bulk-create-supplies.md) | [Dashboard - Supplies Management Screen] |
| 04 | PATCH | `/supplies/:supplyId` | SUPER_ADMIN | [04-update-supply.md](./04-update-supply.md) | [Dashboard - Supplies Management Screen] |
| 05 | DELETE | `/supplies/:supplyId` | SUPER_ADMIN | [05-delete-supply.md](./05-delete-supply.md) | [Dashboard - Supplies Management Screen] |

---

## Edge Cases

- **Duplicate Name**: Create e jodi same name already exist kore, backend error throw korbe.
- **Bulk Duplicates**: Bulk create e duplicate names skip kore — response e `duplicates` array te kon gula skip hoyeche dekhay.
- **Not Found**: Update/Delete e invalid ID hole 404 return korbe.
- **Auto-create from Card**: Preference card create/update e supplies e plain `name` (ObjectId nay) pathale backend automatically catalog e add kore dey.

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 01 | `/supplies` | `GET` | Bearer | Done | Paginated list with search; reused for card-form catalog |
| 02 | `/supplies` | `POST` | SUPER_ADMIN | Done | Single supply create |
| 03 | `/supplies/bulk` | `POST` | SUPER_ADMIN | Done | Bulk create with duplicate skip |
| 04 | `/supplies/:supplyId` | `PATCH` | SUPER_ADMIN | Done | Update name |
| 05 | `/supplies/:supplyId` | `DELETE` | SUPER_ADMIN | Done | Hard delete |
