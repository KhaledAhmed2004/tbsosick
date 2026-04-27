# Screen 5: Legal Management

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)

## UX Flow

### Legal Content Management Flow

1. Admin sidebar theke "Legal Management" module e click kore.
2. Page load e shob available legal pages fetch hoy → [GET /legal](../modules/legal.md#61-list-legal-pages)
3. Admin "Create New Page" button click kore form fill up kore (Title, Content) submit kore → [POST /legal](../modules/legal.md#63-create-legal-page)
4. Admin existing kono page edit korar jonno list theke select kore → [GET /legal/:slug](../modules/legal.md#62-get-legal-page-by-slug)
5. Content update korar por "Save" button click kore → [PATCH /legal/:slug](../modules/legal.md#64-update-legal-page)
6. Admin jodi kono page delete korte chay, delete action click kore → [DELETE /legal/:slug](../modules/legal.md#65-delete-legal-page)

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Duplicate Slug** | Existing slug diye new page create korle inline form error ("Slug already in use") dekhabe. |
| **Invalid Slug** | List item-er backing slug delete hoye gele edit/delete attempt e "Page no longer exists" toast + list refresh. |
| **Unauthorized Access** | Non-admin login state-e ei screen visible thake na (sidebar item hidden). |
| **Empty List** | Kono legal page na thakle list area-e "No legal pages yet — Create one" CTA dekhabe. |

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/legal` | [Module 6.1](../modules/legal.md#61-list-legal-pages) |
| 2 | GET | `/legal/:slug` | [Module 6.2](../modules/legal.md#62-get-legal-page-by-slug) |
| 3 | POST | `/legal` | [Module 6.3](../modules/legal.md#63-create-legal-page) |
| 4 | PATCH | `/legal/:slug` | [Module 6.4](../modules/legal.md#64-update-legal-page) |
| 5 | DELETE | `/legal/:slug` | [Module 6.5](../modules/legal.md#65-delete-legal-page) |
