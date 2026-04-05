import { z } from 'zod';
import { USER_ROLES, USER_STATUS } from '../../../enums/user';

const phoneRegex = /^\+?[0-9]{7,15}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|;:'",.<>/?]).{8,}$/;

const createUserZodSchema = z.object({
  body: z
    .object({
      name: z.string({ required_error: 'Name is required' }).min(1),
      email: z
        .string({ required_error: 'Email is required' })
        .email('Invalid email address'),
      gender: z.enum(['male', 'female']).optional(),
      dateOfBirth: z.string().optional(),
      location: z.string().optional(),
      phone: z
        .string({ required_error: 'Phone is required' })
        .regex(phoneRegex, 'Phone must be 7-15 digits, optional +'),
      country: z.string({ required_error: 'Country is required' }).min(1),
      role: z.enum([USER_ROLES.USER]).optional(),
      password: z.string().optional(),
      profilePicture: z.string().optional(),
      googleId: z.string().optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (!data.googleId) {
        if (!data.password || data.password.length === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password is required' });
        } else if (!passwordRegex.test(data.password)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must include upper, lower, number, special and be 8+ chars',
          });
        }
      }
    }),
});


const updateUserZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    gender: z.enum(['male', 'female']).optional(),
    dateOfBirth: z.string().optional(),
    location: z.string().optional(),
    country: z.string().optional(),
    specialty: z.string().optional(),
    hospital: z.string().optional(),
    phone: z.string().regex(phoneRegex, 'Phone must be 7-15 digits, optional +').optional(),
    password: z
      .string()
      .regex(passwordRegex, 'Password must include upper, lower, number, special and be 8+ chars')
      .optional(),
    profilePicture: z.string().optional(),
  }),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
  updateUserStatusZodSchema: z.object({
    params: z.object({
      id: z.string({ required_error: 'User ID is required' }),
    }),
    body: z.object({
      status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED], {
        required_error: 'status is required',
        invalid_type_error: 'status must be ACTIVE or RESTRICTED',
      }),
    }),
  }),
  adminUpdateUserZodSchema: z.object({
    params: z.object({
      id: z.string({ required_error: 'User ID is required' }),
    }),
    body: z.object({
      name: z.string().optional(),
      email: z.string().email('Invalid email address').optional(),
      phone: z.string().regex(phoneRegex, 'Phone must be 7-15 digits, optional +').optional(),
      location: z.string().optional(),
      country: z.string().optional(),
      specialty: z.string().optional(),
      hospital: z.string().optional(),
      gender: z.enum(['male', 'female']).optional(),
      dateOfBirth: z.string().optional(),
      profilePicture: z.string().optional(),
      status: z.enum([
        USER_STATUS.ACTIVE,
        USER_STATUS.INACTIVE,
        USER_STATUS.RESTRICTED,
        USER_STATUS.DELETE,
      ]).optional(),
      role: z.enum([USER_ROLES.SUPER_ADMIN, USER_ROLES.USER]).optional(),
    }),
  }),
};
