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

// Get current user's favorite cards
router.get(
  '/me/favorites',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  UserController.getFavoriteCards,
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
  '/:userId',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(UserValidation.adminUpdateUserZodSchema),
  UserController.adminUpdateUser,
);

// Admin: Delete user permanently
router.delete('/:userId', auth(USER_ROLES.SUPER_ADMIN), UserController.deleteUser);

// Update user status (ACTIVE | RESTRICTED)
router.patch(
  '/:userId/status',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(UserValidation.updateUserStatusZodSchema),
  UserController.updateUserStatus,
);

// Block user
router.patch(
  '/:userId/block',
  auth(USER_ROLES.SUPER_ADMIN),
  UserController.blockUser,
);

// Unblock user — super admin
router.patch(
  '/:userId/unblock',
  auth(USER_ROLES.SUPER_ADMIN),
  UserController.unblockUser,
);

// Get specific user details by ID (super admin)
router.get('/:userId', auth(USER_ROLES.SUPER_ADMIN), UserController.getUserById);

// Public user details (guest allowed) — rate limited
router.get(
  '/:userId/user',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  rateLimitMiddleware({
    windowMs: 60_000,
    max: 60,
    routeName: 'public-user-details',
  }),
  UserController.getUserDetailsById,
);

export const UserRoutes = router;
