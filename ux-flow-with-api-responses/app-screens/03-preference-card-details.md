# Screen 3: Preference Card Details

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Home](./02-home.md) (Back to favorites), [Supplies Management](../dashboard-screens/06-supplies-management.md) (catalog source), [Sutures Management](../dashboard-screens/07-sutures-management.md) (catalog source)

## UX Flow

### View Card Details
1. User Home screen-er favorite list ba search results theke kono card-e tap kore.
2. Page load-e card details fetch hoy → [GET /preference-cards/:cardId](../modules/preference-card.md#35-get-card-details).
3. Screen render hoy:
   - Card title, Surgeon info (Name, Specialty, Hand Preference, Music, etc.).
   - Medication, Supplies (list with quantity), Sutures (list with quantity).
   - Instruments, Positioning Equipment, Prepping, Workflow.
   - Key Notes ebong Photo Library (images).
4. User favorite icon toggle kore card favorite/unfavorite korte pare → [PUT](../modules/preference-card.md#38-favorite-a-card)/[DELETE /preference-cards/favorites/cards/:cardId](../modules/preference-card.md#39-unfavorite-a-card)

### Share & Download
1. **Share**: User "Share" icon-e tap kore. System share sheet open hoy card title ebong link/details shoho. (Frontend-only action, logic context: `Share.share({ message: cardTitle + ... })`).
2. **Download**: User "Download" button-e tap kore card-er PDF ba image save korar jonno.
3. Download trigger hole backend-e count update hobe → [POST /preference-cards/:cardId/download](../modules/preference-card.md#310-increment-download-count).

### Create Card Flow
1. User Home screen-er "+" floating button e tap kore
2. Form load howar somoy catalog fetch hoy parallel e:
   - Supplies list → [GET /supplies](../modules/supply.md#71-list-supplies)
   - Sutures list → [GET /sutures](../modules/suture.md#81-list-sutures)
3. User form fill kore: cardTitle, surgeon info (fullName, specialty, handPreference, contactNumber, musicPreference)
4. Optional fields: medication, instruments, positioningEquipment, prepping, workflow, keyNotes
5. Supplies/Sutures dropdown theke select kore quantity shoho
6. Photo upload korte pare (max 5 ta) → multipart/form-data
7. Submit → [POST /preference-cards](../modules/preference-card.md#34-create-preference-card)
8. Success → card details screen e navigate
9. Jodi `published: true` set kore kintu required fields missing, 400 error dekhabe

### Edit Card Flow
1. User card details screen e "Edit" icon e tap kore
2. Form pre-filled hoy current card data shoho
3. Catalog re-fetch hoy:
   - Supplies list → [GET /supplies](../modules/supply.md#71-list-supplies)
   - Sutures list → [GET /sutures](../modules/suture.md#81-list-sutures)
4. User je fields change korte chay shudhu segula edit kore
5. Submit → [PATCH /preference-cards/:cardId](../modules/preference-card.md#36-update-preference-card)
6. Success → updated card details screen e navigate
7. Jodi owner na hoy ba SUPER_ADMIN na hoy → 403 Forbidden

### Delete Card Flow
1. User card details screen e "Delete" button e tap kore
2. Confirmation dialog show hoy
3. Confirm korle → [DELETE /preference-cards/:cardId](../modules/preference-card.md#37-delete-preference-card)
4. Success → Home screen e navigate back
5. Owner ba SUPER_ADMIN chara delete korte parbe na → 403

---

## Edge Cases

- **Private Card Access**: Jodi card private hoy ebong user owner na hoy, tahole 403 Forbidden return korbe.
- **Card Not Found**: Card deleted ba invalid ID hole 404 dekhabe.
- **Download Offline**: Offline thakle download logic retry ba error message dekhabe.
- **Publish Validation**: `published: true` set korle shob required fields (medication, instruments, positioningEquipment, prepping, workflow, keyNotes, supplies, sutures) thakte hobe, nahole 400 error.
- **Auto-create Catalog Items**: Supplies/Sutures e jodi name diye pathay (ObjectId na diye), backend automatically create kore dey catalog e.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/preference-cards/:cardId` | [Module 3.5](../modules/preference-card.md#35-get-card-details) |
| 2 | POST | `/preference-cards` | [Module 3.4](../modules/preference-card.md#34-create-preference-card) |
| 3 | PATCH | `/preference-cards/:cardId` | [Module 3.6](../modules/preference-card.md#36-update-preference-card) |
| 4 | DELETE | `/preference-cards/:cardId` | [Module 3.7](../modules/preference-card.md#37-delete-preference-card) |
| 5 | PUT | `/preference-cards/favorites/cards/:cardId` | [Module 3.8](../modules/preference-card.md#38-favorite-a-card) |
| 6 | DELETE | `/preference-cards/favorites/cards/:cardId` | [Module 3.9](../modules/preference-card.md#39-unfavorite-a-card) |
| 7 | POST | `/preference-cards/:cardId/download` | [Module 3.10](../modules/preference-card.md#310-increment-download-count) |
| 8 | GET | `/supplies` | [Module 7.1](../modules/supply.md#71-list-supplies) |
| 9 | GET | `/sutures` | [Module 8.1](../modules/suture.md#81-list-sutures) |
