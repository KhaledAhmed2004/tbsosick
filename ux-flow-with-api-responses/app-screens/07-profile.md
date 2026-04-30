# Screen 7: Profile (Mobile)

> **Section**: App APIs (User-Facing)
> **Base URL**: `{{baseUrl}}` = see [system-concepts.md](../system-concepts.md#base-url--environment)
> **Response format**: see [Standard Response Envelope](../system-concepts.md#standard-response-envelope)
> **Roles**: see [system-concepts.md → User Roles](../system-concepts.md#user-roles)
> **Related screens**: [Screen 1: Auth](./01-auth.md) — login/session expire/logout flow share kore
> **Doc version**: `v1` — last reviewed `2026-04-30`

---

## Common UI Rules

> Common UI Rules + Status-Code Mapping: see [system-concepts.md → Common UI Rules](../system-concepts.md#common-ui-rules).

---

## UX Flow

### Profile Load & View

1. User bottom navigation theke `Profile` tab-e tap kore.
2. Screen skeleton state render hoy — avatar, text rows, subscription card placeholder.
3. Parallel-vabe calls:

   * [`GET /users/profile`](../modules/user.md#26-get-profile)
   * [`GET /subscriptions/me`](../modules/subscription.md#91-get-my-subscription)
4. Profile info load hole profile picture, name, email, hospital, specialty render hoy.
5. Subscription data load hole separate card update hoy without full-screen reload.
6. Jodi subscription request fail kore but profile success hoy, tahole profile usable thake ebong subscription card retry state dekhay.
7. On `401` → see [Session Expired](#session-expired).

> **Why this design**
> Profile and subscription are independent payloads. Calling them serially adds avoidable wait time. Parallel fetch reaches first-contentful-state faster, which matters most on weak mobile networks.

---

### Profile Edit Flow

1. User `Edit Profile` button-e tap kore.
2. Editable bottom-sheet ba dedicated screen open hoy with pre-filled values.
3. User hospital, specialty, profile picture update kore.
4. Dirty-state detect hoy — unchanged form hole submit disabled thake.
5. User submit kore → calls [`PATCH /users/profile`](../modules/user.md#27-update-profile).
6. Request `multipart/form-data` hishebe send hoy including image file.
7. Submit-er time form locked + inline loading state dekhay.
8. Upload progress indicator dekhano uchit jodi image size noticeable hoy.
9. On `200` → profile cache update hoy + screen instantly refresh hoy.
10. Success toast dekhay: *"Profile updated successfully."*
11. On `422` → invalid field-er niche inline validation show hoy.
12. On failed image upload → see [Profile Photo Upload Failed](#profile-photo-upload-failed).

> **Why this design**
> A dirty-state check stops empty PATCH spam from reaching the backend and avoids accidental double-submits. It also gives the user clear feedback that nothing has changed since they opened the form.

> **Why this design**
> A single multipart request is simpler on mobile. Skipping a separate pre-signed upload step keeps retry and optimistic-refresh logic easy to maintain.

---

### Subscription Read State

1. Profile screen load-er shathe [`GET /subscriptions/me`](../modules/subscription.md#91-get-my-subscription) call hoy.
2. Card-e current plan, interval, renewal status, expiry date show hoy.
3. `FREE` user hole `Upgrade to Premium` ebong `Upgrade to Enterprise` CTA show hoy.
4. Paid user hole `Manage Subscription` CTA show hoy.
5. `Manage Subscription` tap korle native store subscription management deep-link open hoy.
6. Expired subscription hole downgraded state badge show hoy.
7. Renewal pending/cancelled hole warning label show hoy without blocking access immediately.

> **Why this design**
> Payment-related state changes often, driven by webhooks. Forcing a full profile reload every time the subscription card updates causes unnecessary flicker and layout jumps; section-scoped refresh keeps the rest of the screen stable.

---

### Upgrade Flow (IAP)

1. User upgrade CTA-te tap kore.
2. Plan picker bottom-sheet open hoy with monthly/yearly options.
3. User ekta plan + interval select kore.
4. App native IAP SDK trigger kore selected `productId` diye.
5. Native payment sheet open hoy.
6. User payment confirm kore.
7. SDK purchase receipt return kore.
8. App calls [`POST /subscriptions/verify-receipt`](../modules/subscription.md#92-verify-receipt-iap) with `{ platform, productId, receipt }`.
9. Verification pending state-e blocking loader show hoy.
10. Receipt verification success hole backend immediately subscription DB update kore.
11. App instantly [`GET /subscriptions/me`](../modules/subscription.md#91-get-my-subscription) re-fetch kore updated state ney.
12. Updated subscription card render hoy without polling delay.
13. Success toast show hoy: *"Welcome to Premium!"*
14. On receipt verification fail → see [Receipt Verification Failed](#receipt-verification-failed).
15. User cancel payment sheet korle silent dismiss hoy — no error toast.

> **Why this design**
> The backend guarantees immediate consistency after receipt verification. Additional polling would add network load and produce a duplicate loading state for no benefit.

> **Why this design**
> The user intentionally backed out. Treating a deliberate cancel as a failure produces unnecessary anxiety and makes the app feel buggy.

---

### Restore Purchases

1. User `Restore Purchases` option-e tap kore.
2. Native SDK previous purchases fetch kore.
3. App latest receipt diye [`POST /subscriptions/verify-receipt`](../modules/subscription.md#92-verify-receipt-iap) call kore.
4. Existing valid subscription thakle server idempotent response return kore.
5. Backend immediate subscription sync kore.
6. Updated subscription state locally refresh hoy without delayed polling.
7. Restore success hole toast dekhay: *"Purchases restored."*
8. No previous purchase hole empty informational modal dekhay.

---

### Legal Pages

1. User `Terms and Conditions` ba `Privacy Policy` menu-te tap kore.
2. App calls [`GET /legal`](../modules/legal.md#61-list-legal-pages).
3. Legal page list render hoy.
4. User specific page select kore.
5. App calls [`GET /legal/:slug`](../modules/legal.md#62-get-legal-page-by-slug).
6. Full legal content dedicated reader screen-e render hoy.
7. Long content-er jonno sticky title bar + scroll position maintain hoy.
8. Empty legal state hole → see [Legal Content Missing](#legal-content-missing).

---

### Logout Flow

1. User `Logout` button-e tap kore.
2. Confirmation modal open hoy.
3. User confirm kore → calls [`POST /auth/logout`](../modules/auth.md#16-logout).
4. Logout request pending hole modal actions disabled thake.
5. Current device-er access token + refresh token clear hoy.
6. On success → user-ke login screen-e redirect kora hoy.
7. Other logged-in devices unaffected thakbe.
8. Back navigation disabled hoy.
9. On network fail during logout → local session clear korar confirmation prompt dekhano uchit.

> **Why this design**
> If the user has multiple phones / tablets, signing out on one device should not invalidate the others. Otherwise the user gets unexpected forced logouts on devices they never touched.

> **Why this design**
> An Android gesture / back navigation that lands on a protected screen post-logout is a common auth-leak path. Resetting the navigation stack on logout is non-negotiable.

---

## Storage & Session

See [01-auth.md → Storage & Session](./01-auth.md#storage--session) for the canonical token storage table (access token, refresh token, `resetToken`, `deviceId`, FCM `token`) and [01-auth.md → Device & FCM token lifecycle](./01-auth.md#device--fcm-token-lifecycle) for FCM rotation rules.

**Profile-specific additions** (replay-sensitive data not covered by the canonical table):

| Token / data        | Storage                        | Lifetime                        | Cleared when                |
| ------------------- | ------------------------------ | ------------------------------- | --------------------------- |
| Cached IAP receipt  | Secure encrypted local storage | Until verification success      | Successful verify / logout  |

**Never** plain `SharedPreferences` / `UserDefaults` / Hive. **Never** log tokens or receipts.

> **Why this design**
> Purchase receipts are replay-sensitive. If they leak from plain local storage, an attacker can attempt fake restores against the verification endpoint.

---

## Validation Rules

| Field            | Rule                                                         | Inline error                   |
| ---------------- | ------------------------------------------------------------ | ------------------------------ |
| `hospital`       | Required, trimmed, max length backend-defined                | *"Enter your hospital name."*  |
| `specialty`      | Required, trimmed                                            | *"Enter your specialty."*      |
| `profilePicture` | Image only (`image/jpeg`, `image/png`, confirm WebP support) | *"Upload a valid image file."* |

---

## Edge Cases

### Session Expired

* **Trigger**: `401` from profile/subscription endpoints
* **UI response**: blocking modal + redirect
* **Message**: *"Your session has expired. Please log in again."*
* **Action**: redirect to Login screen
* **Note**: redirect-er age local sensitive cache clear korte hobe

---

### Receipt Verification Failed

* **Trigger**: `POST /subscriptions/verify-receipt` fail / timeout
* **UI response**: inline error inside subscription card
* **Message**: *"We couldn't verify your purchase right now."*
* **Action**: `Retry` CTA + background retry allowed
* **Note**: duplicate charge panic avoid korte clear copy dorkar je payment already complete hoite pare

---

### Profile Photo Upload Failed

* **Trigger**: upload interrupted / unsupported image
* **UI response**: inline image picker error
* **Message**: *"Photo upload failed. Try another image."*
* **Action**: reselect image
* **Note**: previous profile picture untouched thakbe

---

### Legal Content Missing

* **Trigger**: [`GET /legal`](../modules/legal.md#61-list-legal-pages) returns empty list or `404`
* **UI response**: empty-state illustration + retry CTA
* **Message**: *"No legal documents available right now."*
* **Action**: retry fetch
* **Note**: empty screen without explanation trust damage kore

---

## UX Audit

**Minor** — worth fixing this sprint:

* Subscription card-e monthly/yearly pricing ek sathe dense text-e deya hole scan difficult hoy. **Why**: Hick’s Law — beshi compact choices decision slow kore. **Fix**: yearly plan-e “Save X%” badge add kore visual hierarchy clear koro.

* Profile screen-e legal links, restore purchase, logout ek sathe plain list hole destructive action miss-tap risk ache. **Why**: Fitts’s Law — dense tap targets accidental press baray. **Fix**: Logout-ke isolated danger section-e move koro with spacing.

* Profile skeleton jodi full-page shimmer hoy, user subscription-only refresh-er time unnecessary flashing dekhe. **Why**: perceived instability. **Fix**: section-level skeleton use koro, full-page loader na.

---

## Endpoints Used

| # | Method | Endpoint                        | Module Spec                                                     | Used in flow                   |
| - | ------ | ------------------------------- | --------------------------------------------------------------- | ------------------------------ |
| 1 | GET    | `/users/profile`                | [Module 2.6](../modules/user.md#26-get-profile)                 | Profile Load & View step 3     |
| 2 | PATCH  | `/users/profile`                | [Module 2.7](../modules/user.md#27-update-profile)              | Profile Edit Flow step 5       |
| 3 | GET    | `/subscriptions/me`             | [Module 9.1](../modules/subscription.md#91-get-my-subscription) | Subscription Read State step 1 |
| 4 | POST   | `/subscriptions/verify-receipt` | [Module 9.2](../modules/subscription.md#92-verify-receipt-iap)  | Upgrade Flow step 8            |
| 5 | POST   | `/subscriptions/verify-receipt` | [Module 9.2](../modules/subscription.md#92-verify-receipt-iap)  | Restore Purchases step 3       |
| 6 | GET    | `/legal`                        | [Module 6.1](../modules/legal.md#61-list-legal-pages)           | Legal Pages step 2             |
| 7 | GET    | `/legal/:slug`                  | [Module 6.2](../modules/legal.md#62-get-legal-page-by-slug)     | Legal Pages step 5             |
| 8 | POST   | `/auth/logout`                  | [Module 1.6](../modules/auth.md#16-logout)                      | Logout Flow step 3             |

> Note: Subscription renewal/cancel synchronization webhook-driven. Client directly webhook consume kore na — latest state always `GET /subscriptions/me` diye fetch korte hobe.
