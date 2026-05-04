import { z } from 'zod';

// Surgeon Schema
const surgeonSchema = z.object({
  fullName: z.string().min(3),
  handPreference: z.string().min(1),
  specialty: z.string().min(1),
  contactNumber: z.string().min(1),
  musicPreference: z.string().min(1),
});

// Supply/Suture item schemas (accepts ObjectId or custom name + quantity)
const supplyItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(1),
});

const sutureItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(1),
});

// Create Preference Card
//
// NOTE: Only the structural fields (`cardTitle`, `surgeon`) are required
// at the API level. Long-form workflow text (`medication`, `instruments`,
// `prepping`, `workflow`, `keyNotes`, `positioningEquipment`) is optional
// so that drafts can be saved. Service layer enforces completeness only
// when `published: true` is set or when an admin verifies the card.
const createPreferenceCardSchema = z.object({
  body: z.object({
    cardTitle: z.string().min(3),
    surgeon: surgeonSchema,
    medication: z.string().optional(),
    supplies: z.array(supplyItemSchema).optional().default([]),
    sutures: z.array(sutureItemSchema).optional().default([]),
    instruments: z.string().optional(),
    positioningEquipment: z.string().optional(),
    prepping: z.string().optional(),
    workflow: z.string().optional(),
    keyNotes: z.string().optional(),
    photoLibrary: z.array(z.string()).max(10).optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  }),
});

// Update Preference Card (partial update)
const updatePreferenceCardSchema = z.object({
  params: z.object({ cardId: z.string().min(1) }),
  body: z.object({
    cardTitle: z.string().min(3).optional(),
    surgeon: surgeonSchema.partial().optional(),
    medication: z.string().optional(),
    supplies: z.array(supplyItemSchema).optional(),
    sutures: z.array(sutureItemSchema).optional(),
    instruments: z.string().optional(),
    positioningEquipment: z.string().optional(),
    prepping: z.string().optional(),
    workflow: z.string().optional(),
    keyNotes: z.string().optional(),
    photoLibrary: z.array(z.string()).max(10).optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  }),
});

// Suggest Supplies Schema
const suggestSuppliesSchema = z.object({
  body: z.object({
    specialty: z.string().optional(),
  }),
});

// Summarize Event Schema
const summarizeEventSchema = z.object({
  params: z.object({ id: z.string().min(1) }).optional(),
  body: z
    .object({
      title: z.string().optional(),
      date: z.string().optional(),
      time: z.string().optional(),
      location: z.string().optional(),
      preferenceCard: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

// Param ID Schema
const paramIdSchema = z.object({
  params: z.object({
    cardId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid cardId format'),
  }),
});

// Search Preference Cards Schema
const searchCardsSchema = z.object({
  query: z.object({
    searchTerm: z.string().trim().max(100).optional(),
    visibility: z.enum(['public', 'private']).default('public'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    sort: z
      .string()
      .regex(/^-?(createdAt|cardTitle)$/)
      .optional(),
  }),
});

// Publish Preference Card Schema
const publishPreferenceCardSchema = z.object({
  params: z.object({ cardId: z.string().min(1) }),
  body: z.object({ published: z.boolean() }),
});

const downloadPreferenceCardSchema = z.object({
  params: z.object({
    cardId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid cardId format'),
  }),
});

// Update Verification Status Schema (Admin)
const updateVerificationStatusSchema = z.object({
  params: z.object({
    cardId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid cardId format'),
  }),
  body: z.object({
    verificationStatus: z.enum(['VERIFIED', 'UNVERIFIED']),
  }),
});

export const PreferenceCardValidation = {
  createPreferenceCardSchema,
  updatePreferenceCardSchema,
  paramIdSchema,
  searchCardsSchema,
  publishPreferenceCardSchema,
  downloadPreferenceCardSchema,
  updateVerificationStatusSchema,
};
