import { z } from 'zod';

export const createSupplySchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

export const updateSupplySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).optional(),
  }),
});

export const paramIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const bulkCreateSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        name: z.string().min(1),
      }),
    ).min(1),
  }),
});