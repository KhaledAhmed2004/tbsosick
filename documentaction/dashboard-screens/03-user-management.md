# Screen 3: User Management (Admin-Facing)

> **Section**: Dashboard Screens — UX Flow
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Overview](./02-overview.md) — user statistics and summary metrics

---

## UX Flow

### 1. Doctor List & Management Flow

1. Admin opens the sidebar and selects the **User Management** module.
2. The screen loads a paginated user list with search and sorting controls.
3. By default, the list is sorted by newest-created users first (`createdAt: -1`).
4. Each user row shows profile details including name, email, specialty, hospital, account status, subscription state, and action controls.

#### User List Section

* **User Rows**

  * Each row represents one doctor or managed user account.
  * The row displays profile and account-related information in a table layout.
  * Admin can perform actions directly from the row.

* **Search Bar**

  * Admin searches users by typing into the search field.
  * Search triggers after ~300ms of inactivity (debounce — waiting briefly after typing stops to reduce repeated requests).
  * Search matches against **name, specialty, and hospital fields**.
  * Results update the table dynamically.

* **Sorting Controls**

  * Admin can switch between newest-first and oldest-first ordering.
  * The table reloads using the selected sort option.
  * Default state is newest-first.

* **Pagination Controls**

  * Admin navigates across pages of users.
  * When a page becomes empty (e.g., after deletions), the system automatically moves to the previous valid page and reloads data.

---

### 2. User Create & Edit Flow

1. Admin selects create or edit action from the management screen.
2. A form opens with editable user fields such as name, specialty, hospital, and phone number.
3. Admin submits the form after updating the required information.

#### Editable Fields

* **Profile Information**

  * Admin updates user details through a validated form.
  * Inline validation errors appear for invalid inputs.

4. After successful create or edit:

   * The user list automatically refreshes.
   * Updated user data appears immediately in the table.

---

### 3. User Status & Removal Flow

1. Admin selects block, unblock, or delete from a user row action menu.
2. The selected user's account state changes based on the action.
3. The table updates immediately to reflect the change.

#### Status Actions

* **Block / Unblock**

  * Toggles user account active/restricted state.
  * UI updates instantly using optimistic update (immediate visual change before full re-fetch).

* **Delete User**

  * Removes the user from the system.
  * After deletion, the list refreshes and pagination adjusts if needed.

* **Role Restrictions**

  * Only `SUPER_ADMIN` can perform block, unblock, or delete actions.
  * Other admin roles can only view or manage non-destructive actions (if applicable in system rules).
