# Screen 2: Overview

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Auth**: All endpoints require `Bearer {{accessToken}}` with `SUPER_ADMIN` role
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [User Management](./03-user-management.md) (Doctor list actions)

---

## UX Flow

### Dashboard Load Flow
1. Admin Dashboard e login korle "Overview" screen render hoy
2. Page load e **parallel API calls** chole stats display korar jonno:
   - Growth metrics (Doctors, Preference Cards, Subscriptions) → [GET /admin/growth-metrics](../modules/admin.md#101-growth-metrics-stats)
   - Preference cards monthly trend chart → [GET /admin/preference-cards/monthly](../modules/admin.md#102-monthly-preference-cards-trend)
   - Active subscriptions monthly trend chart → [GET /admin/subscriptions/active/monthly](../modules/admin.md#103-monthly-active-subscriptions-trend)
3. Screen render hoy:
   - Top section e **Summary Cards** (Total count + growth direction + change percentage) dekhay
   - Middle section e **Trend Charts** (Line/Bar charts) monthly data show kore

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **No Data (New System)** | Summary cards `value: 0`, `direction: "neutral"` show korbe; trend chart series empty thakbe (labels thakbe na). |
| **Database Latency** | Parallel calls use kora hoyeche, tai dashboard partial load hote pare — **Skeleton screens strongly recommended**. |
| **Unauthorized Access** | `SUPER_ADMIN` role chara dashboard stats access kora jabe na → admin-only state-e bounce hobe. |
| **Future Month Data** | Current month-er pore-r months-er chart point skip korbe (server `null` deyy, frontend null check kore). |

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/admin/growth-metrics` | [Module 10.1](../modules/admin.md#101-growth-metrics-stats) |
| 2 | GET | `/admin/preference-cards/monthly` | [Module 10.2](../modules/admin.md#102-monthly-preference-cards-trend) |
| 3 | GET | `/admin/subscriptions/active/monthly` | [Module 10.3](../modules/admin.md#103-monthly-active-subscriptions-trend) |
