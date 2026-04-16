import { z } from 'zod';

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|;:'",.<>/?]).{8,}$/;

const createVerifyEmailZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email(),
    otp: z.string({ required_error: 'OTP is required' }),
  }),
});

const createLoginZodSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

const createForgetPasswordZodSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
  }),
});

const createResetPasswordZodSchema = z.object({
  body: z.object({
    newPassword: z
      .string({ required_error: 'Password is required' })
      .regex(
        passwordRegex,
        'Password must include upper, lower, number, special and be 8+ chars'
      ),
  }),
});

const createChangePasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z.string({
      required_error: 'Current Password is required',
    }),
    newPassword: z
      .string({ required_error: 'New Password is required' })
      .regex(
        passwordRegex,
        'Password must include upper, lower, number, special and be 8+ chars'
      ),
  }),
});

const createSocialLoginZodSchema = z.object({
  body: z.object({
    provider: z.enum(['google', 'apple'], {
      required_error: 'Provider is required',
    }),
    idToken: z.string({ required_error: 'ID token is required' }),
    nonce: z.string().optional(),
    deviceToken: z.string().optional(),
    platform: z.enum(['ios', 'android', 'web']).optional(),
    appVersion: z.string().optional(),
  }),
});

const createRefreshTokenZodSchema = z.object({
  // Allow empty body when using cookie-based refresh tokens
  body: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional(),
});

export const AuthValidation = {
  createVerifyEmailZodSchema,
  createForgetPasswordZodSchema,
  createLoginZodSchema,
  createResetPasswordZodSchema,
  createChangePasswordZodSchema,
  createRefreshTokenZodSchema,
  createSocialLoginZodSchema,
};
