import { z } from 'zod';

export const SubscriptionValidation = {
  verifyIapSubscriptionSchema: z
    .object({
      body: z.object({
        platform: z.enum(['android', 'ios']),
        productId: z.string().min(1),
        receipt: z.string().min(1),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
    .describe('SubscriptionIapVerifySchema'),
};
