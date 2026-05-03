# Screen 5: Legal Management (Dashboard APIs (Admin-Facing))

> **Section**: App Screens — UX Flow
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: Admin Overview (high-level system dashboard that likely links into Legal content management for governance context)

---

## UI Flow Mismatches & Open Questions

> **No UI flow mismatches detected — screen flow is clean and ready for backend analysis.** Every step in the UX Flow above is unambiguous and consistent with related screens. Move to Step 2.

---

## UX Flow

### 1. Legal Page List Load

1. Admin sidebar theke **“Legal Management”** module e click kore screen open kore.
2. Screen load hole system backend theke paginated legal pages fetch kore.
3. System fallback hishebe empty list return kore on failure.
4. Admin ekta list dekhe jekhane existing legal pages show hoy (title-based list).
5. Admin list theke **title-based search** korte pare (filtering by title only).

#### Legal Page List Region

* **Legal Pages List**

  * Each item represents one legal document (e.g., Terms, Privacy Policy).
  * Item click korle edit mode open hoy.

---

### 2. Create New Legal Page

1. Admin **“Create New Page”** button click kore.
2. Form open hoy jekhane admin title + content input dey.
3. Submit korle new legal page create hoy.
4. Success hole list update hoy ebong new page add hoy.

---

### 3. Edit Existing Legal Page

1. Admin list theke kono page select kore.
2. Selected page edit mode e open hoy.
3. Admin content modify kore **Save** click kore.
4. After successful save, backend updated full legal page return kore.
5. UI immediately updates the list using returned updated document, ensuring no stale state.

---

### 4. Delete Legal Page

1. Admin list theke kono page er delete action click kore.
2. System confirmation modal show kore (delete confirm request).
3. Admin confirm korle system delete action execute kore.
4. Page remove hoy list theke and UI update hoy.
