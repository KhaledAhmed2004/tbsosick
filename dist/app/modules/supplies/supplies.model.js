"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplyModel = void 0;
const mongoose_1 = require("mongoose");
const SupplySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, unique: true, index: true },
}, { timestamps: true });
exports.SupplyModel = (0, mongoose_1.model)('Supply', SupplySchema);
