"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SutureModel = void 0;
const mongoose_1 = require("mongoose");
const SutureSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, unique: true, index: true },
}, { timestamps: true });
exports.SutureModel = (0, mongoose_1.model)('Suture', SutureSchema);
