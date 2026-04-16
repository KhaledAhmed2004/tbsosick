"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Favorite = void 0;
const mongoose_1 = require("mongoose");
const FavoriteSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cardId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'PreferenceCard',
        required: true,
        index: true,
    },
}, 
// Favorites are never "updated" — they exist or they're deleted. No
// need to carry an `updatedAt` field that will always equal `createdAt`.
{ timestamps: { createdAt: true, updatedAt: false } });
// One favorite per (user, card) pair — idempotent favorite action.
FavoriteSchema.index({ userId: 1, cardId: 1 }, { unique: true });
exports.Favorite = (0, mongoose_1.model)('Favorite', FavoriteSchema);
