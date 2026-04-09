import { z } from 'zod';

const createSupplySchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

const updateSupplySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).optional(),
  }),
});

const paramIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const bulkCreateSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        name: z.string().min(1),
      }),
    ).min(1),
  }),
});

export const SuppliesValidation = {
  createSupplySchema,
  updateSupplySchema,
  paramIdSchema,
  bulkCreateSchema,
};