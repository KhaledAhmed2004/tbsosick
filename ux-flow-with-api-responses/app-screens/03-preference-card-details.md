# Screen 3: Preference Card Details (Mobile)

> **Section**: App APIs (User-Facing)
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Home](./02-home.md) — favorite list / search results theke card-e navigate kora hoy; [Create Preference Card](./04-create-preference-card.md) — card creation flow; [Supplies Management](../dashboard-screens/06-supplies-management.md) — catalog source for supply dropdown; [Sutures Management](../dashboard-screens/07-sutures-management.md) — catalog source for suture dropdown
> **Doc version**: `v1` — last reviewed `2026-04-30`

---

## Common UI Rules

> Common UI Rules + Status-Code Mapping: see [system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules).

---

## UX Flow

### View Card Details

1. User Home screen-er favorite list ba search results theke kono card-e tap kore.
2. Screen mount hoy → [`GET /preference-cards/:cardId`](../modules/preference-card.md#35-get-card-details) call hoy.
3. Loading state-e skeleton UI show hoy (title, surgeon block, section placeholders).
4. On `200` → card render hoy:
   - **Header**: card title, Published/Draft status badge (owner-only), favorite icon (filled/outline based on current state), Share icon, Download button, Edit icon (owner / `SUPER_ADMIN` hole), Delete button (owner / `SUPER_ADMIN` hole).
   - **Surgeon Info**: fullName, specialty, handPreference, contactNumber, musicPreference.
   - **Clinical Sections**: Medication, Supplies (name + quantity list), Sutures (name + quantity list), Instruments, Positioning Equipment, Prepping, Workflow.
   - **Key Notes** (free-text block).
   - **Photo Library** (horizontally scrollable image strip; jodi kono photo na thake → *"No photos added."* placeholder show hoy).
5. On `403` → see [Private Card Access](#private-card-access).
6. On `404` → see [Card Not Found](#card-not-found).

> **Why this design**
> A card has multiple distinct sections (surgeon info, supplies, sutures, photos). A skeleton previews where each section will land, which removes layout shift on render. A spinner instead leaves the screen blank, which inflates perceived load time and breaks the Doherty Threshold (400 ms rule).

---

### Favorite Toggle

1. User header-er favorite icon-e tap kore.
2. **Optimistic update**: icon immediately filled/outline toggle hoy; icon `pointerEvents: none` set hoy (in-flight-e double-tap block).
3. Jodi currently un-favorited → [`PUT /preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#38-favorite-a-card) call hoy.
4. Jodi currently favorited → [`DELETE /preference-cards/favorites/cards/:cardId`](../modules/preference-card.md#39-unfavorite-a-card) call hoy.
5. On `200` → optimistic state confirmed; `pointerEvents` restored.
6. On any error → optimistic update rollback hoy (icon previous state-e fire jay); `pointerEvents` restored; toast: *"Could not update favorite. Try again."*

> **Why this design**
> Favoriting is a low-stakes action — the user expects instant feedback on tap. Waiting for the round-trip makes the icon feel laggy and broken. Locking the icon while in-flight prevents a race: a rapid double-tap could otherwise queue PUT + DELETE simultaneously and leave server state inconsistent.

---

### Share

1. User Share icon-e tap kore.
2. Native OS share sheet open hoy with `{ message: cardTitle + " — " + deepLink }`.
3. Ei action purely frontend — kono API call nai.

---

### Download

1. User Download button-e tap kore.
2. Offline check: offline thakle → see [Download Offline](#download-offline).
3. Button disabled + spinner shown.
4. [`POST /preference-cards/:cardId/download`](../modules/preference-card.md#310-increment-download-count) call hoy (download count increment; fire-and-forget — response body used nai).
5. Client-side PDF generation shuru hoy (e.g. `react-native-html-to-pdf`): card data already in-memory from step 2 of View Card Details — no second API call needed.
6. PDF generated file device-er local storage-e save hoy.
7. On success → toast: *"Card saved successfully."*; button re-enabled.
8. On PDF generation failure → toast: *"Download failed. Please try again."*; button re-enabled.
9. On `POST /download` error → silently log (count increment non-critical); PDF save still attempted.

> **Why this design**
> The download count is an analytics metric, not part of the user-facing experience. Blocking the user when the counter call fails is the wrong trade-off: they already got the PDF, mission accomplished. Log the error, but don't surface it.

---

## Edge Cases

### Private Card Access

- **Trigger**: `GET /preference-cards/:cardId` returns `403` — card is private and requesting user is not the owner.
- **UI response**: Full-screen error state.
- **Message**: *"This card is private and can't be viewed."*
- **Action**: Back button → previous screen.

---

### Card Not Found

- **Trigger**: `GET /preference-cards/:cardId` returns `404` — card deleted or invalid ID.
- **UI response**: Full-screen error state.
- **Message**: *"This card doesn't exist or has been removed."*
- **Action**: Back button → Home screen.

---

### Download Offline

- **Trigger**: User taps Download while `navigator.onLine === false`.
- **UI response**: Inline error below Download button.
- **Message**: *"You're offline. Connect to the internet and try again."*

---

## Endpoints Used

| # | Method | Endpoint | Module Spec | Used in flow |
|---|---|---|---|---|
| 1 | `GET` | `/preference-cards/:cardId` | [Module 3.5](../modules/preference-card.md#35-get-card-details) | View Card Details, step 2 |
| 2 | `PUT` | `/preference-cards/favorites/cards/:cardId` | [Module 3.8](../modules/preference-card.md#38-favorite-a-card) | Favorite Toggle, step 3 |
| 3 | `DELETE` | `/preference-cards/favorites/cards/:cardId` | [Module 3.9](../modules/preference-card.md#39-unfavorite-a-card) | Favorite Toggle, step 4 |
| 4 | `POST` | `/preference-cards/:cardId/download` | [Module 3.10](../modules/preference-card.md#310-increment-download-count) | Download, step 4 |

> Note: Clinical data (supplies, sutures) is returned in the `GET /preference-cards/:cardId` response.