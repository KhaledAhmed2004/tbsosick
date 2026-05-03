# Screen 2: Overview (Admin-Facing)

> **Section**: Dashboard Screens — UX Flow
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [User Management](./03-user-management.md) — doctor list management and related admin actions

---

> **No UI flow mismatches detected — screen flow is clean and ready for backend analysis.** Every step in the UX Flow above is unambiguous and consistent with related screens. Move to Step 2.

## UX Flow

### 1. Dashboard Load

1. After a successful `SUPER_ADMIN` login, the Overview screen opens automatically.
2. The screen loads dashboard summary data and monthly trend data in parallel.
3. The top section shows summary cards with total counts, growth direction, and percentage change compared to the previous month.
4. The middle section shows monthly trend charts using line or bar chart visualizations.
5. Each dashboard widget loads independently, so one failed chart or metric does not block other dashboard sections from rendering.

#### Summary Cards

* **Total Doctors**

  * Shows the total doctor count with growth direction and percentage change compared to the previous month.
  * Updates automatically when dashboard data reloads.

* **Preference Cards**

  * Shows the total preference card count with growth direction and percentage change compared to the previous month.
  * Represents overall system activity for preference-card usage.

* **Active Subscriptions**

  * Shows the total number of active subscriptions with growth direction and percentage change compared to the previous month.
  * Reflects currently active paid users or organizations.

#### Trend Charts

* Monthly Preference Cards trend chart shows month-by-month preference-card activity for a fixed rolling 12-month window.
* Monthly Active Subscriptions trend chart shows month-by-month active subscription growth for a fixed rolling 12-month window.
* Future months are skipped when the server returns `null` values for those periods.

---

### 2. Empty and Restricted States

1. If the system has no data yet, all summary cards show `0`.
2. Growth indicators display a neutral state when comparison data is unavailable.
3. Trend charts render without labels or data points when no monthly data exists.
4. Users without the `SUPER_ADMIN` role cannot access the Overview screen.
5. Unauthorized users are redirected back to the admin-only access boundary.
