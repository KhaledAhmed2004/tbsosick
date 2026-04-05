"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalPageModel = void 0;
const mongoose_1 = require("mongoose");
const LegalPageSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
}, { timestamps: true });
exports.LegalPageModel = (0, mongoose_1.model)('LegalPage', LegalPageSchema);
