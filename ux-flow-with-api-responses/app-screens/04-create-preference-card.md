# Screen 4: Create Preference Card

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) — floating action button theke navigation; [Supplies Management](../dashboard-screens/06-supplies-management.md) — catalog source for supply dropdown; [Sutures Management](../dashboard-screens/07-sutures-management.md) — catalog source for suture dropdown
> **Doc version**: `v1` — last reviewed `2026-04-30`

---

## Common UI Rules

- **Submit protection**: button disabled on first tap + spinner shown; re-enable only on API settle (success or error).
- **Offline**: pre-flight `navigator.onLine` check; show inline *"You're offline. Check your connection and try again."*
- **5xx**: toast *"Something went wrong. Please try again."*
- **Validation (`422`)**: server field errors → render inline under the relevant field.

---

## UX Flow

### Create Card

1. User Home screen-er "+" floating button-e tap kore.
2. Create Card screen mount hoy.
3. Parallel-e two catalog calls fire hoy:
   - [`GET /supplies`](../modules/supply.md#71-list-supplies)
   - [`GET /sutures`](../modules/suture.md#81-list-sutures)
4. Catalog loading state-e supply/suture search fields disabled with loading indicator.
5. On catalog `200` → search fields enabled, results ready.
6. On catalog error → per-field error shown independently: *"Failed to load options. Tap to retry."* with retry CTA.
7. User required fields fill kore: `cardTitle`, surgeon info (`fullName`, `specialty`, `handPreference`, `contactNumber`, `musicPreference`).
8. User optional fields fill kore (jodi chay): `medication`, `instruments`, `positioningEquipment`, `prepping`, `workflow`, `keyNotes`.
9. **Supplies section**: user search field-e type kore.
   - Database-e match thakle → up to 3–4 results show hoy as selectable rows.
   - Exact match na thakle (ba partial match-er sathe) → list-er shesh-e একটা row show hoy: `+ Add "X" as custom` — user ei row-e tap korle `X` directly selected hoy.
   - Selected supply-er sathe quantity field appear hoy; positive integer required.
10. **Sutures section**: same interaction pattern as Supplies (step 9).
11. Photo upload: user photo picker open kore, max 5 photos select kore.
12. Form bottom-e two CTAs: **Save as Draft** (secondary) and **Publish** (primary).
13. User **Save as Draft** ba **Publish** tap kore — selected action `published: false` ba `published: true` set kore.
14. Submit button (whichever tapped) disabled + spinner.
15. [`POST /preference-cards`](../modules/preference-card.md#34-create-preference-card) call hoy with `multipart/form-data`.
16. On `201` → Card Details screen-e navigate kora hoy (new card-er `id` diye).
17. On `400` (published + missing required fields) → see [Publish Validation Error](#publish-validation-error).
18. On `422` → field-level inline errors show hoy.

> **Banglish — WHY parallel catalog fetch?** Supplies আর Sutures duto independent endpoint — sequentially call korle form-er load time double hoy.

---

## Validation Rules

| Field | Rule | Inline error |
|---|---|---|
| `cardTitle` | Required, non-empty string | *"Card title is required."* |
| `fullName` | Required, non-empty string | *"Surgeon name is required."* |
| `specialty` | Required, non-empty string | *"Specialty is required."* |
| `handPreference` | Required; accepted values per API enum | *"Hand preference is required."* |
| `contactNumber` | Optional; if provided, valid phone format | *"Enter a valid contact number."* |
| `supplies[].quantity` | Required if supply selected; positive integer | *"Quantity must be a positive number."* |
| `sutures[].quantity` | Required if suture selected; positive integer | *"Quantity must be a positive number."* |
| `photos` | Max 5 files; max 5 MB per file; accepted types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif` | *"You can upload up to 5 photos."* |
| `published` | If `true`: `medication`, `instruments`, `positioningEquipment`, `prepping`, `workflow`, `keyNotes`, ≥1 supply, ≥1 suture — all required | *"All required sections must be filled before publishing."* |

---

## Edge Cases

### Publish Validation Error

- **Trigger**: `POST /preference-cards` returns `400` — `published: true` but one or more required clinical fields missing.
- **UI response**: Inline banner at top of form + individual section highlighting.
- **Message**: *"All required sections must be filled before publishing."*

---

## Endpoints Used

| # | Method | Endpoint | Module Spec | Used in flow |
|---|---|---|---|---|
| 1 | `POST` | `/preference-cards` | [Module 3.4](../modules/preference-card.md#34-create-preference-card) | Create Card |
| 2 | `GET` | `/supplies` | [Module 7.1](../modules/supply.md#71-list-supplies) | Create Card step 3 |
| 3 | `GET` | `/sutures` | [Module 8.1](../modules/suture.md#81-list-sutures) | Create Card step 3 |
