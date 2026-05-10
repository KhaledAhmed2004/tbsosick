"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecialtyModel = void 0;
const mongoose_1 = require("mongoose");
const SpecialtySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, unique: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
exports.SpecialtyModel = (0, mongoose_1.model)('Specialty', SpecialtySchema);
