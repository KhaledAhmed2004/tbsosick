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
exports.setFreePlan = exports.verifyIapSubscription = exports.getMySubscription = void 0;
const mongoose_1 = require("mongoose");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const subscription_model_1 = require("./subscription.model");
const subscription_interface_1 = require("./subscription.interface");
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
    const sub = yield ensureSubscriptionDoc(userId);
    return sub;
});
exports.getMySubscription = getMySubscription;
const mapIapProductToPlan = (productId) => {
    const normalized = productId.toLowerCase();
    if (normalized.includes('enterprise')) {
        return subscription_interface_1.SUBSCRIPTION_PLAN.ENTERPRISE;
    }
    if (normalized.includes('premium')) {
        return subscription_interface_1.SUBSCRIPTION_PLAN.PREMIUM;
    }
    return subscription_interface_1.SUBSCRIPTION_PLAN.FREE;
};
const verifyIapSubscription = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { platform, productId, receipt } = payload;
    if (platform !== 'android' && platform !== 'ios') {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid platform');
    }
    if (!receipt) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Receipt is required');
    }
    if (!productId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Product ID is required');
    }
    const existing = yield ensureSubscriptionDoc(userId);
    const plan = mapIapProductToPlan(productId);
    const metadata = Object.assign(Object.assign({}, (existing.metadata || {})), { iapPlatform: platform, iapProductId: productId });
    const updated = yield subscription_model_1.Subscription.upsertForUser(new mongoose_1.Types.ObjectId(userId), {
        plan,
        status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE,
        metadata,
    });
    return updated;
});
exports.verifyIapSubscription = verifyIapSubscription;
const setFreePlan = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return subscription_model_1.Subscription.upsertForUser(new mongoose_1.Types.ObjectId(userId), {
        plan: subscription_interface_1.SUBSCRIPTION_PLAN.FREE,
        status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE,
        stripeSubscriptionId: undefined,
    });
});
exports.setFreePlan = setFreePlan;
const SubscriptionService = {
    getMySubscription: exports.getMySubscription,
    setFreePlan: exports.setFreePlan,
    verifyIapSubscription: exports.verifyIapSubscription,
};
exports.default = SubscriptionService;
