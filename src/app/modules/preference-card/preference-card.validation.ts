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
const createPreferenceCardSchema = z.object({
  body: z.object({
    cardTitle: z.string().min(3),
    surgeon: surgeonSchema,
    medication: z.string().min(1),
    supplies: z.array(supplyItemSchema).min(1),
    sutures: z.array(sutureItemSchema).min(1),
    instruments: z.string().min(1),
    positioningEquipment: z.string().min(1),
    prepping: z.string().min(1),
    workflow: z.string().min(1),
    keyNotes: z.string().min(1),
    photoLibrary: z.array(z.string()).optional(),
    published: z.boolean().optional(),
  }),
});

// Update Preference Card (partial update)
const updatePreferenceCardSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
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
    photoLibrary: z.array(z.string()).optional(),
    published: z.boolean().optional(),
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
  params: z.object({ id: z.string().min(1) }),
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
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ published: z.boolean() }),
});

export const PreferenceCardValidation = {
  createPreferenceCardSchema,
  updatePreferenceCardSchema,
  paramIdSchema,
  searchCardsSchema,
  publishPreferenceCardSchema,
};
