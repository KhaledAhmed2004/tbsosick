import { z } from 'zod';

export const listNotificationsSchema = z.object({
  query: z
    .object({
      limit: z.string().optional(),
      page: z.string().optional(),
    })
    .optional(),
});

export const markAllReadSchema = z.object({});

export const paramIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const markReadSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ read: z.boolean().default(true) }).optional(),
});