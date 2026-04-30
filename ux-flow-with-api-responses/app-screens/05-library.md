# Screen 5: Library (Mobile)

> **Section**: App APIs (User-Facing)
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) (quick access), [Preference Card Details](./03-preference-card-details.md) (navigation from list)
> **Doc version**: `v2` — last reviewed `2026-04-30`

---

## Common UI Rules

See [system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules) for the canonical list (submit protection, offline pre-flight, 5xx toast, 422 field-level inline, 429 `Retry-After` countdown, 401 redirect / auto-refresh).

---

## Scope

Library is a global search surface over **public preference cards only**. It is the discovery experience for paid users — a single search bar with filters, no tabs. Private cards are managed from [Home → My Cards](./02-home.md), not here.

---

## UX Flow

### Library Initial Load

1. User taps the **Library** icon in the bottom navigation bar.
2. Screen mounts and immediately shows a skeleton (3–4 card placeholders).
3. [`GET /preference-cards?visibility=public`](../modules/preference-card.md#31-listsearch-preference-cards) call fires.
   - Success → skeleton replaced with the card list.
   - Error → *"Couldn't load cards. Check your connection."* + Retry button.
4. Screen render:
   - Sticky search bar at the top (placeholder: *"Search cards, surgeons, medications..."*).
   - Filter button (with active-filter badge: *"Filter (2)"*) and Sort dropdown sit immediately below the search bar.
   - Card list fills the body.

---

### Search

1. User types into the search bar.
2. After a **350ms debounce** the call fires: [`GET /preference-cards?visibility=public&searchTerm=…&page=1`](../modules/preference-card.md#31-listsearch-preference-cards).
3. While typing or fetching, a skeleton overlay covers the results.
4. Empty array → *"No cards found"* illustration.
5. Clearing the search bar reloads the default `visibility=public` list.

> **Why this design**
> Industry standard: when the search term changes, pagination resets to page 1. Otherwise the user lands in the middle of a fresh result set, which is confusing UX.

---

### Filtering

1. User taps the Filter button → bottom sheet opens.
2. On open (or pre-loaded earlier), [`GET /preference-cards/specialties`](../modules/preference-card.md#33-fetch-distinct-specialties) fires to load the specialty options dynamically.
3. Bottom sheet contains:
   - Specialty picker (single-select from the dynamic list).
   - **Verified Only** toggle — when enabled, only `verificationStatus=VERIFIED` cards are shown.
   - Cancel (discard) and Apply (trigger fetch) buttons.
4. Apply tap → bottom sheet closes → skeleton → results.
5. The Filter icon shows an active-count badge.
6. Active filter pills can render under the search bar (swipeable; tap the X to remove an individual filter).

> **Why this design**
> Hardcoded specialty lists raise maintenance cost. Fetching dynamically from the backend means new specialties show up in the UI as soon as cards using them are published, with no client deploy required.

---

### Card Actions (List View)

1. Tap the favorite icon on a card row:
   - Not favorited → [`PUT /preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#38-favorite-a-card).
   - Already favorited → [`DELETE /preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#39-unfavorite-a-card).
2. Tap the download icon on a card row:
   - Backend counter increments via [`POST /preference-cards/:cardId/download`](../modules/preference-card.md#310-increment-download-count).
   - Client renders the PDF locally and saves it to device storage.

---

### Error States

- **Network failure**: *"Couldn't load cards. Check your connection."* + Retry.
- **Server error**: *"Something went wrong. Please try again."* + Retry.
- **Timeout (>10s)**: same as network error.

---

## Edge Cases

- **No Cards Found**: Search or filter query returning an empty list shows the *"No cards match your filter"* illustration.
- **Session Expired**: Access token invalid or expired → standardized `401` problem-details response → client logout flow triggers.
- **BOLA Protection**: Trying to access another user's private card via direct ID surfaces a `403` Forbidden state. (Library never lists private cards, so this only fires on direct deep-links.)
- **Validation Error**: Invalid query params (e.g., `limit > 50`, negative `page`, field length `> 100`) return a Zod validation message with the field path.
- **Rate Limit**: More than 60 search requests per minute trigger `429`; UI shows the throttling / backoff countdown.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec | Used in flow |
|---|---|---|---|---|
| 1 | GET | `/preference-cards?visibility=public&searchTerm=…` | [Module 3.1](../modules/preference-card.md#31-listsearch-preference-cards) | Library Initial Load + Search |
| 2 | GET | `/preference-cards/specialties` | [Module 3.3](../modules/preference-card.md#33-fetch-distinct-specialties) | Filtering step 2 |
| 3 | GET | `/preference-cards/:cardId` | [Module 3.5](../modules/preference-card.md#35-get-card-details) | Card detail navigation (deep-link to `03-preference-card-details.md`) |
| 4 | PUT | `/preference-cards/favorites/cards/:cardId` | [Module 3.8](../modules/preference-card.md#38-favorite-a-card) | Card Actions — favorite |
| 5 | DELETE | `/preference-cards/favorites/cards/:cardId` | [Module 3.9](../modules/preference-card.md#39-unfavorite-a-card) | Card Actions — unfavorite |
| 6 | POST | `/preference-cards/:cardId/download` | [Module 3.10](../modules/preference-card.md#310-increment-download-count) | Card Actions — download |
