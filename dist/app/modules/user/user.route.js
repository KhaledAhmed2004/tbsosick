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
// Create new user
router.post('/', (0, validateRequest_1.default)(user_validation_1.UserValidation.createUserZodSchema), user_controller_1.UserController.createUser);
// Fetch own profile details
router.get('/profile', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), user_controller_1.UserController.getUserProfile);
// Update own profile
router.patch('/profile', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), (0, fileHandler_1.fileHandler)(['profilePicture']), (0, validateRequest_1.default)(user_validation_1.UserValidation.updateUserZodSchema), user_controller_1.UserController.updateProfile);
// List user roles only
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getAllUserRoles);
// Admin: Update any user
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(user_validation_1.UserValidation.adminUpdateUserZodSchema), user_controller_1.UserController.adminUpdateUser);
// Admin: Delete user permanently
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.deleteUser);
// Update user status (ACTIVE | RESTRICTED)
router.patch('/:id/status', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(user_validation_1.UserValidation.updateUserStatusZodSchema), user_controller_1.UserController.updateUserStatus);
// Block user
router.patch('/:id/block', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.blockUser);
// Unblock user — super admin
router.patch('/:id/unblock', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.unblockUser);
// Get specific user details by ID (super admin)
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getUserById);
// Public user details (guest allowed) — rate limited
router.get('/:id/user', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), (0, rateLimit_1.rateLimitMiddleware)({
    windowMs: 60000,
    max: 60,
    routeName: 'public-user-details',
}), user_controller_1.UserController.getUserDetailsById);
exports.UserRoutes = router;
