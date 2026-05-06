import { z } from 'zod';

const createSpecialtySchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

const updateSpecialtySchema = z.object({
  params: z.object({ specialtyId: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

const paramIdSchema = z.object({
  params: z.object({ specialtyId: z.string().min(1) }),
});

export const SpecialtyValidation = {
  createSpecialtySchema,
  updateSpecialtySchema,
  paramIdSchema,
};
