# Screen 4: Preference Card Management

> **Section**: Dashboard APIs (Admin-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Overview](./02-overview.md) (Card metrics)

## UX Flow

### Card Moderation & Management Flow

1. Admin sidebar theke "Preference Card Management" module e click kore.
2. Page load e shob public preference card fetch hoy → [GET /preference-cards?visibility=public](../modules/preference-card.md#31-listsearch-preference-cards)
3. Admin search bar use kore card title ba surgeon name search kore → [GET /preference-cards?searchTerm=Cardiology](../modules/preference-card.md#31-listsearch-preference-cards)
4. Admin filters use kore verified ba unverified card dekhte pare.
5. Card table render hoy: Card Title, Surgeon Name, Specialty, Verification Status, Creation Date dekhay.
6. Admin kono card review kore verification status change korte pare (Approve hole status "VERIFIED" hoy, Reject hole "UNVERIFIED") → [PATCH /preference-cards/:cardId](../modules/preference-card.md#311-update-verification-status-approvereject--admin) body `{ "verificationStatus": "VERIFIED" | "UNVERIFIED" }`
7. Admin chaile kono card favorite list e add korte pare → [PUT /preference-cards/favorites/cards/:cardId](../modules/preference-card.md#38-favorite-a-card)
8. Admin chaile favorite list theke remove korte pare → [DELETE /preference-cards/favorites/cards/:cardId](../modules/preference-card.md#39-unfavorite-a-card)
9. Status update hole system notification trigger hoy ebong front-end list sync hoy.
10. Card delete korar proyojon hole delete action click kore → [DELETE /preference-cards/:cardId](../modules/preference-card.md#37-delete-preference-card)

---

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Approve Draft** | Draft card (published: false) approve korte chaile inline error banner dekhabe ("Cannot approve a draft — required fields missing"); list row state unchanged thakbe. |
| **Invalid Card ID** | PATCH/DELETE target card not found hole "Card not found" toast + list refresh. |
| **Unauthorized Access** | USER role accidentally moderation page hit korle dashboard route guard sidebar e back navigate korabe. |
| **Already Favorited** | Card already favorite thaka obosthay favorite icon tap idempotently silent success — UI unchanged. |
| **Not Favorited** | Card already unfavorited thakle remove tap idempotently silent — UI unchanged. |

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/preference-cards?visibility=public&…` | [Module 3.1](../modules/preference-card.md#31-listsearch-preference-cards) |
| 2 | PATCH | `/preference-cards/:cardId` (`{ verificationStatus }` body) | [Module 3.11](../modules/preference-card.md#311-update-verification-status-approvereject--admin) |
| 3 | DELETE | `/preference-cards/:cardId` | [Module 3.7](../modules/preference-card.md#37-delete-preference-card) |
| 4 | PUT | `/preference-cards/favorites/cards/:cardId` | [Module 3.8](../modules/preference-card.md#38-favorite-a-card) |
| 5 | DELETE | `/preference-cards/favorites/cards/:cardId` | [Module 3.9](../modules/preference-card.md#39-unfavorite-a-card) |
