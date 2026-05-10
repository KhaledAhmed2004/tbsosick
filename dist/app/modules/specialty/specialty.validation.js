"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecialtyValidation = void 0;
const zod_1 = require("zod");
const createSpecialtySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
    }),
});
const updateSpecialtySchema = zod_1.z.object({
    params: zod_1.z.object({ specialtyId: zod_1.z.string().min(1) }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
const paramIdSchema = zod_1.z.object({
    params: zod_1.z.object({ specialtyId: zod_1.z.string().min(1) }),
});
exports.SpecialtyValidation = {
    createSpecialtySchema,
    updateSpecialtySchema,
    paramIdSchema,
};
