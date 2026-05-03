"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceCardValidation = void 0;
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
//
// NOTE: Only the structural fields (`cardTitle`, `surgeon`) are required
// at the API level. Long-form workflow text (`medication`, `instruments`,
// `prepping`, `workflow`, `keyNotes`, `positioningEquipment`) is optional
// so that drafts can be saved. Service layer enforces completeness only
// when `published: true` is set or when an admin verifies the card.
const createPreferenceCardSchema = zod_1.z.object({
    body: zod_1.z.object({
        cardTitle: zod_1.z.string().min(3),
        surgeon: surgeonSchema,
        medication: zod_1.z.string().optional(),
        supplies: zod_1.z.array(supplyItemSchema).optional().default([]),
        sutures: zod_1.z.array(sutureItemSchema).optional().default([]),
        instruments: zod_1.z.string().optional(),
        positioningEquipment: zod_1.z.string().optional(),
        prepping: zod_1.z.string().optional(),
        workflow: zod_1.z.string().optional(),
        keyNotes: zod_1.z.string().optional(),
        photoLibrary: zod_1.z.array(zod_1.z.string()).max(10).optional(),
        published: zod_1.z.boolean().optional(),
    }),
});
// Update Preference Card (partial update)
const updatePreferenceCardSchema = zod_1.z.object({
    params: zod_1.z.object({ cardId: zod_1.z.string().min(1) }),
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
        photoLibrary: zod_1.z.array(zod_1.z.string()).max(10).optional(),
        published: zod_1.z.boolean().optional(),
    }),
});
// Suggest Supplies Schema
const suggestSuppliesSchema = zod_1.z.object({
    body: zod_1.z.object({
        specialty: zod_1.z.string().optional(),
    }),
});
// Summarize Event Schema
const summarizeEventSchema = zod_1.z.object({
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
const paramIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        cardId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid cardId format'),
    }),
});
// Search Preference Cards Schema
const searchCardsSchema = zod_1.z.object({
    query: zod_1.z.object({
        searchTerm: zod_1.z.string().trim().max(100).optional(),
        visibility: zod_1.z.enum(['public', 'private']).default('public'),
        page: zod_1.z.coerce.number().int().positive().default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
        sort: zod_1.z
            .string()
            .regex(/^-?(createdAt|cardTitle)$/)
            .optional(),
    }),
});
// Publish Preference Card Schema
const publishPreferenceCardSchema = zod_1.z.object({
    params: zod_1.z.object({ cardId: zod_1.z.string().min(1) }),
    body: zod_1.z.object({ published: zod_1.z.boolean() }),
});
const downloadPreferenceCardSchema = zod_1.z.object({
    params: zod_1.z.object({
        cardId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid cardId format'),
    }),
});
// Update Verification Status Schema (Admin)
const updateVerificationStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        cardId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid cardId format'),
    }),
    body: zod_1.z.object({
        verificationStatus: zod_1.z.enum(['VERIFIED', 'UNVERIFIED']),
    }),
});
exports.PreferenceCardValidation = {
    createPreferenceCardSchema,
    updatePreferenceCardSchema,
    paramIdSchema,
    searchCardsSchema,
    publishPreferenceCardSchema,
    downloadPreferenceCardSchema,
    updateVerificationStatusSchema,
};
