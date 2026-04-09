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
exports.chooseFreePlanController = exports.appleWebhookController = exports.verifyApplePurchaseController = exports.getMySubscriptionController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const subscription_service_1 = __importDefault(require("./subscription.service"));
exports.getMySubscriptionController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = yield subscription_service_1.default.getMySubscription(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Subscription retrieved successfully',
        data: result,
    });
}));
exports.verifyApplePurchaseController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { signedTransactionInfo } = req.body;
    const result = yield subscription_service_1.default.verifyApplePurchase(id, signedTransactionInfo);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Apple subscription verified successfully',
        data: result,
    });
}));
// Apple Server Notifications V2 webhook. No auth because signature
// verification inside the service replaces caller trust.
exports.appleWebhookController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The /apple/webhook route uses express.raw() so req.body is a Buffer
    // — parse it manually without mutating the raw bytes.
    let body;
    if (Buffer.isBuffer(req.body)) {
        try {
            body = JSON.parse(req.body.toString('utf8'));
        }
        catch (_a) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid webhook body JSON');
        }
    }
    else {
        body = req.body;
    }
    const signedPayload = body === null || body === void 0 ? void 0 : body.signedPayload;
    if (!signedPayload) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'signedPayload missing from webhook body');
    }
    const result = yield subscription_service_1.default.processAppleWebhook(signedPayload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Apple webhook processed',
        data: result,
    });
}));
exports.chooseFreePlanController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = yield subscription_service_1.default.setFreePlan(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Switched to Free plan successfully',
        data: result,
    });
}));
const SubscriptionController = {
    getMySubscriptionController: exports.getMySubscriptionController,
    verifyApplePurchaseController: exports.verifyApplePurchaseController,
    appleWebhookController: exports.appleWebhookController,
    chooseFreePlanController: exports.chooseFreePlanController,
};
exports.default = SubscriptionController;
