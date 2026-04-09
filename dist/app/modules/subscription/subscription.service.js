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
exports.processAppleWebhook = exports.verifyApplePurchase = exports.setFreePlan = exports.getMySubscription = void 0;
const mongoose_1 = require("mongoose");
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const subscription_model_1 = require("./subscription.model");
const subscription_interface_1 = require("./subscription.interface");
const apple_verify_1 = require("./providers/apple/apple.verify");
const apple_webhook_1 = require("./providers/apple/apple.webhook");
const plan_mapper_1 = require("./helpers/plan.mapper");
const ensureSubscriptionDoc = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const id = new mongoose_1.Types.ObjectId(userId);
    const doc = yield subscription_model_1.Subscription.findByUser(id);
    if (doc)
        return doc;
    return yield subscription_model_1.Subscription.upsertForUser(id, {
        plan: subscription_interface_1.SUBSCRIPTION_PLAN.FREE,
        status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE,
    });
});
const getMySubscription = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return ensureSubscriptionDoc(userId);
});
exports.getMySubscription = getMySubscription;
const setFreePlan = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return subscription_model_1.Subscription.upsertForUser(new mongoose_1.Types.ObjectId(userId), {
        plan: subscription_interface_1.SUBSCRIPTION_PLAN.FREE,
        status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE,
    });
});
exports.setFreePlan = setFreePlan;
const verifyApplePurchase = (userId, signedTransactionInfo) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Cryptographically verify the JWS with Apple's library.
    const decoded = yield (0, apple_verify_1.verifyAppleTransaction)(signedTransactionInfo);
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
    return updated;
});
exports.verifyApplePurchase = verifyApplePurchase;
const processAppleWebhook = (signedPayload) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, apple_webhook_1.handleAppleNotification)(signedPayload);
});
exports.processAppleWebhook = processAppleWebhook;
const SubscriptionService = {
    getMySubscription: exports.getMySubscription,
    setFreePlan: exports.setFreePlan,
    verifyApplePurchase: exports.verifyApplePurchase,
    processAppleWebhook: exports.processAppleWebhook,
};
exports.default = SubscriptionService;
