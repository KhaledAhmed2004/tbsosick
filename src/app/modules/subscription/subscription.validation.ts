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

  googleVerifySchema: z
    .object({
      body: z.object({
        purchaseToken: z.string().min(1, 'purchaseToken is required'),
        productId: z.string().min(1, 'productId is required'),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
    .describe('GoogleVerifyPurchaseSchema'),
};
