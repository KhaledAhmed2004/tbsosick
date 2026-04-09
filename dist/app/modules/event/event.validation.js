"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventValidation = void 0;
const zod_1 = require("zod");
const event_interface_1 = require("./event.interface");
// Require date, time, durationHours and eventType
const createEventZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
        durationHours: zod_1.z.number().positive('Duration must be positive'),
        eventType: zod_1.z.enum(Object.values(event_interface_1.EVENT_TYPE)),
        location: zod_1.z.string().optional(),
        preferenceCard: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        personnel: zod_1.z
            .object({
            leadSurgeon: zod_1.z.string().min(1, 'Lead surgeon is required'),
            surgicalTeam: zod_1.z.array(zod_1.z.string()).optional(),
        })
            .optional(),
    }),
});
const updateEventZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).optional(),
        date: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
        time: zod_1.z
            .string()
            .regex(/^\d{2}:\d{2}$/)
            .optional(),
        durationHours: zod_1.z.number().positive().optional(),
        eventType: zod_1.z
            .enum(Object.values(event_interface_1.EVENT_TYPE))
            .optional(),
        location: zod_1.z.string().optional(),
        preferenceCard: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        personnel: zod_1.z
            .object({
            leadSurgeon: zod_1.z.string().optional(),
            surgicalTeam: zod_1.z.array(zod_1.z.string()).optional(),
        })
            .optional(),
    }),
});
exports.EventValidation = {
    createEventZodSchema,
    updateEventZodSchema,
};
