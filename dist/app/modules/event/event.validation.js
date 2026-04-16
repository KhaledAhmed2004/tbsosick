"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventValidation = void 0;
const zod_1 = require("zod");
const event_interface_1 = require("./event.interface");
// Accept either a combined ISO `startsAt` OR the legacy `{ date, time, durationHours }`
// triple for backwards compatibility with existing clients. The service normalises
// everything into `startsAt` / `endsAt` before writing to the DB.
const legacyDateTimeFields = {
    date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    time: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional(),
    durationHours: zod_1.z.number().positive().optional(),
};
const createEventZodSchema = zod_1.z.object({
    body: zod_1.z
        .object(Object.assign({ title: zod_1.z.string().min(1, 'Title is required'), startsAt: zod_1.z.string().datetime().optional(), endsAt: zod_1.z.string().datetime().optional(), eventType: zod_1.z.enum(Object.values(event_interface_1.EVENT_TYPE)), location: zod_1.z.string().optional(), preferenceCard: zod_1.z.string().optional(), notes: zod_1.z.string().optional(), personnel: zod_1.z
            .object({
            leadSurgeon: zod_1.z.string().min(1, 'Lead surgeon is required'),
            surgicalTeam: zod_1.z.array(zod_1.z.string()).optional(),
        })
            .optional() }, legacyDateTimeFields))
        .refine(data => Boolean(data.startsAt) || (data.date && data.time && data.durationHours), {
        message: 'Provide startsAt (ISO) or the legacy date + time + durationHours triple',
    }),
});
const updateEventZodSchema = zod_1.z.object({
    body: zod_1.z.object(Object.assign({ title: zod_1.z.string().min(1).optional(), startsAt: zod_1.z.string().datetime().optional(), endsAt: zod_1.z.string().datetime().optional(), eventType: zod_1.z
            .enum(Object.values(event_interface_1.EVENT_TYPE))
            .optional(), location: zod_1.z.string().optional(), preferenceCard: zod_1.z.string().optional(), notes: zod_1.z.string().optional(), personnel: zod_1.z
            .object({
            leadSurgeon: zod_1.z.string().optional(),
            surgicalTeam: zod_1.z.array(zod_1.z.string()).optional(),
        })
            .optional() }, legacyDateTimeFields)),
});
exports.EventValidation = {
    createEventZodSchema,
    updateEventZodSchema,
};
