# Screen 6: Supplies Management (Admin Dashboard)

> **Section**: App Screens — UX Flow
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Preference Card Management](./04-preference-card-management.md) — supplies are selected during card creation/edit flow

---

## UX Flow

### 1. Supplies List View

1. Admin navigates from sidebar to **Supplies** screen
2. System fetches supplies list on page load
3. UI renders table view with:

   * supply name
   * row actions (edit, delete)
   * search input and pagination controls
4. Admin types in search bar → list updates based on `searchTerm` filter (debounced ~300ms, case-insensitive regex match)
5. Admin changes page or page size → list is re-fetched with updated pagination params
6. If search term changes → **page resets to 1 automatically (prevents invalid page state)**
7. If no supplies exist:

   * UI shows empty state: **“No supplies found”**

---

### 2. Create Single Supply

1. Admin clicks **Add Supply** button
2. Modal opens with a single input field for supply name
3. Admin submits form
4. On success:

   * modal closes
   * list is refreshed to reflect new supply
5. On failure:

   * inline validation error shown (e.g. duplicate name or invalid input)

---

### 3. Bulk Create Supplies

1. Admin clicks **Bulk Add** button
2. Modal opens with multiple name input fields (with “Add more” option)
3. Admin submits list of supplies
4. On success:

   * system returns number of created items
   * duplicates list is returned and displayed as warning banner
   * UI refreshes supply list
5. On partial duplication:

   * valid supplies are created
   * duplicates are skipped and reported in UI

---

### 4. Update Supply

1. Admin clicks edit icon on a supply row
2. Edit modal opens with existing name pre-filled
3. Admin updates name and submits
4. On success:

   * modal closes
   * list refreshes to reflect updated value

---

### 5. Delete Supply

1. Admin clicks delete icon on a supply row
2. Confirmation dialog is shown
3. Admin confirms deletion
4. On success:

   * item is removed from list
   * list is refreshed
