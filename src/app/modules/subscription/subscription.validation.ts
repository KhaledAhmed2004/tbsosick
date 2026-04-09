import { z } from 'zod';

export const SubscriptionValidation = {
  appleVerifySchema: z
    .object({
      body: z.object({
        signedTransactionInfo: z
          .string()
          .min(1, 'signedTransactionInfo is required'),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
    .describe('AppleVerifyPurchaseSchema'),
};
