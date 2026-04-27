# Screen 4: Library

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Home](./02-home.md) (Quick access), [Preference Card Details](./03-preference-card-details.md) (Navigation from list)

## UX Flow

### Library Initial Load
1. User "Library" icon tap kore.
2. Screen immediately skeleton UI dekhay (3–4 card placeholder).
3. [GET /preference-cards?visibility=public](../modules/preference-card.md#31-listsearch-preference-cards) API call hoy.
   - Success → skeleton replace hoy real cards diye.
   - Error → "Couldn't load cards. Check your connection." + Retry button.
4. Screen render:
   - Sticky top-e Search bar (placeholder: "Search cards, surgeons, medications...").
   - Search bar-er niche Filter button (active filter thakle badge: "Filter (2)") + Sort dropdown.
   - Tab switcher: Preference Cards | Private Cards (count badge).
   - Card list.

### Search
1. User search bar-e type kore.
2. 350ms debounce → API call with `searchTerm`.
3. Type korar somoy skeleton dekhay.
4. Result ashle replace. Empty hole "No cards found" illustration.
5. Search clear korle original list restore hoy.

### Filtering
1. User Filter button tap kore → Bottom sheet opens.
2. Bottom sheet open hobar shathe shathe (ba aagei load kora) [GET /preference-cards/specialties](../modules/preference-card.md#33-fetch-distinct-specialties) API call trigger hoy dynamic options load korar jonno.
3. Bottom sheet-e:
   - Specialty picker (single select dynamic list).
   - Verified Only toggle.
   - Cancel (discard) | Apply (trigger API) buttons.
4. Apply tap → Bottom sheet close → skeleton → results.
5. Filter icon-e active count badge dekhay.
6. Active filter pill(s) search bar-er niche dekhate paro (swipeable, X tap kore individual filter remove).

### Tab Switching
1. Public → Private tap korle:
   - Public tab-er filter+search state PRESERVE hoy.
   - Private tab-er last state restore hoy (fresh load first time).
   - Skeleton dekhay → [GET /preference-cards?visibility=private](../modules/preference-card.md#31-listsearch-preference-cards).
   - Empty hole (no cards yet): "You haven't created any cards yet" + "Create Card" CTA.
   - Empty search result: "No matching private cards".
2. Private → Public: Public-er preserved state restore hoy.

### Card Actions (List View)
1. User kono card-er favorite icon toggle korle:
   - Jodi favorite kora na thake: [PUT /preference-cards/favorites/cards/:cardId](../modules/preference-card.md#38-favorite-a-card)
   - Jodi already favorite thake: [DELETE /preference-cards/favorites/cards/:cardId](../modules/preference-card.md#39-unfavorite-a-card)
2. User card theke download icon tap korle:
   - Backend-e count update hoy: [POST /preference-cards/:cardId/download](../modules/preference-card.md#310-increment-download-count).
   - Local device-e card PDF/image save hoy.

### Error States (all tabs)
- Network failure: "Couldn't load cards. Check your connection." + Retry.
- Server error: "Something went wrong. Please try again." + Retry.
- Timeout (>10s): Same as network error.

## Edge Cases

- **No Cards Found**: Search ba filter query-r shathe kisu match na korle empty list illustration ("No cards match your filter") dekhabe.
- **Empty Library (Private tab)**: User-er jodi kono nijer card na thake, tab switch korle "You haven't created any cards yet" + "Create Card" CTA dekhabe.
- **Session Expired**: Access token invalid ba expire hole standardized 401 problem details response asbe; client logout flow trigger korbe.
- **BOLA Protection**: User onno karow private card access korar cheshta korle Forbidden state dekhabe.
- **Validation Error**: Input query-te error thakle (e.g., `limit > 50`, `page` negative, field length `> 100`) Zod validation message path shoho dekhabe.
- **Rate Limit**: Search-e 1 minute-e 60 bar-er beshi request hole rate limit trigger hobe; UI throttling/backoff message dekhabe.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/preference-cards?visibility=public&searchTerm=…` | [Module 3.1](../modules/preference-card.md#31-listsearch-preference-cards) |
| 2 | GET | `/preference-cards?visibility=private&searchTerm=…` | [Module 3.1](../modules/preference-card.md#31-listsearch-preference-cards) |
| 3 | GET | `/preference-cards/specialties` | [Module 3.3](../modules/preference-card.md#33-fetch-distinct-specialties) |
| 4 | GET | `/preference-cards/:cardId` | [Module 3.5](../modules/preference-card.md#35-get-card-details) |
| 5 | PUT | `/preference-cards/favorites/cards/:cardId` | [Module 3.8](../modules/preference-card.md#38-favorite-a-card) |
| 6 | DELETE | `/preference-cards/favorites/cards/:cardId` | [Module 3.9](../modules/preference-card.md#39-unfavorite-a-card) |
| 7 | POST | `/preference-cards/:cardId/download` | [Module 3.10](../modules/preference-card.md#310-increment-download-count) |
