"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishPreferenceCardSchema = exports.paramIdSchema = exports.summarizeEventSchema = exports.suggestSuppliesSchema = exports.updatePreferenceCardSchema = exports.createPreferenceCardSchema = void 0;
const zod_1 = require("zod");
// Surgeon Schema
const surgeonSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(3),
    handPreference: zod_1.z.string().min(1),
    specialty: zod_1.z.string().min(1),
    contactNumber: zod_1.z.string().min(1),
    musicPreference: zod_1.z.string().min(1),
});
// Supply/Suture item schemas (accepts ObjectId or custom name + quantity)
const supplyItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    quantity: zod_1.z.number().int().min(1),
});
const sutureItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    quantity: zod_1.z.number().int().min(1),
});
// Create Preference Card
exports.createPreferenceCardSchema = zod_1.z.object({
    body: zod_1.z.object({
        cardTitle: zod_1.z.string().min(3),
        surgeon: surgeonSchema,
        medication: zod_1.z.string().min(1),
        supplies: zod_1.z.array(supplyItemSchema).min(1),
        sutures: zod_1.z.array(sutureItemSchema).min(1),
        instruments: zod_1.z.string().min(1),
        positioningEquipment: zod_1.z.string().min(1),
        prepping: zod_1.z.string().min(1),
        workflow: zod_1.z.string().min(1),
        keyNotes: zod_1.z.string().min(1),
        photoLibrary: zod_1.z.array(zod_1.z.string()).optional(),
        published: zod_1.z.boolean().optional(),
    }),
});
// Update Preference Card (partial update)
exports.updatePreferenceCardSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
    body: zod_1.z.object({
        cardTitle: zod_1.z.string().min(3).optional(),
        surgeon: surgeonSchema.partial().optional(),
        medication: zod_1.z.string().optional(),
        supplies: zod_1.z.array(supplyItemSchema).optional(),
        sutures: zod_1.z.array(sutureItemSchema).optional(),
        instruments: zod_1.z.string().optional(),
        positioningEquipment: zod_1.z.string().optional(),
        prepping: zod_1.z.string().optional(),
        workflow: zod_1.z.string().optional(),
        keyNotes: zod_1.z.string().optional(),
        photoLibrary: zod_1.z.array(zod_1.z.string()).optional(),
        published: zod_1.z.boolean().optional(),
    }),
});
// Suggest Supplies Schema
exports.suggestSuppliesSchema = zod_1.z.object({
    body: zod_1.z.object({
        specialty: zod_1.z.string().optional(),
    }),
});
// Summarize Event Schema
exports.summarizeEventSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }).optional(),
    body: zod_1.z
        .object({
        title: zod_1.z.string().optional(),
        date: zod_1.z.string().optional(),
        time: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        preferenceCard: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    })
        .optional(),
});
// Param ID Schema
exports.paramIdSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
// Publish Preference Card Schema
exports.publishPreferenceCardSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
    body: zod_1.z.object({ published: zod_1.z.boolean() }),
});
