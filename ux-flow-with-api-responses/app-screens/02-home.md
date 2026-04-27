# Screen 2: Home (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Auth](./01-auth.md) (Login check), [Profile](./06-profile.md) (User data), [Preference Card Details](./03-preference-card-details.md) (Card details)

## UX Flow

### Home Screen Initial Load
1. Login successful hole ba app open korle user Home screen-e land kore.
2. Screen load-er shathe shathe parallel API calls trigger hoy:
   - Dashboard stats (Public vs Personal card counts) → [GET /preference-cards/stats](../modules/preference-card.md#32-get-cards-stats)
   - User-er curated favorite list → [GET /users/me/favorites](../modules/user.md#28-list-favorite-cards)
3. UI render hoy:
   - Top section-e Search bar thake quick finding-er jonno.
   - Header-e notification bell icon thake (→ [Notifications](./07-notifications.md)).
   - Tar niche Stats section: "Total Available" ebong "My Created" cards-er accurate count dekhay.
   - Bottom-e Floating Quick Action (+) button thake creation flow trigger korar jonno.
   - Shobcheye niche "Favorite Preference Cards" horizontal list akare user-er bookmark kora cards gulo show kore.

### Search & Discovery Flow
1. User top search bar-e keyword type kore (e.g., surgeon name, card title, procedure).
2. Input change hole ba search icon-e tap korle search trigger hoy → [GET /preference-cards?visibility=public&searchTerm=keyword](../modules/preference-card.md#31-listsearch-preference-cards)
3. Matching results list akare niche render hoy. Results na thakle "No cards found" empty state dekhay.

### Quick Actions (Create Card)
1. User bottom-e thaka thaka Floating "+" button-e tap kore.
2. Ekta elegant menu/bottom-sheet pop-up hoy options shoho:
   - **Create Public Card**: Publicly available card toiri korar navigation flow.
   - **Create Private Card**: Sudhu nijer restricted access-er jonno card toiri korar navigation.
3. Kono ekta select korle corresponding creation screen-e navigate kore (Creation flow separate documented).

### Favorite Management
1. User favorite list theke "View All" button-e tap korle full favorite list screen-e navigate kore.
2. List ba details screen theke kono card favorite icon toggle korle:
   - Jodi favorite kora na thake: [PUT /preference-cards/favorites/cards/:cardId](../modules/preference-card.md#38-favorite-a-card)
   - Jodi already favorite thake: [DELETE /preference-cards/favorites/cards/:cardId](../modules/preference-card.md#39-unfavorite-a-card)
3. Success hole backend update message pathay ebong Home screen-er favorite list refresh hoye naya data dekhay.
4. Kono card-e tap korle full view-te navigate kore → [Details](./03-preference-card-details.md).

---

## Edge Cases

- **No Favorites**: Jodi user-er kono favorite card na thake, tahole "No favorite cards yet" placeholder dekhabe.
- **Search Latency**: Search korar somoy loading skeleton ba spinner dekhano dorkar (Rate limited to 60 req/min).
- **Double Tap**: User bishal druto tap korle idempotent endpoints (POST/DELETE) state correct rakhe.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/preference-cards?visibility=public&searchTerm=…` | [Module 3.1](../modules/preference-card.md#31-listsearch-preference-cards) |
| 2 | GET | `/preference-cards/stats` | [Module 3.2](../modules/preference-card.md#32-get-cards-stats) |
| 3 | PUT | `/preference-cards/favorites/cards/:cardId` | [Module 3.8](../modules/preference-card.md#38-favorite-a-card) |
| 4 | DELETE | `/preference-cards/favorites/cards/:cardId` | [Module 3.9](../modules/preference-card.md#39-unfavorite-a-card) |
| 5 | GET | `/users/me/favorites` | [Module 2.8](../modules/user.md#28-list-favorite-cards) |
