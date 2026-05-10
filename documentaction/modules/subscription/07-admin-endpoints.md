# 07. Administrative Endpoints (Dashboard)

> Ei endpoint-gulo shudhu `SUPER_ADMIN` role-er jonno accessible. Database-er authoritative subscription state manage ebong audit trace view korar jonno egulo use kora hoy.

---

## 1. List Subscriptions
Returns a paginated list of all users' current subscription states.

```http
GET /subscriptions/admin?page=1&limit=10&plan=PREMIUM
Auth: Bearer {{adminToken}}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50 — clamped by `QueryBuilder`)
- `plan`: Filter by `FREE`, `PREMIUM`, or `ENTERPRISE`
- `status`: Filter by `active`, `past_due`, `canceled`, `inactive`, `trialing`
- `platform`: Filter by `apple`, `google`, or `admin`
- `searchTerm`, `sort`, `fields`: standard `QueryBuilder` knobs

**Response shape** — `{ data, meta }` (⚠ changed from previous `{ data, total }`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscriptions retrieved successfully",
  "meta": {
    "total": 142,
    "limit": 10,
    "page": 1,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  },
  "data": [
    {
      "_id": "...",
      "userId": { "_id": "...", "fullName": "John Doe", "email": "john@example.com" },
      "plan": "PREMIUM",
      "status": "active",
      "platform": "apple",
      "currentPeriodEnd": "2027-04-07T10:30:00.000Z"
    }
  ]
}
```

---

## 2. Subscription Analytics
Returns high-level distribution of plans and active users.

```http
GET /subscriptions/admin/analytics
Auth: Bearer {{adminToken}}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "planDistribution": [{ "_id": "PREMIUM", "count": 45 }, { "_id": "FREE", "count": 120 }],
    "platformDistribution": [{ "_id": "apple", "count": 30 }, { "_id": "google", "count": 15 }],
    "activeCount": 45
  }
}
```

---

## 3. View Audit Events (History)
Returns the paginated append-only history of a user's subscription (upgrades, renewals, cancellations). Sort is fixed to newest-first (`occurredAt: -1`); `?sort=` is ignored.

```http
GET /subscriptions/admin/events/:userId?page=1&limit=20
Auth: Bearer {{adminToken}}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)

**Response shape** — `{ data, meta }` (⚠ changed from previous raw `ISubscriptionEvent[]` array):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription events retrieved successfully",
  "meta": {
    "total": 8,
    "limit": 20,
    "page": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "subscriptionId": "...",
      "eventType": "UPGRADED",
      "previousPlan": "FREE",
      "nextPlan": "PREMIUM",
      "previousStatus": "active",
      "nextStatus": "active",
      "platform": "apple",
      "productId": "premium_monthly",
      "externalTransactionId": "2000000123456789",
      "occurredAt": "2026-04-07T10:30:00.000Z"
    }
  ]
}
```

---

## 3b. Get Subscription By ID
Returns a single subscription document by its Mongo `_id`.

```http
GET /subscriptions/admin/:subscriptionId
Auth: Bearer {{adminToken}}
```

---

## 4. Manual Plan Grant
Manually promote a user to `PREMIUM` or `ENTERPRISE` (useful for invoice-based payments or customer support).

```http
POST /subscriptions/admin/grant
Auth: Bearer {{adminToken}}
Content-Type: application/json

{
  "userId": "644b...",
  "plan": "ENTERPRISE"
}
```

---

## 5. Force Reset (Revoke)
Resets a user's subscription to the `FREE` plan immediately.

```http
POST /subscriptions/admin/reset/:userId
Auth: Bearer {{adminToken}}
```

---

## 6. Monitor Pending Webhooks
View "orphan" webhooks that arrived before a user record existed.

```http
GET /subscriptions/admin/pending-webhooks
Auth: Bearer {{adminToken}}
```
