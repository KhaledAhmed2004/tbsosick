import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import { fileHandler } from '../../middlewares/fileHandler';
import { rateLimitMiddleware } from '../../middlewares/rateLimit';
import express from 'express';

const router = express.Router();

// Create new user
router.post(
  '/',
  validateRequest(UserValidation.createUserZodSchema),
  UserController.createUser,
);

// Fetch own profile details
router.get(
  '/profile',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  UserController.getUserProfile,
);

// Update own profile
router.patch(
  '/profile',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  fileHandler(['profilePicture']),
  validateRequest(UserValidation.updateUserZodSchema),
  UserController.updateProfile,
);

// List user roles only
router.get('/', auth(USER_ROLES.SUPER_ADMIN), UserController.getAllUserRoles);

// Admin: Update any user
router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(UserValidation.adminUpdateUserZodSchema),
  UserController.adminUpdateUser,
);

// Admin: Delete user permanently
router.delete('/:id', auth(USER_ROLES.SUPER_ADMIN), UserController.deleteUser);

// Update user status (ACTIVE | RESTRICTED)
router.patch(
  '/:id/status',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(UserValidation.updateUserStatusZodSchema),
  UserController.updateUserStatus,
);

// Block user
router.patch(
  '/:id/block',
  auth(USER_ROLES.SUPER_ADMIN),
  UserController.blockUser,
);

// Unblock user — super admin
router.patch(
  '/:id/unblock',
  auth(USER_ROLES.SUPER_ADMIN),
  UserController.unblockUser,
);

// Get specific user details by ID (super admin)
router.get('/:id', auth(USER_ROLES.SUPER_ADMIN), UserController.getUserById);

// Public user details (guest allowed) — rate limited
router.get(
  '/:id/user',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  rateLimitMiddleware({
    windowMs: 60_000,
    max: 60,
    routeName: 'public-user-details',
  }),
  UserController.getUserDetailsById,
);

export const UserRoutes = router;
