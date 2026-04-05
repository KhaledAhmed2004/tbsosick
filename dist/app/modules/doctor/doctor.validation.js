"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorValidation = exports.updateDoctorSchema = exports.createDoctorSchema = void 0;
const zod_1 = require("zod");
exports.createDoctorSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(8),
        phone: zod_1.z
            .string()
            .regex(/^\+?[0-9]{7,15}$/i, 'Phone must be 7-15 digits, optional +')
            .optional(),
        specialty: zod_1.z.string().min(2).optional(),
        hospital: zod_1.z.string().min(2).optional(),
        location: zod_1.z.string().optional(),
        gender: zod_1.z.enum(['male', 'female']).optional(),
        dateOfBirth: zod_1.z.string().optional(),
        profilePicture: zod_1.z.string().url().optional(),
    }),
});
exports.updateDoctorSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        email: zod_1.z.string().email('Invalid email address').optional(),
        phone: zod_1.z
            .string()
            .regex(/^\+?[0-9]{7,15}$/i, 'Phone must be 7-15 digits, optional +')
            .optional(),
        specialty: zod_1.z.string().min(2).optional(),
        hospital: zod_1.z.string().min(2).optional(),
        location: zod_1.z.string().optional(),
        // Intentionally exclude password from admin edit
    }),
});
exports.DoctorValidation = {
    createDoctorSchema: exports.createDoctorSchema,
    updateDoctorSchema: exports.updateDoctorSchema,
};
