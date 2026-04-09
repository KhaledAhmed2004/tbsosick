"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = require("mongoose");
const subscription_interface_1 = require("./subscription.interface");
const subscriptionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
        unique: true,
    },
    plan: {
        type: String,
        enum: Object.values(subscription_interface_1.SUBSCRIPTION_PLAN),
        default: subscription_interface_1.SUBSCRIPTION_PLAN.FREE,
    },
    status: {
        type: String,
        enum: Object.values(subscription_interface_1.SUBSCRIPTION_STATUS),
        default: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE,
    },
    platform: {
        type: String,
        enum: Object.values(subscription_interface_1.SUBSCRIPTION_PLATFORM),
    },
    environment: {
        type: String,
        enum: ['sandbox', 'production'],
    },
    productId: { type: String, index: true },
    autoRenewing: { type: Boolean },
    // Apple-specific — unique per originalTransactionId prevents the same
    // Apple purchase from being linked to multiple users (fraud prevention).
    appleOriginalTransactionId: {
        type: String,
        index: true,
        sparse: true,
        unique: true,
    },
    appleLatestTransactionId: { type: String },
    // Google-specific — populated in the next phase.
    googlePurchaseToken: {
        type: String,
        index: true,
        sparse: true,
        unique: true,
    },
    googleOrderId: { type: String },
    // Lifecycle timestamps
    startedAt: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    gracePeriodEndsAt: { type: Date, default: null },
    canceledAt: { type: Date, default: null },
    metadata: { type: Object },
}, { timestamps: true });
subscriptionSchema.statics.findByUser = function (userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.findOne({ userId });
    });
};
subscriptionSchema.statics.upsertForUser = function (userId, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.findOneAndUpdate({ userId }, { $set: Object.assign(Object.assign({}, payload), { userId }) }, { new: true, upsert: true });
    });
};
exports.Subscription = (0, mongoose_1.model)('Subscription', subscriptionSchema);
