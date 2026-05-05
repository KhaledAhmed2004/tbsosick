import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { NotificationRoutes } from '../app/modules/notification/notification.routes';
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.route';
import { EventRoutes } from '../app/modules/event/event.route';
import { PreferenceCardRoutes } from '../app/modules/preference-card/preference-card.route';
import { AdminRoutes } from '../app/modules/admin/admin.route';
import { SuppliesRoutes } from '../app/modules/supplies/supplies.route';
import { SuturesRoutes } from '../app/modules/sutures/sutures.route';
import { LegalRoutes } from '../app/modules/legal/legal.route';

const router = express.Router();

const apiRoutes = [
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/notifications',
    route: NotificationRoutes,
  },
  {
    path: '/subscriptions',
    route: SubscriptionRoutes,
  },
  {
    path: '/events',
    route: EventRoutes,
  },
  {
    path: '/preference-cards',
    route: PreferenceCardRoutes,
  },
  {
    path: '/admin',
    route: AdminRoutes,
  },
  {
    path: '/supplies',
    route: SuppliesRoutes,
  },
  {
    path: '/sutures',
    route: SuturesRoutes,
  },
  {
    path: '/legal',
    route: LegalRoutes,
  },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
