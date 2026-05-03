import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import { fileHandler } from '../../middlewares/fileHandler';
import { rateLimitMiddleware } from '../../middlewares/rateLimit';
import express from 'express';

const router = express.Router();

// --- Public / General ---

// Create new user (Public Registration)
router.post(
  '/',
  validateRequest(UserValidation.createUserZodSchema),
  UserController.createUser,
);

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

// --- Self Management (User/Doctor) ---

// Fetch own profile details
router.get(
  '/profile',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  UserController.getUserProfile,
);

// Get current user's own preference cards (PUBLIC + PRIVATE, drafts + published)
router.get(
  '/me/preference-cards',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  UserController.getMyPreferenceCards,
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

// --- Admin Management (Unified User/Doctor) ---

// Get user growth statistics
router.get('/stats', auth(USER_ROLES.SUPER_ADMIN), UserController.getUsersStats);

// List all users with stats (Admin)
router.get('/', auth(USER_ROLES.SUPER_ADMIN), UserController.getAllUserRoles);

// Get specific user details by ID (Admin)
router.get('/:userId', auth(USER_ROLES.SUPER_ADMIN), UserController.getUserById);

// Admin: Update any user (Update fields including specialty, role, status)
router.patch(
  '/:userId',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(UserValidation.adminUpdateUserZodSchema),
  UserController.adminUpdateUser,
);

// Update user status directly (Admin)
router.patch(
  '/:userId/status',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(UserValidation.updateUserStatusZodSchema),
  UserController.updateUserStatus,
);

// Admin: Delete user permanently
router.delete('/:userId', auth(USER_ROLES.SUPER_ADMIN), UserController.deleteUser);

export const UserRoutes = router;
