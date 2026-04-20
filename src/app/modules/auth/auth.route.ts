import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { rateLimitMiddleware } from '../../middlewares/rateLimit';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
const router = express.Router();

// 10 req/min per IP — guards against brute-force password attempts and
// spray attacks against the token verification endpoint, which does expensive
// RSA signature validation.
const loginRateLimit = rateLimitMiddleware({
  windowMs: 60_000,
  max: 10,
  routeName: 'auth:login',
});

const socialLoginRateLimit = rateLimitMiddleware({
  windowMs: 60_000,
  max: 10,
  routeName: 'auth:social-login',
});

const passwordResetRateLimit = rateLimitMiddleware({
  windowMs: 60_000,
  max: 5,
  routeName: 'auth:password-reset',
});

// User login
router.post(
  '/login',
  loginRateLimit,
  validateRequest(AuthValidation.createLoginZodSchema),
  AuthController.loginUser,
);

// Social login (Google / Apple ID token verification)
router.post(
  '/social-login',
  socialLoginRateLimit,
  validateRequest(AuthValidation.createSocialLoginZodSchema),
  AuthController.socialLogin,
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
  passwordResetRateLimit,
  validateRequest(AuthValidation.createForgetPasswordZodSchema),
  AuthController.forgetPassword,
);

// OTP verification — verify via code
router.post(
  '/verify-otp',
  passwordResetRateLimit,
  validateRequest(AuthValidation.createVerifyEmailZodSchema),
  AuthController.verifyEmail,
);

// Password reset — set new password with valid token
router.post(
  '/reset-password',
  passwordResetRateLimit,
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
