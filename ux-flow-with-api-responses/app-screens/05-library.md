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
User search bar-e text type kore.
350ms debounce pore calls GET /preference-cards with searchTerm and page=1.
Typing phase-e skeleton overlay dekhay.
On 404 or empty array → "No cards found" illustration dekhay.
Search clear korle initial visibility=public list reload hoy.
Banglish — WHY reset page on search? Industry standard holo search term change hole pagination logic zero theke start kora, nahole user result-er majhkhane land korbe (confusing UX).

> **Banglish — WHY reset page on search?** Industry standard holo search term change hole pagination logic zero theke start kora, nahole user result-er majhkhane land korbe (confusing UX).

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
here also is verifed filter o ase tokhon only verifd card e show kora hobe

> **Banglish — WHY dynamic specialty fetch?** Hardcoded specialties maintenance cost barhay. Backend theke dynamic fetch korle new specialty add hole code change charai UI update hoye jay.

### Tab Switching
1. User "Private Cards" tab select kore.
2. Current Public list-er scroll position ebong search state memory-te preserve kora hoy.
3. Calls [GET /preference-cards](../modules/preference-card.md#31-listsearch-preference-cards) with `visibility=private`.
4. If result empty → "You haven't created any cards yet" + "Create Card" CTA.
5. User Public tab-e fire ashle preserved state restore hoy without refetch.

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