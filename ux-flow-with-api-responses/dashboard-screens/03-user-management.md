# Screen 3: User Management

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Overview](./02-overview.md) (Stats display)

## UX Flow

### Doctor List & Management Flow

1. Admin sidebar theke "User Management" module e click kore
2. Page load e user stats cards fetch hoy → [GET /users/stats](../modules/user.md#23-user-stats-overview-cards)
3. Page load e user list fetch hoy → [GET /users](../modules/user.md#22-getsearch-users-doctors)
4. Admin search bar use kore user name ba email search kore → [GET /users?search=Dr. John](../modules/user.md#22-getsearch-users-doctors)
5. Admin filters use kore specialty ba status select kore → [GET /users?specialty=Cardiology&status=ACTIVE](../modules/user.md#22-getsearch-users-doctors)
6. User table render hoy: User Info (Name, Email, Phone, Specialty, Cards Count, Subscription Status) dekhay
7. Admin "Create User" button click kore form fill up kore submit kore → [POST /users](../modules/user.md#21-create-user-registration--admin-create)
8. Edit action click korle pre-filled form ashe, update kore submit → [PATCH /users/:userId](../modules/user.md#24-update-user-admin)
9. Block/Activate action click kore user status update kore → [PATCH /users/:userId](../modules/user.md#24-update-user-admin) body `{ "status": "RESTRICTED" | "ACTIVE" }`
10. Delete action click korle confirm modal ashe, submit → [DELETE /users/:userId](../modules/user.md#25-delete-user-admin)

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Duplicate Email** | Existing email diye user create korle inline form error ("Email already exists") dekhabe. |
| **Invalid ID** | Edit/Delete action target user not found hole "User not found" toast ebong list refresh. |
| **Empty Search Result** | List area-e "No users match your filter" empty state dekhabe (table structure intact). |
| **Validation Fail** | Invalid phone/email submit korle field-level error message dekhabe. |
| **Invalid Status Value** | Disallowed status value submit korle save button disable thakbe + tooltip dekhabe. |
| **Subscription Cascade** | User delete korleo subscription/data cascade hoye system consistent rakhe; admin-er kichu manual cleanup lage na. |

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/users/stats` | [Module 2.3](../modules/user.md#23-user-stats-overview-cards) |
| 2 | GET | `/users` | [Module 2.2](../modules/user.md#22-getsearch-users-doctors) |
| 3 | POST | `/users` | [Module 2.1](../modules/user.md#21-create-user-registration--admin-create) |
| 4 | PATCH | `/users/:userId` | [Module 2.4](../modules/user.md#24-update-user-admin) |
| 5 | DELETE | `/users/:userId` | [Module 2.5](../modules/user.md#25-delete-user-admin) |
