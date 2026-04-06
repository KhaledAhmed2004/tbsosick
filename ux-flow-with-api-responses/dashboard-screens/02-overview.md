# Screen 2: Overview

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Doctor](./03-doctor.md) (Doctor list actions)

## UX Flow

### Dashboard Load Flow
1. Admin Dashboard e login korle "Overview" screen render hoy
2. Page load e parallel API calls chole stats display korar jonno:
   - Growth metrics (Doctors, Preference Cards, Subscriptions) → `GET /admin/growth-metrics` (→ 2.1)
   - Preference cards monthly trend chart → `GET /admin/preference-cards/monthly` (→ 2.2)
   - Active subscriptions monthly trend chart → `GET /admin/subscriptions/active/monthly` (→ 2.3)
3. Screen render hoy: 
   - Top section e Summary Cards (Total count + Growth percentage) dekhay
   - Middle section e Trend Charts (Line/Bar charts) monthly data show kore

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **No Data (New System)** | `value` 0 return korbe, `growth` 0 hobe, ebong trend charts empty (labels thakbe) hobe. |
| **First Month Data** | `lastPeriodCount` 0 hole `growth` automatically 100% (increase) show korbe aggregation logic-e. |
| **Database Latency** | Parallel calls use kora hoyeche, tai dashboard partial load hote pare (Skeleton screens recommended). |
| **Unauthorized Access** | `SUPER_ADMIN` role chara dashboard stats access kora jabe na (403 Forbidden). |

---

<!-- ══════════════════════════════════════ -->
<!--              OVERVIEW FLOW              -->
<!-- ══════════════════════════════════════ -->

### 2.1 Growth Metrics (Stats)

```
GET /admin/growth-metrics
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Dashboard-er summary cards-er jonno ei endpoint use hoy. Eta monthly growth calculate kore (Current month vs Last month).

**Implementation:**
- **Route**: [admin.route.ts](file:///src/app/modules/admin/admin.route.ts)
- **Controller**: [admin.controller.ts](file:///src/app/modules/admin/admin.controller.ts) — `getDashboardStats`
- **Service**: [admin.service.ts](file:///src/app/modules/admin/admin.service.ts) — `getAdminDashboardStats`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Admin dashboard metrics",
  "data": {
    "meta": {
      "comparisonPeriod": "month"
    },
    "doctors": {
      "value": 250,
      "changePct": 25,
      "direction": "up"
    },
    "preferenceCards": {
      "value": 4500,
      "changePct": 7.14,
      "direction": "up"
    },
    "verifiedPreferenceCards": {
      "value": 4200,
      "changePct": 4,
      "direction": "up"
    },
    "activeSubscriptions": {
      "value": 120,
      "changePct": 37.5,
      "direction": "down"
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

> Preference cards-er monthly trend line chart render korar jonno data return kore (Current year).

**Implementation:**
- **Route**: [admin.route.ts](file:///src/app/modules/admin/admin.route.ts)
- **Controller**: [admin.controller.ts](file:///src/app/modules/admin/admin.controller.ts) — `getPreferenceCardMonthly`
- **Service**: [admin.service.ts](file:///src/app/modules/admin/admin.service.ts) — `getPreferenceCardMonthlyTrend`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preference card monthly trend",
  "data": [
    { "label": "Jan", "count": 120 },
    { "label": "Feb", "count": 150 },
    { "label": "Mar", "count": 200 }
  ]
}
```

---

### 2.3 Monthly Active Subscriptions Trend

```
GET /admin/subscriptions/active/monthly
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Active subscriptions-er monthly analytics (YoY comparison, summary, peaks, ebong series) return kore chart render korar jonno.

**Implementation:**
- **Route**: [admin.route.ts](file:///src/app/modules/admin/admin.route.ts)
- **Controller**: [admin.controller.ts](file:///src/app/modules/admin/admin.controller.ts) — `getActiveSubscriptionMonthly`
- **Service**: [admin.service.ts](file:///src/app/modules/admin/admin.service.ts) — `getActiveSubscriptionMonthlyTrend`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Monthly analytics for 2026 retrieved successfully.",
  "data": {
    "meta": {
      "year": 2026,
      "granularity": "monthly",
      "compare_year": 2025,
      "timezone": "UTC"
    },
    "summary": {
      "total_count": 2847,
      "period_avg": 237,
      "yoy_growth_pct": 20.0,
      "peak": {
        "period": "2026-08",
        "label": "Aug",
        "count": 382
      },
      "slowest": {
        "period": "2026-12",
        "label": "Dec",
        "count": 101
      }
    },
    "series": [
      {
        "period": "2026-01",
        "label": "Jan",
        "count": 200,
        "last_year_count": 172,
        "yoy_growth_pct": 16.3,
        "is_peak": false,
        "is_slowest": false
      },
      {
        "period": "2026-08",
        "label": "Aug",
        "count": 382,
        "last_year_count": 318,
        "yoy_growth_pct": 20.1,
        "is_peak": true,
        "is_slowest": false
      }
    ]
  }
}
```

---

## API Status

| # | Endpoint | Status | Notes |
|---|----------|:------:|-------|
| 2.1 | `GET /admin/growth-metrics` | ✅ Done | Summary stats with growth calculation |
| 2.2 | `GET /admin/preference-cards/monthly` | ✅ Done | Monthly trend for all preference cards |
| 2.3 | `GET /admin/subscriptions/active/monthly` | ✅ Done | Monthly trend for active subscriptions only |
