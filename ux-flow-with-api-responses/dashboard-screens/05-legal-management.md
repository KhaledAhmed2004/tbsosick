# Screen 5: Legal Management

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)

## UX Flow

### Legal Content Management Flow

1. Admin sidebar theke "Legal Management" module e click kore.
2. Page load e shob available legal pages fetch hoy → `GET /legal` (→ 5.1)
3. Admin "Create New Page" button click kore form fill up kore (Title, Content) submit kore → `POST /legal` (→ 5.2)
4. Admin existing kono page edit korar jonno list theke select kore → `GET /legal/:slug` (→ 5.3)
5. Content update korar por "Save" button click kore → `PATCH /legal/:slug` (→ 5.4)
6. Admin jodi kono page delete korte chay, delete action click kore → `DELETE /legal/:slug` (→ 5.5)

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Duplicate Slug** | `POST /legal` e existing slug dile validation error ba duplicate key error ashte pare. |
| **Invalid Slug** | GET/PATCH/DELETE request e non-existent slug dile 404 Not Found return kore. |
| **Unauthorized Access** | Non-admin user theke create/update/delete attempt korle 403 Forbidden return kore. |

---

### 5.1 List All Legal Pages
```http
GET /legal
```

> System-er shob legal pages (Privacy Policy, Terms, etc.) list return kore.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `getAll`
- **Service**: [legal.service.ts](file:///src/app/modules/legal/legal.service.ts) — `getAll`

#### Responses

- **Scenario: Success (200)**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Legal pages retrieved successfully",
  "data": [
    {
      "title": "Privacy Policy",
      "slug": "privacy-policy",
      "updatedAt": "2026-04-10T10:00:00.000Z"
    }
  ]
}
```

---

### 5.2 Create Legal Page
```http
POST /legal
Content-Type: application/json
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Notun legal page create kore.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `createLegalPage`

**Request Body:**
```json
{
  "title": "Terms and Conditions",
  "content": "<h1>Terms</h1><p>Welcome to...</p>"
}
```

---

### 5.3 Get Legal Page by Slug
```http
GET /legal/:slug
```

> Slug-er against-e legal page-er full content retrieve kore.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `getBySlug`

---

### 5.4 Update Legal Page
```http
PATCH /legal/:slug
Content-Type: application/json
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Existing legal page update kore.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `updateBySlug`

---

### 5.5 Delete Legal Page
```http
DELETE /legal/:slug
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Legal page delete kore.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `deleteBySlug`

---

## API Status

| # | Endpoint | Status | Notes |
| :--- | :--- | :---: | :--- |
| 5.1 | `GET /legal` | ✅ Done | Publicly accessible |
| 5.2 | `POST /legal` | ✅ Done | Admin only |
| 5.3 | `GET /legal/:slug` | ✅ Done | Publicly accessible |
| 5.4 | `PATCH /legal/:slug` | ✅ Done | Admin only |
| 5.5 | `DELETE /legal/:slug` | ✅ Done | Admin only |
