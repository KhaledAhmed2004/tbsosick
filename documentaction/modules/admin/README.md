# Admin Module APIs

> **Section**: Backend API specifications for the admin module (analytics & dashboard).
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Auth**: All endpoints require `Bearer {{accessToken}}` with `SUPER_ADMIN` role
> **Response format**: See [Standard Response Envelope](../../README.md#standard-response-envelope)
> **UX Flows referencing this module**:
> - [Dashboard Overview Screen] — Growth metrics + monthly trend charts

---

## Endpoints Index

| # | Method | Endpoint | Auth | Documentation | Used By |
|---|---|---|---|---|---|
| 01 | GET | `/admin/growth-metrics` | SUPER_ADMIN | [01-growth-metrics.md](./01-growth-metrics.md) | [Dashboard Overview Screen] — summary cards (doctors, cards, verified cards, active subs) with month-over-month change |
| 02 | GET | `/admin/preference-cards/trends/monthly` | SUPER_ADMIN | [02-monthly-preference-cards-trend.md](./02-monthly-preference-cards-trend.md) | [Dashboard Overview Screen] — plain monthly trend chart for preference cards (no YoY) |
| 03 | GET | `/admin/subscriptions/trends/monthly` | SUPER_ADMIN | [03-monthly-active-subscriptions-trend.md](./03-monthly-active-subscriptions-trend.md) | [Dashboard Overview Screen] — monthly trend chart for active subscriptions with YoY + peak/slowest precomputed |

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **No Data (New System)** | 01: `value` 0, `changePct` 0, `direction` `"neutral"`. 02: `data` is an empty array `[]`. 03: `summary.peak` and `summary.slowest` will be `null`, and every month in `series` will have `count: 0`. |
| **YoY Comparison — No Last-Year Data** | In 03, if `lastYearCount` is 0 and the current month `count > 0`, `yoyGrowthPct` is set to `100` (server-side aggregation logic). If both are 0, it is `0`. |
| **Database Latency** | Parallel aggregation calls are used — there is a risk of partial dashboard loading. **Skeleton screens are recommended.** |
| **Unauthorized Access** | Without the `SUPER_ADMIN` role → `403 Forbidden`. |
| **Future Month Data** | 02 and 03 always return 12 series items for the current year. Future months will have a `count` of `0` (not `null`) — these will be drawn as `0` on the chart. If skipping is desired, the frontend must apply a filter. |

---

## API Status

| # | Endpoint | Method | Auth | Status | Notes |
|---|---|:---:|:---:|:---:|---|
| 01 | `/admin/growth-metrics` | GET | SUPER_ADMIN | Done | Summary stats — `changePct` always positive magnitude, use `direction` for sign |
| 02 | `/admin/preference-cards/trends/monthly` | GET | SUPER_ADMIN | Done | Plain monthly trend — flat array of `{ month, label, count }`, no YoY |
| 03 | `/admin/subscriptions/trends/monthly` | GET | SUPER_ADMIN | Done | Monthly trend with YoY + `peak`/`slowest` precomputed |
