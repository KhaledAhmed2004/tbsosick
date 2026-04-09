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
exports.AdminService = void 0;
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
    const formatMetric = (stat) => ({
        value: stat.total,
        changePct: stat.growth,
        direction: stat.growthType === 'increase' ? 'up' : stat.growthType === 'decrease' ? 'down' : 'neutral',
    });
    return {
        meta: {
            comparisonPeriod: 'month',
        },
        doctors: formatMetric(doctors),
        preferenceCards: formatMetric(preferenceCards),
        verifiedPreferenceCards: formatMetric(verifiedPreferenceCards),
        activeSubscriptions: formatMetric(activeSubscriptions),
    };
});
// Monthly trend for total preference cards (each month’s count)
const getPreferenceCardMonthlyTrend = () => __awaiter(void 0, void 0, void 0, function* () {
    const cardBuilder = new AggregationBuilder_1.default(preference_card_model_1.PreferenceCardModel);
    const series = yield cardBuilder.getTimeTrends({ timeUnit: 'month' });
    return series.map((s) => ({
        label: s.label,
        count: s.transactionCount,
    }));
});
// Monthly trend for active subscriptions (complex analytics shape)
const getActiveSubscriptionMonthlyTrend = () => __awaiter(void 0, void 0, void 0, function* () {
    const subBuilder = new AggregationBuilder_1.default(subscription_model_1.Subscription);
    const now = new Date();
    const currentYear = now.getFullYear();
    // Get current year trends
    const series = yield subBuilder.getTimeTrends({
        timeUnit: 'month',
        filter: { status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE },
    });
    // Get last year trends for comparison (YoY)
    subBuilder.reset();
    const lastYearSeries = yield subBuilder.getTimeTrends({
        timeUnit: 'month',
        filter: {
            status: subscription_interface_1.SUBSCRIPTION_STATUS.ACTIVE,
            createdAt: {
                $gte: new Date(currentYear - 1, 0, 1),
                $lte: new Date(currentYear - 1, 11, 31),
            },
        },
    });
    const formattedSeries = series.map((s, index) => {
        var _a;
        const lastYearCount = ((_a = lastYearSeries[index]) === null || _a === void 0 ? void 0 : _a.transactionCount) || 0;
        const currentCount = s.transactionCount;
        let yoy_growth_pct = 0;
        if (lastYearCount > 0) {
            yoy_growth_pct = ((currentCount - lastYearCount) / lastYearCount) * 100;
        }
        else if (currentCount > 0) {
            yoy_growth_pct = 100;
        }
        return {
            period: `${currentYear}-${String(index + 1).padStart(2, '0')}`,
            label: s.label,
            count: currentCount,
            last_year_count: lastYearCount,
            yoy_growth_pct: Number(yoy_growth_pct.toFixed(1)),
            is_peak: false, // Will calculate below
            is_slowest: false, // Will calculate below
        };
    });
    // Calculate Peak and Slowest
    const validCounts = formattedSeries.filter((s) => s.count > 0);
    if (validCounts.length > 0) {
        const maxCount = Math.max(...formattedSeries.map((s) => s.count));
        const minCount = Math.min(...formattedSeries.map((s) => s.count));
        formattedSeries.forEach((s) => {
            if (s.count === maxCount && maxCount > 0)
                s.is_peak = true;
            if (s.count === minCount && minCount > 0)
                s.is_slowest = true;
        });
    }
    const totalCount = formattedSeries.reduce((acc, s) => acc + s.count, 0);
    const totalLastYearCount = formattedSeries.reduce((acc, s) => acc + s.last_year_count, 0);
    const peakMonth = formattedSeries.find((s) => s.is_peak);
    const slowestMonth = formattedSeries.find((s) => s.is_slowest);
    let total_yoy_growth = 0;
    if (totalLastYearCount > 0) {
        total_yoy_growth = ((totalCount - totalLastYearCount) / totalLastYearCount) * 100;
    }
    return {
        meta: {
            year: currentYear,
            granularity: 'monthly',
            compare_year: currentYear - 1,
            timezone: 'UTC',
        },
        summary: {
            total_count: totalCount,
            period_avg: Math.round(totalCount / 12),
            yoy_growth_pct: Number(total_yoy_growth.toFixed(1)),
            peak: peakMonth ? { period: peakMonth.period, label: peakMonth.label, count: peakMonth.count } : null,
            slowest: slowestMonth ? { period: slowestMonth.period, label: slowestMonth.label, count: slowestMonth.count } : null,
        },
        series: formattedSeries,
    };
});
exports.AdminService = {
    getAdminDashboardStats,
    getPreferenceCardMonthlyTrend,
    getActiveSubscriptionMonthlyTrend,
};
