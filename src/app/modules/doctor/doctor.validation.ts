import { z } from 'zod';

export const createDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8),
    phone: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/i, 'Phone must be 7-15 digits, optional +')
      .optional(),
    specialty: z.string().min(2).optional(),
    hospital: z.string().min(2).optional(),
    location: z.string().optional(),
    gender: z.enum(['male', 'female']).optional(),
    dateOfBirth: z.string().optional(),
    profilePicture: z.string().url().optional(),
  }),
});

export const updateDoctorSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/i, 'Phone must be 7-15 digits, optional +')
      .optional(),
    specialty: z.string().min(2).optional(),
    hospital: z.string().min(2).optional(),
    location: z.string().optional(),
    // Intentionally exclude password from admin edit
  }),
});

export const DoctorValidation = {
  createDoctorSchema,
  updateDoctorSchema,
};