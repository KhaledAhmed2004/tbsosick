import { z } from 'zod';

const createSutureSchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

const updateSutureSchema = z.object({
  params: z.object({ sutureId: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).optional(),
  }),
});

const paramIdSchema = z.object({
  params: z.object({ sutureId: z.string().min(1) }),
});

const bulkCreateSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          name: z.string().min(1),
        }),
      )
      .min(1),
  }),
});

export const SuturesValidation = {
  createSutureSchema,
  updateSutureSchema,
  paramIdSchema,
  bulkCreateSchema,
};
