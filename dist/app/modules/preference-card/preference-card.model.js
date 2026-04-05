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
// Supply item subdocument schema
const SupplyItemSchema = new mongoose_1.Schema({
    name: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Supply', required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });
// Suture item subdocument schema
const SutureItemSchema = new mongoose_1.Schema({
    name: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Suture', required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });
// Main PreferenceCard schema
const PreferenceCardSchema = new mongoose_1.Schema({
    // Creator user id stored as string (aligns with aggregation lookups)
    createdBy: { type: String, required: true, index: true },
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
}, { timestamps: true });
// Export model
exports.PreferenceCardModel = (0, mongoose_1.model)('PreferenceCard', PreferenceCardSchema);
