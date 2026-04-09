"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionValidation = void 0;
const zod_1 = require("zod");
exports.SubscriptionValidation = {
    appleVerifySchema: zod_1.z
        .object({
        body: zod_1.z.object({
            signedTransactionInfo: zod_1.z
                .string()
                .min(1, 'signedTransactionInfo is required'),
        }),
        params: zod_1.z.object({}).optional(),
        query: zod_1.z.object({}).optional(),
    })
        .describe('AppleVerifyPurchaseSchema'),
};
