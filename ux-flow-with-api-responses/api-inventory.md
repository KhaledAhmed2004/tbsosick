# API Inventory & Implementation Tracker (Screen-Wise)

Ei file ta screen-wise API list track rakhe. Proti ti UI screen-er against-e kon backend endpoint use hocche ta eikhane pawa jabe.

> **Mount prefixes** (see `src/routes/index.ts`): `/users`, `/auth`, `/notifications`, `/subscription`, `/events`, `/preference-cards`, `/dashboard`, `/supplies`, `/sutures`, `/legal`.
> **Base URL:** `/api/v1`
> **Documentation:** `/api/v1/docs` (Swagger UI)
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
| 1.6 | `/auth/logout` | `POST` | ALL_AUTH | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
| 1.7 | `/auth/change-password` | `POST` | ALL_AUTH | [01-auth.md](./dashboard-screens/01-auth.md) | ✅ |
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
| 3.8 | `/users/:userId/user` | `GET` | ALL_AUTH | `user.route.ts` | ✅ |

### 4. [Preference Card Management](./dashboard-screens/04-preference-card-management.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 4.1 | `/preference-cards` | `GET` | SUPER_ADMIN | [04-preference-card-management.md](./dashboard-screens/04-preference-card-management.md) | ✅ |
| 4.2 | `/preference-cards/:cardId` (body `{ verificationStatus }`) | `PATCH` | SUPER_ADMIN | [04-preference-card-management.md](./dashboard-screens/04-preference-card-management.md) | Contract ✅ · Code Pending (D8) |
| 4.3 | `/preference-cards/:cardId` | `DELETE` | SUPER_ADMIN | [04-preference-card-management.md](./dashboard-screens/04-preference-card-management.md) | ✅ |
| 4.4 | `/preference-cards/favorites/cards/:cardId` | `PUT/DELETE` | SUPER_ADMIN | [04-preference-card-management.md](./dashboard-screens/04-preference-card-management.md) | ✅ |

### 5. [Legal Management](./dashboard-screens/05-legal-management.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 5.1 | `/legal` | `GET` | Public | [05-legal-management.md](./dashboard-screens/05-legal-management.md) | ✅ |
| 5.2 | `/legal` | `POST` | SUPER_ADMIN | [05-legal-management.md](./dashboard-screens/05-legal-management.md) | ✅ |
| 5.3 | `/legal/:slug` | `GET` | Public | [05-legal-management.md](./dashboard-screens/05-legal-management.md) | ✅ |
| 5.4 | `/legal/:slug` | `PATCH` | SUPER_ADMIN | [05-legal-management.md](./dashboard-screens/05-legal-management.md) | ✅ |
| 5.5 | `/legal/:slug` | `DELETE` | SUPER_ADMIN | [05-legal-management.md](./dashboard-screens/05-legal-management.md) | ✅ |

### 6. Catalog Management (Supplies/Sutures)
| Module | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **Supplies** | `/supplies` | `GET` | ALL_AUTH | `supplies.route.ts` | ✅ |
| **Supplies** | `/supplies` | `POST` | SUPER_ADMIN | `supplies.route.ts` | ✅ |
| **Supplies** | `/supplies/:supplyId` | `PATCH` | SUPER_ADMIN | `supplies.route.ts` | ✅ |
| **Supplies** | `/supplies/:supplyId` | `DELETE` | SUPER_ADMIN | `supplies.route.ts` | ✅ |
| **Supplies** | `/supplies/bulk` | `POST` | SUPER_ADMIN | `supplies.route.ts` | ✅ |
| **Sutures** | `/sutures` | `GET` | ALL_AUTH | `sutures.route.ts` | ✅ |
| **Sutures** | `/sutures` | `POST` | SUPER_ADMIN | `sutures.route.ts` | ✅ |
| **Sutures** | `/sutures/:sutureId` | `PATCH` | SUPER_ADMIN | `sutures.route.ts` | ✅ |
| **Sutures** | `/sutures/:sutureId` | `DELETE` | SUPER_ADMIN | `sutures.route.ts` | ✅ |
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
| 1.7 | `/auth/logout` | `POST` | USER | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| 1.8 | `/auth/resend-verify-email` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |
| 1.9 | `/auth/social-login` | `POST` | Public | [01-auth.md](./app-screens/01-auth.md) | ✅ |

### 2. [Home (Mobile)](./app-screens/02-home.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 2.1 | `/preference-cards` | `GET` | USER | [02-home.md](./app-screens/02-home.md) | ✅ |
| 2.2 | `/preference-cards/stats` | `GET` | USER | [02-home.md](./app-screens/02-home.md) | ✅ |
| 2.3 | `/users/me/favorites` | `GET` | USER | [02-home.md](./app-screens/02-home.md) | ✅ |
| 2.4 | `/preference-cards/favorites/cards/:cardId` | `PUT` | USER | [02-home.md](./app-screens/02-home.md) | ✅ |
| 2.5 | `/preference-cards/favorites/cards/:cardId` | `DELETE` | USER | [02-home.md](./app-screens/02-home.md) | ✅ |
| 2.6 | `/preference-cards/:cardId/download` | `POST` | USER | [02-home.md](./app-screens/02-home.md) | ✅ |

### 3. [Preference Card Details](./app-screens/03-preference-card-details.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 3.1 | `/preference-cards/:cardId` | `GET` | USER | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| 3.2 | `/preference-cards/:cardId/download` | `POST` | USER | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| 3.3 | `/preference-cards` | `POST` | USER | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| 3.4 | `/preference-cards/:cardId` | `PATCH` | USER | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| 3.5 | `/supplies` | `GET` | USER | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| 3.6 | `/sutures` | `GET` | USER | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| 3.7 | `/preference-cards/:cardId` | `DELETE` | USER | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |

### 4. [Library (Mobile)](./app-screens/04-library.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 4.1 | `/preference-cards/specialties` | `GET` | USER | [04-library.md](./app-screens/04-library.md) | ✅ |
| 4.2 | `/preference-cards/private` | `GET` | USER | [04-library.md](./app-screens/04-library.md) | ✅ |

### 5. [Calendar (Mobile)](./app-screens/05-calendar.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 5.1 | `/events` | `GET` | USER | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| 5.2 | `/events` | `POST` | USER | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| 5.3 | `/events/:eventId` | `GET` | USER | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| 5.4 | `/events/:eventId` | `PATCH` | USER | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |
| 5.5 | `/events/:eventId` | `DELETE` | USER | [05-calendar.md](./app-screens/05-calendar.md) | ✅ |

### 6. [Profile (Mobile)](./app-screens/06-profile.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 6.1 | `/users/profile` | `GET` | USER | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| 6.2 | `/users/profile` | `PATCH` | USER | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| 6.3 | `/subscription/me` | `GET` | ALL_AUTH | [06-profile.md](./app-screens/06-profile.md) | ✅ |
| 6.4 | `/legal` | `GET` | Public | [05-legal-management.md](../dashboard-screens/05-legal-management.md) | ✅ |
| 6.5 | `/legal/:slug` | `GET` | Public | [05-legal-management.md](../dashboard-screens/05-legal-management.md) | ✅ |

### 7. [Notifications (Mobile)](./app-screens/07-notifications.md)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 7.1 | `/notifications` | `GET` | ALL_AUTH | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |
| 7.2 | `/notifications/:notificationId/read` | `PATCH` | ALL_AUTH | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |
| 7.3 | `/notifications/read-all` | `PATCH` | ALL_AUTH | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |
| 7.4 | `/notifications/:notificationId` | `DELETE` | ALL_AUTH | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |

### 8. Subscription / IAP (Doc Missing)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 8.1 | `/subscription/me` | `GET` | ALL_AUTH | `subscription.route.ts` | ✅ |
| 8.2 | `/subscription/apple/verify` | `POST` | ALL_AUTH | `subscription.route.ts` | ✅ |
| 8.3 | `/subscription/apple/webhook` | `POST` | Apple JWS | `subscription.route.ts` | ✅ |
| 8.4 | `/subscription/google/verify` | `POST` | ALL_AUTH | `subscription.route.ts` | ✅ |
| 8.5 | `/subscription/google/webhook` | `POST` | Google Pub/Sub | `subscription.route.ts` | ✅ |
| 8.6 | `/subscription/choose/free` | `POST` | ALL_AUTH | `subscription.route.ts` | ✅ |

### 9. Catalog / Assets (Mobile)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 9.1 | `/supplies` | `GET` | USER | `supplies.route.ts` | ✅ |
| 9.2 | `/sutures` | `GET` | USER | `sutures.route.ts` | ✅ |

---

## 🛠️ Missing Implementation / To-Do

| Module | Endpoint | Method | Reason | Priority |
| :--- | :--- | :---: | :--- | :---: |
| **Subscription** | `/subscription/apple/webhook` | `POST` | Needs E2E testing with Apple Server Notifications V2 | High |
| **Subscription** | `/subscription/google/webhook` | `POST` | Needs E2E testing with Google Pub/Sub push | High |
| **Docs** | Subscription IAP screens | — | No UX flow doc for apple/google verify + choose-free flows | Medium |

