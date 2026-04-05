# Screen 2: Overview

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Doctor](./03-doctor.md) (Doctor list)

## UX Flow

### Dashboard Load Flow
1. Admin Dashboard e login korle "Overview" screen render hoy
2. Page load e parallel API calls chole stats display korar jonno:
   - Growth metrics (Total students, active users etc.) → `GET /admin/growth-metrics` (→ 2.1)
   - Preference cards monthly trend → `GET /admin/preference-cards/monthly` (→ 2.2)
   - Active subscriptions monthly trend → `GET /admin/subscriptions/active/monthly` (→ 2.3)
3. Screen render hoy: Summary cards (Stats) → Monthly Trend Charts (Preferences, Subscriptions)

---

<!-- ══════════════════════════════════════ -->
<!--              OVERVIEW FLOW              -->
<!-- ══════════════════════════════════════ -->

### 2.1 Growth Metrics (Stats)

```
GET /admin/growth-metrics
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

**Implementation:**
- **Route**: `src/app/modules/admin/admin.route.ts`
- **Controller**: `src/app/modules/admin/admin.controller.ts` — `getDashboardStats`
- **Service**: `src/app/modules/admin/admin.service.ts` — `getAdminDashboardStats`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "summary": {
      "doctors": { "value": 250, "growth": 10, "growthType": "increase" },
      "preferenceCards": { "value": 4500, "growth": 5, "growthType": "increase" },
      "activeSubscriptions": { "value": 120, "growth": 2, "growthType": "decrease" }
    }
  }
}
```

---

### 2.2 Monthly Preference Cards Trend

```
GET /admin/preference-cards/monthly
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

**Implementation:**
- **Route**: `src/app/modules/admin/admin.route.ts`
- **Controller**: `src/app/modules/admin/admin.controller.ts` — `getPreferenceCardMonthly`
- **Service**: `src/app/modules/admin/admin.service.ts` — `getPreferenceCardMonthlyTrend`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card monthly trend retrieved successfully",
  "data": [
    { "label": "January", "count": 120 },
    { "label": "February", "count": 150 },
    { "label": "March", "count": 200 }
  ]
}
```

---

### 2.3 Monthly Active Subscriptions Trend

```
GET /admin/subscriptions/active/monthly
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

**Implementation:**
- **Route**: `src/app/modules/admin/admin.route.ts`
- **Controller**: `src/app/modules/admin/admin.controller.ts` — `getActiveSubscriptionMonthly`
- **Service**: `src/app/modules/admin/admin.service.ts` — `getActiveSubscriptionMonthlyTrend`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Active subscription monthly trend retrieved successfully",
  "data": [
    { "label": "January", "count": 45 },
    { "label": "February", "count": 60 },
    { "label": "March", "count": 55 }
  ]
}
```

---

## API Status

| # | Endpoint | Status | Notes |
|---|----------|:------:|-------|
| 2.1 | `GET /admin/growth-metrics` | ✅ Done | Overall dashboard stats |
| 2.2 | `GET /admin/preference-cards/monthly` | ✅ Done | Monthly preferences trend data |
| 2.3 | `GET /admin/subscriptions/active/monthly` | ✅ Done | Monthly subscriptions trend data |
