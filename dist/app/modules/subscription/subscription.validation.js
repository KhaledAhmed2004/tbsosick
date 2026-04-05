"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionValidation = void 0;
const zod_1 = require("zod");
exports.SubscriptionValidation = {
    verifyIapSubscriptionSchema: zod_1.z
        .object({
        body: zod_1.z.object({
            platform: zod_1.z.enum(['android', 'ios']),
            productId: zod_1.z.string().min(1),
            receipt: zod_1.z.string().min(1),
        }),
        params: zod_1.z.object({}).optional(),
        query: zod_1.z.object({}).optional(),
    })
        .describe('SubscriptionIapVerifySchema'),
};
