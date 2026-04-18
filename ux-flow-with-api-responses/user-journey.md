# TBSOSick — Complete User Journey & UX Flow

> **Base URL**: `http://localhost:5000/api/v1`
> **Scope**: Student Mobile App ও Admin Dashboard — dutor jonno complete user journey.
> **Standard Response**: সব API `{ success, statusCode, message, data }` envelope follow kore.

---

## Platform Overview

```
TBSOSick
├── 📱 Student Mobile App (User-facing)
│   ├── Auth          → Register, Login, Google OAuth, Password Reset
│   ├── Home          → Search, Stats, Favorites
│   ├── Card Details  → View, Download, Share
│   ├── Library       → Public & Private Cards, Filter
│   ├── Calendar      → Events, Reminders
│   ├── Profile       → Edit, Subscription, Legal
│   └── Notifications → Real-time, Read, Delete
│
└── 🖥️ Admin Dashboard (Super Admin-facing)
    ├── Auth          → Login, Password Reset, Token Management
    ├── Overview      → Growth Metrics, Monthly Charts
    └── Doctor Mgmt   → CRUD, Block/Activate, Stats
```

---

## Part 1: Student Mobile App — User Journey

---

### 🔐 Journey 1: New User Registration

```
[Splash/Welcome Screen]
        │
        ▼
[Create Account Tap]
        │
        ▼
[Form: Name, Email, Password, Phone, Country, Gender, DOB]
        │
        ▼ POST /users
        │
   ┌────┴──────────────┐
   │ 201 Created        │ 400 Email Exists
   │                    │
   ▼                    ▼
[OTP Verify Screen]  [Error Toast]
        │
        │  [Email না পেলে]
        │◄─── Resend OTP ──── POST /auth/resend-verify-email (200)
        │
        ▼ POST /auth/verify-otp
        │
   ┌────┴──────────────┐
   │ 200 + tokens       │ 400 Invalid OTP
   │                    │
   ▼                    ▼
[Auto Login →        [Retry OTP]
 Home Screen]
```

**APIs Called:**
| Step | Method | Endpoint |
|------|:------:|----------|
| Register | `POST` | `/users` |
| Resend OTP | `POST` | `/auth/resend-verify-email` |
| Verify OTP | `POST` | `/auth/verify-otp` |

---

### 🔑 Journey 2: Existing User Login

```
[Login Screen]
        │
        ▼ POST /auth/login { email, password, deviceToken? }
        │
   ┌────┴──────────────────┐
   │ 200 + accessToken +    │ 401 Invalid Credentials
   │     refreshToken       │
   │                        ▼
   ▼                   [Error Message]
[Home Screen]
```

**Social Login Alternative (Google / Apple):**
```
[Sign in with Google] / [Sign in with Apple]
        │
        ▼ Flutter SDK login (google_sign_in / sign_in_with_apple)
        │
        ▼ POST /auth/social-login { provider, idToken, nonce? }
        │
        ▼ [Tokens receive → Home Screen]
```

---

### 🔄 Journey 3: Forgot Password Flow

```
[Forgot Password Link]
        │
        ▼ POST /auth/forgot-password { email }
        │
        ▼ 200 Silent Success (enumeration-safe)
        │
[OTP Screen]
        │
        ▼ POST /auth/verify-otp { email, otp }
        │
        ▼ 200 + resetToken
        │
[New Password Screen]
        │
        ▼ POST /auth/reset-password (Bearer resetToken) { newPassword }
        │
        ▼ 200 Success → [Login Screen]
```

---

### 🔁 Journey 4: Silent Token Refresh (Background)

```
[Any API Call → 401 Unauthorized]
        │
        ▼ POST /auth/refresh-token (auto, httpOnly cookie)
        │
   ┌────┴─────────────────────┐
   │ 200 New token pair        │ 401 Token reused/expired
   │                           │
   ▼                           ▼
[Original Request Retry]   [Force Logout → Login Screen]
```

> **Security**: Token rotation enabled — puran token reuse detect hole immediate force logout.

---

### 🏠 Journey 5: Home Screen

```
[Login Success / App Open]
        │
        ▼ Parallel API Calls:
        ├── GET /preference-cards/stats    → Stats (publicCards, myCards)
        └── GET /users/me/favorites        → Favorite cards list
        │
[Home Screen Renders]
├── 🔍 Search Bar (top)
├── 🔔 Notification Bell (header)
├── 📊 Stats Section (Total Available | My Created)
├── ➕ Floating Action Button (Create Card)
└── ⭐ Favorite Cards (horizontal scroll)
```

**Search Flow:**
```
[User types in search bar]
        │
        ▼ GET /preference-cards?visibility=public&searchTerm=keyword
        │
   ┌────┴──────────────────┐
   │ 200 + results list     │ Empty → "No cards found"
   │                        │
   ▼                        ▼
[Results List]          [Empty State]
```

**Favorite Toggle:**
```
[Favorite Icon Tap]
        │
   ┌────┴──────────────────────────┐
   │ Not Favorited                  │ Already Favorited
   │ POST /preference-cards/:cardId/favorite │ DELETE /preference-cards/:cardId/favorite
   │                                │
   ▼                                ▼
[Added → 200]                  [Removed → 200]
[Home list refreshes]
```

---

### 📄 Journey 6: Preference Card Details

```
[Tap on Card (from Home/Search/Library)]
        │
        ▼ GET /preference-cards/:cardId
        │
        ▼ 200 - Card Details
        │
[Details Screen Renders]
├── 🏥 Card Title + Surgeon Info (Name, Specialty, Hand, Music)
├── 💊 Medication
├── 📦 Supplies (list + quantity)
├── 🧵 Sutures (list + quantity)
├── 🔧 Instruments + Positioning
├── 🩺 Prepping + Workflow
├── 📝 Key Notes
└── 🖼️ Photo Library

[Actions]
├── ⭐ Favorite Toggle (POST/DELETE /preference-cards/:cardId/favorite)
├── 📤 Share → System Share Sheet (frontend-only)
└── ⬇️ Download → POST /preference-cards/:cardId/download → count++ (200)
```

**Error States:**
| Status | Scenario | Behavior |
|:------:|----------|----------|
| 403 | Private card, not owner | Forbidden error |
| 404 | Card deleted/invalid ID | "Card not found" |

---

### 📚 Journey 7: Library Screen

```
[Library Tab Tap]
        │
        ▼ Skeleton UI shows (3-4 placeholder cards)
        │
        ▼ GET /preference-cards?visibility=public
        │
[Screen Renders]
├── 🔍 Sticky Search Bar
├── 🔽 Filter Button (badge shows active count)
├── [ Preference Cards | Private Cards ] Tab Switcher
└── 📋 Card List
```

**Search Flow (350ms debounce):**
```
[User types]
        │ 350ms debounce
        ▼ GET /preference-cards?visibility=public&searchTerm=...
        │
   ┌────┴───────────────────┐
   │ Results                 │ Empty
   │                         │
   ▼                         ▼
[List updates]          ["No cards found" illustration]
```

**Filter Flow:**
```
[Filter Button Tap]
        │
        ▼ GET /preference-cards/specialties → dynamic list loads
        │
[Bottom Sheet Opens]
├── Specialty Picker (dynamic from API)
├── Verified Only Toggle
└── [Cancel] [Apply]
        │
        ▼ Apply
        ▼ GET /preference-cards?visibility=public&surgeonSpecialty=X&verificationStatus=VERIFIED
        │
[Filtered Results + Active Badge on Filter Button]
```

**Tab Switching:**
```
[Public Tab]                    [Private Tab]
GET /preference-cards           GET /preference-cards
?visibility=public              ?visibility=private
                                        │
                                   ┌────┴──────────────┐
                                   │ Has Cards          │ Empty
                                   │                    │
                                   ▼                    ▼
                              [Private List]    ["Create Card" CTA]
```

---

### 📅 Journey 8: Calendar Screen

```
[Calendar Tab Tap]
        │
        ▼ GET /events?from=2026-04-01&to=2026-04-30
        │
[Calendar Screen Renders]
├── 📆 Interactive Calendar (dots on event dates)
├── 📋 Upcoming Events List
└── ➕ Create Event Button
```

**Create Event Flow:**
```
[+ Button Tap]
        │
        ▼ [Modal/Bottom Sheet: Title, Date, Time, Description]
        │
        ▼ POST /events { title, description, date, time }
        │
        ▼ 201 Created
[List Updates + Success Toast]
[Auto reminders set: 24h & 1h before event]
```

**Event Management:**
```
[Event Tap from List]
        │
        ▼ GET /events/:eventId → Full details
        │
[Details Modal]
        │
        ▼ [Edit Icon Tap]
        │
        ▼ PATCH /events/:eventId { title?, time?, ... }
        │
        ▼ 200 Updated → Calendar Refreshes
```

---

### 👤 Journey 9: Profile Screen

```
[Profile Tab Tap]
        │
        ▼ Parallel API Calls:
        ├── GET /users/profile         → User basic info
        └── GET /subscriptions/me      → Subscription status
        │
[Profile Screen Renders]
├── 🖼️ Profile Picture + Name + Email
├── 🏥 Hospital + Specialty
├── 💳 Subscription Plan (FREE / PREMIUM)
├── ✏️ Edit Profile Button
├── 📜 Legal Pages (Terms, Privacy)
└── 🚪 Logout Button
```

**Edit Profile Flow:**
```
[Edit Profile Click]
        │
[Form: pre-filled with current data]
│  name?, hospital?, specialty?, phone?, profilePicture?
│
▼ PATCH /users/profile (multipart/form-data)
│
▼ 200 → Updated fields return → Profile re-renders
```

**Subscription Flow:**
```
GET /subscriptions/me
│
├── plan: "PREMIUM" → Show subscription details + expiry
└── plan: "FREE"    → Show "Upgrade to Premium" button
                               │
                               ▼ [In-App Purchase (IAP) logic triggers]
```

**Legal Pages Flow:**
```
[Terms & Conditions / Privacy Policy click]
        │
        ▼ GET /legal → List of pages (title + slug)
        │
        ▼ GET /legal/:slug → Full content (HTML/Markdown)
        │
[Full Content renders on screen]
```

**Logout Flow:**
```
[Logout Button Tap]
        │
[Confirm Modal]
        │
        ▼ POST /auth/logout (Bearer accessToken)
        │
        ▼ 200 → Local state cleared → [Login Screen]
```

---

### 🔔 Journey 10: Notifications Screen

```
[Notification Bell Tap (Header)]
        │
        ▼ GET /notifications
        │
[Notifications Screen Renders]
├── 📬 Notification Cards (Title, Subtitle, Icon, Time)
├── Unread items highlighted
└── "No notifications yet" if empty
```

**Notification Actions:**
```
[Single Notification Tap]
        │
        ▼ PATCH /notifications/:notificationId/read { read: true }
        │
        ▼ Navigate to resource (PreferenceCard, etc.) based on resourceType + resourceId
```

```
[Mark All Read Button]
        │
        ▼ PATCH /notifications/read-all
        │
        ▼ 200 → All notifications show as read
```

```
[Swipe/Delete Icon]
        │
        ▼ DELETE /notifications/:notificationId
        │
        ▼ 200 → Removed from list
```

> **Real-time**: App open থাকলে Socket-এর মাধ্যমে নতুন notification auto-add হয় list-এ।

---

## Part 2: Admin Dashboard — User Journey

---

### 🔐 Journey D1: Admin Login

```
[Admin Login Page]
        │
        ▼ POST /auth/login { email, password, deviceToken? }
        │
   ┌────┴─────────────────────────────────┐
   │ 200 + tokens                          │ 401 Invalid Credentials
   │                                       │ 403 Account Restricted
   ▼                                       ▼
[Dashboard Overview Screen]           [Error Message]
```

**Admin Forgot Password (same flow as mobile):**
```
POST /auth/forgot-password → OTP Email
POST /auth/verify-otp      → resetToken
POST /auth/reset-password  → Success → Login
```

**Change Password (while logged in):**
```
POST /auth/change-password { currentPassword, newPassword }
        │
        ▼ 200 → Password updated
```

---

### 📊 Journey D2: Overview / Dashboard

```
[Login Success → Overview Screen]
        │
        ▼ Parallel API Calls (Skeleton while loading):
        ├── GET /admin/growth-metrics           → Summary stats cards
        ├── GET /admin/preference-cards/monthly → Card trend chart
        └── GET /admin/subscriptions/active/monthly → Subscription chart
        │
[Dashboard Renders]
├── 📦 Summary Cards (4 metrics with direction + changePct):
│   ├── Total Doctors (e.g. 250, ↑ 25%)
│   ├── Preference Cards (e.g. 4500, ↑ 7.14%)
│   ├── Verified Cards (e.g. 4200, ↑ 4%)
│   └── Active Subscriptions (e.g. 120, ↓ 37.5%)
│
└── 📈 Trend Charts (Monthly, YoY comparison):
    ├── Preference Cards Monthly Trend
    └── Active Subscriptions Monthly Trend
```

**Chart Data Structure (YoY inline per series item):**
```
GET /admin/preference-cards/monthly?year=2025&compare_year=2024&tz=Asia/Dhaka
→ series[{ month, count, last_year_count, yoy_delta, yoy_delta_pct }]
→ summary: { total, monthly_avg, daily_avg, peak, trend, yoy }
```

---

### 👨‍⚕️ Journey D3: Doctor Management

```
[Sidebar → Doctor Module]
        │
        ▼ Parallel API Calls:
        ├── GET /doctors/stats   → Stat cards (total, active, inactive, blocked)
        └── GET /doctors         → Doctor list (with pagination)
        │
[Doctor Screen Renders]
├── 📊 Stats Cards: Total | Active | Inactive | Blocked (+ monthly growth)
├── 🔍 Search Bar (search by name/email)
├── 🔽 Filters: Specialty | Status
└── 📋 Doctor Table:
    └── [Name, Email, Phone, Specialty, Cards Count, Subscription, Status]
        └── Actions: [Edit] [Block/Activate] [Delete]
```

**Create Doctor:**
```
[Create Doctor Button]
        │
[Form: name, email, password, phone, specialty, hospital, gender, DOB]
        │
        ▼ POST /doctors
        │
   ┌────┴──────────────────┐
   │ 201 Created            │ 400 Email Already Exists
   │                        │
   ▼                        ▼
[List Refreshes]        [Error Toast]
```

**Update Doctor:**
```
[Edit Action]
        │
[Pre-filled Form: name, specialty, hospital, phone]
(password & status বদলানো যাবে না এই endpoint থেকে)
        │
        ▼ PATCH /doctors/:doctorId { name?, specialty?, hospital? }
        │
        ▼ 200 → Updated row in table
```

**Block / Activate Doctor:**
```
[Block Action]
        │
        ▼ PATCH /doctors/:doctorId/status { status: "RESTRICTED" }
        │
        ▼ 200 → Doctor status becomes RESTRICTED (login blocked)

[Activate Action]
        │
        ▼ PATCH /doctors/:doctorId/status { status: "ACTIVE" }
        │
        ▼ 200 → Doctor status becomes ACTIVE
```

**Delete Doctor:**
```
[Delete Action]
        │
[Confirm Modal]
        │
        ▼ DELETE /doctors/:doctorId
        │
        ▼ 200 → Doctor removed from list
```

---

## Complete API Summary

### Student App APIs

| Screen | # | Method | Endpoint | Auth |
|--------|---|:------:|----------|:----:|
| Auth | 1.1 | `POST` | `/users` | Public |
| Auth | 1.2 | `POST` | `/auth/login` | Public |
| Auth | 1.3 | `POST` | `/auth/verify-otp` | Public |
| Auth | 1.4 | `POST` | `/auth/forgot-password` | Public |
| Auth | 1.5 | `POST` | `/auth/reset-password` | Reset Token |
| Auth | 1.6 | `POST` | `/auth/refresh-token` | Refresh Token |
| Auth | 1.7 | `POST` | `/auth/logout` | Bearer |
| Auth | 1.8 | `POST` | `/auth/resend-verify-email` | Public |
| Auth | 1.9 | `POST` | `/auth/social-login` | Public |
| Home | 2.1 | `GET` | `/preference-cards?visibility=public` | Bearer |
| Home | 2.2 | `GET` | `/preference-cards/stats` | Bearer |
| Home | 2.3 | `GET` | `/users/me/favorites` | Bearer |
| Home | 2.4 | `POST` | `/preference-cards/:cardId/favorite` | Bearer |
| Home | 2.5 | `DELETE` | `/preference-cards/:cardId/favorite` | Bearer |
| Home | 2.6 | `POST` | `/preference-cards/:cardId/download` | Bearer |
| Card Details | 3.1 | `GET` | `/preference-cards/:cardId` | Bearer |
| Card Details | 3.2 | `POST` | `/preference-cards/:cardId/download` | Bearer |
| Library | 4.1 | `GET` | `/preference-cards?visibility=public` | Bearer |
| Library | 4.2 | `GET` | `/preference-cards?visibility=private` | Bearer |
| Library | 4.2a | `GET` | `/preference-cards/specialties` | Bearer |
| Calendar | 5.1 | `GET` | `/events` | Bearer |
| Calendar | 5.2 | `POST` | `/events` | Bearer |
| Calendar | 5.3 | `GET` | `/events/:eventId` | Bearer |
| Calendar | 5.4 | `PATCH` | `/events/:eventId` | Bearer |
| Profile | 6.1 | `GET` | `/users/profile` | Bearer |
| Profile | 6.2 | `PATCH` | `/users/profile` | Bearer |
| Profile | 6.3 | `GET` | `/subscriptions/me` | Bearer |
| Profile | 6.4 | `GET` | `/legal` | Public |
| Profile | 6.5 | `GET` | `/legal/:slug` | Public |
| Notifications | 7.1 | `GET` | `/notifications` | Bearer |
| Notifications | 7.2 | `PATCH` | `/notifications/:notificationId/read` | Bearer |
| Notifications | 7.3 | `PATCH` | `/notifications/read-all` | Bearer |
| Notifications | 7.4 | `DELETE` | `/notifications/:notificationId` | Bearer |

### Admin Dashboard APIs

| Screen | # | Method | Endpoint | Auth |
|--------|---|:------:|----------|:----:|
| Auth | D1.1 | `POST` | `/auth/login` | Public |
| Auth | D1.2 | `POST` | `/auth/forgot-password` | Public |
| Auth | D1.3 | `POST` | `/auth/verify-otp` | Public |
| Auth | D1.4 | `POST` | `/auth/reset-password` | Reset Token |
| Auth | D1.5 | `POST` | `/auth/refresh-token` | Refresh Token |
| Auth | D1.6 | `POST` | `/auth/logout` | Bearer |
| Auth | D1.7 | `POST` | `/auth/change-password` | Bearer |
| Auth | D1.8 | `POST` | `/auth/resend-verify-email` | Public |
| Overview | D2.1 | `GET` | `/admin/growth-metrics` | SUPER_ADMIN |
| Overview | D2.2 | `GET` | `/admin/preference-cards/monthly` | SUPER_ADMIN |
| Overview | D2.3 | `GET` | `/admin/subscriptions/active/monthly` | SUPER_ADMIN |
| Doctor | D3.1 | `GET` | `/doctors/stats` | SUPER_ADMIN |
| Doctor | D3.2 | `GET` | `/doctors` | SUPER_ADMIN |
| Doctor | D3.3 | `POST` | `/doctors` | SUPER_ADMIN |
| Doctor | D3.4 | `PATCH` | `/doctors/:doctorId` | SUPER_ADMIN |
| Doctor | D3.5 | `PATCH` | `/doctors/:doctorId/status` | SUPER_ADMIN |
| Doctor | D3.6 | `DELETE` | `/doctors/:doctorId` | SUPER_ADMIN |

---

## Cross-Screen Navigation Map

```
                    ┌──────────────────────────────────────────┐
                    │              Student App                  │
                    │                                           │
   [Auth] ──────► [Home] ◄──────────────────────────────────┐  │
              ┌────┤                                          │  │
              │    │── Search ──────────► [Card Details] ─────┤  │
              │    │── Favorites ───────► [Card Details] ─────┤  │
              │    │── Notifications ──► [Notifications] ──────┤  │
              │    │── Create Card (+) ► Creation Flow         │  │
              │                                                │  │
              ├── [Library]                                    │  │
              │    │── Public Tab ──────► [Card Details] ──────┘  │
              │    └── Private Tab ─────► [Card Details]          │
              │                                                    │
              ├── [Calendar] ──── Events CRUD                      │
              │                                                    │
              ├── [Profile]                                        │
              │    ├── Edit Profile                                │
              │    ├── Subscription                                │
              │    ├── Legal Pages                                 │
              │    └── Logout ──────────────────────► [Auth]       │
              │                                                    │
              └── [Notifications] ──► [Card Details]               │
                                                                   │
                    └──────────────────────────────────────────────┘
```

---

## Global Error Handling

| Status | Scenario | Frontend Action |
|:------:|----------|-----------------|
| `400` | Validation Error | Field-level error messages দেখাও |
| `401` | Unauthorized / Token Expired | Silent refresh → যদি fail করে, Login screen-এ পাঠাও |
| `403` | Forbidden (wrong role/private access) | "Access denied" error দেখাও |
| `404` | Resource Not Found | "Not found" empty state দেখাও |
| `429` | Rate Limit Exceeded | "Too many requests, try again later" toast |
| `500` | Server Error | "Something went wrong. Retry." দেখাও |

---

## Security Notes

- **Enumeration Prevention**: Forgot password সবসময় silent success return করে (email থাকুক বা না থাকুক)।
- **Token Rotation**: Refresh token একবারই use করা যায় — reuse detect হলে force logout।
- **BOLA Protection**: Private cards শুধু owner-ই access করতে পারে।
- **Rate Limiting**: Public search — 60 req/min।
- **OAuth without Password**: Google দিয়ে sign-in করা users-এর profile update-এ password লাগে না।
