import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { AdminController } from './admin.controller';

const router = express.Router();

router.get(
  '/growth-metrics',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminController.getDashboardStats,
);

// Preference cards monthly trend (each month’s count)
router.get(
  '/preference-cards/trends/monthly',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminController.getPreferenceCardMonthly,
);

// Active subscriptions monthly trend (each month’s count)
router.get(
  '/subscriptions/trends/monthly',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminController.getActiveSubscriptionMonthly,
);

export const AdminRoutes = router;
