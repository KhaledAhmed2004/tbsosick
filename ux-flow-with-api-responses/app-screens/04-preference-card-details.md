# Screen 4: Preference Card Details

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Home](./03-home.md) (Back to favorites)

## UX Flow

### View Card Details
1. User Home screen-er favorite list ba search results theke kono card-e tap kore.
2. Page load-e card details fetch hoy → `GET /preference-cards/:id` (→ 4.1).
3. Screen render hoy:
   - Card title, Surgeon info (Name, Specialty, Hand Preference, Music, etc.).
   - Medication, Supplies (list with quantity), Sutures (list with quantity).
   - Instruments, Positioning Equipment, Prepping, Workflow.
   - Key Notes ebong Photo Library (images).
4. User favorite icon toggle kore card favorite/unfavorite korte pare.

### Share & Download
1. **Share**: User "Share" icon-e tap kore. System share sheet open hoy card title ebong link/details shoho. (Frontend-only action, logic context: `Share.share({ message: cardTitle + ... })`).
2. **Download**: User "Download" button-e tap kore card-er PDF ba image save korar jonno.
3. Download trigger hole backend-e count update hobe → `POST /preference-cards/:id/download` (→ 4.2).

---

## Edge Cases

- **Private Card Access**: Jodi card private hoy ebong user owner na hoy, tahole 403 Forbidden return korbe.
- **Card Not Found**: Card deleted ba invalid ID hole 404 dekhabe.
- **Download Offline**: Offline thakle download logic retry ba error message dekhabe.

---

<!-- ══════════════════════════════════════ -->
<!--              CARD DETAILS                -->
<!-- ══════════════════════════════════════ -->

### 4.1 Get Card Details

```
GET /preference-cards/:id
Auth: Bearer {{accessToken}}
```

> Card-er shob details (surgeon, supplies, sutures, workflow, etc.) fetch korar jonno.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `getById`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `getPreferenceCardByIdFromDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Preference card details fetched",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "cardTitle": "Knee Arthroscopy",
      "surgeon": {
        "fullName": "Dr. Smith",
        "handPreference": "Right",
        "specialty": "Orthopedics",
        "contactNumber": "+1234567890",
        "musicPreference": "Classical"
      },
      "medication": "Lidocaine with Epinephrine",
      "supplies": [
        { "name": "Sterile Gauze", "quantity": 10 },
        { "name": "Suture Pack", "quantity": 2 }
      ],
      "sutures": [
        { "name": "3-0 Vicryl", "quantity": 1 }
      ],
      "instruments": "Standard arthroscopy set",
      "positioningEquipment": "Leg holder",
      "prepping": "Betadine",
      "workflow": "Incision, portal placement, joint inspection...",
      "keyNotes": "Be careful with the ACL",
      "photoLibrary": [
        "https://res.cloudinary.com/demo/image/upload/sample.jpg"
      ],
      "verificationStatus": "VERIFIED",
      "downloadCount": 15,
      "isFavorite": true
    }
  }
  ```

---

### 4.2 Increment Download Count

```
POST /preference-cards/:id/download
Auth: Bearer {{accessToken}}
```

> User card download korle download count baranor jonno call kora hoy.

**Implementation:**
- **Route**: [preference-card.route.ts](file:///src/app/modules/preference-card/preference-card.route.ts)
- **Controller**: [preference-card.controller.ts](file:///src/app/modules/preference-card/preference-card.controller.ts) — `incrementDownloadCount`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `incrementDownloadCountInDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Download count incremented",
    "data": {
      "downloadCount": 16
    }
  }
  ```

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 4.1 | `/preference-cards/:id` | `GET` | Bearer | ✅ Done | Get full details of a card |
| 4.2 | `/preference-cards/:id/download` | `POST` | Bearer | ✅ Done | Update download count |
