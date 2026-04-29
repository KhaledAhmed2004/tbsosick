# Screen 2: Home (Mobile)

> **Section**: App APIs (User-Facing)  
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)  
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)  
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)  
> **Related screens**: [Auth](./01-auth.md) — login success kore user Home e land kore · [Preference Card Details](./03-preference-card-details.md) — card deep view navigation · [Create Preference Card](./04-create-preference-card.md) — card creation flow · [Notifications](./08-notifications.md) — bell icon entry point  
> **Doc version**: `v1` — last reviewed `2026-04-29`

---

## Common UI Rules

- **Submit protection**: disable interactive triggers during request + show spinner; prevent duplicate calls.
- **Offline mode**: show inline banner *"You're offline. Check connection."* and block new fetches.
- **5xx errors**: toast *"Something went wrong. Please try again."* + log to monitoring.
- **Validation (422)**: show field-level inline errors only.
- **Rate limit (429)**: respect `Retry-After` → show countdown *"Try again in {N}s"*.
- **Empty states**: never blank UI; always show meaningful placeholder.
- **Skeleton loading**: use for stats + favorite cards (avoid layout jump).
- **Status mapping**: `400` shape → inline · `401` auth → redirect Login · `403` state/perm → toast/modal · `404` missing → empty state/inline · `409` conflict → inline + recovery CTA · `422` validation → field inline · `429` → inline countdown · `5xx` → toast.

---

## UX Flow

### 1. Home Initial Load (App Entry)
1. User logs in successfully → lands on Home screen.
2. Home screen contains two main tabs: **All Cards** and **My Cards**.
3. When the screen mounts, **three API calls are triggered in parallel**:

* [`GET /preference-cards/stats`](../modules/preference-card.md#32-get-cards-stats) — fetches the “Total Available” and “My Created” counts.
* [`GET /users/me/favorites`](../modules/user.md#28-list-favorite-cards) — fetches the user’s bookmarked (favorite) card list.
* [`GET /preference-cards/my-cards`](../modules/preference-card.md#33-list-my-preference-cards) — fetches cards created by the current user (for the My Cards tab).

4. While API calls are pending, a **skeleton loader** is displayed in the Stats section, Favorites list, and My Cards list.

5. When the Stats API returns `200`, the Stats section renders accurate counts for **“Total Available”** and **“My Created.”**

6. When the Favorites API returns `200`, the bookmarked cards are displayed in a **horizontally scrollable list**. Each card shows a visible heart icon for direct toggling.

7. If the Favorites API returns `200` but the list is empty, refer to [No Favorites](#no-favorites).

8. If any API call returns `401`, the user is redirected to the Login screen (token expired).

9. If any API call returns a `5xx` error, a toast notification is shown and a **retry button** is displayed in place of the skeleton loader.

10. UI renders progressively:
    - Search bar (top, always interactive)
    - Notification bell (top-right entry)
    - Stats section (Total Available / My Created)
    - Favorite cards horizontal carousel (bottom section)
    - Floating “+” action button

> **English — WHY parallel fetch?**
> It reduces UX latency. If the user waits for the entire page as a single request, it feels slower. When independent endpoints are resolved separately in parallel, the UI becomes responsive faster and feels significantly quicker.

---

### 2. All Cards (Search & Discovery)
1. Default tab is **All Cards**.
2. User search bar-e keyword type kore (card title / surgeon / procedure).

3. A **300ms debounce** is applied on input changes, and the search is triggered after the user becomes idle. If a new keystroke occurs, the in-flight request is cancelled → [`GET /preference-cards?visibility=public&searchTerm=<keyword>`](../modules/preference-card.md#31-listsearch-preference-cards).

4. While the request is pending, a **skeleton/spinner** is shown in the results area — see [Search Latency](#search-latency).

5. On `200` with results, matching cards are rendered as a list directly below the search bar.

6. On `200` with an empty array, an empty state is shown with the message *“No cards found.”*

7. On `429`, an inline countdown is displayed below the search bar: *“Try again in {N}s.”* — see [Rate Limit Hit](#rate-limit-hit).

8. On `5xx`, a toast is shown; if previous results exist, they are faded (dimmed) and a retry icon is displayed in the search bar.

9. When the user clears the search bar or dismisses the keyboard, the default Home state is restored (Favorites list becomes visible).

> **English — WHY debounce?**
> If an API call is made on every keystroke, it can lead to rate-limit hits and unnecessary load on the backend. Debouncing is essential to keep the UI smooth and efficient by reducing the number of API requests.

---

### 3. My Cards (Manage My Cards)
1. User **My Cards** tab-e tap kore.
2. User-er create kora card list show hoy (data from [`GET /preference-cards/my-cards`](../modules/preference-card.md#33-list-my-preference-cards)).
3. Each card item contains **Edit** and **Delete** actions (quick actions).

#### Edit Card
1. User card item-er **Edit** icon-e tap kore.
2. Edit form open hoy, current card data diye pre-filled.
3. Parallel-e catalog re-fetch hoy ([`GET /supplies`](../modules/supply.md#71-list-supplies) & [`GET /sutures`](../modules/suture.md#81-list-sutures)).
4. User fields edit kore → tap **Publish** or **Save as Draft**.
5. [`PATCH /preference-cards/:cardId`](../modules/preference-card.md#36-update-preference-card) call hoy.
6. On success → Home-e back kora hoy + toast.

#### Delete Card
1. User card item-er **Delete** icon-e tap kore.
2. Confirmation modal show hoy.
3. User confirm korle → [`DELETE /preference-cards/:cardId`](../modules/preference-card.md#37-delete-preference-card) call hoy.
4. On success → item list theke remove hoy + toast.

---

### 4. Quick Action (Create Card)
1. The user taps the **“Create Preference Card +”** button.
2. Navigates to [Create Preference Card](./04-create-preference-card.md).
3. Success-er por Stats re-fetch hoy.

---

### 5. Favorite Interaction Flow
1. Home screen favorites section shows horizontal cards.
2. Tap **View All** → navigate full favorites screen.
Kono card-e tap korle Details screen-e navigate kore → Preference Card Details.

3. Toggle favorite from card/detail:
   - Add → [PUT `/preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#38-favorite-a-card)
   - Remove → [DELETE `/preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#39-unfavorite-a-card)
Call pending thakle heart icon-e optimistic update dekhay (immediate toggle) — call fail hole revert kore previous state-e.
Heart icon call in-flight thakle second tap ignore kore (lock) — see Double Tap on Favorite Toggle.
4. On success → local UI updates + background refresh favorites list.
5. Tap card → navigate to details screen.
404 → see Card No Longer Exists.
5xx → optimistic state revert; toast dekhay

> **Banglish — WHY optimistic update?** User experience instant lag-free feel korte pare. Backend confirm pore sync kore final consistency maintain kore.

---

## Edge Cases

### No Favorites

- **Trigger**: [`GET /users/me/favorites`](../modules/user.md#28-list-favorite-cards) returns `200` with empty `data` array.
- **UI response**: Inline placeholder in favorites section; "View All" button hidden.
- **Message**: *"No favorite cards yet."*
- **Action**: No CTA required; user can browse/search to discover cards.

### Search No Results
- **Trigger**: empty API result
- **UI response**: empty state illustration + text
- **Message**: *"No cards found"*
- **Action**: clear search / retry
- **Note**: avoids user confusion (Jakob's Law — consistent feedback expected)

### Double Tap on Favorite Toggle

- **Trigger**: User rapidly taps heart icon multiple times before first call settles.
- **UI response**: Second tap ignore kore jotokkhon first call in-flight thake (button locked during flight).
- **Message**: None.
- **Action**: First call settle-er por button re-enable; state accurate thake.
- **Note**: PUT/DELETE idempotent by design — server-side safe, kintu unnecessary calls avoid korar jonno client-side lock rakha better.

---

### Search Latency

- **Trigger**: [`GET /preference-cards?...`](../modules/preference-card.md#31-listsearch-preference-cards) call in-flight (>200ms).
- **UI response**: Results area-te skeleton rows ba spinner dekhay.
- **Message**: None (skeleton is the affordance).
- **Action**: Auto-resolves on response.
- **Note**: 300ms debounce + request cancellation implement kora thakle 60 req/min limit-e normal typing hit korbe na.

---

### Card No Longer Exists

- **Trigger**: Favorite toggle call returns `404` (card deleted by owner after list loaded).
- **UI response**: Toast + remove stale card from local favorites list.
- **Message**: *"This card is no longer available."*
- **Action**: Card silently removed from favorites list without requiring full re-fetch.

---
### Search Rate Limit
- **Trigger**: 429 response
- **UI response**: inline error + countdown
- **Message**: *"Too many requests. Try again in {N}s."*
- **Action**: auto retry allowed after cooldown
- **Note**: protects backend stability

---

## UX Audit

**Minor**
- Search triggers may fire too frequently without explicit debounce control.  
  **Why**: can overload API under fast typing (Doherty Threshold violation).  
  **Fix**: enforce 300–500ms debounce at client level.

- Favorites refresh after toggle is not clearly defined as real-time or background sync.  
  **Why**: can cause temporary UI mismatch.  
  **Fix**: optimistic UI + silent revalidation pattern.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec | Used in flow |
| --- | --- | --- | --- | --- |
| 1 | GET | `/preference-cards?visibility=public&searchTerm=…` | [Module 3.1](../modules/preference-card.md#31-listsearch-preference-cards) | Search & Discovery |
| 2 | GET | `/preference-cards/stats` | [Module 3.2](../modules/preference-card.md#32-get-cards-stats) | Initial Load |
| 3 | PUT | `/preference-cards/favorites/cards/:cardId` | [Module 3.8](../modules/preference-card.md#38-favorite-a-card) | Favorite Toggle |
| 4 | DELETE | `/preference-cards/favorites/cards/:cardId` | [Module 3.9](../modules/preference-card.md#39-unfavorite-a-card) | Favorite Toggle |
| 5 | GET | `/users/me/favorites` | [Module 2.8](../modules/user.md#28-list-favorite-cards) | Initial Load |


> Note: stats + favorites are independent modules; failure of one must not block rendering of the other.