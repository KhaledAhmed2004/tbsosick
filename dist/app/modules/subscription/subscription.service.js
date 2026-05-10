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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processGoogleWebhook = exports.verifyGooglePurchase = exports.processAppleWebhook = exports.verifyApplePurchase = exports.setFreePlan = exports.getMySubscription = exports.adminResetPlan = exports.adminGrantPlan = exports.getSubscriptionEvents = exports.getSubscriptionById = exports.getPendingWebhooks = exports.getSubscriptionAnalytics = exports.getAllSubscriptions = void 0;
const mongoose_1 = require("mongoose");
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const subscription_model_1 = require("./subscription.model");
const subscription_interface_1 = require("./subscription.interface");
const apple_verify_1 = require("./providers/apple/apple.verify");
const apple_webhook_1 = require("./providers/apple/apple.webhook");
const google_verify_1 = require("./providers/google/google.verify");
const google_webhook_1 = require("./providers/google/google.webhook");
const plan_mapper_1 = require("./helpers/plan.mapper");
const pending_webhook_model_1 = require("./pending-webhook.model");
const subscription_event_model_1 = require("./subscription-event.model");
const iap_account_1 = require("./helpers/iap-account");
const logger_1 = require("../../../shared/logger");
const user_model_1 = require("../user/user.model");
// --- Admin Service Methods ---
const getAllSubscriptions = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const builder = new QueryBuilder_1.default(subscription_model_1.Subscription.find().populate('userId', 'fullName email'), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const [data, meta] = yield Promise.all([
        builder.modelQuery,
        builder.getPaginationInfo(),
    ]);
    return { data, meta };
});
exports.getAllSubscriptions = getAllSubscriptions;
const getSubscriptionAnalytics = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    // Single $facet aggregation — one round-trip instead of three.
    const [result] = yield subscription_model_1.Subscription.aggregate([
        {
            $facet: {
                planDistribution: [{ $group: { _id: '$plan', count: { $sum: 1 } } }],
                platformDistribution: [
                    { $group: { _id: '$platform', count: { $sum: 1 } } },
                ],
                activeCount: [
                    { $match: { status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE } },
                    { $count: 'count' },
                ],
            },
        },
    ]);
    return {
        planDistribution: (_a = result === null || result === void 0 ? void 0 : result.planDistribution) !== null && _a !== void 0 ? _a : [],
        platformDistribution: (_b = result === null || result === void 0 ? void 0 : result.platformDistribution) !== null && _b !== void 0 ? _b : [],
        activeCount: (_e = (_d = (_c = result === null || result === void 0 ? void 0 : result.activeCount) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.count) !== null && _e !== void 0 ? _e : 0,
    };
});
exports.getSubscriptionAnalytics = getSubscriptionAnalytics;
const getPendingWebhooks = () => __awaiter(void 0, void 0, void 0, function* () {
    return pending_webhook_model_1.PendingWebhook.find().sort({ receivedAt: -1 }).limit(100);
});
exports.getPendingWebhooks = getPendingWebhooks;
const getSubscriptionById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return subscription_model_1.Subscription.findById(id).populate('userId', 'fullName email');
});
exports.getSubscriptionById = getSubscriptionById;
const getSubscriptionEvents = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, query = {}) {
    const builder = new QueryBuilder_1.default(subscription_event_model_1.SubscriptionEvent.find({ userId: new mongoose_1.Types.ObjectId(userId) }).sort({
        occurredAt: -1,
    }), query)
        .paginate()
        .fields();
    const [data, meta] = yield Promise.all([
        builder.modelQuery,
        builder.getPaginationInfo(),
    ]);
    return { data: data, meta };
});
exports.getSubscriptionEvents = getSubscriptionEvents;
const assertUserExists = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const exists = yield user_model_1.User.exists({ _id: new mongoose_1.Types.ObjectId(userId) });
    if (!exists) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
});
const adminGrantPlan = (userId, plan) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertUserExists(userId);
    const uId = new mongoose_1.Types.ObjectId(userId);
    return subscription_model_1.Subscription.upsertForUser(uId, {
        plan,
        status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE,
        platform: subscription_interface_1.SUBSCRIPTION_PLATFORM.ADMIN,
        productId: null,
        currentPeriodEnd: null, // Admin grants are perpetual unless managed manually
    });
});
exports.adminGrantPlan = adminGrantPlan;
const adminResetPlan = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertUserExists(userId);
    const uId = new mongoose_1.Types.ObjectId(userId);
    return subscription_model_1.Subscription.upsertForUser(uId, {
        plan: subscription_interface_1.SUBSCRIPTION_PLAN.FREE,
        status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE,
        platform: subscription_interface_1.SUBSCRIPTION_PLATFORM.ADMIN,
        productId: null,
        currentPeriodEnd: null,
        canceledAt: new Date(),
    });
});
exports.adminResetPlan = adminResetPlan;
// --- End Admin Service Methods ---
// GET handlers must not mutate state. If no subscription row exists for a
// user, return a synthetic FREE/ACTIVE entitlement instead of writing one.
// The row is materialized lazily on the first paid action (verify*) or
// explicit free-plan opt-in (setFreePlan).
const getMySubscription = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const id = new mongoose_1.Types.ObjectId(userId);
    const doc = yield subscription_model_1.Subscription.findOne({ userId: id }).select('-metadata');
    if (doc)
        return doc;
    return {
        userId: id,
        plan: subscription_interface_1.SUBSCRIPTION_PLAN.FREE,
        status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE,
    };
});
exports.getMySubscription = getMySubscription;
const setFreePlan = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const uId = new mongoose_1.Types.ObjectId(userId);
    const existing = yield subscription_model_1.Subscription.findByUser(uId);
    // C2 Fix: Guard against active store subscriptions.
    // If a user has an active Apple/Google subscription, we cannot unilaterally
    // downgrade them to FREE, as the store remains the source of truth.
    if (existing &&
        existing.platform !== subscription_interface_1.SUBSCRIPTION_PLATFORM.ADMIN &&
        (existing.status === subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE ||
            existing.status === subscription_interface_1.SUBSCRIPTION_STATUS.TRIALING ||
            existing.status === subscription_interface_1.SUBSCRIPTION_STATUS.PAST_DUE) &&
        existing.currentPeriodEnd &&
        existing.currentPeriodEnd > new Date()) {
        throw new ApiError_1.default(http_status_1.default.CONFLICT, 'You have an active store subscription. Please cancel it through the App Store or Play Store first.');
    }
    return subscription_model_1.Subscription.upsertForUser(uId, {
        plan: subscription_interface_1.SUBSCRIPTION_PLAN.FREE,
        status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE,
        platform: subscription_interface_1.SUBSCRIPTION_PLATFORM.ADMIN, // Mark as admin-reset
    });
});
exports.setFreePlan = setFreePlan;
const verifyApplePurchase = (userId, signedTransactionInfo) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Cryptographically verify the JWS with Apple's library.
    const decoded = yield (0, apple_verify_1.verifyAppleTransaction)(signedTransactionInfo);
    // C3 Fix: Reject if this transaction has been superseded by an upgrade.
    if (decoded.isUpgraded) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'This transaction has been superseded by an upgrade. Please verify the latest transaction.');
    }
    // Receipt-theft defense: when the client sets appAccountToken at purchase
    // time, it must equal uuidv5(userId, IAP_NAMESPACE). A mismatch means the
    // signed receipt belongs to a different account. Missing token is logged
    // but not rejected so mobile can roll out the binding gradually.
    if (decoded.appAccountToken) {
        const expected = (0, iap_account_1.deriveIapAccountToken)(userId);
        if (decoded.appAccountToken.toLowerCase() !== expected.toLowerCase()) {
            throw new ApiError_1.default(http_status_1.default.CONFLICT, 'Apple appAccountToken does not match the authenticated user');
        }
    }
    else {
        logger_1.logger.warn(`Apple verify: missing appAccountToken for user ${userId} (txn ${decoded.originalTransactionId})`);
    }
    // 2. Fraud guard: reject if this transaction is already bound to a
    //    different user account.
    const existingByTx = yield subscription_model_1.Subscription.findOne({
        appleOriginalTransactionId: decoded.originalTransactionId,
    });
    if (existingByTx && existingByTx.userId.toString() !== userId) {
        throw new ApiError_1.default(http_status_1.default.CONFLICT, 'This Apple transaction is already linked to another account');
    }
    // 3. Map the store-side productId to a local plan.
    const plan = (0, plan_mapper_1.mapAppleProductToPlan)(decoded.productId);
    if (plan === subscription_interface_1.SUBSCRIPTION_PLAN.FREE) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Unknown or unsupported productId: ${decoded.productId}`);
    }
    // 4. Persist the subscription for this user.
    const updated = yield subscription_model_1.Subscription.upsertForUser(new mongoose_1.Types.ObjectId(userId), {
        plan,
        status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE,
        platform: subscription_interface_1.SUBSCRIPTION_PLATFORM.APPLE,
        environment: decoded.environment,
        productId: decoded.productId,
        appleOriginalTransactionId: decoded.originalTransactionId,
        appleLatestTransactionId: decoded.transactionId,
        startedAt: new Date(decoded.purchaseDate),
        currentPeriodEnd: decoded.expiresDate
            ? new Date(decoded.expiresDate)
            : null,
        canceledAt: null,
        gracePeriodEndsAt: null,
        metadata: {
            appAccountToken: decoded.appAccountToken,
            bundleId: decoded.bundleId,
        },
    });
    // 5. Re-process any orphan webhooks that arrived before this verify call.
    // We don't await this so the user gets their response immediately.
    reprocessPendingWebhooks(decoded.originalTransactionId, 'apple').catch(err => {
        console.error('Failed to re-process pending Apple webhooks:', err);
    });
    return updated;
});
exports.verifyApplePurchase = verifyApplePurchase;
const processAppleWebhook = (signedPayload) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, apple_webhook_1.handleAppleNotification)(signedPayload);
});
exports.processAppleWebhook = processAppleWebhook;
const verifyGooglePurchase = (userId, purchaseToken, productId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Pull the authoritative subscription state from Google.
    const decoded = yield (0, google_verify_1.verifyGoogleSubscription)(purchaseToken, productId);
    // Receipt-theft defense: client-set obfuscatedAccountId must match
    // uuidv5(userId, IAP_NAMESPACE). Missing is logged; mismatch is hard-rejected.
    if (decoded.obfuscatedExternalAccountId) {
        const expected = (0, iap_account_1.deriveIapAccountToken)(userId);
        if (decoded.obfuscatedExternalAccountId !== expected) {
            throw new ApiError_1.default(http_status_1.default.CONFLICT, 'Google obfuscatedAccountId does not match the authenticated user');
        }
    }
    else {
        logger_1.logger.warn(`Google verify: missing obfuscatedAccountId for user ${userId} (token ${purchaseToken.slice(0, 12)}...)`);
    }
    // 2. Fraud guard: a purchase token must not be linked to a different user.
    // C1 Fix: Handle linkedPurchaseToken (upgrades/downgrades).
    // If the user upgraded, the new token is in purchaseToken, and the old token
    // is in linkedPurchaseToken. We should check both to find the existing row.
    const existingByToken = yield subscription_model_1.Subscription.findOne({
        $or: [
            { googlePurchaseToken: decoded.purchaseToken },
            ...(decoded.linkedPurchaseToken
                ? [{ googlePurchaseToken: decoded.linkedPurchaseToken }]
                : []),
        ],
    });
    if (existingByToken && existingByToken.userId.toString() !== userId) {
        throw new ApiError_1.default(http_status_1.default.CONFLICT, 'This Google purchase is already linked to another account');
    }
    // 3. Map productId → local plan.
    const plan = (0, plan_mapper_1.mapGoogleProductToPlan)(decoded.productId);
    if (plan === subscription_interface_1.SUBSCRIPTION_PLAN.FREE) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Unknown or unsupported productId: ${decoded.productId}`);
    }
    // 4. Translate Google's subscriptionState into our local status.
    const isActiveState = decoded.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' ||
        decoded.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD';
    if (!isActiveState) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Google subscription is not active (state: ${decoded.subscriptionState})`);
    }
    const localStatus = decoded.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
        ? subscription_interface_1.SUBSCRIPTION_STATUS.PAST_DUE
        : subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE;
    // 5. Persist for this user.
    const updated = yield subscription_model_1.Subscription.upsertForUser(new mongoose_1.Types.ObjectId(userId), {
        plan,
        status: localStatus,
        platform: subscription_interface_1.SUBSCRIPTION_PLATFORM.GOOGLE,
        environment: decoded.environment,
        productId: decoded.productId,
        autoRenewing: decoded.autoRenewing,
        googlePurchaseToken: decoded.purchaseToken,
        googleOrderId: decoded.orderId,
        startedAt: decoded.startTime ? new Date(decoded.startTime) : null,
        currentPeriodEnd: decoded.expiryTime
            ? new Date(decoded.expiryTime)
            : null,
        canceledAt: null,
        gracePeriodEndsAt: localStatus === subscription_interface_1.SUBSCRIPTION_STATUS.PAST_DUE && decoded.expiryTime
            ? new Date(decoded.expiryTime)
            : null,
        metadata: {
            acknowledgementState: decoded.acknowledgementState,
            linkedPurchaseToken: decoded.linkedPurchaseToken,
            testPurchase: decoded.testPurchase,
        },
    });
    // 6. Re-process any orphan webhooks.
    reprocessPendingWebhooks(decoded.purchaseToken, 'google').catch(err => {
        console.error('Failed to re-process pending Google webhooks:', err);
    });
    return updated;
});
exports.verifyGooglePurchase = verifyGooglePurchase;
const processGoogleWebhook = (rawBody, authorizationHeader) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, google_webhook_1.handleGoogleNotification)(rawBody, authorizationHeader);
});
exports.processGoogleWebhook = processGoogleWebhook;
const reprocessPendingWebhooks = (externalPurchaseId, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const pending = yield pending_webhook_model_1.PendingWebhook.find({
        externalPurchaseId,
        provider,
    }).sort({ receivedAt: 1 });
    if (pending.length === 0)
        return;
    for (const item of pending) {
        try {
            if (provider === 'apple') {
                yield (0, apple_webhook_1.handleAppleNotification)(item.payload);
            }
            else {
                yield (0, google_webhook_1.handleGoogleNotification)(item.payload, undefined, true);
            }
            // Delete after successful processing
            yield pending_webhook_model_1.PendingWebhook.findByIdAndDelete(item._id);
        }
        catch (err) {
            console.error(`Failed to re-process pending ${provider} webhook ${item._id}:`, err);
        }
    }
});
const SubscriptionService = {
    getMySubscription: exports.getMySubscription,
    setFreePlan: exports.setFreePlan,
    verifyApplePurchase: exports.verifyApplePurchase,
    processAppleWebhook: exports.processAppleWebhook,
    verifyGooglePurchase: exports.verifyGooglePurchase,
    processGoogleWebhook: exports.processGoogleWebhook,
    getAllSubscriptions: exports.getAllSubscriptions,
    getSubscriptionAnalytics: exports.getSubscriptionAnalytics,
    getPendingWebhooks: exports.getPendingWebhooks,
    getSubscriptionById: exports.getSubscriptionById,
    getSubscriptionEvents: exports.getSubscriptionEvents,
    adminGrantPlan: exports.adminGrantPlan,
    adminResetPlan: exports.adminResetPlan,
};
exports.default = SubscriptionService;
