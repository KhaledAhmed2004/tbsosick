# Screen 7: Sutures Management

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Preference Card Management](./04-preference-card-management.md) (card create/edit er somoy sutures select kora hoy)

## UX Flow

### Sutures List View
1. Admin sidebar theke "Sutures" e click kore
2. Page load e sutures list fetch hoy → [GET /sutures](../modules/suture.md#81-list-sutures)
3. Screen render hoy: search bar + sutures table (name, actions)
4. Admin search bar e type korle name diye filter hoy (query param: `searchTerm`)
5. Pagination controls e page/limit change korle re-fetch hoy

### Create Single Suture
1. Admin "Add Suture" button e click kore
2. Modal/form open hoy — name input field
3. Submit → [POST /sutures](../modules/suture.md#82-create-suture)
4. Success → modal close + list re-fetch
5. Error (duplicate name ba validation fail) → error message dekhabe

### Bulk Create Sutures
1. Admin "Bulk Add" button e click kore
2. Multiple name input field show hoy (add more button shoho)
3. Submit → [POST /sutures/bulk](../modules/suture.md#83-bulk-create-sutures)
4. Success → response e createdCount + duplicates list dekhabe
5. Duplicate thakle warning show korbe kon gula already exist kore

### Update Suture
1. Admin kono suture row-er edit icon e click kore
2. Edit modal open hoy current name shoho
3. Name change kore submit → [PATCH /sutures/:sutureId](../modules/suture.md#84-update-suture)
4. Success → modal close + list re-fetch

### Delete Suture
1. Admin kono suture row-er delete icon e click kore
2. Confirmation dialog show hoy
3. Confirm korle → [DELETE /sutures/:sutureId](../modules/suture.md#85-delete-suture)
4. Success → list theke remove hoy

---

## Edge Cases

- **Duplicate Name**: Same name diye create attempt korle inline form error ("Already exists") dekhabe.
- **Bulk Duplicates**: Bulk create response e `duplicates` array thake — UI banner show kore kon gula skip hoyeche.
- **Not Found**: List row-er backing record server-side delete hoye gele edit/delete e "Suture no longer exists" toast + list refresh.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/sutures` | [Module 8.1](../modules/suture.md#81-list-sutures) |
| 2 | POST | `/sutures` | [Module 8.2](../modules/suture.md#82-create-suture) |
| 3 | POST | `/sutures/bulk` | [Module 8.3](../modules/suture.md#83-bulk-create-sutures) |
| 4 | PATCH | `/sutures/:sutureId` | [Module 8.4](../modules/suture.md#84-update-suture) |
| 5 | DELETE | `/sutures/:sutureId` | [Module 8.5](../modules/suture.md#85-delete-suture) |
