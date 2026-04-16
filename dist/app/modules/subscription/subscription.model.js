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
const subscription_event_model_1 = require("./subscription-event.model");
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
    // NOTE: `status` is intentionally NOT defaulted. A subscription record
    // only transitions to `active` after a verified purchase (Apple/Google
    // verify call or explicit admin grant). Defaulting to `active` would
    // hand out paid access to any row that got inserted without hitting the
    // verification code path.
    status: {
        type: String,
        enum: Object.values(subscription_interface_1.SUBSCRIPTION_STATUS),
        required: true,
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
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
subscriptionSchema.statics.findByUser = function (userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.findOne({ userId });
    });
};
/**
 * Upserts the current-state `subscriptions` row for a user AND appends an
 * entry to `subscription_events` capturing what changed. The events
 * collection is the durable audit trail — the `subscriptions` row is the
 * single "current state" view.
 */
subscriptionSchema.statics.upsertForUser = function (userId, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const before = yield this.findOne({ userId }).lean();
        const next = yield this.findOneAndUpdate({ userId }, { $set: Object.assign(Object.assign({}, payload), { userId }) }, { new: true, upsert: true });
        // Diff and log only the meaningful transitions.
        const beforePlan = before === null || before === void 0 ? void 0 : before.plan;
        const afterPlan = next.plan;
        const beforeStatus = before === null || before === void 0 ? void 0 : before.status;
        const afterStatus = next.status;
        const events = [];
        if (!before) {
            events.push({ eventType: 'CREATED' });
        }
        else {
            if (beforePlan !== afterPlan) {
                events.push({ eventType: 'PLAN_CHANGED' });
            }
            if (beforeStatus !== afterStatus) {
                events.push({ eventType: 'STATUS_CHANGED' });
            }
        }
        for (const evt of events) {
            try {
                yield subscription_event_model_1.SubscriptionEvent.create({
                    userId,
                    subscriptionId: next._id,
                    eventType: evt.eventType,
                    previousPlan: beforePlan,
                    nextPlan: afterPlan,
                    previousStatus: beforeStatus,
                    nextStatus: afterStatus,
                    platform: next.platform,
                    productId: next.productId,
                    externalTransactionId: next.appleLatestTransactionId ||
                        next.appleOriginalTransactionId ||
                        next.googleOrderId ||
                        next.googlePurchaseToken,
                    occurredAt: new Date(),
                });
            }
            catch (err) {
                // Audit writes must never fail the primary subscription update.
                console.error('Failed to write SubscriptionEvent:', err);
            }
        }
        return next;
    });
};
exports.Subscription = (0, mongoose_1.model)('Subscription', subscriptionSchema);
