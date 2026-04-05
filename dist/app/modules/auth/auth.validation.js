"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = void 0;
const zod_1 = require("zod");
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|;:'",.<>/?]).{8,}$/;
const createVerifyEmailZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }).email(),
        otp: zod_1.z.string({ required_error: 'OTP is required' }),
    }),
});
const createLoginZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({ required_error: 'Email is required' })
            .email('Invalid email address'),
        password: zod_1.z
            .string({ required_error: 'Password is required' })
            .min(1, 'Password is required'),
    }),
});
const createForgetPasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({ required_error: 'Email is required' })
            .email('Invalid email address'),
    }),
});
const createResetPasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        newPassword: zod_1.z
            .string({ required_error: 'Password is required' })
            .regex(passwordRegex, 'Password must include upper, lower, number, special and be 8+ chars'),
    }),
});
const createChangePasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string({
            required_error: 'Current Password is required',
        }),
        newPassword: zod_1.z
            .string({ required_error: 'New Password is required' })
            .regex(passwordRegex, 'Password must include upper, lower, number, special and be 8+ chars'),
    }),
});
const createRefreshTokenZodSchema = zod_1.z.object({
    // Allow empty body when using cookie-based refresh tokens
    body: zod_1.z
        .object({
        refreshToken: zod_1.z.string().optional(),
    })
        .optional(),
});
exports.AuthValidation = {
    createVerifyEmailZodSchema,
    createForgetPasswordZodSchema,
    createLoginZodSchema,
    createResetPasswordZodSchema,
    createChangePasswordZodSchema,
    createRefreshTokenZodSchema,
};
