"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKnownProductIds = exports.isKnownProductId = exports.mapGoogleProductToPlan = exports.mapAppleProductToPlan = void 0;
const subscription_interface_1 = require("../subscription.interface");
// Explicit product-ID → plan mapping.
//
// This is deliberately NOT a fuzzy string match. Every store-configured
// product ID should appear here exactly. Unknown IDs resolve to FREE so
// verification code can detect and reject them cleanly.
//
// When adding a new subscription product in App Store Connect or Google
// Play Console, add the exact product identifier here.
const PRODUCT_ID_TO_PLAN = {
    // Apple & Google share the same product identifiers by convention.
    // Parent Subscription ID (Google)
    smrtscrub_subscription: subscription_interface_1.SUBSCRIPTION_PLAN.PREMIUM,
    // Plan IDs (Base Plan IDs / Product IDs)
    'premium-monthly': subscription_interface_1.SUBSCRIPTION_PLAN.PREMIUM,
    'premium-yearly': subscription_interface_1.SUBSCRIPTION_PLAN.PREMIUM,
    'enterprise-monthly': subscription_interface_1.SUBSCRIPTION_PLAN.ENTERPRISE,
    'enterprise-yearly': subscription_interface_1.SUBSCRIPTION_PLAN.ENTERPRISE,
    // Legacy/Alternative Underscore IDs
    premium_monthly: subscription_interface_1.SUBSCRIPTION_PLAN.PREMIUM,
    premium_yearly: subscription_interface_1.SUBSCRIPTION_PLAN.PREMIUM,
    enterprise_monthly: subscription_interface_1.SUBSCRIPTION_PLAN.ENTERPRISE,
    enterprise_yearly: subscription_interface_1.SUBSCRIPTION_PLAN.ENTERPRISE,
    // Full Bundle IDs (Used by some mobile configurations)
    'com.tbsosick.premium_monthly': subscription_interface_1.SUBSCRIPTION_PLAN.PREMIUM,
    'com.tbsosick.premium_yearly': subscription_interface_1.SUBSCRIPTION_PLAN.PREMIUM,
    'com.tbsosick.enterprise_monthly': subscription_interface_1.SUBSCRIPTION_PLAN.ENTERPRISE,
    'com.tbsosick.enterprise_yearly': subscription_interface_1.SUBSCRIPTION_PLAN.ENTERPRISE,
};
const mapAppleProductToPlan = (productId) => {
    var _a;
    return (_a = PRODUCT_ID_TO_PLAN[productId]) !== null && _a !== void 0 ? _a : subscription_interface_1.SUBSCRIPTION_PLAN.FREE;
};
exports.mapAppleProductToPlan = mapAppleProductToPlan;
const mapGoogleProductToPlan = (productId) => {
    var _a;
    return (_a = PRODUCT_ID_TO_PLAN[productId]) !== null && _a !== void 0 ? _a : subscription_interface_1.SUBSCRIPTION_PLAN.FREE;
};
exports.mapGoogleProductToPlan = mapGoogleProductToPlan;
const isKnownProductId = (productId) => {
    return productId in PRODUCT_ID_TO_PLAN;
};
exports.isKnownProductId = isKnownProductId;
const getKnownProductIds = () => {
    return Object.keys(PRODUCT_ID_TO_PLAN);
};
exports.getKnownProductIds = getKnownProductIds;
