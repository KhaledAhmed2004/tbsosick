# API Inventory & Implementation Tracker (Screen-Wise)

Ei file ta screen-wise API list track rakhe. Proti ti UI screen-er against-e kon backend endpoint use hocche ta eikhane pawa jabe.

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
| 3.3 | `/users/:id` | `GET` | SUPER_ADMIN | `user.route.ts` | ✅ |
| 3.4 | `/users/:id` | `PATCH` | SUPER_ADMIN | `user.route.ts` | ✅ |
| 3.5 | `/users/:id/block` | `PATCH` | SUPER_ADMIN | `user.route.ts` | ✅ |
| 3.6 | `/users/:id/unblock` | `PATCH` | SUPER_ADMIN | `user.route.ts` | ✅ |
| 3.7 | `/users/:id` | `DELETE` | SUPER_ADMIN | `user.route.ts` | ✅ |

### 4. Other Admin Controls (Doc Missing)
| Module | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **PrefCard** | `/preference-cards/:cardId/approve` | `PATCH` | SUPER_ADMIN | `preference-card.route.ts` | ✅ |
| **PrefCard** | `/preference-cards/:cardId/reject` | `PATCH` | SUPER_ADMIN | `preference-card.route.ts` | ✅ |
| **Notif** | `/notifications/admin` | `GET` | SUPER_ADMIN | `notification.routes.ts` | ✅ |
| **Notif** | `/notifications/admin/:id/read` | `PATCH` | SUPER_ADMIN | `notification.routes.ts` | ✅ |
| **Notif** | `/notifications/admin/read-all` | `PATCH` | SUPER_ADMIN | `notification.routes.ts` | ✅ |
| **Legal** | `/legal` | `POST` | SUPER_ADMIN | `legal.route.ts` | ✅ |
| **Legal** | `/legal/:slug` | `PATCH` | SUPER_ADMIN | `legal.route.ts` | ✅ |
| **Legal** | `/legal/:slug` | `DELETE` | SUPER_ADMIN | `legal.route.ts` | ✅ |
| **Payment** | `/payments` | `GET` | SUPER_ADMIN | `payment.routes.ts` | ✅ |
| **Payment** | `/payments/stats` | `GET` | SUPER_ADMIN | `payment.routes.ts` | ✅ |
| **Payment** | `/payments/account/:accountId` | `DELETE` | SUPER_ADMIN | `payment.routes.ts` | ✅ |

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
| 3.1 | `/preference-cards/:cardId` | `GET` | User | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| 3.2 | `/preference-cards/:cardId` | `PATCH` | User | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |
| 3.3 | `/preference-cards/:cardId` | `DELETE` | User | [03-preference-card-details.md](./app-screens/03-preference-card-details.md) | ✅ |

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
| 7.1 | `/notifications` | `GET` | User | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |
| 7.2 | `/notifications/:id/read` | `PATCH` | User | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |
| 7.3 | `/notifications/read-all` | `PATCH` | User | [07-notifications.md](./app-screens/07-notifications.md) | ✅ |

### 8. Payment & Wallet (Doc Missing)
| ID | Endpoint | Method | Roles | Implementation | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| 8.1 | `/payments/history` | `GET` | All Auth | `payment.routes.ts` | ✅ |
| 8.2 | `/payments/stripe/account` | `POST` | All Auth | `payment.routes.ts` | ✅ |
| 8.3 | `/payments/stripe/onboarding` | `GET` | All Auth | `payment.routes.ts` | ✅ |
| 8.4 | `/payments/stripe/onboarding-status` | `GET` | All Auth | `payment.routes.ts` | ✅ |
| 8.5 | `/payments/:paymentId` | `GET` | All Auth | `payment.routes.ts` | ✅ |
| 8.6 | `/payments/refund/:paymentId` | `POST` | All Auth | `payment.routes.ts` | ✅ |

---

## 🛠️ Missing Implementation / To-Do

| Module | Endpoint | Method | Reason | Priority |
| :--- | :--- | :---: | :--- | :---: |
| **Subscription** | `/subscription/iap/verify` | `POST` | Doc missing screen context but route exists | Medium |
| **Subscription** | `/subscription/choose/free` | `POST` | Doc missing screen context but route exists | Medium |
| **Notification** | `/notifications/:id` | `DELETE` | In inventory but not implemented in code | Low |
| **Payment** | `/payments/webhook` | `POST` | Needs proper testing with Stripe CLI | High |
| **Payment** | `/payments/by-bid/:bidId/current-intent` | `GET` | Bid flow documentation missing | Medium |
