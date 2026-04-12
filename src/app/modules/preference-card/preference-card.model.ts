import { Schema, model } from 'mongoose';
import { PreferenceCard } from './preference-card.interface';

// Surgeon subdocument schema
const SurgeonSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    handPreference: { type: String, required: true },
    specialty: { type: String, required: true },
    contactNumber: { type: String, required: true },
    musicPreference: { type: String, required: true },
  },
  { _id: false }, // prevents _id generation for subdocuments
);

// Supply item subdocument schema — holds a Supply FK + quantity.
const SupplyItemSchema = new Schema(
  {
    supply: { type: Schema.Types.ObjectId, ref: 'Supply', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

// Suture item subdocument schema — holds a Suture FK + quantity.
const SutureItemSchema = new Schema(
  {
    suture: { type: Schema.Types.ObjectId, ref: 'Suture', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

// Main PreferenceCard schema
const PreferenceCardSchema = new Schema<PreferenceCard>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cardTitle: { type: String, required: true, trim: true },
    surgeon: { type: SurgeonSchema, required: true },
    medication: { type: String, required: true },
    supplies: { type: [SupplyItemSchema], required: true },
    sutures: { type: [SutureItemSchema], required: true },
    instruments: { type: String, required: true },
    positioningEquipment: { type: String, required: true },
    prepping: { type: String, required: true },
    workflow: { type: String, required: true },
    keyNotes: { type: String, required: true },
    photoLibrary: { type: [String], required: true },
    downloadCount: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'UNVERIFIED'],
      default: 'UNVERIFIED',
    },
  },
  { timestamps: true },
);

// ─── Indexes ─────────────────────────────────────────────────────────────
// Owner dashboards: "list my cards sorted by most-recently updated."
PreferenceCardSchema.index({ createdBy: 1, updatedAt: -1 });

// Home / public list: `{ published: true }` base filter + sort by createdAt.
// ESR rule — equality on `published` + `verificationStatus`, then sort on
// `createdAt` — so the index directly serves the home screen query plan.
PreferenceCardSchema.index({ published: 1, verificationStatus: 1, createdAt: -1 });

// Specialty facet filter (Library screen, public list).
PreferenceCardSchema.index({ 'surgeon.specialty': 1, published: 1 });

// Full-text search — replaces the old `$regex` scan in QueryBuilder.search().
// Weighted so title matches rank above body/specialty matches.
PreferenceCardSchema.index(
  {
    cardTitle: 'text',
    medication: 'text',
    'surgeon.fullName': 'text',
    'surgeon.specialty': 'text',
  },
  {
    weights: {
      cardTitle: 10,
      'surgeon.fullName': 5,
      'surgeon.specialty': 3,
      medication: 2,
    },
    name: 'card_text_idx',
  },
);

// Export model
export const PreferenceCardModel = model<PreferenceCard>(
  'PreferenceCard',
  PreferenceCardSchema,
);
