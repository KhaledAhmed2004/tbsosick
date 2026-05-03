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
| 2.5 | PATCH | `/users/:userId/status` | SUPER_ADMIN | Admin status toggle |
| 2.6 | DELETE | `/users/:userId` | SUPER_ADMIN | [Dashboard User Management](../dashboard-screens/03-user-management.md) |
| 2.7 | GET | `/users/:userId` | SUPER_ADMIN | Admin view user |
| 2.8 | GET | `/users/:userId/user` | Bearer (User/Admin) | Public user details (rate limited) |
| 2.9 | GET | `/users/profile` | Bearer | [App Profile](../app-screens/06-profile.md) |
| 2.10 | PATCH | `/users/profile` | Bearer | [App Profile](../app-screens/06-profile.md) |
| 2.11 | GET | `/users/me/favorites` | Bearer | [App Home](../app-screens/02-home.md) |

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

**Business Logic (`createUserToDB`):**
- Users start in an unverified state.
- After creation, a verification OTP email is automatically sent (`sendVerificationOTP`).
- OTP sending is "fire and forget" to avoid blocking signup on email transport issues.

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
      "phone": "+123456789",
      "country": "USA",
      "gender": "male",
      "dateOfBirth": "1995-05-15",
      "profilePicture": "https://i.ibb.co/z5YHLV9/profile.png",
      "status": "ACTIVE",
      "verified": false,
      "isFirstLogin": true,
      "deviceTokens": [],
      "createdAt": "2026-04-29T10:00:00.000Z",
      "updatedAt": "2026-04-29T10:00:00.000Z"
    }
  }
  ```

---

### 2.2 List Users (Admin)

```
GET /users
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Comprehensive user list with card counts, specialties, and subscription status.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getAllUserRoles`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `getAllUserRolesFromDB`

**Business Logic (`getAllUserRolesFromDB`):**
- Uses a complex aggregation pipeline to fetch users.
- Joins with `PreferenceCard` to calculate `cardsCount` and a distinct list of `specialties`.
- Joins with `Subscription` to fetch `subscriptionStatus` and `subscriptionPlan`.
- Supports filtering by `role`, `status`, `email`, `search` (name/email), and `specialty`.
- Pagination handled via `$facet`.

**Query Parameters:**
| Parameter | Description | Default |
| :--- | :--- | :--- |
| `search` | Name or email regex search | — |
| `email` | Exact or regex email match | — |
| `role` | Filter by role | `USER` |
| `status` | Filter by status (`ACTIVE`, `INACTIVE`, `RESTRICTED`) | — |
| `specialty` | Filter by specialty (regex match on calculated list) | — |
| `page` | Pagination page number | `1` |
| `limit` | Pagination limit | `10` |
| `sortBy` | Field name for sorting | `createdAt` |
| `sortOrder` | Sort direction (`asc` or `desc`) | `desc` |

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User list fetched",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
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
      "role": "USER",
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

### 2.3 User Stats (Dashboard)

```
GET /users/stats
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Aggregated growth metrics for the admin dashboard.

**Business Logic (`getUsersStatsFromDB`):**
- Calculates monthly growth for `totalUsers`, `activeUsers`, `inactiveUsers`, and `blockedUsers`.
- Returns `value`, `changePct`, and `direction` (`up` / `down` / `neutral`).

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User statistics retrieved",
  "data": {
    "meta": { "comparisonPeriod": "month" },
    "totalUsers": { "value": 250, "changePct": 25, "direction": "up" },
    "activeUsers": { "value": 198, "changePct": 10, "direction": "up" },
    "inactiveUsers": { "value": 32, "changePct": 5, "direction": "down" },
    "blockedUsers": { "value": 20, "changePct": 0, "direction": "neutral" }
  }
}
```

---

### 2.4 Update User (Admin)

```
PATCH /users/:userId
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Update any user field (whitelist approach).

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `adminUpdateUser`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `updateUserByAdminInDB`

**Business Logic (`updateUserByAdminInDB`):**
- Fetches user including password to trigger `user.save()`.
- Updates specific whitelisted fields: `name`, `email`, `phone`, `country`, `specialty`, `hospital`, `location`, `gender`, `dateOfBirth`, `profilePicture`, `status`, `role`.
- Removes sensitive fields (`password`, `authentication`) before returning.

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User updated",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "USER",
    "status": "ACTIVE"
  }
}
```

---

### 2.5 Update User Status (Admin)

```
PATCH /users/:userId/status
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Simplified endpoint for status toggling (Block/Unblock).

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `updateUserStatus`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `updateUserStatusInDB`

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User status updated",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "status": "RESTRICTED"
  }
}
```

---

### 2.6 Delete User (Admin)

```
DELETE /users/:userId
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Permanently removes a user from the database.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `deleteUser`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `deleteUserPermanentlyFromDB`

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deleted",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e"
  }
}
```

---

### 2.7 Get User by ID (Admin)

```
GET /users/:userId
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Admin specific view of a user's basic info. Returns user data wrapped in a `user` object.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getUserById`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `getUserByIdFromDB`

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User data retrieved",
  "data": {
    "user": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "status": "ACTIVE"
    }
  }
}
```

---

### 2.8 Get User Details (Public/User)

```
GET /users/:userId/user
Authorization: Bearer {{accessToken}}
```

> Detailed user profile view for other users or admins. Rate limited.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getUserDetailsById`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `getUserDetailsByIdFromDB`

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User details retrieved successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "profilePicture": "https://cdn.example.com/pic.png",
    "specialty": "Cardiology",
    "hospital": "City Hospital"
  }
}
```

---

### 2.9 Get Own Profile

```
GET /users/profile
Auth: Bearer {{accessToken}}
```

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile data retrieved successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+123456789",
    "role": "USER",
    "status": "ACTIVE",
    "verified": true,
    "profilePicture": "https://i.ibb.co/z5YHLV9/profile.png",
    "country": "USA",
    "gender": "male",
    "dateOfBirth": "1995-05-15",
    "specialty": "Cardiology",
    "hospital": "City Hospital",
    "isFirstLogin": false,
    "createdAt": "2026-03-15T10:30:00.000Z",
    "updatedAt": "2026-04-29T11:00:00.000Z"
  }
}
```

---

### 2.10 Update Own Profile

```
PATCH /users/profile
Content-Type: multipart/form-data
Auth: Bearer {{accessToken}}
```

> Supports text fields and a `profilePicture` file upload.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `updateProfile`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `updateProfileToDB`

**Business Logic (`updateProfileToDB`):**
- If a new `profilePicture` is provided, the previous one is unlinked from the server disk.

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Updated",
    "email": "john@example.com",
    "profilePicture": "uploads/profiles/new-pic.png"
  }
}
```

---

### 2.11 List Favorite Cards

```
GET /users/me/favorites
Auth: Bearer {{accessToken}}
```

**Implementation:**
- **Controller**: `getFavoriteCards`
- **Service**: `PreferenceCardService.listFavoritePreferenceCardsForUserFromDB`

**Summarized Response Logic:**
- Returns a flat array of summarized cards with `isFavorited: true`.

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Favorite preference cards retrieved successfully",
  "meta": { "page": 1, "limit": 10, "total": 5 },
  "data": [
    {
      "id": "664a1b2c3d4e5f6a7b8c9d0f",
      "cardTitle": "Hip Replacement",
      "surgeon": { "name": "Dr. Brown", "specialty": "Orthopedics" },
      "verificationStatus": "VERIFIED",
      "isFavorited": true,
      "downloadCount": 12,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

- **Scenario: No Favorites Found (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "No favorite cards found.",
  "data": []
}
```

---

## API Status

| # | Endpoint | Status | Roles | Notes |
|---|---|:---:|:---:|---|
| 2.1 | `POST /users` | Done | Public / SUPER_ADMIN | Shared handler |
| 2.2 | `GET /users` | Done | SUPER_ADMIN | Comprehensive aggregation |
| 2.3 | `GET /users/stats` | Done | SUPER_ADMIN | Growth metrics |
| 2.4 | `PATCH /users/:userId` | Done | SUPER_ADMIN | Whitelisted update |
| 2.5 | `PATCH /users/:userId/status` | Done | SUPER_ADMIN | Status toggle |
| 2.6 | `DELETE /users/:userId` | Done | SUPER_ADMIN | Permanent delete |
| 2.7 | `GET /users/:userId` | Done | SUPER_ADMIN | Admin view |
| 2.8 | `GET /users/:userId/user` | Done | User / Admin | Public details |
| 2.9 | `GET /users/profile` | Done | User / Admin | Self profile |
| 2.10 | `PATCH /users/profile` | Done | User / Admin | Self update + upload |
| 2.11 | `GET /users/me/favorites` | Done | User / Admin | Summarized list |
