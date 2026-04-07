# Screen 2: Profile (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Auth](./01-auth.md) (Login/Logout flow)

---

## UX Flow

### Profile Load & View
1. User app-er bottom navigation theke "Profile" tab-e click kore.
2. Page load-e parallel API calls chole:
   - User basic info → `GET /users/profile` (→ 2.1)
   - Subscription status → `GET /subscriptions/me` (→ 2.3)
3. Profile screen render hoy: Profile picture, Name, Email, Hospital, Specialty, ebong current Subscription Plan dekhay.

### Profile Edit Flow
1. User "Edit Profile" button-e click kore.
2. Form-e field gulo pre-filled thake. User info change kore (e.g., Hospital, Specialty, Profile Picture).
3. Submit → `PATCH /users/profile` (→ 2.2)
4. Success hole updated fields show kore ebong profile re-render hoy.

### Subscription Management
1. User profile theke "My Subscription" section-e jay.
2. Current plan details dekhay.
3. Jodi Free user hoy, "Upgrade to Premium" button thake.
4. Upgrade flow-te In-App Purchase (IAP) logic trigger hoy.

### Legal Pages (Terms & Conditions)
1. User profile menu theke "Terms and Conditions" ba "Privacy Policy"-te click kore.
2. Initial load-e sob legal page-er list fetch hoy → `GET /legal` (→ 2.4)
3. List theke specific page (e.g., `terms-and-conditions`) select korle slug diye content fetch kore → `GET /legal/:slug` (→ 2.5)
4. Full content render hoy screen-e.

### Logout Flow
1. User profile-er niche thaka "Logout" button-e tap kore.
2. Confirm modal ashe. Confirm korle → `POST /auth/logout` (→ 1.7 in Auth)
3. Local state clear hoy ebong user-ke Login screen-e pathiye deya hoy.

---

## Edge Cases

- **Unauthorized Access**: User token expire hoye gele `401` return korbe; system user-ke login screen-e redirect korbe.
- **Free Subscription**: `GET /subscriptions/me` free user-er jonno `plan: "FREE"` object return korbe — 404 na.
- **Empty Legal Pages**: Jodi kono legal page na thake, `GET /legal` empty array return korbe (`"data": []`). Client empty state dekhabe.
- **In-App Purchase Sync**: IAP receipt verify korte fail hole subscription status update hobe na; client-side retry logic implement kora uchit.

---

<!-- ══════════════════════════════════════ -->
<!--              PROFILE FLOW              -->
<!-- ══════════════════════════════════════ -->

## 2.1 Get Profile

```
GET /users/profile
Auth: Bearer {{accessToken}}
```

> Logged-in user-er profile data fetch korar jonno.

**Implementation:**
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getUserProfile`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `getUserProfileFromDB`

### Responses

**200 — Success**
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

**401 — Unauthorized** *(token missing or expired)*
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**500 — Internal Server Error**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## 2.2 Update Profile

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

### Request Body (FormData)

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | `string` | No | Min 2 chars, max 100 chars |
| `hospital` | `string` | No | Max 150 chars |
| `specialty` | `string` | No | Max 100 chars |
| `phone` | `string` | No | Valid phone format |
| `profilePicture` | `File` | No | JPEG or PNG only, max 5MB |

> At least one field must be provided. Empty request body returns `422`.

### Responses

**200 — Success** *(returns only the fields that were updated)*
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

**401 — Unauthorized** *(token missing or expired)*
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**422 — Validation Error**
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    { "field": "name", "message": "Name must be at least 2 characters" },
    { "field": "profilePicture", "message": "Only JPEG and PNG files are allowed" }
  ]
}
```

**500 — Internal Server Error**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

<!-- ══════════════════════════════════════ -->
<!--           SUBSCRIPTION FLOW            -->
<!-- ══════════════════════════════════════ -->

## 2.3 Get My Subscription

```
GET /subscriptions/me
Auth: Bearer {{accessToken}}
```

> Current user-er active subscription plan ebong status fetch kore. Free user-er jonno o sবসময় একটি plan object return hoy — 404 return hoy na.

**Implementation:**
- **Route**: [subscription.route.ts](file:///src/app/modules/subscription/subscription.route.ts)
- **Controller**: [subscription.controller.ts](file:///src/app/modules/subscription/subscription.controller.ts) — `getMySubscriptionController`
- **Service**: [subscription.service.ts](file:///src/app/modules/subscription/subscription.service.ts) — `getMySubscription`

### Responses

**200 — Success (Premium user)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription retrieved successfully",
  "data": {
    "userId": "664a1b2c3d4e5f6a7b8c9d0e",
    "plan": "PREMIUM",
    "status": "active",
    "currentPeriodEnd": "2026-05-15T10:30:00.000Z"
  }
}
```

**200 — Success (Free user)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription retrieved successfully",
  "data": {
    "userId": "664a1b2c3d4e5f6a7b8c9d0e",
    "plan": "FREE",
    "status": "active",
    "currentPeriodEnd": null
  }
}
```

**401 — Unauthorized** *(token missing or expired)*
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**500 — Internal Server Error**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

<!-- ══════════════════════════════════════ -->
<!--              LEGAL FLOW                -->
<!-- ══════════════════════════════════════ -->

## 2.4 List Legal Pages

```
GET /legal
Auth: None
```

> Sob legal page-er list (slug ebong title) fetch korar jonno. Jodi kono page na thake, empty array return hoy.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `getAll`
- **Service**: [legal.service.ts](file:///src/app/modules/legal/legal.service.ts) — `getAll`

### Responses

**200 — Success**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Legal pages retrieved successfully",
  "data": [
    {
      "slug": "terms-and-conditions",
      "title": "Terms and Conditions"
    },
    {
      "slug": "privacy-policy",
      "title": "Privacy Policy"
    }
  ]
}
```

**200 — Success (no pages exist)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Legal pages retrieved successfully",
  "data": []
}
```

**500 — Internal Server Error**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## 2.5 Get Legal Page by Slug

```
GET /legal/:slug
Auth: None
```

> Specific slug (e.g., `terms-and-conditions`) diye full content fetch korar jonno.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `getBySlug`
- **Service**: [legal.service.ts](file:///src/app/modules/legal/legal.service.ts) — `getBySlug`

### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `slug` | `string` | Legal page identifier (e.g., `terms-and-conditions`) |

### Responses

**200 — Success**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Legal page retrieved successfully",
  "data": {
    "slug": "terms-and-conditions",
    "title": "Terms and Conditions",
    "content": "<h1>Terms...</h1><p>Full legal text here...</p>"
  }
}
```

**404 — Not Found**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Legal page not found"
}
```

**500 — Internal Server Error**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|:---:|---|
| 2.1 | `/users/profile` | `GET` | Bearer | ✅ Done | Returns full profile |
| 2.2 | `/users/profile` | `PATCH` | Bearer | ✅ Done | `multipart/form-data`; returns partial (updated fields only) |
| 2.3 | `/subscriptions/me` | `GET` | Bearer | ✅ Done | Always returns plan object; `FREE` plan has `currentPeriodEnd: null` |
| 2.4 | `/legal` | `GET` | None | ✅ Done | Public; returns empty array if no pages exist |
| 2.5 | `/legal/:slug` | `GET` | None | ✅ Done | Public; returns 404 if slug not found |