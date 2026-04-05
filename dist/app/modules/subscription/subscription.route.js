"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_1 = require("../../../enums/user");
const subscription_controller_1 = __importDefault(require("./subscription.controller"));
const subscription_validation_1 = require("./subscription.validation");
const rateLimit_1 = require("../../middlewares/rateLimit");
const router = express_1.default.Router();
// GET /subscription/me
// নিজের সাবস্ক্রিপশন স্ট্যাটাস/প্ল্যান দেখায় (Stripe থাকলে লাইভ সিঙ্ক)
router.get('/me', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), subscription_controller_1.default.getMySubscriptionController);
router.post('/iap/verify', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, rateLimit_1.rateLimitMiddleware)({ windowMs: 60000, max: 30, routeName: 'subscription-iap-verify' }), (0, validateRequest_1.default)(subscription_validation_1.SubscriptionValidation.verifyIapSubscriptionSchema), subscription_controller_1.default.verifyIapSubscriptionController);
// POST /subscription/choose/free
// লোকালি Free প্ল্যানে সুইচ করে (Stripe সাবস্ক্রিপশন ছাড়াই)
router.post('/choose/free', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), subscription_controller_1.default.chooseFreePlanController);
exports.SubscriptionRoutes = router;
