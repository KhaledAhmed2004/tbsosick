"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const fileHandler_1 = require("../../middlewares/fileHandler");
const rateLimit_1 = require("../../middlewares/rateLimit");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// --- Public / General ---
// Create new user (Public Registration)
router.post('/', (0, validateRequest_1.default)(user_validation_1.UserValidation.createUserZodSchema), user_controller_1.UserController.createUser);
// Public user details (guest allowed) — rate limited
router.get('/:userId/user', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), (0, rateLimit_1.rateLimitMiddleware)({
    windowMs: 60000,
    max: 60,
    routeName: 'public-user-details',
}), user_controller_1.UserController.getUserDetailsById);
// --- Self Management (User/Doctor) ---
// Fetch own profile details
router.get('/profile', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), user_controller_1.UserController.getUserProfile);
// Get current user's favorite cards
router.get('/me/favorites', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getFavoriteCards);
// Update own profile
router.patch('/profile', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), (0, fileHandler_1.fileHandler)(['profilePicture']), (0, validateRequest_1.default)(user_validation_1.UserValidation.updateUserZodSchema), user_controller_1.UserController.updateProfile);
// --- Admin Management (Unified User/Doctor) ---
// Get user growth statistics
router.get('/stats', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getUsersStats);
// List all users with stats (Admin)
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getAllUserRoles);
// Get specific user details by ID (Admin)
router.get('/:userId', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getUserById);
// Admin: Update any user (Update fields including specialty, role, status)
router.patch('/:userId', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(user_validation_1.UserValidation.adminUpdateUserZodSchema), user_controller_1.UserController.adminUpdateUser);
// Update user status directly (Admin)
router.patch('/:userId/status', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(user_validation_1.UserValidation.updateUserStatusZodSchema), user_controller_1.UserController.updateUserStatus);
// Admin: Delete user permanently
router.delete('/:userId', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.deleteUser);
exports.UserRoutes = router;
