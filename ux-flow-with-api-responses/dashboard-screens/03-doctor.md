# Screen 3: Doctor

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Overview](./02-overview.md) (Stats)

## UX Flow

### Doctor List & Management Flow
1. Admin sidebar theke "Doctor" module e click kore
2. Page load e doctor list fetch hoy → `GET /doctors` (→ 3.1)
3. Admin search bar use kore doctor name ba email search kore → `GET /doctors?searchTerm=Dr. John` (→ 3.1)
4. Admin filter use kore specialization ba status wise filter kore → `GET /doctors?status=ACTIVE` (→ 3.1)
5. Doctor table render hoy: Doctor Data → Edit, Delete, Block/Activate actions thake
6. Admin "Create Doctor" button click kore form fill up kore submit kore → `POST /doctors` (→ 3.2)
7. Edit action click korle doctor data pre-filled thake, submit → `PATCH /doctors/:id` (→ 3.3)
8. Block/Activate action click → `PATCH /doctors/:id/block` (→ 3.4) ba `PATCH /doctors/:id/unblock` (→ 3.5)
9. Delete action click → `DELETE /doctors/:id` (→ 3.6)

---

<!-- ══════════════════════════════════════ -->
<!--              DOCTOR FLOW                -->
<!-- ══════════════════════════════════════ -->

### 3.1 Get/Search Doctors

```
GET /doctors
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

**Implementation:**
- **Route**: `src/app/modules/doctor/doctor.route.ts`
- **Controller**: `src/app/modules/doctor/doctor.controller.ts` — `getDoctors`
- **Service**: `src/app/modules/doctor/doctor.service.ts` — `searchDoctors`

**Query Parameters:**
- `searchTerm`: Search by name or email
- `status`: Filter by status (`ACTIVE`, `INACTIVE`, `BLOCKED`)
- `page`: Pagination page number
- `limit`: Pagination limit

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctors retrieved successfully",
  "pagination": { "page": 1, "limit": 10, "total": 25, "totalPage": 3 },
  "data": [
    {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "Dr. John Doe",
      "email": "dr.john@example.com",
      "specialization": "Cardiology",
      "status": "ACTIVE"
    }
  ]
}
```

---

### 3.2 Create Doctor

```
POST /doctors
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

**Implementation:**
- **Route**: `src/app/modules/doctor/doctor.route.ts`
- **Controller**: `src/app/modules/doctor/doctor.controller.ts` — `createDoctor`
- **Service**: `src/app/modules/doctor/doctor.service.ts` — `createDoctor`

**Request Body:**
```json
{
  "name": "Dr. Jane Smith",
  "email": "dr.jane@example.com",
  "password": "Password123!",
  "specialization": "Dermatology",
  "phone": "+123456789"
}
```

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Doctor created successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "name": "Dr. Jane Smith",
    "email": "dr.jane@example.com",
    "status": "ACTIVE"
  }
}
```

---

### 3.3 Update Doctor

```
PATCH /doctors/:id
Content-Type: application/json
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

**Implementation:**
- **Route**: `src/app/modules/doctor/doctor.route.ts`
- **Controller**: `src/app/modules/doctor/doctor.controller.ts` — `updateDoctor`
- **Service**: `src/app/modules/doctor/doctor.service.ts` — `updateDoctorProfile`

**Request Body:**
```json
{
  "name": "Dr. Jane Updated",
  "specialization": "Oncology"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctor updated successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "name": "Dr. Jane Updated",
    "specialization": "Oncology"
  }
}
```

---

### 3.4 Block Doctor

```
PATCH /doctors/:id/block
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

**Implementation:**
- **Route**: `src/app/modules/doctor/doctor.route.ts`
- **Controller**: `src/app/modules/doctor/doctor.controller.ts` — `blockDoctor`
- **Service**: `src/app/modules/doctor/doctor.service.ts` — `blockDoctor`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctor blocked successfully"
}
```

---

### 3.5 Unblock Doctor

```
PATCH /doctors/:id/unblock
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

**Implementation:**
- **Route**: `src/app/modules/doctor/doctor.route.ts`
- **Controller**: `src/app/modules/doctor/doctor.controller.ts` — `unblockDoctor`
- **Service**: `src/app/modules/doctor/doctor.service.ts` — `unblockDoctor`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctor unblocked successfully"
}
```

---

### 3.6 Delete Doctor

```
DELETE /doctors/:id
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

**Implementation:**
- **Route**: `src/app/modules/doctor/doctor.route.ts`
- **Controller**: `src/app/modules/doctor/doctor.controller.ts` — `deleteDoctor`
- **Service**: `src/app/modules/doctor/doctor.service.ts` — `deleteDoctor`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctor deleted successfully"
}
```

---

## API Status

| # | Endpoint | Status | Notes |
|---|----------|:------:|-------|
| 3.1 | `GET /doctors` | ✅ Done | List/Search with pagination |
| 3.2 | `POST /doctors` | ✅ Done | New doctor registration |
| 3.3 | `PATCH /doctors/:id` | ✅ Done | Update doctor details |
| 3.4 | `PATCH /doctors/:id/block` | ✅ Done | Block access |
| 3.5 | `PATCH /doctors/:id/unblock` | ✅ Done | Restore access |
| 3.6 | `DELETE /doctors/:id` | ✅ Done | Hard/Soft delete |
