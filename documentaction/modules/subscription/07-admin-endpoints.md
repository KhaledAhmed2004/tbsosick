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
- `limit`: Items per page (default: 10)
- `plan`: Filter by `FREE`, `PREMIUM`, or `ENTERPRISE`
- `status`: Filter by `active`, `past_due`, etc.
- `platform`: Filter by `apple`, `google`, or `admin`

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
Returns the full append-only history of a user's subscription (upgrades, renewals, cancellations).

```http
GET /subscriptions/admin/events/:userId
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
