# 📘 RESTful API Design Audit Report

## 🧩 Module-wise Audit Report

### 📦 Module: Admin (Dashboard)
- **What it does:** Provides statistics and metrics for the super admin to monitor the platform.
- **Aims to do:** Show growth trends for preference cards, active subscriptions, and general dashboard stats.
- **Base Path:** `/api/v1/dashboard`

| Method | Route | Status |
| :--- | :--- | :--- |
| GET | `/statistics` | ✅ Well-designed |
| GET | `/preference-cards/monthly` | ✅ Well-designed |
| GET | `/subscriptions/active/monthly` | ✅ Well-designed |

#### ❌ Issues Found
- **🔴 Issue 1: Vague endpoint name**
  - **Route:** `/stats` (Previously)
  - **Problem (Banglish):** `/stats` word ta khub e generic. Ekta dashboard e onek dhoroner stats thakte pare. Route er naam dekhe e bujha uchit eta ki resource represent korche.
  - **Correct Design:** `/dashboard/statistics` or `/growth-metrics`.

---

### 📦 Module: User
- **What it does:** Manages user profiles, roles, and administrative user control (blocking, deleting).
- **Aims to do:** Allow users to update their profiles and admins to manage the user base.
- **Base Path:** `/api/v1/users`

| Method | Route | Status |
| :--- | :--- | :--- |
| POST | `/` | ✅ Well-designed |
| GET | `/profile` | ✅ Well-designed (Sub-resource) |
| PATCH | `/profile` | ✅ Well-designed (Sub-resource) |
| GET | `/roles` | ✅ Well-designed |
| GET | `/:id` | ✅ Well-designed |
| PATCH | `/:id` | ✅ Well-designed |
| DELETE | `/:id` | ✅ Well-designed |

#### ❌ Issues Found
- **🔴 Issue 1: Singular resource name**
  - **Route:** `/api/v1/user` (Previously)
  - **Problem (Banglish):** RESTful API te resource er naam shob shomoy plural (bohubochon) houya uchit. `/user` mane ekta user, kintu amra puru user collection niye kaaj korchi, tai `/users` e thik path.
  - **Correct Design:** `/api/v1/users`

- **🔴 Issue 2: Verb-based routes**
  - **Route:** `/:id/status`, `/:id/block`, `/:id/unblock` (Previously)
  - **Problem (Banglish):** URL er moddhe "block", "unblock" er moto verb (kajer naam) thaka REST standard er baire. Amra resource er state update korchi, tai `PATCH` method use kore body te `{ "status": "RESTRICTED" }` pathano better.
  - **Correct Design:** Use `PATCH /users/:id`.

---

### 📦 Module: Auth
- **What it does:** Handles authentication, password resets, and email verification.
- **Aims to do:** Securely log in users and manage account security.
- **Base Path:** `/api/v1/auth`

| Method | Route | Status |
| :--- | :--- | :--- |
| POST | `/login` | ✅ Standard |
| POST | `/logout` | ✅ Standard |
| POST | `/passwords/forget` | ✅ Well-designed |
| POST | `/emails/verify` | ✅ Well-designed |
| POST | `/passwords/reset` | ✅ Well-designed |
| POST | `/passwords/change` | ✅ Well-designed |
| POST | `/verification-emails` | ✅ Well-designed |
| POST | `/refresh-token` | ✅ Standard |

#### ❌ Issues Found
- **🔴 Issue 1: Action-based naming**
  - **Route:** `/resend-verify-email` (Previously)
  - **Problem (Banglish):** Endpoints gulo resource-based houya uchit, action-based na. `resend-verify-email` ekta action. Amra jodi `verification-emails` resource create kori (`POST`), tobe eta aro standard hoy.
  - **Correct Design:** `POST /auth/verification-emails`.

---

### 📦 Module: Preference Card
- **What it does:** Manages surgical preference cards, including favorites and downloads.
- **Aims to do:** Create, update, and browse cards with public/private visibility.
- **Base Path:** `/api/v1/preference-cards`

| Method | Route | Status |
| :--- | :--- | :--- |
| GET | `/view/public` | ✅ Well-designed |
| GET | `/view/private` | ✅ Well-designed |
| GET | `/view/favorites` | ✅ Well-designed |
| GET | `/metadata/count` | ✅ Well-designed |
| POST | `/:id/downloads` | ✅ Well-designed |
| POST | `/:id/favorites` | ✅ Well-designed |
| DELETE | `/:id/favorites` | ✅ Well-designed |

#### ❌ Issues Found
- **🔴 Issue 1: Singular resource name**
  - **Route:** `/api/v1/preference-card` (Previously)
  - **Problem (Banglish):** `/user` er motoi, `/preference-card` singular houya thik na. Resource plural thaka REST design er prothom niyom.
  - **Correct Design:** `/api/v1/preference-cards`.

- **🔴 Issue 2: Verb-based routes**
  - **Route:** `/:id/download`, `/:id/favorite` (Previously)
  - **Problem (Banglish):** Verb gulo URL theke shoriye resource banate hobe. Jemon `favorite` er poriborte `favorites`. `POST` mane favorite kora, `DELETE` mane favorite bad deya.
  - **Correct Design:** `POST /preference-cards/:id/favorites`.

---

### 📦 Module: Subscription
- **What it does:** Manages user subscriptions and IAP (In-App Purchase) verification.
- **Aims to do:** Allow users to check their current plan and verify mobile purchases.
- **Base Path:** `/api/v1/subscriptions`

| Method | Route | Status |
| :--- | :--- | :--- |
| GET | `/me` | ✅ Standard |
| POST | `/iap/verify` | ⚠️ Action-based |
| POST | `/choose/free` | 🔴 Issue (Verb) |

#### ❌ Issues Found
- **🔴 Issue 1: Verb-based naming**
  - **Route:** `/choose/free`
  - **Problem (Banglish):** `choose` ekta verb. Amra ashole plan change korchi. Better hoy jodi amra `plans` ba `subscriptions` resource update kori.
  - **Correct Design:** `POST /subscriptions/plans/free` or similar.

---

### 📦 Module: Notification
- **What it does:** Handles system notifications for users and admins.
- **Aims to do:** List notifications and mark them as read.
- **Base Path:** `/api/v1/notifications`

| Method | Route | Status |
| :--- | :--- | :--- |
| GET | `/` | ✅ Well-designed |
| PATCH | `/:id/read` | 🔴 Issue (Verb) |
| PATCH | `/read-all` | 🔴 Issue (Verb) |

#### ❌ Issues Found
- **🔴 Issue 1: Verb-based naming**
  - **Route:** `/:id/read`
  - **Problem (Banglish):** URL er moddhe `read` ekta verb. Read kora mane `isRead` property ta update kora. `PATCH /notifications/:id` use kore body te status pathano better.
  - **Correct Design:** `PATCH /notifications/:id` with `{ "read": true }`.

---

### 📦 Module: Payment
- **What it does:** Integrates Stripe for payments and onboarding.
- **Aims to do:** Handle webhooks, onboarding taskers, and payment history.
- **Base Path:** `/api/v1/payments`

| Method | Route | Status |
| :--- | :--- | :--- |
| POST | `/webhook` | ✅ Standard |
| POST | `/stripe/account` | ⚠️ Nested |
| GET | `/stripe/onboarding` | 🔴 Issue (Verb) |
| POST | `/refund/:paymentId` | 🔴 Issue (Verb) |

#### ❌ Issues Found
- **🔴 Issue 1: Action-based naming**
  - **Route:** `/refund/:paymentId`
  - **Problem (Banglish):** `refund` ekta verb. REST design e refund kora mane ekta `refunds` resource create kora.
  - **Correct Design:** `POST /payments/:id/refunds`.

---

### 📦 Module: Event
- **What it does:** Manages surgical events or schedules.
- **Aims to do:** Create, list, update, and delete events.
- **Base Path:** `/api/v1/events`

| Method | Route | Status |
| :--- | :--- | :--- |
| POST | `/` | ✅ Well-designed |
| GET | `/` | ✅ Well-designed |
| GET | `/:id` | ✅ Well-designed |
| PATCH | `/:id` | ✅ Well-designed |
| DELETE | `/:id` | ✅ Well-designed |

---

### 📦 Module: Supplies & Sutures
- **What it does:** Manages inventory for surgical supplies and sutures.
- **Aims to do:** Bulk create items and manage the collection.
- **Base Path:** `/api/v1/supplies` / `/api/v1/sutures`

| Method | Route | Status |
| :--- | :--- | :--- |
| POST | `/batch` | ✅ Well-designed |
| GET | `/` | ✅ Well-designed |
| PATCH | `/:id` | ✅ Well-designed |
| DELETE | `/:id` | ✅ Well-designed |

---

### 📦 Module: Legal
- **What it does:** Manages legal pages like Terms and Privacy Policy.
- **Aims to do:** CRUD operations for legal content.
- **Base Path:** `/api/v1/legal`

| Method | Route | Status |
| :--- | :--- | :--- |
| POST | `/` | ✅ Well-designed |
| GET | `/` | ✅ Well-designed |
| GET | `/:id` | ✅ Well-designed |

---

### 📦 Module: Binary & File Handling
- **What it does:** Manages file uploads (profile pictures, surgical photos).
- **Correct Design:**
  - **Upload:** `POST` or `PATCH` with `multipart/form-data`.
  - **Download:** `GET` route leading to file URL or stream.
  - **Method:** `POST` for incrementing download counts as a resource interaction.

