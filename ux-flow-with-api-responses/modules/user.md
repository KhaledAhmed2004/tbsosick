# User Module APIs

> **Section**: Backend API specifications for the user module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Auth](../app-screens/01-auth.md) — Registration (`POST /users`)
> - [App Home](../app-screens/02-home.md) — Favorites list (`GET /users/me/favorites`)
> - [App Profile](../app-screens/06-profile.md) — Profile read/update
> - [Dashboard User Management](../dashboard-screens/03-user-management.md) — Admin CRUD + stats

---

## Endpoints Index

| # | Method | Endpoint | Auth | Used By |
|---|---|---|---|---|
| 2.1 | POST | `/users` | Public / SUPER_ADMIN | [App Auth](../app-screens/01-auth.md), [Dashboard User Management](../dashboard-screens/03-user-management.md) |
| 2.2 | GET | `/users` | SUPER_ADMIN | [Dashboard User Management](../dashboard-screens/03-user-management.md) |
| 2.3 | GET | `/users/stats` | SUPER_ADMIN | [Dashboard User Management](../dashboard-screens/03-user-management.md) |
| 2.4 | PATCH | `/users/:userId` | SUPER_ADMIN | [Dashboard User Management](../dashboard-screens/03-user-management.md) |
| 2.5 | DELETE | `/users/:userId` | SUPER_ADMIN | [Dashboard User Management](../dashboard-screens/03-user-management.md) |
| 2.6 | GET | `/users/profile` | Bearer | [App Profile](../app-screens/06-profile.md) |
| 2.7 | PATCH | `/users/profile` | Bearer | [App Profile](../app-screens/06-profile.md) |
| 2.8 | GET | `/users/me/favorites` | Bearer | [App Home](../app-screens/02-home.md) |

---

### 2.1 Create User (Registration / Admin Create)

```
POST /users
Content-Type: application/json
Auth: None (registration) | Bearer {{accessToken}} (SUPER_ADMIN admin create)
```

> Used both for public mobile registration and for admin-driven account creation from the dashboard. Admin-created accounts are auto-verified and assigned role `USER`.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `createUser`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `createUserToDB`

**Request Body (Mobile Registration):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phone": "+123456789",
  "country": "USA",
  "gender": "male",
  "dateOfBirth": "1995-05-15"
}
```

**Request Body (Admin Create):**
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

- **Scenario: Success — Mobile Registration (201)**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "User created successfully",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "verified": false,
      "status": "ACTIVE"
    }
  }
  ```
- **Scenario: Success — Admin Create (201)**
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

### 2.2 Get/Search Users (Doctors)

```
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

### 2.3 User Stats (Overview Cards)

```
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

### 2.4 Update User (Admin)

```
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

### 2.5 Delete User (Admin)

```
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

### 2.6 Get Profile

```
GET /users/profile
Auth: Bearer {{accessToken}}
```

> Logged-in user-er profile data fetch korar jonno.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getUserProfile`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `getUserProfileFromDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Profile retrieved successfully",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "phone": "+123456789",
      "hospital": "City Hospital",
      "specialty": "Cardiology",
      "profilePicture": "https://cdn.example.com/profile.png"
    }
  }
  ```
- **Scenario: Unauthorized (401)** *(token missing or expired)*
  ```json
  {
    "success": false,
    "statusCode": 401,
    "message": "Unauthorized"
  }
  ```

---

### 2.7 Update Profile

```
PATCH /users/profile
Content-Type: multipart/form-data
Auth: Bearer {{accessToken}}
```

> Profile info update ebong/ba profile picture upload korar jonno. Shudhu updated fields pathano dorkar — sob field optional.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `updateProfile`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `updateProfileInDB`

**Request Body (FormData):**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | `string` | No | Min 2 chars, max 100 chars |
| `hospital` | `string` | No | Max 150 chars |
| `specialty` | `string` | No | Max 100 chars |
| `phone` | `string` | No | Valid phone format |
| `profilePicture` | `File` | No | JPEG or PNG only, max 5MB |

> At least one field must be provided. Empty request body returns `422`.

#### Responses

- **Scenario: Success (200)** *(returns only the fields that were updated)*
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Profile updated successfully",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "John Updated",
      "hospital": "Metro Clinic",
      "profilePicture": "https://cdn.example.com/new-pic.jpg"
    }
  }
  ```

---

### 2.8 List Favorite Cards

```
GET /users/me/favorites
Auth: Bearer {{accessToken}}
```

> Home screen-er niche favorite list dekhate use hoy.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getFavoriteCards`
- **Service**: [preference-card.service.ts](file:///src/app/modules/preference-card/preference-card.service.ts) — `listFavoritePreferenceCardsForUserFromDB`

**Business Logic (`listFavoritePreferenceCardsForUserFromDB`):**
- Prothome user profile theke `favoriteCards` (ObjectIds array) fetch kora hoy.
- Jodi user-er kono favorite card na thake, tahole empty data array ebong empty meta information return kora hoy.
- Multiple favorites thakle `QueryBuilder` use kore selection criteria (search/filter/sort/pagination) apply kora hoy.
- `$in` operator use kore specific cards-gulo retrieve kora hoy ebong flatten format-e return kora hoy.

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Favorite preference cards retrieved successfully",
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "data": [
      {
        "id": "664a1b2c3d4e5f6a7b8c9d0f",
        "cardTitle": "Hip Replacement",
        "surgeon": { "name": "Dr. Brown", "specialty": "Orthopedics" },
        "isFavorited": true,
        "downloadCount": 12
      }
    ]
  }
  ```

---

## API Status

| # | Endpoint | Status | Roles | Notes |
|---|---|:---:|:---:|---|
| 2.1 | `POST /users` | Done | Public / SUPER_ADMIN | Registration + admin-create share the same handler |
| 2.2 | `GET /users` | Done | SUPER_ADMIN | Detailed aggregation for stats added |
| 2.3 | `GET /users/stats` | Done | SUPER_ADMIN | User growth metrics included |
| 2.4 | `PATCH /users/:userId` | Done | SUPER_ADMIN | Admin update — also handles block/unblock via `status` field |
| 2.5 | `DELETE /users/:userId` | Done | SUPER_ADMIN | Hard delete implemented |
| 2.6 | `GET /users/profile` | Done | User | Profile load |
| 2.7 | `PATCH /users/profile` | Done | User | Profile update + image upload |
| 2.8 | `GET /users/me/favorites` | Done | User | Migrated to `/users` module |
