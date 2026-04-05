import { z } from 'zod';

export const createLegalPageSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
  }),
});

export const updateLegalPageSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
  }),
});

export const paramIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
