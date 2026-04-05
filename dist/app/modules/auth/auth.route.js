"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_controller_1 = require("./auth.controller");
const auth_validation_1 = require("./auth.validation");
const passport_1 = __importDefault(require("passport"));
const router = express_1.default.Router();
// User login
router.post('/login', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createLoginZodSchema), auth_controller_1.AuthController.loginUser);
// Google OAuth login — redirect with profile/email scopes
router.get('/google', (req, res, next) => {
    passport_1.default.authenticate('google', {
        scope: ['profile', 'email'],
    })(req, res, next);
});
// Google OAuth callback — handle sign-in after Google returns
router.get('/google/callback', (req, res, next) => {
    next();
}, passport_1.default.authenticate('google', { session: false }), auth_controller_1.AuthController.googleCallback);
// User logout — invalidate active sessions/tokens
router.post('/logout', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), auth_controller_1.AuthController.logoutUser);
// Password reset request — send OTP via email
router.post('/forgot-password', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createForgetPasswordZodSchema), auth_controller_1.AuthController.forgetPassword);
// OTP verification — verify via code
router.post('/verify-otp', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createVerifyEmailZodSchema), auth_controller_1.AuthController.verifyEmail);
// Password reset — set new password with valid token
router.post('/reset-password', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createResetPasswordZodSchema), auth_controller_1.AuthController.resetPassword);
// Change password — authenticated user provides old/new password
router.post('/change-password', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createChangePasswordZodSchema), auth_controller_1.AuthController.changePassword);
// Resend verification email
router.post('/resend-verify-email', auth_controller_1.AuthController.resendVerifyEmail);
// Refresh token — renew access token
router.post('/refresh-token', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createRefreshTokenZodSchema), auth_controller_1.AuthController.refreshToken);
exports.AuthRoutes = router;
