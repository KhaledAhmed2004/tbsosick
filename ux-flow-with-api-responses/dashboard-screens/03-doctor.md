# Screen 3: Doctor

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Overview](./02-overview.md) (Stats display)

## UX Flow

### Doctor List & Management Flow

1. Admin sidebar theke "Doctor" module e click kore
2. Page load e doctor stats cards fetch hoy → `GET /doctors/stats` (→ 2.1)
3. Page load e doctor list fetch hoy → `GET /doctors` (→ 3.1)
4. Admin search bar use kore doctor name ba email search kore → `GET /doctors?search=Dr. John` (→ 3.1)
5. Admin filters use kore specialty ba status select kore → `GET /doctors?specialty=Cardiology&status=ACTIVE` (→ 3.1)
6. Doctor table render hoy: Doctor Info (Name, Email, Phone, Specialty, Cards Count, Subscription Status) dekhay
7. Admin "Create Doctor" button click kore form fill up kore submit kore → `POST /doctors` (→ 3.2)
8. Edit action click korle pre-filled form ashe, update kore submit → `PATCH /doctors/:id` (→ 3.3)
9. Block/Activate action click kore doctor status update kore → `PATCH /doctors/:id/status` (→ 3.4)
10. Delete action click korle confirm modal ashe, submit → `DELETE /doctors/:id` (→ 3.5)

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Duplicate Email** | `POST /doctors` e existing email dile 400 Bad Request return kore. |
| **Invalid ID** | PATCH/DELETE request e non-existent ID dile 404 Not Found ashe. |
| **Empty Search Result** | `data` array empty thake kintu structure thik thake (200 OK). |
| **Validation Fail** | Zod validation fail hole (e.g. invalid phone/email) detailed 400 error message dekhay. |
| **Invalid Status Value** | `status` field e invalid value dile 400 Bad Request return kore. |
| **Subscription Status** | Doctor delete korleo logic cascade hoye system consistent rakhe. |

---

### 2.1 Doctor Stats (Overview Cards)
```http
GET /doctors/stats
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Dashboard-er doctor section-er summary stat cards-er jonno. Total, active, inactive, blocked doctor count with monthly growth return kore.

**Implementation:**
- **Route**: [doctor.route.ts](file:///src/app/modules/doctor/doctor.route.ts)
- **Controller**: [doctor.controller.ts](file:///src/app/modules/doctor/doctor.controller.ts) — `getDoctorStats`
- **Service**: [doctor.service.ts](file:///src/app/modules/doctor/doctor.service.ts) — `getDoctorStats`

**Query Parameters:** None

**Field Reference:**

| Field | Type | Description |
| :--- | :--- | :--- |
| `meta.comparisonPeriod` | `string` | Always `"month"` — current vs last calendar month |
| `{metric}.value` | `number` | Total count as of now |
| `{metric}.changePct` | `number` | Always a positive magnitude (e.g. `25`, `7.14`). Use `direction` for sign. |
| `{metric}.direction` | `"up" \| "down" \| "neutral"` | `"up"` = growth, `"down"` = decline, `"neutral"` = no change or first month with no prior data |

> **Note:** `totalDoctors.value` is the authoritative total — sum of all statuses. Do not derive it by adding individual counts on the frontend; future statuses may be added.

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctor stats retrieved successfully",
  "data": {
    "meta": {
      "comparisonPeriod": "month"
    },
    "totalDoctors": {
      "value": 250,
      "changePct": 25,
      "direction": "up"
    },
    "activeDoctors": {
      "value": 198,
      "changePct": 10,
      "direction": "up"
    },
    "inactiveDoctors": {
      "value": 32,
      "changePct": 5,
      "direction": "down"
    },
    "blockedDoctors": {
      "value": 20,
      "changePct": 0,
      "direction": "neutral"
    }
  }
}
```

> **Note:** `changePct` is always a positive number; `direction` tells you whether it went up or down. `"neutral"` means no change compared to last month.

---

### 3.1 Get/Search Doctors
```http
GET /doctors
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Doctor list search, filter, ebong pagination handle kore. Complex aggregation use kora hoyeche specialty ebong card counts calculate korar jonno.

**Implementation:**
- **Route**: [doctor.route.ts](file:///src/app/modules/doctor/doctor.route.ts)
- **Controller**: [doctor.controller.ts](file:///src/app/modules/doctor/doctor.controller.ts) — `getDoctors`
- **Service**: [doctor.service.ts](file:///src/app/modules/doctor/doctor.service.ts) — `getDoctors`

**Query Parameters:**

| Parameter | Description | Default |
| :--- | :--- | :--- |
| `search` | Name ba email search | — |
| `specialty` | Filter by specialty (regex match) | — |
| `status` | Filter by status (`ACTIVE`, `INACTIVE`, `RESTRICTED`) | — |
| `page` | Pagination page number | `1` |
| `limit` | Pagination limit | `10` |
| `sortBy` | Field name for sorting | `createdAt` |
| `sortOrder` | Sort direction (`asc` ba `desc`) | `desc` |

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctor list fetched",
  "pagination": { "page": 1, "limit": 10, "total": 25, "totalPage": 3 },
  "data": [
    {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "Dr. John Doe",
      "email": "dr.john@example.com",
      "phone": "+123456789",
      "specialty": "Cardiology",
      "hospital": "City Hospital",
      "status": "ACTIVE",
      "verified": true,
      "specialties": ["Cardiology", "Surgery"],
      "cardsCount": 5,
      "subscriptionStatus": "active",
      "subscriptionPlan": "PREMIUM",
      "createdAt": "2026-03-15T10:30:00.000Z"
    }
  ]
}
```

---

### 3.2 Create Doctor
```http
POST /doctors
Content-Type: application/json
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Admin manually doctor account create kore. Auto-verified thake ebong role `USER` (Doctor) assigned hoy.

**Implementation:**
- **Route**: [doctor.route.ts](file:///src/app/modules/doctor/doctor.route.ts)
- **Controller**: [doctor.controller.ts](file:///src/app/modules/doctor/doctor.controller.ts) — `createDoctor`
- **Service**: [doctor.service.ts](file:///src/app/modules/doctor/doctor.service.ts) — `createDoctor`

**Request Body:**
```json
{
  "name": "Dr. Jane Smith",
  "email": "dr.jane@example.com",
  "password": "Password123!",
  "phone": "+123456789",
  "specialty": "Dermatology",
  "hospital": "Metro Clinic",
  "gender": "female",
  "dateOfBirth": "1985-05-15"
}
```

#### Responses

- **Scenario: Success (201)**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Doctor created",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "name": "Dr. Jane Smith",
    "email": "dr.jane@example.com",
    "role": "USER",
    "status": "ACTIVE"
  }
}
```

- **Scenario: Email Already Exists (400)**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Email already exist!"
}
```

---

### 3.3 Update Doctor
```http
PATCH /doctors/:id
Content-Type: application/json
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Doctor details update kore. Security-r jonno password ebong status change kora allowed na ei endpoint e.

**Implementation:**
- **Route**: [doctor.route.ts](file:///src/app/modules/doctor/doctor.route.ts)
- **Controller**: [doctor.controller.ts](file:///src/app/modules/doctor/doctor.controller.ts) — `updateDoctor`
- **Service**: [doctor.service.ts](file:///src/app/modules/doctor/doctor.service.ts) — `updateDoctor`

**Request Body:**
```json
{
  "name": "Dr. Jane Updated",
  "specialty": "Oncology",
  "hospital": "Central Hospital"
}
```

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctor updated",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "name": "Dr. Jane Updated",
    "email": "dr.jane@example.com",
    "specialty": "Oncology",
    "hospital": "Central Hospital"
  }
}
```

- **Scenario: Not Found (404)**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found"
}
```

---

### 3.4 Update Doctor Status
```http
PATCH /doctors/:id/status
Content-Type: application/json
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Doctor er system access control kore status update korar maddhome. `RESTRICTED` dile block hoy, `ACTIVE` dile unblock hoy.

**Implementation:**
- **Route**: [doctor.route.ts](file:///src/app/modules/doctor/doctor.route.ts)
- **Controller**: [doctor.controller.ts](file:///src/app/modules/doctor/doctor.controller.ts) — `updateDoctorStatus`
- **Service**: [doctor.service.ts](file:///src/app/modules/doctor/doctor.service.ts) — `updateDoctorStatus`

**Request Body:**
```json
{ "status": "RESTRICTED" | "ACTIVE" }
```

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctor status updated",
  "data": { "status": "RESTRICTED" }
}
```

- **Scenario: Invalid Status (400)**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid status value"
}
```

- **Scenario: Not Found (404)**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found"
}
```

---

### 3.5 Delete Doctor
```http
DELETE /doctors/:id
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Doctor account permanent-ly delete kore.

**Implementation:**
- **Route**: [doctor.route.ts](file:///src/app/modules/doctor/doctor.route.ts)
- **Controller**: [doctor.controller.ts](file:///src/app/modules/doctor/doctor.controller.ts) — `deleteDoctor`
- **Service**: [doctor.service.ts](file:///src/app/modules/doctor/doctor.service.ts) — `deleteDoctor`

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctor deleted"
}
```

---

## API Status

| # | Endpoint | Status | Notes |
| :--- | :--- | :---: | :--- |
| 2.1 | `GET /doctors/stats` | ✅ Done | Monthly growth + direction included |
| 3.1 | `GET /doctors` | ✅ Done | Detailed aggregation for stats added |
| 3.2 | `POST /doctors` | ✅ Done | Zod validation + duplicate check included |
| 3.3 | `PATCH /doctors/:id` | ✅ Done | Whitelisted fields only, status + password excluded |
| 3.4 | `PATCH /doctors/:id/status` | ✅ Done | Replaces separate block/unblock endpoints |
| 3.5 | `DELETE /doctors/:id` | ✅ Done | Hard delete implemented |