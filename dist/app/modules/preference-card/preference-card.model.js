"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceCardModel = void 0;
const mongoose_1 = require("mongoose");
// Surgeon subdocument schema
const SurgeonSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true, trim: true },
    handPreference: { type: String, required: true },
    specialty: { type: String, required: true },
    contactNumber: { type: String, required: true },
    musicPreference: { type: String, required: true },
}, { _id: false });
// Supply item subdocument schema — holds a Supply FK + quantity.
const SupplyItemSchema = new mongoose_1.Schema({
    supply: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Supply', required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });
// Suture item subdocument schema — holds a Suture FK + quantity.
const SutureItemSchema = new mongoose_1.Schema({
    suture: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Suture', required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });
// Maximum number of photos allowed per card. Keeps the embedded array
// bounded — without this cap, `photoLibrary` would be an unbounded array
// anti-pattern (see audit report).
const MAX_PHOTOS_PER_CARD = 10;
// Main PreferenceCard schema.
//
// NOTE on required-ness: only the structural fields (`createdBy`, `cardTitle`,
// `surgeon`, `supplies`, `sutures`) are schema-required. The long-form
// workflow fields (`medication`, `instruments`, `prepping`, ...) are
// intentionally optional so that clients can save drafts. The completeness
// check for publishable cards runs in the service layer — see
// `assertCardIsPublishable` in `preference-card.service.ts`.
const PreferenceCardSchema = new mongoose_1.Schema({
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cardTitle: { type: String, required: true, trim: true },
    surgeon: { type: SurgeonSchema, required: true },
    supplies: { type: [SupplyItemSchema], default: [] },
    sutures: { type: [SutureItemSchema], default: [] },
    // Long-form workflow fields — optional at the schema level so drafts
    // can be saved. Service layer enforces completeness before publish.
    medication: { type: String, trim: true },
    instruments: { type: String, trim: true },
    positioningEquipment: { type: String, trim: true },
    prepping: { type: String, trim: true },
    workflow: { type: String, trim: true },
    keyNotes: { type: String, trim: true },
    photoLibrary: {
        type: [String],
        default: [],
        validate: {
            validator: (arr) => !arr || arr.length <= MAX_PHOTOS_PER_CARD,
            message: `A preference card can hold at most ${MAX_PHOTOS_PER_CARD} photos`,
        },
    },
    downloadCount: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    verificationStatus: {
        type: String,
        enum: ['VERIFIED', 'UNVERIFIED'],
        default: 'UNVERIFIED',
    },
}, { timestamps: true });
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
PreferenceCardSchema.index({
    cardTitle: 'text',
    medication: 'text',
    'surgeon.fullName': 'text',
    'surgeon.specialty': 'text',
}, {
    weights: {
        cardTitle: 10,
        'surgeon.fullName': 5,
        'surgeon.specialty': 3,
        medication: 2,
    },
    name: 'card_text_idx',
});
// Export model
exports.PreferenceCardModel = (0, mongoose_1.model)('PreferenceCard', PreferenceCardSchema);
