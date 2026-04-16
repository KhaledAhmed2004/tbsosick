"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SutureModel = void 0;
const mongoose_1 = require("mongoose");
const SutureSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, unique: true, index: true },
    category: { type: String, trim: true, index: true },
    unit: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
exports.SutureModel = (0, mongoose_1.model)('Suture', SutureSchema);
