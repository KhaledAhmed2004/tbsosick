"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateSchema = exports.paramIdSchema = exports.updateSupplySchema = exports.createSupplySchema = void 0;
const zod_1 = require("zod");
exports.createSupplySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
    }),
});
exports.updateSupplySchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
    }),
});
exports.paramIdSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
exports.bulkCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().min(1),
        })).min(1),
    }),
});
