# Screen 3: Preference Card Details

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Home](./02-home.md) (Back to favorites), [Supplies Management](../dashboard-screens/06-supplies-management.md) (catalog source), [Sutures Management](../dashboard-screens/07-sutures-management.md) (catalog source)

## UX Flow

### View Card Details
1. User Home screen-er favorite list ba search results theke kono card-e tap kore.
2. Page load-e card details fetch hoy → `GET /preference-cards/:cardId` (→ 3.1).
3. Screen render hoy:
   - Card title, Surgeon info (Name, Specialty, Hand Preference, Music, etc.).
   - Medication, Supplies (list with quantity), Sutures (list with quantity).
   - Instruments, Positioning Equipment, Prepping, Workflow.
   - Key Notes ebong Photo Library (images).
4. User favorite icon toggle kore card favorite/unfavorite korte pare.

### Share & Download
1. **Share**: User "Share" icon-e tap kore. System share sheet open hoy card title ebong link/details shoho. (Frontend-only action, logic context: `Share.share({ message: cardTitle + ... })`).
2. **Download**: User "Download" button-e tap kore card-er PDF ba image save korar jonno.
3. Download trigger hole backend-e count update hobe → `POST /preference-cards/:cardId/download` (→ 3.2).

### Create Card Flow
1. User Home screen-er "+" floating button e tap kore
2. Form load howar somoy catalog fetch hoy parallel e:
   - Supplies list → `GET /supplies` (→ 3.5)
   - Sutures list → `GET /sutures` (→ 3.6)
3. User form fill kore: cardTitle, surgeon info (fullName, specialty, handPreference, contactNumber, musicPreference)
4. Optional fields: medication, instruments, positioningEquipment, prepping, workflow, keyNotes
5. Supplies/Sutures dropdown theke select kore quantity shoho
6. Photo upload korte pare (max 5 ta) → multipart/form-data
7. Submit → `POST /preference-cards` (→ 3.3)
8. Success → card details screen e navigate
9. Jodi `published: true` set kore kintu required fields missing, 400 error dekhabe

### Edit Card Flow
1. User card details screen e "Edit" icon e tap kore
2. Form pre-filled hoy current card data shoho
3. Catalog re-fetch hoy:
   - Supplies list → `GET /supplies` (→ 3.5)
   - Sutures list → `GET /sutures` (→ 3.6)
4. User je fields change korte chay shudhu segula edit kore
5. Submit → `PATCH /preference-cards/:cardId` (→ 3.4)
6. Success → updated card details screen e navigate
7. Jodi owner na hoy ba SUPER_ADMIN na hoy → 403 Forbidden

### Delete Card Flow
1. User card details screen e "Delete" button e tap kore
2. Confirmation dialog show hoy
3. Confirm korle → `DELETE /preference-cards/:cardId` (→ 3.7)
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

<!-- ══════════════════════════════════════ -->
<!--              CARD DETAILS                -->
<!-- ══════════════════════════════════════ -->

### 3.1 Get Card Details

```
GET /preference-cards/:cardId
Auth: Bearer {{accessToken}} (USER)
```

> Card-er shob details (surgeon, supplies, sutures, workflow, etc.) fetch korar jonno.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `getById`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `getPreferenceCardByIdFromDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Preference card details fetched",
    "data": {
      "id": "664a1b2c3d4e5f6a7b8c9d0e",
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
      "isFavorited": true
    }
  }
  ```

- **Scenario: Not Found (404)**
  ```json
  {
    "success": false,
    "statusCode": 404,
    "message": "Preference card not found"
  }
  ```

- **Scenario: Forbidden (403)**
  ```json
  {
    "success": false,
    "statusCode": 403,
    "message": "Not authorized to access this card"
  }
  ```

---

### 3.2 Increment Download Count

```
POST /preference-cards/:cardId/download
Auth: Bearer {{accessToken}} (USER)
```

> User card download korle download count baranor jonno call kora hoy.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `incrementDownloadCount`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `incrementDownloadCountInDB`

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

<!-- ══════════════════════════════════════ -->
<!--              CREATE CARD                 -->
<!-- ══════════════════════════════════════ -->

### 3.3 Create Preference Card

```
POST /preference-cards
Content-Type: multipart/form-data
Auth: Bearer {{accessToken}} (USER)
```

> Notun preference card create kore. `cardTitle` ar `surgeon` required — baki fields optional (draft save korar jonno). `published: true` set korle shob required fields thakte hobe. Supplies/Sutures e ObjectId ba plain name duita-i pathano jay — name dile backend auto-create kore catalog e.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `createCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `createPreferenceCardInDB`

**Middleware chain**: `auth(USER) → fileHandler(photoLibrary max 5) → parseBody → validateRequest`

**Request Body:**
```json
{
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
    { "name": "Surgical Drape", "quantity": 2 }
  ],
  "sutures": [
    { "name": "3-0 Vicryl", "quantity": 1 }
  ],
  "instruments": "Standard arthroscopy set",
  "positioningEquipment": "Leg holder",
  "prepping": "Betadine",
  "workflow": "Incision, portal placement, joint inspection...",
  "keyNotes": "Be careful with the ACL",
  "published": false
}
```

> `photoLibrary` file upload e pathate hoy — form field name `photoLibrary`, max 5 files.
> `supplies` ar `sutures` JSON string hisebe pathate hoy multipart e.

#### Responses

- **Scenario: Success (201)**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Preference card created",
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
        { "supply": "664a1b2c3d4e5f6a7b8c9d10", "quantity": 10 },
        { "supply": "664a1b2c3d4e5f6a7b8c9d11", "quantity": 2 }
      ],
      "sutures": [
        { "suture": "664b2c3d4e5f6a7b8c9d1a0e", "quantity": 1 }
      ],
      "instruments": "Standard arthroscopy set",
      "positioningEquipment": "Leg holder",
      "prepping": "Betadine",
      "workflow": "Incision, portal placement, joint inspection...",
      "keyNotes": "Be careful with the ACL",
      "photoLibrary": [],
      "published": false,
      "verificationStatus": "UNVERIFIED",
      "downloadCount": 0,
      "createdBy": "664a1b2c3d4e5f6a7b8c0001",
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-15T10:30:00.000Z"
    }
  }
  ```

- **Scenario: Publish without required fields (400)**
  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "Cannot publish — missing required fields: medication, instruments, supplies"
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--              UPDATE CARD                 -->
<!-- ══════════════════════════════════════ -->

### 3.4 Update Preference Card

```
PATCH /preference-cards/:cardId
Content-Type: multipart/form-data
Auth: Bearer {{accessToken}} (USER)
```

> Existing card update kore. Shudhu je fields change korte chay segula pathale hobe. Owner ba SUPER_ADMIN chara update possible na.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `updateCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `updatePreferenceCardInDB`

**Middleware chain**: `auth(USER) → fileHandler(photoLibrary max 5) → parseBody → validateRequest`

**Request Body (partial):**
```json
{
  "cardTitle": "Updated Knee Arthroscopy",
  "medication": "Updated medication info",
  "published": true
}
```

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Preference card updated",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "cardTitle": "Updated Knee Arthroscopy",
      "published": true,
      "verificationStatus": "UNVERIFIED",
      "updatedAt": "2026-03-16T08:00:00.000Z"
    }
  }
  ```

- **Scenario: Not Found (404)**
  ```json
  {
    "success": false,
    "statusCode": 404,
    "message": "Preference card not found"
  }
  ```

- **Scenario: Forbidden (403)**
  ```json
  {
    "success": false,
    "statusCode": 403,
    "message": "Not authorized to update this card"
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--        CATALOG FETCH (SUPPLIES)          -->
<!-- ══════════════════════════════════════ -->

### 3.5 List Supplies (Catalog)

```
GET /supplies
Auth: Bearer {{accessToken}} (USER)
```

> Card create/edit form e supplies dropdown populate korar jonno. Full catalog fetch kore jate user select korte pare.

**Implementation:**
- **Route**: `src/app/modules/supplies/supplies.route.ts`
- **Controller**: `src/app/modules/supplies/supplies.controller.ts` — `listSupplies`
- **Service**: `src/app/modules/supplies/supplies.service.ts` — `listSuppliesFromDB`

**Query Params:**
- `searchTerm` — name diye search (optional)
- `page` — page number (default: 1)
- `limit` — items per page (default: 10)

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Supplies fetched",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPage": 3
    },
    "data": [
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0e",
        "name": "Sterile Gauze"
      },
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0f",
        "name": "Surgical Drape"
      }
    ]
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--        CATALOG FETCH (SUTURES)           -->
<!-- ══════════════════════════════════════ -->

### 3.6 List Sutures (Catalog)

```
GET /sutures
Auth: Bearer {{accessToken}} (USER)
```

> Card create/edit form e sutures dropdown populate korar jonno. Full catalog fetch kore jate user select korte pare.

**Implementation:**
- **Route**: `src/app/modules/sutures/sutures.route.ts`
- **Controller**: `src/app/modules/sutures/sutures.controller.ts` — `listSutures`
- **Service**: `src/app/modules/sutures/sutures.service.ts` — `listSuturesFromDB`

**Query Params:**
- `searchTerm` — name diye search (optional)
- `page` — page number (default: 1)
- `limit` — items per page (default: 10)

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Sutures fetched",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 18,
      "totalPage": 2
    },
    "data": [
      {
        "_id": "664b2c3d4e5f6a7b8c9d1a0e",
        "name": "3-0 Vicryl"
      },
      {
        "_id": "664b2c3d4e5f6a7b8c9d1a0f",
        "name": "4-0 Monocryl"
      }
    ]
  }
  ```

---

<!-- ══════════════════════════════════════ -->
<!--              DELETE CARD                 -->
<!-- ══════════════════════════════════════ -->

### 3.7 Delete Preference Card

```
DELETE /preference-cards/:cardId
Auth: Bearer {{accessToken}} (USER)
```

> Card permanently delete kore. Owner ba SUPER_ADMIN chara delete possible na. Hard delete — restore possible na.

**Implementation:**
- **Route**: `src/app/modules/preference-card/preference-card.route.ts`
- **Controller**: `src/app/modules/preference-card/preference-card.controller.ts` — `deleteCard`
- **Service**: `src/app/modules/preference-card/preference-card.service.ts` — `deletePreferenceCardFromDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Preference card deleted",
    "data": {
      "deleted": true
    }
  }
  ```

- **Scenario: Not Found (404)**
  ```json
  {
    "success": false,
    "statusCode": 404,
    "message": "Preference card not found"
  }
  ```

- **Scenario: Forbidden (403)**
  ```json
  {
    "success": false,
    "statusCode": 403,
    "message": "Not authorized to delete this card"
  }
  ```

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 3.1 | `/preference-cards/:cardId` | `GET` | Bearer | ✅ Done | Get full details of a card |
| 3.2 | `/preference-cards/:cardId/download` | `POST` | Bearer | ✅ Done | Update download count |
| 3.3 | `/preference-cards` | `POST` | Bearer | ✅ Done | Create card (multipart, draft/publish) |
| 3.4 | `/preference-cards/:cardId` | `PATCH` | Bearer | ✅ Done | Update card (partial, owner/admin) |
| 3.5 | `/supplies` | `GET` | Bearer | ✅ Done | Catalog fetch for card create/edit |
| 3.6 | `/sutures` | `GET` | Bearer | ✅ Done | Catalog fetch for card create/edit |
| 3.7 | `/preference-cards/:cardId` | `DELETE` | Bearer | ✅ Done | Hard delete (owner/admin) |
