# Legal Module APIs

> **Section**: Backend API specifications for the legal module.
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [App Profile](../app-screens/06-profile.md) — Read T&C / Privacy Policy
> - [Dashboard Legal Management](../dashboard-screens/05-legal-management.md) — Admin CMS for legal pages

---

## Endpoints Index

| # | Method | Endpoint | Auth | Used By |
|---|---|---|---|---|
| 6.1 | GET | `/legal` | Public | [App Profile](../app-screens/06-profile.md), [Dashboard Legal Mgmt](../dashboard-screens/05-legal-management.md) |
| 6.2 | GET | `/legal/:slug` | Public | [App Profile](../app-screens/06-profile.md), [Dashboard Legal Mgmt](../dashboard-screens/05-legal-management.md) |
| 6.3 | POST | `/legal` | SUPER_ADMIN | [Dashboard Legal Mgmt](../dashboard-screens/05-legal-management.md) |
| 6.4 | PATCH | `/legal/:slug` | SUPER_ADMIN | [Dashboard Legal Mgmt](../dashboard-screens/05-legal-management.md) |
| 6.5 | DELETE | `/legal/:slug` | SUPER_ADMIN | [Dashboard Legal Mgmt](../dashboard-screens/05-legal-management.md) |

---

### 6.1 List Legal Pages

```
GET /legal
Auth: None
```

> Shob available legal pages (Terms, Privacy, etc.) er title ebong slug list fetch korar jonno. Admin-side e same endpoint use kora hoy CMS list view-er jonno.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `getLegalPages` / `getAll`
- **Service**: [legal.service.ts](file:///src/app/modules/legal/legal.service.ts) — `getLegalPagesFromDB` / `getAll`

#### Responses

- **Scenario: Success — App view (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Legal pages retrieved successfully",
    "data": [
      { "_id": "664a1b2c3d4e5f6a7b8c9d10", "title": "Terms and Conditions", "slug": "terms-and-conditions" },
      { "_id": "664a1b2c3d4e5f6a7b8c9d11", "title": "Privacy Policy", "slug": "privacy-policy" }
    ]
  }
  ```

- **Scenario: Success — Admin CMS view (200)**
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

### 6.2 Get Legal Page by Slug

```
GET /legal/:slug
Auth: None
```

> Slug diye specific legal page-er full HTML/Markdown content fetch korar jonno.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `getLegalPageBySlug` / `getBySlug`
- **Service**: [legal.service.ts](file:///src/app/modules/legal/legal.service.ts) — `getLegalPageBySlugFromDB`

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Legal page content retrieved successfully",
    "data": {
      "_id": "664a1b2c3d4e5f6a7b8c9d10",
      "title": "Terms and Conditions",
      "slug": "terms-and-conditions",
      "content": "<h1>Terms and Conditions</h1><p>Welcome to our application...</p>"
    }
  }
  ```

---

### 6.3 Create Legal Page

```
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

### 6.4 Update Legal Page

```
PATCH /legal/:slug
Content-Type: application/json
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Existing legal page update kore.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `updateBySlug`

---

### 6.5 Delete Legal Page

```
DELETE /legal/:slug
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Legal page delete kore.

**Implementation:**
- **Route**: [legal.route.ts](file:///src/app/modules/legal/legal.route.ts)
- **Controller**: [legal.controller.ts](file:///src/app/modules/legal/legal.controller.ts) — `deleteBySlug`

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Duplicate Slug** | `POST /legal` e existing slug dile validation error ba duplicate key error ashte pare. |
| **Invalid Slug** | GET/PATCH/DELETE request e non-existent slug dile 404 Not Found return kore. |
| **Unauthorized Access** | Non-admin user theke create/update/delete attempt korle 403 Forbidden return kore. |
| **Empty Legal Pages** | Jodi kono legal page na thake, `GET /legal` empty array return korbe (`"data": []`). Client empty state dekhabe. |

---

## API Status

| # | Endpoint | Status | Notes |
|---|---|:---:|---|
| 6.1 | `GET /legal` | Done | Publicly accessible — list of titles & slugs |
| 6.2 | `GET /legal/:slug` | Done | Publicly accessible — full page content |
| 6.3 | `POST /legal` | Done | Admin only |
| 6.4 | `PATCH /legal/:slug` | Done | Admin only |
| 6.5 | `DELETE /legal/:slug` | Done | Admin only |
