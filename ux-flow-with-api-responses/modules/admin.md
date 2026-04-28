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
| 10.1 | GET | `/admin/growth-metrics` | SUPER_ADMIN | [Dashboard Overview](../dashboard-screens/02-overview.md) |
| 10.2 | GET | `/admin/preference-cards/monthly` | SUPER_ADMIN | [Dashboard Overview](../dashboard-screens/02-overview.md) |
| 10.3 | GET | `/admin/subscriptions/active/monthly` | SUPER_ADMIN | [Dashboard Overview](../dashboard-screens/02-overview.md) |

---

### 10.1 Growth Metrics (Stats)

```
GET /admin/growth-metrics
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Dashboard-er summary cards-er jonno ei endpoint use hoy. Monthly growth calculate kore: current month vs last month.

**Implementation:**
- **Route**: [admin.route.ts](file:///src/app/modules/admin/admin.route.ts)
- **Controller**: [admin.controller.ts](file:///src/app/modules/admin/admin.controller.ts) — `getDashboardStats`
- **Service**: [admin.service.ts](file:///src/app/modules/admin/admin.service.ts) — `getAdminDashboardStats`

**Business Logic:**
1. **Aggregation Engine**: Uses `AggregationBuilder` to run complex MongoDB aggregation pipelines across multiple collections (`User`, `PreferenceCardModel`, `Subscription`).
2. **Growth Calculation**:
   - Calculates metrics for the **current month** (e.g., May) and the **previous month** (e.g., April).
   - `doctors`: Total users in the system.
   - `preferenceCards`: Total cards created.
   - `verifiedPreferenceCards`: Cards where `published: true`.
   - `activeSubscriptions`: Subscriptions where `status: 'ACTIVE'`.
3. **Growth Logic**:
   - `changePct`: The percentage difference between current and last month.
   - `direction`: Maps the growth type to UI-friendly strings: `increase` → `"up"`, `decrease` → `"down"`, others → `"neutral"`.
4. **Data Formatting**: Normalizes raw aggregation results into a consistent object structure for the frontend.

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

> Preference cards-er monthly trend chart render korar jonno data return kore. YoY comparison inline series e embedded — frontend ke alada calculate korte hobe na.

**Implementation:**
- **Route**: [admin.route.ts](file:///src/app/modules/admin/admin.route.ts)
- **Controller**: [admin.controller.ts](file:///src/app/modules/admin/admin.controller.ts) — `getPreferenceCardMonthly`
- **Service**: [admin.service.ts](file:///src/app/modules/admin/admin.service.ts) — `getPreferenceCardMonthlyTrend`

**Business Logic:**
1. **Time-Series Analysis**: Uses `AggregationBuilder.getTimeTrends` to group preference card creation by month.
2. **Labeling**: Automatically generates localized month names (e.g., "January", "February").
3. **Data Extraction**: Extracts `transactionCount` for each month to build the chart series.
4. **Efficiency**: Executes a single aggregation query to retrieve the entire year's trend.

**Query Parameters:**

| Param | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `year` | `number` | No | Current year | Primary year to fetch (e.g. `2025`) |
| `compare_year` | `number` | No | `year - 1` | Year to compare against for YoY delta |
| `tz` | `string` | No | `"UTC"` | IANA timezone for monthly bucket boundaries (e.g. `"Asia/Dhaka"`) |

**Implementation:**
- **Route**: [admin.route.ts](file:///src/app/modules/admin/admin.route.ts)
- **Controller**: [admin.controller.ts](file:///src/app/modules/admin/admin.controller.ts) — `getPreferenceCardMonthly`
- **Service**: [admin.service.ts](file:///src/app/modules/admin/admin.service.ts) — `getPreferenceCardMonthlyTrend`

**Field Reference:**

| Field | Type | Description |
| :--- | :--- | :--- |
| `meta.timezone` | `string` | Timezone used for bucketing — echoes the `tz` query param |
| `summary.total` | `number` | Sum of all 12 months for `year` |
| `summary.monthly_avg` | `number` | `total / 12` rounded |
| `summary.daily_avg` | `number` | `total / days_in_year` rounded — useful for day-level projections |
| `summary.peak` | `object` | Month with highest count |
| `summary.trend` | `"upward" \| "downward" \| "stable"` | Overall directional trend across the year. `"upward"` = H2 avg > H1 avg. `"stable"` = < 5% difference. |
| `series[].month` | `string` | Lowercase month name (e.g. `"january"`) |
| `series[].month_number` | `number` | 1-indexed integer (January = 1) — use this for sorting and chart indexing |
| `series[].date_from` / `date_to` | `string` | ISO 8601 date range for the bucket (inclusive) |
| `series[].count` | `number \| null` | Card count. `null` for future months not yet reached |
| `series[].last_year_count` | `number` | Count for the same month in `compare_year` |
| `series[].yoy_delta` | `number` | `count - last_year_count` (pre-computed — do not recalculate on frontend) |
| `series[].yoy_delta_pct` | `number` | Percentage change vs same month last year |
| `summary.yoy.total_change_pct` | `number` | Year-level total change vs `compare_year` |
| `summary.yoy.avg_change_pct` | `number` | Average of monthly YoY percentages |

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Monthly preference card trend for 2025 retrieved successfully.",
    "data": {
      "meta": {
        "year": 2025,
        "compare_year": 2024,
        "granularity": "monthly",
        "timezone": "Asia/Dhaka"
      },
      "summary": {
        "total": 1284,
        "monthly_avg": 107,
        "daily_avg": 4,
        "peak": {
          "month": "august",
          "month_number": 8,
          "count": 152
        },
        "trend": "upward",
        "yoy": {
          "total_change_pct": 13.2,
          "avg_change_pct": 12.6
        }
      },
      "series": [
        {
          "month": "january",
          "month_number": 1,
          "date_from": "2025-01-01",
          "date_to": "2025-01-31",
          "count": 72,
          "last_year_count": 61,
          "yoy_delta": 11,
          "yoy_delta_pct": 18.0
        },
        {
          "month": "february",
          "month_number": 2,
          "date_from": "2025-02-01",
          "date_to": "2025-02-28",
          "count": 85,
          "last_year_count": 70,
          "yoy_delta": 15,
          "yoy_delta_pct": 21.4
        },
        {
          "month": "march",
          "month_number": 3,
          "date_from": "2025-03-01",
          "date_to": "2025-03-31",
          "count": 98,
          "last_year_count": 83,
          "yoy_delta": 15,
          "yoy_delta_pct": 18.1
        },
        {
          "month": "april",
          "month_number": 4,
          "date_from": "2025-04-01",
          "date_to": "2025-04-30",
          "count": 104,
          "last_year_count": 89,
          "yoy_delta": 15,
          "yoy_delta_pct": 16.9
        },
        {
          "month": "may",
          "month_number": 5,
          "date_from": "2025-05-01",
          "date_to": "2025-05-31",
          "count": 112,
          "last_year_count": 97,
          "yoy_delta": 15,
          "yoy_delta_pct": 15.5
        },
        {
          "month": "june",
          "month_number": 6,
          "date_from": "2025-06-01",
          "date_to": "2025-06-30",
          "count": 129,
          "last_year_count": 110,
          "yoy_delta": 19,
          "yoy_delta_pct": 17.3
        },
        {
          "month": "july",
          "month_number": 7,
          "date_from": "2025-07-01",
          "date_to": "2025-07-31",
          "count": 141,
          "last_year_count": 122,
          "yoy_delta": 19,
          "yoy_delta_pct": 15.6
        },
        {
          "month": "august",
          "month_number": 8,
          "date_from": "2025-08-01",
          "date_to": "2025-08-31",
          "count": 152,
          "last_year_count": 130,
          "yoy_delta": 22,
          "yoy_delta_pct": 16.9
        },
        {
          "month": "september",
          "month_number": 9,
          "date_from": "2025-09-01",
          "date_to": "2025-09-30",
          "count": 138,
          "last_year_count": 118,
          "yoy_delta": 20,
          "yoy_delta_pct": 16.9
        },
        {
          "month": "october",
          "month_number": 10,
          "date_from": "2025-10-01",
          "date_to": "2025-10-31",
          "count": 121,
          "last_year_count": 104,
          "yoy_delta": 17,
          "yoy_delta_pct": 16.3
        },
        {
          "month": "november",
          "month_number": 11,
          "date_from": "2025-11-01",
          "date_to": "2025-11-30",
          "count": 97,
          "last_year_count": 82,
          "yoy_delta": 15,
          "yoy_delta_pct": 18.3
        },
        {
          "month": "december",
          "month_number": 12,
          "date_from": "2025-12-01",
          "date_to": "2025-12-31",
          "count": 80,
          "last_year_count": 68,
          "yoy_delta": 12,
          "yoy_delta_pct": 17.6
        }
      ]
    }
  }
  ```

---

### 10.3 Monthly Active Subscriptions Trend

```
GET /admin/subscriptions/active/monthly
Auth: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Active subscriptions-er monthly analytics return kore — same shape as 10.2. YoY data inline series e embedded.

**Implementation:**
- **Route**: [admin.route.ts](file:///src/app/modules/admin/admin.route.ts)
- **Controller**: [admin.controller.ts](file:///src/app/modules/admin/admin.controller.ts) — `getActiveSubscriptionMonthly`
- **Service**: [admin.service.ts](file:///src/app/modules/admin/admin.service.ts) — `getActiveSubscriptionMonthlyTrend`

**Business Logic:**
1. **Year-over-Year (YoY) Comparison**:
   - Fetches monthly trends for the **current year** and the **previous year** in parallel.
   - Calculates `yoy_growth_pct` for each month by comparing current count vs. last year's same month.
2. **Advanced Analytics**:
   - **Peak/Slowest Identification**: Iterates through the series to find and flag (`is_peak`, `is_slowest`) the months with highest and lowest counts.
   - **Summary Stats**: Computes total year count, monthly average, and overall year-over-year growth percentage.
3. **Status Filtering**: Strictly filters for `status: 'ACTIVE'` subscriptions to ensure analytics reflect current revenue-generating state.
4. **Data Padding**: Ensures 12 items are always returned for a complete calendar year, even if some months have zero activity.

**Query Parameters:**

| Param | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `year` | `number` | No | Current year | Primary year to fetch |
| `compare_year` | `number` | No | `year - 1` | Year to compare against for YoY delta |
| `tz` | `string` | No | `"UTC"` | IANA timezone for monthly bucket boundaries |

**Implementation:**
- **Route**: [admin.route.ts](file:///src/app/modules/admin/admin.route.ts)
- **Controller**: [admin.controller.ts](file:///src/app/modules/admin/admin.controller.ts) — `getActiveSubscriptionMonthly`
- **Service**: [admin.service.ts](file:///src/app/modules/admin/admin.service.ts) — `getActiveSubscriptionMonthlyTrend`

**Field Reference:** Same schema as 10.2. Additional fields:

| Field | Type | Description |
| :--- | :--- | :--- |
| `series[].is_peak` | `boolean` | `true` for the month with highest `count` — use for chart highlight |
| `series[].is_slowest` | `boolean` | `true` for the month with lowest `count` — use for chart annotation |

> **Design note:** `is_peak` and `is_slowest` are pre-computed server-side so the frontend does not need to find max/min itself.

#### Responses

- **Scenario: Success (200)**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Monthly active subscription trend for 2026 retrieved successfully.",
    "data": {
      "meta": {
        "year": 2026,
        "compare_year": 2025,
        "granularity": "monthly",
        "timezone": "UTC"
      },
      "summary": {
        "total": 2847,
        "monthly_avg": 237,
        "daily_avg": 8,
        "peak": {
          "month": "august",
          "month_number": 8,
          "count": 382
        },
        "trend": "upward",
        "yoy": {
          "total_change_pct": 20.0,
          "avg_change_pct": 18.4
        }
      },
      "series": [
        {
          "month": "january",
          "month_number": 1,
          "date_from": "2026-01-01",
          "date_to": "2026-01-31",
          "count": 200,
          "last_year_count": 172,
          "yoy_delta": 28,
          "yoy_delta_pct": 16.3,
          "is_peak": false,
          "is_slowest": false
        },
        {
          "month": "august",
          "month_number": 8,
          "date_from": "2026-08-01",
          "date_to": "2026-08-31",
          "count": 382,
          "last_year_count": 318,
          "yoy_delta": 64,
          "yoy_delta_pct": 20.1,
          "is_peak": true,
          "is_slowest": false
        }
        // ... 10 more months follow the same shape (always 12 items for a complete year)
      ]
    }
  }
  ```

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **No Data (New System)** | `value` 0 return korbe, `changePct` 0 hobe, `direction` `"neutral"` hobe, ebong trend chart `series` empty array hobe (labels thakbe na). |
| **First Month Data** | `lastPeriodCount` 0 hole `changePct` automatically `100` show korbe, `direction` `"up"` hobe — aggregation logic e handle kora. |
| **Database Latency** | Parallel calls use kora hoyeche, tai dashboard partial load hote pare — **Skeleton screens strongly recommended**. |
| **Unauthorized Access** | `SUPER_ADMIN` role chara dashboard stats access kora jabe na → `403 Forbidden`. |
| **Future Month Data** | Current month er pore er months er `count` `null` hobe (0 noy) — frontend e null check kore chart point skip korbe. |

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|:---:|:---:|:---:|---|
| 10.1 | `/admin/growth-metrics` | GET | SUPER_ADMIN | Done | Summary stats — `changePct` always positive, use `direction` for sign |
| 10.2 | `/admin/preference-cards/monthly` | GET | SUPER_ADMIN | Done | Monthly trend — YoY inline per series item, accepts `year`/`compare_year`/`tz` params |
| 10.3 | `/admin/subscriptions/active/monthly` | GET | SUPER_ADMIN | Done | Same shape as 10.2 + `is_peak`/`is_slowest` boolean flags per item |
