"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuturesValidation = void 0;
const zod_1 = require("zod");
const createSutureSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
    }),
});
const updateSutureSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
    }),
});
const paramIdSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
const bulkCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        items: zod_1.z
            .array(zod_1.z.object({
            name: zod_1.z.string().min(1),
        }))
            .min(1),
    }),
});
exports.SuturesValidation = {
    createSutureSchema,
    updateSutureSchema,
    paramIdSchema,
    bulkCreateSchema,
};
