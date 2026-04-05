"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paramIdSchema = exports.updateLegalPageSchema = exports.createLegalPageSchema = void 0;
const zod_1 = require("zod");
exports.createLegalPageSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1),
        content: zod_1.z.string().min(1),
    }),
});
exports.updateLegalPageSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).optional(),
        content: zod_1.z.string().min(1).optional(),
    }),
});
exports.paramIdSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
