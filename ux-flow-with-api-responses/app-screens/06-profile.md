# Screen 6: Profile (Mobile)

> **Section**: App APIs (Student-Facing)
> **Base URL**: `{{baseUrl}}` = `http://localhost:5000/api/v1`
> **Response format**: See [Standard Response Envelope](../README.md#standard-response-envelope)
> **Related screens**: [Auth](./01-auth.md) (Login/Logout flow)

---

## UX Flow

### Profile Load & View
1. User app-er bottom navigation theke "Profile" tab-e click kore.
2. Page load-e parallel API calls chole:
   - User basic info → [GET /users/profile](../modules/user.md#26-get-profile)
   - Subscription status → [GET /subscriptions/me](../modules/subscription.md#91-get-my-subscription)
3. Profile screen render hoy: Profile picture, Name, Email, Hospital, Specialty, ebong current Subscription Plan dekhay.

### Profile Edit Flow
1. User "Edit Profile" button-e click kore.
2. Form-e field gulo pre-filled thake. User info change kore (e.g., Hospital, Specialty, Profile Picture).
3. Submit → [PATCH /users/profile](../modules/user.md#27-update-profile)
4. Success hole updated fields show kore ebong profile re-render hoy.

### Subscription Management

**Read flow**:
1. Profile load-er shathe [GET /subscriptions/me](../modules/subscription.md#91-get-my-subscription) parallel-vabe call hoy.
2. "My Subscription" card-e current plan (`FREE` / `PREMIUM` / `ENTERPRISE`), `interval`, `expiresAt`, `autoRenew` dekhay.
3. Free user-er jonno **"Upgrade to Premium"** ebong **"Upgrade to Enterprise"** CTA dekhay.
4. Paid user-er jonno **"Manage Subscription"** button native store deep-link kholay (App Store / Play Store).

**Upgrade flow (IAP)**:
1. User "Upgrade" CTA tap kore → plan picker bottom-sheet open hoy:
   - **Premium** ($5.99/mo · $59.99/yr) — 20 cards, Library, Basic Calendar.
   - **Enterprise** ($9.99/mo · $99.99/yr) — Unlimited cards, Advanced Calendar, Verification eligibility.
2. User plan + interval (monthly / yearly) select kore.
3. App native IAP SDK trigger kore corresponding `productId` shoho:
   - iOS: `com.tbsosick.premium.monthly`, `com.tbsosick.premium.yearly`, `com.tbsosick.enterprise.monthly`, `com.tbsosick.enterprise.yearly`
   - Android: same IDs (Play Billing).
4. Store payment sheet open hoy → user payment confirm kore.
5. SDK theke purchase receipt (base64-encoded) pawa jay.
6. App receipt server-e pathay → [POST /subscriptions/verify-receipt](../modules/subscription.md#92-verify-receipt-iap) body shoho `{ platform, productId, receipt }`.
7. Server Apple / Google verify kore subscription upsert kore + updated plan return kore.
8. Success → app [GET /subscriptions/me](../modules/subscription.md#91-get-my-subscription) re-fetch kore → "My Subscription" card naya plan dekhay → success toast ("Welcome to Premium!").
9. Failure → user-ke current plan-e rakhe, error toast dekhay + "Retry" CTA. Client local-e receipt cache kore retry korte pare.

**Restore purchases** (existing user, new device):
1. Settings → "Restore Purchases" tap kore.
2. Native SDK previously-bought transactions return kore.
3. App receipt fresh [POST /subscriptions/verify-receipt](../modules/subscription.md#92-verify-receipt-iap) call kore.
4. Server idempotent vabe verify kore — already-active subscription thakle existing record return kore.

**Auto-renewal**:
- Renewal / cancel events App Store / Play Store theke server webhook-e ashe (no client action). Server `expiresAt` ebong `plan` update kore. App next time `GET /subscriptions/me` call korle latest state pay.

### Legal Pages (Terms & Conditions)
1. User profile menu theke "Terms and Conditions" ba "Privacy Policy"-te click kore.
2. Initial load-e sob legal page-er list fetch hoy → [GET /legal](../modules/legal.md#61-list-legal-pages)
3. List theke specific page (e.g., `terms-and-conditions`) select korle slug diye content fetch kore → [GET /legal/:slug](../modules/legal.md#62-get-legal-page-by-slug)
4. Full content render hoy screen-e.

### Logout Flow
1. User profile-er niche thaka "Logout" button-e tap kore.
2. Confirm modal ashe. Confirm korle → [POST /auth/logout](../modules/auth.md#16-logout)
3. Local state clear hoy ebong user-ke Login screen-e pathiye deya hoy.

---

## Edge Cases

- **Unauthorized Access**: User token expire hoye gele system user-ke login screen-e redirect korbe.
- **Empty Legal Pages**: Jodi kono legal page na thake, list endpoint empty array return korbe; client empty state dekhabe.
- **In-App Purchase Sync**: IAP receipt verify korte fail hole subscription status update hobe na; client-side retry logic implement kora uchit.

---

## Endpoints Used

| # | Method | Endpoint | Module Spec |
|---|---|---|---|
| 1 | GET | `/users/profile` | [Module 2.6](../modules/user.md#26-get-profile) |
| 2 | PATCH | `/users/profile` | [Module 2.7](../modules/user.md#27-update-profile) |
| 3 | POST | `/auth/logout` | [Module 1.6](../modules/auth.md#16-logout) |
| 4 | GET | `/subscriptions/me` | [Module 9.1](../modules/subscription.md#91-get-my-subscription) |
| 5 | POST | `/subscriptions/verify-receipt` | [Module 9.2](../modules/subscription.md#92-verify-receipt-iap) |
| 6 | GET | `/legal` | [Module 6.1](../modules/legal.md#61-list-legal-pages) |
| 7 | GET | `/legal/:slug` | [Module 6.2](../modules/legal.md#62-get-legal-page-by-slug) |
