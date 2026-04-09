# Screen 3: User Management

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Overview](./02-overview.md) (Stats display)

## UX Flow

### Doctor List & Management Flow

1. Admin sidebar theke "User Management" module e click kore
2. Page load e user stats cards fetch hoy → `GET /users/stats` (→ 2.1)
3. Page load e user list fetch hoy → `GET /users` (→ 3.1)
4. Admin search bar use kore user name ba email search kore → `GET /users?search=Dr. John` (→ 3.1)
5. Admin filters use kore specialty ba status select kore → `GET /users?specialty=Cardiology&status=ACTIVE` (→ 3.1)
6. User table render hoy: User Info (Name, Email, Phone, Specialty, Cards Count, Subscription Status) dekhay
7. Admin "Create User" button click kore form fill up kore submit kore → `POST /users` (→ 3.2)
8. Edit action click korle pre-filled form ashe, update kore submit → `PATCH /users/:userId` (→ 3.3)
9. Block/Activate action click kore user status update kore → `PATCH /users/:userId` body `{ "status": "RESTRICTED" | "ACTIVE" }` (→ 3.3)
10. Delete action click korle confirm modal ashe, submit → `DELETE /users/:userId` (→ 3.4)

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Duplicate Email** | `POST /users` e existing email dile 400 Bad Request return kore. |
| **Invalid ID** | PATCH/DELETE request e non-existent ID dile 404 Not Found ashe. |
| **Empty Search Result** | `data` array empty thake kintu structure thik thake (200 OK). |
| **Validation Fail** | Zod validation fail hole (e.g. invalid phone/email) detailed 400 error message dekhay. |
| **Invalid Status Value** | `status` field e invalid value dile 400 Bad Request return kore. |
| **Subscription Status** | User delete korleo logic cascade hoye system consistent rakhe. |

---

### 2.1 User Stats (Overview Cards)
```http
GET /users/stats
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Dashboard-er user section-er (Doctors focus) summary stat cards-er jonno. Total, active, inactive, blocked user count with monthly growth return kore.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getUsersStats`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `getUsersStats`

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
    "totalUsers": {
      "value": 250,
      "changePct": 25,
      "direction": "up"
    },
    "activeUsers": {
      "value": 198,
      "changePct": 10,
      "direction": "up"
    },
    "inactiveUsers": {
      "value": 32,
      "changePct": 5,
      "direction": "down"
    },
    "blockedUsers": {
      "value": 20,
      "changePct": 0,
      "direction": "neutral"
    }
  }
}
```

> **Note:** `changePct` is always a positive number; `direction` tells you whether it went up or down. `"neutral"` means no change compared to last month.

---

### 3.1 Get/Search Users (Doctors)
```http
GET /users
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> User list search, filter, ebong pagination handle kore. Complex aggregation use kora hoyeche specialty ebong card counts calculate korar jonno.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getAllUserRoles`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `getAllUserRoles`

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

### 3.2 Create User
```http
POST /users
Content-Type: application/json
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Admin manually user account create kore (ba Registration). Auto-verified thake ebong role `USER` assigned hoy.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `createUser`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `createUserToDB`

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

### 3.3 Update User
```http
PATCH /users/:userId
Content-Type: application/json
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> User details update kore. **Block / Unblock o eikhane diye hoy** — body-te `status: "RESTRICTED"` dile block, `status: "ACTIVE"` dile unblock. Alada `/block` ba `/unblock` route nai (REST principle: state change is just a field update on the resource, separate verb-route na rakha).

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `adminUpdateUser`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `updateUserByAdmin`

**Request Body (any subset of these fields):**
```json
{
  "name": "Dr. Jane Updated",
  "specialty": "Oncology",
  "hospital": "Central Hospital",
  "status": "RESTRICTED"
}
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `name`, `email`, `phone`, `country`, `specialty`, `hospital`, `location`, `gender`, `dateOfBirth`, `profilePicture` | `string` | Profile fields |
| `role` | `"SUPER_ADMIN" \| "USER"` | Role change |
| `status` | `"ACTIVE" \| "INACTIVE" \| "RESTRICTED" \| "DELETE"` | **Block = `RESTRICTED`**, **Unblock = `ACTIVE`** |

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

### 3.4 Delete User
```http
DELETE /users/:userId
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> User account permanent-ly delete kore.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `deleteUser`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `deleteUserPermanently`

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
| 2.1 | `GET /users/stats` | ✅ Done | User growth metrics included |
| 3.1 | `GET /users` | ✅ Done | Detailed aggregation for stats added |
| 3.2 | `POST /users` | ✅ Done | User registration logic |
| 3.3 | `PATCH /users/:userId` | ✅ Done | Admin update — also handles block/unblock via `status` field |
| 3.4 | `DELETE /users/:userId` | ✅ Done | Hard delete implemented |