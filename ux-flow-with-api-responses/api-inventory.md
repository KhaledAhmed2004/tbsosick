# API Inventory & Implementation Tracker (Screen-Wise)

Ei file ta screen-wise API list track rakhe. Proti ti UI screen-er against-e kon backend endpoint use hocche ta eikhane pawa jabe.

> Mount prefixes (see `src/routes/index.ts`): `/users`, `/auth`, `/notifications`, `/subscription`, `/events`, `/preference-cards`, `/dashboard`, `/supplies`, `/sutures`, `/legal`.
> **Note:** No `payments` module exists in the codebase.

---

## 🖥️ Dashboard Screens (Admin-Facing)

### 1. [Auth (Dashboard)](./dashboard-screens/01-auth.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 1.1 | `/auth/login` | `POST` | Public | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| 1.2 | `/auth/forgot-password` | `POST` | Public | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| 1.3 | `/auth/verify-otp` | `POST` | Public | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| 1.4 | `/auth/reset-password` | `POST` | Reset Token | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| 1.5 | `/auth/refresh-token` | `POST` | Refresh Token | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| 1.6 | `/auth/logout` | `POST` | All Auth | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| 1.7 | `/auth/change-password` | `POST` | All Auth | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| 1.8 | `/auth/resend-verify-email` | `POST` | Public | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |

### 2. [Overview (Dashboard)](./dashboard-screens/02-overview.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 2.1 | `/dashboard/growth-metrics` | `GET` | SUPER_ADMIN | [02-overview.md](./dashboard-screens/02-overview.md) | ✅ |
| 2.2 | `/dashboard/preference-cards/monthly` | `GET` | SUPER_ADMIN | [02-overview.md](./dashboard-screens/02-overview.md) | ✅ |
| 2.3 | `/dashboard/subscriptions/active/monthly` | `GET` | SUPER_ADMIN | [02-overview.md](./dashboard-screens/02-overview.md) | ✅ |

### 3. [User Management](./dashboard-screens/03-user-management.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 3.1 | `/users` | `GET` | SUPER_ADMIN | `user.route.ts` | ✅ |
| 3.2 | `/users` | `POST` | Public | `user.route.ts` | ✅ |
| 3.3 | `/users/stats` | `GET` | SUPER_ADMIN | `user.route.ts` | ✅ |
| 3.4 | `/users/:userId` | `GET` | SUPER_ADMIN | `user.route.ts` | ✅ |
| 3.5 | `/users/:userId` | `PATCH` | SUPER_ADMIN | `user.route.ts` | ✅ |
| 3.6 | `/users/:userId/status` | `PATCH` | SUPER_ADMIN | `user.route.ts` | ✅ |
| 3.7 | `/users/:userId` | `DELETE` | SUPER_ADMIN | `user.route.ts` | ✅ |
| 3.8 | `/users/:userId/user` | `GET` | All Auth | `user.route.ts` | ✅ |

### 4. Preference Card Moderation (Doc Missing)
| Module | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **PrefCard** | `/preference-cards/:cardId/approve` | `PATCH` | SUPER_ADMIN | `preference-card.route.ts` | ✅ |
| **PrefCard** | `/preference-cards/:cardId/reject` | `PATCH` | SUPER_ADMIN | `preference-card.route.ts` | ✅ |

### 5. Legal Management (Doc Missing)
| Module | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **Legal** | `/legal` | `POST` | SUPER_ADMIN | `legal.route.ts` | ✅ |
| **Legal** | `/legal/:slug` | `PATCH` | SUPER_ADMIN | `legal.route.ts` | ✅ |
| **Legal** | `/legal/:slug` | `DELETE` | SUPER_ADMIN | `legal.route.ts` | ✅ |

### 6. Catalog Management (Supplies/Sutures)
| Module | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **Supplies** | `/supplies` | `GET` | All Auth | `supplies.route.ts` | ✅ |
| **Supplies** | `/supplies` | `POST` | SUPER_ADMIN | `supplies.route.ts` | ✅ |
| **Supplies** | `/supplies/:id` | `PATCH` | SUPER_ADMIN | `supplies.route.ts` | ✅ |
| **Supplies** | `/supplies/:id` | `DELETE` | SUPER_ADMIN | `supplies.route.ts` | ✅ |
| **Supplies** | `/supplies/bulk` | `POST` | SUPER_ADMIN | `supplies.route.ts` | ✅ |
| **Sutures** | `/sutures` | `GET` | All Auth | `sutures.route.ts` | ✅ |
| **Sutures** | `/sutures` | `POST` | SUPER_ADMIN | `sutures.route.ts` | ✅ |
| **Sutures** | `/sutures/:id` | `PATCH` | SUPER_ADMIN | `sutures.route.ts` | ✅ |
| **Sutures** | `/sutures/:id` | `DELETE` | SUPER_ADMIN | `sutures.route.ts` | ✅ |
| **Sutures** | `/sutures/bulk` | `POST` | SUPER_ADMIN | `sutures.route.ts` | ✅ |

---

## 📱 App Screens (Student-Facing)

### 1. [Auth (Mobile)](./app-screens/01-auth.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 1.1 | `/users` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| 1.2 | `/auth/login` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| 1.3 | `/auth/verify-otp` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| 1.4 | `/auth/forgot-password` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| 1.5 | `/auth/reset-password` | `POST` | Reset Token | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| 1.6 | `/auth/refresh-token` | `POST` | Refresh Token | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| 1.7 | `/auth/logout` | `POST` | User | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| 1.8 | `/auth/resend-verify-email` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| 1.9 | `/auth/google` | `GET` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| 1.10 | `/auth/google/callback` | `GET` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |

### 2. [Home (Mobile)](./app-screens/02-home.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 2.1 | `/preference-cards` | `GET` | User | [02-home.md](./app-screens/02-home.md) | ✅ |
| 2.2 | `/preference-cards/stats` | `GET` | User | [02-home.md](./app-screens/02-home.md) | ✅ |
| 2.3 | `/users/me/favorites` | `GET` | User | [02-home.md](./app-screens/02-home.md) | ✅ |
| 2.4 | `/preference-cards/:cardId/favorite` | `POST` | User | [02-home.md](./app-screens/02-home.md) | ✅ |
| 2.5 | `/preference-cards/:cardId/favorite` | `DELETE` | User | [02-home.md](./app-screens/02-home.md) | ✅ |
| 2.6 | `/preference-cards/:cardId/download` | `POST` | User | [02-home.md](./app-screens/02-home.md) | ✅ |

### 3. [Preference Card Details](./app-screens/03-preference-card-details.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 3.1 | `/preference-cards` | `POST` | User | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| 3.2 | `/preference-cards/:cardId` | `GET` | User | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| 3.3 | `/preference-cards/:cardId` | `PATCH` | User | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| 3.4 | `/preference-cards/:cardId` | `DELETE` | User | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |

### 4. [Library (Mobile)](./app-screens/04-library.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 4.1 | `/preference-cards/specialties` | `GET` | User | [04-library.md](./app-screens/04-library.md) | ✅ |
| 4.2 | `/preference-cards/private` | `GET` | User | [04-library.md](./app-screens/04-library.md) | ✅ |

### 5. [Calendar (Mobile)](./app-screens/05-calendar.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 5.1 | `/events` | `GET` | User | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| 5.2 | `/events` | `POST` | User | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| 5.3 | `/events/:id` | `GET` | User | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| 5.4 | `/events/:id` | `PATCH` | User | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| 5.5 | `/events/:id` | `DELETE` | User | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |

### 6. [Profile (Mobile)](./app-screens/06-profile.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 6.1 | `/users/profile` | `GET` | User | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| 6.2 | `/users/profile` | `PATCH` | User | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| 6.3 | `/subscription/me` | `GET` | User | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| 6.4 | `/legal` | `GET` | Public | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| 6.5 | `/legal/:slug` | `GET` | Public | [06-profile.md](./app-screens/06-profile.md) | ✅ |

### 7. [Notifications (Mobile)](./app-screens/07-notifications.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 7.1 | `/notifications` | `GET` | User/Admin | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |
| 7.2 | `/notifications/:id/read` | `PATCH` | User/Admin | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |
| 7.3 | `/notifications/read-all` | `PATCH` | User/Admin | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |
| 7.4 | `/notifications/:id` | `DELETE` | User/Admin | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |

### 8. Subscription / IAP (Doc Missing)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 8.1 | `/subscription/me` | `GET` | All Auth | `subscription.route.ts` | ✅ |
| 8.2 | `/subscription/apple/verify` | `POST` | All Auth | `subscription.route.ts` | ✅ |
| 8.3 | `/subscription/apple/webhook` | `POST` | Apple JWS | `subscription.route.ts` | ✅ |
| 8.4 | `/subscription/google/verify` | `POST` | All Auth | `subscription.route.ts` | ✅ |
| 8.5 | `/subscription/google/webhook` | `POST` | Google Pub/Sub JWT | `subscription.route.ts` | ✅ |
| 8.6 | `/subscription/choose/free` | `POST` | All Auth | `subscription.route.ts` | ✅ |

---

## 🛠️ Missing Implementation / To-Do

| Module | Endpoint | Method | Reason | Priority |
| :--- | :--- | :---: | :--- | :---: |
| **Subscription** | `/subscription/apple/webhook` | `POST` | Needs end-to-end testing with App Store Server Notifications V2 | High |
| **Subscription** | `/subscription/google/webhook` | `POST` | Needs end-to-end testing with Google Pub/Sub push | High |
| **Docs** | Subscription IAP screens | — | No UX flow doc for apple/google verify + choose-free flows | Medium |
| **Docs** | Preference card moderation | — | No UX flow doc for `/preference-cards/:cardId/approve` and `/reject` | Medium |
