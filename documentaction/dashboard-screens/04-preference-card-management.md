# Screen 4: Preference Card Management (Admin Dashboard)

> **Section**: App Screens — UX Flow  
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)  
> **Related screens**: Overview (02-overview.md) — shows aggregated card metrics that this screen drills into for moderation and control  

---



## UX Flow

### 1. Card Moderation Entry & Listing

1. Admin opens the sidebar and selects **Preference Card Management**.
2. System loads all preference cards within the admin’s permission scope (server-filtered access control).
3. A paginated table is displayed with:
   - Card Title  
   - Surgeon Name  
   - Specialty  
   - Verification Status (VERIFIED / UNVERIFIED)  
   - Creation Date  
4. Admin can browse pages and apply filters before selecting a card for actions.

> Search is executed after a 300ms debounce (waits briefly after typing stops) using a case-insensitive substring match across title and surgeon name fields via a backend `$or` query with `$regex` and `$options: 'i'`.

> When no cards match the current filter, the table renders an empty state (no rows) rather than a broken or error view. The response is still treated as a successful request returning an empty dataset.

#### Search & Filter Controls

* **Search Bar** — searches across card title and surgeon name  
* **Verification Filter** — toggles between VERIFIED and UNVERIFIED cards  
* **Pagination Controls** — navigates through filtered dataset pages  
  * Behavior depends on filter interaction rules defined in Q2  

---

### 2. Card Review & Verification Actions

1. Admin selects a card from the table.
2. Admin performs a moderation action:
   - Approve → marks card as VERIFIED  
   - Reject → marks card as UNVERIFIED  
3. After action completes:
   - The updated status is reflected in the same row  
   - A downstream notification event is triggered for other systems  
   - The list updates according to the active filter and pagination state (behavior depends on Q4 resolution)

---

### 3. Card Deletion Flow

1. Admin triggers the delete action on a specific card.
2. System removes the card after confirmation.
3. The table updates to reflect the deletion under the current filter and pagination context.