import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import passport from 'passport';
const router = express.Router();

// User login
router.post(
  '/login',
  validateRequest(AuthValidation.createLoginZodSchema),
  AuthController.loginUser,
);

// Google OAuth login — redirect with profile/email scopes
router.get('/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })(req, res, next);
});

// Google OAuth callback — handle sign-in after Google returns
router.get(
  '/google/callback',
  (req, res, next) => {
    next();
  },
  passport.authenticate('google', { session: false }),
  AuthController.googleCallback,
);

// User logout — invalidate active sessions/tokens
router.post(
  '/logout',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  AuthController.logoutUser,
);

// Password reset request — send OTP via email
router.post(
  '/forgot-password',
  validateRequest(AuthValidation.createForgetPasswordZodSchema),
  AuthController.forgetPassword,
);

// OTP verification — verify via code
router.post(
  '/verify-otp',
  validateRequest(AuthValidation.createVerifyEmailZodSchema),
  AuthController.verifyEmail,
);

// Password reset — set new password with valid token
router.post(
  '/reset-password',
  validateRequest(AuthValidation.createResetPasswordZodSchema),
  AuthController.resetPassword,
);

// Change password — authenticated user provides old/new password
router.post(
  '/change-password',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  validateRequest(AuthValidation.createChangePasswordZodSchema),
  AuthController.changePassword,
);

// Resend verification email
router.post('/resend-verify-email', AuthController.resendVerifyEmail);

// Refresh token — renew access token
router.post(
  '/refresh-token',
  validateRequest(AuthValidation.createRefreshTokenZodSchema),
  AuthController.refreshToken,
);

export const AuthRoutes = router;
