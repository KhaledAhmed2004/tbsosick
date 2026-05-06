# User Module APIs

> **Section**: Backend API specifications for the user module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App - Auth Screen] — Registration (`POST /users`)
> - [App - Home Screen] — Favorites list (`GET /users/me/favorites`)
> - [App - Profile Screen] — Profile read/update
> - [Dashboard - User Management Screen] — Admin CRUD + stats

---

## Endpoints Index

| # | Method | Endpoint | Auth | Documentation | Used By |
|---|---|---|---|---|---|
| 01 | POST | `/users` | Public / SUPER_ADMIN | [01-create-user.md](./01-create-user.md) | [App - Auth Screen], [Dashboard - User Management Screen] |
| 02 | GET | `/users` | SUPER_ADMIN | [02-list-users-admin.md](./02-list-users-admin.md) | [Dashboard - User Management Screen] |
| 03 | GET | `/users/stats` | SUPER_ADMIN | [03-user-stats-dashboard.md](./03-user-stats-dashboard.md) | [Dashboard - User Management Screen] |
| 04 | PATCH | `/users/:userId` | SUPER_ADMIN | [04-update-user-admin.md](./04-update-user-admin.md) | [Dashboard - User Management Screen] |
| 05 | PATCH | `/users/:userId/status` | SUPER_ADMIN | [05-update-user-status-admin.md](./05-update-user-status-admin.md) | Admin status toggle |
| 06 | DELETE | `/users/:userId` | SUPER_ADMIN | [06-delete-user-admin.md](./06-delete-user-admin.md) | [Dashboard - User Management Screen] |
| 07 | GET | `/users/:userId` | SUPER_ADMIN | [07-get-user-by-id-admin.md](./07-get-user-by-id-admin.md) | Admin view user |
| 08 | GET | `/users/:userId/user` | Bearer (User/Admin) | [08-get-user-details-public.md](./08-get-user-details-public.md) | Public user details |
| 09 | GET | `/users/profile` | Bearer | [09-get-own-profile.md](./09-get-own-profile.md) | [App - Profile Screen] |
| 10 | PATCH | `/users/profile` | Bearer | [10-update-own-profile.md](./10-update-own-profile.md) | [App - Profile Screen] |
| 05 | GET | `/users/me/favorites` | Bearer | [05-list-favorite-cards.md](./05-list-favorite-cards.md) | [App - Home Screen] |
| 06 | PATCH | `/users/complete-onboarding` | Bearer | [06-complete-onboarding.md](./06-complete-onboarding.md) | [App - Onboarding Flow] |

---

## API Status

| # | Endpoint | Status | Roles | Notes |
|---|---|:---:|:---:|---|
| 01 | `POST /users` | Done | Public / SUPER_ADMIN | Shared handler |
| 02 | `GET /users/:userId/user` | Done | User / Admin | Public details |
| 03 | `GET /users/profile` | Done | User / Admin | Self profile |
| 10 | `PATCH /users/profile` | Done | User / Admin | Self update + upload |
| 11 | `GET /users/me/favorites` | Done | User / Admin | Summarized list |
| 12 | `PATCH /users/complete-onboarding` | Done | User / Admin | Mark onboarding completed |
