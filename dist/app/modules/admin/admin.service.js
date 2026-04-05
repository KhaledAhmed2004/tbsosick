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
exports.getActiveSubscriptionMonthlyTrend = exports.getPreferenceCardMonthlyTrend = exports.getAdminDashboardStats = void 0;
const AggregationBuilder_1 = __importDefault(require("../../builder/AggregationBuilder"));
const user_model_1 = require("../user/user.model");
const preference_card_model_1 = require("../preference-card/preference-card.model");
const subscription_model_1 = require("../subscription/subscription.model");
const subscription_interface_1 = require("../subscription/subscription.interface");
const getAdminDashboardStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const doctorBuilder = new AggregationBuilder_1.default(user_model_1.User);
    const doctors = yield doctorBuilder.calculateGrowth({
        period: 'month',
    });
    // Total preference cards
    const cardBuilder = new AggregationBuilder_1.default(preference_card_model_1.PreferenceCardModel);
    const preferenceCards = yield cardBuilder.calculateGrowth({
        period: 'month',
    });
    // Verified (published) preference cards
    const verifiedPreferenceCards = yield cardBuilder.calculateGrowth({
        filter: { published: true },
        period: 'month',
    });
    // Active subscriptions
    const subBuilder = new AggregationBuilder_1.default(subscription_model_1.Subscription);
    const activeSubscriptions = yield subBuilder.calculateGrowth({
        filter: { status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE },
        period: 'month',
    });
    return {
        summary: {
            doctors,
            preferenceCards,
            verifiedPreferenceCards,
            activeSubscriptions,
        },
    };
});
exports.getAdminDashboardStats = getAdminDashboardStats;
// Monthly trend for total preference cards (each month’s count)
const getPreferenceCardMonthlyTrend = () => __awaiter(void 0, void 0, void 0, function* () {
    const cardBuilder = new AggregationBuilder_1.default(preference_card_model_1.PreferenceCardModel);
    const series = yield cardBuilder.getTimeTrends({ timeUnit: 'month' });
    return series.map((s) => ({
        label: s.label,
        count: s.transactionCount,
    }));
});
exports.getPreferenceCardMonthlyTrend = getPreferenceCardMonthlyTrend;
// Monthly trend for active subscriptions (each month’s count)
const getActiveSubscriptionMonthlyTrend = () => __awaiter(void 0, void 0, void 0, function* () {
    const subBuilder = new AggregationBuilder_1.default(subscription_model_1.Subscription);
    const series = yield subBuilder.getTimeTrends({
        timeUnit: 'month',
        filter: { status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE },
    });
    return series.map((s) => ({
        label: s.label,
        count: s.transactionCount,
    }));
});
exports.getActiveSubscriptionMonthlyTrend = getActiveSubscriptionMonthlyTrend;
