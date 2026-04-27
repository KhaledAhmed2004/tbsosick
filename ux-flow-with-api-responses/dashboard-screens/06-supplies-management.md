# Screen 6: Supplies Management

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Preference Card Management](./04-preference-card-management.md) (card create/edit er somoy supplies select kora hoy)

## UX Flow

### Supplies List View
1. Admin sidebar theke "Supplies" e click kore
2. Page load e supplies list fetch hoy → [GET /supplies](../modules/supply.md#71-list-supplies)
3. Screen render hoy: search bar + supplies table (name, actions)
4. Admin search bar e type korle name diye filter hoy (query param: `searchTerm`)
5. Pagination controls e page/limit change korle re-fetch hoy

### Create Single Supply
1. Admin "Add Supply" button e click kore
2. Modal/form open hoy — name input field
3. Submit → [POST /supplies](../modules/supply.md#72-create-supply)
4. Success → modal close + list re-fetch
5. Error (duplicate name ba validation fail) → error message dekhabe

### Bulk Create Supplies
1. Admin "Bulk Add" button e click kore
2. Multiple name input field show hoy (add more button shoho)
3. Submit → [POST /supplies/bulk](../modules/supply.md#73-bulk-create-supplies)
4. Success → response e createdCount + duplicates list dekhabe
5. Duplicate thakle warning show korbe kon gula already exist kore

### Update Supply
1. Admin kono supply row-er edit icon e click kore
2. Edit modal open hoy current name shoho
3. Name change kore submit → [PATCH /supplies/:supplyId](../modules/supply.md#74-update-supply)
4. Success → modal close + list re-fetch

### Delete Supply
1. Admin kono supply row-er delete icon e click kore
2. Confirmation dialog show hoy
3. Confirm korle → [DELETE /supplies/:supplyId](../modules/supply.md#75-delete-supply)
4. Success → list theke remove hoy

---

## Edge Cases

- **Duplicate Name**: Same name diye create attempt korle inline form error ("Already exists") dekhabe.
- **Bulk Duplicates**: Bulk create response e `duplicates` array thake — UI banner show kore kon gula skip hoyeche.
- **Not Found**: List row-er backing record server-side delete hoye gele edit/delete e "Supply no longer exists" toast + list refresh.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/supplies` | [Module 7.1](../modules/supply.md#71-list-supplies) |
| 2 | POST | `/supplies` | [Module 7.2](../modules/supply.md#72-create-supply) |
| 3 | POST | `/supplies/bulk` | [Module 7.3](../modules/supply.md#73-bulk-create-supplies) |
| 4 | PATCH | `/supplies/:supplyId` | [Module 7.4](../modules/supply.md#74-update-supply) |
| 5 | DELETE | `/supplies/:supplyId` | [Module 7.5](../modules/supply.md#75-delete-supply) |
