# Admin Module APIs

> **Section**: Backend API specifications for the admin module (analytics & dashboard).
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Auth**: All endpoints require `Bearer {{accessToken}}` with `SUPER_ADMIN` role
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [Dashboard Overview](../dashboard-screens/02-overview.md) — Growth metrics + monthly trend charts

---

## Endpoints Index

| # | Method | Endpoint | Auth | Used By |
|---|---|---|---|---|
| 10.1 | GET | `/admin/growth-metrics` | SUPER_ADMIN | [Dashboard Overview](../dashboard-screens/02-overview.md) — summary cards (doctors, cards, verified cards, active subs) with month-over-month change |
| 10.2 | GET | `/admin/preference-cards/monthly` | SUPER_ADMIN | [Dashboard Overview](../dashboard-screens/02-overview.md) — plain monthly trend chart for preference cards (no YoY) |
| 10.3 | GET | `/admin/subscriptions/active/monthly` | SUPER_ADMIN | [Dashboard Overview](../dashboard-screens/02-overview.md) — monthly trend chart for active subscriptions with YoY + peak/slowest precomputed |

---

### 10.1 Growth Metrics (Stats)

```
GET /admin/growth-metrics
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Dashboard-er summary cards-er jonno ei endpoint use hoy. Monthly growth calculate kore: current month vs last month.

**Query Parameters:** None

**Implementation:**
- **Route**: `src/app/modules/admin/admin.route.ts`
- **Controller**: `src/app/modules/admin/admin.controller.ts` — `getDashboardStats`
- **Service**: `src/app/modules/admin/admin.service.ts` — `getAdminDashboardStats`

**Field Reference:**

| Field | Type | Description |
| :--- | :--- | :--- |
| `meta.comparisonPeriod` | `string` | Always `"month"` — current vs last calendar month |
| `{metric}.value` | `number` | Total count as of now |
| `{metric}.changePct` | `number` | Always a **positive** magnitude (e.g. `25`, `7.14`). Use `direction` for sign. |
| `{metric}.direction` | `"up" \| "down" \| "neutral"` | `"up"` = growth, `"down"` = decline, `"neutral"` = no change or first month with no prior data |

#### Responses

- **Scenario: Success (200)**
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

> **Note:** `activeSubscriptions.direction: "down"` with `changePct: 37.5` means active subscriptions **decreased by 37.5%** compared to last month. `changePct` is always a positive number; `direction` tells you whether it went up or down.

---

### 10.2 Monthly Preference Cards Trend

```
GET /admin/preference-cards/monthly
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Preference cards-er monthly trend chart render korar jonno data return kore. **Plain shape** — flat array of `{ label, count }` per month. No YoY, no peak/slowest, no params. Server `getTimeTrends({ timeUnit: 'month' })` use kore — chart x-axis e direct `label` use kora jay.

**Query Parameters:** None

**Implementation:**
- **Route**: `src/app/modules/admin/admin.route.ts`
- **Controller**: `src/app/modules/admin/admin.controller.ts` — `getPreferenceCardMonthly`
- **Service**: `src/app/modules/admin/admin.service.ts` — `getPreferenceCardMonthlyTrend`

**Field Reference:**

| Field | Type | Description |
| :--- | :--- | :--- |
| `data[].label` | `string` | Month label (server-formatted, e.g. `"January 2025"`) — directly usable as chart x-axis label |
| `data[].count` | `number` | Total preference cards created in that month bucket |

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Preference card monthly trend",
    "data": [
      { "label": "January 2025", "count": 72 },
      { "label": "February 2025", "count": 85 },
      { "label": "March 2025", "count": 98 }
    ]
  }
  ```

> Banglish: 10.2 ar 10.3 same shape **noy** — 10.2 plain `[{ label, count }]`, 10.3 e elaborate summary + YoY + peak/slowest ache. Frontend e duito ke ek shape vebe code kora jabe na.

---

### 10.3 Monthly Active Subscriptions Trend

```
GET /admin/subscriptions/active/monthly
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Active subscriptions-er monthly analytics return kore — current year vs last year er YoY comparison inline series e embedded, ar `peak` / `slowest` month server-side e pre-computed. Frontend ke max/min find korte hobe na.

**Query Parameters:** None — controller currently `currentYear` hardcode kore (`new Date().getFullYear()`), `compareYear` automatic `currentYear - 1`, `timezone` always `"UTC"`. Year override karte hole controller signature update lagbe.

**Implementation:**
- **Route**: `src/app/modules/admin/admin.route.ts`
- **Controller**: `src/app/modules/admin/admin.controller.ts` — `getActiveSubscriptionMonthly`
- **Service**: `src/app/modules/admin/admin.service.ts` — `getActiveSubscriptionMonthlyTrend`

**Field Reference:**

| Field | Type | Description |
| :--- | :--- | :--- |
| `meta.year` | `number` | Primary year — currently hardcoded to server's `currentYear` |
| `meta.granularity` | `string` | Always `"monthly"` |
| `meta.compareYear` | `number` | Comparison year for YoY — currently hardcoded to `meta.year - 1` |
| `meta.timezone` | `string` | Always `"UTC"` |
| `summary.totalCount` | `number` | Sum of all months' `count` for `meta.year` |
| `summary.periodAvg` | `number` | `Math.round(totalCount / 12)` — average active subs per month |
| `summary.yoyGrowthPct` | `number` | Year-level total YoY % vs `compareYear` (rounded to 1 decimal). `0` if last year had no data. |
| `summary.peak` | `object \| null` | `{ period, label, count }` for the month with highest `count`, or `null` if no months have data |
| `summary.slowest` | `object \| null` | `{ period, label, count }` for the month with lowest non-zero `count`, or `null` if no data |
| `series[].period` | `string` | Year-month key (e.g. `"2026-01"`) — stable for sorting and lookups |
| `series[].label` | `string` | Server-formatted month label (e.g. `"January 2026"`) |
| `series[].count` | `number` | Active subscription count for that month |
| `series[].lastYearCount` | `number` | Same month's count in `compareYear` (`0` if no data) |
| `series[].yoyGrowthPct` | `number` | Per-month YoY % vs same month last year. `100` if last year was 0 and this month > 0. `0` if both are 0. |
| `series[].isPeak` | `boolean` | `true` for the month matching `summary.peak` (only set when count > 0) |
| `series[].isSlowest` | `boolean` | `true` for the month matching `summary.slowest` (only set when count > 0) |

> **Design note:** `isPeak` and `isSlowest` server-side e pre-computed — frontend e max/min hisheb korar dorkar nei. Field naming all camelCase because `sendResponse` auto-camelizes the service-side snake_case payload (per `system-concepts.md` "Field Transformations").

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Monthly analytics for 2026 retrieved successfully.",
    "data": {
      "meta": {
        "year": 2026,
        "granularity": "monthly",
        "compareYear": 2025,
        "timezone": "UTC"
      },
      "summary": {
        "totalCount": 2847,
        "periodAvg": 237,
        "yoyGrowthPct": 20.0,
        "peak": {
          "period": "2026-08",
          "label": "August 2026",
          "count": 382
        },
        "slowest": {
          "period": "2026-01",
          "label": "January 2026",
          "count": 200
        }
      },
      "series": [
        {
          "period": "2026-01",
          "label": "January 2026",
          "count": 200,
          "lastYearCount": 172,
          "yoyGrowthPct": 16.3,
          "isPeak": false,
          "isSlowest": true
        },
        {
          "period": "2026-08",
          "label": "August 2026",
          "count": 382,
          "lastYearCount": 318,
          "yoyGrowthPct": 20.1,
          "isPeak": true,
          "isSlowest": false
        }
        // ... 10 more months follow the same shape
      ]
    }
  }
  ```

> Banglish: backend message string ta generic — `` `Monthly analytics for ${currentYear} retrieved successfully.` `` — eta active-subs trend er response, kintu message e "active subscription" mention nei. Controller message ta tighten korle frontend e log/debug e clearer hobe.

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **No Data (New System)** | 10.1: `value` 0, `changePct` 0, `direction` `"neutral"`. 10.2: `data` empty array `[]`. 10.3: `summary.peak` ar `summary.slowest` `null` hobe, `series` te every month `count: 0` thakbe. |
| **YoY Comparison — No Last-Year Data** | 10.3 e `lastYearCount` 0 hole, current month `count > 0` thakle `yoyGrowthPct` `100` set hoy (server-side aggregation logic). Both 0 hole `0`. |
| **Database Latency** | Parallel aggregation calls use hoyeche — dashboard partial-load risk ache. **Skeleton screens recommended.** |
| **Unauthorized Access** | `SUPER_ADMIN` role chara → `403 Forbidden`. |
| **Future Month Data** | 10.2 / 10.3 always 12 series item return kore current year er. Future month gulor `count` `0` thakbe (`null` noy) — chart e `0` point e directly draw hobe. Skip korte chaile frontend e filter lagbe. |

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|:---:|:---:|:---:|---|
| 10.1 | `/admin/growth-metrics` | GET | SUPER_ADMIN | Done | Summary stats — `changePct` always positive magnitude, use `direction` for sign |
| 10.2 | `/admin/preference-cards/monthly` | GET | SUPER_ADMIN | Done | Plain monthly trend — flat array of `{ label, count }`, no YoY, no params |
| 10.3 | `/admin/subscriptions/active/monthly` | GET | SUPER_ADMIN | Done | Monthly trend with YoY + `peak`/`slowest` precomputed; no params (currentYear hardcoded server-side) |
